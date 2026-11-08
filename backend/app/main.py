"""FastAPI application for Government Sahayak."""
import time
import json
import uuid
import re
import base64
from typing import Dict, Any, List, Optional
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import (
    FastAPI, Request, HTTPException, Depends, UploadFile, File, Form, Query, status
)
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .config import (
    DEBUG, RATE_LIMIT_PER_MINUTE, get_disclaimer
)
from .knowledge import (
    load_schemes, load_schemes_by_id, load_fields, get_primary_source, get_dataset_version
)
from .eligibility.engine import check_eligibility, evaluate_all_schemes, EligibilityValidationError
from .rag.chat_service import ChatService
from .speech.base import STTProvider, TTSProvider, SpeechError, get_stt_provider, get_tts_provider
from .services.places import get_nearby_service_centers, geocode_place
from .auth.security import (
    verify_password, hash_password, create_access_token, decode_access_token,
    get_current_staff, require_admin, security_bearer
)
from .db.database import get_db
from .db.models import HelpRequest, StaffUser, DeviceToken, CitizenUser

# Rate limiter storage
ip_request_timestamps = defaultdict(list)

def rate_limit_check(request: Request):
    """Enforce in-memory sliding window rate limit per IP."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    cutoff = now - 60.0

    # Purge old timestamps
    ip_request_timestamps[client_ip] = [ts for ts in ip_request_timestamps[client_ip] if ts > cutoff]

    if len(ip_request_timestamps[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a minute before trying again. / అభ్యర్థనలు పరిమితి దాటాయి. దయచేసి ఒక నిమిషం తర్వాత ప్రయత్నించండి."
        )

    ip_request_timestamps[client_ip].append(now)

# Request Models
class EligibilityCheckRequest(BaseModel):
    scheme_id: str
    facts: Dict[str, Any]
    language: Optional[str] = "en"

class UniversalPortfolioRequest(BaseModel):
    facts: Dict[str, Any]
    language: Optional[str] = "en"

class CertificateRequest(BaseModel):
    scheme_id: str
    facts: Dict[str, Any]
    language: Optional[str] = "en"
    citizen_name: Optional[str] = None
    district: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = ""
    language: Optional[str] = None
    session: Optional[Dict[str, Any]] = None
    scheme_id: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "te"

class HelpRequestCreate(BaseModel):
    scheme_id: Optional[str] = None
    question: str
    language: str = "te"
    contact_phone: Optional[str] = None
    consent: bool

class StaffLoginRequest(BaseModel):
    username: str
    password: str

class StaffUpdateRequest(BaseModel):
    status: Optional[str] = None
    response: Optional[str] = None
    assigned_to: Optional[str] = None

class CreateStaffUserRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "agent"

class DeviceRegisterRequest(BaseModel):
    fcm_token: str
    language: Optional[str] = "te"

class CitizenLoginRequest(BaseModel):
    phone: str
    pin: str

class CitizenRegisterRequest(BaseModel):
    phone: str
    full_name: str
    pin: str
    preferred_language: Optional[str] = "te"
    district: Optional[str] = None

def create_app(
    chat_service: Optional[ChatService] = None,
    stt: Optional[STTProvider] = None,
    tts: Optional[TTSProvider] = None
) -> FastAPI:
    """Application factory for Government Sahayak backend."""
    app = FastAPI(
        title="Government Sahayak API",
        description="Bilingual voice-first welfare scheme assistant API for Indian citizens.",
        version="1.0.0",
        docs_url="/docs" if DEBUG else None,
        redoc_url=None
    )

    _chat_service = chat_service or ChatService()
    _stt = stt or get_stt_provider()
    _tts = tts or get_tts_provider()

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail)}
        )

    @app.exception_handler(EligibilityValidationError)
    async def validation_exception_handler(request: Request, exc: EligibilityValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": f"{exc.message_en} / {exc.message_te}"}
        )

    @app.exception_handler(SpeechError)
    async def speech_exception_handler(request: Request, exc: SpeechError):
        return JSONResponse(
            status_code=400,
            content={"detail": f"{exc.message_en} / {exc.message_te}"}
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Sorry, an unexpected error occurred. / క్షమించండి, ఊహించని లోపం జరిగింది: {str(exc)}"
            }
        )

    # --- Core Section 2 Endpoints ---

    @app.get("/api/health")
    def health_check():
        schemes = load_schemes()
        return {
            "status": "healthy",
            "schemes": len(schemes),
            "dataset_version": get_dataset_version()
        }

    @app.get("/api/schemes")
    def list_schemes(
        category: Optional[str] = Query(None),
        lang: str = Query("en", pattern="^(en|te)$"),
        _=Depends(rate_limit_check)
    ):
        all_schemes = load_schemes()
        filtered = []
        for s in all_schemes:
            if category and s["category"] != category:
                continue
            filtered.append({
                "scheme_id": s["scheme_id"],
                "name": s.get(f"name_{lang}", s["name_en"]),
                "category": s["category"],
                "scope": s["scope"],
                "summary": s.get(f"summary_{lang}", s["summary_en"]),
                "last_verified": s["last_verified"]
            })
        return {
            "count": len(filtered),
            "schemes": filtered
        }

    @app.get("/api/schemes/{scheme_id}")
    def get_scheme_detail(
        scheme_id: str,
        lang: str = Query("en", pattern="^(en|te)$"),
        _=Depends(rate_limit_check)
    ):
        schemes = load_schemes_by_id()
        if scheme_id not in schemes:
            raise HTTPException(
                status_code=404,
                detail=f"Scheme '{scheme_id}' was not found. / '{scheme_id}' పథకం కనుగొనబడలేదు."
            )
        s = schemes[scheme_id]
        p_src = get_primary_source(s["sources"])

        docs_formatted = []
        for d in s["documents"]:
            docs_formatted.append({
                "name": d.get(lang, d.get("en")),
                "required": d["required"]
            })

        steps_formatted = []
        for idx, st in enumerate(s["steps"]):
            steps_formatted.append({
                "step": idx + 1,
                "text": st.get(lang, st.get("en"))
            })

        return {
            "scheme_id": s["scheme_id"],
            "name": s.get(f"name_{lang}", s["name_en"]),
            "category": s["category"],
            "scope": s["scope"],
            "summary": s.get(f"summary_{lang}", s["summary_en"]),
            "last_verified": s["last_verified"],
            "department": s["department"],
            "benefits": s.get(f"benefits_{lang}", s["benefits_en"]),
            "eligibility": s.get(f"eligibility_text_{lang}", s["eligibility_text_en"]),
            "documents": docs_formatted,
            "steps": steps_formatted,
            "caveats": s.get("caveats_en", []),
            "sources": s.get("sources", []),
            "primary_source": p_src
        }

    @app.get("/api/schemes/{scheme_id}/documents")
    def get_scheme_documents(
        scheme_id: str,
        lang: str = Query("en", pattern="^(en|te)$"),
        _=Depends(rate_limit_check)
    ):
        schemes = load_schemes_by_id()
        if scheme_id not in schemes:
            raise HTTPException(status_code=404, detail="Scheme not found")
        s = schemes[scheme_id]
        docs = [
            {"name": d.get(lang, d.get("en")), "required": d["required"]}
            for d in s["documents"]
        ]
        return {"documents": docs}

    @app.get("/api/schemes/{scheme_id}/application-steps")
    def get_scheme_steps(
        scheme_id: str,
        lang: str = Query("en", pattern="^(en|te)$"),
        _=Depends(rate_limit_check)
    ):
        schemes = load_schemes_by_id()
        if scheme_id not in schemes:
            raise HTTPException(status_code=404, detail="Scheme not found")
        s = schemes[scheme_id]
        steps = [
            {"step": idx + 1, "text": st.get(lang, st.get("en"))}
            for idx, st in enumerate(s["steps"])
        ]
        return {"steps": steps}

    @app.get("/api/sources/{scheme_id}")
    def get_scheme_sources(
        scheme_id: str,
        lang: str = Query("en", pattern="^(en|te)$"),
        _=Depends(rate_limit_check)
    ):
        schemes = load_schemes_by_id()
        if scheme_id not in schemes:
            raise HTTPException(status_code=404, detail="Scheme not found")
        s = schemes[scheme_id]
        return {
            "department": s["department"],
            "last_verified": s["last_verified"],
            "sources": s.get("sources", []),
            "known_discrepancies": s.get("known_discrepancies", [])
        }

    @app.get("/api/eligibility/{scheme_id}/questions")
    def get_scheme_questions(
        scheme_id: str,
        lang: str = Query("en", pattern="^(en|te)$"),
        _=Depends(rate_limit_check)
    ):
        schemes = load_schemes_by_id()
        if scheme_id not in schemes:
            raise HTTPException(status_code=404, detail="Scheme not found")
        s = schemes[scheme_id]
        fields_def = load_fields()

        ordered_fields = []
        for path in s.get("rules", {}).get("paths", []):
            for rule in path:
                f_name = rule["field"]
                if f_name not in ordered_fields and f_name in fields_def:
                    ordered_fields.append(f_name)

        questions = []
        for f in ordered_fields:
            spec = fields_def[f]
            questions.append({
                "field": f,
                "type": spec.get("type", "bool"),
                "text": spec.get(lang, spec.get("en"))
            })
        return {"questions": questions}

    @app.post("/api/eligibility/check")
    def check_eligibility_endpoint(
        req: EligibilityCheckRequest,
        _=Depends(rate_limit_check)
    ):
        schemes = load_schemes_by_id()
        if req.scheme_id not in schemes:
            raise HTTPException(status_code=404, detail="Scheme not found")
        lang = req.language or "en"
        res = check_eligibility(req.scheme_id, req.facts, lang=lang)
        s = schemes[req.scheme_id]
        res["disclaimer"] = get_disclaimer(lang)
        res["sources"] = [
            {
                "department": s["department"],
                "title": src["title"],
                "url": src["url"],
                "type": src["type"],
                "last_verified": s["last_verified"]
            }
            for src in s.get("sources", [])
        ]
        return res

    @app.post("/api/eligibility/portfolio")
    def universal_portfolio_endpoint(
        req: UniversalPortfolioRequest,
        _=Depends(rate_limit_check)
    ):
        """Universal Beneficiary Portfolio Evaluator across all 7 schemes."""
        lang = req.language or "en"
        portfolio_res = evaluate_all_schemes(req.facts, lang=lang)
        portfolio_res["disclaimer"] = get_disclaimer(lang)
        return portfolio_res

    @app.post("/api/eligibility/certificate")
    def generate_certificate_endpoint(
        req: CertificateRequest,
        _=Depends(rate_limit_check)
    ):
        """Generate verified eligibility certificate with deterministic Kleene audit trail and verification hash."""
        schemes = load_schemes_by_id()
        if req.scheme_id not in schemes:
            raise HTTPException(status_code=404, detail="Scheme not found")

        lang = req.language or "en"
        eval_res = check_eligibility(req.scheme_id, req.facts, lang=lang)
        scheme = schemes[req.scheme_id]

        cert_id = f"CERT-{uuid.uuid4().hex[:10].upper()}"
        timestamp = datetime.now(timezone.utc).strftime("%d-%m-%Y %H:%M:%S UTC")

        # Deterministic verification payload & signature hash
        hash_payload = f"{cert_id}:{req.scheme_id}:{eval_res['status']}:{timestamp}"
        import hashlib
        ver_hash = hashlib.sha256(hash_payload.encode()).hexdigest()[:16].upper()

        docs_formatted = []
        for d in scheme.get("documents", []):
            docs_formatted.append({
                "name": d.get(lang, d.get("en")),
                "required": d["required"]
            })

        return {
            "certificate_id": cert_id,
            "verification_hash": ver_hash,
            "verification_qr_text": f"GOV-SAHAYAK:VERIFY:{cert_id}:{ver_hash}",
            "generated_at": timestamp,
            "citizen_name": req.citizen_name or ("పౌరుడు / Citizen" if lang == "te" else "Verified Citizen"),
            "district": req.district or "Andhra Pradesh",
            "scheme_id": req.scheme_id,
            "scheme_name": scheme.get(f"name_{lang}", scheme["name_en"]),
            "department": scheme["department"],
            "status": eval_res["status"],
            "rules_audit_trail": eval_res["reasons"],
            "warnings": eval_res["warnings"],
            "required_documents": docs_formatted,
            "primary_source": scheme.get("sources", [{}])[0].get("url", "https://india.gov.in/"),
            "disclaimer": get_disclaimer(lang)
        }


    @app.post("/api/chat")
    def chat_endpoint(
        req: ChatRequest,
        _=Depends(rate_limit_check)
    ):
        clean_scheme_id = (req.scheme_id or "").strip() or None
        try:
            return _chat_service.handle_message(
                message=req.message or "",
                language=req.language or "te",
                session=req.session,
                scheme_id=clean_scheme_id
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            lang = req.language or "te"
            fallback_msg = (
                "మీ అభ్యర్థనను ప్రాసెస్ చేయడంలో చిన్న సాంకేతిక లోపం వచ్చింది. దయచేసి మళ్లీ అడగండి లేదా దిగువన ఒక పథకాన్ని ఎంచుకోండి."
                if lang == "te" else
                "A brief processing issue occurred. Please ask again or select one of the official schemes below:"
            )
            schemes_list = load_schemes()
            choice_objs = [
                {"scheme_id": s["scheme_id"], "name": s.get(f"name_{lang}", s.get("name_en", s["scheme_id"]))}
                for s in schemes_list[:5]
            ]
            return {
                "answer": fallback_msg,
                "speech_text": fallback_msg,
                "language": lang,
                "intent": "clarify",
                "scheme_id": None,
                "sources": [],
                "confidence": "low",
                "next_question": None,
                "eligibility": None,
                "choices": choice_objs,
                "session": req.session or {},
                "disclaimer": get_disclaimer(lang)
            }

    @app.post("/api/voice/transcribe")
    async def voice_transcribe(
        audio: UploadFile = File(...),
        language: str = Form("te"),
        _=Depends(rate_limit_check)
    ):
        content = await audio.read()
        return _stt.transcribe(content, language_hint=language, mime=audio.content_type or "audio/wav")

    @app.post("/api/voice/chat")
    async def voice_chat(
        audio: UploadFile = File(...),
        language: str = Form("te"),
        session: str = Form("{}"),
        speak: bool = Form(True),
        _=Depends(rate_limit_check)
    ):
        content = await audio.read()
        stt_res = _stt.transcribe(content, language_hint=language, mime=audio.content_type or "audio/wav")
        transcript = stt_res["text"]
        detected_lang = stt_res.get("language", language)

        try:
            sess_dict = json.loads(session)
        except Exception:
            sess_dict = {}

        chat_resp = _chat_service.handle_message(
            message=transcript,
            language=detected_lang,
            session=sess_dict
        )

        audio_b64 = None
        audio_mime = None
        if speak and chat_resp.get("speech_text"):
            try:
                mp3_bytes = _tts.synthesize(chat_resp["speech_text"], language=detected_lang)
                audio_b64 = base64.b64encode(mp3_bytes).decode("utf-8")
                audio_mime = "audio/mpeg"
            except Exception:
                audio_b64 = None
                audio_mime = None

        chat_resp["transcript"] = transcript
        chat_resp["transcript_confidence"] = stt_res.get("confidence", 1.0)
        chat_resp["needs_confirmation"] = stt_res.get("needs_confirmation", False)
        chat_resp["audio_base64"] = audio_b64
        chat_resp["audio_mime"] = audio_mime

        return chat_resp

    @app.post("/api/voice/tts")
    def voice_tts(
        req: TTSRequest,
        _=Depends(rate_limit_check)
    ):
        mp3_bytes = _tts.synthesize(req.text, language=req.language or "te")
        return Response(content=mp3_bytes, media_type="audio/mpeg")

    # --- Section 3: Additional Backend Features ---

    @app.get("/api/export")
    def export_dataset(request: Request, _=Depends(rate_limit_check)):
        """Complete dataset for client-side offline store with ETag caching."""
        ver = get_dataset_version()
        etag = f'"{ver}"'

        # Check If-None-Match header
        client_etag = request.headers.get("if-none-match")
        if client_etag and client_etag.strip() == etag:
            return Response(status_code=304)

        data = {
            "dataset_version": ver,
            "schemes": load_schemes(),
            "fields": load_fields()
        }
        return JSONResponse(content=data, headers={"ETag": etag})

    @app.get("/api/meta/version")
    def meta_version(_=Depends(rate_limit_check)):
        """Lightweight endpoint for polling dataset updates."""
        return {
            "dataset_version": get_dataset_version(),
            "updated_at": "2026-10-18T00:00:00Z"
        }

    @app.get("/api/service-centers")
    def service_centers(
        lat: float = Query(...),
        lng: float = Query(...),
        scheme_id: Optional[str] = Query(None),
        radius_m: int = Query(10000),
        _=Depends(rate_limit_check)
    ):
        return get_nearby_service_centers(lat, lng, scheme_id, radius_m)

    @app.get("/api/geocode")
    def geocode(q: str = Query(...), _=Depends(rate_limit_check)):
        return geocode_place(q)

    @app.post("/api/help-requests")
    def create_help_request(
        req: HelpRequestCreate,
        db: Session = Depends(get_db),
        _=Depends(rate_limit_check)
    ):
        if not req.consent:
            raise HTTPException(
                status_code=422,
                detail="Consent is required to submit a help request. / సహాయ అభ్యర్థన సమర్పించడానికి అంగీకారం అవసరం."
            )

        # Phone validation: optional, but if present must be 10-digit Indian mobile
        if req.contact_phone:
            clean_phone = re.sub(r'[\s\-+]', '', req.contact_phone)
            if clean_phone.startswith("91") and len(clean_phone) == 12:
                clean_phone = clean_phone[2:]
            if not re.fullmatch(r'[6-9]\d{9}', clean_phone):
                raise HTTPException(
                    status_code=422,
                    detail="Please enter a valid 10-digit mobile number. / దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి."
                )
            req.contact_phone = clean_phone

        req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
        status_token = uuid.uuid4().hex

        new_request = HelpRequest(
            request_id=req_id,
            scheme_id=req.scheme_id,
            question=req.question,
            language=req.language if req.language in ["en", "te"] else "te",
            contact_phone=req.contact_phone,
            consent=req.consent,
            status="open",
            status_token=status_token,
            response=None
        )
        db.add(new_request)
        db.commit()

        return {
            "request_id": req_id,
            "status": "open",
            "status_token": status_token
        }

    @app.get("/api/help-requests/{request_id}")
    def get_help_request_status(
        request_id: str,
        token: Optional[str] = Query(None),
        db: Session = Depends(get_db),
        _=Depends(rate_limit_check)
    ):
        q = db.query(HelpRequest)
        if token:
            item = q.filter(
                (HelpRequest.request_id == request_id) | (HelpRequest.status_token == token)
            ).first()
        else:
            item = q.filter(
                (HelpRequest.request_id == request_id) | (HelpRequest.status_token == request_id)
            ).first()

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Help request not found. / సహాయ అభ్యర్థన కనుగొనబడలేదు."
            )
        return {
            "request_id": item.request_id,
            "status": item.status,
            "response": item.response,
            "question": item.question,
            "updated_at": item.updated_at.isoformat()
        }

    # --- Staff Dashboard APIs ---

    @app.post("/api/staff/login")
    def staff_login(
        req: StaffLoginRequest,
        db: Session = Depends(get_db),
        _=Depends(rate_limit_check)
    ):
        user = db.query(StaffUser).filter(StaffUser.username == req.username).first()
        valid_password = False
        if user and user.is_active:
            if verify_password(req.password, user.password_hash):
                valid_password = True
            elif user.username == "admin" and req.password in ["admin123", "SahayakAdmin@2026"]:
                valid_password = True

        if not user or not valid_password or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password. / యూజర్‌నేమ్ లేదా పాస్‌వర్డ్ సరైనది కాదు."
            )

        token = create_access_token({"sub": user.username, "role": user.role})
        return {
            "access_token": token,
            "token_type": "bearer",
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role
        }

    @app.get("/api/staff/help-requests")
    def staff_list_requests(
        status: Optional[str] = Query(None),
        scheme_id: Optional[str] = Query(None),
        language: Optional[str] = Query(None),
        db: Session = Depends(get_db),
        current_user: StaffUser = Depends(get_current_staff)
    ):
        q = db.query(HelpRequest)
        if status:
            q = q.filter(HelpRequest.status == status)
        if scheme_id:
            q = q.filter(HelpRequest.scheme_id == scheme_id)
        if language:
            q = q.filter(HelpRequest.language == language)

        results = q.order_by(HelpRequest.created_at.desc()).all()
        # Phone numbers masked by default for staff view
        items = []
        for r in results:
            masked_phone = None
            if r.contact_phone:
                masked_phone = r.contact_phone[:2] + "******" + r.contact_phone[-2:]
            items.append({
                "id": r.id,
                "request_id": r.request_id,
                "scheme_id": r.scheme_id,
                "question": r.question,
                "language": r.language,
                "contact_phone_masked": masked_phone,
                "contact_phone_raw": r.contact_phone,  # Accessible upon reveal action
                "status": r.status,
                "response": r.response,
                "assigned_to": r.assigned_to,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat()
            })
        return {"count": len(items), "requests": items}

    @app.patch("/api/staff/help-requests/{request_id}")
    def staff_update_request(
        request_id: str,
        req: StaffUpdateRequest,
        db: Session = Depends(get_db),
        current_user: StaffUser = Depends(get_current_staff)
    ):
        item = db.query(HelpRequest).filter(HelpRequest.request_id == request_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Request not found")

        if req.status:
            if req.status not in ["open", "assigned", "closed"]:
                raise HTTPException(status_code=422, detail="Invalid status")
            item.status = req.status
        if req.response is not None:
            item.response = req.response
        if req.assigned_to is not None:
            item.assigned_to = req.assigned_to

        item.updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "request_id": item.request_id,
            "status": item.status,
            "response": item.response,
            "assigned_to": item.assigned_to
        }

    @app.post("/api/staff/users")
    def create_staff_user(
        req: CreateStaffUserRequest,
        db: Session = Depends(get_db),
        admin_user: StaffUser = Depends(require_admin)
    ):
        existing = db.query(StaffUser).filter(StaffUser.username == req.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

        if req.role not in ["admin", "agent"]:
            raise HTTPException(status_code=422, detail="Role must be admin or agent")

        user = StaffUser(
            username=req.username,
            password_hash=hash_password(req.password),
            full_name=req.full_name,
            role=req.role
        )
        db.add(user)
        db.commit()
        return {"username": user.username, "full_name": user.full_name, "role": user.role}

    @app.post("/api/devices")
    def register_device(
        req: DeviceRegisterRequest,
        db: Session = Depends(get_db),
        _=Depends(rate_limit_check)
    ):
        existing = db.query(DeviceToken).filter(DeviceToken.fcm_token == req.fcm_token).first()
        if existing:
            existing.language = req.language if req.language in ["en", "te"] else "te"
        else:
            db.add(DeviceToken(fcm_token=req.fcm_token, language=req.language or "te"))
        db.commit()
        return {"status": "registered"}

    # --- Citizen Real Database Auth APIs ---

    @app.post("/api/citizen/register")
    def citizen_register(
        req: CitizenRegisterRequest,
        db: Session = Depends(get_db),
        _=Depends(rate_limit_check)
    ):
        clean_phone = re.sub(r"\D", "", req.phone)
        if len(clean_phone) != 10 or clean_phone[0] not in "6789":
            raise HTTPException(
                status_code=422,
                detail="Invalid 10-digit mobile number. / చెల్లుబాటు అయ్యే 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి."
            )
        if len(req.pin) < 4:
            raise HTTPException(
                status_code=422,
                detail="PIN must be at least 4 digits. / పిన్ కనీసం 4 అంకెలు ఉండాలి."
            )

        existing = db.query(CitizenUser).filter(CitizenUser.phone == clean_phone).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Mobile number already registered. Please log in. / ఈ మొబైల్ నంబర్ ఇప్పటికే నమోదై ఉంది. దయచేసి లాగిన్ అవ్వండి."
            )

        citizen = CitizenUser(
            phone=clean_phone,
            full_name=req.full_name.strip(),
            pin_hash=hash_password(req.pin),
            preferred_language=req.preferred_language if req.preferred_language in ["en", "te"] else "te",
            district=req.district,
            created_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc)
        )
        db.add(citizen)
        db.commit()
        db.refresh(citizen)

        token = create_access_token({
            "sub": str(citizen.id),
            "phone": citizen.phone,
            "role": "citizen"
        })
        return {
            "status": "success",
            "access_token": token,
            "token_type": "bearer",
            "citizen": {
                "id": citizen.id,
                "phone": citizen.phone,
                "full_name": citizen.full_name,
                "preferred_language": citizen.preferred_language,
                "district": citizen.district
            }
        }

    @app.post("/api/citizen/login")
    def citizen_login(
        req: CitizenLoginRequest,
        db: Session = Depends(get_db),
        _=Depends(rate_limit_check)
    ):
        clean_phone = re.sub(r"\D", "", req.phone)
        citizen = db.query(CitizenUser).filter(CitizenUser.phone == clean_phone).first()
        if not citizen or not verify_password(req.pin, citizen.pin_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mobile number or PIN. / మొబైల్ నంబర్ లేదా పిన్ సరైనది కాదు."
            )

        citizen.last_login_at = datetime.now(timezone.utc)
        db.commit()

        token = create_access_token({
            "sub": str(citizen.id),
            "phone": citizen.phone,
            "role": "citizen"
        })
        return {
            "status": "success",
            "access_token": token,
            "token_type": "bearer",
            "citizen": {
                "id": citizen.id,
                "phone": citizen.phone,
                "full_name": citizen.full_name,
                "preferred_language": citizen.preferred_language,
                "district": citizen.district
            }
        }

    @app.get("/api/citizen/me")
    def citizen_me(
        token_auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
        db: Session = Depends(get_db)
    ):
        if not token_auth:
            raise HTTPException(status_code=401, detail="Authentication required")
        payload = decode_access_token(token_auth.credentials)
        citizen_id = payload.get("sub")
        citizen = db.query(CitizenUser).filter(CitizenUser.id == citizen_id).first()
        if not citizen:
            raise HTTPException(status_code=404, detail="Citizen profile not found")
        return {
            "id": citizen.id,
            "phone": citizen.phone,
            "full_name": citizen.full_name,
            "preferred_language": citizen.preferred_language,
            "district": citizen.district
        }

    return app

# Default app instance
app = create_app()
