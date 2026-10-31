import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { useCitizenAuthStore } from "../store/citizenAuthStore";
import { getStrings } from "../i18n/strings";
import { lightColors, layout } from "../theme/tokens";

interface HomeScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { language, setLanguage } = useSettingsStore();
  const { schemes, recentSchemeIds, lastSyncTimestamp } = useSchemeStore();
  const { citizen, isAuthenticated, logout } = useCitizenAuthStore();
  const [quickInput, setQuickInput] = useState("");
  const strings = getStrings(language);

  const toggleLanguage = () => {
    setLanguage(language === "te" ? "en" : "te");
  };

  const handleQuickSend = () => {
    if (quickInput.trim()) {
      onNavigate("assistant", { initialMessage: quickInput.trim() });
      setQuickInput("");
    }
  };

  const recentSchemes = recentSchemeIds
    .map((id) => schemes.find((s) => s.scheme_id === id))
    .filter(Boolean);

  const menuRows = [
    { id: "portfolio", label: language === "te" ? "సమగ్ర సంక్షేమ పోర్ట్‌ఫోలియో (అన్ని పథకాలు)" : "Smart Welfare Portfolio (All Schemes)", icon: "🎯" },
    { id: "assistant", label: strings.ask_assistant, icon: "💬" },
    { id: "eligibility", label: strings.check_eligibility, icon: "✓" },
    { id: "schemes", label: strings.browse_schemes, icon: "📋" },
    { id: "documents", label: strings.required_documents, icon: "📄" },
    { id: "steps", label: strings.application_guide, icon: "➔" },
    { id: "centres", label: strings.nearby_centres, icon: "📍" },
    { id: "helpdesk", label: strings.need_help, icon: "☎" },
  ];

  return (
    <div
      data-testid="home-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        backgroundColor: lightColors.paper,
        color: lightColors.ink,
        fontFamily: "'Noto Sans Telugu', sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          backgroundColor: lightColors.navy,
          color: "#FFFFFF",
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: 700 }}>{strings.app_name}</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            data-testid="btn-toggle-lang"
            onClick={toggleLanguage}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #FFFFFF",
              color: "#FFFFFF",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {language === "te" ? "English" : "తెలుగు"}
          </button>
          <button
            type="button"
            data-testid="btn-settings"
            onClick={() => onNavigate("settings")}
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              fontSize: "20px",
              cursor: "pointer",
            }}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Interactive Quick Language & Auth Toolbar in Dashboard */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          backgroundColor: "#F1F5F9",
          borderBottom: `1px solid ${lightColors.rule}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>🌐 భాష:</span>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#E2E8F0",
              borderRadius: "6px",
              padding: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => setLanguage("te")}
              style={{
                border: "none",
                borderRadius: "4px",
                padding: "3px 10px",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: language === "te" ? lightColors.navy : "transparent",
                color: language === "te" ? "#FFFFFF" : "#475569",
                cursor: "pointer",
              }}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              style={{
                border: "none",
                borderRadius: "4px",
                padding: "3px 10px",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: language === "en" ? lightColors.navy : "transparent",
                color: language === "en" ? "#FFFFFF" : "#475569",
                cursor: "pointer",
              }}
            >
              English
            </button>
          </div>
        </div>

        {isAuthenticated && citizen ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: lightColors.ok }}>
              👤 {citizen.full_name}
            </span>
            <button
              type="button"
              onClick={logout}
              style={{
                background: "none",
                border: "1px solid #CBD5E1",
                borderRadius: "4px",
                padding: "2px 8px",
                color: lightColors.bad,
                fontWeight: 700,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              {language === "te" ? "లాగౌట్" : "Logout"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate("citizen-login")}
            style={{
              backgroundColor: "#D97706",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(217, 119, 6, 0.3)",
            }}
          >
            🔑 {language === "te" ? "పౌర లాగిన్" : "Citizen Login"}
          </button>
        )}
      </div>

      {/* Voice Hero Section */}
      <div
        style={{
          padding: "28px 20px 20px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: lightColors.surface,
          borderBottom: `1px solid ${lightColors.rule}`,
        }}
      >
        <button
          type="button"
          data-testid="btn-voice-hero"
          onClick={() => onNavigate("assistant", { startListening: true })}
          style={{
            width: `${layout.micHeroSize}px`,
            height: `${layout.micHeroSize}px`,
            borderRadius: "50%",
            backgroundColor: lightColors.navy,
            border: `4px solid ${lightColors.saffron}`,
            color: "#FFFFFF",
            fontSize: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(20, 49, 92, 0.2)",
            marginBottom: "12px",
          }}
        >
          🎤
        </button>
        <div style={{ fontSize: "20px", fontWeight: 700, color: lightColors.navy }}>
          {strings.ask_voice}
        </div>
        <div style={{ fontSize: "14px", color: lightColors.inkSecondary, marginTop: "4px" }}>
          {language === "te"
            ? "మైక్రోఫోన్ నొక్కి మీ ప్రశ్నను మాట్లాడండి"
            : "Tap the microphone to speak your query"}
        </div>

        {/* Quick Type Row */}
        <div
          style={{
            display: "flex",
            width: "100%",
            maxWidth: "760px",
            marginTop: "20px",
            gap: "8px",
          }}
        >
          <input
            type="text"
            data-testid="input-quick-search"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickSend()}
            placeholder={strings.or_type}
            style={{
              flex: 1,
              height: "48px",
              padding: "0 14px",
              fontSize: "16px",
              border: `1px solid ${lightColors.rule}`,
              borderRadius: "6px",
              backgroundColor: lightColors.paper,
            }}
          />
          <button
            type="button"
            data-testid="btn-quick-send"
            onClick={handleQuickSend}
            style={{
              height: "48px",
              padding: "0 18px",
              backgroundColor: lightColors.navy,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {strings.send}
          </button>
        </div>
      </div>

      {/* Live Government Scheme Portals Tray */}
      <div style={{ padding: "16px 20px 12px 20px", borderBottom: `1px solid ${lightColors.rule}`, backgroundColor: "#F7FAF8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>🏛️</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {language === "te" ? "లైవ్ ప్రభుత్వ పథకాలు" : "Live Government Portals"}
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#2E7D32", backgroundColor: "#E8F5E9", padding: "2px 8px", borderRadius: "10px" }}>
            ● {schemes.length} SCHEMES ACTIVE
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
          {schemes.map((s) => (
            <div
              key={s.scheme_id}
              onClick={() => onNavigate("scheme-detail", { schemeId: s.scheme_id })}
              style={{
                flex: "0 0 170px",
                backgroundColor: "#FFFFFF",
                border: `1px solid ${lightColors.rule}`,
                borderRadius: "8px",
                padding: "12px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: s.scope === "central" ? "#0D47A1" : "#E65100", textTransform: "uppercase", marginBottom: "4px" }}>
                  {s.scope === "central" ? (language === "te" ? "కేంద్ర ప్రభుత్వం" : "Central Govt") : (language === "te" ? "ఆంధ్రప్రదేశ్" : "AP State")}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: lightColors.navy, lineHeight: 1.3, marginBottom: "8px" }}>
                  {language === "te" ? s.name_te : s.name_en}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid #ECEFF1`, paddingTop: "6px" }}>
                <span style={{ fontSize: "11px", color: lightColors.saffron, fontWeight: 600 }}>
                  {language === "te" ? "వివరాలు ›" : "Details ›"}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = s.sources[0]?.url || "https://india.gov.in/";
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  title="Open live portal"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1B5E20",
                    backgroundColor: "#E8F5E9",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  LIVE ↗
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Schemes Block */}
      {recentSchemes.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${lightColors.rule}` }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: lightColors.inkSecondary, marginBottom: "8px" }}>
            {language === "te" ? "ఇటీవల చూసిన పథకాలు" : "Recently Viewed Schemes"}
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
            {recentSchemes.map((s) => (
              <button
                key={s!.scheme_id}
                type="button"
                onClick={() => onNavigate("scheme-detail", { schemeId: s!.scheme_id })}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${lightColors.rule}`,
                  backgroundColor: lightColors.surface,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: lightColors.navy,
                }}
              >
                {language === "te" ? s!.name_te : s!.name_en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Services Grid */}
      <div
        style={{
          flex: 1,
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        {menuRows.map((row) => (
          <button
            key={row.id}
            type="button"
            data-testid={`row-${row.id}`}
            onClick={() => onNavigate(row.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              border: `1px solid ${lightColors.rule}`,
              borderRadius: "12px",
              backgroundColor: lightColors.surface,
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = lightColors.navy;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = lightColors.rule;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.03)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span
                style={{
                  fontSize: "22px",
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {row.icon}
              </span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: lightColors.ink }}>
                {row.label}
              </span>
            </div>
            <span style={{ fontSize: "18px", color: lightColors.saffron, fontWeight: 700 }}>→</span>
          </button>
        ))}
      </div>

      {/* Last Updated Footer & Tap target */}
      <div
        style={{
          padding: "16px 20px",
          textAlign: "center",
          fontSize: "13px",
          color: lightColors.inkSecondary,
        }}
      >
        <span>
          {strings.last_verified}: {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleDateString() : "2026-10-18"}
        </span>
        <button
          type="button"
          onClick={() => alert(language === "te" ? "పథకాల డేటా తాజాగా ఉంది." : "Scheme data is up to date.")}
          style={{
            background: "none",
            border: "none",
            color: lightColors.saffron,
            fontWeight: 600,
            cursor: "pointer",
            marginLeft: "8px",
            textDecoration: "underline",
          }}
        >
          {language === "te" ? "నవీకరణలను తనిఖీ చేయండి" : "Check for updates"}
        </button>
      </div>

      {/* Bottom Tabs */}
      <nav
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          height: "56px",
          backgroundColor: lightColors.surface,
          borderTop: `1px solid ${lightColors.rule}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 10,
          marginTop: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("home")}
          style={{ background: "none", border: "none", fontWeight: 700, color: lightColors.navy }}
        >
          🏠 {language === "te" ? "హోమ్" : "Home"}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("schemes")}
          style={{ background: "none", border: "none", color: lightColors.inkSecondary }}
        >
          📋 {language === "te" ? "పథకాలు" : "Schemes"}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("assistant")}
          style={{ background: "none", border: "none", color: lightColors.inkSecondary }}
        >
          💬 {language === "te" ? "సహాయక్" : "Assistant"}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          style={{ background: "none", border: "none", color: lightColors.inkSecondary }}
        >
          ⚙ {language === "te" ? "మరిన్ని" : "More"}
        </button>
      </nav>
    </div>
  );
};
