import json
import logging
import time

from app.config import settings
from app.models import Application
from app.schemas import AIAnalysis

logger = logging.getLogger(__name__)

DOCUMENT_LABELS = {
    "en": {
        "identity_proof": "Identity proof",
        "land_proof": "Land record proof",
        "bank_proof": "Bank proof",
    },
    "te": {
        "identity_proof": "గుర్తింపు పత్రం",
        "land_proof": "భూమి రుజువు పత్రం",
        "bank_proof": "బ్యాంక్ రుజువు పత్రం",
    },
}


def _language(language: str) -> str:
    return "te" if language == "te" else "en"


def check_required_documents(application: Application, language: str = "te") -> tuple[list[str], list[str]]:
    """Return missing document labels and fields whose status is unknown."""
    language = _language(language)
    documents = application.documents or {}
    labels = DOCUMENT_LABELS[language]
    missing: list[str] = []
    unknown: list[str] = []
    for key, label in labels.items():
        if key not in documents or documents[key] is None:
            unknown.append(
                f"{label} status has not been recorded."
                if language == "en" else f"{label} స్థితి నమోదు కాలేదు."
            )
        elif documents[key] is False:
            missing.append(label)
    return missing, unknown


def compare_land_records(application: Application, language: str = "te") -> tuple[list[str], list[str]]:
    """Compare known land extents without treating unavailable data as a mismatch."""
    language = _language(language)
    issues: list[str] = []
    uncertainties: list[str] = []
    submitted = application.application_land_extent
    verified = application.verified_land_extent

    if submitted is None or verified is None:
        uncertainties.append(
            "Land extent verification is unavailable."
            if language == "en" else "భూమి విస్తీర్ణానికి సంబంధించిన ధృవీకరణ అందుబాటులో లేదు."
        )
    elif abs(float(submitted) - float(verified)) > 0.0001:
        if language == "en":
            issues.append(
                f"The application lists {submitted:g} land units, while the verified record lists "
                f"{verified:g}. An officer should inspect the source records."
            )
        else:
            issues.append(
                f"దరఖాస్తులో భూమి విస్తీర్ణం {submitted:g} యూనిట్లు; "
                f"ధృవీకరించిన వివరాల్లో {verified:g} యూనిట్లు ఉన్నాయి. "
                "అధికారి అసలు రికార్డులను పరిశీలించాలి."
            )
    return issues, uncertainties


def inspect_application(application: Application, language: str = "te") -> dict:
    language = _language(language)
    missing, document_unknown = check_required_documents(application, language)
    issues, land_uncertainties = compare_land_records(application, language)
    uncertainties = document_unknown + land_uncertainties

    if missing:
        suggested_action = "RETURN_FOR_CORRECTION"
        reasons = [
            "One or more items on the demo document checklist are marked missing."
            if language == "en" else "నమూనా పత్రాల తనిఖీలో అవసరమైన పత్రం అందుబాటులో లేదని గుర్తించబడింది."
        ]
    elif issues:
        suggested_action = "RETURN_FOR_CORRECTION"
        reasons = [
            "The records disagree; verify the source records before making a decision."
            if language == "en" else "రికార్డుల మధ్య వ్యత్యాసం ఉంది; నిర్ణయానికి ముందు ధృవీకరణ అవసరం."
        ]
    elif uncertainties:
        suggested_action = "RETURN_FOR_CORRECTION"
        reasons = [
            "Some information has not been verified and needs review."
            if language == "en" else "కొన్ని వివరాల ధృవీకరణ అందుబాటులో లేదు."
        ]
    else:
        suggested_action = "APPROVE"
        reasons = [
            "The demo checks found no missing checklist items or known mismatches. The officer must still verify applicable requirements."
            if language == "en" else "నమూనా తనిఖీల్లో లోపించిన పత్రాలు లేదా తెలిసిన వ్యత్యాసాలు గుర్తించబడలేదు."
        ]

    return {
        "missing_documents": missing,
        "inconsistencies": issues,
        "uncertainties": uncertainties,
        "suggested_action": suggested_action,
        "reasons": reasons,
    }


