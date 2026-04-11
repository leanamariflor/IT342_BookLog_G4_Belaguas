import React, { useEffect, useState } from "react";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.svg";
import dashboardIcon from "../assets/dashboard.png";
import userIcon from "../assets/user.png";
import booksIcon from "../assets/book.png";
import notesIcon from "../assets/notes.png";
import logoutIcon from "../assets/logout.png";
import bellIcon from "../assets/bell.png";
import api from "../api/axios";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

export const PageHeader = ({ initials = "AJ", avatarSrc = "", onAvatarClick }) => {
  return (
    <div className="page-header">
      <div></div>
      <div className="page-header-right">
        <img src={bellIcon} alt="Notifications" className="page-bell-icon" />
        <button
          type="button"
          className="page-avatar"
          onClick={onAvatarClick}
          title="Go to Profile"
          aria-label="Go to Profile"
        >
          {avatarSrc ? <img src={avatarSrc} alt="Profile" className="page-avatar-image" /> : initials}
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ activePage = "dashboard", onLogout }) => {
  const navigate = useNavigate();
  const [userInitials, setUserInitials] = useState("U");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Get user initials from localStorage
  useEffect(() => {
    let objectUrl = null;

    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      const firstInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : "";
      const lastInitial = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : "";
      setUserInitials(firstInitial + lastInitial || "U");
      setIsAdmin((userData.roles || []).includes("ROLE_ADMIN"));

      const profileImage = userData.profileImage || "";
      // Always prefer uploaded image (local endpoint) over Google image
      if (!profileImage) {
        setAvatarSrc("");
      } else if (profileImage.toLowerCase().includes("/api/auth/me/profile-image") || profileImage.startsWith("profiles/")) {
        api
          .get("/auth/me/profile-image", { responseType: "blob" })
          .then((response) => {
            objectUrl = URL.createObjectURL(response.data);
            setAvatarSrc(objectUrl);
          })
          .catch(() => {
            setAvatarSrc("");
          });
      } else if (/^(data:|blob:|https?:\/\/)/i.test(profileImage)) {
        setAvatarSrc(profileImage);
      } else {
        setAvatarSrc(toAbsoluteMediaUrl(profileImage));
      }
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      <div className="page-header-bar">
        <PageHeader initials={userInitials} avatarSrc={avatarSrc} onAvatarClick={() => navigate("/profile")} />
      </div>
      <aside className="sidebar">
      <div className="logo">
        <img src={logoImg} alt="BookLog Logo" className="logo-icon" />
        <h2>OOK LOG</h2>
      </div>
      
      <div className="logo-divider"></div>

      <nav className="nav-links">
        <button
          type="button"
          className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavigation("/dashboard")}
        >
          <img src={dashboardIcon} alt="Dashboard" className="nav-icon" />
          Dashboard
        </button>
        <button
          type="button"
          className={`nav-item ${activePage === "books" ? "active" : ""}`}
          onClick={() => handleNavigation("/books")}
        >
          <img src={booksIcon} alt="My Books" className="nav-icon" />
          My Books
        </button>
        <button
          type="button"
          className={`nav-item ${activePage === "notes" ? "active" : ""}`}
          onClick={() => handleNavigation("/notes")}
        >
          <img src={notesIcon} alt="Notes" className="nav-icon" />
          Notes
        </button>
        <button
          type="button"
          className={`nav-item ${activePage === "profile" ? "active" : ""}`}
          onClick={() => handleNavigation("/profile")}
        >
          <img src={userIcon} alt="Profile" className="nav-icon" />
          Profile
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`nav-item ${activePage === "admin" ? "active" : ""}`}
            onClick={() => handleNavigation("/admin")}
          >
            <img src={userIcon} alt="Admin" className="nav-icon" />
            Admin
          </button>
        )}
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
