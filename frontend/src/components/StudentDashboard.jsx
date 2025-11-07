import React, { useState, useCallback, useEffect } from "react";
import api from "../api/index.js";
import { fmtDate, fileToDataURL, toReportRow } from "../utils/helpers.js";

function StudentDashboard({ showToast, auth, onLogout }) {
  const [rollNumber, setRollNumber] = useState(() => auth?.user?.username || "");
  const [locationVal, setLocationVal] = useState("");
  const [description, setDescription] = useState("");
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforeUrl, setBeforeUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null); // null = loading, [] = no data
  const [historyMessage, setHistoryMessage] = useState("");
  const token = auth?.token || null;
  if (!token) {
    return (
      <section className="panel">
        <div className="title">Student Dashboard</div>
        <div className="muted">Please log in again to view your complaints.</div>
        <div className="section">
          <a className="btn" href="#student-login">Go to Student Login</a>
        </div>
      </section>
    );
  }

  const refreshHistory = useCallback(async () => {
    setHistory(null);
    setHistoryMessage("");
    try {
      const { complaints, message } = await api.listStudentComplaints({ token });
      const rows = (complaints || []).map((item) => toReportRow(item)).filter(Boolean);
      setHistory(rows);
      setHistoryMessage(message || "");
    } catch (e) {
      console.warn(e);
      setHistory([]);
      setHistoryMessage(e.message || "Unable to load complaints");
      showToast(e.message);
    }
  }, [token, showToast]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

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
    if (!rollNumber.trim()) return showToast("Roll number is required");
    if (!locationVal || !beforeFile) return showToast("Location and image are required");
    try {
      setLoading(true);
      const response = await api.submitComplaint({
        token,
        area: locationVal.trim(),
        rollNo: rollNumber.trim(),
        description: description.trim(),
        proofImg: beforeFile,
      });
      showToast("Complaint submitted");
      setLocationVal("");
      setDescription("");
      setBeforeFile(null);
      setBeforeUrl("");
      if (response?.complaint) {
        setHistory((prev) => {
          const next = [toReportRow(response.complaint), ...(prev || []).filter(Boolean)];
          return next.filter(Boolean);
        });
      } else {
        await refreshHistory();
      }
      setHistoryMessage(response?.message || "");
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="flex">
        <div>
          <div className="title">Student Dashboard</div>
          <div className="muted">Upload a new complaint and track your history.</div>
        </div>
        <span className="right helper">
          <button className="btn ghost" onClick={onLogout}>Logout</button>
        </span>
      </div>

      <div className="split section">
        <div className="card">
          <div className="title">New Complaint</div>
          <div className="muted" style={{ marginBottom: 10 }}>Add roll number, location & BEFORE photo</div>
          <label>Roll Number</label>
          <input className="input" placeholder="123CS4567" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
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
            {historyMessage && history && history.length === 0 && <div className="helper">{historyMessage}</div>}
            {history && history.length === 0 && <div className="helper">No complaints yet</div>}
            {history && history.length > 0 && (
              history.map((r) => (
                <div className="row" key={r.id}>
                  <img className="thumb" src={r.beforeUrl || "https://via.placeholder.com/120x84?text=Before"} alt="before" />
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
    </section>
  );
}

export default StudentDashboard;
