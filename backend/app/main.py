from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.models import Application, Decision
from app.schemas import DecisionRequest, LoginRequest, TokenResponse
from app.security import authenticate_demo_user, create_access_token, get_current_user
from app.seed import seed_applications
from app.services.analysis import inspect_application, run_analysis


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_applications(db)
    yield


app = FastAPI(
    title="RythuSahayak API",
    description=(
        "Demo API for Telugu-first, AI-assisted review of fictional agricultural "
        "assistance applications. This is not an official government service."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = list({
    settings.frontend_origin.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "application": "RythuSahayak", "demo": True}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    if not authenticate_demo_user(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(payload.username)
    return TokenResponse(access_token=token, username=payload.username)


@app.get("/api/auth/me")
def who_am_i(user: dict = Depends(get_current_user)):
    return {"username": user["username"], "role": user["role"]}


def find_application(db: Session, application_id: str) -> Application:
    item = db.scalar(select(Application).where(Application.application_id == application_id))
    if item is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    return item


def priority_for(item: Application) -> str:
    findings = inspect_application(item)
    if findings["inconsistencies"]:
        return "HIGH"
    if findings["missing_documents"]:
        return "MEDIUM"
    if findings["uncertainties"]:
        return "REVIEW"
    return "NORMAL"


# The demo records are stored in Telugu. These English display values are
# transliterations for the fictional sample records, not translations of real user data.
SAMPLE_ENGLISH_FIELDS = {
    "RB-1001": {"applicant_name": "Ramesh", "village": "Nandigama", "mandal": "Patancheru", "district": "Sangareddy"},
    "RB-1002": {"applicant_name": "Lakshmi", "village": "Mallaram", "mandal": "Jinnaram", "district": "Sangareddy"},
    "RB-1003": {"applicant_name": "Suresh", "village": "Kothapalli", "mandal": "Patancheru", "district": "Sangareddy"},
    "RB-1004": {"applicant_name": "Padma", "village": "Ramachandrapuram", "mandal": "Ameenpur", "district": "Sangareddy"},
    "RB-1005": {"applicant_name": "Anitha", "village": "Jinnaram", "mandal": "Jinnaram", "district": "Sangareddy"},
    "RB-1006": {"applicant_name": "Mahesh", "village": "Isnapur", "mandal": "Patancheru", "district": "Sangareddy"},
    "RB-1007": {"applicant_name": "Kavitha", "village": "Gummadidala", "mandal": "Gummadidala", "district": "Sangareddy"},
    "RB-1008": {"applicant_name": "Naveen", "village": "Patancheru", "mandal": "Patancheru", "district": "Sangareddy"},
}

SAMPLE_NOTES_TE = {
    "RB-1001": "నమూనా పత్రాలన్నీ అందుబాటులో ఉన్నట్లు నమోదు చేయబడ్డాయి. నమూనా భూమి వివరాల్లో వ్యత్యాసం నమోదు కాలేదు.",
    "RB-1002": "కల్పిత పత్రాల తనిఖీ జాబితాలో బ్యాంకు రుజువు పత్రం లోపించినట్లు నమోదు చేయబడింది.",
    "RB-1003": "రెండు కల్పిత భూమి విస్తీర్ణ విలువలు వేర్వేరుగా ఉన్నాయి. అధికారి అసలు రికార్డులను పరిశీలించాలి.",
    "RB-1004": "భూమి ధృవీకరణ అందుబాటులో లేదు. దీన్ని వ్యత్యాసానికి ఆధారంగా పరిగణించకూడదు.",
    "RB-1005": "ఇది గతంలో సమీక్షించిన నమూనా దరఖాస్తు.",
    "RB-1006": "ఇది పూర్తిస్థాయి కల్పిత రికార్డు.",
    "RB-1007": "నమూనా పత్రాల తనిఖీ జాబితాలో బ్యాంకు రుజువు పత్రం లోపించినట్లు నమోదు చేయబడింది.",
    "RB-1008": "ఇది పూర్తయిన నమూనా కేసు.",
}


def serialize_application(item: Application, include_notes: bool = False, language: str = "en") -> dict:
    language = "te" if language == "te" else "en"
    findings = inspect_application(item, language=language)
    english_fields = SAMPLE_ENGLISH_FIELDS.get(item.application_id, {})

    def display_field(field: str) -> str | None:
        value = getattr(item, field)
        if language == "en":
            return english_fields.get(field, value)
        return value

    data = {
        "application_id": item.application_id,
        "applicant_name": display_field("applicant_name"),
        "village": display_field("village"),
        "mandal": display_field("mandal"),
        "district": display_field("district"),
        "application_land_extent": item.application_land_extent,
        "verified_land_extent": item.verified_land_extent,
        "documents": item.documents or {},
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        "missing_documents": findings["missing_documents"],
        "inconsistencies": findings["inconsistencies"],
        "uncertainties": findings["uncertainties"],
        "priority": priority_for(item),
    }
    if include_notes:
        data["notes"] = SAMPLE_NOTES_TE.get(item.application_id, item.notes or "") if language == "te" else (item.notes or "")
    return data


@app.get("/api/dashboard")
def dashboard(
    language: str = Query(default="en", pattern="^(en|te)$"),
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(select(Application).order_by(Application.created_at.asc())).all()
    counts = {key: 0 for key in ["PENDING", "APPROVED", "REJECTED", "RETURNED"]}
    attention = []
    for item in rows:
        counts[item.status] = counts.get(item.status, 0) + 1
        if item.status == "PENDING":
            finding = inspect_application(item, language=language)
            if finding["missing_documents"] or finding["inconsistencies"] or finding["uncertainties"]:
                attention.append(serialize_application(item, language=language))

    # Discrepancies first, then missing documents, then unknown verification.
    rank = {"HIGH": 0, "MEDIUM": 1, "REVIEW": 2, "NORMAL": 3}
    attention.sort(key=lambda row: (rank.get(row["priority"], 9), row["created_at"] or ""))
    return {
        "total": len(rows),
        "pending": counts.get("PENDING", 0),
        "approved": counts.get("APPROVED", 0),
        "rejected": counts.get("REJECTED", 0),
        "returned": counts.get("RETURNED", 0),
        "needs_attention": len(attention),
        "attention_items": attention[:6],
    }


@app.get("/api/applications")
def list_applications(
    language: str = Query(default="en", pattern="^(en|te)$"),
    status_filter: str | None = Query(default=None, alias="status", max_length=32),
    search: str | None = Query(default=None, max_length=100),
    attention_only: bool = False,
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Application)
    if status_filter:
        normalised = status_filter.upper()
        if normalised not in {"PENDING", "APPROVED", "REJECTED", "RETURNED"}:
            raise HTTPException(status_code=422, detail="Unknown status filter.")
        query = query.where(Application.status == normalised)
    if search and search.strip():
        term = f"%{search.strip()}%"
        alias_ids = [
            application_id
            for application_id, fields in SAMPLE_ENGLISH_FIELDS.items()
            if any(search.strip().lower() in value.lower() for value in fields.values())
        ]
        search_conditions = [
            Application.application_id.ilike(term),
            Application.applicant_name.ilike(term),
            Application.village.ilike(term),
            Application.mandal.ilike(term),
        ]
        if alias_ids:
            search_conditions.append(Application.application_id.in_(alias_ids))
        query = query.where(or_(*search_conditions))
    rows = db.scalars(query.order_by(Application.created_at.asc())).all()
    serialized = [serialize_application(item, language=language) for item in rows]
    if attention_only:
        serialized = [
            row for row in serialized
            if row["status"] == "PENDING" and (
                row["missing_documents"] or row["inconsistencies"] or row["uncertainties"]
            )
        ]
    return {"items": serialized, "total": len(serialized)}


@app.get("/api/applications/{application_id}")
def get_application(
    application_id: str,
    language: str = Query(default="en", pattern="^(en|te)$"),
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return serialize_application(find_application(db, application_id), include_notes=True, language=language)


@app.post("/api/applications/{application_id}/analyze")
def analyze_application(
    application_id: str,
    language: str = Query(default="en", pattern="^(en|te)$"),
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = find_application(db, application_id)
    result = run_analysis(item, language=language)
    return result.model_dump()


@app.post("/api/applications/{application_id}/decision")
def save_decision(
    application_id: str,
    payload: DecisionRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = find_application(db, application_id)
    if item.status != "PENDING":
        raise HTTPException(
            status_code=409,
            detail="Only pending applications can receive a new decision in this demo.",
        )

    action_to_status = {
        "APPROVE": "APPROVED",
        "REJECT": "REJECTED",
        "RETURN_FOR_CORRECTION": "RETURNED",
    }
    old_status = item.status
    new_status = action_to_status[payload.action]
    decision = Decision(
        application_pk=item.id,
        action=payload.action,
        from_status=old_status,
        to_status=new_status,
        reason=payload.reason.strip(),
        officer_username=user["username"],
    )

    try:
        item.status = new_status
        item.updated_at = datetime.now(timezone.utc)
        db.add(decision)
        db.commit()
        db.refresh(item)
        db.refresh(decision)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save decision.") from exc

    return {
        "application_id": item.application_id,
        "from_status": old_status,
        "status": item.status,
        "action": payload.action,
        "reason": payload.reason.strip(),
        "officer_username": user["username"],
        "created_at": decision.created_at.isoformat(),
    }


@app.get("/api/applications/{application_id}/history")
def application_history(
    application_id: str,
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = find_application(db, application_id)
    decisions = db.scalars(
        select(Decision)
        .where(Decision.application_pk == item.id)
        .order_by(Decision.created_at.desc())
    ).all()
    return {
        "items": [
            {
                "action": row.action,
                "from_status": row.from_status,
                "to_status": row.to_status,
                "reason": row.reason,
                "officer_username": row.officer_username,
                "created_at": row.created_at.isoformat(),
            }
            for row in decisions
        ]
    }
