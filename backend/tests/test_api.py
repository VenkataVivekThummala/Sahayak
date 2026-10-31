"""Test suite for FastAPI REST API endpoints."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import create_app
from backend.app.speech.base import MockSTT, MockTTS
from backend.app.rag.chat_service import ChatService

@pytest.fixture
def client():
    app = create_app(chat_service=ChatService(), stt=MockSTT(), tts=MockTTS())
    return TestClient(app)

def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["schemes"] == 14
    assert "dataset_version" in data

def test_schemes_list(client):
    # English
    resp_en = client.get("/api/schemes?lang=en")
    assert resp_en.status_code == 200
    data_en = resp_en.json()
    assert data_en["count"] == 14
    assert any(s["name"] == "PM Kisan Samman Nidhi" for s in data_en["schemes"])

    # Telugu
    resp_te = client.get("/api/schemes?lang=te")
    assert resp_te.status_code == 200
    data_te = resp_te.json()
    assert any("పీఎం కిసాన్" in s["name"] for s in data_te["schemes"])

def test_scheme_detail(client):
    resp = client.get("/api/schemes/pm-kisan?lang=en")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scheme_id"] == "pm-kisan"
    assert len(data["benefits"]) > 0
    assert len(data["documents"]) > 0
    assert len(data["steps"]) > 0
    assert data["primary_source"] is not None

def test_scheme_not_found_404_friendly(client):
    resp = client.get("/api/schemes/non-existent-scheme?lang=en")
    assert resp.status_code == 404
    data = resp.json()
    assert "not found" in data["detail"].lower()

def test_scheme_documents_endpoint(client):
    resp = client.get("/api/schemes/pm-kisan/documents?lang=en")
    assert resp.status_code == 200
    docs = resp.json()["documents"]
    assert any(d["name"].startswith("Aadhaar") and d["required"] is True for d in docs)

def test_scheme_steps_endpoint(client):
    resp = client.get("/api/schemes/pm-kisan/application-steps?lang=en")
    assert resp.status_code == 200
    steps = resp.json()["steps"]
    assert len(steps) >= 3
    assert steps[0]["step"] == 1

def test_sources_endpoint(client):
    resp = client.get("/api/sources/ntr-bharosa-oap?lang=en")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["sources"]) > 0
    assert len(data["known_discrepancies"]) > 0

def test_eligibility_questions_endpoint(client):
    resp = client.get("/api/eligibility/pm-kisan/questions?lang=en")
    assert resp.status_code == 200
    qs = resp.json()["questions"]
    assert len(qs) == 4
    fields = [q["field"] for q in qs]
    assert "owns_cultivable_land" in fields

def test_eligibility_check_endpoint(client):
    payload = {
        "scheme_id": "ignoaps",
        "facts": {"age": 65, "is_bpl": True},
        "language": "en"
    }
    resp = client.post("/api/eligibility/check", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "eligible"
    assert "disclaimer" in data
    assert len(data["sources"]) > 0

def test_eligibility_check_validation_error_422(client):
    payload = {
        "scheme_id": "ignoaps",
        "facts": {"age": 200},  # out of range
        "language": "en"
    }
    resp = client.post("/api/eligibility/check", json=payload)
    assert resp.status_code == 422
    assert "detail" in resp.json()

def test_chat_endpoint(client):
    payload = {
        "message": "What is PM Kisan?",
        "language": "en"
    }
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "overview"
    assert data["scheme_id"] == "pm-kisan"
    assert len(data["sources"]) > 0
    assert "disclaimer" in data

def test_voice_transcribe_endpoint(client):
    audio_content = b"What are the benefits of Sukanya Samriddhi?"
    files = {"audio": ("sample.wav", audio_content, "audio/wav")}
    data = {"language": "en"}
    resp = client.post("/api/voice/transcribe", files=files, data=data)
    assert resp.status_code == 200
    res = resp.json()
    assert res["text"] == "What are the benefits of Sukanya Samriddhi?"
    assert res["confidence"] >= 0.8

def test_voice_chat_endpoint(client):
    audio_content = b"Tell me about PM Kisan"
    files = {"audio": ("sample.wav", audio_content, "audio/wav")}
    data = {"language": "en", "session": "{}", "speak": "true"}
    resp = client.post("/api/voice/chat", files=files, data=data)
    assert resp.status_code == 200
    res = resp.json()
    assert res["transcript"] == "Tell me about PM Kisan"
    assert res["audio_base64"] is not None
    assert res["audio_mime"] == "audio/mpeg"

def test_voice_tts_endpoint(client):
    payload = {"text": "Hello, welcome to Government Sahayak", "language": "en"}
    resp = client.post("/api/voice/tts", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/mpeg"
    assert len(resp.content) > 10

def test_silence_audio_friendly_error(client):
    files = {"audio": ("silence.wav", b"", "audio/wav")}
    data = {"language": "en"}
    resp = client.post("/api/voice/transcribe", files=files, data=data)
    assert resp.status_code == 400
    assert "no speech" in resp.json()["detail"].lower()
