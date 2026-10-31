import React, { useEffect } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface SchemeDetailScreenProps {
  schemeId: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const SchemeDetailScreen: React.FC<SchemeDetailScreenProps> = ({
  schemeId,
  onNavigate,
}) => {
  const { language } = useSettingsStore();
  const { schemes, addRecentScheme } = useSchemeStore();
  const strings = getStrings(language);

  const scheme = schemes.find((s) => s.scheme_id === schemeId) || schemes[0];

  useEffect(() => {
    if (scheme) {
      addRecentScheme(scheme.scheme_id);
    }
  }, [scheme?.scheme_id]);

  if (!scheme) {
    return <div>Scheme not found</div>;
  }

  const name = language === "te" ? scheme.name_te : scheme.name_en;
  const summary = language === "te" ? scheme.summary_te : scheme.summary_en;
  const benefits = language === "te" ? scheme.benefits_te : scheme.benefits_en;
  const eligibility = language === "te" ? scheme.eligibility_text_te : scheme.eligibility_text_en;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShare = () => {
    const text = `${name}\n\n${summary}\n\nOfficial Source: ${scheme.sources[0]?.url || "https://gov.in"}`;
    if (navigator.share) {
      navigator.share({ title: name, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      alert(language === "te" ? "వివరాలు కాపీ చేయబడ్డాయి" : "Details copied to clipboard");
    }
  };

  const handleListen = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`${name}. ${summary}`);
      utterance.lang = language === "te" ? "te-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      data-testid="scheme-detail-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: lightColors.paper,
        color: lightColors.ink,
        fontFamily: "'Noto Sans Telugu', sans-serif",
        paddingBottom: "84px",
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
            onClick={() => onNavigate("schemes")}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
          >
            ←
          </button>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>{name}</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleListen}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
            title="Listen"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={handleShare}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
            title="Share"
          >
            🔗
          </button>
        </div>
      </header>

      {/* In-page Anchor Nav */}
      <nav
        style={{
          display: "flex",
          overflowX: "auto",
          padding: "10px 16px",
          gap: "12px",
          backgroundColor: lightColors.surface,
          borderBottom: `1px solid ${lightColors.rule}`,
        }}
      >
        <button type="button" onClick={() => scrollToSection("sec-overview")} style={subTabStyle}>
          {language === "te" ? "సారాంశం" : "Overview"}
        </button>
        <button type="button" onClick={() => scrollToSection("sec-eligibility")} style={subTabStyle}>
          {language === "te" ? "అర్హతలు" : "Eligibility"}
        </button>
        <button type="button" onClick={() => scrollToSection("sec-benefits")} style={subTabStyle}>
          {language === "te" ? "ప్రయోజనాలు" : "Benefits"}
        </button>
        <button type="button" onClick={() => scrollToSection("sec-docs")} style={subTabStyle}>
          {language === "te" ? "పత్రాలు" : "Documents"}
        </button>
        <button type="button" onClick={() => scrollToSection("sec-steps")} style={subTabStyle}>
          {language === "te" ? "దరఖాస్తు విధానం" : "How to Apply"}
        </button>
        <button type="button" onClick={() => scrollToSection("sec-sources")} style={subTabStyle}>
          {language === "te" ? "మూలాలు" : "Sources"}
        </button>
      </nav>

      {/* Content Body */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Meta Header */}
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
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
                ? (language === "te" ? "కేంద్ర ప్రభుత్వం" : "Central Government")
                : (language === "te" ? "ఆంధ్రప్రదేశ్ ప్రభుత్వం" : "Government of AP")}
            </span>
            <span style={{ fontSize: "13px", color: lightColors.inkSecondary }}>
              {scheme.department}
            </span>
          </div>
          <h1 style={{ fontSize: "24px", color: lightColors.navy, margin: "4px 0 12px 0" }}>
            {name}
          </h1>
        </div>

        {/* Live Official Government Application Banner */}
        <div
          style={{
            backgroundColor: "#E8F5E9",
            border: `2px solid ${lightColors.ok}`,
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🏛️</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {language === "te" ? "ప్రత్యక్ష ప్రభుత్వ పోర్టల్" : "Live Official Government Portal"}
              </span>
            </div>
            <span
              style={{
                backgroundColor: "#2E7D32",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "12px",
                textTransform: "uppercase",
              }}
            >
              ● LIVE
            </span>
          </div>

          <div style={{ fontSize: "13px", color: lightColors.ink, lineHeight: 1.4 }}>
            {language === "te"
              ? "ఈ పథకానికి సంబంధించి అధికారిక దరఖాస్తులు, ఈకేవైసీ, లేదా ఖాతా స్థితిని నేరుగా ప్రభుత్వ అధికారిక వెబ్‌సైట్ ద్వారా పొందండి:"
              : "Submit your live online application, perform mandatory e-KYC, or track payment status directly on the authorized government portal:"}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                const targetUrl = scheme.sources[0]?.url || "https://india.gov.in/";
                window.open(targetUrl, "_blank", "noopener,noreferrer");
              }}
              style={{
                flex: 1,
                minWidth: "160px",
                height: "44px",
                backgroundColor: "#1B5E20",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              🌐 {language === "te" ? "ప్రభుత్వ పోర్టల్‌ను తెరవండి ↗" : "Open Government Portal ↗"}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("steps", { schemeId: scheme.scheme_id })}
              style={{
                padding: "0 14px",
                height: "44px",
                backgroundColor: "#FFFFFF",
                color: "#1B5E20",
                border: "1px solid #1B5E20",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {language === "te" ? "దశల మార్గదర్శిని" : "View Steps"}
            </button>
          </div>
        </div>

        {/* Overview Section */}
        <section id="sec-overview" style={cardSectionStyle}>
          <h2 style={sectionHeadingStyle}>{language === "te" ? "సారాంశం (Overview)" : "Overview"}</h2>
          <p style={{ margin: 0, fontSize: "16px", lineHeight: 1.5 }}>{summary}</p>
        </section>

        {/* Eligibility Section */}
        <section id="sec-eligibility" style={cardSectionStyle}>
          <h2 style={sectionHeadingStyle}>{language === "te" ? "అర్హత నిబంధనలు" : "Eligibility Criteria"}</h2>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "15px", lineHeight: 1.6 }}>
            {eligibility.map((item: any, idx: number) => (
              <li key={idx} style={{ marginBottom: "6px" }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Benefits Section */}
        <section id="sec-benefits" style={cardSectionStyle}>
          <h2 style={sectionHeadingStyle}>{language === "te" ? "పథకం ప్రయోజనాలు" : "Benefits"}</h2>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "15px", lineHeight: 1.6 }}>
            {benefits.map((benefit: any, idx: number) => (
              <li key={idx} style={{ marginBottom: "6px" }}>
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        {/* Documents Preview */}
        <section id="sec-docs" style={cardSectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>
              {language === "te" ? "అవసరమైన పత్రాలు" : "Required Documents"}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("documents", { schemeId: scheme.scheme_id })}
              style={{
                background: "none",
                border: "none",
                color: lightColors.saffron,
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {language === "te" ? "చెక్‌లిస్ట్ తెరవండి ›" : "Open Checklist ›"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {scheme.documents.slice(0, 4).map((doc: any, idx: number) => (
              <div key={idx} style={{ fontSize: "14px", color: lightColors.ink }}>
                • {language === "te" ? doc.te : doc.en}{" "}
                <span style={{ fontSize: "12px", color: doc.required ? lightColors.ok : lightColors.inkSecondary }}>
                  ({doc.required ? strings.required : strings.optional})
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Application Steps Preview */}
        <section id="sec-steps" style={cardSectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>
              {language === "te" ? "దరఖాస్తు విధానం" : "Application Steps"}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("steps", { schemeId: scheme.scheme_id })}
              style={{
                background: "none",
                border: "none",
                color: lightColors.saffron,
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {language === "te" ? "పూర్తి మార్గదర్శిని ›" : "Full Guide ›"}
            </button>
          </div>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: 1.5 }}>
            {scheme.steps.map((st: any, idx: number) => (
              <li key={idx} style={{ marginBottom: "6px" }}>
                {language === "te" ? st.te : st.en}
              </li>
            ))}
          </ol>
        </section>

        {/* Important Notes / Caveats */}
        {scheme.caveats_en && scheme.caveats_en.length > 0 && (
          <section style={cardSectionStyle}>
            <h2 style={sectionHeadingStyle}>
              {language === "te" ? "ముఖ్యమైన గమనికలు (Important Notes)" : "Important Notes"}
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: lightColors.inkSecondary }}>
              {scheme.caveats_en.map((c: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Known Discrepancies Warning */}
        {scheme.known_discrepancies && scheme.known_discrepancies.length > 0 && (
          <div
            style={{
              backgroundColor: lightColors.warnBg,
              border: `1px solid ${lightColors.warn}`,
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontWeight: 700, color: lightColors.warn, marginBottom: "4px" }}>
              ⚠️ {language === "te" ? "అధికారిక మూలాల వ్యత్యాసం" : "Official Sources Discrepancy"}
            </div>
            {scheme.known_discrepancies.map((d: any, idx: number) => (
              <div key={idx} style={{ fontSize: "14px", color: lightColors.ink, marginTop: "4px" }}>
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Sources Section */}
        <section id="sec-sources" style={cardSectionStyle}>
          <h2 style={sectionHeadingStyle}>{language === "te" ? "ధృవీకరించబడిన మూలాలు" : "Verified Sources"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {scheme.sources.map((src: any, idx: number) => (
              <div key={idx} style={{ fontSize: "13px", borderBottom: `1px solid ${lightColors.rule}`, paddingBottom: "6px" }}>
                <div style={{ fontWeight: 600 }}>{src.title}</div>
                <div style={{ color: lightColors.inkSecondary, marginTop: "2px" }}>
                  Type: <strong>{src.type}</strong> |{" "}
                  <a href={src.url} target="_blank" rel="noreferrer" style={{ color: lightColors.navy }}>
                    {src.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: lightColors.inkSecondary, marginTop: "10px" }}>
            {strings.last_verified}: {scheme.last_verified}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Actions */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px",
          backgroundColor: lightColors.surface,
          borderTop: `1px solid ${lightColors.rule}`,
          display: "flex",
          gap: "10px",
          zIndex: 20,
        }}
      >
        <button
          type="button"
          data-testid="btn-check-eligibility-detail"
          onClick={() => onNavigate("eligibility", { schemeId: scheme.scheme_id })}
          style={{
            flex: 1,
            height: "48px",
            backgroundColor: lightColors.navy,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {strings.check_eligibility}
        </button>
        <button
          type="button"
          data-testid="btn-ask-scheme-detail"
          onClick={() => onNavigate("assistant", { preScopedSchemeId: scheme.scheme_id })}
          style={{
            flex: 1,
            height: "48px",
            backgroundColor: lightColors.surface,
            color: lightColors.navy,
            border: `2px solid ${lightColors.navy}`,
            borderRadius: "6px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {language === "te" ? "ప్రశ్న అడగండి" : "Ask Question"}
        </button>
      </div>
    </div>
  );
};

const subTabStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: lightColors.inkSecondary,
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const cardSectionStyle: React.CSSProperties = {
  backgroundColor: lightColors.surface,
  border: `1px solid ${lightColors.rule}`,
  borderRadius: "8px",
  padding: "16px",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "18px",
  color: lightColors.navy,
  fontWeight: 700,
  margin: "0 0 10px 0",
};
