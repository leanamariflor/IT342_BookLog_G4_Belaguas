import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Dashboard.css";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import { getUserBooks } from "../services/BookService";
import api from "../api/axios";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

import book1Icon from "../assets/book1.png";
import checkMarkIcon from "../assets/check-mark.png";
import book2Icon from "../assets/book2.png";
import starIcon from "../assets/star.png";
import calendarIcon from "../assets/calendar.png";

const READING_GOAL_STORAGE_KEY = "readingGoalByYear";
const DEFAULT_YEARLY_READING_GOAL = 24;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";
  const currentYear = new Date().getFullYear();
  const [toReadBooks, setToReadBooks] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [userName, setUserName] = useState("User");
  const [yearlyReadingGoal, setYearlyReadingGoal] = useState(DEFAULT_YEARLY_READING_GOAL);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const loadReadingGoal = () => {
    try {
      const raw = localStorage.getItem(READING_GOAL_STORAGE_KEY);
      if (!raw) {
        setYearlyReadingGoal(DEFAULT_YEARLY_READING_GOAL);
        return;
      }

      const parsed = JSON.parse(raw);
      const currentYearGoal = Number(parsed?.[currentYear]);
      setYearlyReadingGoal(currentYearGoal > 0 ? currentYearGoal : DEFAULT_YEARLY_READING_GOAL);
    } catch (error) {
      console.error("Error loading yearly reading goal:", error);
      setYearlyReadingGoal(DEFAULT_YEARLY_READING_GOAL);
    }
  };

  
  // Load dashboard books from backend
  const loadDashboardBooks = async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setIsDashboardLoading(true);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        const localBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
        const normalizedLocalBooks = localBooks.map((book) => ({
          ...book,
          image: toAbsoluteMediaUrl(book.image) || PLACEHOLDER_COVER,
          coverImageUrl: toAbsoluteMediaUrl(book.coverImageUrl) || null,
          attachmentUrl: toAbsoluteMediaUrl(book.attachmentUrl) || null
        }));
        setToReadBooks(normalizedLocalBooks.filter((book) => book.status === "To Read"));
        setReadingBooks(normalizedLocalBooks.filter((book) => book.status === "Reading"));
        setCompletedBooks(normalizedLocalBooks.filter((book) => book.status === "Completed"));
        return;
      }

      const backendBooks = await getUserBooks();
      const mappedBooks = await Promise.all(
        backendBooks.map(async (book) => {
          let resolvedImage = toAbsoluteMediaUrl(book.coverImageUrl) || PLACEHOLDER_COVER;

          if (book.attachmentUrl && book.bookId) {
            try {
              const response = await api.get(`/books/${book.bookId}/attachment`, {
                responseType: "blob"
              });
              resolvedImage = URL.createObjectURL(response.data);
            } catch (attachmentError) {
              if (attachmentError?.response?.status !== 404) {
                console.error("Unable to load dashboard attachment preview for book", book.bookId, attachmentError);
              }
            }
          }

          return {
            id: book.bookId,
            bookId: book.bookId,
            title: book.title,
            image: resolvedImage,
            authors: book.author ? [book.author] : [],
            description: book.description || "No description available",
            notes: Array.isArray(book.notes)
              ? book.notes.map((note) => ({
                  id: note.id || Date.now() + Math.random(),
                  text: note.text || "",
                  date: note.date || new Date().toISOString(),
                  isFavorited: Boolean(note.isFavorited)
                }))
              : [],
            rating: book.rating || 0,
            status: book.status || "To Read",
            dateAdded: book.createdAt ? new Date(book.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            dateUpdated: book.updatedAt ? new Date(book.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            coverImageUrl: toAbsoluteMediaUrl(book.coverImageUrl) || null,
            attachmentUrl: toAbsoluteMediaUrl(book.attachmentUrl) || null,
          };
        })
      );

      localStorage.setItem("userBooks", JSON.stringify(mappedBooks));
      setToReadBooks(mappedBooks.filter((book) => book.status === "To Read"));
      setReadingBooks(mappedBooks.filter((book) => book.status === "Reading"));
      setCompletedBooks(mappedBooks.filter((book) => book.status === "Completed"));
    } catch (error) {
      console.error("Error loading dashboard books:", error);
      const localBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      const normalizedLocalBooks = localBooks.map((book) => ({
        ...book,
        image: toAbsoluteMediaUrl(book.image) || PLACEHOLDER_COVER,
        coverImageUrl: toAbsoluteMediaUrl(book.coverImageUrl) || null,
        attachmentUrl: toAbsoluteMediaUrl(book.attachmentUrl) || null
      }));
      setToReadBooks(normalizedLocalBooks.filter((book) => book.status === "To Read"));
      setReadingBooks(normalizedLocalBooks.filter((book) => book.status === "Reading"));
      setCompletedBooks(normalizedLocalBooks.filter((book) => book.status === "Completed"));
    } finally {
      if (showLoader) {
        setIsDashboardLoading(false);
      }
    }
  };

  // Load user data on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.firstName) {
      setUserName(userData.firstName);
    }
  }, []);

  // Load books on mount
  useEffect(() => {
    loadDashboardBooks({ showLoader: true });
    loadReadingGoal();
  }, []);

  // Reload books when page comes back into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardBooks();
        loadReadingGoal();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const calculateDaysSince = (dateString) => {
    const bookDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - bookDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const resolveBookImage = (book) => {
    return book.image || book.attachmentUrl || book.coverImageUrl || PLACEHOLDER_COVER;
  };

  const completedCount = completedBooks.length;
  const toReadCount = toReadBooks.length;
  const currentlyReadingCount = readingBooks.length;
  const goalProgressText = `${completedCount}/${yearlyReadingGoal}`;
  const annualProgressPercent = Math.min(100, Math.round((completedCount / yearlyReadingGoal) * 100));

  const monthlyCounts = Array(12).fill(0);
  completedBooks.forEach((book) => {
    const candidates = [book.completedAt, book.finishedAt, book.updatedAt, book.dateUpdated, book.createdAt, book.dateAdded];
    let completionDate = null;

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) {
        completionDate = parsed;
        break;
      }
    }

    if (completionDate && completionDate.getFullYear() === currentYear) {
      monthlyCounts[completionDate.getMonth()] += 1;
    }
  });

  const maxMonthlyCount = Math.max(...monthlyCounts, 1);
  const chartScaleMax = Math.max(6, maxMonthlyCount);
  const currentMonthCount = monthlyCounts[new Date().getMonth()];

  const toCardProps = (path) => ({
    role: "button",
    tabIndex: 0,
    onClick: () => navigate(path),
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate(path);
      }
    },
    style: { cursor: "pointer" }
  });

  if (isDashboardLoading) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="dashboard" onLogout={onLogout} />

        <main className="main-content dashboard-loading-main">
          <PageLoader message="Loading your dashboard..." />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" onLogout={onLogout} />

      {/* Main Content */}
      <main className="main-content">

        {/* Greeting */}
        <div className="greeting">
          <h1>Welcome Back, {userName}!</h1>
          <p>Keep up your reading journey and reach your goals</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-blue" {...toCardProps("/books")}>
            <div className="stat-header">
              <img src={book1Icon} alt="Total Books" className="stat-icon" />
              <p>Books Completed</p>
            </div>
            <h2>{completedCount}</h2>
          </div>
          
          <div className="stat-card stat-green" {...toCardProps("/to-read")}>
            <div className="stat-header">
              <img src={checkMarkIcon} alt="Books Completed" className="stat-icon" />
              <p>To Read</p>
            </div>
            <h2>{toReadCount}</h2>
          </div>

          <div className="stat-card stat-orange" {...toCardProps("/reading")}>
            <div className="stat-header">
              <img src={starIcon} alt="Currently Reading" className="stat-icon" />
              <p>Currently Reading</p>
            </div>
            <h2>{currentlyReadingCount}</h2>
          </div>

          <div className="stat-card stat-purple" {...toCardProps("/reading-goal")}>
            <div className="stat-header">
              <img src={book2Icon} alt="Reading Goal" className="stat-icon" />
              <p>Reading Goal</p>
            </div>
            <h2>{goalProgressText}</h2>
          </div>
        </div>

   {/* Books Later Section */}
        <div className="later-section">
          <div className="later-header">
            <h3>Books to Read Later</h3>
            <span className="more-link" onClick={() => navigate("/to-read")} style={{ cursor: "pointer" }}>More →</span>
          </div>

          <div className="later-scroll">
            <button
              className="dashboard-add-book-card"
              onClick={() => navigate("/add-book")}
              type="button"
              title="Add book"
            >
              <span className="dashboard-add-book-plus">+</span>
              <span className="dashboard-add-book-label">Add Book</span>
            </button>

            {toReadBooks.map((book) => (
              <img
                key={book.id}
                src={resolveBookImage(book)}
                alt={book.title}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = PLACEHOLDER_COVER;
                }}
                onClick={() => navigate(`/books/${book.id}`)}
                style={{ cursor: "pointer" }}
                title={book.title}
              />
            ))}

          </div>
          {toReadBooks.length === 0 && (
            <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "10px" }}>No books to read yet</p>
          )}
        </div>
   {/* Currently Reading Section */}
        <div className="reading-section">
          <div className="section-header">
            <h3>Currently Reading</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="more-link" onClick={() => navigate("/reading")} style={{ cursor: "pointer" }}>More →</span>
              
            </div>
          </div>

          <div className="reading-list">
            {readingBooks.length > 0 ? (
              readingBooks.slice(0, 2).map((book) => (
                <div key={book.id} className="reading-card" onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: "pointer" }}>
                  <div className="reading-card-content">
                    <div className="reading-card-image">
                      <img
                        src={resolveBookImage(book)}
                        alt={book.title}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = PLACEHOLDER_COVER;
                        }}
                      />
                    </div>
                    
                    <div className="reading-card-info">
                      <h3>{book.title}</h3>
                      <p className="reading-date">From {new Date(book.dateUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      <p className="reading-day">Day {calculateDaysSince(book.dateUpdated)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#9ca3af", fontSize: "14px", padding: "20px 0" }}>
                No books currently reading. Mark a book as "Reading" from your collection!
              </p>
            )}
          </div>
        </div>
        
        <div className="dashboard-widgets">
          <div className="dashboard-widget-card dashboard-widget-calendar" {...toCardProps("/calendar?from=dashboard")}> 
            <div>
              <h3>Book Calendar</h3>
              <p>You finished {currentMonthCount} book{currentMonthCount === 1 ? "" : "s"} this month.</p>
            </div>
            <img src={calendarIcon} alt="Calendar" className="dashboard-widget-icon" />
          </div>

          <div className="dashboard-widget-card" {...toCardProps("/reading-goal")}> 
            <div>
              <h3>Annual Statistics</h3>
              <p>You read {completedCount} book{completedCount === 1 ? "" : "s"}.</p>
              <div className="dashboard-widget-mini-chart" aria-hidden="true">
                {monthlyCounts.map((count, index) => {
                  const barHeight = count > 0 ? Math.max(6, Math.round((count / chartScaleMax) * 64)) : 0;
                  const isCurrentMonth = index === new Date().getMonth();
                  return (
                    <div key={MONTH_LABELS[index]} className="dashboard-widget-mini-bar-track">
                      {barHeight > 0 ? (
                        <span
                          className={`dashboard-widget-mini-bar ${isCurrentMonth ? "current" : ""}`}
                          style={{ height: `${barHeight}px` }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="dashboard-widget-progress">{annualProgressPercent}%</div>
          </div>
        </div>

     


      </main>
    </div>
  );
};

export default Dashboard;