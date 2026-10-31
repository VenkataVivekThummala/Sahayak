# Architecture Guide: Adding New Indian Languages

Government Sahayak was built from the ground up with a modular multilingual architecture designed to expand to other Indian languages (such as Hindi or Tamil) without architectural refactoring.

---

## Architecture of Multilingual Extension

Every language requires four standardized assets:
1. **Frontend String Table:** A new dictionary file in `mobile/src/i18n/<lang_code>.ts` adhering to the `Strings` interface.
2. **Authoritative Scheme Content:** Translated descriptions, benefits, steps, and document labels suffixed by language code (`_hi` or `_ta`).
3. **NLP Aliases and Number Normalization:**
   - Script digit normalization (e.g. Devanagari ०-९ or Tamil ௦-௯) in `backend/app/nlp/extract.py`.
   - Scheme aliases in the target script in `backend/app/nlp/intent.py`.
4. **Speech Provider Configuration:**
   - STT: Google Cloud Speech language code (`hi-IN` for Hindi, `ta-IN` for Tamil).
   - TTS: Google Cloud Text-to-Speech voice identifier.

---

## Detailed Step-by-Step Procedure (Example: Hindi `hi`)

1. **Add UI String Table:**
   Create `mobile/src/i18n/hi.ts` implementing `Strings`.
2. **Update Supported Languages:**
   Add `"hi"` to `SupportedLanguage` type in `mobile/src/i18n/formatters.ts` and add Hindi month names for date formatting.
3. **Add Data Attributes:**
   Add `name_hi`, `summary_hi`, `benefits_hi`, `eligibility_text_hi` to `data/schemes.json` and Hindi questions to `data/fields.json`.
4. **Update Regex Boundaries & Aliases:**
   Add Hindi keywords to `SCHEME_ALIASES` and `TOPIC_PATTERNS` in `backend/app/nlp/intent.py`.
5. **Run Test Suites:**
   Verify test suites in all supported languages:
   ```bash
   python -m pytest backend/tests/ -v
   cd mobile && npm test
   ```
