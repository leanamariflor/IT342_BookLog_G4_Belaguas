import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import "../css/BookCalendar.css";
import logo1 from "../assets/logo1.png";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import { getUserBooks } from "../services/BookService";
import api from "../api/axios";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

const PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalizeStatus = (status) => (status || "").toString().trim().toLowerCase();
const isCompleted = (status) => {
  const value = normalizeStatus(status);
  return value === "completed" || value === "finished";
};

const parseBookDate = (book) => {
  const candidates = [
    book.dateCompleted,
    book.completedAt,
    book.finishedAt,
    book.updatedAt,
    book.dateUpdated,
    book.dateStarted,
    book.createdAt,
    book.dateAdded,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const parsedDate = new Date(candidate);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
};

const normalizeRating = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(5, parsed));
};

const formatDateRange = (startDateInput, endDateInput) => {
  const endDate = endDateInput instanceof Date ? endDateInput : new Date(endDateInput);
  const startDate = startDateInput ? new Date(startDateInput) : endDate;

  const isValidStart = !Number.isNaN(startDate.getTime());
  const isValidEnd = !Number.isNaN(endDate.getTime());
  if (!isValidEnd) {
    return "Date unavailable";
  }

  const format = (date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (!isValidStart) {
    return format(endDate);
  }

  return `${format(startDate)} ~ ${format(endDate)}`;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to convert blob to data URL"));
    reader.readAsDataURL(blob);
  });

