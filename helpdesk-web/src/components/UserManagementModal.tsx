import React, { useState } from "react";
import { createStaffUser } from "../api";

interface Props {
  token: string;
  onClose: () => void;
}

export const UserManagementModal: React.FC<Props> = ({ token, onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"agent" | "admin">("agent");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await createStaffUser(token, { username, password, full_name: fullName, role });
      setSuccess(true);
      setUsername("");
      setPassword("");
      setFullName("");
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
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
        maxWidth: "480px",
        padding: "30px",
        border: "1px solid var(--color-rule)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", color: "var(--color-navy)" }}>Staff User Management</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        {success && (
          <div style={{ backgroundColor: "#E2F0D9", color: "var(--color-ok)", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
            Staff account created successfully!
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: "#FDE8E8", color: "var(--color-bad)", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Temporary Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} style={{ width: "100%" }}>
              <option value="agent">Support Agent</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button type="button" onClick={onClose} className="btn-secondary">Close</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
