import { useState } from "react";
import "../css/LoginPage.css";
import logo from "../assets/logo1.png";
import { handleLogin } from "../scripts/Login";

function LoginPage({ onShowRegister, onLoginSuccess }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = async (e) => {

    const success = await handleLogin(e, email, password);

    if (success && typeof onLoginSuccess === "function") {
      onLoginSuccess();
    }
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

          <button type="button" className="google-btn">
            G Login with Google
          </button>

          <p className="signup-text">
            Don't have an account? 
            <span onClick={() => onShowRegister && onShowRegister()}>
              Sign up
            </span>
          </p>

        </form>

      </div>

    </div>
  );
}

export default LoginPage;