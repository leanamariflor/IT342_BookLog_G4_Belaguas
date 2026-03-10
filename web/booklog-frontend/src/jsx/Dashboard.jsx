import React from "react";
import "../css/LoginPage.css";
import logo from "../assets/logo.png";

function Dashboard({ onLogout }) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <img src={logo} alt="Book Log" className="logo-img" />
        </div>

        <h2>Welcome to Your Dashboard</h2>
        <p className="subtitle">This is a placeholder dashboard view.</p>

        <button className="signin-btn" onClick={() => onLogout && onLogout()}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
