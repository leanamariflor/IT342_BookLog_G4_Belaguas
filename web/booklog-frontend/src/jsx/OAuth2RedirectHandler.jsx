import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OAuth2RedirectHandler = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing OAuth login...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Spring Boot redirects here with ?token=JWT after successful Google OAuth
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");

        if (error) {
          throw new Error(error);
        }

        if (!token) {
          throw new Error("No token received from server");
        }

        // Store the JWT
        localStorage.setItem("token", token);

        // Fetch user profile from Spring Boot using the JWT
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = {
          userId: response.data.userId,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          profileImage: response.data.profileImage,
          roles: response.data.roles || ["ROLE_USER"],
        };

        localStorage.setItem("user", JSON.stringify(userData));

        if (typeof onLoginSuccess === "function") {
          onLoginSuccess();
        }

        setStatus("Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);

      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("OAuth login failed: " + (error.response?.data?.message || error.message));
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate, onLoginSuccess]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      flexDirection: "column",
      gap: "20px"
    }}>
      <h3>{status}</h3>
      {status.includes("failed") && <p>Redirecting to login...</p>}
    </div>
  );
};

export default OAuth2RedirectHandler;
