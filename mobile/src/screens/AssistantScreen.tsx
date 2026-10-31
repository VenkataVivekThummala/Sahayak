import React, { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useSchemeStore } from "../store/schemeStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";
import { apiClient } from "../api/client";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: any[];
  confidence?: string;
  choices?: Array<{ scheme_id: string; name_en: string; name_te: string }>;
  next_question?: { field: string; type: "bool" | "number"; text: string };
  eligibility?: any;
  disclaimer?: string;
}

interface AssistantScreenProps {
  initialMessage?: string;
  startListening?: boolean;
  preScopedSchemeId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  initialMessage,
  startListening = false,
  preScopedSchemeId,
  onNavigate,
}) => {
  const { language } = useSettingsStore();
  const strings = getStrings(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions =
    language === "te"
      ? [
          "పీఎం కిసాన్ పథకానికి ఏ పత్రాలు కావాలి?",
          "నాకు వృద్ధాప్య పింఛను వస్తుందా?",
          "ఆయుష్మాన్ భారత్ ఎలా దరఖాస్తు చేయాలి?",
        ]
      : [
          "What documents are needed for PM-KISAN?",
          "Do I get an old-age pension?",
          "How do I apply for Ayushman Bharat?",
        ];

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    } else if (startListening) {
      handleMicToggle();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend: string, explicitSchemeId?: string) => {
    if (!textToSend.trim() && !explicitSchemeId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const resp = await apiClient.sendChat({
        message: textToSend,
        language,
        session,
        scheme_id: explicitSchemeId || preScopedSchemeId,
      });

      if (resp.session) {
        setSession(resp.session);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: resp.answer,
        sources: resp.sources,
        confidence: resp.confidence,
        choices: resp.choices,
        next_question: resp.next_question,
        eligibility: resp.eligibility,
        disclaimer: resp.disclaimer,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: strings.err_server,
        confidence: "none",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulated browser/mobile voice recognition demo
      setTimeout(() => {
        setIsListening(false);
        const sampleQuery =
          language === "te"
            ? "పీఎం కిసాన్ అర్హత ఏమిటి?"
            : "What is PM Kisan eligibility?";
        sendMessage(sampleQuery);
      }, 1500);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "te" ? "te-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Playing voice: ${text}`);
    }
  };

  return (
    <div
      data-testid="assistant-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: lightColors.paper,
        fontFamily: "'Noto Sans Telugu', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          backgroundColor: lightColors.navy,
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "20px", cursor: "pointer" }}
          >
            ←
          </button>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>{strings.ask_assistant}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setSession({});
          }}
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
          {language === "te" ? "కొత్త సంభాషణ" : "New Chat"}
        </button>
      </header>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.length === 0 && (
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <p style={{ color: lightColors.inkSecondary, fontSize: "16px" }}>
              {language === "te"
                ? "ప్రభుత్వ పథకాల గురించి ఏదైనా అడగండి లేదా దిగువ ప్రశ్నను ఎంచుకోండి:"
                : "Ask any question about government schemes, or pick a suggested query:"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-testid={`chip-suggestion-${idx}`}
                  onClick={() => sendMessage(q)}
                  style={{
                    backgroundColor: lightColors.surface,
                    border: `1px solid ${lightColors.rule}`,
                    borderRadius: "20px",
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: "15px",
                    color: lightColors.navy,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  💡 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                backgroundColor: msg.sender === "user" ? lightColors.navy : lightColors.surface,
                color: msg.sender === "user" ? "#FFFFFF" : lightColors.ink,
                padding: "14px 16px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                fontSize: "16px",
                lineHeight: 1.5,
                border: msg.sender === "user" ? "none" : `1px solid ${lightColors.rule}`,
              }}
            >
              <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>

              {/* Bot Extras */}
              {msg.sender === "bot" && (
                <div style={{ marginTop: "12px", borderTop: `1px solid ${lightColors.rule}`, paddingTop: "8px" }}>
                  {/* Confidence Warnings */}
                  {msg.confidence === "low" && (
                    <div
                      style={{
                        backgroundColor: lightColors.warnBg,
                        color: lightColors.warn,
                        padding: "6px 10px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        marginBottom: "8px",
                      }}
                    >
                      ⚠️ {language === "te"
                        ? "ఈ సమాచారం అసంపూర్ణంగా ఉండవచ్చు. అధికారిక మూలంతో సరిచూసుకోండి."
                        : "This answer may be incomplete. Please confirm at the official source."}
                    </div>
                  )}

                  {msg.confidence === "none" && (
                    <div
                      style={{
                        backgroundColor: "#FCE8E6",
                        color: lightColors.bad,
                        padding: "8px 10px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        marginBottom: "8px",
                      }}
                    >
                      ℹ️ {language === "te"
                        ? "ధృవీకరించబడిన సమాచారం లభించలేదు."
                        : "No verified official answer found."}
                      <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => onNavigate("schemes")}
                          style={{
                            backgroundColor: lightColors.navy,
                            color: "#FFFFFF",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          {language === "te" ? "పథకాల జాబితా" : "Official Schemes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate("helpdesk")}
                          style={{
                            backgroundColor: lightColors.surface,
                            color: lightColors.navy,
                            border: `1px solid ${lightColors.navy}`,
                            padding: "6px 10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          {strings.need_help}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sources row */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ fontSize: "13px", color: lightColors.inkSecondary, marginBottom: "8px" }}>
                      <strong>{strings.source}:</strong> {msg.sources[0].title} (
                      <span style={{ color: lightColors.saffron, fontWeight: 600 }}>
                        {msg.sources[0].type}
                      </span>
                      )
                    </div>
                  )}

                  {/* Listen Again button */}
                  <button
                    type="button"
                    onClick={() => speakText(msg.text)}
                    style={{
                      background: "none",
                      border: "none",
                      color: lightColors.navy,
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    🔊 {strings.listen_again}
                  </button>

                  {/* Disclaimer */}
                  {msg.disclaimer && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: lightColors.inkSecondary,
                        marginTop: "8px",
                        borderTop: `1px dashed ${lightColors.rule}`,
                        paddingTop: "4px",
                      }}
                    >
                      {msg.disclaimer}
                    </div>
                  )}

                  {/* Scheme choices buttons */}
                  {msg.choices && msg.choices.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                      {msg.choices.map((choice) => (
                        <button
                          key={choice.scheme_id}
                          type="button"
                          onClick={() =>
                            sendMessage(
                              language === "te" ? choice.name_te : choice.name_en,
                              choice.scheme_id
                            )
                          }
                          style={{
                            backgroundColor: lightColors.paper,
                            border: `1px solid ${lightColors.navy}`,
                            color: lightColors.navy,
                            padding: "10px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          ➔ {language === "te" ? choice.name_te : choice.name_en}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Next question interactive controls */}
                  {msg.next_question && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: lightColors.paper,
                        borderRadius: "6px",
                        border: `1px solid ${lightColors.rule}`,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "8px", color: lightColors.navy }}>
                        {msg.next_question.text}
                      </div>
                      {msg.next_question.type === "bool" ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => sendMessage(language === "te" ? "అవును" : "yes")}
                            style={{
                              flex: 1,
                              padding: "10px",
                              backgroundColor: lightColors.navy,
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {strings.yes}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendMessage(language === "te" ? "కాదు" : "no")}
                            style={{
                              flex: 1,
                              padding: "10px",
                              backgroundColor: lightColors.surface,
                              border: `1px solid ${lightColors.navy}`,
                              color: lightColors.navy,
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {strings.no}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendMessage(strings.dont_know)}
                            style={{
                              padding: "10px 12px",
                              backgroundColor: "transparent",
                              border: `1px solid ${lightColors.rule}`,
                              color: lightColors.inkSecondary,
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            {strings.dont_know}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="number"
                            placeholder="నమోదు చేయండి / Enter number"
                            id="numeric-answer-input"
                            style={{
                              flex: 1,
                              padding: "8px",
                              border: `1px solid ${lightColors.rule}`,
                              borderRadius: "4px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById("numeric-answer-input") as HTMLInputElement;
                              if (el && el.value) {
                                sendMessage(el.value);
                                el.value = "";
                              }
                            }}
                            style={{
                              backgroundColor: lightColors.navy,
                              color: "#FFFFFF",
                              border: "none",
                              padding: "8px 14px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            {strings.send}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "12px", color: lightColors.inkSecondary }}>
            ⏳ {language === "te" ? "సమాధానం సిద్ధం చేస్తోంది..." : "Generating answer…"}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <footer
        style={{
          padding: "12px 16px",
          backgroundColor: lightColors.surface,
          borderTop: `1px solid ${lightColors.rule}`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          type="button"
          data-testid="btn-mic-chat"
          onClick={handleMicToggle}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: isListening ? lightColors.saffron : lightColors.navy,
            color: "#FFFFFF",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={isListening ? strings.listening : strings.ask_voice}
        >
          {isListening ? "🔴" : "🎤"}
        </button>

        <input
          type="text"
          data-testid="input-chat-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
          placeholder={strings.or_type}
          style={{
            flex: 1,
            height: "48px",
            padding: "0 14px",
            fontSize: "16px",
            border: `1px solid ${lightColors.rule}`,
            borderRadius: "6px",
          }}
        />

        <button
          type="button"
          data-testid="btn-chat-send"
          onClick={() => sendMessage(inputText)}
          style={{
            height: "48px",
            padding: "0 18px",
            backgroundColor: lightColors.navy,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {strings.send}
        </button>
      </footer>
    </div>
  );
};
