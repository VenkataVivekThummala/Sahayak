"""Dataset integrity test suite for Government Sahayak."""
import json
import pytest
from pathlib import Path
from backend.app.knowledge import load_schemes, load_fields, load_eval_set

def test_schemes_load():
    schemes = load_schemes()
    assert len(schemes) == 14
    scheme_ids = [s["scheme_id"] for s in schemes]
    expected_ids = [
        "pm-kisan", "ignoaps", "ntr-bharosa-oap", "pm-jay", "pmay-g", "ssy", "post-matric-sc",
        "talliki-vandanam", "annadata-sukhibhava", "deepam-2", "maha-shakti-free-bus",
        "aadabidda-nidhi", "yuvagalam", "vidya-deevena"
    ]
    assert set(scheme_ids) == set(expected_ids)

def test_no_employment_category():
    schemes = load_schemes()
    categories = [s["category"] for s in schemes]
    assert "employment" not in categories

def test_scheme_fields_presence():
    schemes = load_schemes()
    required_keys = [
        "scheme_id", "name_en", "name_te", "category", "scope", "department",
        "summary_en", "summary_te", "benefits_en", "benefits_te",
        "eligibility_text_en", "eligibility_text_te", "rules", "documents",
        "steps", "caveats_en", "known_discrepancies", "sources", "last_verified"
    ]
    for scheme in schemes:
        for key in required_keys:
            assert key in scheme, f"Scheme {scheme.get('scheme_id')} missing {key}"
            assert scheme[key] is not None

def test_bilingual_list_lengths():
    schemes = load_schemes()
    for scheme in schemes:
        sid = scheme["scheme_id"]
        assert len(scheme["benefits_en"]) == len(scheme["benefits_te"]), f"{sid}: benefits en/te length mismatch"
        assert len(scheme["eligibility_text_en"]) == len(scheme["eligibility_text_te"]), f"{sid}: eligibility en/te mismatch"
        assert len(scheme["benefits_en"]) > 0
        assert len(scheme["eligibility_text_en"]) > 0

def test_sources_integrity():
    schemes = load_schemes()
    valid_types = {"official", "government-portal", "secondary"}
    for scheme in schemes:
        sid = scheme["scheme_id"]
        sources = scheme["sources"]
        assert len(sources) > 0, f"{sid} has no sources"
        has_official = any(s["type"] in {"official", "government-portal"} for s in sources)
        assert has_official, f"{sid} lacks official or government-portal source"
        for s in sources:
            assert s["type"] in valid_types, f"Invalid source type {s['type']} in {sid}"
            assert s["url"].startswith("https://"), f"Source URL must be https in {sid}: {s['url']}"
            assert s["title"], f"Missing source title in {sid}"

def test_rules_fields_in_fields_json():
    schemes = load_schemes()
    fields = load_fields()
    valid_ops = {"is", "gte", "lte", "gt", "lt"}
    valid_kinds = {"hard", "list", "advisory"}

    for scheme in schemes:
        sid = scheme["scheme_id"]
        rules_obj = scheme["rules"]
        assert "paths" in rules_obj, f"{sid} missing rules.paths"
        assert len(rules_obj["paths"]) > 0
        for path_idx, path in enumerate(rules_obj["paths"]):
            assert len(path) > 0, f"{sid} path {path_idx} is empty"
            for rule in path:
                field = rule["field"]
                assert field in fields, f"Field '{field}' in {sid} rule is not in fields.json"
                assert rule["op"] in valid_ops, f"Invalid op '{rule['op']}' in {sid}"
                assert rule["kind"] in valid_kinds, f"Invalid kind '{rule['kind']}' in {sid}"
                assert rule["en"], f"Rule missing 'en' in {sid}"
                assert rule["te"], f"Rule missing 'te' in {sid}"

def test_documents_structure():
    schemes = load_schemes()
    for scheme in schemes:
        sid = scheme["scheme_id"]
        for doc in scheme["documents"]:
            assert "en" in doc and doc["en"], f"Doc missing en in {sid}"
            assert "te" in doc and doc["te"], f"Doc missing te in {sid}"
            assert "required" in doc, f"Doc missing required in {sid}"
            assert doc["required"] in [True, False, None], f"Doc required must be bool or null in {sid}"

def test_steps_structure():
    schemes = load_schemes()
    for scheme in schemes:
        sid = scheme["scheme_id"]
        assert len(scheme["steps"]) > 0, f"{sid} has no steps"
        for step in scheme["steps"]:
            assert "en" in step and step["en"], f"Step missing en in {sid}"
            assert "te" in step and step["te"], f"Step missing te in {sid}"

def test_fields_json_bilingual():
    fields = load_fields()
    for fname, fdef in fields.items():
        assert "type" in fdef, f"Field {fname} missing type"
        assert fdef["type"] in ["bool", "number"], f"Field {fname} invalid type"
        assert "en" in fdef and fdef["en"], f"Field {fname} missing en question"
        assert "te" in fdef and fdef["te"], f"Field {fname} missing te question"
        if fdef["type"] == "number":
            assert "min" in fdef, f"Number field {fname} missing min"
            assert "max" in fdef, f"Number field {fname} missing max"
            assert fdef["min"] <= fdef["max"]

def test_eval_set_structure():
    eval_set = load_eval_set()
    assert "intent_questions" in eval_set
    assert "retrieval_questions" in eval_set
    assert "out_of_scope_questions" in eval_set
    assert len(eval_set["out_of_scope_questions"]) >= 8
    assert "eligibility_cases" in eval_set
    assert len(eval_set["eligibility_cases"]) == 24
