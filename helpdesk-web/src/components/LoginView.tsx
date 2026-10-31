import React, { useState } from "react";
import { loginStaff } from "../api";
import { UserSession } from "../types";

interface Props {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"operator" | "admin">("operator");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginStaff(username.trim(), password.trim());
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: "operator" | "admin") => {
    setSelectedRole(role);
    setError(null);
    if (role === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("operator");
      setPassword("operator123");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#0B132B",
        backgroundImage: "radial-gradient(circle at 10% 20%, rgba(20, 49, 92, 0.7) 0%, rgba(11, 19, 43, 0.95) 90%)",
        padding: "32px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          maxWidth: "960px",
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Left Hero Branding Section */}
        <div
          style={{
            flex: 1.1,
            backgroundColor: "#0A1931",
            backgroundImage: "linear-gradient(145deg, #0A1931 0%, #0F284E 50%, #173868 100%)",
            color: "#FFFFFF",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Subtle Glow Accent */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              left: "-80px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(217, 119, 6, 0.25) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div>
            {/* National Seal Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.4)",
                }}
              >
                🏛️
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#F59E0B", letterSpacing: "1.2px", textTransform: "uppercase" }}>
                  Government of Andhra Pradesh / India
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.4px" }}>
                  Official Helpdesk Portal
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.3, marginBottom: "12px", color: "#F8FAFC" }}>
              Centralized Escalation & Citizen Support Console
            </h2>
            <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: 1.6, marginBottom: "28px" }}>
              Secure gateway for authorized department officers, field operators, and administrative staff to process welfare inquiries, manage Kleene rules, and audit decisions.
            </p>

            {/* Architecture Highlights */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ fontSize: "18px", padding: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "8px" }}>
                  🛡️
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>Role-Based Access Control (RBAC)</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>Bcrypt cryptographic hashes with scoped operator/admin tokens</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ fontSize: "18px", padding: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "8px" }}>
                  ⚖️
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>Kleene 3-Valued Deterministic Engine</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>Never falsely rejects citizens due to missing temporary docs</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ fontSize: "18px", padding: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "8px" }}>
                  ⚡
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>Real-Time Escalation SLA</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>Instant resolution workflow with official department notes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Status Bottom Banner */}
          <div
            style={{
              marginTop: "32px",
              padding: "12px 16px",
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="status-dot-active" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#E2E8F0" }}>Backend API Live</span>
            </div>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>FastAPI · JWT Bearer</span>
          </div>
        </div>

        {/* Right Interactive Form Section */}
        <div
          style={{
            flex: 1,
            padding: "44px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#1E3A8A",
                backgroundColor: "#EFF6FF",
                padding: "3px 10px",
                borderRadius: "9999px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Official Authentication
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "8px", marginBottom: "4px" }}>
              Staff & Officer Login
            </h1>
            <p style={{ fontSize: "14px", color: "#64748B" }}>
              సిబ్బంది అధికారిక ఖాతాతో ప్రవేశించండి
            </p>
          </div>

          {/* Interactive Role Switcher */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#F1F5F9",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleSelect("operator")}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                backgroundColor: selectedRole === "operator" ? "#FFFFFF" : "transparent",
                color: selectedRole === "operator" ? "#0F284E" : "#64748B",
                boxShadow: selectedRole === "operator" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                cursor: "pointer",
              }}
            >
              🎧 Operator
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("admin")}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                backgroundColor: selectedRole === "admin" ? "#FFFFFF" : "transparent",
                color: selectedRole === "admin" ? "#0F284E" : "#64748B",
                boxShadow: selectedRole === "admin" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                cursor: "pointer",
              }}
            >
              👑 Administrator
            </button>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Official Username
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "16px",
                    color: "#94A3B8",
                  }}
                >
                  👤
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. operator or admin"
                  style={{
                    paddingLeft: "42px",
                    height: "46px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "#1E3A8A",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "16px",
                    color: "#94A3B8",
                  }}
                >
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter authorized password"
                  style={{
                    paddingLeft: "42px",
                    height: "46px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                height: "48px",
                fontSize: "15px",
                marginTop: "6px",
              }}
            >
              {loading ? "Authenticating Credentials…" : "Sign In to Helpdesk Portal →"}
            </button>
          </form>

          {/* Quick Demo Fill Pills */}
          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              backgroundColor: "#F8FAFC",
              borderRadius: "10px",
              border: "1px dashed #CBD5E1",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ⚡ 1-Click Demo Quick Fill
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("operator");
                  setUsername("operator");
                  setPassword("operator123");
                }}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  fontSize: "12px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  color: "#0F284E",
                  fontWeight: 600,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                🎧 Operator Fill
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setUsername("admin");
                  setPassword("admin123");
                }}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  fontSize: "12px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  color: "#D97706",
                  fontWeight: 600,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                👑 Admin Fill
              </button>
            </div>
          </div>

          <p style={{ marginTop: "18px", fontSize: "11px", color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
            Authorized Government Personnel Only. Session active for 8 hours. Cryptographically verified under IT Act.
          </p>
        </div>
      </div>
    </div>
  );
};
