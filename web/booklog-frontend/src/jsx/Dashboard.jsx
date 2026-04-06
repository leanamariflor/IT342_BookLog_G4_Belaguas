import React, { useMemo } from "react";
import "../css/UserDashboard.css";
import Sidebar from "./Sidebar";

import book1Icon from "../assets/book1.png";
import checkMarkIcon from "../assets/check-mark.png";
import book2Icon from "../assets/book2.png";
import starIcon from "../assets/star.png";
const Dashboard = ({ onLogout }) => {
  const userName = useMemo(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    return userData?.firstName || "Reader";
  }, []);

  const toReadBooks = [
    { id: 1, title: "Atomic Habits", image: "https://images-na.ssl-images-amazon.com/images/I/91bYsX41DVL.jpg" },
    { id: 2, title: "Deep Work", image: "https://images-na.ssl-images-amazon.com/images/I/71m-MxdJ2WL.jpg" },
    { id: 3, title: "Sapiens", image: "https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg" },
  ];

  const readingBooks = [
    { id: 1, title: "Clean Code", started: "Mar 24, 2026", day: 14 },
    { id: 2, title: "The Pragmatic Programmer", started: "Mar 31, 2026", day: 7 },
  ];

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

   {/* Books Later Section */}
        <div className="later-section">
          <div className="later-header">
            <h3>Books to Read Later</h3>
            <span className="more-link">UI Preview</span>
          </div>

          <div className="later-scroll">
            <button className="dashboard-add-book-card" type="button" title="Add book">
              <span className="dashboard-add-book-plus">+</span>
              <span className="dashboard-add-book-label">Add Book</span>
            </button>

            {toReadBooks.map((book) => (
              <img
                key={book.id}
                src={book.image}
                alt={book.title}
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
              <span className="more-link">UI Preview</span>
              
            </div>
          </div>

          <div className="reading-list">
            {readingBooks.length > 0 ? (
              readingBooks.map((book) => (
                <div key={book.id} className="reading-card">
                  <div className="reading-card-header">
                    <span className="day-counter">Day {book.day}</span>
                  </div>
                  
                  <div className="reading-card-content">
                    <div className="reading-card-image">
                      <img
                        src="https://images-na.ssl-images-amazon.com/images/I/41as+WafrFL.jpg"
                        alt={book.title}
                      />
                    </div>
                    
                    <div className="reading-card-info">
                      <h3>{book.title}</h3>
                      <p className="reading-date">From {book.started}</p>
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