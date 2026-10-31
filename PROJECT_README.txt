======================================================================
  GOVERNMENT SAHAYAK (ప్రభుత్వ సహాయక్)
  Bilingual Autonomous Decision-Support & Welfare Scheme Navigator
======================================================================

PROJECT OVERVIEW:
Government Sahayak is an autonomous bilingual (Telugu & English) welfare
scheme intelligence and eligibility platform for Andhra Pradesh & Central
Government citizen entitlements.

KEY FEATURES:
- All 14 Official Welfare Schemes (Navaratnalu Plus & Central)
- Zero-leakage 3-Valued Kleene Deterministic Eligibility Engine
- Annualized Benefit Portfolio Calculator
- Bilingual NLP / Voice Assistant (Telugu & English)
- Official Audit-Compliant Eligibility Certificate Generator with Verification QR
- Officer Helpdesk Dashboard with real-time grievance triage

DEMO CREDENTIALS:
----------------------------------------------------------------------
1. Staff / Officer Login:
   - Administrator: username 'admin', password 'admin123'
   - Field Agent:   username 'operator', password 'operator123'

2. Citizen Login Profile:
   - Mobile: 9848012345
   - PIN:    1234
   - Profile: Ramesh Babu, BPL Farmer, Guntur District

QUICK START INSTRUCTIONS:
----------------------------------------------------------------------
Prerequisites:
- Python 3.10+ installed
- Node.js 18+ installed

Step 1: Install Python backend dependencies
   cd backend
   pip install -r requirements.txt
   cd ..

Step 2: Start Backend Server
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
   (Backend will run at http://localhost:8000 and docs at http://localhost:8000/docs)

Step 3: Start Web Frontend (in a new terminal)
   cd helpdesk-web
   npm install
   npm run dev
   (Web app will run at http://localhost:3000)

DATABASE:
Pre-populated SQLite database 'sahayak.db' is included with all 14 schemes,
demographics, and officer accounts ready to use.
======================================================================
