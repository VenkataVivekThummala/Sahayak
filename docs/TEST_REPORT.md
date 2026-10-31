# Government Sahayak - Test & Evaluation Report

**Report Date:** 2026-10-18  
**Runtimes:** Python 3.14.4 (FastAPI, PyTest, scikit-learn), Node.js v24.18.0  
**Environment:** Local testbed (Windows 11 / x86_64)

---

## 1. Automated Test Suite Results

### 1.1 Dataset Integrity (`backend/tests/test_dataset_integrity.py`)
- **Status:** PASS (10/10 tests passing)
- **Execution Command:** `python -m pytest backend/tests/test_dataset_integrity.py -v`
- **Output:**
```
backend/tests/test_dataset_integrity.py::test_schemes_load PASSED        [ 10%]
backend/tests/test_dataset_integrity.py::test_no_employment_category PASSED [ 20%]
backend/tests/test_dataset_integrity.py::test_scheme_fields_presence PASSED [ 30%]
backend/tests/test_dataset_integrity.py::test_bilingual_list_lengths PASSED [ 40%]
backend/tests/test_dataset_integrity.py::test_sources_integrity PASSED   [ 50%]
backend/tests/test_dataset_integrity.py::test_rules_fields_in_fields_json PASSED [ 60%]
backend/tests/test_dataset_integrity.py::test_documents_structure PASSED [ 70%]
backend/tests/test_dataset_integrity.py::test_steps_structure PASSED     [ 80%]
backend/tests/test_dataset_integrity.py::test_fields_json_bilingual PASSED [ 90%]
backend/tests/test_dataset_integrity.py::test_eval_set_structure PASSED  [100%]
============================= 10 passed in 0.11s ==============================
```

### 1.2 Deterministic Eligibility Engine (`backend/tests/test_eligibility.py`)
- **Status:** PASS (28/28 tests passing including all 24 eval cases)
- **Execution Command:** `python -m pytest backend/tests/test_eligibility.py -v`
- **Output:**
```
backend/tests/test_eligibility.py::test_eval_set_24_cases PASSED         [  3%]
backend/tests/test_eligibility.py::test_pm_kisan_eligible PASSED         [  7%]
backend/tests/test_eligibility.py::test_pm_kisan_not_eligible_institutional PASSED [ 10%]
backend/tests/test_eligibility.py::test_pm_kisan_not_eligible_constitutional PASSED [ 14%]
backend/tests/test_eligibility.py::test_pm_kisan_cannot_determine_multiple_missing PASSED [ 17%]
backend/tests/test_eligibility.py::test_ignoaps_boundary_age_60 PASSED   [ 21%]
backend/tests/test_eligibility.py::test_ignoaps_boundary_age_59 PASSED   [ 25%]
backend/tests/test_eligibility.py::test_ignoaps_failed_rule_beats_unknown PASSED [ 28%]
backend/tests/test_eligibility.py::test_ntr_bharosa_warning_60_to_64 PASSED [ 32%]
backend/tests/test_eligibility.py::test_ntr_bharosa_no_warning_65_plus PASSED [ 35%]
backend/tests/test_eligibility.py::test_ntr_bharosa_non_ap_resident PASSED [ 39%]
backend/tests/test_eligibility.py::test_pm_jay_age_70_route PASSED       [ 42%]
backend/tests/test_eligibility.py::test_pm_jay_list_route_eligible PASSED [ 46%]
backend/tests/test_eligibility.py::test_pm_jay_list_route_not_eligible PASSED [ 50%]
backend/tests/test_eligibility.py::test_pm_jay_list_route_cannot_determine PASSED [ 53%]
backend/tests/test_eligibility.py::test_pmay_g_never_eligible_without_list PASSED [ 57%]
backend/tests/test_eligibility.py::test_pmay_g_pucca_house_fails PASSED  [ 60%]
backend/tests/test_eligibility.py::test_ssy_boundary_age_10 PASSED       [ 64%]
backend/tests/test_eligibility.py::test_ssy_boundary_age_11 PASSED       [ 67%]
backend/tests/test_eligibility.py::test_ssy_not_girl_child PASSED        [ 71%]
backend/tests/test_eligibility.py::test_post_matric_sc_boundary_income_250000 PASSED [ 75%]
backend/tests/test_eligibility.py::test_post_matric_sc_boundary_income_250001 PASSED [ 78%]
backend/tests/test_eligibility.py::test_post_matric_sc_not_sc PASSED     [ 82%]
backend/tests/test_eligibility.py::test_telugu_labels PASSED             [ 85%]
backend/tests/test_eligibility.py::test_validation_drops_unknown_keys PASSED [ 89%]
backend/tests/test_eligibility.py::test_validation_rejects_bool_for_number PASSED [ 92%]
backend/tests/test_eligibility.py::test_validation_rejects_out_of_range_number PASSED [ 96%]
backend/tests/test_eligibility.py::test_validation_rejects_wrong_type_for_bool PASSED [100%]
============================= 28 passed in 0.16s ==============================
```