const toExportSafeImage = async (imageUrl) => {
  if (!imageUrl) {
    return PLACEHOLDER_COVER;
  }

  const normalizedUrl = imageUrl.toString();
  if (normalizedUrl.startsWith("data:") || normalizedUrl.startsWith("blob:")) {
    return normalizedUrl;
  }

  try {
    if (normalizedUrl.includes("books.google.com/books/content")) {
      const response = await api.get("/books/proxy-cover", {
        params: { url: normalizedUrl },
        responseType: "blob",
      });
      return await blobToDataUrl(response.data);
    }

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await fetch(normalizedUrl, { headers });
    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status}`);
    }
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.error("Unable to prepare export-safe image", error);
    return PLACEHOLDER_COVER;
  }
};

const waitForImagesInElement = async (element) => {
  const images = Array.from(element.querySelectorAll("img"));
  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      if (typeof image.decode === "function") {
        try {
          await image.decode();
          return;
        } catch (error) {
          // Fall through to load/error listeners below.
        }
      }

      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    })
  );
};

const BookCalendar = ({ onLogout }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const now = new Date();
  const initialYear = Number(searchParams.get("year")) || now.getFullYear();
  const initialMonthIndex = Math.max(0, Math.min(11, (Number(searchParams.get("month")) || now.getMonth() + 1) - 1));
  const [source] = useState(searchParams.get("from") || "dashboard");

  const [books, setBooks] = useState([]);
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonthIndex, setViewMonthIndex] = useState(initialMonthIndex);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isDownloadingCalendar, setIsDownloadingCalendar] = useState(false);
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const calendarCaptureRef = useRef(null);

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoadingCalendar(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const localBooks = JSON.parse(localStorage.getItem("userBooks") || "[]");
          setBooks(localBooks);
          return;
        }

        const backendBooks = await getUserBooks();
        const mappedBooks = await Promise.all(
          backendBooks.map(async (book) => {
            let resolvedImage = toAbsoluteMediaUrl(book.coverImageUrl) || PLACEHOLDER_COVER;
            let exportImage = await toExportSafeImage(resolvedImage);

            if (book.attachmentUrl && book.bookId) {
              try {
                const response = await api.get(`/books/${book.bookId}/attachment`, {
                  responseType: "blob",
                });
                resolvedImage = URL.createObjectURL(response.data);
                exportImage = await blobToDataUrl(response.data);
              } catch (attachmentError) {
                console.error("Unable to load calendar attachment preview", attachmentError);
              }
            }

            return {
              id: book.bookId,
              title: book.title,
              image: resolvedImage,
              exportImage,
              author: book.author || "Unknown author",
              rating: normalizeRating(book.rating),
              status: book.status || "To Read",
              createdAt: book.createdAt,
              updatedAt: book.updatedAt,
              dateStarted: book.dateStarted,
              dateCompleted: book.dateCompleted,
              completedAt: book.completedAt,
              dateAdded: book.createdAt ? new Date(book.createdAt).toISOString().split("T")[0] : null,
              dateUpdated: book.updatedAt ? new Date(book.updatedAt).toISOString().split("T")[0] : null,
            };
          })
        );

        setBooks(mappedBooks);
      } catch (error) {
        console.error("Error loading book calendar", error);
        const localBooks = JSON.parse(localStorage.getItem("userBooks") || "[]");
        const normalizedLocalBooks = await Promise.all(
          localBooks.map(async (book) => {
            const localImage = toAbsoluteMediaUrl(book.image || book.coverImageUrl) || PLACEHOLDER_COVER;
            return {
              ...book,
              image: localImage,
              exportImage: book.exportImage || (await toExportSafeImage(localImage)),
            };
          })
        );
        setBooks(normalizedLocalBooks);
      } finally {
        setIsLoadingCalendar(false);
      }
    };

    loadBooks();
  }, []);

  useEffect(() => {
    setSearchParams({
      year: String(viewYear),
      month: String(viewMonthIndex + 1),
      from: source,
    });
  }, [viewMonthIndex, viewYear, source, setSearchParams]);

  useEffect(() => {
    setSelectedDay(null);
  }, [viewMonthIndex, viewYear]);

  const completedBooks = useMemo(
    () =>
      books
        .filter((book) => isCompleted(book.status))
        .map((book) => {
          const completedDate = parseBookDate(book);
          return {
            ...book,
            completedDate,
          };
        })
        .filter((book) => book.completedDate),
    [books]
  );

  const monthBooks = useMemo(
    () =>
      completedBooks.filter(
        (book) =>
          book.completedDate.getFullYear() === viewYear &&
          book.completedDate.getMonth() === viewMonthIndex
      ),
    [completedBooks, viewYear, viewMonthIndex]
  );

  const booksByDay = useMemo(() => {
    const map = {};
    monthBooks.forEach((book) => {
      const day = book.completedDate.getDate();
      if (!map[day]) {
        map[day] = [];
      }
      map[day].push(book);
    });
    return map;
  }, [monthBooks]);

  const firstOfMonth = new Date(viewYear, viewMonthIndex, 1);
  const daysInMonth = new Date(viewYear, viewMonthIndex + 1, 0).getDate();
  const leadingSlots = firstOfMonth.getDay();
  const totalSlots = Math.ceil((leadingSlots + daysInMonth) / 7) * 7;
  const calendarRows = totalSlots / 7;

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleBack = () => {
    if (source === "annual") {
      navigate(`/reading-goal?year=${viewYear}`);
      return;
    }
    navigate("/dashboard");
  };

  const goPrevMonth = () => {
    if (viewMonthIndex === 0) {
      setViewMonthIndex(11);
      setViewYear((year) => year - 1);
      return;
    }
    setViewMonthIndex((month) => month - 1);
  };

  const goNextMonth = () => {
    if (viewMonthIndex === 11) {
      setViewMonthIndex(0);
      setViewYear((year) => year + 1);
      return;
    }
    setViewMonthIndex((month) => month + 1);
  };

  const handleDownloadCalendar = async () => {
    if (!calendarCaptureRef.current || isDownloadingCalendar) {
      return;
    }

    try {
      setIsDownloadingCalendar(true);
      setSelectedDay(null);
      setIsExportingCalendar(true);

      // Wait for export styles/state to render before capturing.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 40));
      await waitForImagesInElement(calendarCaptureRef.current);

      const canvas = await html2canvas(calendarCaptureRef.current, {
        backgroundColor: "#ffffff",
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
      });

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `book-calendar-${viewYear}-${String(viewMonthIndex + 1).padStart(2, "0")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download calendar image", error);
    } finally {
      setIsExportingCalendar(false);
      setIsDownloadingCalendar(false);
    }
  };

  const selectedDayBooks = selectedDay ? booksByDay[selectedDay] || [] : [];

  if (isLoadingCalendar) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="dashboard" onLogout={onLogout} />
        <main className="main-content calendar-main">
          <PageLoader message="Loading your reading calendar..." />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" onLogout={onLogout} />

      <main className="main-content calendar-main">
        <button
          type="button"
          className="calendar-back-arrow"
          onClick={handleBack}
          aria-label="Go back"
        >
          ←
        </button>

        <div className="calendar-title-row">
          <div>
            <h1>Book Calendar</h1>
          </div>
          <button
            type="button"
            className="calendar-download-btn"
            onClick={handleDownloadCalendar}
            disabled={isDownloadingCalendar}
            aria-label="Download calendar as PNG"
          >
            {isDownloadingCalendar ? "Saving..." : "Download PNG"}
          </button>
        </div>

        <div
          className={`calendar-grid-wrap ${isExportingCalendar ? "is-exporting" : ""}`}
          style={{ "--calendar-rows": calendarRows }}
          ref={calendarCaptureRef}
        >
          <div className="calendar-month-row">
            <div className="calendar-month-meta">
              <h2>{monthLabel}</h2>
             
            </div>
            {isExportingCalendar ? (
              <div className="calendar-export-logo-wrap" aria-hidden="true">
                <img src={logo1} alt="BookLog" />
              </div>
            ) : (
              <div className="calendar-month-nav">
                <button type="button" onClick={goPrevMonth} aria-label="Previous month">
                  &lt;
                </button>
                <button type="button" onClick={goNextMonth} aria-label="Next month">
                  &gt;
                </button>
              </div>
            )}
          </div>

          <div className="calendar-days-header">
            {DAY_HEADERS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: totalSlots }, (_, slotIndex) => {
              const dayNumber = slotIndex - leadingSlots + 1;
              const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
              const dayBooks = inCurrentMonth ? booksByDay[dayNumber] || [] : [];
              return (
                <div
                  key={`cell-${slotIndex}`}
                  className={`calendar-cell ${inCurrentMonth ? "" : "empty"} ${selectedDay === dayNumber ? "selected" : ""}`}
                  onClick={() => {
                    if (inCurrentMonth && dayBooks.length > 0) {
                      setSelectedDay(dayNumber);
                    }
                  }}
                >
                  {inCurrentMonth ? (
                    <span className="calendar-day-number">{dayNumber}</span>
                  ) : null}
                  {dayBooks.length > 0 ? (
                    <div className={`calendar-book-stack ${dayBooks.length >= 2 ? "multi" : "single"}`}>
                      {dayBooks.slice(0, 4).map((book) => (
                        isExportingCalendar ? (
                          <div
                            className="calendar-book-cover calendar-book-cover-static"
                            key={`${book.id}-${dayNumber}`}
                            title={book.title}
                          >
                            <img
                              src={
                                (book.exportImage ||
                                  (book.image && book.image.includes('books.google.com/books/content')
                                    ? `http://localhost:8080/api/proxy-image?url=${encodeURIComponent(book.image)}`
                                    : book.image)) ||
                                PLACEHOLDER_COVER
                              }
                              alt={book.title}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="calendar-book-cover"
                            key={`${book.id}-${dayNumber}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/books/${book.id}`);
                            }}
                            title={book.title}
                          >
                            <img
                              src={
                                book.image && book.image.includes('books.google.com/books/content')
                                  ? `http://localhost:8080/api/proxy-image?url=${encodeURIComponent(book.image)}`
                                  : book.image || PLACEHOLDER_COVER
                              }
                              alt={book.title}
                            />
                          </button>
                        )
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && selectedDayBooks.length > 0 ? (
          <div className="calendar-day-sheet-overlay" onClick={() => setSelectedDay(null)}>
            <div
              className="calendar-day-sheet"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Books for selected day"
            >
              <h3>Select a book.</h3>
              <div className="calendar-day-sheet-list">
                {selectedDayBooks.map((book) => (
                  <button
                    key={`sheet-${book.id}`}
                    type="button"
                    className="calendar-day-sheet-item"
                    onClick={() => {
                      setSelectedDay(null);
                      navigate(`/books/${book.id}`);
                    }}
                  >
                    <img
                      src={
                        book.image && book.image.includes('books.google.com/books/content')
                          ? `http://localhost:8080/api/proxy-image?url=${encodeURIComponent(book.image)}`
                          : book.image || PLACEHOLDER_COVER
                      }
                      alt={book.title}
                    />
                    <div className="calendar-day-sheet-content">
                      <h4>{book.title}</h4>
                      <div className="calendar-day-rating" aria-label={`Rating: ${book.rating} out of 5`}>
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <span key={starIndex} className={starIndex < Math.round(book.rating) ? "filled" : ""}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p>{formatDateRange(book.dateAdded || book.createdAt, book.completedDate)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default BookCalendar;
