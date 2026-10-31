# Government Sahayak - Final Engineering & Project Report

**Project Name:** Government Sahayak (గవర్నమెంట్ సహాయక్)  
**Completion Date:** 18 October 2026  
**Status:** Completed & Empirically Verified against Section 22 Acceptance Checklist

---

## 1. Executive Summary & What Was Built

Government Sahayak was built from the ground up as an offline-first, bilingual (Telugu & English), voice-enabled welfare scheme guidance platform for rural and elderly citizens in India.

### Key Deliverables Built:
1. **Authoritative Welfare Dataset (`data/`):**
   - 7 verified schemes (`pm-kisan`, `ignoaps`, `ntr-bharosa-oap`, `pm-jay`, `pmay-g`, `ssy`, `post-matric-sc`) with complete bilingual fields, rules, checklists, application steps, known discrepancies, and official government citations.
   - `fields.json` defining valid ranges and bilingual queries.
   - `eval_set.json` with 24 boundary and complex eligibility cases, intent tests, and out-of-scope benchmarks.
2. **Deterministic Eligibility Rule Engine (`backend/app/eligibility/`):**
   - Implements Kleene three-valued logic (True / False / None).
   - Failed rules beat unknowns; list-based schemes never mark eligible without list confirmation; universal 70+ route for PM-JAY operates without list check.
   - Generates advisory warnings for documented discrepancies (e.g., NTR Bharosa age 60–64).
3. **Verified RAG & Anti-Hallucination Pipeline (`backend/app/rag/`):**
   - TF-IDF sublinear character n-gram retriever (`char_wb`, ngram 2–4).
   - Strict 0.22 similarity threshold refusing out-of-scope queries.
   - Mathematical Faithfulness Guard rejecting candidate answers containing ungrounded numbers or URLs.
4. **Speech Layer & REST API (`backend/app/speech/`, `backend/app/main.py`):**
   - Full FastAPI REST server with sliding-window rate limiting (60/min/IP) and friendly bilingual error handlers (never returning stack traces).
   - Speech abstraction with Google Cloud STT/TTS and mock implementations.
   - Export endpoint with SHA-256 ETag caching (`304 Not Modified`).
   - Service centre locator mapping schemes to official centre types (CSC, Grama Sachivalayam, Post Office) via Google Places API (New).
5. **Staff Help Desk Console (`helpdesk-web/`):**
   - Responsive web dashboard built with React, TypeScript, and Vite.
   - Role-based JWT authentication (Admin/Agent) with bcrypt password hashing.
   - Citizen inquiries table with status/scheme/language filters, response submission, and phone number audit-logged masking.
6. **Offline-First Mobile Architecture (`mobile/`):**
   - Strict TypeScript port of the eligibility engine (`mobile/src/engine/engine.ts`).
   - Full i18n support for Telugu and English with Indian number grouping (e.g., 1,50,000) and Telugu digits (౦-౯).
   - Design tokens conforming strictly to the "Anti-AI" public counter aesthetic (warm off-white paper `#FAF7F2`, navy `#14315C`, saffron `#C8691A`, high contrast $\ge 7:1$).
   - Offline-first Zustand stores for settings, scheme cache, document checklists, and queued help requests.
7. **Production DevOps & CI (`deploy/`, `.github/`):**
   - Multi-stage Dockerfiles for backend and helpdesk web.
   - `docker-compose.yml` orchestrating FastAPI, PostgreSQL (named volumes), Nginx, and Caddy with automatic Let's Encrypt TLS.
   - Automated nightly PostgreSQL database backup script (`deploy/backup.sh`).
   - GitHub Actions CI workflow executing test suites and builds.
8. **Academic Project Package (`docs/academic/`):**
   - Editable Word Report (`PROJECT_REPORT.docx`) and Markdown Report (`PROJECT_REPORT.md`).
   - 15-Slide Plain Presentation (`PRESENTATION.pptx`).
   - 5-Minute and 10-Minute Live Demo Scripts (`DEMO_SCRIPT.md`).
   - 50+ In-Depth Viva Voce Preparation Questions (`VIVA_PREPARATION.md`).
   - Bilingual Citizen User Manual & One-Page Privacy Notice (`USER_MANUAL.md`).
   - Human Evaluation Protocols for Native Telugu Review, 5-User Usability, and 100-Utterance Dialect WER (`EVALUATION_PROTOCOLS.md`).

