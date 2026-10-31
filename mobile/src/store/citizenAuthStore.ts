/**
 * Citizen Authentication Store (Persistent SQLite/PostgreSQL Database Sync)
 */
import { create } from "zustand";

export interface CitizenProfile {
  id: number;
  phone: string;
  full_name: string;
  preferred_language: string;
  district?: string;
}

export interface CitizenAuthState {
  token: string | null;
  citizen: CitizenProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;

  setAuth: (token: string, citizen: CitizenProfile) => void;
  continueAsGuest: () => void;
  logout: () => void;
}

export const useCitizenAuthStore = create<CitizenAuthState>((set) => {
  // Check if saved in localStorage
  let savedToken: string | null = null;
  let savedCitizen: CitizenProfile | null = null;
  try {
    savedToken = localStorage.getItem("sahayak_citizen_token");
    const cStr = localStorage.getItem("sahayak_citizen_profile");
    if (cStr) savedCitizen = JSON.parse(cStr);
  } catch {
    // SSR or React Native fallback
  }

  return {
    token: savedToken,
    citizen: savedCitizen,
    isAuthenticated: !!savedToken,
    isGuest: !savedToken,

    setAuth: (token, citizen) => {
      try {
        localStorage.setItem("sahayak_citizen_token", token);
        localStorage.setItem("sahayak_citizen_profile", JSON.stringify(citizen));
      } catch {}
      set({ token, citizen, isAuthenticated: true, isGuest: false });
    },

    continueAsGuest: () => {
      set({ isGuest: true });
    },

    logout: () => {
      try {
        localStorage.removeItem("sahayak_citizen_token");
        localStorage.removeItem("sahayak_citizen_profile");
      } catch {}
      set({ token: null, citizen: null, isAuthenticated: false, isGuest: true });
    },
  };
});
