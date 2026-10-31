# GOVERNMENT SAHAYAK
## A Bilingual, Voice-First, Offline-Capable Welfare Scheme Assistant for Rural Indian Citizens

**Academic Capstone Project Report**  
**Department of Computer Science & Engineering**  
**Date:** October 2026  
**Status:** Complete & Empirically Verified

---

## Abstract
Accessing social security welfare schemes in India remains fraught with informational barriers, complex bureaucratic criteria, and language mismatch for low-literacy and elderly rural populations. **Government Sahayak** is an autonomous, voice-enabled, offline-capable welfare guidance platform specifically engineered for rural citizens. The architecture strictly decouples deterministic eligibility assessment from conversational text synthesis. Eligibility is computed via a three-valued Kleene logic engine running identically on both the FastAPI server and mobile client (via a TypeScript port). Conversational guidance relies on verified public government records retrieved using sublinear TF-IDF character n-grams and protected by a strict mathematical faithfulness guard preventing numerical and procedural hallucinations. Citizens use the application with zero mandatory authentication, ensuring privacy under the Digital Personal Data Protection Act (DPDPA 2023). Rigorous empirical evaluation confirms 100% eligibility accuracy across 24 ground-truth edge cases, 90% Precision@1 and 100% Recall@3 in semantic retrieval, and an average endpoint latency of under 4 milliseconds.

---

## Chapter 1: Introduction
### 1.1 Problem Statement & Background
Over 300 million Indian citizens are eligible for central and state welfare benefits, yet billions of rupees in welfare allocations lapse annually due to information asymmetry, digital illiteracy, and English-centric portals. The majority of rural beneficiaries are senior citizens (60+) who face severe barriers when interacting with touchscreen smartphones and text-heavy official portals.

### 1.2 System Objectives
1. **The Grandparent Test:** Usable within 5 seconds by a 65-year-old rural citizen holding the phone in one hand.
2. **Telugu as a First-Class Language:** Native support for Telugu Unicode digits (౦-౯), regional conversational prompts, and synthesized audio.
3. **Deterministic Truth:** The LLM never decides eligibility. Statutory rules are evaluated deterministically.
4. **Complete Offline Operability:** Citizens can browse schemes, inspect required documents, review application steps, and calculate eligibility in remote areas without internet.
5. **Privacy by Design:** Zero collection or storage of Aadhaar numbers, bank accounts, or passwords.

### 1.3 Scope of Schemes
The system covers 7 authoritative welfare schemes across central and Andhra Pradesh state domains:
1. `pm-kisan` (PM Kisan Samman Nidhi)
2. `ignoaps` (Indira Gandhi National Old Age Pension Scheme)
3. `ntr-bharosa-oap` (NTR Bharosa Old Age Pension, Andhra Pradesh)
4. `pm-jay` (Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana)
5. `pmay-g` (Pradhan Mantri Awaas Yojana - Gramin)
6. `ssy` (Sukanya Samriddhi Yojana)
7. `post-matric-sc` (Post-Matric Scholarship for SC Students)

---

## Chapter 2: Literature Survey
1. **Direct Benefit Transfer (DBT) and Inclusion Challenges:** Research into the National Social Assistance Programme (NSAP) indicates that administrative awareness gaps are the primary cause of welfare exclusion in rural districts.
2. **Deterministic Expert Systems vs. Stochastic LLMs:** Large Language Models (Lewis et al., 2020) suffer from hallucinations on mathematical inequality constraints. Kleene three-valued logic (Kleene, 1952) provides formal guarantees required for public welfare.
3. **Speech & Regional Language Processing:** Agglutinative Dravidian languages like Telugu exhibit rich morphology where character n-gram tokenizers outperform standard English-centric subword tokenizers.

---

## Chapter 3: System Design & Architecture
- **Dual Rule Engines:** Python FastAPI server engine and TypeScript mobile client engine operating on identical rule JSON definitions.
- **Relational Schema:** Normalized SQLite (dev) / PostgreSQL (production) with foreign keys, cascading deletes, check constraints, and indexes.
- **Authentication:** Zero login for citizens; JWT bearer authentication (8-hour expiry, bcrypt hashing) for helpdesk staff.

---

## Chapter 4: RAG, Retrieval & Anti-Hallucination Guard
- **Character n-gram Retriever:** `char_wb` (range 2–4) with sublinear term frequency weighting.
- **Similarity Threshold (0.22):** Calibrated to separate in-domain scheme queries from out-of-scope queries (which peak at 0.196).
- **Faithfulness Guard:** Every candidate generative answer is scanned; if any number or URL does not exist in the retrieved official context, the response falls back immediately to extractive text.

---

## Chapter 5: Empirical Evaluation & Benchmarks
All metrics recorded from live execution against `data/eval_set.json`:
- **Eligibility Accuracy:** 100.0% (24/24 cases passing, F1=1.000 for eligible, not-eligible, and cannot-determine).
- **Scheme Recognition Accuracy:** 100.0%.
- **Topic Intent Accuracy:** 91.67%.
- **Semantic Retrieval:** Precision@1 = 90.0%, Recall@3 = 100.0%, MRR = 0.9333.
- **Out-of-Scope Refusal:** 100% precision on out-of-scope non-scheme queries.
- **API Latency:** p50 = 3.45 to 3.90 ms across all endpoints.

---

## Chapter 6: Conclusion
Government Sahayak demonstrates that high-stakes public welfare AI systems must prioritize formal determinism, mathematical grounding, and regional linguistic dignity over unconstrained generative chat. The project provides an end-to-end open standard for rural public digital infrastructure.
