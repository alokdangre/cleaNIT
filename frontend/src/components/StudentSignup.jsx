import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/index.js";

function StudentSignup({ showToast, onAuth }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username || !password || !rollNumber || !name || !email) return showToast("All fields are required");
    try {
      setLoading(true);
      const profile = { rollNumber, name, email };
      const data = await api.studentRegister({ username, password, profile });
      onAuth?.(data);
      showToast("Registered and logged in as Student");
      navigate("/student");
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 520, margin: "auto" }}>
      <div className="title">Student Signup</div>
      <div className="muted">Create your student account.</div>
      <div className="section">
        <label>Username</label>
        <input className="input" placeholder="student123" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label>Password</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label>Roll Number</label>
        <input className="input" placeholder="123CS4567" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
        <label>Name</label>
        <input className="input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Email</label>
        <input className="input" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex">
        <button className="btn success" onClick={onSubmit} disabled={loading}>{loading ? "Signing up..." : "Signup"}</button>
        <a className="btn ghost" href="/">Back</a>
      </div>
    </section>
  );
}

export default StudentSignup;
