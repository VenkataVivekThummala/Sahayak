# Government Sahayak (గవర్నమెంట్ సహాయక్)

**A Bilingual, Voice-First, Offline-Capable Welfare Scheme Assistant for Rural Indian Citizens**

---

## Quick Start Guide

### 1. Backend Setup & Run (Python 3.12+)

#### Windows (PowerShell):
```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Initialize database from authoritative schemes.json
python -m backend.app.db.init_db

# Run automated test suite (80 tests)
python -m pytest backend/tests/ -v

# Start FastAPI server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Linux / macOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 -m backend.app.db.init_db
pytest backend/tests/ -v
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

---

### 2. Staff Helpdesk Web Application (Node.js 20+)

```bash
cd helpdesk-web
npm install
npm run build
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.  
**Default Administrator Credentials (Development):**
- **Username:** `admin`
- **Password:** `SahayakAdmin@2026`

---

### 3. Mobile Engine Parity & TypeScript Tests

```bash
cd mobile
npm install
npm run typecheck
npm test
```

---

### 4. Production Containerized Deployment (Docker & Caddy)

```bash
cd deploy
cp .env.example .env
# Edit .env with your domain name and secure passwords
docker compose up -d
```
Caddy automatically handles Let's Encrypt TLS certificates on ports 80 and 443.

---

## Architecture & Project Documentation
- [System Architecture & ER Diagram](docs/ARCHITECTURE.md)
- [REST API Specification](docs/API.md)
- [Real Test & Performance Report](docs/TEST_REPORT.md)
- [Empirical Evaluation Benchmark Results](docs/evaluation_results.json)
- [Operations & Maintenance Manual](docs/OPERATIONS.md)
- [Android Release & Signing Guide](docs/RELEASE.md)
- [Maintainer Guide: Adding Schemes](docs/ADDING_SCHEMES.md)
- [Multilingual Extension Guide](docs/ADDING_LANGUAGES.md)
- [Official Source Audit Report](docs/SOURCE_CHECK.md)
- [Privacy Policy & Data Protection](docs/PRIVACY.md)
- [Final Engineering Report](docs/FINAL_REPORT.md)
- [Academic Deliverables & Viva Prep](docs/academic/)
