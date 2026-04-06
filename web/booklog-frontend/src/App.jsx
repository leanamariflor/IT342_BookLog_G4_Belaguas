import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./jsx/LoginPage";
import RegisterPage from "./jsx/RegisterPage";
import Dashboard from "./jsx/Dashboard";
import OAuth2RedirectHandler from "./jsx/OAuth2RedirectHandler";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("user")));

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
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
        
        {!isAuthenticated ? (
          <>
            <Route
              path="/"
              element={
                <LoginPage
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />
            <Route
              path="/register"
              element={
                <RegisterPage
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;