import React, { useEffect, useState } from "react";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.svg";
import dashboardIcon from "../assets/dashboard.png";
import logoutIcon from "../assets/logout.png";
import bellIcon from "../assets/bell.png";

export const PageHeader = ({ initials = "AJ" }) => {
  return (
    <div className="page-header">
      <div></div>
      <div className="page-header-right">
        <img src={bellIcon} alt="Notifications" className="page-bell-icon" />
        <div className="page-avatar">{initials}</div>
      </div>
    </div>
  );
};

const Sidebar = ({ activePage = "dashboard", onLogout }) => {
  const navigate = useNavigate();
  const [userInitials, setUserInitials] = useState("U");

  // Get user initials from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      const firstInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : "";
      const lastInitial = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : "";
      setUserInitials(firstInitial + lastInitial || "U");
    }
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  const handleNavigation = (page) => {
    if (page === "dashboard") {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <div className="page-header-bar">
        <PageHeader initials={userInitials} />
      </div>
      <aside className="sidebar">
      <div className="logo">
        <img src={logoImg} alt="BookLog Logo" className="logo-icon" />
        <h2>OOK LOG</h2>
      </div>
      
      <div className="logo-divider"></div>

      <nav className="nav-links">
        <div
          className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavigation("dashboard")}
        >
          <img src={dashboardIcon} alt="Dashboard" className="nav-icon" />
          Dashboard
        </div>
      </nav>
      <div className="logout-divider"></div>
      <div className="logout" onClick={handleLogout}>
        <img src={logoutIcon} alt="Logout" className="nav-icon" />
        Logout
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
