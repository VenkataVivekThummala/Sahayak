#!/bin/bash
# Automated Daily Backup Script for Government Sahayak PostgreSQL Database
set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sahayak}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="sahayak_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL database backup..."
docker exec sahayak_postgres pg_dump -U "${POSTGRES_USER:-sahayak}" "${POSTGRES_DB:-sahayak_db}" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup completed successfully: ${BACKUP_DIR}/${FILENAME}"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "sahayak_db_*.sql.gz" -mtime +30 -exec rm {} \;
echo "[$(date)] Cleaned up backups older than 30 days."