---

## 2. Real Test & Evaluation Results

All numbers reported below were measured from live test executions and recorded in `docs/evaluation_results.json` and `docs/TEST_REPORT.md`:

| Test Suite / Metric | Measured Result | Benchmark Target | Status |
|---|---|---|---|
| **Backend Automated Tests** | **80 / 80 Passed** | 100% | PASS |
| **Mobile TypeScript & Engine Parity Tests** | **32 / 32 Passed** | 100% | PASS |
| **Eligibility Rule Engine Accuracy** | **100.0%** (24 / 24 cases) | 100% | PASS |
| **Eligible / Not-Eligible / Undecided F1** | **1.000 / 1.000 / 1.000** | 1.000 | PASS |
| **Scheme Intent Classification Accuracy** | **100.0%** (12 / 12 queries) | $\ge 90\%$ | PASS |
| **Topic Intent Classification Accuracy** | **91.67%** (11 / 12 queries) | $\ge 85\%$ | PASS |
| **Semantic Retrieval Precision@1** | **90.0%** | $\ge 80\%$ | PASS |
| **Semantic Retrieval Recall@3** | **100.0%** | $\ge 90\%$ | PASS |
| **Semantic Retrieval MRR** | **0.9333** | $\ge 0.85$ | PASS |
| **Out-of-Scope Refusal Precision** | **100.0%** | 100% | PASS |
| **Eligibility Decision Latency (p50)** | **0.006 ms** | $< 10\text{ ms}$ | PASS |
| **Retriever Search Latency (p50)** | **1.894 ms** | $< 50\text{ ms}$ | PASS |
| **REST API Latencies (p50)** | **3.45 to 3.90 ms** | $< 100\text{ ms}$ | PASS |
| **Helpdesk Web Build** | **36 modules, 0 errors** | 0 errors | PASS |

---

## 3. What Was Verified on Real Run-times vs. What Was Not

### Verified by Real Execution:
- Complete Python 3.14.4 backend: all 80 PyTest tests passed.
- SQLite and PostgreSQL schema initialization, migrations, cascading deletes, check constraints, and JSON synchronization.
- Node.js v24.18.0 TypeScript execution: all 32 Jest unit and parity tests passed.
- Exact equivalence between Python engine and TypeScript client engine across all 24 evaluation cases.
- Helpdesk Web production build (`vite build`) producing minified production assets.
- Live source freshness verification script (`scripts/check_sources.py`) auditing upstream government URLs.

### What Was Not Measured / Pending Human Evaluation:
1. **End-to-End Spoken Voice on 4G SIM:** Marked **"Not measured"** because physical hardware and live telecom network are required.
2. **Native Telugu Human Review & Usability Study:** Marked **"Pending human evaluation"** in `docs/academic/EVALUATION_PROTOCOLS.md` (no fake user survey numbers or fabricated Likert scores).

---

## 4. Remaining Blockers & Hand-Off Steps for User

In accordance with Section 24 and `BLOCKERS.md`, the following steps must be performed by the user for physical production release:

1. **Google Cloud Credentials (`.env`):**
   - Provide a GCP service account JSON key with Cloud Speech-to-Text, Cloud Text-to-Speech, and Google Places API (New) enabled.
   - Set `GOOGLE_APPLICATION_CREDENTIALS` and `GOOGLE_PLACES_API_KEY` in `backend/.env` or `deploy/.env`.
2. **Firebase Push Notifications (`mobile/android/app/`):**
   - Place your production `google-services.json` in `mobile/android/app/` if FCM push notifications are desired.
3. **Physical Android Device & Keystore Signing:**
   - Generate your private upload keystore following `docs/RELEASE.md` and build the signed APK/AAB via `./gradlew assembleRelease`.
4. **Domain & Server Deployment:**
   - On your production Linux VM, clone the repository, populate `deploy/.env`, and run `docker compose up -d`. Caddy will provision HTTPS automatically.
