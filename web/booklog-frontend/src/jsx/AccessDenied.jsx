import React from "react";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "28px",
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "10px" }}>Access Denied</h1>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          You do not have permission to view this page.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            border: "none",
            borderRadius: "8px",
            background: "#111",
            color: "#fff",
            padding: "10px 16px",
            cursor: "pointer"
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
