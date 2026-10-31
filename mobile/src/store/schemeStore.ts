/**
 * Scheme & Offline Data Zustand Store
 */
import { create } from "zustand";
import { SchemeRecord } from "../engine/engine";
import defaultSchemes from "../../../data/schemes.json";
import defaultFields from "../../../data/fields.json";

export interface SchemeState {
  datasetVersion: string;
  schemes: SchemeRecord[];
  fields: Record<string, any>;
  lastSyncTime: string | null;
  lastSyncTimestamp: string | null;
  recentSchemeIds: string[];
  docChecklist: Record<string, Record<string, boolean>>; // scheme_id -> doc_name -> checked
  stepProgress: Record<string, Record<number, boolean>>;  // scheme_id -> step_number -> done
  userAnswers: Record<string, any>; // Offline fact store

  setDataset: (version: string, schemes: SchemeRecord[], fields: Record<string, any>) => void;
  addRecentScheme: (schemeId: string) => void;
  clearRecentSchemes: () => void;
  toggleDocCheck: (schemeId: string, docName: string) => void;
  resetDocChecklist: (schemeId: string) => void;
  toggleStepDone: (schemeId: string, stepNumber: number) => void;
  setUserAnswer: (field: string, value: any) => void;
  clearUserAnswers: () => void;
  clearAllOfflineData: () => void;
}

export const useSchemeStore = create<SchemeState>((set) => ({
  datasetVersion: "verified-oct-2026",
  schemes: defaultSchemes as unknown as SchemeRecord[],
  fields: defaultFields,
  lastSyncTime: new Date().toISOString(),
  lastSyncTimestamp: new Date().toISOString(),
  recentSchemeIds: ["pm-kisan", "pm-jay"],
  docChecklist: {},
  stepProgress: {},
  userAnswers: {},

  setDataset: (version, schemes, fields) => set({
    datasetVersion: version,
    schemes,
    fields,
    lastSyncTime: new Date().toISOString(),
    lastSyncTimestamp: new Date().toISOString(),
  }),

  addRecentScheme: (schemeId) => set((state) => {
    const filtered = state.recentSchemeIds.filter((id) => id !== schemeId);
    return { recentSchemeIds: [schemeId, ...filtered].slice(0, 3) };
  }),

  clearRecentSchemes: () => set({ recentSchemeIds: [] }),

  toggleDocCheck: (schemeId, docName) => set((state) => {
    const currentScheme = state.docChecklist[schemeId] || {};
    const updated = { ...currentScheme, [docName]: !currentScheme[docName] };
    return { docChecklist: { ...state.docChecklist, [schemeId]: updated } };
  }),

  resetDocChecklist: (schemeId) => set((state) => {
    const updated = { ...state.docChecklist, [schemeId]: {} };
    return { docChecklist: updated };
  }),

  toggleStepDone: (schemeId, stepNumber) => set((state) => {
    const currentScheme = state.stepProgress[schemeId] || {};
    const updated = { ...currentScheme, [stepNumber]: !currentScheme[stepNumber] };
    return { stepProgress: { ...state.stepProgress, [schemeId]: updated } };
  }),

  setUserAnswer: (field, value) => set((state) => ({
    userAnswers: { ...state.userAnswers, [field]: value }
  })),

  clearUserAnswers: () => set({ userAnswers: {} }),

  clearAllOfflineData: () => set({
    recentSchemeIds: [],
    docChecklist: {},
    stepProgress: {},
    userAnswers: {}
  })
}));
