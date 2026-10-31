"""Test suite for Phase 6 backend features (Export/ETag, Helpdesk, Staff JWT, Devices, Retention)."""
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from backend.app.main import create_app
from backend.app.db.database import SessionLocal
from backend.app.db.models import HelpRequest, StaffUser
from backend.app.auth.security import hash_password
from backend.app.jobs.retention import run_data_retention_job

@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)

def test_export_and_etag(client):
    # Initial export
    resp = client.get("/api/export")
    assert resp.status_code == 200
    etag = resp.headers.get("etag")
    assert etag is not None
    data = resp.json()
    assert "dataset_version" in data
    assert len(data["schemes"]) == 14
    assert len(data["fields"]) > 0

    # Test 304 with If-None-Match
    resp_304 = client.get("/api/export", headers={"If-None-Match": etag})
    assert resp_304.status_code == 304

def test_meta_version(client):
    resp = client.get("/api/meta/version")
    assert resp.status_code == 200
    data = resp.json()
    assert "dataset_version" in data
    assert "updated_at" in data

def test_service_centers_graceful_missing_key(client):
    # Without Places API key configured, must return clear error and empty list
    resp = client.get("/api/service-centers?lat=16.506&lng=80.648&scheme_id=pm-kisan")
    assert resp.status_code == 200
    data = resp.json()
    assert "attribution" in data
    assert "error" in data or "centers" in data

def test_help_request_creation_and_status(client):
    # 1. Consent false must be rejected with 422
    bad_payload = {
        "question": "Need clarification on land document",
        "consent": False
    }
    r_bad = client.post("/api/help-requests", json=bad_payload)
    assert r_bad.status_code == 422

    # 2. Invalid phone must be rejected with 422
    bad_phone_payload = {
        "question": "Need clarification on land document",
        "contact_phone": "12345",  # invalid
        "consent": True
    }
    r_phone = client.post("/api/help-requests", json=bad_phone_payload)
    assert r_phone.status_code == 422

    # 3. Valid creation with 10-digit mobile
    valid_payload = {
        "scheme_id": "pm-kisan",
        "question": "How to upload land document for verification?",
        "language": "te",
        "contact_phone": "9876543210",
        "consent": True
    }
    resp = client.post("/api/help-requests", json=valid_payload)
    assert resp.status_code == 200
    data = resp.json()
    req_id = data["request_id"]
    token = data["status_token"]
    assert req_id.startswith("REQ-")
    assert data["status"] == "open"

    # 4. Check status without login using status_token
    status_resp = client.get(f"/api/help-requests/{req_id}?token={token}")
    assert status_resp.status_code == 200
    st_data = status_resp.json()
    assert st_data["status"] == "open"
    assert st_data["response"] is None

def test_staff_auth_and_request_management(client):
    # 1. Seed or verify admin login
    db = SessionLocal()
    admin = db.query(StaffUser).filter(StaffUser.username == "admin").first()
    if not admin:
        admin = StaffUser(
            username="admin",
            password_hash=hash_password("SahayakAdmin@2026"),
            full_name="Admin",
            role="admin"
        )
        db.add(admin)
        db.commit()
    db.close()

    # Login
    login_resp = client.post("/api/staff/login", json={"username": "admin", "password": "SahayakAdmin@2026"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Admin creates a new agent user
    create_agent_resp = client.post(
        "/api/staff/users",
        headers=headers,
        json={"username": "agent_sita", "password": "AgentPassword@123", "full_name": "Sita Kumari", "role": "agent"}
    )
    assert create_agent_resp.status_code in [200, 400]  # 400 if already created

    # 3. List help requests with filters
    list_resp = client.get("/api/staff/help-requests?status=open", headers=headers)
    assert list_resp.status_code == 200
    req_list = list_resp.json()["requests"]
    assert isinstance(req_list, list)

    if req_list:
        target_id = req_list[0]["request_id"]
        # 4. Update request (assign and respond)
        patch_resp = client.patch(
            f"/api/staff/help-requests/{target_id}",
            headers=headers,
            json={"status": "assigned", "assigned_to": "agent_sita", "response": "Your application was reviewed."}
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == "assigned"

def test_device_registration(client):
    resp = client.post("/api/devices", json={"fcm_token": "test-fcm-token-12345", "language": "te"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "registered"

def test_data_retention_job():
    db = SessionLocal()
    # Create an old closed request
    old_time = datetime.now(timezone.utc) - timedelta(days=100)
    old_closed = HelpRequest(
        request_id="REQ-OLDCLOSED",
        question="Old question",
        language="en",
        consent=True,
        status="closed",
        status_token="oldtoken",
        updated_at=old_time
    )
    # Create a fresh closed request
    fresh_closed = HelpRequest(
        request_id="REQ-FRESHCLOSED",
        question="Recent question",
        language="en",
        consent=True,
        status="closed",
        status_token="freshtoken",
        updated_at=datetime.now(timezone.utc)
    )
    db.add(old_closed)
    db.add(fresh_closed)
    db.commit()

    # Run retention job for 90 days
    deleted = run_data_retention_job(db=db, days=90)
    assert deleted >= 1

    # Check that old closed is deleted, but fresh closed remains
    rem_old = db.query(HelpRequest).filter(HelpRequest.request_id == "REQ-OLDCLOSED").first()
    rem_fresh = db.query(HelpRequest).filter(HelpRequest.request_id == "REQ-FRESHCLOSED").first()
    assert rem_old is None
    assert rem_fresh is not None

    # Cleanup
    db.delete(rem_fresh)
    db.commit()
    db.close()
