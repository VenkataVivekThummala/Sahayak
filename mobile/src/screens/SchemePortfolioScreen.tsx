import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { lightColors } from "../theme/tokens";
import { evaluateAllSchemesOffline, UniversalPortfolioResult, SchemePortfolioSummary } from "../engine/engine";
import { CertificateModal, CertificateData } from "../components/CertificateModal";
import { useCitizenAuthStore } from "../store/citizenAuthStore";

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

export const SchemePortfolioScreen: React.FC<Props> = ({ onNavigate }) => {
  const { language } = useSettingsStore();
  const { schemes } = useSchemeStore();
  const { citizen } = useCitizenAuthStore();
  const isTe = language === "te";

  // Universal profile facts state
  const [facts, setFacts] = useState<Record<string, any>>({
    ap_resident: true,
    age: 62,
    annual_income: 180000,
    is_bpl: true,
    owns_cultivable_land: true,
    is_income_tax_payer: false,
    holds_constitutional_post: false,
    is_institutional_landholder: false,
    has_pucca_house: false,
    in_secc_deprivation_list: true,
    in_pmayg_beneficiary_list: false,
    is_girl_child: false,
    girl_child_age: 8,
    is_sc_category: false,
    is_enrolled_post_matric: false,
    child_in_school: true,
    child_attendance_gte_75: true,
    has_active_lpg_connection: true,
    is_female: false,
    is_unemployed_youth: false,
    has_diploma_or_degree: false,
    enrolled_in_higher_education: false,
  });

  const [activeTab, setActiveTab] = useState<"eligible" | "conditionally_eligible" | "ineligible">("eligible");
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

  // Evaluate across all schemes using Kleene 3-valued engine
  const portfolioResult: UniversalPortfolioResult = evaluateAllSchemesOffline(schemes, facts, language);

  const handleToggle = (field: string) => {
    setFacts((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNumberChange = (field: string, val: string) => {
    const num = Number(val);
    setFacts((prev) => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  };

  const openCertForScheme = (item: SchemePortfolioSummary) => {
    const targetScheme = schemes.find((s) => s.scheme_id === item.scheme_id);
    const certId = `PORT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const nowStr = new Date().toLocaleString();
    const hash = `VER-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

    setSelectedCert({
      certificate_id: certId,
      verification_hash: hash,
      verification_qr_text: `GOV-SAHAYAK:PORTFOLIO:${certId}:${hash}`,
      generated_at: nowStr,
      citizen_name: citizen?.full_name || (isTe ? "ధృవీకరించిన పౌరుడు" : "Verified Citizen"),
      district: citizen?.district || "Andhra Pradesh",
      scheme_id: item.scheme_id,
      scheme_name: item.name,
      department: targetScheme?.department || "Government Welfare Department",
      status: item.status,
      rules_audit_trail: item.reasons,
      warnings: item.warnings,
      required_documents: (targetScheme?.documents || []).map((d: any) => ({
        name: isTe ? d.te : d.en,
        required: d.required,
      })),
      primary_source: targetScheme?.sources?.[0]?.url || "https://india.gov.in/",
      disclaimer: "Official rule-based assessment evaluated via Kleene Deterministic Engine.",
    });
  };

  return (
    <div
      data-testid="scheme-portfolio-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: lightColors.paper,
        color: lightColors.ink,
        fontFamily: "'Noto Sans Telugu', sans-serif",
      }}
    >
      {/* Top Header */}
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
        <div>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>
            {isTe ? "సమగ్ర సంక్షేమ పోర్ట్‌ఫోలియో" : "Smart Welfare Portfolio"}
          </span>
          <div style={{ fontSize: "11px", opacity: 0.85 }}>
            {isTe ? "బహుళ పథకాల ఏకకాల తనిఖీ (Multi-Scheme Evaluator)" : "Universal Multi-Scheme Intake & Benefits Aggregator"}
          </div>
        </div>
      </header>

      {/* Benefits Summary Widget */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "#0D2142",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-around",
          textAlign: "center",
          borderBottom: `3px solid ${lightColors.saffron}`,
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "#A8A29A", textTransform: "uppercase", fontWeight: 600 }}>
            {isTe ? "ప్రత్యక్ష నగదు సహాయం" : "Annual Cash Benefits"}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#4CAF50", marginTop: "2px" }}>
            ₹{portfolioResult.total_annual_cash_assistance.toLocaleString()}
          </div>
        </div>
        <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
        <div>
          <div style={{ fontSize: "11px", color: "#A8A29A", textTransform: "uppercase", fontWeight: 600 }}>
            {isTe ? "వైద్య భద్రత కవరేజ్" : "Health Coverage"}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#64B5F6", marginTop: "2px" }}>
            ₹{(portfolioResult.total_healthcare_coverage / 100000).toFixed(0)} Lakhs
          </div>
        </div>
        <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
        <div>
          <div style={{ fontSize: "11px", color: "#A8A29A", textTransform: "uppercase", fontWeight: 600 }}>
            {isTe ? "అర్హత పథకాలు" : "Eligible Schemes"}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#FFD54F", marginTop: "2px" }}>
            {portfolioResult.eligible_count} / {portfolioResult.total_schemes_evaluated}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Quick Profile Modifier Accordion */}
        <details
          style={{
            backgroundColor: lightColors.surface,
            border: `1px solid ${lightColors.rule}`,
            borderRadius: "8px",
            padding: "12px 14px",
          }}
        >
          <summary style={{ fontWeight: 700, color: lightColors.navy, cursor: "pointer", fontSize: "14px" }}>
            ⚙️ {isTe ? "కుటుంబ వివరాలను మార్చండి (Update Profile Facts)" : "Family Profile & Household Parameters"}
          </summary>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                  {isTe ? "దరఖాస్తుదారు వయస్సు:" : "Applicant Age (Years):"}
                </label>
                <input
                  type="number"
                  value={facts.age}
                  onChange={(e) => handleNumberChange("age", e.target.value)}
                  style={{ width: "100%", height: "36px", padding: "0 8px", border: `1px solid ${lightColors.rule}`, borderRadius: "4px" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                  {isTe ? "వార్షిక ఆదాయం (₹):" : "Annual Income (₹):"}
                </label>
                <input
                  type="number"
                  value={facts.annual_income}
                  onChange={(e) => handleNumberChange("annual_income", e.target.value)}
                  style={{ width: "100%", height: "36px", padding: "0 8px", border: `1px solid ${lightColors.rule}`, borderRadius: "4px" }}
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.is_bpl} onChange={() => handleToggle("is_bpl")} />
                <span>{isTe ? "BPL / తెల్ల రేషన్ కార్డు" : "BPL / White Ration Card"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.owns_cultivable_land} onChange={() => handleToggle("owns_cultivable_land")} />
                <span>{isTe ? "సాగుభూమి ఉంది" : "Owns Cultivable Land"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.in_secc_deprivation_list} onChange={() => handleToggle("in_secc_deprivation_list")} />
                <span>{isTe ? "ఆయుష్మాన్ / SECC జాబితా" : "In SECC / PM-JAY List"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.has_pucca_house} onChange={() => handleToggle("has_pucca_house")} />
                <span>{isTe ? "పక్కా ఇల్లు ఉంది" : "Already Owns Pucca House"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.is_girl_child} onChange={() => handleToggle("is_girl_child")} />
                <span>{isTe ? "10 ఏళ్లలోపు ఆడపిల్ల ఉంది" : "Has Girl Child (<10y)"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.is_sc_category} onChange={() => handleToggle("is_sc_category")} />
                <span>{isTe ? "SC వర్గం విద్యార్థి" : "SC Category Student"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.child_in_school} onChange={() => handleToggle("child_in_school")} />
                <span>{isTe ? "బడికి వెళ్లే పిల్లలు (1-12)" : "Child in School (1-12)"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.has_active_lpg_connection} onChange={() => handleToggle("has_active_lpg_connection")} />
                <span>{isTe ? "గృహ LPG గ్యాస్ కనెక్షన్" : "Domestic LPG Gas"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.is_female} onChange={() => handleToggle("is_female")} />
                <span>{isTe ? "మహిళా లబ్ధిదారు" : "Female Beneficiary"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.is_unemployed_youth} onChange={() => handleToggle("is_unemployed_youth")} />
                <span>{isTe ? "నిరుద్యోగ యువత" : "Unemployed Youth"}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={facts.enrolled_in_higher_education} onChange={() => handleToggle("enrolled_in_higher_education")} />
                <span>{isTe ? "డిగ్రీ/ఇంజనీరింగ్ కాలేజీ" : "College Student"}</span>
              </label>
            </div>
          </div>
        </details>

        {/* Category Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${lightColors.rule}`, backgroundColor: "#FFFFFF", borderRadius: "6px 6px 0 0" }}>
          <button
            type="button"
            onClick={() => setActiveTab("eligible")}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderBottom: activeTab === "eligible" ? `3px solid ${lightColors.ok}` : "3px solid transparent",
              fontWeight: activeTab === "eligible" ? 700 : 500,
              color: activeTab === "eligible" ? lightColors.ok : lightColors.inkSecondary,
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ✓ {isTe ? "అర్హత ఉన్నవి" : "Eligible"} ({portfolioResult.eligible_count})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("conditionally_eligible")}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderBottom: activeTab === "conditionally_eligible" ? `3px solid ${lightColors.warn}` : "3px solid transparent",
              fontWeight: activeTab === "conditionally_eligible" ? 700 : 500,
              color: activeTab === "conditionally_eligible" ? lightColors.warn : lightColors.inkSecondary,
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ⚠️ {isTe ? "పరిశీలనలో ఉన్నవి" : "Conditional"} ({portfolioResult.conditionally_eligible_count})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ineligible")}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderBottom: activeTab === "ineligible" ? `3px solid ${lightColors.bad}` : "3px solid transparent",
              fontWeight: activeTab === "ineligible" ? 700 : 500,
              color: activeTab === "ineligible" ? lightColors.bad : lightColors.inkSecondary,
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ✕ {isTe ? "అనర్హులు" : "Ineligible"} ({portfolioResult.ineligible_count})
          </button>
        </div>

        {/* Scheme Cards Stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {portfolioResult.portfolio[activeTab].length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: lightColors.inkSecondary }}>
              {isTe ? "ఈ వర్గంలో ఎటువంటి పథకాలు లేవు" : "No schemes in this category for current facts."}
            </div>
          ) : (
            portfolioResult.portfolio[activeTab].map((item) => (
              <div
                key={item.scheme_id}
                style={{
                  backgroundColor: lightColors.surface,
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "8px",
                  padding: "14px 16px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: item.scope === "central" ? "#E3F2FD" : "#FFF3E0",
                        color: item.scope === "central" ? "#0D47A1" : "#E65100",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.scope === "central" ? (isTe ? "కేంద్రం" : "Central") : (isTe ? "ఆంధ్రప్రదేశ్" : "AP State")}
                    </span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "16px", color: lightColors.navy, fontWeight: 700 }}>
                      {item.name}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color:
                        item.status === "eligible"
                          ? lightColors.ok
                          : item.status === "not_eligible"
                          ? lightColors.bad
                          : lightColors.warn,
                      backgroundColor:
                        item.status === "eligible"
                          ? "#E8F5E9"
                          : item.status === "not_eligible"
                          ? "#FFEBEE"
                          : "#FFF8E1",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.status === "eligible" ? "✓ Eligible" : item.status === "not_eligible" ? "✕ Ineligible" : "⚠️ Conditional"}
                  </span>
                </div>

                {item.benefit_label && (
                  <div style={{ fontSize: "13px", color: "#1B5E20", fontWeight: 600, backgroundColor: "#E8F5E9", padding: "6px 10px", borderRadius: "4px" }}>
                    🎁 {item.benefit_label}
                  </div>
                )}

                {/* Reasons Preview */}
                <div style={{ fontSize: "12px", color: lightColors.inkSecondary }}>
                  {item.reasons.slice(0, 2).map((r, ri) => (
                    <div key={ri} style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <span>{r.result === "passed" ? "✓" : r.result === "failed" ? "✕" : "○"}</span>
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", borderTop: `1px solid ${lightColors.rule}`, paddingTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => openCertForScheme(item)}
                    style={{
                      flex: 1,
                      height: "36px",
                      backgroundColor: "#1B5E20",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    📜 {isTe ? "ధృవీకరణ పత్రం (Slip)" : "Official Slip (PDF)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("scheme-detail", { schemeId: item.scheme_id })}
                    style={{
                      padding: "0 12px",
                      height: "36px",
                      backgroundColor: "transparent",
                      color: lightColors.navy,
                      border: `1px solid ${lightColors.navy}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isTe ? "పూర్తి వివరాలు ›" : "Details ›"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          cert={selectedCert}
          language={language}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};
