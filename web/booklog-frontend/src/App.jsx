import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import Dashboard from "./features/dashboard/pages/Dashboard";
import Books from "./features/books/pages/Books";
import BookDetails from "./features/books/pages/BookDetails";
import AddBooks from "./features/books/pages/AddBooks";
import Profile from "./features/profile/pages/Profile";
import OAuth2RedirectHandler from "./features/auth/pages/OAuth2RedirectHandler";
import AccessDenied from "./features/shared/components/AccessDenied";
import AnnualStatistics from "./features/annual/pages/AnnualStatistics";
import BookCalendar from "./features/calendar/pages/BookCalendar";
import AdminPanel from "./features/admin/pages/AdminPanel";
import Notes from "./features/notes/pages/Notes";

const hasAdminRole = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const roles = user?.roles || [];
  return roles.includes("ROLE_ADMIN");
};

const isAuthenticatedFromStorage = () => {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  if (!token || !userRaw) {
    return false;
  }

  try {
    return Boolean(JSON.parse(userRaw));
  } catch {
    localStorage.removeItem("user");
    return false;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAuthenticatedFromStorage());

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(isAuthenticatedFromStorage());
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-state-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-state-changed", syncAuthState);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(isAuthenticatedFromStorage());
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(isAuthenticatedFromStorage());
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* OAuth2 redirect handler (accessible without authentication) */}
        <Route
          path="/oauth2/redirect"
          element={<OAuth2RedirectHandler onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/notes/*"
          element={isAuthenticated ? <Notes onLogout={handleLogout} /> : <Navigate to="/" replace />}
        />
        
        {!isAuthenticated ? (
          <>
            <Route
              path="/"
              element={
                <LoginPage
                  onShowRegister={(show) => {
                    /* Router handles this */
                  }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />
            <Route
              path="/register"
              element={
                <RegisterPage
                  onShowLogin={(show) => {
                    /* Router handles this */
                  }}
                  onRegisterSuccess={handleRegisterSuccess}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/dashboard"
              element={<Dashboard onLogout={handleLogout} />}
            />
            <Route path="/books" element={<Books onLogout={handleLogout} mode="completed" />} />
            <Route path="/to-read" element={<Books onLogout={handleLogout} mode="to-read" />} />
            <Route path="/reading" element={<Books onLogout={handleLogout} mode="reading" />} />
            <Route
              path="/books/:id"
              element={<BookDetails onLogout={handleLogout} />}
            />
            <Route
              path="/add-book"
              element={<AddBooks onLogout={handleLogout} />}
            />
            <Route
              path="/profile"
              element={<Profile onLogout={handleLogout} />}
            />
            <Route
              path="/reading-goal"
              element={<AnnualStatistics onLogout={handleLogout} />}
            />
            <Route
              path="/calendar"
              element={<BookCalendar onLogout={handleLogout} />}
            />
            <Route
              path="/admin"
              element={hasAdminRole() ? <AdminPanel onLogout={handleLogout} /> : <Navigate to="/forbidden" replace />}
            />
            <Route path="/forbidden" element={<AccessDenied />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;