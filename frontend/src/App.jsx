import React, { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles.css";
import Header from "./components/Header.jsx";
import Landing from "./components/Landing.jsx";
import StudentLogin from "./components/StudentLogin.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import StudentSignup from "./components/StudentSignup.jsx";
import AdminSignup from "./components/AdminSignup.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import NotFound from "./components/NotFound.jsx";
import { readStoredAuth, persistAuth } from "./utils/helpers.js";

export default function CleanSpotApp() {
  // ===== Toast =====
  const [toast, setToast] = useState("");
  const [showToastFlag, setShowToastFlag] = useState(false);
  const showToast = useCallback((msg) => {
    setToast(msg);
    setShowToastFlag(true);
    window.clearTimeout((window)._toastT);
    (window)._toastT = window.setTimeout(() => setShowToastFlag(false), 2200);
  }, []);

  // ===== Auth =====
  const [auth, setAuth] = useState(() => readStoredAuth());

  const updateAuth = useCallback((nextAuth) => {
    persistAuth(nextAuth);
    setAuth(nextAuth);
  }, []);

  const logout = useCallback(() => {
    persistAuth(null);
    setAuth(null);
    showToast("Logged out");
  }, [showToast]);

  return (
    <div>
      <Header />
      <main className="container">
        <Routes>
          <Route index element={<Landing />} />
          <Route path="/student-login" element={<StudentLogin showToast={showToast} onAuth={updateAuth} />} />
          <Route path="/admin-login" element={<AdminLogin showToast={showToast} onAuth={updateAuth} />} />
          <Route path="/student-signup" element={<StudentSignup showToast={showToast} onAuth={updateAuth} />} />
          <Route path="/admin-signup" element={<AdminSignup showToast={showToast} onAuth={updateAuth} />} />
          <Route path="/student" element={<StudentDashboard showToast={showToast} auth={auth} onLogout={logout} />} />
          <Route path="/admin" element={<AdminDashboard showToast={showToast} auth={auth} onLogout={logout} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <div className={`toast ${showToastFlag ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
