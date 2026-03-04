import { useState } from "react";
import "../css/RegisterPage.css";
import logo from "../assets/logo1.png";
import { handleRegister } from "../scripts/Register";

function RegisterPage({ onShowLogin }) {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submitForm = (e) => {
    handleRegister(e, {
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    });
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
            G Sign up with Google
          </button>

          <p className="signin-text">
            Already have an account? <span onClick={() => onShowLogin && onShowLogin()}>Sign in</span>
          </p>

        </form>

      </div>

    </div>
  );
}

export default RegisterPage;