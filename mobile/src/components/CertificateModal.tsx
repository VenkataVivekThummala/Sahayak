import React from "react";
import { lightColors } from "../theme/tokens";

export interface CertificateData {
  certificate_id: string;
  verification_hash: string;
  verification_qr_text: string;
  generated_at: string;
  citizen_name: string;
  district: string;
  scheme_id: string;
  scheme_name: string;
  department: string;
  status: "eligible" | "not_eligible" | "cannot_determine";
  rules_audit_trail: Array<{
    field: string;
    label: string;
    kind: string;
    result: "passed" | "failed" | "unknown";
    user_value?: any;
  }>;
  warnings?: string[];
  required_documents: Array<{
    name: string;
    required: boolean | null;
  }>;
  primary_source: string;
  disclaimer: string;
}

interface Props {
  cert: CertificateData;
  language: "en" | "te";
  onClose: () => void;
}

export const CertificateModal: React.FC<Props> = ({ cert, language, onClose }) => {
  const isTe = language === "te";
  const isEligible = cert.status === "eligible";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        id="print-certificate-area"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 12px 36px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Noto Sans Telugu', sans-serif",
        }}
      >
        {/* Certificate Header Banner */}
        <div
          style={{
            backgroundColor: lightColors.navy,
            color: "#FFFFFF",
            padding: "16px 20px",
            borderBottom: `4px solid ${lightColors.saffron}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", opacity: 0.85 }}>
              GOVERNMENT OF ANDHRA PRADESH / GOI
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>
              {isTe ? "అర్హత ముందస్తు ధృవీకరణ పత్రం" : "Welfare Eligibility Pre-Assessment Slip"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              fontSize: "24px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Certificate Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Metadata Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              padding: "12px",
              backgroundColor: "#F7FAF8",
              borderRadius: "6px",
              fontSize: "12px",
              border: `1px solid ${lightColors.rule}`,
            }}
          >
            <div>
              <span style={{ color: lightColors.inkSecondary }}>{isTe ? "ధృవీకరణ సంఖ్య:" : "Certificate ID:"}</span>
              <div style={{ fontWeight: 700, color: lightColors.navy, fontFamily: "monospace" }}>{cert.certificate_id}</div>
            </div>
            <div>
              <span style={{ color: lightColors.inkSecondary }}>{isTe ? "తేదీ / సమయం:" : "Timestamp:"}</span>
              <div style={{ fontWeight: 600 }}>{cert.generated_at}</div>
            </div>
            <div>
              <span style={{ color: lightColors.inkSecondary }}>{isTe ? "పౌరుడి పేరు:" : "Beneficiary Name:"}</span>
              <div style={{ fontWeight: 600 }}>{cert.citizen_name}</div>
            </div>
            <div>
              <span style={{ color: lightColors.inkSecondary }}>{isTe ? "జిల్లా / రాష్ట్రం:" : "District / State:"}</span>
              <div style={{ fontWeight: 600 }}>{cert.district}</div>
            </div>
          </div>

          {/* Scheme Evaluated */}
          <div style={{ borderLeft: `4px solid ${lightColors.navy}`, paddingLeft: "12px" }}>
            <div style={{ fontSize: "12px", color: lightColors.inkSecondary, textTransform: "uppercase", fontWeight: 600 }}>
              {isTe ? "పరిశీలించిన ప్రభుత్వ పథకం:" : "Evaluated Scheme:"}
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: lightColors.navy, marginTop: "2px" }}>
              {cert.scheme_name}
            </div>
            <div style={{ fontSize: "12px", color: lightColors.inkSecondary }}>{cert.department}</div>
          </div>

          {/* Decision Stamp */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "6px",
              backgroundColor: isEligible ? "#E8F5E9" : cert.status === "not_eligible" ? "#FFEBEE" : "#FFF8E1",
              border: `2px solid ${isEligible ? lightColors.ok : cert.status === "not_eligible" ? lightColors.bad : lightColors.warn}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: lightColors.inkSecondary, textTransform: "uppercase" }}>
                {isTe ? "నిర్ణయాత్మక ఫలితం (Kleene Audit Result):" : "Official Assessment Status:"}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: isEligible ? lightColors.ok : cert.status === "not_eligible" ? lightColors.bad : lightColors.warn,
                  marginTop: "2px",
                }}
              >
                {isEligible
                  ? (isTe ? "✓ ప్రాథమికంగా అర్హులు (ELIGIBLE)" : "✓ PRELIMINARY ELIGIBLE")
                  : cert.status === "not_eligible"
                  ? (isTe ? "✕ అనర్హులు (NOT ELIGIBLE)" : "✕ NOT ELIGIBLE")
                  : (isTe ? "⚠️ అదనపు సమాచారం అవసరం" : "⚠️ ADDITIONAL PROOF REQUIRED")}
              </div>
            </div>
            <span style={{ fontSize: "36px" }}>{isEligible ? "🎖️" : "📋"}</span>
          </div>

          {/* Rules Audit Trail */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: lightColors.navy, marginBottom: "8px" }}>
              {isTe ? "ధృవీకరించబడిన నిబంధనల తనిఖీ జాబితా (Rule Audit Trail):" : "Verified Rule Audit Trail:"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cert.rules_audit_trail.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    backgroundColor: "#F9F9F9",
                    borderRadius: "4px",
                    fontSize: "12px",
                    borderLeft: `3px solid ${r.result === "passed" ? lightColors.ok : lightColors.bad}`,
                  }}
                >
                  <span style={{ flex: 1 }}>{r.label}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: r.result === "passed" ? lightColors.ok : lightColors.bad,
                      marginLeft: "8px",
                      textTransform: "uppercase",
                      fontSize: "11px",
                    }}
                  >
                    {r.result === "passed" ? "PASSED ✓" : "FAILED ✕"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: lightColors.navy, marginBottom: "8px" }}>
              {isTe ? "సచివాలయం / సేవా కేంద్రానికి తీసుకెళ్లవలసిన పత్రాలు:" : "Documents to Carry to Sachivalayam / Office:"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {cert.required_documents.map((doc, idx) => (
                <div key={idx} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{doc.required ? "☑" : "☐"}</span>
                  <span style={{ color: lightColors.ink }}>{doc.name}</span>
                  <span style={{ fontSize: "10px", color: doc.required ? lightColors.ok : lightColors.inkSecondary, fontWeight: 600 }}>
                    ({doc.required ? (isTe ? "తప్పనిసరి" : "Mandatory") : (isTe ? "ఐచ్ఛికం" : "Optional")})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Signature & Tamper-Evident QR Text */}
          <div
            style={{
              padding: "12px",
              backgroundColor: "#ECEFF1",
              borderRadius: "6px",
              border: "1px dashed #90A4AE",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#37474F" }}>
                {isTe ? "డిజిటల్ ధృవీకరణ సంతకం:" : "Digital Verification Signature (SHA-256):"}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: lightColors.navy, marginTop: "2px" }}>
                HASH: {cert.verification_hash}
              </div>
              <div style={{ fontSize: "10px", color: lightColors.inkSecondary, marginTop: "2px" }}>
                Verify at Grama Sachivalayam Helpdesk Portal
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
              title={cert.verification_qr_text}
            >
              <span>🏁</span>
              <span style={{ fontSize: "8px", fontWeight: 700 }}>QR SEC</span>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div style={{ fontSize: "10px", color: lightColors.inkSecondary, lineHeight: 1.3, fontStyle: "italic" }}>
            * {cert.disclaimer}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "#F7FAF8",
            borderTop: `1px solid ${lightColors.rule}`,
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={handlePrint}
            style={{
              flex: 1,
              height: "44px",
              backgroundColor: lightColors.navy,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            🖨️ {isTe ? "సర్టిఫికెట్ ప్రింట్ / సేవ్ చేయండి" : "Print / Save PDF"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0 18px",
              height: "44px",
              backgroundColor: "transparent",
              color: lightColors.ink,
              border: `1px solid ${lightColors.rule}`,
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isTe ? "మూసివేయి" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
