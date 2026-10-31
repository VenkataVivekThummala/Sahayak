"""Comprehensive test suite for the eligibility rule engine (>= 25 tests + 24 eval cases)."""
import pytest
from backend.app.eligibility.engine import check_eligibility, validate_facts, EligibilityValidationError
from backend.app.knowledge import load_eval_set

# --- 24 Evaluation Cases from eval_set.json ---

def test_eval_set_24_cases():
    eval_set = load_eval_set()
    cases = eval_set.get("eligibility_cases", [])
    assert len(cases) == 24, "Must have exactly 24 evaluation cases"

    for c in cases:
        case_id = c["case_id"]
        scheme_id = c["scheme_id"]
        facts = c["facts"]
        expected_status = c["expected_status"]
        expected_missing = c.get("expected_missing_fields", [])
        expected_warning = c.get("expected_warning")

        res = check_eligibility(scheme_id, facts, lang="en")
        assert res["status"] == expected_status, f"{case_id} failed: expected {expected_status}, got {res['status']}"
        assert res["missing_fields"] == expected_missing, f"{case_id} missing_fields mismatch: expected {expected_missing}, got {res['missing_fields']}"

        if expected_warning is True:
            assert len(res["warnings"]) > 0, f"{case_id} expected warning, got none"
        elif expected_warning is False:
            assert len(res["warnings"]) == 0, f"{case_id} expected no warning, got {res['warnings']}"

# --- Additional Boundary & Logic Unit Tests (>= 25 total) ---

def test_pm_kisan_eligible():
    facts = {"owns_cultivable_land": True, "is_institutional_landholder": False, "holds_constitutional_post": False, "is_income_tax_payer": False}
    res = check_eligibility("pm-kisan", facts)
    assert res["status"] == "eligible"
    assert len(res["reasons"]) == 4

def test_pm_kisan_not_eligible_institutional():
    facts = {"owns_cultivable_land": True, "is_institutional_landholder": True, "holds_constitutional_post": False, "is_income_tax_payer": False}
    res = check_eligibility("pm-kisan", facts)
    assert res["status"] == "not_eligible"
    assert any(r["field"] == "is_institutional_landholder" and r["result"] == "failed" for r in res["reasons"])

def test_pm_kisan_not_eligible_constitutional():
    facts = {"owns_cultivable_land": True, "is_institutional_landholder": False, "holds_constitutional_post": True, "is_income_tax_payer": False}
    res = check_eligibility("pm-kisan", facts)
    assert res["status"] == "not_eligible"

def test_pm_kisan_cannot_determine_multiple_missing():
    facts = {"owns_cultivable_land": True}
    res = check_eligibility("pm-kisan", facts)
    assert res["status"] == "cannot_determine"
    assert len(res["missing_fields"]) == 3
    assert res["missing_fields"][0] == "is_institutional_landholder"

def test_ignoaps_boundary_age_60():
    res = check_eligibility("ignoaps", {"age": 60, "is_bpl": True})
    assert res["status"] == "eligible"

def test_ignoaps_boundary_age_59():
    res = check_eligibility("ignoaps", {"age": 59, "is_bpl": True})
    assert res["status"] == "not_eligible"

def test_ignoaps_failed_rule_beats_unknown():
    # Age 58 (failed) with missing is_bpl -> status must be not_eligible, NOT cannot_determine
    res = check_eligibility("ignoaps", {"age": 58})
    assert res["status"] == "not_eligible"
    assert any(r["field"] == "age" and r["result"] == "failed" for r in res["reasons"])

def test_ntr_bharosa_warning_60_to_64():
    for age in [60, 61, 62, 63, 64]:
        res = check_eligibility("ntr-bharosa-oap", {"ap_resident": True, "age": age, "is_bpl": True})
        assert res["status"] == "eligible"
        assert len(res["warnings"]) == 1, f"Age {age} must produce advisory warning"

