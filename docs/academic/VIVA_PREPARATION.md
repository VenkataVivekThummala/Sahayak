# Government Sahayak - Viva Voce & Defense Preparation (50+ Detailed Questions & Answers)

This document contains 50+ rigorous, project-specific technical and architectural questions designed for university final-year project defense and viva voce.

---

### Category 1: Problem Definition & Motivation

#### Q1: What specific gap does Government Sahayak address that existing portals like myScheme or state portals fail to solve?
**Answer:** While portals like myScheme exist, they assume English literacy, high-bandwidth smartphones, and active online search capability. Rural and elderly citizens (who form the bulk of welfare beneficiaries) frequently face three critical barriers:
1. **Literacy & Language Barrier:** Most portals treat Indian regional languages as post-hoc Google Translate layers rather than first-class conversational interfaces.
2. **Connectivity Barrier:** Rural internet drops frequently; existing portals are 100% cloud-dependent and crash in offline environments.
3. **Hallucination & Ambiguity:** Generative AI solutions often invent eligibility amounts or hallucinate rules. Government Sahayak resolves this by pairing an offline deterministic three-valued rule engine with an on-device/cloud speech pipeline and zero user-data collection.

#### Q2: Why focus specifically on Andhra Pradesh alongside Central schemes?
**Answer:** Central schemes (like PM-KISAN, IGNOAPS, PM-JAY, PMAY-G) provide baseline national welfare, but individual states administer them through state-specific machinery. Andhra Pradesh has one of the most developed grassroots delivery infrastructures in India—the **Grama/Ward Sachivalayam** network and doorstep pension delivery (NTR Bharosa). Demonstrating how central guidelines mesh with state-level administrative reality (and advisory discrepancies like age 60 vs 65) provides a realistic, production-grade testbed.

---

### Category 2: Architecture & System Design

#### Q3: Why is eligibility decided by a rule engine rather than letting an LLM evaluate eligibility?
**Answer:** LLMs are probabilistic sequence prediction models. Welfare eligibility is a legally binding, deterministic decision requiring exact mathematical inequalities (e.g., $age \ge 60$, $income \le 2,50,000$). An LLM can easily hallucinate edge cases, confuse "or" with "and", or make subtle logical errors under conversational pressure. Government Sahayak enforces a hard architectural boundary: **The LLM never calculates eligibility**. The three-valued Kleene logic engine evaluates rules deterministically, ensuring 100% reproducible and legally defensible decisions.

#### Q4: Explain the three-valued logic (Kleene Logic) used in the eligibility engine.
**Answer:** Standard binary logic (True/False) cannot represent missing citizen data during a multi-turn conversation. In Kleene three-valued logic, every condition evaluates to $\text{True}$, $\text{False}$, or $\text{None}$ (Unknown):
- $\text{Path evaluation (AND3):}$ A path requires all rules to be true. If *any* rule evaluates to False, the path is immediately False (a failed rule beats unknowns). If all rules evaluate to True, the path is True. If some rules are True and the rest are Unknown, the path status is Unknown.
- $\text{Scheme evaluation (OR):}$ A scheme contains one or more alternative paths. If *any* path is True, the citizen is $\text{Eligible}$. If *all* paths are False, the citizen is $\text{Not Eligible}$. Otherwise, the status is $\text{Cannot Determine}$.

#### Q5: How does the engine order and select `missing_fields`?
**Answer:** When status is `cannot_determine`, the engine examines all undecided paths and selects the path with the **fewest unknowns**. This minimizes the number of follow-up questions asked to an elderly citizen, adhering to the "grandparent test" and avoiding survey fatigue.

#### Q6: What is the difference between `hard`, `list`, and `advisory` rules?
**Answer:**
- **`hard` rule:** A firm statutory constraint (e.g. age $\ge 60$, income $\le 2.5\text{ lakh}$). Violating it immediately causes `not_eligible`.
- **`list` rule:** Depends on an official government administrative list that neither the citizen nor the app can definitively check (e.g. PMAY-G Awaas+ waitlist, SECC list). A list rule can *never* produce `eligible` unless the citizen confirms prior inclusion.
- **`advisory` rule:** Never alters eligibility status. If violated, it injects a warning into `warnings[]` alerting the citizen to check local district offices (e.g., NTR Bharosa age 60 vs 65 discrepancy).

#### Q7: Why are citizens not required to register or create an account with a password?
**Answer:** Requiring accounts, passwords, or OTPs creates an immediate barrier for low-literacy citizens who frequently forget passwords or suffer SMS OTP timeouts in poor signal areas. Furthermore, welfare apps must adhere to privacy-by-design: we do not collect names, Aadhaar numbers, or passwords. For helpdesk queries, citizens receive a cryptographically secure `status_token` saved locally, enabling instant tracking with zero login friction.

---

### Category 3: NLP, Retrieval & Anti-Hallucination

