import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/index.js";

function AdminSignup({ showToast, onAuth }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [areaAssigned, setAreaAssigned] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username || !password || !name || !phoneNumber || !areaAssigned) return showToast("All fields are required");
    try {
      setLoading(true);
      const profile = { name, phoneNumber, areaAssigned };
      const data = await api.adminRegister({ username, password, profile });
      onAuth?.(data);
      showToast("Registered and logged in as Admin");
      navigate("/admin");
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 520, margin: "auto" }}>
      <div className="title">Admin Signup</div>
      <div className="muted">Create your employee account.</div>
      <div className="section">
        <label>Username</label>
        <input className="input" placeholder="employee123" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label>Password</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label>Name</label>
        <input className="input" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Phone Number</label>
        <input className="input" placeholder="+91 9876543210" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        <label>Area Assigned</label>
        <input className="input" placeholder="Hostel-1, Block-A" value={areaAssigned} onChange={(e) => setAreaAssigned(e.target.value)} />
      </div>
      <div className="flex">
        <button className="btn primary" onClick={onSubmit} disabled={loading}>{loading ? "Signing up..." : "Signup"}</button>
        <a className="btn ghost" href="/">Back</a>
      </div>
    </section>
  );
}

export default AdminSignup;
