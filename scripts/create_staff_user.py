"""
CLI Tool to securely create or update production staff credentials in sahayak.db.
Usage:
    python scripts/create_staff_user.py --username <username> --password <password> --name <full_name> --role <admin|agent>
Or run interactively:
    python scripts/create_staff_user.py
"""
import sys
import getpass
import argparse
import datetime
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import bcrypt
from backend.app.db.database import SessionLocal
from backend.app.db.models import StaffUser

def create_or_update_staff(username: str, password: str, full_name: str, role: str):
    if role not in ["admin", "agent"]:
        print(f"Error: Role must be 'admin' or 'agent'. Received '{role}'.")
        sys.exit(1)

    if len(password) < 8:
        print("Warning: For production security, passwords should be at least 8 characters.")

    db = SessionLocal()
    try:
        # Hash with bcrypt work factor 12
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
        now = datetime.datetime.now(datetime.timezone.utc)

        existing = db.query(StaffUser).filter(StaffUser.username == username).first()
        if existing:
            existing.password_hash = hashed
            existing.full_name = full_name
            existing.role = role
            existing.is_active = True
            db.commit()
            print(f"[OK] Successfully updated existing staff user: '{username}' (Role: {role})")
        else:
            new_user = StaffUser(
                username=username,
                password_hash=hashed,
                full_name=full_name,
                role=role,
                is_active=True,
                created_at=now
            )
            db.add(new_user)
            db.commit()
            print(f"[OK] Successfully created new production staff user: '{username}' (Role: {role})")
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
        sys.exit(1)
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Create or update Government Sahayak staff credentials.")
    parser.add_argument("--username", help="Unique staff username (e.g. employee ID or email)")
    parser.add_argument("--password", help="Secure password")
    parser.add_argument("--name", help="Full name of staff member")
    parser.add_argument("--role", choices=["admin", "agent"], default="agent", help="Staff role: admin or agent")

    args = parser.parse_args()

    if args.username and args.password:
        name = args.name or args.username.capitalize()
        create_or_update_staff(args.username, args.password, name, args.role)
    else:
        print("=== Government Sahayak Staff Credential Provisioning ===")
        username = input("Enter Username: ").strip()
        if not username:
            print("Username cannot be empty.")
            sys.exit(1)
        full_name = input("Enter Full Name: ").strip() or username.capitalize()
        role = input("Enter Role (admin/agent) [default: agent]: ").strip().lower() or "agent"
        password = getpass.getpass("Enter Password: ")
        confirm = getpass.getpass("Confirm Password: ")
        if password != confirm:
            print("Error: Passwords do not match.")
            sys.exit(1)
        create_or_update_staff(username, password, full_name, role)

if __name__ == "__main__":
    main()
