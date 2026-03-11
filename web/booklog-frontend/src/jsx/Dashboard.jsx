import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserDashboard.css";
import Sidebar from "./Sidebar";
import { getUserBooks } from "../services/BookService";

import book1Icon from "../assets/book1.png";
import checkMarkIcon from "../assets/check-mark.png";
import book2Icon from "../assets/book2.png";
import starIcon from "../assets/star.png";
const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";
  const [toReadBooks, setToReadBooks] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [userName, setUserName] = useState("User");

  // Load dashboard books from backend
  const loadDashboardBooks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        const localBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
        setToReadBooks(localBooks.filter((book) => book.status === "To Read"));
        setReadingBooks(localBooks.filter((book) => book.status === "Reading"));
        return;
      }

      const backendBooks = await getUserBooks();
      const mappedBooks = backendBooks.map((book) => ({
        id: book.bookId,
        bookId: book.bookId,
        title: book.title,
        image: book.attachmentUrl || book.coverImageUrl || PLACEHOLDER_COVER,
        authors: book.author ? [book.author] : [],
        description: book.description || "No description available",
        rating: book.rating || 0,
        status: book.status || "To Read",
        dateAdded: book.createdAt ? new Date(book.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dateUpdated: book.updatedAt ? new Date(book.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        coverImageUrl: book.coverImageUrl,
        attachmentUrl: book.attachmentUrl,
      }));

      localStorage.setItem("userBooks", JSON.stringify(mappedBooks));
      setToReadBooks(mappedBooks.filter((book) => book.status === "To Read"));
      setReadingBooks(mappedBooks.filter((book) => book.status === "Reading"));
    } catch (error) {
      console.error("Error loading dashboard books:", error);
      const localBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      setToReadBooks(localBooks.filter((book) => book.status === "To Read"));
      setReadingBooks(localBooks.filter((book) => book.status === "Reading"));
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
    loadDashboardBooks();
  }, []);

  // Reload books when page comes back into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardBooks();
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

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" onLogout={onLogout} />

     
      <main className="main-content">

       
        <div className="greeting">
          <h1>Welcome Back, {userName}!</h1>
          <p>Keep up your reading journey and reach your goals</p>
        </div>

       
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-header">
              <img src={book1Icon} alt="Total Books" className="stat-icon" />
              <p>Total Books</p>
            </div>
            <h2>24</h2>
          </div>
          
          <div className="stat-card stat-green">
            <div className="stat-header">
              <img src={checkMarkIcon} alt="Books Completed" className="stat-icon" />
              <p>Books Completed</p>
            </div>
            <h2>18</h2>
          </div>

          <div className="stat-card stat-purple">
            <div className="stat-header">
              <img src={book2Icon} alt="Reading Goal" className="stat-icon" />
              <p>Reading Goal</p>
            </div>
            <h2>2</h2>
          </div>

          <div className="stat-card stat-orange">
            <div className="stat-header">
              <img src={starIcon} alt="Avg Rating" className="stat-icon" />
              <p>Avg Rating</p>
            </div>
            <h2>4.2</h2>
          </div>
        </div>

  
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

      
        <div className="reading-section">
          <div className="section-header">
            <h3>Currently Reading</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="more-link" onClick={() => navigate("/reading")} style={{ cursor: "pointer" }}>More →</span>
              
            </div>
          </div>

          <div className="reading-list">
            {readingBooks.length > 0 ? (
              readingBooks.map((book) => (
                <div key={book.id} className="reading-card" onClick={() => navigate(`/books/${book.id}`)} style={{ cursor: "pointer" }}>
                  <div className="reading-card-header">
                    <span className="day-counter">Day {calculateDaysSince(book.dateUpdated)}</span>
                  </div>
                  
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
                      <p className="reading-status">First reading</p>
                      <label className="reading-checkbox">
                        <input type="checkbox" />
                        No notes
                      </label>
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


      </main>
    </div>
  );
};

export default Dashboard;