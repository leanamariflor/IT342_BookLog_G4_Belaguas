import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./jsx/LoginPage";
import RegisterPage from "./jsx/RegisterPage";
import Dashboard from "./jsx/Dashboard";
import Books from "./jsx/Books";
import BookDetails from "./jsx/BookDetails";
import AddBooks from "./jsx/AddBooks";
import Profile from "./jsx/Profile";
import OAuth2RedirectHandler from "./jsx/OAuth2RedirectHandler";
import AdminPanel from "./jsx/AdminPanel";
import AccessDenied from "./jsx/AccessDenied";
import AnnualStatistics from "./jsx/AnnualStatistics";
import BookCalendar from "./jsx/BookCalendar";
import Notes from "./jsx/Notes";

const hasAdminRole = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const roles = user?.roles || [];
  return roles.includes("ROLE_ADMIN");
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("user")) && Boolean(localStorage.getItem("token"))
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(Boolean(localStorage.getItem("user")) && Boolean(localStorage.getItem("token")));
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(Boolean(localStorage.getItem("user")) && Boolean(localStorage.getItem("token")));
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