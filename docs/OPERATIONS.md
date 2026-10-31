# Government Sahayak - Operations & Maintenance Manual

This document details operational procedures for running, monitoring, updating, and backing up the Government Sahayak platform in staging and production environments.

---

## 1. Starting and Stopping the Service

### 1.1 Local Development
- **Backend:**
  ```bash
  uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
  ```
- **Helpdesk Web:**
  ```bash
  cd helpdesk-web && npm run dev
  ```

### 1.2 Production Containerized Stack
- **Start Stack:**
  ```bash
  cd deploy
  docker compose up -d
  ```
- **Stop Stack:**
  ```bash
  cd deploy
  docker compose down
  ```
- **View Live Logs:**
  ```bash
  docker compose logs -f --tail=100 backend
  docker compose logs -f --tail=100 helpdesk-web
  ```

---

## 2. Dataset Versioning & Freshness Updates

The authoritative data resides in `data/schemes.json` and `data/fields.json`.
To update scheme rules or information:
1. Edit `data/schemes.json` with official verified government facts.
2. Re-synchronize database:
   ```bash
   python -m backend.app.db.init_db
   ```
3. Run automated integrity and parity checks:
   ```bash
   python -m pytest backend/tests/ -v
   cd mobile && npm test
   ```
4. Mobile clients automatically detect the change on next launch via `GET /api/meta/version` and atomically refresh their local cache via `GET /api/export`. No client release is required.

---

## 3. Database Backup & Disaster Recovery

### 3.1 Creating a Backup
Execute the automated backup script:
```bash
bash deploy/backup.sh
```
Or manually run:
```bash
docker exec sahayak_postgres pg_dump -U sahayak sahayak_db | gzip > sahayak_backup_$(date +%Y%m%d).sql.gz
```

### 3.2 Restoring from Backup
```bash
gunzip < sahayak_backup_YYYYMMDD.sql.gz | docker exec -i sahayak_postgres psql -U sahayak -d sahayak_db
```

---

## 4. Secret Rotation & Security

### 4.1 Rotating JWT Secret
1. Update `JWT_SECRET` in `deploy/.env`.
2. Restart the backend:
   ```bash
   docker compose restart backend
   ```
3. Active staff sessions will expire gracefully, requiring staff to re-authenticate with their credentials. Citizen clients are entirely unaffected as citizens require no JWT login.

### 4.2 Data Retention Job
Closed citizen inquiries are automatically purged after 90 days. To trigger manually:
```bash
python -m backend.app.jobs.retention
```
