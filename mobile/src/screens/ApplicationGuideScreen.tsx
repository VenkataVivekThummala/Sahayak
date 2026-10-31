import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface ApplicationGuideScreenProps {
  schemeId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const ApplicationGuideScreen: React.FC<ApplicationGuideScreenProps> = ({
  schemeId: initialSchemeId,
  onNavigate,
}) => {
  const { language } = useSettingsStore();
  const { schemes } = useSchemeStore();
  const strings = getStrings(language);

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(
    initialSchemeId || schemes[0]?.scheme_id || "pm-kisan"
  );
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const scheme = schemes.find((s) => s.scheme_id === selectedSchemeId) || schemes[0];

  const toggleStep = (idx: number) => {
    const key = `${selectedSchemeId}:${idx}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleListenStep = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "te" ? "te-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const completedCount = scheme.steps.filter((_: any, idx: number) => completedSteps[`${selectedSchemeId}:${idx}`]).length;

  return (
    <div
      data-testid="steps-screen"
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
          <span style={{ fontSize: "18px", fontWeight: 700 }}>{strings.application_guide}</span>
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

      {/* Progress Line */}
      <div style={{ padding: "12px 20px", backgroundColor: lightColors.paper, borderBottom: `1px solid ${lightColors.rule}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: lightColors.navy }}>
          <span>
            {language === "te"
              ? `దశ ${completedCount} / ${scheme.steps.length} పూర్తయింది`
              : `Step ${completedCount} of ${scheme.steps.length} completed`}
          </span>
          <span>{Math.round((completedCount / scheme.steps.length) * 100)}%</span>
        </div>
        <div style={{ width: "100%", height: "4px", backgroundColor: lightColors.rule, borderRadius: "2px", marginTop: "8px" }}>
          <div
            style={{
              width: `${(completedCount / scheme.steps.length) * 100}%`,
              height: "100%",
              backgroundColor: lightColors.saffron,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div
        style={{
          margin: "16px 16px 0 16px",
          padding: "10px 14px",
          backgroundColor: "#FFF8E1",
          borderLeft: `4px solid ${lightColors.saffron}`,
          fontSize: "13px",
          color: lightColors.inkSecondary,
        }}
      >
        ℹ️ {strings.not_submit}
      </div>

      {/* Stepper Steps */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {scheme.steps.map((st: any, idx: number) => {
          const isDone = !!completedSteps[`${selectedSchemeId}:${idx}`];
          const text = language === "te" ? st.te : st.en;

          // Check if step mentions a website URL
          const urlMatch = text.match(/https?:\/\/[^\s)]+/);

          return (
            <div
              key={idx}
              data-testid={`step-card-${idx}`}
              style={{
                backgroundColor: lightColors.surface,
                border: `1px solid ${isDone ? lightColors.ok : lightColors.rule}`,
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    backgroundColor: lightColors.navy,
                    color: "#FFFFFF",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {idx + 1}
                </span>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => handleListenStep(text)}
                    style={{ background: "none", border: "none", color: lightColors.navy, fontSize: "16px", cursor: "pointer" }}
                    title="Listen"
                  >
                    🔊
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStep(idx)}
                    style={{
                      background: "none",
                      border: `1px solid ${isDone ? lightColors.ok : lightColors.rule}`,
                      color: isDone ? lightColors.ok : lightColors.inkSecondary,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isDone
                      ? (language === "te" ? "పూర్తయింది ✓" : "Completed ✓")
                      : (language === "te" ? "పూర్తిగా గుర్తించండి" : "Mark done")}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "15px", lineHeight: 1.5, color: lightColors.ink }}>
                {text}
              </div>

              {urlMatch && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setPendingUrl(urlMatch[0])}
                    style={{
                      backgroundColor: lightColors.paper,
                      border: `1px solid ${lightColors.navy}`,
                      color: lightColors.navy,
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🌐 {language === "te" ? "అధికారిక వెబ్‌సైట్ తెరవండి" : "Open official website"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* After You Apply Card */}
        <div
          style={{
            backgroundColor: lightColors.surface,
            border: `1px dashed ${lightColors.navy}`,
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", color: lightColors.navy }}>
            {language === "te" ? "దరఖాస్తు చేసిన తర్వాత:" : "After You Apply:"}
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: lightColors.inkSecondary }}>
            {language === "te"
              ? "మీ దరఖాస్తు రసీదు నంబర్‌ను భద్రపరుచుకోండి. సహాయం కోసం గ్రామ సచివాలయం లేదా హెల్ప్‌డెస్క్‌ను సంప్రదించండి."
              : "Keep your application acknowledgement slip safe. Contact your Sachivalayam or our help desk for assistance."}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => onNavigate("centres")}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: lightColors.navy,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {strings.nearby_centres}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("helpdesk")}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "transparent",
                color: lightColors.navy,
                border: `1px solid ${lightColors.navy}`,
                borderRadius: "4px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {strings.need_help}
            </button>
          </div>
        </div>
      </div>

      {/* Domain Confirmation Modal */}
      {pendingUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: lightColors.surface,
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: lightColors.navy }}>
              {language === "te" ? "బాహ్య వెబ్‌సైట్ నిర్ధారణ" : "External Website Confirmation"}
            </h3>
            <p style={{ fontSize: "14px", color: lightColors.inkSecondary, margin: "0 0 16px 0" }}>
              {language === "te"
                ? `మీరు అధికారిక పోర్టల్‌కు వెళ్తున్నారు: ${pendingUrl}`
                : `You are opening the official government portal: ${pendingUrl}`}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPendingUrl(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: lightColors.paper,
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {language === "te" ? "రద్దు చేయండి" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(pendingUrl, "_blank");
                  setPendingUrl(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: lightColors.navy,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {language === "te" ? "ముందుకు సాగండి" : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
