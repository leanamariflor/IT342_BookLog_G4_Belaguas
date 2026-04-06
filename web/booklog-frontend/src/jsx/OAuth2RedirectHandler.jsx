import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const OAuth2RedirectHandler = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing OAuth login...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");

        if (error) {
          throw new Error(error);
        }

        const email = params.get("email") || "";
        if (!email) {
          throw new Error("Missing email in OAuth response");
        }

        const response = await axios.post(
          `${backendBaseUrl}/api/auth/oauth/callback`,
          {
            email,
            firstName: params.get("firstName") || "User",
            lastName: params.get("lastName") || "",
            profileImage: params.get("picture") || "",
            provider: params.get("provider") || "google"
          }
        );

        const userData = {
          userId: response.data.userId,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          profileImage: response.data.profileImage,
          oauthProvider: response.data.provider,
          roles: response.data.roles || ["ROLE_USER"]
        };
        
        localStorage.setItem("user", JSON.stringify(userData));

        if (typeof onLoginSuccess === "function") {
          onLoginSuccess();
        }

        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
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
