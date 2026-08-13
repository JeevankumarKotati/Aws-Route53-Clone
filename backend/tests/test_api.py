import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.services.seed_data import seed_database
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_route53.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True, scope="module")
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_auth_me():
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert "token" in data

def test_list_hosted_zones():
    response = client.get("/api/hosted-zones")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 3
    assert len(data["items"]) >= 3

def test_create_and_delete_hosted_zone():
    # Create
    create_payload = {
        "name": "pytest-test-domain.io",
        "comment": "Automated test zone",
        "zone_type": "PUBLIC",
        "tags": {"CreatedBy": "Pytest"}
    }
    create_resp = client.post("/api/hosted-zones", json=create_payload)
    assert create_resp.status_code == 201
    zone_data = create_resp.json()
    zone_id = zone_data["id"]
    assert zone_data["name"] == "pytest-test-domain.io."
    assert zone_data["record_count"] == 2  # Automatically generated NS and SOA

    # Verify records auto created
    records_resp = client.get(f"/api/hosted-zones/{zone_id}/records")
    assert records_resp.status_code == 200
    records = records_resp.json()["items"]
    types = [r["type"] for r in records]
    assert "NS" in types
    assert "SOA" in types

    # Add a custom A record
    record_payload = {
        "name": "web",
        "type": "A",
        "ttl": 60,
        "values": ["192.168.1.1"],
        "routing_policy": "SIMPLE"
    }
    rec_resp = client.post(f"/api/hosted-zones/{zone_id}/records", json=record_payload)
    assert rec_resp.status_code == 201
    rec_data = rec_resp.json()
    assert rec_data["name"] == "web.pytest-test-domain.io."
    assert rec_data["values"] == ["192.168.1.1"]

    # Delete the zone
    del_resp = client.delete(f"/api/hosted-zones/{zone_id}")
    assert del_resp.status_code == 200

    # Verify zone is deleted
    get_resp = client.get(f"/api/hosted-zones/{zone_id}")
    assert get_resp.status_code == 404

def test_bind_export_and_import():
    # Create a zone for BIND testing
    zone_resp = client.post("/api/hosted-zones", json={"name": "bindtest.org", "zone_type": "PUBLIC"})
    assert zone_resp.status_code == 201
    zone_id = zone_resp.json()["id"]

    bind_content = """$ORIGIN bindtest.org.
$TTL 300
@       IN  A       1.2.3.4
api     IN  A       5.6.7.8
mail    IN  MX  10  smtp.bindtest.org.
txtrec  IN  TXT     "v=spf1 ~all"
"""
    import_resp = client.post(f"/api/hosted-zones/{zone_id}/import-bind", json={"zone_content": bind_content, "overwrite_existing": True})
    assert import_resp.status_code == 200
    import_data = import_resp.json()
    assert import_data["success"] is True
    assert import_data["imported_count"] >= 4

    # Test export
    export_resp = client.get(f"/api/hosted-zones/{zone_id}/export-bind")
    assert export_resp.status_code == 200
    assert "bindtest.org" in export_resp.text
    assert "1.2.3.4" in export_resp.text

    # Clean up
    client.delete(f"/api/hosted-zones/{zone_id}")

def test_dashboard_stats():
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert "hosted_zones" in stats
    assert "records" in stats