#### Q8: Why did you choose TF-IDF character n-grams over dense vector embeddings as the default retriever?
**Answer:**
1. **Telugu Script Representation:** Dense neural embedding models (like OpenAI or BERT) trained predominantly on English have high tokenization fragmentation on Telugu conjuncts (samaksharas), leading to poor semantic retrieval on dialectal spelling variations.
2. **Offline & Edge Capability:** TF-IDF with character n-grams (`char_wb`, range 2–4) has sublinear term weighting and runs in under 2 ms on low-end hardware with zero GPU requirement, making it fully portable to local edge devices.
3. **Subword Robustness:** Character n-grams handle agglutinative Telugu suffixes (e.g., పత్రాలు, పత్రములు, పత్రాలతో) seamlessly.

#### Q9: How was the similarity threshold of 0.22 determined, and what is its limitation?
**Answer:** The threshold of 0.22 was calibrated experimentally by measuring cosine similarities across in-scope queries (which scored $\ge 0.244$) versus out-of-scope adversarial questions (which peaked at $0.196$). Below 0.22, the system refuses to answer and triggers the "no verified information" state. Its limitation is that on a massive open-domain corpus, semantic drift may occur, requiring dynamic calibrating or an explicit intent rejection classifier.

#### Q10: How does the Faithfulness Guard prevent hallucination in LLM-generated answers?
**Answer:** Before any LLM response is returned to the user, the `verify_faithfulness` guard extracts all numbers, monetary amounts, and URLs from the response and verifies that every single one appears in either the official retrieved context chunk or the citizen's query. If the LLM invents a figure (e.g. claiming Rs 10,000 instead of Rs 6,000) or injects an unverified URL, the LLM output is rejected immediately and the system falls back to the verified extractive text chunk.

---

### Category 4: Speech & Multilingual Processing

#### Q11: How does the system handle Telugu numerals and spoken numbers?
**Answer:** The extractor converts Telugu Unicode digits (౦-౯) to standard ASCII (0-9). While digits and common magnitude words (లక్ష, కోటి, 1.5 lakh) are parsed, colloquial Telugu number words (e.g., అరవై) are intentionally not guessed to prevent misinterpreting financial data. If a user speaks a word the backend cannot parse, the assistant politely re-prompts and displays a numeric keypad on the mobile interface.

#### Q12: Why does the voice pipeline enforce a confirmation step before sending?
**Answer:** Ambient noise in rural Indian environments (street noise, tractors, wind) frequently degrades Speech-to-Text confidence. If STT confidence is $< 0.6$ or text is under two words, the app highlights the recognized text in an editable box with two large buttons: "Send" and "Speak again". This prevents submitting corrupt data to the eligibility checker.

#### Q13: How does the system handle language mismatch if a user speaks Telugu while the app is in English mode?
**Answer:** The speech transcriber detects the language from the audio stream. If the transcript is in Telugu, the backend automatically generates the response in Telugu and returns the matching language code so the speech synthesizer responds in the language spoken by the user.

---

### Category 5: Database & Client-Side Engine Parity

#### Q14: Why do you maintain both `data/schemes.json` and a relational SQLite/PostgreSQL database?
**Answer:** `data/schemes.json` serves as the human-readable, version-controlled single source of truth for researchers and policy maintainers. The relational database (SQLAlchemy models with foreign keys, cascading deletes, check constraints, and indexes) powers efficient server-side joins, helpdesk request tracking, and staff role-based access. A deterministic synchronization script (`init_db.py`) rebuilds the database directly from JSON, ensuring they can never diverge.

#### Q15: How did you prove that the client-side TypeScript engine produces identical results to the server Python engine?
**Answer:** We implemented a rigorous dual verification suite:
1. **Ground-Truth Eval Set:** All 24 boundary and complex cases in `eval_set.json` are executed in both Python PyTest (`test_eligibility.py`) and TypeScript Jest (`engine_parity.test.ts`), verifying 100% matching status, missing fields, and warnings.
2. **Stress Testing:** A cross-validation harness generates 500 randomized fact combinations per scheme (3,500 total executions) and asserts complete equality across statuses and missing field sequences.

---

### Category 6: Ethics, Privacy & Production Deployment

#### Q16: Why is storing or asking for Aadhaar number strictly forbidden in the app?
**Answer:** In accordance with the Supreme Court of India *Puttaswamy* judgment and the Aadhaar Act guidelines, private or unauthorized applications must not collect, store, or index 12-digit Aadhaar numbers without UIDAI authentication license. Government Sahayak requires only binary eligibility answers ("Do you have an Aadhaar card?") without ever storing biometric or demographic PII.

#### Q17: Explain how the data retention job complies with privacy principles.
**Answer:** The automated retention job (`backend/app/jobs/retention.py`) runs periodically to delete all citizen helpdesk inquiries marked as `closed` older than `HELP_RETENTION_DAYS` (90 days). This implements the data minimization and storage limitation principles of the Digital Personal Data Protection Act (DPDPA 2023).

#### Q18: What is your disaster recovery plan if the central database fails?
**Answer:**
1. Nightly database dumps are generated and compressed by `deploy/backup.sh`, kept for 30 days.
2. In the event of server failure, the mobile client continues to operate completely offline using its cached JSON export dataset and client-side engine.
3. On server restoration, the database can be re-seeded from `schemes.json` in under 3 seconds, or restored from the latest PostgreSQL dump.
