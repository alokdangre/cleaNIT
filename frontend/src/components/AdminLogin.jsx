import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/index.js";

function AdminLogin({ showToast, onAuth }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username || !password) return showToast("Username & password required");
    try {
      setLoading(true);
      const data = await api.adminLogin({ username, password });
      onAuth?.(data);
      showToast("Logged in as Admin");
      navigate("/admin");
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 520, margin: "auto" }}>
      <div className="title">Admin Login</div>
      <div className="muted">Admins/Social Workers only.</div>
      <div className="section">
        <label>Username</label>
        <input className="input" placeholder="employee123" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label style={{ marginTop: 10 }}>Password</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex">
        <button className="btn primary" onClick={onSubmit} disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        <a className="btn ghost" href="/">Back</a>
      </div>
    </section>
  );
}

export default AdminLogin;
