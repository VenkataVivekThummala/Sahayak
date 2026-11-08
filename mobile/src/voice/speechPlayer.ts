/**
 * Natural Bilingual Voice Player for Government Sahayak.
 *
 * Priority chain for TTS audio:
 *   1. Backend /api/voice/tts  — same-origin, no CORS, returns audio/mpeg blob
 *   2. Browser SpeechSynthesis — offline fallback with carefully selected voice
 *
 * The Google Translate TTS URL approach is intentionally removed because Chrome
 * blocks it with a CORS error when called from new Audio(url) in a local origin.
 */

class NaturalSpeechPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private isSpeakingFlag: boolean = false;
  private onStateChangeListeners: Array<(isSpeaking: boolean) => void> = [];

  public subscribe(listener: (isSpeaking: boolean) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(
        (l) => l !== listener
      );
    };
  }

  private setSpeaking(val: boolean) {
    this.isSpeakingFlag = val;
    this.onStateChangeListeners.forEach((l) => l(val));
  }

  public isSpeaking(): boolean {
    return this.isSpeakingFlag;
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.setSpeaking(false);
  }

  /**
   * Strip markdown syntax, URLs, bullets, emojis-control chars so the speech
   * audio sounds like natural spoken language, not a screen reader of raw text.
   */
  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/https?:\/\/\S+/g, "")          // URLs
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // markdown links → keep label
      .replace(/[#*_~`>•➔✓✕⏹️📢🔴🎤🔊💡👉🏛️]/g, " ")  // markdown/emoji
      .replace(/\d+\.\s+/g, " ")                // numbered list markers
      .replace(/\s{2,}/g, " ")
      .replace(/[-]{2,}/g, " ")
      .trim();
  }

  /**
   * Split long text at sentence/clause boundaries into chunks ≤ 200 chars.
   * Shorter chunks = faster first-audio latency + less TTS truncation.
   */
  private splitIntoChunks(text: string, maxLen = 200): string[] {
    // Split at sentence boundaries first
    const sentences = text.split(/(?<=[.?!।\n])\s+/g);
    const result: string[] = [];
    let current = "";

    for (const sent of sentences) {
      const trimmed = sent.trim();
      if (!trimmed) continue;
      if ((current + " " + trimmed).trim().length <= maxLen) {
        current = (current + " " + trimmed).trim();
      } else {
        if (current) result.push(current);
        if (trimmed.length > maxLen) {
          // Break single very long sentence at commas
          const subParts = trimmed.split(/,\s*/);
          let sub = "";
          for (const p of subParts) {
            if ((sub + ", " + p).trim().length <= maxLen) {
              sub = sub ? sub + ", " + p : p;
            } else {
              if (sub) result.push(sub.trim());
              sub = p;
            }
          }
          current = sub.trim();
        } else {
          current = trimmed;
        }
      }
    }
    if (current) result.push(current);
    return result.filter(Boolean);
  }

  /**
   * Main speak method.
   * Tries backend /api/voice/tts (same-origin blob audio) first;
   * falls back to browser SpeechSynthesis on any error.
   */
  public async speak(text: string, lang: "te" | "en" = "te"): Promise<void> {
    this.stop();
    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) return;

    this.setSpeaking(true);

    // Try backend TTS first (same-origin, avoids CORS)
    const backendSuccess = await this.speakWithBackendTTS(cleaned, lang);
    if (!backendSuccess) {
      // Fallback: browser SpeechSynthesis
      this.speakWithSpeechSynthesis(cleaned, lang);
    }
  }

  /**
   * POST to /api/voice/tts, receive audio/mpeg blob, play via Audio element.
   * This is same-origin via Vite dev-proxy so no CORS issues.
   */
  private async speakWithBackendTTS(
    text: string,
    lang: "te" | "en"
  ): Promise<boolean> {
    try {
      const chunks = this.splitIntoChunks(text);
      if (chunks.length === 0) return false;

      // Play chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        if (!this.isSpeakingFlag) break;

        const chunk = chunks[i];
        const success = await this.playSingleChunk(chunk, lang);
        if (!success) {
          // Backend TTS failed for this chunk — abort and use browser fallback
          return false;
        }
      }

      this.setSpeaking(false);
      return true;
    } catch {
      return false;
    }
  }

  private playSingleChunk(chunk: string, lang: "te" | "en"): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isSpeakingFlag) {
        resolve(false);
        return;
      }

      // We use fetch so we can properly catch CORS / non-2xx errors
      fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: lang === "te" ? "te" : "en" }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          if (!this.isSpeakingFlag) {
            resolve(false);
            return;
          }
          // Revoke previous blob URL to avoid memory leaks
          if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
          }
          const blobUrl = URL.createObjectURL(blob);
          this.currentBlobUrl = blobUrl;
          const audio = new Audio(blobUrl);
          this.currentAudio = audio;

          audio.onended = () => {
            URL.revokeObjectURL(blobUrl);
            this.currentBlobUrl = null;
            resolve(true);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            this.currentBlobUrl = null;
            resolve(false);
          };
          audio.play().catch(() => resolve(false));
        })
        .catch(() => resolve(false));
    });
  }

  /**
   * High-quality fallback: browser SpeechSynthesis with best voice selection.
   * Prefers Google Online voices → Neural → natural sounding voices.
   * Rate 0.85 (slower) for rural listeners who may not be familiar with the assistant.
   */
  private speakWithSpeechSynthesis(text: string, lang: "te" | "en"): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const trySpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      // Use te-IN for Telugu; en-IN for Indian-accented English (clearer for local users)
      utterance.lang = lang === "te" ? "te-IN" : "en-IN";
      utterance.rate = 0.82;  // Slightly slower = clearer for village users
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const targetLangCode = lang === "te" ? "te" : "en";

      // Voice priority: Google Online > Neural/Natural > any matching lang
      const bestVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(targetLangCode) &&
            v.name.toLowerCase().includes("google") &&
            v.localService === false  // online = higher quality
        ) ||
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(targetLangCode) &&
            (v.name.includes("Neural") ||
              v.name.includes("Natural") ||
              v.name.includes("Online"))
        ) ||
        // For Telugu: try Hindi as a clearer fallback (similar phonetics, widely available)
        (lang === "te"
          ? voices.find((v) => v.lang.toLowerCase().startsWith("hi") && !v.localService)
          : null) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(targetLangCode)) ||
        // Last resort: any English Indian voice
        voices.find((v) => v.lang === "en-IN") ||
        null;

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => this.setSpeaking(false);
      utterance.onerror = () => this.setSpeaking(false);

      this.setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet — wait for voiceschanged if list is empty
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", trySpeak, {
        once: true,
      });
    } else {
      trySpeak();
    }
  }
}

export const speechPlayer = new NaturalSpeechPlayer();
