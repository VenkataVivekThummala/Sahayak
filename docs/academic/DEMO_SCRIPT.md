# Government Sahayak - Live Demonstration Scripts

This document outlines the step-by-step presentation protocols for university evaluators, viva panels, and live stakeholder demonstrations.

---

## 1. Five-Minute Executive Walkthrough

### Objective:
Demonstrate bilingual speech input, deterministic eligibility checking, and the absence of AI hallucination in 300 seconds.

| Time | Action | Spoken Prompt / Input | Expected System Output | Key Evaluation Point to Highlight |
|---|---|---|---|---|
| **0:00 - 0:45** | **Launch & Language Selection** | Launch app on emulator/device | Shows Splash (Navy + Saffron rule) -> Language Selection. Select **తెలుగు**. | Telugu is first-class, not translated. Disclaimer visible. |
| **0:45 - 1:45** | **Voice Query (Documents)** | Tap 88dp Mic button. Speak: *"పీఎం కిసాన్ పథకానికి ఏయే పత్రాలు కావాలి?"* | Live pulsing saffron ring -> Confirmation screen showing recognized text -> Tap **Send** -> Displays documents checklist with "తప్పనిసరి" tags and official source. | Real data rendered directly from official government guidelines; audio is synthesized in Telugu. |
| **1:45 - 3:00** | **Eligibility Check Dialogue** | Tap **Check Eligibility** -> Select **IGNOAPS (వృద్ధాప్య పింఛను)**. | Screen 1: "మీ వయస్సు ఎన్ని సంవత్సరాలు?" -> Enter **65**. Screen 2: "BPL కార్డు ఉందా?" -> Tap **అవును**. | Shows green Stamp card: **"అర్హులు"**, met conditions list, and official disclaimer. |
| **3:00 - 4:00** | **Anti-Hallucination Guard** | Ask adversarial question: *"నా టూవీలర్ డ్రైవింగ్ లైసెన్స్ రెన్యూవల్ ఎలా చేయాలి?"* | Threshold trigger: displays "నాకు ధృవీకరించిన సమాచారం దొరకలేదు" with buttons to View Sources or Contact Help Desk. | The system never invents or hallucinates facts outside official welfare records. |
| **4:00 - 5:00** | **Help Desk Escalation** | Tap **సహాయం కోరండి** -> Enter question and optional phone. Tap **Send**. | Request created with `REQ-XXXX` and local secret token. Switch to Helpdesk Web -> Staff logs in and answers request. | Complete end-to-end citizen to staff workflow without requiring citizen login. |

---

## 2. Ten-Minute Comprehensive Technical Walkthrough

### Additional Flows (Extends 5-min Demo):
1. **Ambiguous Query Disambiguation (5:00 - 6:30):**
   - Speak: *"Can I get an old age pension?"*
   - Expected Output: Intent classifier detects generic pension keyword and presents two distinct choice buttons: **Indira Gandhi National Old Age Pension (Central)** vs **NTR Bharosa Pension (Andhra Pradesh)**.
2. **Boundary Condition & Advisory Discrepancy (6:30 - 8:00):**
   - Check eligibility for NTR Bharosa with Age = 62, AP resident = True, BPL = True.
   - Expected Output: Eligible status with an **amber warning box**: *"Advisory verification: Some district portals cite 65 years while the state Government Order specifies 60 years. Please verify at your Grama/Ward Sachivalayam."*
3. **Airplane Mode / Offline Verification (8:00 - 9:30):**
   - Enable Airplane Mode on phone.
   - Browse schemes, inspect required documents, tick checklist boxes, and run the eligibility checker.
   - Highlight: The client-side TypeScript engine computes the exact same result offline.
4. **Fallback & Contingency Plan (9:30 - 10:00):**
   - If audio device fails: Type questions using Western or Telugu digits.
   - If backend server drops: Point out the offline yellow status banner showing locally cached data.
