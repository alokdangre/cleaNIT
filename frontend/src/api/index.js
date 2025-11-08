import { parseJsonResponse, buildAuthHeaders, normalizeComplaint } from '../utils/helpers.js';

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3000").replace(/\/$/, "");

const api = {
  async studentLogin({ username, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJsonResponse(res, "Login failed");
    if (data?.user?.role !== "student") {
      throw new Error("Account is not registered as a student");
    }
    return data;
  },
  async adminLogin({ username, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJsonResponse(res, "Login failed");
    if (data?.user?.role !== "employee") {
      throw new Error("Account is not registered as an employee");
    }
    return data;
  },
  async studentRegister({ username, password, profile }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role: "student", profile }),
    });
    return parseJsonResponse(res, "Registration failed");
  },
  async adminRegister({ username, password, profile }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role: "employee", profile }),
    });
    return parseJsonResponse(res, "Registration failed");
  },
  async listStudentComplaints({ token }) {
    const res = await fetch(`${API_BASE}/student/dashboard`, {
      method: "GET",
      headers: buildAuthHeaders(token),
    });
    const data = await parseJsonResponse(res, "Failed to load complaints");
    let complaints = [];
    if (Array.isArray(data?.complaints)) {
      complaints = data.complaints.map((item) => normalizeComplaint(item)).filter(Boolean);
    } else if (Array.isArray(data?.reportedComplaints)) {
      complaints = data.reportedComplaints.map((item) => normalizeComplaint(item)).filter(Boolean);
    }
    return { complaints, message: data?.message || null };
  },
  async submitComplaint({ token, area, rollNo, description, proofImg }) {
    const fd = new FormData();
    fd.append("area", area);
    fd.append("rollNo", rollNo);
    if (description) fd.append("description", description);
    fd.append("proofImg", proofImg);

    const res = await fetch(`${API_BASE}/complaint/submitComplaint`, {
      method: "POST",
      headers: buildAuthHeaders(token),
      body: fd,
    });
    const data = await parseJsonResponse(res, "Failed to submit complaint");
    return {
      message: data.message || "Complaint submitted successfully",
      complaint: normalizeComplaint(data),
    };
  },
  async receiveComplaint({ token }) {
    const res = await fetch(`${API_BASE}/complaint/receiveComplaint`, {
      method: "POST",
      headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    const data = await parseJsonResponse(res, "Unable to fetch complaint");
    return {
      message: data.message,
      complaint: normalizeComplaint(data),
    };
  },
  async submitWork({ token, complaintId, description, cleanedImg }) {
    const fd = new FormData();
    fd.append("complaintId", complaintId);
    if (description) fd.append("description", description);
    fd.append("cleanedImg", cleanedImg);

    const res = await fetch(`${API_BASE}/complaint/submitWork`, {
      method: "POST",
      headers: buildAuthHeaders(token),
      body: fd,
    });
    const data = await parseJsonResponse(res, "Failed to submit work");
    return {
      message: data.message || "Work submitted successfully",
      complaintId: data.complaintId,
      cleanlinessScore: data.cleanlinessScore,
      resolvedAt: data.resolvedAt,
    };
  },
  async listEmployeeComplaints({ token }) {
    const res = await fetch(`${API_BASE}/employee/dashboard`, {
      method: "GET",
      headers: buildAuthHeaders(token),
    });
    const data = await parseJsonResponse(res, "Failed to load complaints");
    let complaints = [];
    if (Array.isArray(data?.complaints)) {
      complaints = data.complaints;
    } else if (Array.isArray(data?.assignedComplaints)) {
      complaints = data.assignedComplaints;
    } else if (Array.isArray(data)) {
      complaints = data;
    }

    const normalized = complaints.map((item) => normalizeComplaint(item)).filter(Boolean);

    return { complaints: normalized, message: data?.message || null };
  },
  async runComparison({ token, imageUrl }) {
    const res = await fetch(`${API_BASE}/roboflow/analyze`, {
      method: "POST",
      headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ imageUrl }),
    });
    return parseJsonResponse(res, "AI comparison failed");
  },
  async getProfile({ token }) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      headers: buildAuthHeaders(token),
    });
    return parseJsonResponse(res, "Failed to fetch profile");
  },
};

export default api;
