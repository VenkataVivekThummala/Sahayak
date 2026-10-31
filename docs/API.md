# Government Sahayak - REST API Specification

**Base URL:** `http://localhost:8000` (or configured production domain)  
**Authentication:** Citizens require no authentication. Staff endpoints require `Bearer <JWT_TOKEN>`.  
**Rate Limiting:** Default 60 requests/minute per IP (returns HTTP 429).  
**Language Parameter:** All GET endpoints accept `?lang=en|te`.

---

## 1. System Health & Dataset Metadata

### `GET /api/health`
Returns service status, loaded scheme count, and deterministic dataset version hash.
```json
{
  "status": "healthy",
  "schemes": 7,
  "dataset_version": "50c82270bb34"
}
```

### `GET /api/meta/version`
Lightweight polling endpoint for mobile client offline update detection.
```json
{
  "dataset_version": "50c82270bb34",
  "updated_at": "2026-10-18T00:00:00Z"
}
```

### `GET /api/export`
Full dataset export with HTTP ETag support (returns `304 Not Modified` if client ETag matches).
```json
{
  "dataset_version": "50c82270bb34",
  "schemes": [ ... ],
  "fields": { ... }
}
```

---

## 2. Schemes & Knowledge

### `GET /api/schemes?category=&lang=en|te`
Returns list of official schemes with brief metadata.

### `GET /api/schemes/{scheme_id}?lang=en|te`
Returns detailed scheme record including benefits, eligibility text, documents, steps, caveats, and verified sources.

### `GET /api/schemes/{scheme_id}/documents?lang=en|te`
Returns required documents checklist with `required: true | false | null` (null = confirm at office).

### `GET /api/schemes/{scheme_id}/application-steps?lang=en|te`
Returns step-by-step application instructions.

### `GET /api/sources/{scheme_id}?lang=en|te`
Returns verified source citations and known discrepancies between portals.

---

## 3. Eligibility Rule Engine

### `GET /api/eligibility/{scheme_id}/questions?lang=en|te`
Returns required fact questions for the target scheme in definition order.

### `POST /api/eligibility/check`
Calculates deterministic eligibility using Kleene three-valued logic.
```json
// Request
{
  "scheme_id": "pm-kisan",
  "facts": {
    "owns_cultivable_land": true,
    "is_institutional_landholder": false,
    "holds_constitutional_post": false,
    "is_income_tax_payer": false
  },
  "language": "te"
}

// Response
{
  "scheme_id": "pm-kisan",
  "status": "eligible",
  "reasons": [
    {
      "field": "owns_cultivable_land",
      "label": "దరఖాస్తుదారు లేదా కుటుంబం పేరు మీద సాగుభూమి ఉండాలి",
      "kind": "hard",
      "result": "passed",
      "user_value": true
    }
  ],
  "warnings": [],
  "missing_fields": [],
  "disclaimer": "ఈ యాప్ అధికారిక ప్రజా ప్రభుత్వ సమాచారం ఆధారంగా...",
  "sources": [ ... ]
}
```

---

## 4. Conversational Assistant & Voice

### `POST /api/chat`
Stateless conversational inquiry orchestrator.
```json
// Request
{
  "message": "పీఎం కిసాన్ పథకానికి ఏయే పత్రాలు కావాలి?",
  "language": "te"
}

// Response
{
  "answer": "పీఎం కిసాన్ సమ్మాన్ నిధి కోసం కావలసిన పత్రాలు:\n• ఆధార్ కార్డు (తప్పనిసరి)...",
  "speech_text": "పీఎం కిసాన్ సమ్మాన్ నిధి కోసం కావలసిన పత్రాలు...",
  "language": "te",
  "intent": "documents",
  "scheme_id": "pm-kisan",
  "sources": [ ... ],
  "confidence": "high",
  "next_question": null,
  "eligibility": null,
  "choices": null,
  "session": { ... },
  "disclaimer": "..."
}
```

### `POST /api/voice/transcribe` (multipart/form-data)
Transcribes audio (`audio` file + `language` string) returning text and confidence.

### `POST /api/voice/chat` (multipart/form-data)
End-to-end voice pipeline: Transcribe -> Chat Orchestration -> Synthesize MP3 audio (base64).

### `POST /api/voice/tts`
Synthesizes speech text into MP3 binary audio (`audio/mpeg`).

---

## 5. Citizen Helpdesk & Staff Operations

### `POST /api/help-requests`
Submits citizen inquiry for staff review.
```json
// Request
{
  "scheme_id": "pm-kisan",
  "question": "How to resolve land passbook survey mismatch?",
  "language": "en",
  "contact_phone": "9876543210",
  "consent": true
}

// Response
{
  "request_id": "REQ-7F9A1B2C",
  "status": "open",
  "status_token": "a1b2c3d4e5f6..."
}
```

### `GET /api/help-requests/{request_id}?token=<status_token>`
Retrieves status and staff reply without requiring citizen login.

### `POST /api/staff/login`
Staff JWT authentication returning 8-hour bearer token.

### `GET /api/staff/help-requests?status=&scheme_id=&language=`
Lists citizen inquiries (phones masked by default) with staff authorization header.

### `PATCH /api/staff/help-requests/{request_id}`
Updates inquiry status, assigns staff agent, and attaches official response.
