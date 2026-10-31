import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { lightColors } from "../theme/tokens";

interface LanguageSelectScreenProps {
  onContinue: () => void;
  onCitizenLogin?: () => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({ onContinue, onCitizenLogin }) => {
  const { language, setLanguage } = useSettingsStore();
  const [selected, setSelected] = useState<"te" | "en">(language);

  const handleSelect = (lang: "te" | "en") => {
    setSelected(lang);
    setLanguage(lang);
  };

  const handleConfirm = () => {
    setLanguage(selected);
    onContinue();
  };

  return (
    <div
      data-testid="language-select-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100vh",
        backgroundColor: lightColors.paper,
        color: lightColors.ink,
        fontFamily: "'Noto Sans Telugu', sans-serif",
        padding: "24px 20px",
        boxSizing: "border-box",
      }}
    >
      <div>
        <h2 style={{ fontSize: "24px", margin: "16px 0 8px 0", color: lightColors.navy }}>
          భాషను ఎంచుకోండి / Choose Language
        </h2>
        <p style={{ fontSize: "16px", color: lightColors.inkSecondary, margin: "0 0 24px 0" }}>
          దయచేసి మీరు ఉపయోగించదలచిన భాషను ఎంపిక చేయండి.
        </p>

        {/* Telugu Option */}
        <button
          type="button"
          data-testid="lang-option-te"
          onClick={() => handleSelect("te")}
          style={{
            width: "100%",
            minHeight: "96px",
            padding: "16px",
            backgroundColor: selected === "te" ? lightColors.surface : lightColors.paper,
            border: `2px solid ${selected === "te" ? lightColors.navy : lightColors.rule}`,
            borderRadius: "8px",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: "16px",
            boxShadow: selected === "te" ? "0 2px 6px rgba(20, 49, 92, 0.12)" : "none",
          }}
        >
          <div style={{ fontSize: "26px", fontWeight: 700, color: lightColors.navy }}>
            తెలుగు
          </div>
          <div style={{ fontSize: "16px", color: lightColors.inkSecondary, marginTop: "4px" }}>
            ప్రభుత్వ పథకాల సమాచారం తెలుగులో పొందండి
          </div>
        </button>

        {/* English Option */}
        <button
          type="button"
          data-testid="lang-option-en"
          onClick={() => handleSelect("en")}
          style={{
            width: "100%",
            minHeight: "96px",
            padding: "16px",
            backgroundColor: selected === "en" ? lightColors.surface : lightColors.paper,
            border: `2px solid ${selected === "en" ? lightColors.navy : lightColors.rule}`,
            borderRadius: "8px",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: "24px",
            boxShadow: selected === "en" ? "0 2px 6px rgba(20, 49, 92, 0.12)" : "none",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 700, color: lightColors.navy }}>
            English
          </div>
          <div style={{ fontSize: "16px", color: lightColors.inkSecondary, marginTop: "4px" }}>
            Access government welfare scheme guidance in English
          </div>
        </button>

        {/* Informative Disclaimer */}
        <div
          style={{
            backgroundColor: lightColors.surface,
            borderLeft: `4px solid ${lightColors.saffron}`,
            padding: "12px 16px",
            borderRadius: "4px",
            fontSize: "14px",
            color: lightColors.inkSecondary,
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: "0 0 4px 0" }}>
            ఈ యాప్ అధికారిక ప్రభుత్వ సమాచారం ఆధారంగా మార్గదర్శకత్వం మాత్రమే ఇస్తుంది.
          </p>
          <p style={{ margin: 0 }}>
            This app provides guidance based on official public records and is not an official decision.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
        <button
          type="button"
          data-testid="btn-continue"
          onClick={handleConfirm}
          style={{
            width: "100%",
            height: "54px",
            backgroundColor: lightColors.navy,
            color: "#FFFFFF",
            fontSize: "18px",
            fontWeight: 700,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(20,49,92,0.2)"
          }}
        >
          {selected === "te" ? "కొనసాగించు (Continue to App) ›" : "Continue to App ›"}
        </button>

        {onCitizenLogin && (
          <button
            type="button"
            data-testid="btn-citizen-login-lang"
            onClick={() => {
              setLanguage(selected);
              onCitizenLogin();
            }}
            style={{
              width: "100%",
              height: "46px",
              backgroundColor: "#FFFFFF",
              color: lightColors.navy,
              fontSize: "15px",
              fontWeight: 600,
              border: `2px solid ${lightColors.navy}`,
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            👤 {selected === "te" ? "పౌర లాగిన్ / సైన్ అప్ (Citizen Login)" : "Citizen Login / Sign Up"}
          </button>
        )}
      </div>
    </div>
  );
};
