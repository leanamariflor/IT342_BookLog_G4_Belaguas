import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";
import logo from "../assets/logo1.png";
import googleIcon from "../assets/google-icon.svg";
import { handleLogin } from "../scripts/Login";

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = async (e) => {
    const success = await handleLogin(e, email, password);

    if (success) {
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess();
      }
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;
  };

  return (
    <div className="login-container">

      <div className="login-card">

        <div className="login_logo">
          <img src={logo} alt="Book Log" className="logo-img" />
        </div>

        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account</p>

        <form onSubmit={submitLogin}>

          <input
            type="email"
            placeholder="Email"
            className="input-field"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="signin-btn">
            Sign In
          </button>

          <button type="button" className="google-btn" onClick={handleGoogleLogin}>
            <img src={googleIcon} alt="Google" className="google-icon" />
            <span>Login with Google</span>
          </button>

          <p className="signup-text">
            Don't have an account?  
            <span onClick={() => navigate("/register")}>
             Sign up
            </span>
          </p>

        </form>

      </div>

    </div>
  );
}

export default LoginPage;