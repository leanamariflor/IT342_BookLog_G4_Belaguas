import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OAuth2RedirectHandler = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing OAuth login...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get("error");

        if (errorParam) {
          throw new Error(errorParam);
        }

        const email = params.get("email");
        const firstName = params.get("firstName") || "User";
        const lastName = params.get("lastName") || "";
        const picture = params.get("picture") || "";
        const provider = params.get("provider") || "google";

        if (!email) {
          throw new Error("Missing email from OAuth callback");
        }
        
        const response = await axios.post(
          "http://localhost:8080/api/auth/oauth/callback",
          {
            email,
            firstName,
            lastName,
            profileImage: picture,
            provider
          }
        );

        // Store backend JWT if provided (ALWAYS store token first)
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        // Store user data from backend response
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

        // Only call onLoginSuccess after token and user are set
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
