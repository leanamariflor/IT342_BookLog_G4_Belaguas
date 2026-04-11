import React, { useEffect, useRef, useState } from "react";
import "../css/Profile.css";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import cameraIcon from "../assets/camera.png";
import api from "../api/axios";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

const Profile = ({ onLogout }) => {
  const PROFILE_EXTRAS_STORAGE_KEY = "profileExtras";
  const GOAL_STORAGE_KEY = "readingGoalByYear";
  const PROFILE_IMAGE_CACHE_PREFIX = "profileImageCache";
  const fileInputRef = useRef(null);
  const imageObjectUrlRef = useRef(null);
  const pendingImageObjectUrlRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageSrc, setProfileImageSrc] = useState("");
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [yearlyGoal, setYearlyGoal] = useState(24);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileToast, setProfileToast] = useState(null);
  const profileToastTimerRef = useRef(null);

  const showProfileToast = (message, type = "success", duration = 2200) => {
    if (profileToastTimerRef.current) {
      clearTimeout(profileToastTimerRef.current);
    }
    setProfileToast({ message, type });
    profileToastTimerRef.current = setTimeout(() => {
      setProfileToast(null);
    }, duration);
  };

  const getProfileImageCacheKey = (userId) => `${PROFILE_IMAGE_CACHE_PREFIX}:${userId || "default"}`;

  const getCachedProfileImage = (userId) => {
    try {
      return localStorage.getItem(getProfileImageCacheKey(userId)) || "";
    } catch {
      return "";
    }
  };

  const setCachedProfileImage = (userId, dataUrl) => {
    if (!dataUrl) {
      return;
    }
    try {
      localStorage.setItem(getProfileImageCacheKey(userId), dataUrl);
    } catch {
      // Ignore quota/storage errors to keep UI responsive.
    }
  };

  const clearCachedProfileImage = (userId) => {
    try {
      localStorage.removeItem(getProfileImageCacheKey(userId));
    } catch {
      // Ignore storage errors.
    }
  };

  const blobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const loadCurrentYearGoal = () => {
    try {
      const currentYear = new Date().getFullYear();
      const raw = localStorage.getItem(GOAL_STORAGE_KEY);
      if (!raw) {
        setYearlyGoal(24);
        return;
      }

      const parsed = JSON.parse(raw);
      const goal = Number(parsed?.[currentYear]);
      setYearlyGoal(goal > 0 ? goal : 24);
    } catch {
      setYearlyGoal(24);
    }
  };

  const updateLocalUser = (updates) => {
    const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
    const merged = { ...existingUser, ...updates };
    localStorage.setItem("user", JSON.stringify(merged));
  };

  const loadStoredExtras = () => {
    try {
      const extras = JSON.parse(localStorage.getItem(PROFILE_EXTRAS_STORAGE_KEY) || "{}");
      setUsername(extras.username || "");
      setLocation(extras.location || "");
      setBio(extras.bio || "");
    } catch {
      setUsername("");
      setLocation("");
      setBio("");
    }
  };

  const saveStoredExtras = () => {
    localStorage.setItem(
      PROFILE_EXTRAS_STORAGE_KEY,
      JSON.stringify({
        username: draftUsername.trim(),
        location: draftLocation.trim(),
        bio: draftBio.trim(),
      })
    );
  };

  const setImagePreviewUrl = (nextUrl) => {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    setProfileImageSrc(nextUrl || "");
  };

  const loadProfileImagePreview = async (profileImage, userId) => {
    if (!profileImage) {
      setImagePreviewUrl("");
      clearCachedProfileImage(userId);
      return;
    }

    // Always prefer uploaded image (local endpoint) over Google image
    const normalized = profileImage.toLowerCase();
    if (normalized.includes("/api/auth/me/profile-image") || normalized.startsWith("profiles/")) {
      const cachedDataUrl = getCachedProfileImage(userId);
      if (cachedDataUrl) {
        setImagePreviewUrl(cachedDataUrl);
        return;
      }
      try {
        const response = await api.get("/auth/me/profile-image", { responseType: "blob" });
        const dataUrl = await blobToDataUrl(response.data);
        if (dataUrl) {
          setCachedProfileImage(userId, dataUrl);
          setImagePreviewUrl(dataUrl);
        } else {
          setImagePreviewUrl("");
        }
      } catch (error) {
        console.error("Unable to load profile image blob:", error);
        setImagePreviewUrl("");
      }
      return;
    }

    if (/^(data:|blob:|https?:\/\/)/i.test(profileImage)) {
      setImagePreviewUrl(profileImage);
      if (profileImage.startsWith("data:")) {
        setCachedProfileImage(userId, profileImage);
      }
      return;
    }

    const absoluteUrl = toAbsoluteMediaUrl(profileImage);
    setImagePreviewUrl(absoluteUrl);
  };

  const applyUserResponse = async (userData) => {
    setFirstName(userData.firstName || "");
    setLastName(userData.lastName || "");
    setEmail(userData.email || "");
    setCreatedAt(userData.createdAt || "");
    updateLocalUser({
      userId: userData.userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profileImage: userData.profileImage,
      createdAt: userData.createdAt,
      oauthProvider: userData.provider || null,
      roles: userData.roles || ["ROLE_USER"],
    });
    await loadProfileImagePreview(userData.profileImage, userData.userId);
  };

  const clearPendingImage = () => {
    setPendingImageFile(null);
    if (pendingImageObjectUrlRef.current) {
      URL.revokeObjectURL(pendingImageObjectUrlRef.current);
      pendingImageObjectUrlRef.current = null;
    }
    setPendingImagePreview("");
  };

  const startEditMode = () => {
    setDraftFirstName(firstName || "");
    setDraftLastName(lastName || "");
    setDraftUsername(username || "");
    setDraftLocation(location || "");
    setDraftBio(bio || "");
    clearPendingImage();
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    clearPendingImage();
  };

  useEffect(() => {
    let isMounted = true;

    const initializeProfile = async () => {
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      setFirstName(localUser.firstName || "");
      setLastName(localUser.lastName || "");
      setEmail(localUser.email || "");
      setCreatedAt(localUser.createdAt || "");
      loadStoredExtras();
      loadCurrentYearGoal();
      await loadProfileImagePreview(localUser.profileImage || "", localUser.userId);

      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setIsProfileLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me");
        await applyUserResponse(response.data);
      } catch (error) {
        console.error("Failed to refresh profile data:", error);
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    initializeProfile();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCurrentYearGoal();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (profileToastTimerRef.current) {
        clearTimeout(profileToastTimerRef.current);
      }
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
      }
      if (pendingImageObjectUrlRef.current) {
        URL.revokeObjectURL(pendingImageObjectUrlRef.current);
      }
    };
  }, []);

  const handleProfileImageChange = async (event) => {
    if (!isEditing) {
      event.target.value = "";
      return;
    }

    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      showProfileToast("Please select an image file.", "error", 2400);
      return;
    }

    clearPendingImage();
    const localPreviewUrl = URL.createObjectURL(selectedFile);
    pendingImageObjectUrlRef.current = localPreviewUrl;
    setPendingImageFile(selectedFile);
    setPendingImagePreview(localPreviewUrl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fileToDataUrl = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const runSave = async () => {
      try {
        setIsSaving(true);

        const token = localStorage.getItem("token");
        let latestUserData = null;

        if (token) {
          const response = await api.put("/auth/me", {
            firstName: draftFirstName.trim(),
            lastName: draftLastName.trim(),
          });
          latestUserData = response.data;

          if (pendingImageFile) {
            setIsUploadingImage(true);
            const formData = new FormData();
            formData.append("file", pendingImageFile);
            const uploadResponse = await api.post("/auth/me/profile-image", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            latestUserData = uploadResponse.data;

            const uploadedDataUrl = await fileToDataUrl(pendingImageFile);
            setCachedProfileImage(latestUserData.userId, uploadedDataUrl);
          }

          await applyUserResponse(latestUserData);
        } else {
          setFirstName(draftFirstName.trim());
          setLastName(draftLastName.trim());
          updateLocalUser({
            firstName: draftFirstName.trim(),
            lastName: draftLastName.trim(),
          });

          if (pendingImageFile) {
            const dataUrl = await fileToDataUrl(pendingImageFile);
            updateLocalUser({ profileImage: dataUrl });
            setCachedProfileImage(JSON.parse(localStorage.getItem("user") || "{}").userId, dataUrl);
            setImagePreviewUrl(dataUrl);
          }
        }

        setUsername(draftUsername.trim());
        setLocation(draftLocation.trim());
        setBio(draftBio.trim());

        saveStoredExtras();
        showProfileToast("Changes saved.", "success", 2000);
        setIsEditing(false);
        clearPendingImage();
      } catch (error) {
        console.error("Failed to save profile:", error);
        showProfileToast(error.response?.data?.message || "Failed to save profile.", "error", 2600);
      } finally {
        setIsSaving(false);
        setIsUploadingImage(false);
      }
    };

    runSave();
  };

  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";
  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase() || "U";
  const displayUsername = username.trim() || "booklover";
  const displayLocation = location.trim() || "Not set";
  const displayBio = bio.trim() || "No bio yet.";
  const activeAvatarSrc = isEditing && pendingImagePreview ? pendingImagePreview : profileImageSrc;
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Unavailable";
  const goalYear = new Date().getFullYear();

  if (isProfileLoading) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="profile" onLogout={onLogout} />
        <div className="profile-page">
          <PageLoader message="Loading your profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activePage="profile" onLogout={onLogout} />

      <div className="profile-page">
        {profileToast && <div className={`profile-action-toast ${profileToast.type}`}>{profileToast.message}</div>}
        <h1 className="profile-title">Profile</h1>

        <div className={`profile-card ${!isEditing ? "view-mode" : "edit-mode"}`}>
          <div className="profile-card-header">
            <h2>{isEditing ? "" : ""}</h2>
            <button
              type="button"
              className="edit-profile-btn"
              onClick={() => {
                if (isEditing) {
                  cancelEditMode();
                } else {
                  startEditMode();
                }
              }}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div
              className={`avatar ${!isEditing && activeAvatarSrc ? "clickable" : ""}`}
              onClick={() => {
                if (!isEditing && activeAvatarSrc) {
                  setShowImageViewer(true);
                }
              }}
            >
              {activeAvatarSrc ? (
                <img src={activeAvatarSrc} alt={fullName} className="avatar-image" />
              ) : (
                initials
              )}
              {isEditing ? (
                <button
                  type="button"
                  className="camera-icon"
                  onClick={() => fileInputRef.current?.click()}
                  title={isUploadingImage ? "Uploading..." : "Choose profile picture"}
                  disabled={isUploadingImage}
                >
                  <img src={cameraIcon} alt="Camera" className="camera-icon-image" />
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-image-input"
              onChange={handleProfileImageChange}
            />

            <div className="profile-identity">
              <h2 className="profile-name">{fullName}</h2>
              <p className="profile-email">{email || "No email"}</p>
            </div>
          </div>

          {isEditing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <label>First Name</label>
              <input
                type="text"
                value={draftFirstName}
                onChange={(e) => setDraftFirstName(e.target.value)}
                className="profile-input"
              />

              <label>Last Name</label>
              <input
                type="text"
                value={draftLastName}
                onChange={(e) => setDraftLastName(e.target.value)}
                className="profile-input"
              />

              <label>Username</label>
              <input
                type="text"
                value={draftUsername}
                onChange={(e) => setDraftUsername(e.target.value)}
                className="profile-input"
              />


              <label>Location</label>
              <input
                type="text"
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                className="profile-input"
              />

              <label>Bio</label>
              <textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                className="profile-textarea"
                rows={3}
              />

              <button type="submit" className="save-btn" disabled={isSaving || isUploadingImage}>
                {isSaving || isUploadingImage ? "Saving..." : "Save Changes"}
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
                <strong>@{displayUsername}</strong>
              </div>
              <div className="profile-display-item">
                <span>Location</span>
                <strong>{displayLocation}</strong>
              </div>
              <div className="profile-display-bio">
                <span>Bio</span>
                <p>{displayBio}</p>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="profile-extra-grid">
              <div className="profile-extra-card">
                <h3>Account Info</h3>
                <div className="profile-extra-item">
                  <span>Member Since</span>
                  <strong>{memberSince}</strong>
                </div>
              </div>

              <div className="profile-extra-card">
                <h3>Reading Preferences</h3>
                <div className="profile-extra-item">
                  <span>Yearly Goal ({goalYear})</span>
                  <strong>{yearlyGoal} books</strong>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showImageViewer && activeAvatarSrc && (
        <div className="profile-image-viewer-overlay" onClick={() => setShowImageViewer(false)}>
          <div className="profile-image-viewer-content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="profile-image-viewer-close"
              onClick={() => setShowImageViewer(false)}
              aria-label="Close image viewer"
            >
              x
            </button>
            <img src={activeAvatarSrc} alt={fullName} className="profile-image-viewer-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;