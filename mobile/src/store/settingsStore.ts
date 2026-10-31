/**
 * Settings Zustand Store
 */
import { create } from "zustand";

export interface SettingsState {
  language: "te" | "en";
  hasChosenLanguage: boolean;
  hasCompletedFirstLaunch: boolean;
  theme: "system" | "light" | "dark";
  textSize: "normal" | "large" | "extra_large";
  voiceSpeed: "normal" | "slow";
  speechRate: number;
  autoSpeak: boolean;
  autoSendVoice: boolean;
  teluguDigits: boolean;
  remindersEnabled: boolean;
  pushEnabled: boolean;
  historyRetentionDays: number;

  setLanguage: (lang: "te" | "en") => void;
  setFirstLaunchComplete: () => void;
  setTheme: (theme: "system" | "light" | "dark") => void;
  setTextSize: (size: "normal" | "large" | "extra_large") => void;
  setVoiceSpeed: (speed: "normal" | "slow") => void;
  setSpeechRate: (rate: number) => void;
  setAutoSpeak: (val: boolean) => void;
  setAutoSendVoice: (val: boolean) => void;
  setTeluguDigits: (val: boolean) => void;
  setRemindersEnabled: (val: boolean) => void;
  setPushEnabled: (val: boolean) => void;
  setHistoryRetentionDays: (days: number) => void;
  resetSettings: () => void;
  resetAllSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "te",
  hasChosenLanguage: false,
  hasCompletedFirstLaunch: false,
  theme: "system",
  textSize: "normal",
  voiceSpeed: "normal",
  speechRate: 1.0,
  autoSpeak: true,
  autoSendVoice: false,
  teluguDigits: false,
  remindersEnabled: true,
  pushEnabled: true,
  historyRetentionDays: 30,

  setLanguage: (language) => set({ language, hasChosenLanguage: true }),
  setFirstLaunchComplete: () => set({ hasCompletedFirstLaunch: true, hasChosenLanguage: true }),
  setTheme: (theme) => set({ theme }),
  setTextSize: (textSize) => set({ textSize }),
  setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
  setSpeechRate: (speechRate) => set({ speechRate }),
  setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
  setAutoSendVoice: (autoSendVoice) => set({ autoSendVoice }),
  setTeluguDigits: (teluguDigits) => set({ teluguDigits }),
  setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
  setPushEnabled: (pushEnabled) => set({ pushEnabled }),
  setHistoryRetentionDays: (historyRetentionDays) => set({ historyRetentionDays }),
  resetSettings: () => set({
    language: "te",
    hasChosenLanguage: false,
    theme: "system",
    textSize: "normal",
    voiceSpeed: "normal",
    speechRate: 1.0,
    autoSpeak: true,
    autoSendVoice: false,
    teluguDigits: false,
    remindersEnabled: true,
    pushEnabled: true,
    historyRetentionDays: 30,
  }),
  resetAllSettings: () => set({
    language: "te",
    hasChosenLanguage: false,
    theme: "system",
    textSize: "normal",
    voiceSpeed: "normal",
    speechRate: 1.0,
    autoSpeak: true,
    autoSendVoice: false,
    teluguDigits: false,
    remindersEnabled: true,
    pushEnabled: true,
    historyRetentionDays: 30,
  }),
}));
