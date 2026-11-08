import React, { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { getStrings } from "../i18n/strings";
import { lightColors } from "../theme/tokens";
import { apiClient } from "../api/client";
import { speechPlayer } from "../voice/speechPlayer";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  speech_text?: string;
  sources?: any[];
  confidence?: string;
  choices?: Array<{ scheme_id: string; name_en?: string; name_te?: string; name?: string }>;
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
  const { language, autoSpeak } = useSettingsStore();
  const strings = getStrings(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState(""); // real-time transcript
  const [speechStatus, setSpeechStatus] = useState<string>("");
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<any>(null);
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;

  // Listen to speech player state
  useEffect(() => {
    const unsubscribe = speechPlayer.subscribe((speaking) => {
      setIsSpeakingAudio(speaking);
    });
    return () => {
      unsubscribe();
      speechPlayer.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setInterimTranscript("");
      setIsListening(false);
    };
  }, []);

  const villageCategories =
    language === "te"
      ? [
          { label: "🌾 రైతు పథకాలు", query: "రైతు పథకాలు" },
          { label: "👵 వృద్ధాప్య పింఛను", query: "వృద్ధాప్య పింఛను" },
          { label: "👩 మహిళా పథకాలు", query: "మహిళల పథకాలు" },
          { label: "🏥 ఆరోగ్యశ్రీ / ఆయుష్మాన్", query: "ఆరోగ్య పథకం" },
          { label: "🏠 ఇళ్ల పథకం", query: "ఇళ్ల పథకం" },
          { label: "⛽ ఉచిత గ్యాస్ (దీపం 2.0)", query: "దీపం ఉచిత గ్యాస్" },
          { label: "🎓 విద్యార్థి వేతనాలు", query: "విద్యార్థుల పథకాలు" },
        ]
      : [
          { label: "🌾 Farmer Schemes", query: "farmer schemes" },
          { label: "👵 Old Age Pension", query: "old age pension" },
          { label: "👩 Women Welfare", query: "women schemes" },
          { label: "🏥 Ayushman Bharat / Health", query: "health scheme" },
          { label: "🏠 Housing Scheme", query: "housing scheme" },
          { label: "⛽ Free Gas (Deepam 2.0)", query: "deepam free gas" },
          { label: "🎓 Scholarships", query: "student scholarships" },
        ];

  const suggestedQuestions =
    language === "te"
      ? [
          "పీఎం కిసాన్ పథకానికి ఏ పత్రాలు కావాలి?",
          "నాకు వృద్ధాప్య పింఛను ఎలా వస్తుంది?",
          "ఆయుష్మాన్ భారత్ ద్వారా ఎంత చికిత్స లభిస్తుంది?",
        ]
      : [
          "What documents are needed for PM-KISAN?",
          "How do I get an old-age pension?",
          "How much medical cover in Ayushman Bharat?",
        ];

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    } else if (startListening) {
      startVoiceRecognition();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, speechStatus]);

  const startVoiceRecognition = () => {
    speechPlayer.stop();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        language === "te"
          ? "మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు. దయచేసి Google Chrome బ్రౌజర్ ఉపయోగించండి లేదా టైప్ చేయండి."
          : "Voice recognition is not supported in this browser. Please use Google Chrome or type your question."
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === "te" ? "te-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
        setInputText("");
        setSpeechStatus(
          language === "te"
            ? "🎤 వింటున్నాము... దయచేసి మాట్లాడండి"
            : "🎤 Listening... Please speak now"
        );
      };

      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
        // Show interim text in real-time so user sees what's being recognized
        if (interimText) {
          setInterimTranscript(interimText);
          setInputText(interimText);
        }
        if (finalText) {
          setInterimTranscript("");
          setInputText(finalText);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setInterimTranscript("");
        setSpeechStatus("");
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          alert(
            language === "te"
              ? "దయచేసి మీ బ్రౌజర్‌లో మైక్రోఫోన్ అనుమతి (Microphone Permission) ఇవ్వండి."
              : "Please allow microphone access in your browser to use voice."
          );
        } else if (event.error === "no-speech") {
          setSpeechStatus(
            language === "te"
              ? "మాటలు వినిపించలేదు. మళ్లీ ప్రయత్నించండి."
              : "No speech detected. Please try again."
          );
          setTimeout(() => setSpeechStatus(""), 2500);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
        setSpeechStatus("");
        const finalQuery = inputTextRef.current.trim();
        if (finalQuery) {
          sendMessage(finalQuery);
        }
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setInterimTranscript("");
      setSpeechStatus("");
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setInterimTranscript("");
      setSpeechStatus("");
    } else {
      startVoiceRecognition();
    }
  };

  const sendMessage = async (textToSend: string, explicitSchemeId?: string) => {
    const query = textToSend.trim();
    if (!query && !explicitSchemeId) return;

    speechPlayer.stop();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query || (explicitSchemeId ? `Scheme: ${explicitSchemeId}` : ""),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const resp = await apiClient.sendChat({
        message: query,
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
        text: resp.answer || "",
        speech_text: resp.speech_text || resp.answer || "",
        sources: resp.sources,
        confidence: resp.confidence,
        choices: resp.choices,
        next_question: resp.next_question,
        eligibility: resp.eligibility,
        disclaimer: resp.disclaimer,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Speak natural audio aloud if autoSpeak is enabled
      if (autoSpeak && (botMsg.speech_text || botMsg.text)) {
        speechPlayer.speak(botMsg.speech_text || botMsg.text, language);
      }
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text:
          language === "te"
            ? "క్షమించండి, సర్వర్‌ను సంప్రదించడంలో చిన్న సమస్య ఏర్పడింది. దయచేసి మళ్లీ అడగండి."
            : "Sorry, could not reach the server right now. Please try asking again.",
        confidence: "none",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeak = (text: string) => {
    if (isSpeakingAudio) {
      speechPlayer.stop();
    } else {
      speechPlayer.speak(text, language);
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => {
              speechPlayer.stop();
              onNavigate("home");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              fontSize: "22px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              🎙️ {strings.ask_assistant}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.85 }}>
              {language === "te" ? "స్పష్టమైన తెలుగు వాయిస్ మార్గదర్శి" : "Clear Voice Guidance for Citizens"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isSpeakingAudio && (
            <button
              type="button"
              onClick={() => speechPlayer.stop()}
              style={{
                backgroundColor: "#DC2626",
                border: "none",
                color: "#FFFFFF",
                borderRadius: "20px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⏹️ {language === "te" ? "ఆపండి" : "Stop"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              speechPlayer.stop();
              setMessages([]);
              setSession({});
            }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#FFFFFF",
              borderRadius: "4px",
              padding: "6px 10px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {language === "te" ? "కొత్త సంభాషణ" : "New Chat"}
          </button>
        </div>
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
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: lightColors.surface,
                border: `3px solid ${lightColors.saffron}`,
                margin: "0 auto 12px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                boxShadow: "0 4px 12px rgba(200, 105, 26, 0.2)",
              }}
            >
              🏛️
            </div>
            <h2 style={{ fontSize: "20px", color: lightColors.navy, margin: "0 0 6px 0", fontWeight: 700 }}>
              {language === "te" ? "ప్రభుత్వ సహాయక్ వాయిస్ అసిస్టెంట్" : "Government Sahayak Voice Assistant"}
            </h2>
            <p style={{ color: lightColors.inkSecondary, fontSize: "14px", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              {language === "te"
                ? "మైక్రోఫోన్ నొక్కి మీకు కావలసిన పథకం గురించి మాట్లాడండి లేదా కింద ఉన్న వర్గాలను ఎంచుకోండి:"
                : "Tap the microphone to speak about any scheme or pick a category below:"}
            </p>

            {/* Quick Village Category Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
              {villageCategories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(cat.query)}
                  style={{
                    backgroundColor: lightColors.surface,
                    border: `1.5px solid ${lightColors.navy}`,
                    borderRadius: "20px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    color: lightColors.navy,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Suggested Sample Inquiries */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "600px", margin: "0 auto" }}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-testid={`chip-suggestion-${idx}`}
                  onClick={() => sendMessage(q)}
                  style={{
                    backgroundColor: lightColors.surface,
                    border: `1px solid ${lightColors.rule}`,
                    borderRadius: "12px",
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: "14px",
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
              maxWidth: "88%",
            }}
          >
            <div
              style={{
                backgroundColor: msg.sender === "user" ? lightColors.navy : lightColors.surface,
                color: msg.sender === "user" ? "#FFFFFF" : lightColors.ink,
                padding: "14px 16px",
                borderRadius: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                fontSize: "15px",
                lineHeight: 1.6,
                border: msg.sender === "user" ? "none" : `1px solid ${lightColors.rule}`,
              }}
            >
              <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>

              {/* Bot Controls & Extras */}
              {msg.sender === "bot" && (
                <div style={{ marginTop: "12px", borderTop: `1px solid ${lightColors.rule}`, paddingTop: "8px" }}>
                  {/* High Clarity Speech Playback Button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <button
                      type="button"
                      onClick={() => toggleSpeak(msg.speech_text || msg.text)}
                      style={{
                        backgroundColor: isSpeakingAudio ? "#DC2626" : "#E8F5E9",
                        color: isSpeakingAudio ? "#FFFFFF" : "#1B5E20",
                        border: `1px solid ${isSpeakingAudio ? "#DC2626" : "#2E7D32"}`,
                        borderRadius: "20px",
                        padding: "6px 14px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {isSpeakingAudio ? "⏹️ " + (language === "te" ? "వాయిస్ ఆపండి" : "Stop Voice") : "🔊 " + (language === "te" ? "స్పష్టమైన వాయిస్ వినండి" : "Listen Natural Voice")}
                    </button>

                    {isSpeakingAudio && (
                      <span style={{ fontSize: "12px", color: "#1B5E20", fontWeight: 600 }}>
                        📢 {language === "te" ? "వాయిస్ వినిపిస్తోంది..." : "Speaking..."}
                      </span>
                    )}
                  </div>

                  {/* Confidence Warning */}
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
                      ℹ️ {language === "te" ? "ధృవీకరించబడిన సమాచారం లభించలేదు." : "No verified official answer found."}
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
                    <div style={{ fontSize: "12px", color: lightColors.inkSecondary, marginBottom: "8px" }}>
                      <strong>{strings.source}:</strong> {msg.sources[0].title} (
                      <span style={{ color: lightColors.saffron, fontWeight: 600 }}>{msg.sources[0].type}</span>)
                    </div>
                  )}

                  {/* Scheme Choices (e.g. from greetings or categories) */}
                  {msg.choices && msg.choices.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                      {msg.choices.map((choice) => {
                        const choiceTitle =
                          choice.name || (language === "te" ? choice.name_te : choice.name_en) || choice.scheme_id;
                        return (
                          <button
                            key={choice.scheme_id}
                            type="button"
                            onClick={() => sendMessage(choiceTitle, choice.scheme_id)}
                            style={{
                              backgroundColor: lightColors.paper,
                              border: `1.5px solid ${lightColors.navy}`,
                              color: lightColors.navy,
                              padding: "10px 14px",
                              borderRadius: "8px",
                              fontWeight: 600,
                              fontSize: "14px",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>👉 {choiceTitle}</span>
                            <span style={{ fontSize: "16px" }}>➔</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Interactive Eligibility Questions */}
                  {msg.next_question && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: lightColors.paper,
                        borderRadius: "8px",
                        border: `1px solid ${lightColors.rule}`,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "10px", color: lightColors.navy, fontSize: "15px" }}>
                        {msg.next_question.text}
                      </div>
                      {msg.next_question.type === "bool" ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => sendMessage(language === "te" ? "అవును" : "yes")}
                            style={{
                              flex: 1,
                              padding: "12px",
                              backgroundColor: "#166534",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "15px",
                            }}
                          >
                            ✓ {strings.yes}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendMessage(language === "te" ? "కాదు" : "no")}
                            style={{
                              flex: 1,
                              padding: "12px",
                              backgroundColor: "#991B1B",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "15px",
                            }}
                          >
                            ✕ {strings.no}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendMessage(strings.dont_know)}
                            style={{
                              padding: "12px 14px",
                              backgroundColor: "transparent",
                              border: `1px solid ${lightColors.rule}`,
                              color: lightColors.inkSecondary,
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            {strings.dont_know}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="number"
                            placeholder={language === "te" ? "సంఖ్య నమోదు చేయండి" : "Enter number"}
                            id="numeric-answer-input"
                            style={{
                              flex: 1,
                              padding: "10px",
                              border: `1px solid ${lightColors.rule}`,
                              borderRadius: "6px",
                              fontSize: "16px",
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
                              padding: "10px 18px",
                              borderRadius: "6px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {strings.send}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disclaimer */}
                  {msg.disclaimer && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: lightColors.inkSecondary,
                        marginTop: "10px",
                        borderTop: `1px dashed ${lightColors.rule}`,
                        paddingTop: "6px",
                      }}
                    >
                      {msg.disclaimer}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "12px 16px", color: lightColors.inkSecondary, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>⏳</span> {language === "te" ? "సమాచారం పరిశీలిస్తోంది..." : "Generating answer…"}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Real-time Listening Banner */}
      {isListening && (
        <div>
          {/* Interim transcript display — large and prominent so user sees what they're saying */}
          {interimTranscript && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                borderTop: "2px solid #FCD34D",
                padding: "10px 16px",
                fontSize: "17px",
                color: "#78350F",
                fontWeight: 600,
                lineHeight: 1.4,
                fontStyle: "italic",
              }}
            >
              🎤 "{interimTranscript}"
            </div>
          )}
          {/* Listening status bar */}
          <div
            style={{
              backgroundColor: "#FEF2F2",
              borderTop: "2px solid #EF4444",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#991B1B",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Animated mic pulse dots */}
              <span style={{ fontSize: "18px", animation: "pulse 1s infinite" }}>🔴</span>
              <span>
                {interimTranscript
                  ? (language === "te" ? "వింటున్నాము..." : "Listening...")
                  : (speechStatus || (language === "te" ? "వింటున్నాము... మాట్లాడండి" : "Listening... Speak now"))}
              </span>
            </div>
            <button
              type="button"
              onClick={handleMicToggle}
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {language === "te" ? "ఆపండి & పంపండి" : "Stop & Send"}
            </button>
          </div>
        </div>
      )}

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
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: isListening ? "#DC2626" : lightColors.navy,
            color: "#FFFFFF",
            border: isListening ? "3px solid #FCA5A5" : `2px solid ${lightColors.saffron}`,
            fontSize: "22px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isListening ? "0 0 14px rgba(220, 38, 38, 0.6)" : "0 2px 6px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
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
          placeholder={isListening ? (language === "te" ? "మాట్లాడండి..." : "Listening...") : strings.or_type}
          style={{
            flex: 1,
            height: "50px",
            padding: "0 14px",
            fontSize: "16px",
            border: `1.5px solid ${isListening ? "#EF4444" : lightColors.rule}`,
            borderRadius: "8px",
            backgroundColor: isListening ? "#FFF5F5" : "#FFFFFF",
          }}
        />

        <button
          type="button"
          data-testid="btn-chat-send"
          onClick={() => sendMessage(inputText)}
          style={{
            height: "50px",
            padding: "0 20px",
            backgroundColor: lightColors.navy,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          {strings.send}
        </button>
      </footer>
    </div>
  );
};
