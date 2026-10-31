import React, { useState } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { useHelpDeskStore } from "../store/helpDeskStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";

interface HelpDeskScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const HelpDeskScreen: React.FC<HelpDeskScreenProps> = ({ onNavigate }) => {
  const { language } = useSettingsStore();
  const { schemes } = useSchemeStore();
  const { submitRequest, submittedRequests, loading, error } = useHelpDeskStore();
  const strings = getStrings(language);

  const [schemeId, setSchemeId] = useState("");
  const [description, setDescription] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");
  const [lookupCode, setLookupCode] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleTrackLookup = async () => {
    if (!lookupCode.trim()) {
      setLookupError(language === "te" ? "దయచేసి టికెట్ కోడ్ నమోదు చేయండి" : "Please enter a ticket code");
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const code = lookupCode.trim();
      const res = await fetch(`/api/help-requests/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error(
          language === "te"
            ? "సహాయ అభ్యర్థన కనుగొనబడలేదు. దయచేసి కోడ్ సరిగ్గా ఉందో లేదో చూడండి."
            : "Ticket not found. Please verify the code and try again."
        );
      }
      const data = await res.json();
      setLookupResult(data);
    } catch (err: any) {
      setLookupError(err.message || "Failed to lookup ticket");
    } finally {
      setLookupLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert(language === "te" ? "దయచేసి మీ సమస్యను వివరించండి" : "Please describe your issue");
      return;
    }
    if (contactNumber && !/^[6-9]\d{9}$/.test(contactNumber.trim())) {
      alert(
        language === "te"
          ? "చెల్లుబాటు అయ్యే 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి"
          : "Please enter a valid 10-digit Indian mobile number"
      );
      return;
    }

    try {
      const code = await submitRequest(
        schemeId || undefined,
        description.trim(),
        contactNumber.trim() || undefined
      );
      setConfirmationCode(code);
      setDescription("");
      setContactNumber("");
    } catch (err: any) {
      alert(err.message || "Failed to submit help request");
    }
  };

  return (
    <div
      data-testid="helpdesk-screen"
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
        <span style={{ fontSize: "18px", fontWeight: 700 }}>{strings.need_help}</span>
      </header>

      {/* Mode Switcher Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${lightColors.rule}`, backgroundColor: "#FFFFFF" }}>
        <button
          type="button"
          onClick={() => setActiveTab("submit")}
          style={{
            flex: 1,
            padding: "14px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "submit" ? `3px solid ${lightColors.navy}` : "3px solid transparent",
            fontWeight: activeTab === "submit" ? 700 : 500,
            color: activeTab === "submit" ? lightColors.navy : lightColors.inkSecondary,
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {language === "te" ? "కొత్త ప్రశ్న" : "Submit Query"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("track")}
          style={{
            flex: 1,
            padding: "14px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "track" ? `3px solid ${lightColors.navy}` : "3px solid transparent",
            fontWeight: activeTab === "track" ? 700 : 500,
            color: activeTab === "track" ? lightColors.navy : lightColors.inkSecondary,
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {language === "te" ? "స్థితిని తనిఖీ చేయండి" : "Track Ticket"}
        </button>
      </div>

      {activeTab === "track" ? (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
              {language === "te" ? "మీ టికెట్ లేదా ట్రాకింగ్ కోడ్:" : "Your Ticket or Tracking Code:"}
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                placeholder="e.g. REQ-A1B2C3D4 or status token"
                style={{
                  flex: 1,
                  height: "44px",
                  padding: "0 10px",
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={handleTrackLookup}
                disabled={lookupLoading}
                style={{
                  padding: "0 18px",
                  backgroundColor: lightColors.navy,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {lookupLoading ? "..." : language === "te" ? "చూడండి" : "Search"}
              </button>
            </div>
          </div>

          {lookupError && (
            <div style={{ padding: "10px", backgroundColor: "#FFEBEE", color: "#C62828", borderRadius: "6px", fontSize: "13px" }}>
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div
              style={{
                backgroundColor: lightColors.surface,
                border: `1px solid ${lightColors.rule}`,
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: lightColors.navy }}>{lookupResult.request_id}</span>
                <span
                  style={{
                    backgroundColor: lookupResult.status === "closed" ? "#E8F5E9" : "#FFF8E1",
                    color: lookupResult.status === "closed" ? "#2E7D32" : "#F57F17",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}
                >
                  {lookupResult.status}
                </span>
              </div>
              <div style={{ fontSize: "14px", color: lightColors.ink }}>
                <strong>{language === "te" ? "ప్రశ్న:" : "Question:"}</strong> {lookupResult.question}
              </div>
              {lookupResult.response ? (
                <div style={{ backgroundColor: "#F0F4F8", padding: "12px", borderRadius: "6px", borderLeft: `3px solid ${lightColors.navy}` }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: lightColors.navy, marginBottom: "4px" }}>
                    {language === "te" ? "అధికారి సమాధానం:" : "Officer Resolution:"}
                  </div>
                  <div style={{ fontSize: "14px", color: lightColors.ink }}>{lookupResult.response}</div>
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: lightColors.inkSecondary, fontStyle: "italic" }}>
                  {language === "te"
                    ? "ఈ అభ్యర్థన ఇంకా పరిశీలనలో ఉంది. సిబ్బంది సమాధానం ఇవ్వగానే ఇక్కడ కనిపిస్తుంది."
                    : "This query is currently under review by Sachivalayam staff. Resolution will appear here once replied."}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Confirmation State */
        confirmationCode ? (
          <div style={{ padding: "24px 20px", textAlign: "center" }}>
            <div
              style={{
                backgroundColor: lightColors.surface,
                border: `2px solid ${lightColors.ok}`,
                borderRadius: "8px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
              <h2 style={{ fontSize: "20px", color: lightColors.navy, margin: "0 0 10px 0" }}>
                {language === "te" ? "సహాయ అభ్యర్థన సమర్పించబడింది" : "Help Request Submitted"}
              </h2>
              <p style={{ fontSize: "14px", color: lightColors.inkSecondary, margin: "0 0 16px 0" }}>
                {language === "te"
                  ? "మీ విచారణ సంక్షేమ సహాయ సిబ్బందికి చేరింది. మీ ట్రాకింగ్ కోడ్:"
                  : "Your query has been escalated to welfare support staff. Tracking Code:"}
              </p>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  color: lightColors.navy,
                  backgroundColor: lightColors.paper,
                  padding: "12px",
                  borderRadius: "6px",
                  border: `1px dashed ${lightColors.rule}`,
                  marginBottom: "20px",
                }}
              >
                {confirmationCode}
              </div>
              <button
                type="button"
                onClick={() => setConfirmationCode(null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: lightColors.navy,
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {language === "te" ? "సరే" : "Done"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Privacy Warning */}
            <div
              style={{
                backgroundColor: "#FFF8E1",
                borderLeft: `4px solid ${lightColors.saffron}`,
                padding: "12px",
                borderRadius: "4px",
                fontSize: "13px",
                color: lightColors.inkSecondary,
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>{language === "te" ? "గోప్యతా నియమం:" : "Privacy Notice:"}</strong>{" "}
              {language === "te"
                ? "దయచేసి మీ ఆధార్ నంబర్, బ్యాంక్ ఖాతా వివరాలు లేదా పాస్‌వర్డ్‌లను నమోదు చేయవద్దు."
                : "Never provide your Aadhaar number, bank account details, or passwords."}
            </div>

            {/* Scheme selection */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                {language === "te" ? "సంబంధిత పథకం (ఐచ్ఛికం):" : "Related Scheme (Optional):"}
              </label>
              <select
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value)}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 10px",
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "6px",
                  backgroundColor: lightColors.surface,
                  fontSize: "15px",
                }}
              >
                <option value="">{language === "te" ? "-- పథకాన్ని ఎంచుకోండి --" : "-- Select a scheme --"}</option>
                {schemes.map((s) => (
                  <option key={s.scheme_id} value={s.scheme_id}>
                    {language === "te" ? s.name_te : s.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                {language === "te" ? "మీ ప్రశ్న లేదా సమస్య వివరణ: *" : "Describe your query or problem: *"}
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  language === "te"
                    ? "మీకు ఏ విషయంలో సహాయం కావాలో స్పష్టంగా రాయండి..."
                    : "Explain what help or clarification you need from staff…"
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "6px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Contact number */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                {language === "te" ? "మీ మొబైల్ నంబర్ (సంప్రదింపుల కోసం):" : "Your Mobile Number (For callback):"}
              </label>
              <input
                type="tel"
                maxLength={10}
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 9848012345"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 10px",
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "6px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                height: "50px",
                backgroundColor: lightColors.navy,
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              {loading ? "Submitting..." : language === "te" ? "సహాయాన్ని కోరండి" : "Submit Query"}
            </button>
          </form>
        )
      )}

      {/* Submitted history */}
      {submittedRequests.length > 0 && (
        <div style={{ padding: "0 20px 24px 20px" }}>
          <h4 style={{ color: lightColors.navy, marginBottom: "8px" }}>
            {language === "te" ? "గత అభ్యర్థనలు" : "Your Past Queries"}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {submittedRequests.map((req: any) => (
              <div
                key={req.id}
                onClick={() => {
                  setLookupCode(req.code);
                  setActiveTab("track");
                }}
                style={{
                  backgroundColor: lightColors.surface,
                  border: `1px solid ${lightColors.rule}`,
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                  <span>Code: {req.code}</span>
                  <span style={{ color: lightColors.saffron }}>{req.status}</span>
                </div>
                <div style={{ color: lightColors.inkSecondary, marginTop: "4px" }}>
                  {req.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
