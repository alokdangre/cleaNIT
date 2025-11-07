import React from "react";

function SectionPanel({ children, style }) {
  return (
    <section className="panel" style={style}>{children}</section>
  );
}

function Landing() {
  return (
    <SectionPanel>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div className="title" style={{ fontSize: 32, marginBottom: 10 }}>Welcome to CleanSpot</div>
        <div className="muted" style={{ fontSize: 18 }}>Keep NIT Rourkela clean together</div>
      </div>
      <div className="grid grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="title">📸 Report dirty spots</div>
          <div className="muted">Upload location + BEFORE photo. Help keep the campus clean.</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="title">🧑‍🔧 Clean & verify</div>
          <div className="muted">Admins/Social workers pick tasks, clean, and upload AFTER photos.</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="title">🤖 AI comparison</div>
          <div className="muted">Backend AI compares images and quantifies cleanliness improvement.</div>
        </div>
      </div>
      <div className="section flex" style={{ justifyContent: 'center' }}>
        <a className="btn" href="/student-login">Student Login</a>
        <a className="btn" href="/student-signup">Student Signup</a>
        <a className="btn primary" href="/admin-login">Admin Login</a>
        <a className="btn primary" href="/admin-signup">Admin Signup</a>
      </div>
    </SectionPanel>
  );
}

export default Landing;
