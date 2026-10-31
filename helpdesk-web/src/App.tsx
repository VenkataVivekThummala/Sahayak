import React, { useState } from "react";
import { UserSession } from "./types";
import { LoginView } from "./components/LoginView";
import { DashboardView } from "./components/DashboardView";
import { CitizenSimulator } from "./components/CitizenSimulator";
import "./theme.css";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"citizen" | "staff">("citizen");
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("sahayak_staff_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogin = (sess: UserSession) => {
    setSession(sess);
    localStorage.setItem("sahayak_staff_session", JSON.stringify(sess));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("sahayak_staff_session");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-paper)" }}>
      {/* Top Application Header Bar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "64px",
          backgroundColor: "#0A1931",
          backgroundImage: "linear-gradient(90deg, #0A1931 0%, #0F284E 50%, #173868 100%)",
          color: "#FFFFFF",
          padding: "0 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Brand & Portal Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(217, 119, 6, 0.4)",
              fontSize: "20px",
            }}
          >
            🏛️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "0.6px", color: "#FFFFFF" }}>
                GOVERNMENT SAHAYAK
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  color: "#D97706",
                  backgroundColor: "rgba(254, 243, 199, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  padding: "2px 7px",
                  borderRadius: "9999px",
                }}
              >
                KLEENE 2.0
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>
              భారత పౌర సంక్షేమ మరియు అధికారిక ఎస్కలేషన్ వేదిక
            </div>
          </div>
        </div>

        {/* System Health Status */}
        <div
          style={{
            display: "none",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "12px",
            color: "#CBD5E1",
          }}
          className="desktop-status-pill"
        >
          <span className="status-dot-active" />
          <span>Core Engine Live</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
          <span style={{ color: "#38BDF8", fontWeight: 600 }}>Port 8000</span>
        </div>

        {/* View Switcher Segmented Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("citizen")}
              style={{
                backgroundColor: activeTab === "citizen" ? "#1E3A8A" : "transparent",
                color: activeTab === "citizen" ? "#FFFFFF" : "#94A3B8",
                border: activeTab === "citizen" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
                borderRadius: "7px",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: activeTab === "citizen" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "none",
                transition: "all 150ms ease",
              }}
            >
              🏛️ Citizen Welfare Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              style={{
                backgroundColor: activeTab === "staff" ? "#D97706" : "transparent",
                color: activeTab === "staff" ? "#FFFFFF" : "#94A3B8",
                border: activeTab === "staff" ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid transparent",
                borderRadius: "7px",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: activeTab === "staff" ? "0 2px 8px rgba(217, 119, 6, 0.4)" : "none",
                transition: "all 150ms ease",
              }}
            >
              🏢 Staff & Officer Helpdesk
            </button>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#E2E8F0",
              textDecoration: "none",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            }}
          >
            <span>📑 API Docs</span>
            <span style={{ fontSize: "10px", opacity: 0.7 }}>↗</span>
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "citizen" ? (
          <CitizenSimulator onOpenStaffLogin={() => setActiveTab("staff")} />
        ) : !session ? (
          <LoginView onLoginSuccess={handleLogin} />
        ) : (
          <DashboardView session={session} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
};

export default App;
