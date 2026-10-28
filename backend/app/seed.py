from sqlalchemy.orm import Session

from app.models import Application

# All names and records below are fabricated for this demo.
SAMPLE_APPLICATIONS = [
    {
        "application_id": "RB-1001",
        "applicant_name": "రమేష్",
        "village": "నందిగామ",
        "mandal": "పటాన్‌చెరు",
        "district": "సంగారెడ్డి",
        "application_land_extent": 4.0,
        "verified_land_extent": 4.0,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": True},
        "notes": "All sample checklist items are marked present. No demo land mismatch is recorded.",
        "status": "PENDING",
    },
    {
        "application_id": "RB-1002",
        "applicant_name": "లక్ష్మి",
        "village": "మల్లారం",
        "mandal": "జిన్నారం",
        "district": "సంగారెడ్డి",
        "application_land_extent": 3.0,
        "verified_land_extent": 3.0,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": False},
        "notes": "Bank proof is marked missing in the fictional document checklist.",
        "status": "PENDING",
    },
    {
        "application_id": "RB-1003",
        "applicant_name": "సురేష్",
        "village": "కొత్తపల్లి",
        "mandal": "పటాన్‌చెరు",
        "district": "సంగారెడ్డి",
        "application_land_extent": 5.0,
        "verified_land_extent": 4.0,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": True},
        "notes": "Two fictional land-extent values disagree and should be verified by the officer.",
        "status": "PENDING",
    },
    {
        "application_id": "RB-1004",
        "applicant_name": "పద్మ",
        "village": "రామచంద్రాపురం",
        "mandal": "అమీన్‌పూర్",
        "district": "సంగారెడ్డి",
        "application_land_extent": 2.0,
        "verified_land_extent": None,
        "documents": {"identity_proof": True, "land_proof": False, "bank_proof": True},
        "notes": "Land verification is unavailable; this is not proof of an inconsistency.",
        "status": "PENDING",
    },
    {
        "application_id": "RB-1005",
        "applicant_name": "అనిత",
        "village": "జిన్నారం",
        "mandal": "జిన్నారం",
        "district": "సంగారెడ్డి",
        "application_land_extent": 6.0,
        "verified_land_extent": 6.0,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": True},
        "notes": "Example of a previously reviewed application.",
        "status": "APPROVED",
    },
    {
        "application_id": "RB-1006",
        "applicant_name": "మహేష్",
        "village": "ఇస్నాపూర్",
        "mandal": "పటాన్‌చెరు",
        "district": "సంగారెడ్డి",
        "application_land_extent": 1.5,
        "verified_land_extent": 1.5,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": True},
        "notes": "Example of a complete fictional record.",
        "status": "PENDING",
    },
    {
        "application_id": "RB-1007",
        "applicant_name": "కవిత",
        "village": "గుమ్మడిదల",
        "mandal": "గుమ్మడిదల",
        "district": "సంగారెడ్డి",
        "application_land_extent": 2.5,
        "verified_land_extent": 2.5,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": False},
        "notes": "The demo bank-proof flag is false.",
        "status": "RETURNED",
    },
    {
        "application_id": "RB-1008",
        "applicant_name": "నవీన్",
        "village": "పటాన్‌చెరు",
        "mandal": "పటాన్‌చెరు",
        "district": "సంగారెడ్డి",
        "application_land_extent": 3.0,
        "verified_land_extent": 3.0,
        "documents": {"identity_proof": True, "land_proof": True, "bank_proof": True},
        "notes": "Example of a completed case in the fictional demo.",
        "status": "REJECTED",
    },
]


def seed_applications(db: Session) -> None:
    """Insert any missing sample applications; safe to call on every startup."""
    existing_ids = {row[0] for row in db.query(Application.application_id).all()}
    for item in SAMPLE_APPLICATIONS:
        if item["application_id"] not in existing_ids:
            db.add(Application(**item))
    db.commit()
