import { HelpRequestItem, UserSession } from "./types";

const API_BASE = "";

export async function loginStaff(username: string, password: string): Promise<UserSession> {
  const resp = await fetch(`${API_BASE}/api/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Authentication failed");
  }
  const data = await resp.json();
  return {
    token: data.access_token,
    username: data.username,
    fullName: data.full_name,
    role: data.role
  };
}

export async function fetchHelpRequests(
  token: string,
  filters: { status?: string; schemeId?: string; language?: string }
): Promise<HelpRequestItem[]> {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.schemeId) params.append("scheme_id", filters.schemeId);
  if (filters.language) params.append("language", filters.language);

  const resp = await fetch(`${API_BASE}/api/staff/help-requests?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) {
    throw new Error("Failed to load help requests");
  }
  const data = await resp.json();
  return data.requests;
}

export async function updateHelpRequest(
  token: string,
  requestId: string,
  update: { status?: string; response?: string; assigned_to?: string }
): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/staff/help-requests/${requestId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(update)
  });
  if (!resp.ok) {
    throw new Error("Failed to update request");
  }
}

export async function createStaffUser(
  token: string,
  userData: { username: string; password: string; full_name: string; role: string }
): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/staff/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "Failed to create user" }));
    throw new Error(err.detail || "Failed to create staff user");
  }
}
