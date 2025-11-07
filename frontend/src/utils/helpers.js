export function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

export function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem("cleanspot.auth");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Unable to parse stored auth", e);
    localStorage.removeItem("cleanspot.auth");
    return null;
  }
};

export const persistAuth = (auth) => {
  if (!auth) {
    localStorage.removeItem("cleanspot.auth");
    return;
  }
  localStorage.setItem("cleanspot.auth", JSON.stringify(auth));
};

const MOCK_COMPLAINTS_KEY = "cleanspot.mockComplaints";

export const readMockComplaints = () => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || "[]");
  } catch (e) {
    console.warn("Unable to parse mock complaints", e);
    localStorage.removeItem(MOCK_COMPLAINTS_KEY);
    return [];
  }
};

export const writeMockComplaints = (rows) => {
  localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(rows));
};

export const normalizeComplaint = (raw) => {
  if (!raw) return null;
  const complaint = raw.complaint ?? raw;
  if (!complaint) return null;
  const id = complaint._id || raw.id || complaint.id || null;
  return {
    id,
    area: complaint.area || "",
    studentId: complaint.studentId || "",
    description: complaint.description || "",
    status: complaint.status || "pending",
    createdAt: complaint.createdAt || complaint.updatedAt || null,
    url: complaint.url || "",
    cleanedImgUrl: complaint.cleanedImgUrl || "",
    resolvedAt: complaint.resolvedAt || null,
    cleanlinessScore: typeof complaint.cleanlinessScore === "number" ? complaint.cleanlinessScore : null,
    assignedTo: complaint.assignedTo || null,
  };
};

export const mapStatusToDisplay = (status) => {
  const normalized = (status || "pending").toString().toLowerCase();
  if (normalized === "pending") return "PENDING";
  if (normalized === "assigned") return "IN_PROGRESS";
  if (normalized === "completed") return "CLEANED";
  return status?.toString().toUpperCase() || "PENDING";
};

export const toReportRow = (complaint) => {
  const normalized = normalizeComplaint(complaint);
  if (!normalized) return null;
  return {
    id: normalized.id || `${normalized.studentId}-${normalized.createdAt || Date.now()}`,
    location: normalized.area || "",
    description: normalized.description || "",
    createdAt: normalized.createdAt,
    status: mapStatusToDisplay(normalized.status),
    beforeUrl: normalized.url || "",
    afterUrl: normalized.cleanedImgUrl || "",
    cleanedAt: normalized.resolvedAt || null,
    ai: typeof normalized.cleanlinessScore === "number" ? { cleanedPercent: Math.round(normalized.cleanlinessScore) } : null,
    assignedTo: normalized.assignedTo || null,
    rawStatus: normalized.status || "pending",
  };
};

export const buildAuthHeaders = (token, extra = {}) => {
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const parseJsonResponse = async (res, fallbackMessage) => {
  if (!res.ok) {
    let message = fallbackMessage;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch (error) {
      /* no-op */
    }
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.json();
};
