import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/RegisterPage.css";
import logo from "../assets/logo1.png";
import { handleRegister } from "../scripts/Register";

function RegisterPage({ onShowLogin, onRegisterSuccess }) {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submitForm = async (e) => {
    const success = await handleRegister(e, {
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    });

    if (success) {
      if (typeof onRegisterSuccess === "function") {
        onRegisterSuccess();
      }
      navigate("/dashboard");
    }
  };

  return (
    <div className="register-container">

      <div className="register-card">

        <div className="register_logo">
          <img src={logo} alt="Book Log" className="logo-img" />
        </div>

        <h2>Create Account</h2>
        <p className="subtitle">Start tracking your reading journey</p>

        <form onSubmit={submitForm}>

          <input
            type="text"
            placeholder="First Name"
            className="input-field"
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Last Name"
            className="input-field"
            onChange={(e) => setLastName(e.target.value)}
          />

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

          <input
            type="password"
            placeholder="Confirm Password"
            className="input-field"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit" className="create-btn">
            Create Account
          </button>

          <button type="button" className="google-btn">
            Sign up with Google
          </button>

          <p className="signin-text">
            Already have an account? <span onClick={() => navigate("/")}>Sign in</span>
          </p>

        </form>

      </div>

    </div>
  );
}

export default RegisterPage;