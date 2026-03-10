import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Dashboard.css";
import Sidebar, { PageHeader } from "./Sidebar";

import book1Icon from "../assets/book1.png";
import checkMarkIcon from "../assets/check-mark.png";
import book2Icon from "../assets/book2.png";
import starIcon from "../assets/star.png";
const UserDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");

  // Load user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.firstName) {
      setUserName(userData.firstName);
      
      // Generate initials from first and last name
      const firstInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : "";
      const lastInitial = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : "";
      setUserInitials(firstInitial + lastInitial);
    }
  }, []);

  // Mock data for currently reading books
  const currentlyReading = [
    { id: 1, title: "Atomic Habits", author: "James Clear", progress: 65 },
    { id: 2, title: "Deep Work", author: "Cal Newport", progress: 40 },
  ];
 const booksLater = [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794",
    "https://images.unsplash.com/photo-1524578271613-d550eacf6090",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d",
  ];

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" />

      {/* Main Content */}
      <main className="main-content">

        {/* Header */}
        <div className="header">
          <PageHeader initials={userInitials} />
        </div>

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
            <span className="more-link">More →</span>
          </div>

          <div className="later-scroll">
            {booksLater.map((book, index) => (
              <img key={index} src={book} alt="book" />
            ))}

            {/* Add Placeholder */}
            <div className="placeholder">+</div>
          </div>
        </div>

        {/* Currently Reading Section */}
        <div className="reading-section">
          <div className="section-header">
            <h3>Currently Reading</h3>
            <button className="quick-action-btn" onClick={() => navigate("/add-book")}>
              + Add Book
            </button>
          </div>

          <div className="reading-list">
            {currentlyReading.map((book) => (
              <div key={book.id} className="reading-item">
                <div className="book-info-dashboard">
                  <h4>{book.title}</h4>
                  <p>{book.author}</p>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${book.progress}%` }}></div>
                </div>
                <span className="progress-text">{book.progress}%</span>
              </div>
            ))}
          </div>
        </div>


      </main>
    </div>
  );
};

export default UserDashboard;