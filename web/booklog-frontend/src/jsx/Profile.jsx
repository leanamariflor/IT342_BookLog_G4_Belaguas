import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Profile.css";
import Sidebar from "./Sidebar";
import cameraIcon from "../assets/camera.png";

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("Alex Johnson");
  const [username, setUsername] = useState("alexreads");
  const [location, setLocation] = useState("Manila, PH");
  const [bio, setBio] = useState("Book lover tracking reading progress every day.");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Changes Saved!");
    setIsEditing(false);
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="profile" onLogout={onLogout} />

      <div className="profile-page">
        <h1 className="profile-title">Profile</h1>

        <div className={`profile-card ${!isEditing ? "view-mode" : "edit-mode"}`}>
          <div className="profile-card-header">
            <h2>{isEditing ? "" : ""}</h2>
            <button
              type="button"
              className="edit-profile-btn"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar">
              AJ
              <div className="camera-icon">
                <img src={cameraIcon} alt="Camera" className="camera-icon-image" />
              </div>
            </div>

            <h2 className="profile-name">Alex Johnson</h2>
            <p className="profile-email">alex@booklog.com</p>
          </div>

          {isEditing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="profile-input"
              />

              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="profile-input"
              />


              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="profile-input"
              />

              <label>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="profile-textarea"
                rows={3}
              />

              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="profile-display-card">
              <div className="profile-display-item">
                <span>Full Name</span>
                <strong>{fullName}</strong>
              </div>
              <div className="profile-display-item">
                <span>Username</span>
                <strong>@{username}</strong>
              </div>
              <div className="profile-display-item">
                <span>Location</span>
                <strong>{location}</strong>
              </div>
              <div className="profile-display-bio">
                <span>Bio</span>
                <p>{bio}</p>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="profile-extra-grid">
              <div className="profile-extra-card">
                <h3>Account Info</h3>
                <div className="profile-extra-item">
                  <span>Member Since</span>
                  <strong>January 2026</strong>
                </div>
                <div className="profile-extra-item">
                  <span>Reading Streak</span>
                  <strong>12 days</strong>
                </div>
              </div>

              <div className="profile-extra-card">
                <h3>Reading Preferences</h3>
                <div className="profile-extra-item">
                  <span>Yearly Goal</span>
                  <strong>25 books</strong>
                </div>
                <div className="profile-extra-item">
                  <span>Average Rating</span>
                  <strong>4.2</strong>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;