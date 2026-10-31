import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useCitizenAuthStore } from "../store/citizenAuthStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface CitizenAuthScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const CitizenAuthScreen: React.FC<CitizenAuthScreenProps> = ({ onSuccess, onCancel }) => {
  const { language, setLanguage } = useSettingsStore();
  const { setAuth, continueAsGuest } = useCitizenAuthStore();
  const strings = getStrings(language);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [fullName, setFullName] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/citizen/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), pin: pin.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || "Login failed");
      }
      setAuth(data.access_token, data.citizen);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/citizen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          full_name: fullName.trim(),
          pin: pin.trim(),
          preferred_language: language,
          district: district.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || "Registration failed");
      }
      setAuth(data.access_token, data.citizen);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setMode("login");
    setPhone("9848012345");
    setPin("1234");
    setError(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#FAF7F2",
        color: "#0F172A",
        fontFamily: "'Plus Jakarta Sans', 'Noto Sans Telugu', sans-serif",
        padding: "32px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Top Header Controls: Language Switcher */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
        <button
          type="button"
          onClick={() => setLanguage(language === "te" ? "en" : "te")}
          style={{
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #CBD5E1",
            borderRadius: "8px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#0F284E",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🌐 {language === "te" ? "English" : "తెలుగు"}
        </button>
      </div>

      {/* Top Government Emblem & Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0F284E 0%, #1E3A8A 100%)",
            color: "#FFFFFF",
            fontSize: "26px",
            boxShadow: "0 6px 16px rgba(15, 40, 78, 0.25)",
            marginBottom: "12px",
          }}
        >
          🏛️
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "#D97706",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: "4px",
          }}
        >
          {language === "te" ? "ఆంధ్రప్రదేశ్ ప్రభుత్వం · ప్రత్యక్ష లబ్ధి బదిలీ" : "GOVERNMENT OF ANDHRA PRADESH · DBT"}
        </div>
        <h1
          style={{
            fontSize: "22px",
            color: "#0F284E",
            margin: "0 0 6px 0",
            fontWeight: 800,
            letterSpacing: "-0.3px",
          }}
        >
          {language === "te" ? "పౌర సంక్షేమ ఖాతా" : "Citizen Welfare Account"}
        </h1>
        <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
          {language === "te"
            ? "మీ ధృవీకరించిన ప్రొఫైల్, అర్హత సర్టిఫికెట్లు మరియు దరఖాస్తులను పొందండి"
            : "Access verified profiles, pre-approved schemes, and eligibility certificates"}
        </p>
      </div>

      {/* Segmented Mode Switcher */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#EDE8DF",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); }}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "none",
            borderRadius: "9px",
            backgroundColor: mode === "login" ? "#0F284E" : "transparent",
            color: mode === "login" ? "#FFFFFF" : "#64748B",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: mode === "login" ? "0 2px 8px rgba(15, 40, 78, 0.25)" : "none",
            transition: "all 150ms ease",
          }}
        >
          {language === "te" ? "🔒 లాగిన్ (Login)" : "🔒 Login"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); setError(null); }}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "none",
            borderRadius: "9px",
            backgroundColor: mode === "register" ? "#0F284E" : "transparent",
            color: mode === "register" ? "#FFFFFF" : "#64748B",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: mode === "register" ? "0 2px 8px rgba(15, 40, 78, 0.25)" : "none",
            transition: "all 150ms ease",
          }}
        >
          {language === "te" ? "📝 కొత్త నమోదు (Register)" : "📝 Register"}
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "12px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Auth Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        }}
      >
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                {language === "te" ? "పూర్తి పేరు: *" : "Full Legal Name: *"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  fontSize: "15px",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "10px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              {language === "te" ? "మొబైల్ నంబర్ (10 అంకెలు): *" : "Registered Mobile Number: *"}
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  height: "46px",
                  padding: "0 12px",
                  backgroundColor: "#F1F5F9",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                🇮🇳 +91
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9848012345"
                style={{
                  flex: 1,
                  height: "46px",
                  padding: "0 14px",
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "10px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                {language === "te" ? "రహస్య పిన్ (4 అంకెలు): *" : "Security PIN (4 digits): *"}
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  color: "#0F284E",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPin ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPin ? "text" : "password"}
              required
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              style={{
                width: "100%",
                height: "46px",
                padding: "0 14px",
                fontSize: "18px",
                letterSpacing: "3px",
                border: "1.5px solid #CBD5E1",
                borderRadius: "10px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                {language === "te" ? "జిల్లా (ఐచ్ఛికం):" : "District (Optional):"}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Krishna, Guntur, Visakhapatnam"
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  fontSize: "14px",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "10px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "48px",
              background: "linear-gradient(135deg, #0F284E 0%, #173868 100%)",
              color: "#FFFFFF",
              fontSize: "15px",
              fontWeight: 700,
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(15, 40, 78, 0.3)",
              marginTop: "4px",
            }}
          >
            {loading
              ? (language === "te" ? "కనెక్ట్ అవుతోంది..." : "Verifying with Database...")
              : mode === "login"
              ? (language === "te" ? "ఖాతాలోకి ప్రవేశించండి →" : "Sign In to Database →")
              : (language === "te" ? "ఖాతా నమోదు చేయండి →" : "Create Citizen Account →")}
          </button>
        </form>

        {/* 1-Click Quick Demo Pill */}
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            backgroundColor: "#FAF7F2",
            borderRadius: "10px",
            border: "1px dashed #CBD5E1",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", marginBottom: "6px" }}>
            {language === "te" ? "⚡ త్వరిత డెమో పౌరుడు (క్లిక్ చేయండి):" : "⚡ 1-Click Demo Citizen (Click to Fill):"}
          </div>
          <button
            type="button"
            onClick={handleQuickDemoFill}
            style={{
              width: "100%",
              padding: "7px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D9D2C5",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#0F284E",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            👤 Ramesh Babu (9848012345 · PIN: 1234)
          </button>
        </div>
      </div>

      {/* Guest Mode / Privacy Option */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            continueAsGuest();
            onSuccess();
          }}
          style={{
            background: "none",
            border: "none",
            color: "#64748B",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "underline",
            cursor: "pointer",
            padding: "6px",
          }}
        >
          {language === "te"
            ? "అతిథిగా కొనసాగించండి (గోప్యతా మోడ్) ›"
            : "Continue as Guest (Privacy / Zero-Login Mode) ›"}
        </button>
      </div>

      {/* Security Footer Notice */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "24px",
          textAlign: "center",
          fontSize: "11px",
          color: "#94A3B8",
          lineHeight: 1.5,
        }}
      >
        🛡️ {language === "te"
          ? "భారత ప్రభుత్వం · AP DBT ప్రామాణిక ఎన్‌క్రిప్టెడ్ పౌర పోర్టల్"
          : "Govt of AP · Kleene Deterministic Welfare Vault · End-to-End Encrypted"}
      </div>
      </div>
    </div>
  );
};
