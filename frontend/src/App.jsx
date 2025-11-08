import React, { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles.css";
import Header from "./components/Header.jsx";
import Landing from "./components/Landing.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AuthPortal from "./components/AuthPortal.jsx";
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
      <Header auth={auth} onLogout={logout} />
      <main className="container">
        <Routes>
          <Route index element={<Landing auth={auth} />} />
          <Route path="/auth" element={<AuthPortal auth={auth} showToast={showToast} onAuth={updateAuth} />} />
          <Route path="/student" element={<StudentDashboard showToast={showToast} auth={auth} onLogout={logout} />} />
          <Route path="/admin" element={<AdminDashboard showToast={showToast} auth={auth} onLogout={logout} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <div className={`toast ${showToastFlag ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
