# Government Sahayak - Privacy Architecture & Policy

**Effective Date:** 18 October 2026  
**Compliance Standard:** Digital Personal Data Protection Act (DPDPA 2023, India) & *Justice K.S. Puttaswamy (Retd.) v. Union of India* (2017)

---

## 1. Core Privacy Commitments

1. **No Sensitive Government Identifiers:**
   Government Sahayak **never** asks for, receives, or stores 12-digit Aadhaar numbers, PAN numbers, bank account numbers, passwords, biometric templates, or identity card photographs.
   When assessing eligibility, the application asks strictly binary questions (e.g. *"Do you have an Aadhaar card?"*), never collecting the underlying identifier.

2. **Zero Citizen Tracking:**
   No analytics SDKs, advertising identifiers (IDFA/GAID), social media tracking pixels, or fingerprinting scripts are bundled into the mobile or web applications.

3. **Stateless Conversational Assistant:**
   Citizen chat sessions are processed statelessly. The server stores no conversational logs or transcripts. The conversation session object is held strictly in the mobile phone's local memory and sent back by the client as needed.

4. **Speech Data Confidentiality:**
   Speech recognition runs primarily on-device whenever native offline voice models are present. Audio is sent to the cloud STT service only when on-device speech transcription is unavailable, and the audio bytes are immediately processed in-memory and never persisted to server disks.

---

## 2. On-Device Storage & Local Data Minimization

| Data Item | Storage Location | Retention Duration | User Control |
|---|---|---|---|
| User Answers / Facts | Local Encrypted MMKV | Retained locally until cleared | "Clear My Answers" in Settings |
| Chat Conversation History | Local Encrypted MMKV | 30 days (default) / Configurable: 30, 90, or Never | "Clear History" or delete individual conversation |
| Document Checklist Ticks | Local Storage | Persists across app launches | "Reset Checklist" button per scheme |
| Downloaded Scheme Cache | Local Storage | Updated atomically when dataset changes | "Clear Saved Information" in Settings |

---

## 3. Citizen Help Desk Inquiry Privacy

Citizens who choose to submit a question to the help desk provide:
- The question text (editable before submission)
- Associated welfare scheme (optional)
- Preferred language (Telugu or English)
- Explicit consent checkbox (*"You may contact me on this number"*)
- Optional 10-digit Indian mobile number

### How Help Desk Inquiries are Protected:
1. **Access Token Lookup:** Citizens access the status of their request using a cryptographically random 64-character token (`status_token`) saved on their device. No login credentials or citizen profiles are created.
2. **Phone Number Masking:** In the staff console, phone numbers are masked by default (`98******10`). Any staff member attempting to reveal the full phone number must click "Reveal", which creates an immutable audit trail log entry recording the staff username, timestamp, and request ID.
3. **Automated Data Retention & Purge:** An automated server job (`backend/app/jobs/retention.py`) permanently deletes all closed helpdesk records and associated contact numbers after 90 days.
