import React, { useEffect, useMemo, useState, useCallback } from "react";

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

  return (
    <div>
      <StyleBlock />
      <Header />
      <main className="container">
        {route === "" && <Landing />}
        {route === "#student-login" && <StudentLogin showToast={showToast} />}
        {route === "#admin-login" && <AdminLogin showToast={showToast} />}
        {route === "#student" && <StudentDashboard showToast={showToast} />}
        {route === "#admin" && <AdminDashboard showToast={showToast} />}
        {!("#", "#student-login", "#admin-login", "#student", "#admin").includes(route) && (
          <NotFound />
        )}
      </main>
      <div className={`toast ${showToastFlag ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

/*************************
 * Shared UI
 *************************/
function Header() {
  return (
    <header>
      <div className="nav container">
        <div className="brand">
          <div className="logo" aria-hidden>🧹</div>
          <div>
            <div className="tag">CleanSpot · NIT Rourkela</div>
            <div className="helper">Report → Clean → Verify</div>
          </div>
        </div>
        <div className="flex">
          <a href="#student-login" className="btn">Student Login</a>
          <a href="#admin-login" className="btn primary">Admin Login</a>
        </div>
      </div>
    </header>
  );
}

function SectionPanel({ children, style }) {
  return (
    <section className="panel" style={style}>{children}</section>
  );
}

function NotFound() {
  return (
    <SectionPanel>
      <div className="title">404</div>
      <div className="muted">Page not found</div>
    </SectionPanel>
  );
}

function Landing() {
  return (
    <SectionPanel>
      <div className="grid grid-3">
        <div className="card">
          <div className="title">📸 Report dirty spots</div>
          <div className="muted">Upload location + BEFORE photo. Help keep the campus clean.</div>
        </div>
        <div className="card">
          <div className="title">🧑‍🔧 Clean & verify</div>
          <div className="muted">Admins/Social workers pick tasks, clean, and upload AFTER photos.</div>
        </div>
        <div className="card">
          <div className="title">🤖 AI comparison</div>
          <div className="muted">Backend AI compares images and quantifies cleanliness improvement.</div>
        </div>
      </div>
      <div className="section flex">
        <a className="btn" href="#student-login">Go to Student</a>
        <a className="btn primary" href="#admin-login">Go to Admin</a>
      </div>
    </SectionPanel>
  );
}

/*************************
 * API (Mockable)
 *************************/
const API_BASE = "";
const MOCK = true; // Toggle to false when wiring to backend

const api = {
  async studentLogin({ email, password }) {
    if (MOCK) {
      localStorage.setItem("student", JSON.stringify({ id: "stu-001", name: "Student", email }));
      return { token: "demo", student: { id: "stu-001", name: "Student", email } };
    }
    const res = await fetch(`${API_BASE}/auth/student/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },
  async adminLogin({ email, password }) {
    if (MOCK) {
      localStorage.setItem("admin", JSON.stringify({ id: "adm-001", name: "Admin", email }));
      return { token: "demo", admin: { id: "adm-001", name: "Admin", email } };
    }
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },
  async createReport({ location, description, beforeFile }) {
    if (MOCK) {
      const all = JSON.parse(localStorage.getItem("reports") || "[]");
      const student = JSON.parse(localStorage.getItem("student"));
      const id = "r" + (all.length + 1).toString().padStart(3, "0");
      const now = new Date().toISOString();
      const url = await fileToDataURL(beforeFile);
      const row = {
        id,
        studentId: student?.id,
        location,
        description,
        beforeUrl: url,
        afterUrl: null,
        status: "PENDING",
        createdAt: now,
        assignedTo: null,
        cleanedAt: null,
        ai: null,
      };
      all.push(row);
      localStorage.setItem("reports", JSON.stringify(all));
      return row;
    }
    const fd = new FormData();
    fd.append("location", location);
    fd.append("description", description);
    fd.append("beforeImage", beforeFile);
    const res = await fetch(`${API_BASE}/student/reports`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Failed to submit");
    return res.json();
  },
  async listStudentReports() {
    if (MOCK) {
      const student = JSON.parse(localStorage.getItem("student"));
      const all = JSON.parse(localStorage.getItem("reports") || "[]");
      return all
        .filter((r) => r.studentId === student?.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    const res = await fetch(`${API_BASE}/student/reports`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
  async listAdminReports() {
    if (MOCK) {
      const all = JSON.parse(localStorage.getItem("reports") || "[]");
      return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    const res = await fetch(`${API_BASE}/admin/reports`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
  async assignReport(id) {
    if (MOCK) {
      const admin = JSON.parse(localStorage.getItem("admin"));
      const all = JSON.parse(localStorage.getItem("reports") || "[]");
      const i = all.findIndex((r) => r.id === id);
      if (i >= 0) {
        all[i].assignedTo = admin?.id;
        all[i].status = "IN_PROGRESS";
        localStorage.setItem("reports", JSON.stringify(all));
        return all[i];
      }
      throw new Error("Not found");
    }
    const res = await fetch(`${API_BASE}/admin/reports/${id}/assign`, { method: "POST" });
    if (!res.ok) throw new Error("Assign failed");
    return res.json();
  },
  async uploadAfter(id, file) {
    if (MOCK) {
      const url = await fileToDataURL(file);
      const all = JSON.parse(localStorage.getItem("reports") || "[]");
      const i = all.findIndex((r) => r.id === id);
      if (i >= 0) {
        all[i].afterUrl = url;
        all[i].status = "CLEANED";
        all[i].cleanedAt = new Date().toISOString();
        localStorage.setItem("reports", JSON.stringify(all));
        return all[i];
      }
      throw new Error("Not found");
    }
    const fd = new FormData();
    fd.append("afterImage", file);
    const res = await fetch(`${API_BASE}/admin/reports/${id}/after`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
  async runCompare(id) {
    if (MOCK) {
      const all = JSON.parse(localStorage.getItem("reports") || "[]");
      const i = all.findIndex((r) => r.id === id);
      if (i >= 0) {
        all[i].ai = {
          cleanedPercent: 80 + Math.floor(Math.random() * 15),
          summary: "AI: Significant trash reduction detected.",
        };
        localStorage.setItem("reports", JSON.stringify(all));
        return all[i].ai;
      }
      throw new Error("Not found");
    }
    const res = await fetch(`${API_BASE}/admin/reports/${id}/compare`, { method: "POST" });
    if (!res.ok) throw new Error("Compare failed");
    return res.json();
  },
};

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

/*************************
 * Auth Views
 *************************/
function StudentLogin({ showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return showToast("Email & password required");
    try {
      setLoading(true);
      await api.studentLogin({ email, password });
      showToast("Logged in as Student");
      window.location.hash = "#student";
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionPanel style={{ maxWidth: 520, margin: "auto" }}>
      <div className="title">Student Login</div>
      <div className="muted">Use your institute email to continue.</div>
      <div className="section">
        <label>Email</label>
        <input className="input" placeholder="23CS01001@nitrkl.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label style={{ marginTop: 10 }}>Password</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex">
        <button className="btn success" onClick={onSubmit} disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        <a className="btn ghost" href="#">Back</a>
      </div>
    </SectionPanel>
  );
}

function AdminLogin({ showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return showToast("Email & password required");
    try {
      setLoading(true);
      await api.adminLogin({ email, password });
      showToast("Logged in as Admin");
      window.location.hash = "#admin";
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionPanel style={{ maxWidth: 520, margin: "auto" }}>
      <div className="title">Admin Login</div>
      <div className="muted">Admins/Social Workers only.</div>
      <div className="section">
        <label>Email</label>
        <input className="input" placeholder="clean-team@nitrkl.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label style={{ marginTop: 10 }}>Password</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex">
        <button className="btn primary" onClick={onSubmit} disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        <a className="btn ghost" href="#">Back</a>
      </div>
    </SectionPanel>
  );
}

/*************************
 * Student Dashboard
 *************************/
function StudentDashboard({ showToast }) {
  const [locationVal, setLocationVal] = useState("");
  const [description, setDescription] = useState("");
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforeUrl, setBeforeUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null); // null = loading, [] = no data

  const loadHistory = useCallback(async () => {
    setHistory(null);
    try {
      const data = await api.listStudentReports();
      setHistory(data);
    } catch (e) {
      setHistory([]);
      showToast(e.message);
    }
  }, [showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onSelectBefore = (file) => {
    if (!file) {
      setBeforeFile(null);
      setBeforeUrl("");
      return;
    }
    setBeforeFile(file);
    const url = URL.createObjectURL(file);
    setBeforeUrl(url);
  };

  const onSubmit = async () => {
    if (!locationVal || !beforeFile) return showToast("Location and image are required");
    try {
      setLoading(true);
      await api.createReport({ location: locationVal.trim(), description: description.trim(), beforeFile });
      showToast("Complaint submitted");
      setLocationVal("");
      setDescription("");
      setBeforeFile(null);
      setBeforeUrl("");
      await loadHistory();
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionPanel>
      <div className="flex">
        <div>
          <div className="title">Student Dashboard</div>
          <div className="muted">Upload a new complaint and track your history.</div>
        </div>
        <span className="right helper"><a className="btn" href="#">Logout</a></span>
      </div>

      <div className="split section">
        <div className="card">
          <div className="title">New Complaint</div>
          <div className="muted" style={{ marginBottom: 10 }}>Add location & BEFORE photo</div>
          <label>Location</label>
          <input className="input" placeholder="Hall-4 back gate" value={locationVal} onChange={(e) => setLocationVal(e.target.value)} />
          <label>Description</label>
          <input className="input" placeholder="Overflowing bin, smells bad" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label>BEFORE Photo</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => onSelectBefore(e.target.files?.[0])} />
          <div className="preview" id="before-prev">
            {beforeUrl ? <img alt="preview" src={beforeUrl} /> : <span>No image selected</span>}
          </div>
          <div className="section">
            <button className="btn success" id="submit" onClick={onSubmit} disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
          </div>
        </div>

        <div className="card">
          <div className="title">Past History</div>
          <div className="muted">Your previous complaints</div>
          <div className="section list" id="history">
            {history === null && <div className="helper">Loading...</div>}
            {history && history.length === 0 && <div className="helper">No complaints yet</div>}
            {history && history.length > 0 && (
              history.map((r) => (
                <div className="row" key={r.id}>
                  <img className="thumb" src={r.beforeUrl} alt="before" />
                  <div>
                    <div className="flex">
                      <strong>{r.location}</strong>
                      <span className="right helper">{fmtDate(r.createdAt)}</span>
                    </div>
                    <div className="helper">{r.description || ""}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`status ${r.status === "PENDING" ? "pending" : r.status === "IN_PROGRESS" ? "progress" : "cleaned"}`}>{r.status}</span>
                      {r.ai && <span className="status cleaned" style={{ marginLeft: 6 }}>AI: {r.ai.cleanedPercent}% cleaner</span>}
                    </div>
                  </div>
                  {r.afterUrl ? (
                    <img className="thumb" src={r.afterUrl} alt="after" />
                  ) : (
                    <div className="helper">AFTER pending</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}

/*************************
 * Admin Dashboard
 *************************/
function AdminDashboard({ showToast }) {
  const [tab, setTab] = useState("all");
  const [allReports, setAllReports] = useState(null); // null=loading
  const [tick, setTick] = useState(0); // bump to refresh

  const admin = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("admin")); } catch { return null; }
  }, []);

  const loadAll = useCallback(async () => {
    setAllReports(null);
    try {
      const data = await api.listAdminReports();
      setAllReports(data);
    } catch (e) {
      showToast(e.message);
      setAllReports([]);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll, tick, tab]);

  const onTake = async (id) => {
    try {
      await api.assignReport(id);
      showToast("Task assigned to you");
      setTick((x) => x + 1);
    } catch (e) { showToast(e.message); }
  };

  const onUploadAfter = async (id, file) => {
    if (!file) return;
    try {
      await api.uploadAfter(id, file);
      showToast("AFTER uploaded");
      setTick((x) => x + 1);
    } catch (e) { showToast(e.message); }
  };

  const onCompare = async (id) => {
    try {
      await api.runCompare(id);
      showToast("AI compared");
      setTick((x) => x + 1);
    } catch (e) { showToast(e.message); }
  };

  const pastReports = useMemo(() => {
    if (!allReports) return null;
    return allReports.filter((r) => r.status === "CLEANED" && r.assignedTo === admin?.id);
  }, [allReports, admin]);

  return (
    <SectionPanel>
      <div className="flex">
        <div>
          <div className="title">Admin Panel</div>
          <div className="muted">Pick tasks, upload AFTER photos, and view past work.</div>
        </div>
        <span className="right helper"><a className="btn" href="#">Logout</a></span>
      </div>

      <div className="tabs section">
        <div className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")} data-tab="all">All Complaints</div>
        <div className={`tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")} data-tab="past">Past Work</div>
      </div>

      {tab === "all" && (
        <div id="tab-all">
          {allReports === null && <div className="section helper">Loading...</div>}
          {allReports && allReports.length === 0 && <div className="helper">No reports</div>}
          {allReports && allReports.length > 0 && (
            <div className="list section">
              {allReports.map((r) => (
                <div className="card" key={r.id}>
                  <div className="row" style={{ gridTemplateColumns: "160px 1fr auto", alignItems: "start" }}>
                    <img className="thumb" style={{ width: 160, height: 110 }} src={r.beforeUrl} alt="before" />
                    <div>
                      <div className="flex">
                        <strong>{r.location}</strong>
                        <span className="right helper">{fmtDate(r.createdAt)}</span>
                      </div>
                      <div className="helper">{r.description || ""}</div>
                      <div style={{ marginTop: 6 }}>
                        <span className={`status ${r.status === "PENDING" ? "pending" : r.status === "IN_PROGRESS" ? "progress" : "cleaned"}`}>{r.status}</span>
                        {r.assignedTo && <span className="status" style={{ marginLeft: 6 }}>Assigned</span>}
                        {r.ai && <span className="status cleaned" style={{ marginLeft: 6 }}>AI: {r.ai.cleanedPercent}%</span>}
                      </div>
                    </div>
                    <div className="flex" style={{ flexDirection: "column", gap: 8 }}>
                      {r.status === "PENDING" && (
                        <button className="btn" onClick={() => onTake(r.id)}>Take Task</button>
                      )}
                      {r.status !== "CLEANED" && (
                        <label className="btn" style={{ cursor: "pointer" }}>
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onUploadAfter(r.id, e.target.files?.[0])} />
                          Upload AFTER
                        </label>
                      )}
                      {r.afterUrl && (
                        <button className="btn" onClick={() => onCompare(r.id)}>Run AI Compare</button>
                      )}
                    </div>
                  </div>
                  {r.afterUrl && (
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                      <img className="thumb" style={{ width: "100%", height: 160 }} src={r.afterUrl} alt="after" />
                      <div className="helper">After uploaded {fmtDate(r.cleanedAt || "")}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "past" && (
        <div id="tab-past">
          {pastReports === null && <div className="section helper">Loading...</div>}
          {pastReports && pastReports.length === 0 && <div className="helper">No completed work yet</div>}
          {pastReports && pastReports.length > 0 && (
            <div className="list section">
              {pastReports.map((r) => (
                <div className="row" key={r.id}>
                  <img className="thumb" src={r.beforeUrl} alt="before" />
                  <div>
                    <div className="flex">
                      <strong>{r.location}</strong>
                      <span className="right helper">Cleaned: {fmtDate(r.cleanedAt || "")}</span>
                    </div>
                    <div className="helper">{r.description || ""}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className="status cleaned">CLEANED</span>
                      {r.ai && <span className="status cleaned" style={{ marginLeft: 6 }}>AI: {r.ai.cleanedPercent}%</span>}
                    </div>
                  </div>
                  <img className="thumb" src={r.afterUrl} alt="after" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionPanel>
  );
}

/*************************
 * CSS (unchanged from original)
 *************************/
function StyleBlock() {
  return (
    <style>{`
    :root{
      --bg: #0b1020;         /* deep slate */
      --panel: #0f172a;      /* slate-900 */
      --muted: #94a3b8;      /* slate-400 */
      --text: #e5e7eb;       /* gray-200 */
      --brand: #4f46e5;      /* indigo-600 */
      --brand-2:#22c55e;     /* green-500 */
      --accent:#06b6d4;      /* cyan-500 */
      --warn:#f59e0b;        /* amber-500 */
      --danger:#ef4444;      /* red-500 */
      --ring: rgba(99,102,241,.35);
      --card: #0b132f;
    }
    *{box-sizing:border-box}
    html,body,#root{height:100%}
    body{
      margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji","Segoe UI Emoji";
      background: radial-gradient(1200px 1200px at -10% -20%, rgba(79,70,229,.25), transparent 40%),
                  radial-gradient(1000px 800px at 120% 120%, rgba(34,197,94,.18), transparent 40%),
                  linear-gradient(180deg, #060913, #0a0f1f 40%, #0b1020 100%);
      color:var(--text);
    }
    a{color:inherit;text-decoration:none}
    .container{max-width:1100px;margin:0 auto;padding:24px}
    .grid{display:grid; gap:16px}
    .grid-2{grid-template-columns: repeat(2, minmax(0,1fr))}
    .grid-3{grid-template-columns: repeat(3, minmax(0,1fr))}
    @media (max-width: 880px){.grid-2,.grid-3{grid-template-columns:1fr}}

    header{
      position:sticky; top:0; z-index:5;
      backdrop-filter: blur(10px);
      background: rgba(2,6,23,.6);
      border-bottom: 1px solid rgba(148,163,184,.15);
    }
    .nav{display:flex;align-items:center;justify-content:space-between;padding:14px 24px}
    .brand{display:flex;align-items:center;gap:10px}
    .logo{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,var(--brand),var(--accent));display:grid;place-items:center;box-shadow:0 6px 20px rgba(79,70,229,.35)}
    .tag{font-weight:700}

    .btn{display:inline-flex;gap:8px;align-items:center;justify-content:center;padding:10px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.2);background:#0b1226;color:#e5e7eb;cursor:pointer;transition:.25s;box-shadow:inset 0 0 0 0 var(--ring)}
    .btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(2,6,23,.35), inset 0 0 0 2px var(--ring)}
    .btn.primary{background:linear-gradient(135deg,var(--brand),#7c3aed);border-color:transparent}
    .btn.success{background:linear-gradient(135deg,var(--brand-2),#16a34a);border-color:transparent}
    .btn.ghost{background:transparent}
    .btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:none}

    .panel{background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
           border:1px solid rgba(148,163,184,.15); border-radius:18px; padding:18px; box-shadow:0 16px 40px rgba(3,7,18,.35)}
    .card{background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
          border:1px solid rgba(148,163,184,.15); border-radius:16px; padding:14px}

    .title{font-size:22px;font-weight:700;margin:0 0 6px}
    .muted{color:var(--muted)}
    .section{margin:22px 0}

    .input, .select{width:100%;background:#0b1226;border:1px solid rgba(148,163,184,.25);border-radius:14px;padding:11px 12px;color:var(--text);outline:none}
    .input:focus, .select:focus{box-shadow:0 0 0 3px var(--ring);border-color:transparent}
    label{display:block;margin:10px 0 6px;color:var(--muted);font-size:14px}

    .kpi{display:flex;gap:14px;align-items:center}
    .kpi .dot{width:10px;height:10px;border-radius:9999px}

    .status{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid rgba(148,163,184,.25)}
    .status.pending{color:#fbbf24;border-color:rgba(251,191,36,.35)}
    .status.progress{color:#38bdf8;border-color:rgba(56,189,248,.35)}
    .status.cleaned{color:#34d399;border-color:rgba(52,211,153,.35)}

    .list{display:grid;gap:12px}
    .row{display:grid;grid-template-columns:120px 1fr auto;gap:12px;align-items:center}
    @media (max-width:680px){.row{grid-template-columns:1fr}}
    .thumb{width:120px;height:84px;border-radius:12px;object-fit:cover;background:#0b1226;border:1px solid rgba(148,163,184,.15)}

    .tabs{display:flex;gap:6px;border-bottom:1px solid rgba(148,163,184,.15);margin-bottom:12px}
    .tab{padding:10px 12px;border-radius:12px 12px 0 0;cursor:pointer;border:1px solid transparent}
    .tab.active{border:1px solid rgba(148,163,184,.25);border-bottom-color:transparent;background:#0c142a}

    .flex{display:flex;gap:12px;align-items:center}
    .right{margin-left:auto}

    .toast{position:fixed;right:18px;bottom:18px;background:#0c142a;border:1px solid rgba(148,163,184,.2);color:var(--text);padding:12px 14px;border-radius:12px;box-shadow:0 10px 30px rgba(3,7,18,.5);opacity:0;transform:translateY(10px);transition:.25s}
    .toast.show{opacity:1;transform:translateY(0)}

    .split{display:grid;grid-template-columns:1fr 1fr; gap:16px}
    @media (max-width:980px){.split{grid-template-columns:1fr}}

    .preview{width:100%;height:220px;border-radius:14px;border:1px dashed rgba(148,163,184,.35);display:grid;place-items:center;color:var(--muted);overflow:hidden}
    .preview img{width:100%;height:100%;object-fit:cover}

    .helper{font-size:12px;color:var(--muted)}
  `}</style>
  );
}
