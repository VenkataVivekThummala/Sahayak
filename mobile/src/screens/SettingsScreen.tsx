import React from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { useHelpDeskStore } from "../store/helpDeskStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface SettingsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { language, setLanguage, speechRate, setSpeechRate, resetSettings } = useSettingsStore();
  const { clearRecentSchemes } = useSchemeStore();
  const { clearHistory } = useHelpDeskStore();
  const strings = getStrings(language);

  const handleClearData = () => {
    if (
      window.confirm(
        language === "te"
          ? "మీ మొబైల్‌లోని స్థానిక డేటా మొత్తం తొలగించబడుతుంది. కొనసాగించాలా?"
          : "All local app data and history will be cleared. Do you want to proceed?"
      )
    ) {
      clearRecentSchemes();
      clearHistory();
      resetSettings();
      alert(language === "te" ? "డేటా విజయవంతంగా తొలగించబడింది" : "Local data cleared successfully");
    }
  };

  return (
    <div
      data-testid="settings-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: lightColors.paper,
        color: lightColors.ink,
        fontFamily: "'Noto Sans Telugu', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 20px",
          backgroundColor: lightColors.navy,
          color: "#FFFFFF",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("home")}
          style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
        >
          ←
        </button>
        <span style={{ fontSize: "18px", fontWeight: 700 }}>
          {language === "te" ? "సెట్టింగ్‌లు" : "Settings"}
        </span>
      </header>

      <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Language Selection Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            {language === "te" ? "భాష (Language)" : "Language"}
          </h3>
          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setLanguage("te")}
              style={{
                flex: 1,
                padding: "12px",
                border: `2px solid ${language === "te" ? lightColors.navy : lightColors.rule}`,
                backgroundColor: language === "te" ? lightColors.paper : lightColors.surface,
                borderRadius: "6px",
                fontWeight: 700,
                color: lightColors.navy,
                cursor: "pointer",
              }}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              style={{
                flex: 1,
                padding: "12px",
                border: `2px solid ${language === "en" ? lightColors.navy : lightColors.rule}`,
                backgroundColor: language === "en" ? lightColors.paper : lightColors.surface,
                borderRadius: "6px",
                fontWeight: 700,
                color: lightColors.navy,
                cursor: "pointer",
              }}
            >
              English
            </button>
          </div>
        </div>

        {/* Speech Rate */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            {language === "te" ? "వాయిస్ వేగం (Speech Rate)" : "Speech Speed"}
          </h3>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            {[
              { rate: 0.8, label: language === "te" ? "నెమ్మదిగా" : "Slow" },
              { rate: 1.0, label: language === "te" ? "సాధారణం" : "Normal" },
              { rate: 1.2, label: language === "te" ? "వేగంగా" : "Fast" },
            ].map((item) => (
              <button
                key={item.rate}
                type="button"
                onClick={() => setSpeechRate(item.rate)}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: `1px solid ${speechRate === item.rate ? lightColors.navy : lightColors.rule}`,
                  backgroundColor: speechRate === item.rate ? lightColors.navy : lightColors.surface,
                  color: speechRate === item.rate ? "#FFFFFF" : lightColors.ink,
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Glossary & Info Links */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            {language === "te" ? "సమాచారం మరియు సహాయం" : "Information & Help"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => onNavigate("glossary")}
              style={actionRowButtonStyle}
            >
              <span>📖 {language === "te" ? "ప్రభుత్వ పదకోశం (Glossary)" : "Government Terms Glossary"}</span>
              <span>›</span>
            </button>
            <button
              type="button"
              onClick={() =>
                alert(
                  language === "te"
                    ? "గోప్యతా నోటీసు: గవర్నమెంట్ సహాయక్ మీ ఆధార్ నంబర్ లేదా బ్యాంక్ వివరాలను ఎప్పటికీ నిల్వ చేయదు."
                    : "Privacy Notice: Government Sahayak never collects or stores Aadhaar or bank account numbers."
                )
              }
              style={actionRowButtonStyle}
            >
              <span>🔒 {language === "te" ? "గోప్యతా నోటీసు" : "Privacy Notice"}</span>
              <span>›</span>
            </button>
          </div>
        </div>

        {/* Clear Data Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            {language === "te" ? "డేటా నిర్వహణ" : "Data Management"}
          </h3>
          <p style={{ fontSize: "14px", color: lightColors.inkSecondary, margin: "6px 0 12px 0" }}>
            {language === "te"
              ? "మీ ఫోన్‌లో నిల్వ చేయబడిన శోధన చరిత్ర మరియు చెక్‌లిస్ట్‌లను క్లియర్ చేయండి."
              : "Clear on-device cached searches, checklists, and local history."}
          </p>
          <button
            type="button"
            data-testid="btn-clear-local-data"
            onClick={handleClearData}
            style={{
              padding: "12px",
              backgroundColor: lightColors.paper,
              border: `1px solid ${lightColors.bad}`,
              color: lightColors.bad,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            🗑️ {language === "te" ? "స్థానిక డేటాను తొలగించండి" : "Clear Local Data"}
          </button>
        </div>

        {/* Version Information */}
        <div style={{ textAlign: "center", fontSize: "13px", color: lightColors.inkSecondary, marginTop: "12px" }}>
          <div>Government Sahayak v1.0.0 (Release)</div>
          <div>Dataset Version: verified-oct-2026</div>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: lightColors.surface,
  border: `1px solid ${lightColors.rule}`,
  borderRadius: "8px",
  padding: "16px",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  color: lightColors.navy,
  fontWeight: 700,
};

const actionRowButtonStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  backgroundColor: lightColors.paper,
  border: `1px solid ${lightColors.rule}`,
  borderRadius: "6px",
  fontSize: "15px",
  fontWeight: 600,
  color: lightColors.ink,
  cursor: "pointer",
  textAlign: "left",
};
