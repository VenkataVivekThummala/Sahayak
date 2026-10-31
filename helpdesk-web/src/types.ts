export interface HelpRequestItem {
  id: number;
  request_id: string;
  scheme_id: string | null;
  question: string;
  language: string;
  contact_phone_masked: string | null;
  contact_phone_raw: string | null;
  status: "open" | "assigned" | "closed";
  response: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  token: string;
  username: string;
  fullName: string;
  role: "admin" | "agent";
}
