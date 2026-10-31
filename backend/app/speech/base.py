"""Speech interfaces and implementations (Mock and Google Cloud)."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import base64

class SpeechError(Exception):
    """Raised when speech transcription or synthesis fails."""
    def __init__(self, message_en: str, message_te: str):
        super().__init__(message_en)
        self.message_en = message_en
        self.message_te = message_te

class STTProvider(ABC):
    """Abstract interface for Speech-to-Text transcription."""
    @abstractmethod
    def transcribe(self, audio_bytes: bytes, language_hint: str = "te", mime: str = "audio/wav") -> Dict[str, Any]:
        """
        Transcribe audio bytes.
        Returns:
          text: str
          language: str ('te' or 'en')
          confidence: float (0.0 to 1.0)
          needs_confirmation: bool (True if confidence < 0.6)
        """
        pass

class TTSProvider(ABC):
    """Abstract interface for Text-to-Speech synthesis."""
    @abstractmethod
    def synthesize(self, text: str, language: str = "te") -> bytes:
        """Synthesize text into audio/mpeg MP3 bytes."""
        pass

class MockSTT(STTProvider):
    """Mock STT implementation for automated testing and offline development."""
    def transcribe(self, audio_bytes: bytes, language_hint: str = "te", mime: str = "audio/wav") -> Dict[str, Any]:
        if not audio_bytes or len(audio_bytes) < 4:
            raise SpeechError(
                "No speech audio was detected. Please speak clearly into the microphone.",
                "వాయిస్ ఆడియో గుర్తించబడలేదు. దయచేసి మైక్రోఫోన్‌లో స్పష్టంగా మాట్లాడండి."
            )
        try:
            # If the payload is UTF-8 text encoded as bytes, use it directly
            text = audio_bytes.decode("utf-8").strip()
        except UnicodeDecodeError:
            text = "పీఎం కిసాన్ వివరాలు" if language_hint == "te" else "What is PM Kisan?"

        confidence = 0.95
        return {
            "text": text,
            "language": language_hint if language_hint in ["te", "en"] else "te",
            "confidence": confidence,
            "needs_confirmation": confidence < 0.6
        }

class MockTTS(TTSProvider):
    """Mock TTS implementation returning simulated MP3 audio frame bytes."""
    def synthesize(self, text: str, language: str = "te") -> bytes:
        if not text.strip():
            raise SpeechError(
                "Cannot synthesize empty speech text.",
                "ఖాళీ టెక్స్ట్‌ను ఆడియోగా మార్చడం సాధ్యం కాదు."
            )
        # Standard ID3v2 header + MPEG audio frame header mock
        id3_header = b"ID3\x04\x00\x00\x00\x00\x00#TSSE\x00\x00\x00\r\x00\x00\x03Lavf58.29.100"
        mp3_frames = b"\xff\xfb\x90d" * 64
        return id3_header + mp3_frames

class GoogleSTT(STTProvider):
    """Google Cloud Speech-to-Text provider."""
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path

    def transcribe(self, audio_bytes: bytes, language_hint: str = "te", mime: str = "audio/wav") -> Dict[str, Any]:
        try:
            from google.cloud import speech
            client = speech.SpeechClient()
            audio = speech.RecognitionAudio(content=audio_bytes)
            primary_lang = "te-IN" if language_hint == "te" else "en-IN"
            alt_lang = "en-IN" if primary_lang == "te-IN" else "te-IN"

            phrase_hints = [
                "PM Kisan", "పీఎం కిసాన్", "Ayushman Bharat", "ఆయుష్మాన్ భారత్",
                "Sukanya Samriddhi", "సుకున్య సమృద్ధి", "NTR Bharosa", "ఎన్టీఆర్ భరోసా",
                "PMAY", "పీఎంఏవై"
            ]

            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code=primary_lang,
                alternative_language_codes=[alt_lang],
                enable_automatic_punctuation=True,
                speech_contexts=[speech.SpeechContext(phrases=phrase_hints)]
            )
            response = client.recognize(config=config, audio=audio)
            if not response.results:
                raise SpeechError("No speech detected", "ధ్వని గుర్తించబడలేదు")

            result = response.results[0]
            best_alt = result.alternatives[0]
            confidence = float(best_alt.confidence) if best_alt.confidence else 0.8
            return {
                "text": best_alt.transcript.strip(),
                "language": "te" if "te" in result.language_code else "en",
                "confidence": confidence,
                "needs_confirmation": confidence < 0.6
            }
        except Exception as e:
            if isinstance(e, SpeechError):
                raise e
            raise SpeechError(
                f"Speech-to-Text service unavailable: {str(e)}",
                "వాయిస్ రికగ్నిషన్ సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి టైప్ చేయండి."
            )

class GoogleTTS(TTSProvider):
    """Google Cloud Text-to-Speech provider."""
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path

    def synthesize(self, text: str, language: str = "te") -> bytes:
        try:
            from google.cloud import texttospeech
            client = texttospeech.TextToSpeechClient()
            s_input = texttospeech.SynthesisInput(text=text)
            lang_code = "te-IN" if language == "te" else "en-IN"
            voice = texttospeech.VoiceSelectionParams(
                language_code=lang_code,
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=0.9
            )
            resp = client.synthesize_speech(input=s_input, voice=voice, audio_config=audio_config)
            return resp.audio_content
        except Exception as e:
            raise SpeechError(
                f"Text-to-Speech service unavailable: {str(e)}",
                "వాయిస్ ఆడియో సేవ అందుబాటులో లేదు."
            )

def get_stt_provider() -> STTProvider:
    return MockSTT()

def get_tts_provider() -> TTSProvider:
    return MockTTS()
