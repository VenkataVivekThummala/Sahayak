# Government Sahayak - Human Evaluation Protocols & Standards

In strict accordance with Section 3, Section 21, and Section 26.6 of the Operating Protocol, where human interaction, linguistic verification, or physical acoustic evaluation is required, the procedures and metrics are documented below. All numbers are marked as **"Pending human evaluation"** until real physical trials are conducted; no numbers or user-study results have been fabricated.

---

## Protocol 1: Native Telugu Linguistic & Dialect Review

### Status: PENDING HUMAN EVALUATION

### Objective:
Verify that all Telugu translations, voice prompts, and error notifications use natural, respectful forms (మీరు, చేయండి) and render conjuncts (సంయుక్తాక్షరాలు) accurately without grammatical Anglicisms.

### Review Form Template:
- **Reviewer Qualifications:** Native Telugu speaker literate in formal and rural conversational registers.
- **Sample Selection:** 100% of strings in `mobile/src/i18n/strings.ts` and `data/schemes.json`.
- **Scoring Dimensions (1 to 5 Likert Scale):**
  1. *Politeness & Respect (మర్యాదపూర్వక భాష):* Is the tone appropriate for senior rural citizens?
  2. *Terminology Clarity (సరళమైన పదజాలం):* Are complex administrative terms (e.g., e-KYC, DBT) accompanied by clear plain-language explanations?
  3. *Typography & Rendering:* Are any descenders, matras, or conjuncts visually clipped at 200% font scale?
- **Correction Protocol:** Any flagged string must be replaced directly in `i18n/strings.ts` and committed with the reviewer's signature.

---

## Protocol 2: Five-User Low-Literacy & Elderly Usability Test

### Status: PENDING HUMAN EVALUATION

### Participant Cohort:
- 5 citizens aged 60+ or low-literacy individuals living in rural or semi-urban Andhra Pradesh/Telangana.
- Device: Low-end Android smartphone (2 GB RAM, 720p display).
- Method: Think-aloud protocol with one-hand task execution.

### Benchmark Tasks:
1. **Task 1 (Voice Ingestion):** Launch app and ask by voice: *"PM Kisan కు ఏ పత్రాలు కావాలి?"*
2. **Task 2 (Eligibility Self-Check):** Check eligibility for old age pension and interpret the green/red status stamp within 30 seconds.
3. **Task 3 (Document Checklist):** Navigate to Required Documents and mark 2 documents as ready.

### Measured Metrics:
- **Task Completion Rate (%):** Successful completion without researcher intervention.
- **Time to First Action (seconds):** Evaluates the "5-second grandparent test".
- **Error Recovery:** Ability to recover from an unparseable input.

---

## Protocol 3: 100-Utterance Spoken Dialect Word Error Rate (WER) Evaluation

### Status: PENDING HUMAN EVALUATION

### Procedure:
1. Record 50 Telugu and 50 English spoken test sentences across multiple speakers (differing age, gender, and background noise conditions: indoor quiet vs. outdoor roadside).
2. Feed audio into both the on-device recognizer and Google Cloud STT.
3. Compute Word Error Rate (WER) using Levenshtein distance:
   $$\text{WER} = \frac{S + D + I}{N}$$
   Where $S$ is substitutions, $D$ is deletions, $I$ is insertions, and $N$ is total words in the reference transcript.

### Reference Test Utterance Script (Sample of 10 of 100):
| ID | Language | Reference Text | Acoustic Condition |
|---|---|---|---|
| `UTT-01` | Telugu | పీఎం కిసాన్ పథకానికి ఏయే పత్రాలు కావాలి? | Quiet Room |
| `UTT-02` | Telugu | నాకు అరవై ఏళ్లు ఉన్నాయి పెన్షన్ వస్తుందా? | Street Traffic |
| `UTT-03` | Telugu | ఆయుష్మాన్ భారత్ కార్డు ఎక్కడ ఇస్తారు? | Moderate Wind |
| `UTT-04` | Telugu | సుకున్య సమృద్ధి ఖాతాలో ఎంత వడ్డీ ఇస్తారు? | Quiet Room |
| `UTT-05` | Telugu | ఎన్టీఆర్ భరోసా పింఛను నాలుగు వేల రూపాయలు ఇస్తారా? | Outdoor Ambient |
| `UTT-06` | English | What is the eligibility criteria for PM Kisan? | Quiet Room |
| `UTT-07` | English | Can I get an old age pension if my income is low? | Street Traffic |
| `UTT-08` | English | How to apply for Ayushman Bharat golden card? | Quiet Room |
| `UTT-09` | English | What documents are needed for Sukanya Samriddhi Yojana? | Moderate Noise |
| `UTT-10` | English | Where is the nearest Common Service Centre? | Outdoor Ambient |
