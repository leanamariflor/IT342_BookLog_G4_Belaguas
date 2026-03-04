import React, { useState } from "react";
import LoginPage from "./jsx/LoginPage";
import RegisterPage from "./jsx/RegisterPage";
import Dashboard from "./jsx/Dashboard";

function App() {
  const [view, setView] = useState("login");

  return (
    <div>
      {view === "login" && (
        <LoginPage
          onShowRegister={() => setView("register")}
          onLoginSuccess={() => setView("dashboard")}
        />
      )}

      {view === "register" && (
        <RegisterPage
          onShowLogin={() => setView("login")}
          onRegisterSuccess={() => setView("dashboard")}
        />
      )}

      {view === "dashboard" && (
        <>
          <React.Suspense fallback={<div>Loading...</div>}>
            <Dashboard onLogout={() => setView("login")} />
          </React.Suspense>
        </>
      )}
    </div>
  );
}

export default App;