from datetime import datetime, timezone
from types import SimpleNamespace

from app.main import serialize_application


def sample_application():
    return SimpleNamespace(
        application_id="RB-1002",
        applicant_name="లక్ష్మి",
        village="మల్లారం",
        mandal="జిన్నారం",
        district="సంగారెడ్డి",
        application_land_extent=3.0,
        verified_land_extent=3.0,
        documents={"identity_proof": True, "land_proof": True, "bank_proof": False},
        status="PENDING",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        notes="Bank proof is marked missing in the fictional document checklist.",
    )


def test_application_payload_returns_english_sample_names_and_findings():
    payload = serialize_application(sample_application(), include_notes=True, language="en")
    assert payload["applicant_name"] == "Lakshmi"
    assert payload["village"] == "Mallaram"
    assert payload["missing_documents"] == ["Bank proof"]
    assert payload["notes"].startswith("Bank proof")


def test_application_payload_returns_telugu_sample_names_and_notes():
    payload = serialize_application(sample_application(), include_notes=True, language="te")
    assert payload["applicant_name"] == "లక్ష్మి"
    assert payload["village"] == "మల్లారం"
    assert payload["missing_documents"] == ["బ్యాంక్ రుజువు పత్రం"]
    assert "బ్యాంకు" in payload["notes"]
