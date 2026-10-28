from types import SimpleNamespace

from app.services.analysis import (
    check_required_documents,
    compare_land_records,
    inspect_application,
    _fallback,
)


def fake_application(documents=None, submitted=4.0, verified=4.0, application_id="TEST-1"):
    return SimpleNamespace(
        application_id=application_id,
        applicant_name="నమూనా రైతు",
        village="నమూనా గ్రామం",
        notes="fictional test data",
        documents=documents if documents is not None else {
            "identity_proof": True,
            "land_proof": True,
            "bank_proof": True,
        },
        application_land_extent=submitted,
        verified_land_extent=verified,
    )


def test_complete_checklist_has_no_missing_or_unknown_documents():
    app = fake_application()
    missing, unknown = check_required_documents(app)
    assert missing == []
    assert unknown == []


def test_missing_bank_proof_is_flagged():
    app = fake_application({
        "identity_proof": True,
        "land_proof": True,
        "bank_proof": False,
    })
    missing, _ = check_required_documents(app)
    assert "బ్యాంక్ రుజువు పత్రం" in missing


def test_absent_document_status_is_unknown_not_missing():
    app = fake_application({"identity_proof": True})
    missing, unknown = check_required_documents(app)
    assert missing == []
    assert len(unknown) == 2


def test_different_land_values_create_inconsistency():
    app = fake_application(submitted=5.0, verified=4.0)
    issues, uncertainties = compare_land_records(app)
    assert len(issues) == 1
    assert uncertainties == []


def test_missing_verification_is_uncertain_not_mismatch():
    app = fake_application(submitted=4.0, verified=None)
    issues, uncertainties = compare_land_records(app)
    assert issues == []
    assert len(uncertainties) == 1


def test_deterministic_recommendation_is_return_for_missing_document():
    app = fake_application({
        "identity_proof": True,
        "land_proof": True,
        "bank_proof": False,
    })
    analysis = inspect_application(app)
    assert analysis["suggested_action"] == "RETURN_FOR_CORRECTION"


def test_rule_based_fallback_has_source_and_preserves_findings():
    app = fake_application({
        "identity_proof": True,
        "land_proof": True,
        "bank_proof": False,
    })
    facts = inspect_application(app)
    output = _fallback(app, facts, 4)
    assert output.analysis_source == "rule_based_fallback"
    assert output.suggested_action == "RETURN_FOR_CORRECTION"
    assert output.missing_documents == facts["missing_documents"]


def test_english_language_outputs_english_missing_document_label():
    app = fake_application({
        "identity_proof": True,
        "land_proof": True,
        "bank_proof": False,
    })
    missing, _ = check_required_documents(app, language="en")
    assert missing == ["Bank proof"]


def test_english_fallback_summary_uses_english():
    app = fake_application({
        "identity_proof": True,
        "land_proof": True,
        "bank_proof": False,
    })
    facts = inspect_application(app, language="en")
    output = _fallback(app, facts, 1, language="en")
    assert "Application TEST-1" in output.summary
    assert output.missing_documents == ["Bank proof"]
