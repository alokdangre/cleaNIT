import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/index.js";

const STUDENT_SIGNUP_FIELDS = [
  { key: "rollNumber", label: "Roll Number", placeholder: "123CS4567", type: "text" },
  { key: "name", label: "Full Name", placeholder: "Riya Sharma", type: "text" },
  { key: "email", label: "Institute Email", placeholder: "riya@nitrkl.ac.in", type: "email" },
];

const EMPLOYEE_SIGNUP_FIELDS = [
  { key: "name", label: "Full Name", placeholder: "John Doe", type: "text" },
  { key: "phoneNumber", label: "Phone Number", placeholder: "+91 98765 43210", type: "tel" },
  { key: "areaAssigned", label: "Area Assigned", placeholder: "Hall-2 | Academic Block", type: "text" },
];

function AuthPortal({ auth, showToast, onAuth }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | signup
  const [role, setRole] = useState("student"); // student | employee
  const [form, setForm] = useState({
    username: "",
    password: "",
    rollNumber: "",
    name: "",
    email: "",
    phoneNumber: "",
    areaAssigned: "",
  });
  const [loading, setLoading] = useState(false);

  const isStudent = role === "student";
  const isSignup = mode === "signup";

  const signupFields = useMemo(
    () => (isStudent ? STUDENT_SIGNUP_FIELDS : EMPLOYEE_SIGNUP_FIELDS),
    [isStudent]
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.username || !form.password) {
      showToast?.("Username and password are required");
      return false;
    }
    if (isSignup) {
      if (isStudent) {
        if (!form.rollNumber || !form.name || !form.email) {
          showToast?.("Please complete all student profile fields");
          return false;
        }
      } else {
        if (!form.name || !form.phoneNumber || !form.areaAssigned) {
          showToast?.("Please complete all employee profile fields");
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      let data;
      if (mode === "login") {
        if (isStudent) {
          data = await api.studentLogin({
            username: form.username.trim(),
            password: form.password,
          });
        } else {
          data = await api.adminLogin({
            username: form.username.trim(),
            password: form.password,
          });
        }
        onAuth?.(data);
        navigate(isStudent ? "/student" : "/admin");
        showToast?.(`Logged in as ${isStudent ? "Student" : "Employee"}`);
      } else {
        if (isStudent) {
          const profile = {
            rollNumber: form.rollNumber.trim(),
            name: form.name.trim(),
            email: form.email.trim(),
          };
          data = await api.studentRegister({
            username: form.username.trim(),
            password: form.password,
            profile,
          });
          onAuth?.(data);
          navigate("/student");
          showToast?.("Registered and logged in as Student");
        } else {
          const profile = {
            name: form.name.trim(),
            phoneNumber: form.phoneNumber.trim(),
            areaAssigned: form.areaAssigned.trim(),
          };
          data = await api.adminRegister({
            username: form.username.trim(),
            password: form.password,
            profile,
          });
          onAuth?.(data);
          navigate("/admin");
          showToast?.("Registered and logged in as Employee");
        }
      }
    } catch (error) {
      showToast?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (targetMode) => {
    setMode(targetMode);
  };

  const toggleRole = (targetRole) => {
    setRole(targetRole);
  };

  return (
    <section className="auth-panel">
      <div className="panel" style={{ maxWidth: 580, margin: "auto" }}>
        <div className="auth-header">
          <div className="pill">Secure access</div>
          <h2>{mode === "login" ? "Welcome back" : "Join CleanSpot"}</h2>
          <p className="muted">
            {mode === "login"
              ? "Sign in to report complaints or manage campus cleanliness."
              : "Create an account to start reporting or resolving complaints."}
          </p>
        </div>

        <div className="auth-switch">
          <div className="switch-group">
            <button
              type="button"
              className={`switch ${role === "student" ? "active" : ""}`}
              onClick={() => toggleRole("student")}
            >
              Student
            </button>
            <button
              type="button"
              className={`switch ${role === "employee" ? "active" : ""}`}
              onClick={() => toggleRole("employee")}
            >
              Employee
            </button>
          </div>
          <div className="switch-group">
            <button
              type="button"
              className={`switch ${mode === "login" ? "active" : ""}`}
              onClick={() => toggleMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              className={`switch ${mode === "signup" ? "active" : ""}`}
              onClick={() => toggleMode("signup")}
            >
              Sign up
            </button>
          </div>
        </div>

        <div className="section">
          <label>Username</label>
          <input
            className="input"
            placeholder={isStudent ? "student123" : "employee123"}
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
          />
          <label>Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />

          {isSignup && (
            <div className="grid" style={{ gap: 12, marginTop: 12 }}>
              {signupFields.map((field) => (
                <div key={field.key}>
                  <label>{field.label}</label>
                  <input
                    className="input"
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="auth-footer">
          <button
            type="button"
            className={`btn ${mode === "signup" ? "primary" : "success"}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "Processing..."
                : "Creating account..."
              : mode === "login"
              ? `Log in as ${isStudent ? "Student" : "Employee"}`
              : `Sign up as ${isStudent ? "Student" : "Employee"}`}
          </button>
          <a className="btn ghost" href="/">Back to home</a>
        </div>
      </div>
    </section>
  );
}

export default AuthPortal;
