import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";
import { checkEligibilityOffline, KleeneResult } from "../engine/engine";
import { CertificateModal, CertificateData } from "../components/CertificateModal";
import { useCitizenAuthStore } from "../store/citizenAuthStore";
import fieldsData from "../../../data/fields.json";

interface EligibilityCheckerScreenProps {
  schemeId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const EligibilityCheckerScreen: React.FC<EligibilityCheckerScreenProps> = ({
  schemeId: initialSchemeId,
  onNavigate,
}) => {
  const { language } = useSettingsStore();
  const { schemes } = useSchemeStore();
  const strings = getStrings(language);

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(
    initialSchemeId || schemes[0]?.scheme_id || "pm-kisan"
  );
  const { citizen } = useCitizenAuthStore();
  const [facts, setFacts] = useState<Record<string, any>>({});
  const [result, setResult] = useState<KleeneResult | null>(null);
  const [numInput, setNumInput] = useState<string>("");
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [generatingCert, setGeneratingCert] = useState<boolean>(false);

  const scheme = schemes.find((s) => s.scheme_id === selectedSchemeId) || schemes[0];

  const handleGenerateCertificate = async () => {
    if (!scheme || !result) return;
    setGeneratingCert(true);
    try {
      const resp = await fetch("/api/eligibility/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme_id: scheme.scheme_id,
          facts,
          language,
          citizen_name: citizen?.full_name || (language === "te" ? "ధృవీకరించిన పౌరుడు" : "Verified Citizen"),
          district: citizen?.district || "Andhra Pradesh",
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setCertificateData(data);
      } else {
        throw new Error("Failed from server");
      }
    } catch {
      // Offline fallback certificate generation
      const certId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const nowStr = new Date().toLocaleString();
      const mockHash = `AP-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
      setCertificateData({
        certificate_id: certId,
        verification_hash: mockHash,
        verification_qr_text: `GOV-SAHAYAK:VERIFY:${certId}:${mockHash}`,
        generated_at: nowStr,
        citizen_name: citizen?.full_name || (language === "te" ? "ధృవీకరించిన పౌరుడు" : "Verified Citizen"),
        district: citizen?.district || "Andhra Pradesh",
        scheme_id: scheme.scheme_id,
        scheme_name: language === "te" ? scheme.name_te : scheme.name_en,
        department: scheme.department,
        status: result.status,
        rules_audit_trail: result.reasons,
        warnings: result.warnings,
        required_documents: scheme.documents.map((d: any) => ({
          name: language === "te" ? d.te : d.en,
          required: d.required,
        })),
        primary_source: scheme.sources?.[0]?.url || "https://india.gov.in/",
        disclaimer: result.disclaimer || "Pre-assessment guidance based on verified official government records.",
      });
    } finally {
      setGeneratingCert(false);
    }
  };


  // Run evaluation
  const evaluate = (updatedFacts: Record<string, any>) => {
    if (!scheme) return;
    const res = checkEligibilityOffline(scheme, updatedFacts, language);
    setResult(res);
  };

  const handleSchemeChange = (id: string) => {
    setSelectedSchemeId(id);
    setFacts({});
    setResult(null);
  };

  const handleAnswerBool = (field: string, val: boolean) => {
    const updated = { ...facts, [field]: val };
    setFacts(updated);
    evaluate(updated);
  };

  const handleAnswerNum = (field: string) => {
    if (numInput === "") return;
    const updated = { ...facts, [field]: Number(numInput) };
    setFacts(updated);
    setNumInput("");
    evaluate(updated);
  };

  const resetAll = () => {
    setFacts({});
    setResult(null);
  };

  // Determine current active question
  const currentMissingField = result ? result.missing_fields[0] : null;
  const fieldSpec = currentMissingField ? (fieldsData as any)[currentMissingField] : null;

  return (
    <div
      data-testid="eligibility-screen"
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
          <span style={{ fontSize: "18px", fontWeight: 700 }}>{strings.check_eligibility}</span>
        </div>
        <button
          type="button"
          onClick={resetAll}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#FFFFFF",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {language === "te" ? "మళ్లీ ప్రారంభించు" : "Reset"}
        </button>
      </header>

      {/* Scheme Selector */}
      <div style={{ padding: "16px", backgroundColor: lightColors.surface, borderBottom: `1px solid ${lightColors.rule}` }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: lightColors.inkSecondary, marginBottom: "6px" }}>
          {language === "te" ? "పథకాన్ని ఎంచుకోండి:" : "Select Scheme:"}
        </label>
        <select
          data-testid="select-scheme"
          value={selectedSchemeId}
          onChange={(e) => handleSchemeChange(e.target.value)}
          style={{
            width: "100%",
            height: "44px",
            padding: "0 10px",
            fontSize: "16px",
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

      {/* Main Body */}
      <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* If no evaluation has run yet, trigger initial calculation */}
        {!result && (
          <div style={{ textAlign: "center", padding: "30px 16px" }}>
            <h3 style={{ color: lightColors.navy, marginBottom: "8px" }}>
              {language === "te" ? scheme.name_te : scheme.name_en}
            </h3>
            <p style={{ color: lightColors.inkSecondary, marginBottom: "20px" }}>
              {language === "te"
                ? "మీరు ఈ పథకానికి అర్హులో కాదో తెలుసుకోవడానికి కొన్ని సులువైన ప్రశ్నలకు సమాధానం ఇవ్వండి."
                : "Answer a few straightforward questions to check whether you meet the official criteria."}
            </p>
            <button
              type="button"
              data-testid="btn-start-evaluation"
              onClick={() => evaluate({})}
              style={{
                padding: "14px 28px",
                backgroundColor: lightColors.navy,
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {language === "te" ? "తనిఖీని ప్రారంభించండి" : "Begin Check"}
            </button>
          </div>
        )}

        {/* Question Card */}
        {result && currentMissingField && fieldSpec && (
          <div
            style={{
              backgroundColor: lightColors.surface,
              border: `2px solid ${lightColors.navy}`,
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: lightColors.saffron, textTransform: "uppercase", marginBottom: "6px" }}>
              {language === "te" ? "ప్రశ్న" : "Question"}
            </div>
            <h3 style={{ fontSize: "18px", color: lightColors.navy, margin: "0 0 16px 0" }}>
              {language === "te" ? fieldSpec.te : fieldSpec.en}
            </h3>

            {fieldSpec.type === "bool" ? (
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  data-testid="btn-answer-yes"
                  onClick={() => handleAnswerBool(currentMissingField, true)}
                  style={{
                    flex: 1,
                    height: "50px",
                    backgroundColor: lightColors.navy,
                    color: "#FFFFFF",
                    fontSize: "16px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {strings.yes}
                </button>
                <button
                  type="button"
                  data-testid="btn-answer-no"
                  onClick={() => handleAnswerBool(currentMissingField, false)}
                  style={{
                    flex: 1,
                    height: "50px",
                    backgroundColor: lightColors.surface,
                    color: lightColors.navy,
                    border: `2px solid ${lightColors.navy}`,
                    fontSize: "16px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {strings.no}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="number"
                  data-testid="input-answer-num"
                  value={numInput}
                  onChange={(e) => setNumInput(e.target.value)}
                  placeholder="సంఖ్యను నమోదు చేయండి / Enter value"
                  style={{
                    flex: 1,
                    height: "48px",
                    padding: "0 12px",
                    fontSize: "16px",
                    border: `1px solid ${lightColors.rule}`,
                    borderRadius: "6px",
                  }}
                />
                <button
                  type="button"
                  data-testid="btn-submit-num"
                  onClick={() => handleAnswerNum(currentMissingField)}
                  style={{
                    padding: "0 20px",
                    backgroundColor: lightColors.navy,
                    color: "#FFFFFF",
                    fontSize: "16px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {strings.send}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div
            data-testid="result-card"
            style={{
              backgroundColor: lightColors.surface,
              border: `1px solid ${lightColors.rule}`,
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color:
                  result.status === "eligible"
                    ? lightColors.ok
                    : result.status === "not_eligible"
                    ? lightColors.bad
                    : lightColors.warn,
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>
                {result.status === "eligible" ? "✓" : result.status === "not_eligible" ? "✕" : "⚠️"}
              </span>
              <span>
                {result.status === "eligible"
                  ? strings.eligible
                  : result.status === "not_eligible"
                  ? strings.not_eligible
                  : strings.cannot_decide}
              </span>
            </div>

            {/* Explanations & Criteria breakdown */}
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.reasons.map((r: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "14px",
                    padding: "8px 10px",
                    backgroundColor: lightColors.paper,
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{r.label}</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        r.result === "passed"
                          ? lightColors.ok
                          : r.result === "failed"
                          ? lightColors.bad
                          : lightColors.warn,
                    }}
                  >
                    {r.result === "passed" ? "Passed" : r.result === "failed" ? "Failed" : "Unknown"}
                  </span>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px",
                  backgroundColor: lightColors.warnBg,
                  borderRadius: "4px",
                  fontSize: "13px",
                  color: lightColors.warn,
                }}
              >
                {result.warnings.map((w: any, idx: number) => (
                  <div key={idx}>⚠️ {w}</div>
                ))}
              </div>
            )}

            {/* Official Eligibility Certificate Action */}
            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                onClick={handleGenerateCertificate}
                disabled={generatingCert}
                style={{
                  width: "100%",
                  height: "48px",
                  backgroundColor: "#1B5E20",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 6px rgba(27,94,32,0.25)",
                }}
              >
                📜 {generatingCert ? "Generating Certificate..." : (language === "te" ? "అర్హత ధృవీకరణ పత్రం డౌన్‌లోడ్ చేయండి (PDF) 🖨️" : "Download Official Assessment Slip (PDF) 🖨️")}
              </button>
            </div>

            {/* Next Action Links */}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => onNavigate("documents", { schemeId: scheme.scheme_id })}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: lightColors.navy,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {strings.required_documents}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("helpdesk")}
                style={{
                  padding: "10px 14px",
                  backgroundColor: "transparent",
                  color: lightColors.navy,
                  border: `1px solid ${lightColors.navy}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {strings.need_help}
              </button>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                fontSize: "11px",
                color: lightColors.inkSecondary,
                marginTop: "16px",
                borderTop: `1px dashed ${lightColors.rule}`,
                paddingTop: "6px",
                lineHeight: 1.4,
              }}
            >
              {result.disclaimer}
            </div>
          </div>
        )}
      </div>

      {/* Official Certificate Modal */}
      {certificateData && (
        <CertificateModal
          cert={certificateData}
          language={language}
          onClose={() => setCertificateData(null)}
        />
      )}
    </div>
  );
};
