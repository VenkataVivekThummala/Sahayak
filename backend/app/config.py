"""Configuration settings for Government Sahayak backend."""
import os
from pathlib import Path
from typing import Dict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = APP_ENV != "production"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/sahayak.db")
JWT_SECRET = os.getenv("JWT_SECRET", "sahayak-development-secret-key-change-in-production-1234567890")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 8

RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.12"))
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "none")  # "none" or "anthropic"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-5-5")

SPEECH_PROVIDER = os.getenv("SPEECH_PROVIDER", "mock")  # "mock" or "google"
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

HELP_RETENTION_DAYS = int(os.getenv("HELP_RETENTION_DAYS", "90"))

DISCLAIMERS: Dict[str, str] = {
    "en": "This application provides guidance based on official public government information. It is not an official government decision, and does not submit applications on your behalf. Final eligibility is determined by the respective government department.",
    "te": "ఈ యాప్ అధికారిక ప్రజా ప్రభుత్వ సమాచారం ఆధారంగా మార్గదర్శకత్వం అందిస్తుంది. ఇది అధికారిక ప్రభుత్వ నిర్ణయం కాదు మరియు మీ తరపున దరఖాస్తులను సమర్పించదు. తుది అర్హతను సంబంధిత ప్రభుత్వ శాఖ నిర్ణయిస్తుంది."
}

def get_disclaimer(lang: str = "en") -> str:
    """Return disclaimer text for the specified language."""
    return DISCLAIMERS.get(lang, DISCLAIMERS["en"])
