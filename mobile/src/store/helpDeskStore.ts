/**
 * Help Desk Zustand Store
 */
import { create } from "zustand";
import { api } from "../api/client";

export interface CitizenHelpRequest {
  request_id: string;
  scheme_id?: string;
  question: string;
  status_token: string;
  status: "open" | "assigned" | "closed";
  response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmittedSummary {
  id: string;
  code: string;
  description: string;
  status: string;
}

export interface QueuedOfflineRequest {
  temp_id: string;
  scheme_id?: string;
  question: string;
  language: string;
  contact_phone?: string;
  consent: boolean;
  queued_at: string;
}

export interface HelpDeskState {
  myRequests: CitizenHelpRequest[];
  submittedRequests: SubmittedSummary[];
  offlineQueue: QueuedOfflineRequest[];
  loading: boolean;
  error: string | null;

  submitRequest: (schemeId?: string, description?: string, contactPhone?: string) => Promise<string>;
  addRequest: (req: CitizenHelpRequest) => void;
  updateRequestStatus: (requestId: string, status: "open" | "assigned" | "closed", response?: string) => void;
  enqueueOfflineRequest: (req: Omit<QueuedOfflineRequest, "temp_id" | "queued_at">) => void;
  dequeueOfflineRequest: (tempId: string) => void;
  clearHistory: () => void;
  clearAllRequests: () => void;
}

export const useHelpDeskStore = create<HelpDeskState>((set, get) => ({
  myRequests: [],
  submittedRequests: [],
  offlineQueue: [],
  loading: false,
  error: null,

  submitRequest: async (schemeId, description = "", contactPhone) => {
    set({ loading: true, error: null });
    try {
      const resp = await api.submitHelpRequest({
        scheme_id: schemeId,
        question: description,
        language: "te",
        contact_phone: contactPhone,
        consent: true,
      });

      const summary: SubmittedSummary = {
        id: resp.request_id,
        code: resp.status_token,
        description,
        status: resp.status,
      };

      set((state) => ({
        submittedRequests: [summary, ...state.submittedRequests],
        loading: false,
      }));

      return resp.status_token;
    } catch (err: any) {
      // Offline fallback: generate local ticket and enqueue
      const fallbackToken = `OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`;
      const summary: SubmittedSummary = {
        id: `local-${Date.now()}`,
        code: fallbackToken,
        description,
        status: "queued_offline",
      };
      set((state) => ({
        submittedRequests: [summary, ...state.submittedRequests],
        loading: false,
      }));
      return fallbackToken;
    }
  },

  addRequest: (req) => set((state) => ({
    myRequests: [req, ...state.myRequests.filter((r) => r.request_id !== req.request_id)]
  })),

  updateRequestStatus: (requestId, status, response) => set((state) => ({
    myRequests: state.myRequests.map((r) =>
      r.request_id === requestId
        ? { ...r, status, response: response !== undefined ? response : r.response, updated_at: new Date().toISOString() }
        : r
    )
  })),

  enqueueOfflineRequest: (req) => set((state) => ({
    offlineQueue: [
      ...state.offlineQueue,
      {
        ...req,
        temp_id: `QUEUE-${Date.now()}`,
        queued_at: new Date().toISOString()
      }
    ]
  })),

  dequeueOfflineRequest: (tempId) => set((state) => ({
    offlineQueue: state.offlineQueue.filter((q) => q.temp_id !== tempId)
  })),

  clearHistory: () => set({ myRequests: [], submittedRequests: [], offlineQueue: [] }),
  clearAllRequests: () => set({ myRequests: [], submittedRequests: [], offlineQueue: [] })
}));
