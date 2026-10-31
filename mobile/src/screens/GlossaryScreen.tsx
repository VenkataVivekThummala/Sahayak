import React from "react";
import { useSettingsStore } from "../store/settingsStore";
import { lightColors } from "../theme/tokens";

interface GlossaryScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

interface Term {
  code: string;
  en_title: string;
  te_title: string;
  en_desc: string;
  te_desc: string;
}

export const GlossaryScreen: React.FC<GlossaryScreenProps> = ({ onNavigate }) => {
  const { language } = useSettingsStore();

  const terms: Term[] = [
    {
      code: "BPL",
      en_title: "Below Poverty Line (BPL / White Ration Card)",
      te_title: "దారిద్య్రరేఖకు దిగువన (BPL / తెల్ల రేషన్ కార్డు)",
      en_desc: "A government benchmark identifying households with low annual income who qualify for subsidized food grains and welfare benefits.",
      te_desc: "తక్కువ వార్షిక ఆదాయం కలిగిన కుటుంబాలను గుర్తించడానికి ప్రభుత్వం నిర్దేశించిన ప్రమాణం. దీని ద్వారా రాయితీ ఆహార ధాన్యాలు, సంక్షేమ పథకాలు అందుతాయి.",
    },
    {
      code: "DBT",
      en_title: "Direct Benefit Transfer (DBT)",
      te_title: "ప్రత్యక్ష నగదు బదిలీ (DBT)",
      en_desc: "Direct electronic transfer of welfare subsidy or pension funds directly into the beneficiary's Aadhaar-linked bank account without intermediaries.",
      te_desc: "ప్రభుత్వ సబ్సిడీ లేదా పింఛను మొత్తాన్ని నేరుగా లబ్ధిదారుని ఆధార్ అనుసంధాన బ్యాంక్ ఖాతాలో జమ చేసే పద్ధతి.",
    },
    {
      code: "e-KYC",
      en_title: "Electronic Know Your Customer (e-KYC)",
      te_title: "ఎలక్ట్రానిక్ కేవైసీ (e-KYC)",
      en_desc: "Verifying your identity electronically using your Aadhaar number and OTP or biometric fingerprint at a government centre or portal.",
      te_desc: "ఆధార్ నంబర్, వేలిముద్ర (బయోమెట్రిక్) లేదా మొబైల్ ఓటీపీ ద్వారా మీ గుర్తింపును ఎలక్ట్రానిక్ పద్ధతిలో ధృవీకరించుకోవడం.",
    },
    {
      code: "SECC",
      en_title: "Socio-Economic and Caste Census (SECC)",
      te_title: "సామాజిక ఆర్థిక కుల గణన (SECC)",
      en_desc: "The 2011 nationwide survey used by central ministries to identify deprivation parameters for schemes like PMAY-G and PM-JAY.",
      te_desc: "పీఎంజేఏవై, పీఎంఏవై-జి వంటి పథకాలకు లబ్ధిదారులను ఎంపిక చేయడానికి ప్రభుత్వం ఉపయోగించే అధికారిక సర్వే జాబితా.",
    },
    {
      code: "CSC",
      en_title: "Common Service Centre (CSC) / Digital Seva",
      te_title: "కామన్ సర్వీస్ సెంటర్ (CSC)",
      en_desc: "Village level access points where citizens can apply for government certificates, scheme enrolments, and print documents.",
      te_desc: "గ్రామ స్థాయిలో ప్రభుత్వ సేవలు, పథకాల దరఖాస్తులు మరియు ధృవపత్రాల కోసం పౌరులు సంప్రదించే డిజిటల్ సేవా కేంద్రాలు.",
    },
    {
      code: "Gram Sabha",
      en_title: "Gram Sabha (గ్రామ సభ)",
      te_title: "గ్రామ సభ (Gram Sabha)",
      en_desc: "The general assembly of all registered village voters that reviews and approves beneficiary priority lists for housing and rural welfare.",
      te_desc: "గ్రామ ఓటర్లందరి సమావేశం. సంక్షేమ పథకాల లబ్ధిదారుల జాబితాలను ఆమోదించడానికి ఇది నిర్వహించబడుతుంది.",
    },
    {
      code: "Awaas+",
      en_title: "Awaas+ Rural Housing Survey",
      te_title: "ఆవాస్+ గ్రామీణ గృహ సర్వే",
      en_desc: "An extended mobile survey conducted to identify eligible rural families left out of the original 2011 SECC list for PMAY-G housing.",
      te_desc: "పీఎంఏవై-జి పథకంలో ఇల్లు పొందేందుకు అర్హులైన పేద కుటుంబాల కోసం నిర్వహించిన అనుబంధ సర్వే జాబితా.",
    },
    {
      code: "Aadhaar Seeding",
      en_title: "Aadhaar Seeding with Bank Account",
      te_title: "బ్యాంక్ ఖాతాకు ఆధార్ లింకింగ్ (Aadhaar Seeding)",
      en_desc: "Connecting your Aadhaar number to your bank account via NPCI mapper so government benefits (DBT) credit smoothly.",
      te_desc: "ప్రభుత్వ నిధులు సజావుగా జమ కావడానికి మీ బ్యాంక్ ఖాతాకు ఆధార్ నంబర్‌ను అనుసంధానం చేసుకోవడం.",
    },
    {
      code: "Income Certificate",
      en_title: "Income Certificate (ఆదాయ ధృవీకరణ పత్రం)",
      te_title: "ఆదాయ ధృవీకరణ పత్రం (Income Certificate)",
      en_desc: "An official revenue certificate issued by the Tahsildar / Revenue Department certifying your household annual income.",
      te_desc: "కుటుంబ వార్షిక ఆదాయాన్ని ధృవీకరిస్తూ తహసీల్దార్ లేదా రెవెన్యూ అధికారి జారీ చేసే అధికారిక పత్రం.",
    },
    {
      code: "Caste Certificate",
      en_title: "Caste / Community Certificate",
      te_title: "కుల ధృవీకరణ పత్రం (Caste Certificate)",
      en_desc: "A revenue department certificate certifying community reservation category (SC, ST, BC) required for targeted welfare schemes.",
      te_desc: "ప్రత్యేక సంక్షేమ మరియు స్కాలర్‌షిప్ పథకాలకు అవసరమైన సామాజిక వర్గ ధృవీకరణ పత్రం.",
    },
  ];

  return (
    <div
      data-testid="glossary-screen"
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
          onClick={() => onNavigate("settings")}
          style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
        >
          ←
        </button>
        <span style={{ fontSize: "18px", fontWeight: 700 }}>
          {language === "te" ? "ప్రభుత్వ పదకోశం" : "Government Terms Glossary"}
        </span>
      </header>

      {/* Explanation Banner */}
      <div style={{ padding: "14px 20px", backgroundColor: lightColors.surface, borderBottom: `1px solid ${lightColors.rule}` }}>
        <p style={{ margin: 0, fontSize: "14px", color: lightColors.inkSecondary }}>
          {language === "te"
            ? "ప్రభుత్వ పథకాలలో తరచుగా ఉపయోగించే సాంకేతిక పదాల సులువైన వివరణలు:"
            : "Plain-language explanations of official terms frequently used across government welfare portals:"}
        </p>
      </div>

      {/* Terms List */}
      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {terms.map((t) => (
          <div
            key={t.code}
            style={{
              backgroundColor: lightColors.surface,
              border: `1px solid ${lightColors.rule}`,
              borderRadius: "8px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: lightColors.navy, marginBottom: "6px" }}>
              {language === "te" ? t.te_title : t.en_title}
            </div>
            <div style={{ fontSize: "14px", color: lightColors.ink, lineHeight: 1.5 }}>
              {language === "te" ? t.te_desc : t.en_desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
