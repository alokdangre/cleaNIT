import { fileToDataURL, readStoredAuth, persistAuth, readMockComplaints, writeMockComplaints, normalizeComplaint, mapStatusToDisplay, toReportRow, buildAuthHeaders, parseJsonResponse } from '../utils/helpers.js';

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3000").replace(/\/$/, "");
const MOCK = import.meta.env.VITE_USE_MOCK === "1";

const api = {
  async studentLogin({ username, password }) {
    if (MOCK) {
      return {
        token: "demo",
        user: { id: "stu-001", username: username || "student", role: "student" },
      };
    }
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
    if (MOCK) {
      return {
        token: "demo",
        user: { id: "adm-001", username: username || "employee", role: "employee" },
      };
    }
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
    if (MOCK) {
      return {
        token: "demo",
        user: { id: "stu-001", username, role: "student" },
      };
    }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role: "student", profile }),
    });
    return parseJsonResponse(res, "Registration failed");
  },
  async adminRegister({ username, password, profile }) {
    if (MOCK) {
      return {
        token: "demo",
        user: { id: "adm-001", username, role: "employee" },
      };
    }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role: "employee", profile }),
    });
    return parseJsonResponse(res, "Registration failed");
  },
  async listStudentComplaints({ token }) {
    if (!token && !MOCK) throw new Error("Missing authentication token");

    if (MOCK) {
      const auth = readStoredAuth();
      const username = auth?.user?.username;
      const complaints = readMockComplaints()
        .filter((row) => !username || row.studentId === username)
        .map((row) => normalizeComplaint(row))
        .filter(Boolean);
      return { complaints, message: complaints.length ? null : "No complaints yet" };
    }

    try {
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
    } catch (err) {
      console.warn("Unable to load student complaints", err);
      return { complaints: [], message: "Unable to load complaints" };
    }
  },
  async submitComplaint({ token, area, rollNo, description, proofImg }) {
    if (!MOCK) {
      if (!token) throw new Error("Missing authentication token");
      if (!area) throw new Error("Area is required");
      if (!rollNo) throw new Error("Roll number is required");
      if (!proofImg) throw new Error("Proof image is required");
    }

    if (MOCK) {
      const id = `cmp-${Date.now()}`;
      const url = proofImg ? await fileToDataURL(proofImg) : "";
      const complaint = {
        _id: id,
        area,
        studentId: rollNo,
        description,
        status: "pending",
        url,
        createdAt: new Date().toISOString(),
      };
      const rows = readMockComplaints();
      rows.unshift(complaint);
      writeMockComplaints(rows);
      return {
        message: "Complaint saved (mock)",
        complaint: normalizeComplaint(complaint),
      };
    }

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
    if (!MOCK && !token) throw new Error("Missing authentication token");

    if (MOCK) {
      const rows = readMockComplaints();
      const idx = rows.findIndex((row) => (row.status || "pending").toLowerCase() === "pending");
      if (idx === -1) {
        return { message: "No pending complaints for your area." };
      }
      rows[idx].status = "assigned";
      rows[idx].assignedTo = "mock-employee";
      rows[idx].updatedAt = new Date().toISOString();
      writeMockComplaints(rows);
      return { message: "Mock task assigned", complaint: normalizeComplaint(rows[idx]) };
    }

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
    if (!MOCK) {
      if (!token) throw new Error("Missing authentication token");
      if (!complaintId) throw new Error("Complaint ID required");
      if (!cleanedImg) throw new Error("Cleaned image is required");
    }

    if (MOCK) {
      if (!cleanedImg) throw new Error("Cleaned image is required");
      const rows = readMockComplaints();
      const idx = rows.findIndex((row) => String(row._id) === String(complaintId));
      if (idx === -1) throw new Error("Complaint not found.");
      const cleanedUrl = await fileToDataURL(cleanedImg);
      rows[idx].status = "completed";
      rows[idx].cleanedImgUrl = cleanedUrl;
      rows[idx].resolvedAt = new Date().toISOString();
      rows[idx].cleanlinessScore = 90 + Math.floor(Math.random() * 10);
      writeMockComplaints(rows);
      return {
        message: "Work submitted (mock)",
        complaintId: rows[idx]._id,
        cleanlinessScore: rows[idx].cleanlinessScore,
        resolvedAt: rows[idx].resolvedAt,
        complaint: normalizeComplaint(rows[idx]),
      };
    }

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
    if (!token && !MOCK) throw new Error("Missing authentication token");

    if (MOCK) {
      const complaints = readMockComplaints()
        .map((row) => normalizeComplaint(row))
        .filter(Boolean);
      return { complaints, message: complaints.length ? null : "No complaints available" };
    }

    try {
      const res = await fetch(`${API_BASE}/employee/dashboard`, {
        method: "GET",
        headers: buildAuthHeaders(token),
      });
      const data = await parseJsonResponse(res, "Failed to load complaints");
      let complaints = [];
      if (Array.isArray(data?.complaints)) {
        complaints = data.complaints.map((item) => normalizeComplaint(item)).filter(Boolean);
      } else if (Array.isArray(data?.assignedComplaints)) {
        complaints = data.assignedComplaints.map((item) => normalizeComplaint(item)).filter(Boolean);
      }
      return { complaints, message: data?.message || null };
    } catch (err) {
      console.warn("Unable to load employee complaints", err);
      return { complaints: [], message: "Unable to load complaints" };
    }
  },
  async runComparison({ token, imageUrl }) {
    if (!MOCK && !token) throw new Error("Missing authentication token");
    if (!MOCK && !imageUrl) throw new Error("Image URL required for comparison");

    if (MOCK) {
      return { output: "Mock comparison complete" };
    }

    const res = await fetch(`${API_BASE}/roboflow/analyze`, {
      method: "POST",
      headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ imageUrl }),
    });
    return parseJsonResponse(res, "AI comparison failed");
  },
  async getProfile({ token }) {
    if (!MOCK) {
      if (!token) throw new Error("Missing authentication token");
    }

    if (MOCK) {
      const auth = readStoredAuth();
      if (!auth) throw new Error("Not logged in");
      return { message: "Mock profile", user: auth.user };
    }

    const res = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      headers: buildAuthHeaders(token),
    });
    return parseJsonResponse(res, "Failed to fetch profile");
  },
};

export default api;
