import React, { useState, useCallback, useEffect, useMemo } from "react";
import api from "../api/index.js";
import { fmtDate, toReportRow } from "../utils/helpers.js";

function AdminDashboard({ showToast, auth, onLogout }) {
  const [tab, setTab] = useState("all");
  const [allReports, setAllReports] = useState(null); // null=loading
  const [tick, setTick] = useState(0); // bump to refresh
  const token = auth?.token || null;
  const [listMessage, setListMessage] = useState("");

  if (!token) {
    return (
      <section className="panel">
        <div className="title">Admin Panel</div>
        <div className="muted">Please log in as an employee to manage complaints.</div>
        <div className="section">
          <a className="btn" href="#admin-login">Go to Admin Login</a>
        </div>
      </section>
    );
  }

  const loadAll = useCallback(async () => {
    setAllReports(null);
    setListMessage("");
    try {
      const { complaints, message } = await api.listEmployeeComplaints({ token });
      const rows = (complaints || []).map((item) => toReportRow(item)).filter(Boolean);
      setAllReports(rows);
      setListMessage(message || "");
    } catch (e) {
      console.warn(e);
      showToast(e.message);
      setAllReports([]);
      setListMessage(e.message || "Unable to load complaints");
    }
  }, [token, showToast]);

  useEffect(() => { loadAll(); }, [loadAll, tick, tab]);

  const onTake = async (id) => {
    try {
      await api.receiveComplaint({ token });
      showToast("Task assigned to you");
      setTick((x) => x + 1);
    } catch (e) { showToast(e.message); }
  };

  const onUploadAfter = async (id, file) => {
    if (!file) return;
    try {
      await api.submitWork({ token, complaintId: id, description: "Uploaded AFTER image", cleanedImg: file });
      showToast("AFTER uploaded");
      setTick((x) => x + 1);
    } catch (e) { showToast(e.message); }
  };

  const onCompare = async (id) => {
    try {
      const target = allReports?.find((row) => row.id === id);
      if (!target?.afterUrl) {
        throw new Error("Upload an AFTER photo before running AI compare");
      }
      await api.runComparison({ token, imageUrl: target.afterUrl });
      showToast("AI compared");
      setTick((x) => x + 1);
    } catch (e) { showToast(e.message); }
  };

  const pastReports = useMemo(() => {
    if (!allReports) return null;
    return allReports.filter((r) => r.status === "CLEANED");
  }, [allReports]);

  return (
    <section className="panel">
      <div className="flex">
        <div>
          <div className="title">Admin Panel</div>
          <div className="muted">Pick tasks, upload AFTER photos, and view past work.</div>
        </div>
        <span className="right helper">
          <button className="btn ghost" onClick={onLogout}>Logout</button>
        </span>
      </div>

      <div className="tabs section">
        <div className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")} data-tab="all">All Complaints</div>
        <div className={`tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")} data-tab="past">Past Work</div>
      </div>

      {tab === "all" && (
        <div id="tab-all">
          {allReports === null && <div className="section helper">Loading...</div>}
          {listMessage && allReports && allReports.length === 0 && <div className="helper">{listMessage}</div>}
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
    </section>
  );
}

export default AdminDashboard;
