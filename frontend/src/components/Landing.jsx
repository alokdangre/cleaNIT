import React, { useEffect, useState } from "react";
import api from "../api/index.js";

function SectionPanel({ children, style, ...props }) {
  return (
    <section className="panel" style={style} {...props}>{children}</section>
  );
}

function Landing({ auth }) {
  const [complaints, setComplaints] = useState(null); // null = loading
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadComplaints = async () => {
      try {
        const { complaints: items, message: msg } = await api.listPublicComplaints();
        if (!mounted) return;
        setComplaints(items || []);
        setMessage(msg || "");
      } catch (error) {
        if (!mounted) return;
        setComplaints([]);
        setMessage(error.message || "Unable to load complaints");
      }
    };
    loadComplaints();
    return () => {
      mounted = false;
    };
  }, []);

  const displayComplaints = (complaints || []).slice(0, 6);
  const isLoggedIn = Boolean(auth?.token);
  const role = auth?.user?.role;

  return (
    <div>
      <section className="hero" id="about">
        <div className="hero-copy">
          <span className="pill">Campus cleanliness platform</span>
          <h1>Spot. Report. See it cleaned.</h1>
          <p>
            CleanSpot connects students and maintenance staff to keep NIT Rourkela pristine. Capture issues,
            dispatch clean-up teams, and track AI-powered cleanliness scores all in one place.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href={isLoggedIn ? (role === "employee" ? "/admin" : "/student") : "/auth"}>
              {isLoggedIn ? "Go to dashboard" : "Get started"}
            </a>
            <a className="btn ghost" href="#complaints">View latest reports</a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <img src="https://images.unsplash.com/photo-1531256456869-ce942a665e80?auto=format&fit=crop&w=900&q=80" alt="Campus cleanliness" />
        </div>
      </section>

      <SectionPanel id="how-it-works">
        <div className="section-heading">How CleanSpot works</div>
        <div className="section-sub">From report to resolution, every step is transparent.</div>
        <div className="grid grid-3">
          <div className="card" style={{ textAlign: "center" }}>
            <div className="title">📸 Submit a report</div>
            <div className="muted">Students drop location details and a BEFORE photo straight from their dashboard.</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="title">🧹 Assign & clean</div>
            <div className="muted">Employees pick complaints in their zone, resolve them, and upload AFTER shots.</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="title">🤖 Measure results</div>
            <div className="muted">AI compares images, generates cleanliness scores, and closes the feedback loop.</div>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel id="complaints">
        <div className="section-heading">Latest student complaints</div>
        <div className="section-sub">Real reports submitted by the community</div>
        {complaints === null && <div className="helper" style={{ textAlign: "center" }}>Loading complaints...</div>}
        {complaints && complaints.length === 0 && (
          <div className="helper" style={{ textAlign: "center" }}>{message || "No complaints submitted yet."}</div>
        )}
        {displayComplaints.length > 0 && (
          <div className="complaints-grid">
            {displayComplaints.map((complaint) => {
              const student = complaint.student || {};
              return (
                <div className="card" key={complaint.id}>
                  <div className="title" style={{ marginBottom: 6 }}>{complaint.location || complaint.area || "Unknown area"}</div>
                  <div className="muted" style={{ marginBottom: 10 }}>{complaint.description || "No description provided."}</div>
                  <div className="helper" style={{ marginBottom: 6 }}>Status: {complaint.status}</div>
                  <div className="helper">Student: {student.username || "Anonymous"}</div>
                  <div className="helper">Roll: {student.rollNumber || complaint.studentId || "-"}</div>
                </div>
              );
            })}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

export default Landing;
