import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentSession } from "../services/supabaseClient";
import axios from "axios";

const OAuth2RedirectHandler = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing OAuth login...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get Supabase session
        const session = await getCurrentSession();
        
        if (!session) {
          throw new Error("No session found");
        }

        const user = session.user;
        
        // Send Supabase session to backend to verify and get our own JWT
        const response = await axios.post(
          "http://localhost:8080/api/auth/oauth/callback",
          {
            supabaseAccessToken: session.access_token,
            email: user.email,
            firstName: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name || "User",
            lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
            profileImage: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
            provider: user.app_metadata?.provider || "supabase"
          }
        );

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

        if (typeof onLoginSuccess === "function") {
          onLoginSuccess();
        }
        
        // Store backend JWT if provided
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