### 1.3 NLP Extractor and Intent Matching (`backend/tests/test_nlp.py`)
- **Status:** PASS (11/11 tests passing)
- **Execution Command:** `python -m pytest backend/tests/test_nlp.py -v`
- **Output:**
```
backend/tests/test_nlp.py::test_telugu_digits_normalization PASSED       [  9%]
backend/tests/test_nlp.py::test_language_detection PASSED                [ 18%]
backend/tests/test_nlp.py::test_extract_age_english PASSED               [ 27%]
backend/tests/test_nlp.py::test_extract_age_telugu PASSED                [ 36%]
backend/tests/test_nlp.py::test_extract_income_english PASSED            [ 45%]
backend/tests/test_nlp.py::test_extract_income_telugu PASSED             [ 54%]
backend/tests/test_nlp.py::test_no_false_income_from_age PASSED          [ 63%]
backend/tests/test_nlp.py::test_extract_yes_no_both_languages PASSED     [ 72%]
backend/tests/test_nlp.py::test_scheme_matching_specific PASSED          [ 81%]
backend/tests/test_nlp.py::test_generic_pension_returns_choices PASSED   [ 90%]
backend/tests/test_nlp.py::test_topic_priority PASSED                    [100%]
============================= 11 passed in 0.08s ==============================
```

### 1.4 RAG & Chat Service (`backend/tests/test_chat_service.py`)
- **Status:** PASS (9/9 tests passing)
- **Execution Command:** `python -m pytest backend/tests/test_chat_service.py -v`
- **Output:**
```
backend/tests/test_chat_service.py::test_documents_in_en_and_te PASSED   [ 11%]
backend/tests/test_chat_service.py::test_amount_comes_from_data_ntr_bharosa PASSED [ 22%]
backend/tests/test_chat_service.py::test_ambiguous_pension_returns_choices PASSED [ 33%]
backend/tests/test_chat_service.py::test_full_eligibility_dialogue PASSED [ 44%]
backend/tests/test_chat_service.py::test_reask_on_unparseable_answer PASSED [ 55%]
backend/tests/test_chat_service.py::test_out_of_scope_questions_refused PASSED [ 66%]
backend/tests/test_chat_service.py::test_empty_message_friendly PASSED   [ 77%]
backend/tests/test_chat_service.py::test_guard_blocks_invented_numbers_and_urls PASSED [ 88%]
backend/tests/test_chat_service.py::test_automatic_fact_absorption PASSED [100%]
============================== 9 passed in 1.81s ==============================
```

### 1.5 FastAPI REST Endpoints (`backend/tests/test_api.py`)
- **Status:** PASS (15/15 tests passing)
- **Execution Command:** `python -m pytest backend/tests/test_api.py -v`
- **Output:**
```
backend/tests/test_api.py::test_health_endpoint PASSED                   [  6%]
backend/tests/test_api.py::test_schemes_list PASSED                      [ 13%]
backend/tests/test_api.py::test_scheme_detail PASSED                     [ 20%]
backend/tests/test_api.py::test_scheme_not_found_404_friendly PASSED     [ 26%]
backend/tests/test_api.py::test_scheme_documents_endpoint PASSED         [ 33%]
backend/tests/test_api.py::test_scheme_steps_endpoint PASSED             [ 40%]
backend/tests/test_api.py::test_sources_endpoint PASSED                  [ 46%]
backend/tests/test_api.py::test_eligibility_questions_endpoint PASSED    [ 53%]
backend/tests/test_api.py::test_eligibility_check_endpoint PASSED        [ 60%]
backend/tests/test_api.py::test_eligibility_check_validation_error_422 PASSED [ 66%]
backend/tests/test_api.py::test_chat_endpoint PASSED                     [ 73%]
backend/tests/test_api.py::test_voice_transcribe_endpoint PASSED         [ 80%]
backend/tests/test_api.py::test_voice_chat_endpoint PASSED               [ 86%]
backend/tests/test_api.py::test_voice_tts_endpoint PASSED                [ 93%]
backend/tests/test_api.py::test_silence_audio_friendly_error PASSED      [100%]
============================== 15 passed in 2.21s ==============================
```

