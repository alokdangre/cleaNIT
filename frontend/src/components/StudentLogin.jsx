import React, { useState } from "react";
import api from "../api/index.js";

function StudentLogin({ showToast, onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username || !password) return showToast("Username & password required");
    try {
      setLoading(true);
      const data = await api.studentLogin({ username, password });
      onAuth?.(data);
      showToast("Logged in as Student");
      window.location.hash = "#student";
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 520, margin: "auto" }}>
      <div className="title">Student Login</div>
      <div className="muted">Use your institute email to continue.</div>
      <div className="section">
        <label>Username</label>
        <input className="input" placeholder="student123" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label style={{ marginTop: 10 }}>Password</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex">
        <button className="btn success" onClick={onSubmit} disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        <a className="btn ghost" href="#">Back</a>
      </div>
    </section>
  );
}

export default StudentLogin;
