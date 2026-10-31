"""Database synchronization and initialization script."""
import json
from pathlib import Path
from .database import engine, Base, SessionLocal
from .models import (
    SchemeCategory, Scheme, SchemeBenefit, EligibilityRule,
    RequiredDocument, ApplicationStep, GovernmentSource, KnownDiscrepancy, StaffUser
)
from ..knowledge import load_schemes
import bcrypt

CATEGORY_NAMES = {
    "agriculture": {"en": "Agriculture", "te": "వ్యవసాయం"},
    "pension": {"en": "Pension", "te": "పింఛను"},
    "health": {"en": "Health", "te": "ఆరోగ్యం"},
    "housing": {"en": "Housing", "te": "గృహ నిర్మాణం"},
    "women_family": {"en": "Women & Family", "te": "మహిళ మరియు కుటుంబం"},
    "education": {"en": "Education", "te": "విద్య"},
    "social_welfare": {"en": "Social Welfare & Youth", "te": "సాంఘిక సంక్షేమం మరియు యువత"},
}

def init_db(seed_admin: bool = True):
    """Recreate schema and populate from schemes.json."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already populated
        existing = db.query(Scheme).first()
        if existing:
            # Clear scheme tables to rebuild deterministically
            db.query(KnownDiscrepancy).delete()
            db.query(GovernmentSource).delete()
            db.query(ApplicationStep).delete()
            db.query(RequiredDocument).delete()
            db.query(EligibilityRule).delete()
            db.query(SchemeBenefit).delete()
            db.query(Scheme).delete()
            db.query(SchemeCategory).delete()
            db.commit()

        # Insert categories
        schemes_data = load_schemes()
        categories_found = set(s["category"] for s in schemes_data)
        for cat_id in categories_found:
            names = CATEGORY_NAMES.get(cat_id, {"en": cat_id.capitalize(), "te": cat_id})
            cat = SchemeCategory(id=cat_id, name_en=names["en"], name_te=names["te"])
            db.add(cat)
        db.commit()

        # Insert schemes and nested objects
        for s in schemes_data:
            scheme = Scheme(
                scheme_id=s["scheme_id"],
                category_id=s["category"],
                name_en=s["name_en"],
                name_te=s["name_te"],
                scope=s["scope"],
                department=s["department"],
                summary_en=s["summary_en"],
                summary_te=s["summary_te"],
                last_verified=s["last_verified"]
            )
            db.add(scheme)
            db.flush()

            # Benefits
            for idx, (b_en, b_te) in enumerate(zip(s["benefits_en"], s["benefits_te"])):
                db.add(SchemeBenefit(
                    scheme_id=s["scheme_id"],
                    benefit_order=idx + 1,
                    benefit_en=b_en,
                    benefit_te=b_te
                ))

            # Eligibility Rules
            for p_idx, path in enumerate(s["rules"].get("paths", [])):
                for r_idx, rule in enumerate(path):
                    db.add(EligibilityRule(
                        scheme_id=s["scheme_id"],
                        path_index=p_idx,
                        rule_order=r_idx + 1,
                        field=rule["field"],
                        op=rule["op"],
                        value_str=str(rule["value"]),
                        kind=rule["kind"],
                        en=rule["en"],
                        te=rule["te"]
                    ))

            # Documents
            for doc in s.get("documents", []):
                db.add(RequiredDocument(
                    scheme_id=s["scheme_id"],
                    name_en=doc["en"],
                    name_te=doc["te"],
                    required=doc["required"]
                ))

            # Steps
            for idx, step in enumerate(s.get("steps", [])):
                db.add(ApplicationStep(
                    scheme_id=s["scheme_id"],
                    step_number=idx + 1,
                    step_en=step["en"],
                    step_te=step["te"]
                ))

            # Sources
            for src in s.get("sources", []):
                db.add(GovernmentSource(
                    scheme_id=s["scheme_id"],
                    title=src["title"],
                    url=src["url"],
                    source_type=src["type"]
                ))

            # Discrepancies
            for disc in s.get("known_discrepancies", []):
                db.add(KnownDiscrepancy(
                    scheme_id=s["scheme_id"],
                    discrepancy_text=disc
                ))

        # Seed initial admin user if not present
        if seed_admin and not db.query(StaffUser).filter(StaffUser.username == "admin").first():
            hashed = bcrypt.hashpw(b"SahayakAdmin@2026", bcrypt.gensalt()).decode("utf-8")
            admin_user = StaffUser(
                username="admin",
                password_hash=hashed,
                full_name="System Administrator",
                role="admin"
            )
            db.add(admin_user)

        db.commit()
        print(f"Database successfully synchronized with {len(schemes_data)} schemes.")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