### 1.6 Client TypeScript Suite & 3,500-Iteration Engine Parity (`mobile/tests/`)
- **Status:** PASS (33/33 test suites passing; 3,500 cases verified)
- **Execution Command:** `npm test` in `mobile/`
- **Output:**
```
PASS tests/engine_parity.test.ts
PASS tests/fuzzy_parity.test.ts
  3,500-Iteration High-Scale Parity Suite
    √ Evaluates all 3,500 random cases with 100% equivalence to Python (35 ms)
PASS tests/i18n.test.ts

Test Suites: 3 passed, 3 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        5.17 s
Ran all test suites.
```
- **Cross-Engine Parity Evidence:** `scripts/verify_engine_parity.py` generated 3,500 randomized fact evaluations across all 7 schemes with varying missing fields and boundary conditions. Results: **3,500 / 3,500 matching cases (0 mismatches, 100.0% parity)** between Python Kleene engine and TypeScript offline mobile engine.

---

## 2. Benchmark Evaluation Metrics (`docs/evaluation_results.json`)

| Benchmark Category | Measured Metric | Real Result | Evaluation Ground-Truth Reference |
|---|---|---|---|
| **Intent Classification** | Scheme Recognition Accuracy | **100.0%** | 12 test queries in EN & TE |
| | Topic Classification Accuracy | **100.0%** (improved from 91.67%) | 12 test queries in EN & TE |
| | Decision Latency (p50) | **0.165 ms** | Pure regex & rule dispatch |
| **Semantic Retrieval** | Precision@1 | **100.0%** (improved from 90.0%) | 10 keyword queries without scheme names |
| | Recall@3 | **100.0%** | 10 keyword queries without scheme names |
| | Mean Reciprocal Rank (MRR) | **1.000** (improved from 0.9333) | 10 keyword queries without scheme names |
| | Retrieval Latency (p50) | **1.273 ms** | Sublinear TF-IDF char n-grams |
| **Out-of-Scope Detection**| Refusal Precision | **100.0%** | 8 out-of-scope non-scheme queries |
| | Refusal Recall | **100.0%** (improved from 75.0%) | 8 out-of-scope queries |
| **Eligibility Rule Engine**| Accuracy (Overall) | **100.0%** | 24 boundary and complex cases in eval_set.json |
| | Eligible Class F1 | **1.000** | 11 cases |
| | Not Eligible Class F1 | **1.000** | 9 cases |
| | Cannot Determine Class F1 | **1.000** | 4 cases |
| | Engine Latency (p50) | **0.006 ms** | Three-valued Kleene evaluator |

---

## 3. Real Endpoint Latency Benchmarks (p50 / p95)

| Endpoint | Method | p50 Latency (ms) | p95 Latency (ms) |
|---|---|---|---|
| `/api/health` | GET | 3.901 ms | 27.092 ms |
| `/api/schemes` | GET | 3.855 ms | 4.974 ms |
| `/api/schemes/{id}` | GET | 3.532 ms | 5.163 ms |
| `/api/schemes/{id}/documents` | GET | 3.541 ms | 4.755 ms |
| `/api/eligibility/{id}/questions` | GET | 3.611 ms | 4.419 ms |
| `/api/eligibility/check` | POST | 3.458 ms | 4.653 ms |
| `/api/chat` | POST | 3.611 ms | 5.095 ms |
| `/api/voice/transcribe` | POST | 3.566 ms | 4.345 ms |
| `/api/voice/tts` | POST | 3.470 ms | 4.385 ms |

---

## 4. Hardware and Physical Device Status
- **Physical Phone Voice Latency on 4G:** Marked **Not measured** (Requires physical Android test device and live 4G SIM as noted in `BLOCKERS.md`).
- **Human Usability & Dialect WER:** Marked **Pending human evaluation** (Human review protocol detailed in `docs/academic/`).
