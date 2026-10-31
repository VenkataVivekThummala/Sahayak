import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface SchemeListScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const SchemeListScreen: React.FC<SchemeListScreenProps> = ({ onNavigate }) => {
  const { language } = useSettingsStore();
  const { schemes } = useSchemeStore();
  const strings = getStrings(language);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedScope, setSelectedScope] = useState<string>("all");

  const categories = [
    { id: "all", label_en: "All", label_te: "అన్నీ" },
    { id: "pension", label_en: "Pension", label_te: "పింఛను" },
    { id: "health", label_en: "Health", label_te: "ఆరోగ్యం" },
    { id: "housing", label_en: "Housing", label_te: "గృహనిర్మాణం" },
    { id: "agriculture", label_en: "Agriculture", label_te: "వ్యవసాయం" },
    { id: "education", label_en: "Education", label_te: "విద్య" },
    { id: "women_family", label_en: "Women & Family", label_te: "మహిళా & కుటుంబం" },
    { id: "social_welfare", label_en: "Youth & Welfare", label_te: "యువజన & సంక్షేమం" },
  ];

  const filteredSchemes = schemes.filter((s) => {
    // Category match
    if (selectedCategory !== "all" && s.category !== selectedCategory) {
      return false;
    }
    // Scope match
    if (selectedScope !== "all" && s.scope !== selectedScope) {
      return false;
    }
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameEn = s.name_en.toLowerCase();
      const nameTe = s.name_te.toLowerCase();
      const sumEn = s.summary_en.toLowerCase();
      const sumTe = s.summary_te.toLowerCase();
      return nameEn.includes(q) || nameTe.includes(q) || sumEn.includes(q) || sumTe.includes(q);
    }
    return true;
  });

  return (
    <div
      data-testid="scheme-list-screen"
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
        <span style={{ fontSize: "20px", fontWeight: 700 }}>{strings.browse_schemes}</span>
      </header>

      {/* Search Bar */}
      <div style={{ padding: "12px 16px", backgroundColor: lightColors.surface, borderBottom: `1px solid ${lightColors.rule}` }}>
        <input
          type="text"
          data-testid="input-scheme-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === "te" ? "పథకాన్ని వెతకండి..." : "Search schemes..."}
          style={{
            width: "100%",
            height: "44px",
            padding: "0 12px",
            fontSize: "16px",
            border: `1px solid ${lightColors.rule}`,
            borderRadius: "6px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          padding: "10px 16px",
          gap: "8px",
          backgroundColor: lightColors.surface,
          borderBottom: `1px solid ${lightColors.rule}`,
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "20px",
                backgroundColor: isSelected ? lightColors.navy : lightColors.paper,
                color: isSelected ? "#FFFFFF" : lightColors.ink,
                fontSize: "14px",
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {language === "te" ? cat.label_te : cat.label_en}
            </button>
          );
        })}
      </div>

      {/* Scope Filter */}
      <div style={{ display: "flex", padding: "8px 16px", gap: "12px", fontSize: "14px", alignItems: "center" }}>
        <span style={{ color: lightColors.inkSecondary }}>
          {language === "te" ? "పరిధి:" : "Scope:"}
        </span>
        <button
          type="button"
          onClick={() => setSelectedScope("all")}
          style={{
            background: "none",
            border: "none",
            fontWeight: selectedScope === "all" ? 700 : 400,
            color: selectedScope === "all" ? lightColors.navy : lightColors.inkSecondary,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "అన్నీ" : "All"}
        </button>
        <button
          type="button"
          onClick={() => setSelectedScope("central")}
          style={{
            background: "none",
            border: "none",
            fontWeight: selectedScope === "central" ? 700 : 400,
            color: selectedScope === "central" ? lightColors.navy : lightColors.inkSecondary,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "కేంద్ర ప్రభుత్వం" : "Central"}
        </button>
        <button
          type="button"
          onClick={() => setSelectedScope("andhra_pradesh")}
          style={{
            background: "none",
            border: "none",
            fontWeight: selectedScope === "andhra_pradesh" ? 700 : 400,
            color: selectedScope === "andhra_pradesh" ? lightColors.navy : lightColors.inkSecondary,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "ఆంధ్రప్రదేశ్" : "Andhra Pradesh"}
        </button>
      </div>

      {/* Scheme List Items */}
      <div style={{ flex: 1, padding: "8px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredSchemes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", color: lightColors.inkSecondary }}>
            {language === "te" ? "ఎటువంటి పథకాలు కనుగొనబడలేదు" : "No schemes found matching criteria"}
          </div>
        ) : (
          filteredSchemes.map((scheme) => (
            <div
              key={scheme.scheme_id}
              data-testid={`scheme-card-${scheme.scheme_id}`}
              onClick={() => onNavigate("scheme-detail", { schemeId: scheme.scheme_id })}
              style={{
                backgroundColor: lightColors.surface,
                border: `1px solid ${lightColors.rule}`,
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: lightColors.navy, fontWeight: 700 }}>
                  {language === "te" ? scheme.name_te : scheme.name_en}
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: scheme.scope === "central" ? "#E3F2FD" : "#FFF3E0",
                    color: scheme.scope === "central" ? "#0D47A1" : "#E65100",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {scheme.scope === "central"
                    ? (language === "te" ? "కేంద్రం" : "Central")
                    : (language === "te" ? "ఆంధ్రప్రదేశ్" : "AP State")}
                </span>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: lightColors.inkSecondary,
                  margin: "0 0 10px 0",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {language === "te" ? scheme.summary_te : scheme.summary_en}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: `1px solid ${lightColors.rule}`, paddingTop: "10px" }}>
                <span style={{ fontSize: "12px", color: lightColors.inkSecondary }}>
                  {strings.last_verified}: {scheme.last_verified}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const portalUrl = scheme.sources[0]?.url || "https://india.gov.in/";
                    window.open(portalUrl, "_blank", "noopener,noreferrer");
                  }}
                  style={{
                    backgroundColor: "#E8F5E9",
                    color: "#1B5E20",
                    border: "1px solid #2E7D32",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  🌐 {language === "te" ? "ప్రభుత్వ పోర్టల్ ↗" : "Official Portal ↗"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