def test_ntr_bharosa_no_warning_65_plus():
    for age in [65, 70, 80]:
        res = check_eligibility("ntr-bharosa-oap", {"ap_resident": True, "age": age, "is_bpl": True})
        assert res["status"] == "eligible"
        assert len(res["warnings"]) == 0, f"Age {age} should not produce warning"

def test_ntr_bharosa_non_ap_resident():
    res = check_eligibility("ntr-bharosa-oap", {"ap_resident": False, "age": 65, "is_bpl": True})
    assert res["status"] == "not_eligible"
    assert any(r["field"] == "ap_resident" and r["result"] == "failed" for r in res["reasons"])

def test_pm_jay_age_70_route():
    # Senior citizen 70+ does not need list question
    res = check_eligibility("pm-jay", {"age": 70})
    assert res["status"] == "eligible"
    assert len(res["missing_fields"]) == 0

def test_pm_jay_list_route_eligible():
    res = check_eligibility("pm-jay", {"age": 40, "in_secc_deprivation_list": True})
    assert res["status"] == "eligible"

def test_pm_jay_list_route_not_eligible():
    res = check_eligibility("pm-jay", {"age": 40, "in_secc_deprivation_list": False})
    assert res["status"] == "not_eligible"

def test_pm_jay_list_route_cannot_determine():
    res = check_eligibility("pm-jay", {"age": 40})
    assert res["status"] == "cannot_determine"
    assert res["missing_fields"] == ["in_secc_deprivation_list"]

def test_pmay_g_never_eligible_without_list():
    res = check_eligibility("pmay-g", {"has_pucca_house": False})
    assert res["status"] == "cannot_determine"
    assert "in_pmayg_beneficiary_list" in res["missing_fields"]

def test_pmay_g_pucca_house_fails():
    res = check_eligibility("pmay-g", {"has_pucca_house": True})
    assert res["status"] == "not_eligible"

def test_ssy_boundary_age_10():
    res = check_eligibility("ssy", {"is_girl_child": True, "girl_child_age": 10})
    assert res["status"] == "eligible"

def test_ssy_boundary_age_11():
    res = check_eligibility("ssy", {"is_girl_child": True, "girl_child_age": 11})
    assert res["status"] == "not_eligible"

def test_ssy_not_girl_child():
    res = check_eligibility("ssy", {"is_girl_child": False, "girl_child_age": 5})
    assert res["status"] == "not_eligible"

def test_post_matric_sc_boundary_income_250000():
    res = check_eligibility("post-matric-sc", {"is_sc_category": True, "is_enrolled_post_matric": True, "annual_income": 250000})
    assert res["status"] == "eligible"

def test_post_matric_sc_boundary_income_250001():
    res = check_eligibility("post-matric-sc", {"is_sc_category": True, "is_enrolled_post_matric": True, "annual_income": 250001})
    assert res["status"] == "not_eligible"

def test_post_matric_sc_not_sc():
    res = check_eligibility("post-matric-sc", {"is_sc_category": False, "is_enrolled_post_matric": True, "annual_income": 100000})
    assert res["status"] == "not_eligible"

def test_telugu_labels():
    res = check_eligibility("ignoaps", {"age": 65, "is_bpl": True}, lang="te")
    assert res["status"] == "eligible"
    assert any("వయస్సు" in r["label"] for r in res["reasons"])
    assert any("BPL" in r["label"] for r in res["reasons"])

def test_validation_drops_unknown_keys():
    facts = {"age": 65, "is_bpl": True, "unknown_field_xyz": 12345}
    validated = validate_facts(facts)
    assert "unknown_field_xyz" not in validated
    assert validated["age"] == 65

def test_validation_rejects_bool_for_number():
    with pytest.raises(EligibilityValidationError):
        validate_facts({"age": True})

def test_validation_rejects_out_of_range_number():
    with pytest.raises(EligibilityValidationError):
        validate_facts({"age": 150})  # max is 120

def test_validation_rejects_wrong_type_for_bool():
    with pytest.raises(EligibilityValidationError):
        validate_facts({"is_bpl": "yes"})  # must be strict boolean
