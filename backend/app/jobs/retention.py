"""Data retention cleanup job for citizen helpdesk inquiries."""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from ..config import HELP_RETENTION_DAYS
from ..db.database import SessionLocal
from ..db.models import HelpRequest

def run_data_retention_job(db: Session = None, days: int = HELP_RETENTION_DAYS) -> int:
    """
    Purge closed help requests and associated contact numbers older than specified retention days.
    Returns count of purged records.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        deleted_count = db.query(HelpRequest).filter(
            HelpRequest.status == "closed",
            HelpRequest.updated_at < cutoff
        ).delete()
        db.commit()
        return deleted_count
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    count = run_data_retention_job()
    print(f"Data retention job completed. Deleted {count} expired closed help requests.")
