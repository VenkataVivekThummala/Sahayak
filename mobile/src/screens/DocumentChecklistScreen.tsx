import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface DocumentChecklistScreenProps {
  schemeId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const DocumentChecklistScreen: React.FC<DocumentChecklistScreenProps> = ({
  schemeId: initialSchemeId,
  onNavigate,
}) => {
  const { language } = useSettingsStore();
  const { schemes } = useSchemeStore();
  const strings = getStrings(language);

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(
    initialSchemeId || schemes[0]?.scheme_id || "pm-kisan"
  );
  // Checked state keyed by "schemeId:index"
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const scheme = schemes.find((s) => s.scheme_id === selectedSchemeId) || schemes[0];

  const toggleCheck = (idx: number) => {
    const key = `${selectedSchemeId}:${idx}`;
    setCheckedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const requiredDocs = scheme.documents.filter((d: any) => d.required === true);
  const readyRequiredCount = requiredDocs.filter((_: any, idx: number) => checkedMap[`${selectedSchemeId}:${idx}`]).length;

  const handleReset = () => {
    if (window.confirm(language === "te" ? "మీ చెక్‌లిస్ట్‌ను రీసెట్ చేయాలనుకుంటున్నారా?" : "Reset document checklist?")) {
      const updated = { ...checkedMap };
      scheme.documents.forEach((_: any, idx: number) => {
        delete updated[`${selectedSchemeId}:${idx}`];
      });
      setCheckedMap(updated);
    }
  };

  const handleShare = () => {
    const title = language === "te" ? scheme.name_te : scheme.name_en;
    const items = scheme.documents
      .map((d: any, idx: number) => {
        const isChecked = checkedMap[`${selectedSchemeId}:${idx}`] ? "[✓]" : "[ ]";
        const docName = language === "te" ? d.te : d.en;
        return `${isChecked} ${docName}`;
      })
      .join("\n");
    const shareText = `${title} - ${language === "te" ? "పత్రాల చెక్‌లిస్ట్" : "Documents Checklist"}\n\n${items}`;

    if (navigator.share) {
      navigator.share({ title, text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText);
      alert(language === "te" ? "చెక్‌లిస్ట్ కాపీ చేయబడింది" : "Checklist copied to clipboard");
    }
  };

  const handleListen = () => {
    if ("speechSynthesis" in window) {
      const title = language === "te" ? scheme.name_te : scheme.name_en;
      const text = `${title}. ` + scheme.documents.map((d: any) => (language === "te" ? d.te : d.en)).join(", ");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "te" ? "te-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      data-testid="documents-screen"
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
          justifyContent: "space-between",
          padding: "16px 20px",
          backgroundColor: lightColors.navy,
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
          >
            ←
          </button>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>{strings.required_documents}</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleListen}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "18px", cursor: "pointer" }}
            title="Read aloud"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={handleShare}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "18px", cursor: "pointer" }}
            title="Share"
          >
            🔗
          </button>
        </div>
      </header>

      {/* Scheme Selector */}
      <div style={{ padding: "14px 16px", backgroundColor: lightColors.surface, borderBottom: `1px solid ${lightColors.rule}` }}>
        <select
          value={selectedSchemeId}
          onChange={(e) => setSelectedSchemeId(e.target.value)}
          style={{
            width: "100%",
            height: "44px",
            padding: "0 10px",
            fontSize: "15px",
            border: `1px solid ${lightColors.rule}`,
            borderRadius: "6px",
            backgroundColor: lightColors.paper,
          }}
        >
          {schemes.map((s) => (
            <option key={s.scheme_id} value={s.scheme_id}>
              {language === "te" ? s.name_te : s.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Counter */}
      <div
        style={{
          padding: "14px 20px",
          backgroundColor: lightColors.paper,
          borderBottom: `1px solid ${lightColors.rule}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: 600, color: lightColors.navy }}>
          {language === "te"
            ? `${readyRequiredCount} / ${requiredDocs.length} అవసరమైన పత్రాలు సిద్ధం`
            : `${readyRequiredCount} of ${requiredDocs.length} required documents ready`}
        </div>
        <button
          type="button"
          onClick={handleReset}
          style={{
            background: "none",
            border: "none",
            color: lightColors.bad,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "రీసెట్ చేయండి" : "Reset"}
        </button>
      </div>

      {/* Checklist Items */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {scheme.documents.map((doc: any, idx: number) => {
          const isChecked = !!checkedMap[`${selectedSchemeId}:${idx}`];
          const tagLabel =
            doc.required === true
              ? strings.required
              : doc.required === false
              ? strings.optional
              : strings.confirm_office;

          const tagColor =
            doc.required === true
              ? { bg: "#E8F5E9", text: lightColors.ok }
              : doc.required === false
              ? { bg: "#F5F5F5", text: lightColors.inkSecondary }
              : { bg: lightColors.warnBg, text: lightColors.warn };

          return (
            <div
              key={idx}
              data-testid={`doc-row-${idx}`}
              onClick={() => toggleCheck(idx)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px 16px",
                backgroundColor: lightColors.surface,
                border: `1px solid ${isChecked ? lightColors.navy : lightColors.rule}`,
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCheck(idx)}
                style={{
                  width: "22px",
                  height: "22px",
                  accentColor: lightColors.navy,
                  marginTop: "2px",
                  cursor: "pointer",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: lightColors.ink,
                    textDecoration: isChecked ? "line-through" : "none",
                  }}
                >
                  {language === "te" ? doc.te : doc.en}
                </div>
                <div style={{ marginTop: "4px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: tagColor.bg,
                      color: tagColor.text,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {tagLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
