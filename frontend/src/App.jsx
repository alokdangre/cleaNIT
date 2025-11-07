import React, { useEffect, useState, useCallback } from "react";
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

const KNOWN_ROUTES = new Set(["", "#student-login", "#admin-login", "#student-signup", "#admin-signup", "#student", "#admin"]);

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

  // ===== Hash Router =====
  const [route, setRoute] = useState(() => window.location.hash || "");
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
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
    window.location.hash = "";
  }, [showToast]);

  return (
    <div>
      <Header />
      <main className="container">
        {route === "" && <Landing />}
        {route === "#student-login" && <StudentLogin showToast={showToast} onAuth={updateAuth} />}
        {route === "#admin-login" && <AdminLogin showToast={showToast} onAuth={updateAuth} />}
        {route === "#student-signup" && <StudentSignup showToast={showToast} onAuth={updateAuth} />}
        {route === "#admin-signup" && <AdminSignup showToast={showToast} onAuth={updateAuth} />}
        {route === "#student" && <StudentDashboard showToast={showToast} auth={auth} onLogout={logout} />}
        {route === "#admin" && <AdminDashboard showToast={showToast} auth={auth} onLogout={logout} />}
        {!KNOWN_ROUTES.has(route) && <NotFound />}
      </main>
      <div className={`toast ${showToastFlag ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