def _fallback(application: Application, facts: dict, elapsed_ms: int = 0, language: str = "te") -> AIAnalysis:
    language = _language(language)
    missing = facts["missing_documents"]
    issues = facts["inconsistencies"]
    uncertainties = facts["uncertainties"]

    if language == "en":
        if missing:
            summary = f"Application {application.application_id} has one or more items marked missing in the demo document checklist."
        elif issues:
            summary = f"Application {application.application_id} has conflicting land-extent values. The source records should be reviewed."
        elif uncertainties:
            summary = f"Some information for application {application.application_id} has not been verified."
        else:
            summary = f"The demo checks for application {application.application_id} are complete. The officer must verify the applicable requirements before deciding."
    else:
        if missing:
            summary = f"దరఖాస్తు {application.application_id}లో అవసరమైన పత్రాల జాబితాలో కొన్ని పత్రాలు అందుబాటులో లేవు."
        elif issues:
            summary = f"దరఖాస్తు {application.application_id}లో భూమి వివరాల మధ్య వ్యత్యాసం ఉంది. అసలు రికార్డులను పరిశీలించాలి."
        elif uncertainties:
            summary = f"దరఖాస్తు {application.application_id}లో కొన్ని వివరాల ధృవీకరణ అందుబాటులో లేదు."
        else:
            summary = f"దరఖాస్తు {application.application_id}కు సంబంధించిన నమూనా తనిఖీలు పూర్తయ్యాయి. తుది నిర్ణయానికి ముందు అధికారి పరిశీలించాలి."

    return AIAnalysis(
        summary=summary,
        missing_documents=missing,
        inconsistencies=issues,
        suggested_action=facts["suggested_action"],
        reasons=facts["reasons"],
        uncertainties=uncertainties,
        analysis_source="rule_based_fallback",
        model=None,
        latency_ms=elapsed_ms,
    )


def run_analysis(application: Application, language: str = "en") -> AIAnalysis:
    """Run deterministic tools, then use the LLM only to explain their findings."""
    language = _language(language)
    started = time.perf_counter()
    facts = inspect_application(application, language)
    api_key = (settings.openai_api_key or "").strip()

    if not api_key:
        return _fallback(application, facts, int((time.perf_counter() - started) * 1000), language)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, timeout=20.0, max_retries=1)
        input_facts = {
            "application_id": application.application_id,
            "applicant_name": application.applicant_name,
            "village": application.village,
            "application_notes": application.notes,
            **facts,
        }
        target_language = "English" if language == "en" else "Telugu"
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You explain a fictional agricultural assistance application to a government officer in {target_language}. "
                        "Return only a JSON object with keys summary and reasons. summary must be a concise string; "
                        "reasons must be a list of short strings. Use only supplied facts. Do not invent eligibility rules, "
                        "official policy, documents or verification. Do not accuse anyone of fraud. A missing or unknown item "
                        "is not proof of fraud. Do not decide the application. Preserve the deterministic suggested action; "
                        "the officer has final authority."
                    ),
                },
                {"role": "user", "content": json.dumps(input_facts, ensure_ascii=False)},
            ],
        )
        content = response.choices[0].message.content
        parsed = json.loads(content or "{}")
        summary = parsed.get("summary")
        reasons = parsed.get("reasons")
        if not isinstance(summary, str) or not summary.strip():
            raise ValueError("AI response did not include summary")
        if not isinstance(reasons, list) or not all(isinstance(item, str) for item in reasons):
            raise ValueError("AI response did not include a valid reasons list")

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return AIAnalysis(
            summary=summary,
            missing_documents=facts["missing_documents"],
            inconsistencies=facts["inconsistencies"],
            suggested_action=facts["suggested_action"],
            reasons=reasons[:6] or facts["reasons"],
            uncertainties=facts["uncertainties"],
            analysis_source="openai",
            model=settings.openai_model,
            latency_ms=elapsed_ms,
        )
    except Exception as exc:
        logger.warning("LLM analysis failed; using rule-based fallback (%s)", type(exc).__name__)
        return _fallback(application, facts, int((time.perf_counter() - started) * 1000), language)
