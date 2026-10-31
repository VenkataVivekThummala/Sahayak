import React, { useState, useEffect } from "react";
import { UserSession, HelpRequestItem } from "../types";
import { fetchHelpRequests } from "../api";
import { RequestDetailModal } from "./RequestDetailModal";
import { UserManagementModal } from "./UserManagementModal";

interface Props {
  session: UserSession;
  onLogout: () => void;
}

export const DashboardView: React.FC<Props> = ({ session, onLogout }) => {
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [schemeFilter, setSchemeFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<HelpRequestItem | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHelpRequests(session.token, {
        status: statusFilter || undefined,
        schemeId: schemeFilter || undefined,
        language: languageFilter || undefined
      });
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, schemeFilter, languageFilter]);

  const openCount = requests.filter((r) => r.status === "open").length;
  const assignedCount = requests.filter((r) => r.status === "assigned").length;
  const closedCount = requests.filter((r) => r.status === "closed").length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-paper)" }}>
      {/* Sub Header for Helpdesk Operator */}
      <header
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#EFF6FF",
              color: "#1E3A8A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            📋
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#0F284E", margin: 0 }}>
              Citizen Grievance & Escalation Console
            </h1>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              ఆంధ్రప్రదేశ్ ప్రభుత్వం · పౌర దరఖాస్తులు మరియు సేవా నివేదికలు
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#F8FAFC",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
            }}
          >
            <span style={{ fontSize: "13px", color: "#64748B" }}>Officer:</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{session.fullName}</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                backgroundColor: session.role === "admin" ? "#FEF3C7" : "#E0F2FE",
                color: session.role === "admin" ? "#D97706" : "#0284C7",
                padding: "2px 8px",
                borderRadius: "9999px",
                textTransform: "uppercase",
              }}
            >
              {session.role === "admin" ? "👑 Admin" : "🎧 Operator"}
            </span>
          </div>

          {session.role === "admin" && (
            <button
              onClick={() => setShowUserModal(true)}
              className="btn-secondary"
              style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 700 }}
            >
              👥 Manage Staff
            </button>
          )}

          <button
            onClick={onLogout}
            style={{
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FCA5A5",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Logout ⏏
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto", width: "100%", flex: 1 }}>
        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
          {/* Card 1 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "22px 24px",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                backgroundColor: "#D97706",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Open Inquiries (పెండింగ్)
              </div>
              <span style={{ fontSize: "20px" }}>⏳</span>
            </div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: "#0F172A", marginTop: "8px" }}>
              {openCount}
            </div>
            <div style={{ fontSize: "12px", color: "#D97706", marginTop: "4px", fontWeight: 600 }}>
              Awaiting departmental response
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "22px 24px",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                backgroundColor: "#2563EB",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Under Processing (కేటాయించినవి)
              </div>
              <span style={{ fontSize: "20px" }}>⚡</span>
            </div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: "#0F172A", marginTop: "8px" }}>
              {assignedCount}
            </div>
            <div style={{ fontSize: "12px", color: "#2563EB", marginTop: "4px", fontWeight: 600 }}>
              Assigned to active officer
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "22px 24px",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                backgroundColor: "#059669",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Resolved & Closed (పరిష్కరించినవి)
              </div>
              <span style={{ fontSize: "20px" }}>✅</span>
            </div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: "#0F172A", marginTop: "8px" }}>
              {closedCount}
            </div>
            <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px", fontWeight: 600 }}>
              Officially resolved with citizen
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            marginBottom: "24px",
            display: "flex",
            gap: "14px",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔍</span> Filter Queue:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "auto", minWidth: "160px", padding: "8px 12px", fontSize: "13px" }}
          >
            <option value="">All Statuses (అన్నీ)</option>
            <option value="open">Open (పెండింగ్)</option>
            <option value="assigned">Assigned (కేటాయించినవి)</option>
            <option value="closed">Closed (పరిష్కరించినవి)</option>
          </select>

          <select
            value={schemeFilter}
            onChange={(e) => setSchemeFilter(e.target.value)}
            style={{ width: "auto", minWidth: "220px", padding: "8px 12px", fontSize: "13px" }}
          >
            <option value="">All Welfare Schemes (అన్ని 14 పథకాలు)</option>
            <option value="ntr-bharosa-oap">NTR Bharosa Pension (ఎన్టీఆర్ భరోసా)</option>
            <option value="talliki-vandanam">Talliki Vandanam (తల్లికి వందనం)</option>
            <option value="annadata-sukhibhava">Annadata Sukhibhava (అన్నదాత సుఖీభవ)</option>
            <option value="deepam-2">Deepam 2.0 Free Gas (దీపం 2.0)</option>
            <option value="maha-shakti-free-bus">Maha Shakti Free Bus (మహాశక్తి ఉచిత బస్సు)</option>
            <option value="aadabidda-nidhi">Aadabidda Nidhi (ఆడబిడ్డ నిధి)</option>
            <option value="yuvagalam">Yuvagalam Allowance (యువగళం)</option>
            <option value="vidya-deevena">Vidya Deevena (విద్యా దీవెన)</option>
            <option value="pm-kisan">PM-KISAN (పీఎం కిసాన్)</option>
            <option value="pm-jay">PM-JAY Aarogyasri (ఆరోగ్యశ్రీ)</option>
            <option value="pmay-g">PMAY-G Housing (గృహనిర్మాణం)</option>
            <option value="ssy">Sukanya Samriddhi (సుకన్య)</option>
            <option value="post-matric-sc">Post-Matric SC Scholarship</option>
            <option value="ignoaps">IGNOAPS Pension</option>
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            style={{ width: "auto", minWidth: "150px", padding: "8px 12px", fontSize: "13px" }}
          >
            <option value="">All Languages</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="en">English</option>
          </select>

          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ marginLeft: "auto", padding: "8px 16px", fontSize: "13px", fontWeight: 700 }}
          >
            🔄 Refresh Live Queue
          </button>
        </div>

        {/* Requests Table */}
        {error && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead style={{ backgroundColor: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
              <tr>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Request ID</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Date</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Scheme</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Citizen Question</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Lang</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Status</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569" }}>Assignee</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    Fetching live citizen inquiries from SQLite…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No citizen inquiries found matching current filters.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr
                    key={r.request_id}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 120ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0F284E" }}>
                      #{r.request_id}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#64748B" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          backgroundColor: "#F1F5F9",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        {r.scheme_id || "General"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                      {r.question}
                    </td>
                    <td style={{ padding: "14px 18px", textTransform: "uppercase", fontWeight: 700, color: "#64748B" }}>
                      {r.language}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span className={`badge badge-${r.status}`}>
                        {r.status === "open" ? "● Pending" : r.status === "assigned" ? "● Assigned" : "✔ Resolved"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#64748B", fontWeight: 500 }}>
                      {r.assigned_to ? `👤 ${r.assigned_to}` : "—"}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedRequest(r)}
                        className="btn-primary"
                        style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "6px" }}
                      >
                        Process Ticket →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modals */}
      {selectedRequest && (
        <RequestDetailModal
          token={session.token}
          request={selectedRequest}
          currentUsername={session.username}
          onClose={() => setSelectedRequest(null)}
          onUpdated={loadData}
        />
      )}

      {showUserModal && (
        <UserManagementModal
          token={session.token}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
};
