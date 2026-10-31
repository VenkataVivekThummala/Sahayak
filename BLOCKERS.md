# Government Sahayak - Blockers & Credentials Log

In accordance with Section A.4 of the Operating Protocol, when an external credential, physical hardware, or human review is needed, it is documented here with the exact action required, while the codebase provides complete mocked/emulated fallbacks so development and automated verification never halt.

| Item | Reason Needed | Current Fallback / Mock In Place | Action Required by User |
|---|---|---|---|
| **Google Cloud Credentials** (`GOOGLE_APPLICATION_CREDENTIALS`) | Cloud Speech-to-Text (STT), Text-to-Speech (TTS), and Google Places API (New) | Mock STT & TTS implementations in `backend/app/speech/base.py`; on-device fallback; local service centre mock | Provide GCP service account JSON key with Cloud STT, Cloud TTS, and Places API enabled in `.env` |
| **Anthropic API Key** (`ANTHROPIC_API_KEY`) | LLM-based answer generation with strict faithfulness guard | `LLM_PROVIDER=none` with extractive chunk fallback; system fully functional without LLM | (Optional) Add Anthropic API key to `backend/.env` |
| **Firebase Service Account / FCM** (`google-services.json`) | Push notifications for helpdesk updates and scheme changes | Local in-app notification simulation and polling | Place `google-services.json` in `mobile/android/app/` for production push |
| **Physical Android Hardware & Native Telugu Reviewer** | Physical device evaluation, TalkBack audit, native dialect evaluation | Android Emulator / Maestro E2E test suite; human evaluation protocols detailed in `docs/academic/` | Run release APK on physical devices and conduct user evaluation with target demographics |
