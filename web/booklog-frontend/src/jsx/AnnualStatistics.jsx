import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AnnualStatistics.css";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import { getUserBooks } from "../services/BookService";
import api from "../api/axios";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

const PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GOAL_STORAGE_KEY = "readingGoalByYear";

const normalizeStatus = (status) => (status || "").toString().trim().toLowerCase();
const isCompleted = (status) => {
  const value = normalizeStatus(status);
  return value === "completed" || value === "finished";
};

const parseBookDate = (book) => {
  const candidates = [
    book.completedAt,
    book.finishedAt,
    book.updatedAt,
    book.dateUpdated,
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

const normalizeRating = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(5, parsed));
};

const AnnualStatistics = ({ onLogout }) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [books, setBooks] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [goalByYear, setGoalByYear] = useState({ [currentYear]: 24 });
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(24);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setGoalByYear((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error("Unable to parse saved reading goals", error);
    }
  }, []);

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoadingStats(true);
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

            if (book.attachmentUrl && book.bookId) {
              try {
                const response = await api.get(`/books/${book.bookId}/attachment`, {
                  responseType: "blob",
                });
                resolvedImage = URL.createObjectURL(response.data);
              } catch (attachmentError) {
                console.error("Unable to load annual stats attachment preview", attachmentError);
              }
            }

            return {
              id: book.bookId,
              bookId: book.bookId,
              title: book.title,
              author: book.author,
              rating: normalizeRating(book.rating),
              image: resolvedImage,
              status: book.status || "To Read",
              createdAt: book.createdAt,
              updatedAt: book.updatedAt,
              completedAt: book.completedAt,
              dateAdded: book.createdAt ? new Date(book.createdAt).toISOString().split("T")[0] : null,
              dateUpdated: book.updatedAt ? new Date(book.updatedAt).toISOString().split("T")[0] : null,
            };
          })
        );

        setBooks(mappedBooks);
      } catch (error) {
        console.error("Error loading annual statistics books", error);
        const localBooks = JSON.parse(localStorage.getItem("userBooks") || "[]");
        setBooks(localBooks);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadBooks();
  }, []);

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

  const availableYears = useMemo(() => {
    const years = completedBooks.map((book) => book.completedDate.getFullYear());
    years.push(currentYear);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [completedBooks, currentYear]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || currentYear);
    }
  }, [availableYears, selectedYear, currentYear]);

  useEffect(() => {
    setSelectedMonthIndex(null);
  }, [selectedYear]);

  const booksReadThisYear = useMemo(
    () =>
      completedBooks
        .filter((book) => book.completedDate.getFullYear() === selectedYear)
        .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime()),
    [completedBooks, selectedYear]
  );

  const monthlyCounts = useMemo(() => {
    const counts = new Array(12).fill(0);
    booksReadThisYear.forEach((book) => {
      counts[book.completedDate.getMonth()] += 1;
    });
    return counts;
  }, [booksReadThisYear]);

  const maxMonthlyCount = Math.max(1, ...monthlyCounts);
  const chartScaleMax = Math.max(6, maxMonthlyCount);
  const booksReadCount = booksReadThisYear.length;
  const currentGoal = Number(goalByYear[selectedYear]) > 0 ? Number(goalByYear[selectedYear]) : 24;
  const progressPercent = Math.min(100, Math.round((booksReadCount / currentGoal) * 100));
  const averagePerMonth = (booksReadCount / 12).toFixed(1);
  const mostReadMonth = useMemo(() => {
    const peakCount = Math.max(...monthlyCounts);
    if (peakCount <= 0) {
      return { label: "None", count: 0 };
    }

    const firstPeakIndex = monthlyCounts.findIndex((count) => count === peakCount);
    return {
      label: MONTH_LABELS[firstPeakIndex],
      count: peakCount,
    };
  }, [monthlyCounts]);
  const activeMonthIndex = selectedMonthIndex === null
    ? monthlyCounts.findIndex((count) => count > 0)
    : selectedMonthIndex;
  const safeActiveMonthIndex = activeMonthIndex < 0 ? 0 : activeMonthIndex;
  const booksReadInActiveMonth = useMemo(
    () =>
      booksReadThisYear
        .filter((book) => book.completedDate.getMonth() === safeActiveMonthIndex)
        .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime()),
    [booksReadThisYear, safeActiveMonthIndex]
  );
  const activeMonthLabel = MONTH_LABELS[safeActiveMonthIndex].toUpperCase();
  const activeMonthCount = monthlyCounts[safeActiveMonthIndex] || 0;

  const openGoalDialog = () => {
    setGoalDraft(currentGoal);
    setIsGoalDialogOpen(true);
  };

  const saveGoal = () => {
    const sanitizedGoal = Math.max(1, Number(goalDraft) || 24);
    const updatedGoals = {
      ...goalByYear,
      [selectedYear]: sanitizedGoal,
    };

    setGoalByYear(updatedGoals);
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(updatedGoals));
    setIsGoalDialogOpen(false);
  };

  if (isLoadingStats) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="dashboard" onLogout={onLogout} />
        <main className="main-content annual-stats-main">
          <PageLoader message="Loading annual statistics..." />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" onLogout={onLogout} />

      <main className="main-content annual-stats-main">
        <div className="annual-stats-header">
          <button
            type="button"
            className="annual-stats-back-arrow"
            onClick={() => navigate("/dashboard")}
            aria-label="Go back"
          >
            ←
          </button>
          <div>
            <h1>Annual Statistics</h1>
            <p>See how many books you read in {selectedYear}.</p>
          </div>
        </div>

        <div className="annual-stats-controls">
          <label htmlFor="yearSelect">Year</label>
          <select
            id="yearSelect"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="annual-stats-chart-card">
          <div className="annual-stats-chart">
            {monthlyCounts.map((count, index) => {
              const heightPercent = (count / chartScaleMax) * 100;
              const isSelectedMonth = index === selectedMonthIndex;
              return (
                <div key={MONTH_LABELS[index]} className="month-bar-item">
                  <button
                    type="button"
                    className="month-bar-area-button"
                    onClick={() => setSelectedMonthIndex(index)}
                    aria-label={`${MONTH_LABELS[index]}: ${count} book${count === 1 ? "" : "s"}`}
                  >
                    <div className="month-bar-area">
                      {count > 0 ? (
                        <div
                          className={`month-bar-fill ${isSelectedMonth ? "selected" : ""}`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {isSelectedMonth ? (
                            <span className="month-bar-side-count">
                              {count} book{count === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </button>
                  <span>{MONTH_LABELS[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="annual-goal-summary">
          <div className="goal-ring">
            <svg viewBox="0 0 36 36" className="ring-chart">
              <path
                className="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="ring-progress"
                strokeDasharray={`${progressPercent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="ring-text">
                {progressPercent}%
              </text>
            </svg>
          </div>

          <div className="goal-summary-text">
            <h3>Goal: {currentGoal} books</h3>
            <p>
              You read {booksReadCount} book{booksReadCount === 1 ? "" : "s"} in {selectedYear}.
            </p>
            <button className="goal-edit-button" type="button" onClick={openGoalDialog}>
              Edit Goal
            </button>
          </div>
        </div>

        <div className="annual-mini-stats">
          <div className="mini-card">
            <p>In a year</p>
            <h3>
              {booksReadCount} book{booksReadCount === 1 ? "" : "s"}
            </h3>
          </div>
          <div className="mini-card">
            <p>Average</p>
            <h3>{averagePerMonth} books</h3>
          </div>
          <div className="mini-card">
            <p>Most Read Month</p>
            <h3>
              {mostReadMonth.label}
              {mostReadMonth.count > 0 ? ` (${mostReadMonth.count} book${mostReadMonth.count === 1 ? "" : "s"})` : ""}
            </h3>
          </div>
        </div>

        <div className="annual-books-list-card">
          <div className="annual-books-month-header">
            <div className="annual-books-month-title-wrap">
              <h3>{activeMonthLabel}</h3>
              <span>
                {activeMonthCount} book{activeMonthCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="annual-books-month-line" />
            <button
              type="button"
              className="annual-books-calendar-link"
              onClick={() => navigate(`/calendar?year=${selectedYear}&month=${safeActiveMonthIndex + 1}&from=annual`)}
            >
              Calendar
            </button>
          </div>

          {booksReadInActiveMonth.length === 0 ? (
            <p className="annual-empty-text">
              No completed books found for {MONTH_LABELS[safeActiveMonthIndex]} {selectedYear} yet.
            </p>
          ) : (
            <div className="annual-books-list">
              {booksReadInActiveMonth.map((book) => (
                <button
                  key={book.id || `${book.title}-${book.completedDate.toISOString()}`}
                  className="annual-book-item"
                  onClick={() => navigate(`/books/${book.id}`)}
                  type="button"
                >
                  <img src={book.image || PLACEHOLDER_COVER} alt={book.title} />
                  <div>
                    <h4>{book.title}</h4>
                    <div className="annual-book-rating" aria-label={`Rating: ${normalizeRating(book.rating)} out of 5`}>
                      {Array.from({ length: 5 }, (_, starIndex) => (
                        <span key={starIndex} className={starIndex < Math.round(normalizeRating(book.rating)) ? "filled" : ""}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p>{book.author || "Unknown author"}</p>
                    <small>
                      {formatDateRange(book.dateAdded || book.createdAt, book.completedDate)}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {isGoalDialogOpen && (
        <div className="goal-dialog-overlay" role="dialog" aria-modal="true" aria-label="Set yearly reading goal">
          <div className="goal-dialog">
            <h3>Books</h3>
            <p>How many books are you aiming to read in {selectedYear}?</p>
            <input
              type="number"
              min="1"
              value={goalDraft}
              onChange={(event) => setGoalDraft(event.target.value)}
            />
            <div className="goal-dialog-actions">
              <button type="button" className="goal-cancel" onClick={() => setIsGoalDialogOpen(false)}>
                Cancel
              </button>
              <button type="button" className="goal-save" onClick={saveGoal}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnualStatistics;
