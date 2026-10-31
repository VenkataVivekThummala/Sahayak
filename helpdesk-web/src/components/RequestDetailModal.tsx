import React, { useState } from "react";
import { HelpRequestItem } from "../types";
import { updateHelpRequest } from "../api";

interface Props {
  token: string;
  request: HelpRequestItem;
  currentUsername: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const RequestDetailModal: React.FC<Props> = ({
  token,
  request,
  currentUsername,
  onClose,
  onUpdated
}) => {
  const [status, setStatus] = useState<string>(request.status);
  const [response, setResponse] = useState<string>(request.response || "");
  const [assignedTo, setAssignedTo] = useState<string>(request.assigned_to || currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedPhone, setRevealedPhone] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateHelpRequest(token, request.request_id, {
        status,
        response: response.trim() || undefined,
        assigned_to: assignedTo.trim() || undefined
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  const handleRevealPhone = () => {
    console.info(`[AUDIT] Staff user '${currentUsername}' revealed phone for ${request.request_id} at ${new Date().toISOString()}`);
    setRevealedPhone(true);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "600px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "30px",
        border: "1px solid var(--color-rule)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", color: "var(--color-navy)" }}>Request {request.request_id}</h2>
            <span style={{ fontSize: "12px", color: "var(--color-ink-2)" }}>Created: {new Date(request.created_at).toLocaleString()}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FDE8E8", color: "var(--color-bad)", padding: "10px", borderRadius: "6px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ backgroundColor: "var(--color-paper)", padding: "16px", borderRadius: "6px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "8px", fontSize: "14px", color: "var(--color-ink-2)" }}>
            <strong>Target Scheme:</strong> {request.scheme_id || "General Inquiry"} | <strong>Language:</strong> {request.language === "te" ? "Telugu (తెలుగు)" : "English"}
          </div>
          <div style={{ fontSize: "16px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
            {request.question}
          </div>
          {request.contact_phone_masked && (
            <div style={{ marginTop: "12px", fontSize: "14px", borderTop: "1px solid var(--color-rule)", paddingTop: "8px" }}>
              <strong>Citizen Phone: </strong>
              {revealedPhone ? (
                <span style={{ fontWeight: 600, color: "var(--color-navy)" }}>{request.contact_phone_raw}</span>
              ) : (
                <span>
                  {request.contact_phone_masked}{" "}
                  <button
                    type="button"
                    onClick={handleRevealPhone}
                    style={{ fontSize: "12px", padding: "2px 8px", marginLeft: "8px", background: "#E2E8F0", border: "none", borderRadius: "4px" }}
                  >
                    Reveal (Logged)
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="open">Open (పెండింగ్)</option>
              <option value="assigned">Assigned (కేటాయించబడింది)</option>
              <option value="closed">Closed (ముగిసింది)</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Assignee</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{ width: "100%" }}
              placeholder="Staff username"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
              Official Response to Citizen (సమాధానం)
            </label>
            <textarea
              rows={5}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              style={{ width: "100%", resize: "vertical" }}
              placeholder="Write clear, respectful guidance based on verified government procedures in Telugu or English..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save & Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
