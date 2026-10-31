"""Deterministic eligibility rule engine implementing three-valued Kleene logic."""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from ..knowledge import load_fields, load_schemes_by_id

class EligibilityValidationError(Exception):
    """Raised when user facts fail validation."""
    def __init__(self, message_en: str, message_te: str):
        super().__init__(message_en)
        self.message_en = message_en
        self.message_te = message_te

def validate_facts(facts: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    """
    Validate user-provided facts against fields.json specifications.
    Drops unknown keys, validates types and min/max ranges.
    Raises EligibilityValidationError on violations.
    """
    fields_def = load_fields()
    validated: Dict[str, Any] = {}

    for k, v in facts.items():
        if k not in fields_def or v is None:
            continue
        f_spec = fields_def[k]
        expected_type = f_spec.get("type")

        if expected_type == "bool":
            if not isinstance(v, bool):
                raise EligibilityValidationError(
                    f"Field '{k}' must be a boolean (yes/no).",
                    f"'{k}' ఫీల్డ్ అవును లేదా కాదు (boolean) అయి ఉండాలి."
                )
            validated[k] = v
        elif expected_type == "number":
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                raise EligibilityValidationError(
                    f"Field '{k}' must be a valid number.",
                    f"'{k}' ఫీల్డ్ సరైన సంఖ్య అయి ఉండాలి."
                )
            num_val = float(v)
            min_val = f_spec.get("min", float("-inf"))
            max_val = f_spec.get("max", float("inf"))
            if num_val < min_val or num_val > max_val:
                raise EligibilityValidationError(
                    f"Field '{k}' must be between {min_val} and {max_val}.",
                    f"'{k}' ఫీల్డ్ తప్పనిసరిగా {min_val} మరియు {max_val} మధ్య ఉండాలి."
                )
            validated[k] = int(num_val) if num_val.is_integer() else num_val

    return validated

def evaluate_rule(rule: Dict[str, Any], user_val: Any) -> Optional[bool]:
    """
    Evaluate a single rule against user_val.
    Returns:
      True: passed
      False: failed
      None: unknown (fact missing)
    """
    if user_val is None:
        return None

    op = rule["op"]
    target_val = rule["value"]

    if op == "is":
        return bool(user_val == target_val)
    elif op == "gte":
        return bool(user_val >= target_val)
    elif op == "lte":
        return bool(user_val <= target_val)
    elif op == "gt":
        return bool(user_val > target_val)
    elif op == "lt":
        return bool(user_val < target_val)
    return False

def check_eligibility(scheme_id: str, raw_facts: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    """
    Evaluate eligibility of a citizen for a given scheme using three-valued logic.
    Returns dictionary with:
      scheme_id: str
      status: 'eligible' | 'not_eligible' | 'cannot_determine'
      reasons: List[{field, label, kind, result: 'passed'|'failed'|'unknown', user_value}]
      warnings: List[str]
      missing_fields: List[str]
    """
    schemes = load_schemes_by_id()
    if scheme_id not in schemes:
        raise ValueError(f"Unknown scheme_id: {scheme_id}")

    scheme = schemes[scheme_id]
    facts = validate_facts(raw_facts, lang=lang)
    rules_obj = scheme.get("rules", {})
    paths = rules_obj.get("paths", [])

    path_evaluations: List[Dict[str, Any]] = []
    advisory_warnings: List[str] = []

    for path_idx, path in enumerate(paths):
        path_status = True  # Start optimistic for AND3
        eval_rules = []
        unknown_fields_in_path = []

        for rule in path:
            field = rule["field"]
            kind = rule.get("kind", "hard")
            user_val = facts.get(field)
            res = evaluate_rule(rule, user_val)

            label = rule.get(lang, rule.get("en", ""))

            rule_info = {
                "field": field,
                "label": label,
                "kind": kind,
                "result": "passed" if res is True else ("failed" if res is False else "unknown"),
                "user_value": user_val
            }

            if kind == "advisory":
                # Advisory rules never alter path status
                if res is False:
                    advisory_warnings.append(label)
                continue

            eval_rules.append(rule_info)

            if res is False:
                path_status = False
            elif res is None:
                if path_status is not False:
                    path_status = None
                unknown_fields_in_path.append(field)

        path_evaluations.append({
            "path_index": path_idx,
            "status": path_status,
            "rules": eval_rules,
            "unknown_fields": unknown_fields_in_path
        })

    # Scheme status is OR over paths
    # 1. Any path True -> eligible
    # 2. All paths False -> not_eligible
    # 3. Otherwise -> cannot_determine

    passing_paths = [p for p in path_evaluations if p["status"] is True]
    undecided_paths = [p for p in path_evaluations if p["status"] is None]

    if passing_paths:
        status = "eligible"
        best_path = passing_paths[0]
        reasons = best_path["rules"]
        missing_fields = []
    elif undecided_paths:
        status = "cannot_determine"
        # Find undecided path with fewest unknowns
        best_undecided = min(undecided_paths, key=lambda p: len(p["unknown_fields"]))
        # Collect missing fields preserving order
        missing_fields = []
        for f in best_undecided["unknown_fields"]:
            if f not in missing_fields:
                missing_fields.append(f)
        reasons = best_undecided["rules"]
    else:
        status = "not_eligible"
        missing_fields = []
        # Reasons list every failed rule across paths, de-duplicated
        seen = set()
        reasons = []
        for p in path_evaluations:
            for r in p["rules"]:
                if r["result"] == "failed":
                    key = (r["field"], r["kind"], r["label"])
                    if key not in seen:
                        seen.add(key)
                        reasons.append(r)

    # De-duplicate warnings
    unique_warnings = list(dict.fromkeys(advisory_warnings))

    return {
        "scheme_id": scheme_id,
        "status": status,
        "reasons": reasons,
        "warnings": unique_warnings,
        "missing_fields": missing_fields
    }

# Welfare monetary benefit mappings (annualized values in INR)
SCHEME_ANNUAL_BENEFITS: Dict[str, Dict[str, Any]] = {
    "pm-kisan": {"monetary_val": 6000, "kind": "direct_cash", "label_en": "Rs 6,000 / year (Direct DBT in 3 installments)", "label_te": "సంవత్సరానికి రూ. 6,000 (3 వాయిదాలలో డీబీటీ)"},
    "ignoaps": {"monetary_val": 3600, "kind": "pension", "label_en": "Rs 200 - 500 / month (Central basic pension)", "label_te": "నెలకు రూ. 200 - 500 (కేంద్ర ప్రాథమిక పింఛను)"},
    "ntr-bharosa-oap": {"monetary_val": 48000, "kind": "pension", "label_en": "Rs 4,000 / month (AP State Social Security Pension)", "label_te": "నెలకు రూ. 4,000 (ఆంధ్రప్రదేశ్ సామాజిక భద్రతా పింఛను)"},
    "pm-jay": {"monetary_val": 500000, "kind": "health_cover", "label_en": "Rs 5,00,000 cashless health insurance cover per family/year", "label_te": "కుటుంబానికి సంవత్సరానికి రూ. 5 లక్షల ఉచిత వైద్య బీమా"},
    "pmay-g": {"monetary_val": 120000, "kind": "housing_grant", "label_en": "Rs 1,20,000 - 1,30,000 unit assistance for pucca house", "label_te": "పక్కా ఇంటి నిర్మాణానికి రూ. 1,20,000 - 1,30,000 నిధుల సహాయం"},
    "ssy": {"monetary_val": 0, "kind": "savings_interest", "label_en": "8.2% Compound Interest + Section 80C Tax Exemption", "label_te": "8.2% అత్యధిక వడ్డీ రేటు + 80C కింద పన్ను మినహాయింపు"},
    "post-matric-sc": {"monetary_val": 13500, "kind": "fee_reimbursement", "label_en": "100% Tuition Fee Reimbursement + Academic Maintenance Allowance", "label_te": "100% పూర్తి కళాశాల ఫీజు రీయింబర్స్‌మెంట్ + అకడమిక్ భత్యం"},
    "talliki-vandanam": {"monetary_val": 15000, "kind": "direct_cash", "label_en": "Rs 15,000 / year (Deposited to mother's account for school child)", "label_te": "సంవత్సరానికి రూ. 15,000 (బడి పిల్లల కోసం తల్లి ఖాతాలో జమ)"},
    "annadata-sukhibhava": {"monetary_val": 20000, "kind": "direct_cash", "label_en": "Rs 20,000 / year (Farmer investment assistance - State + PM-Kisan)", "label_te": "సంవత్సరానికి రూ. 20,000 (రైతు పెట్టుబడి సాయం - రాష్ట్రం + పీఎం కిసాన్)"},
    "deepam-2": {"monetary_val": 2600, "kind": "direct_cash", "label_en": "3 Free Domestic LPG Gas Cylinder Refills / year (100% subsidy)", "label_te": "సంవత్సరానికి 3 ఉచిత గ్యాస్ సిలిండర్ రీఫిల్‌లు (100% సబ్సిడీ)"},
    "maha-shakti-free-bus": {"monetary_val": 12000, "kind": "direct_cash", "label_en": "100% Free Travel in APSRTC Palle Velugu & Express buses for women", "label_te": "APSRTC పల్లె వెలుగు మరియు ఎక్స్‌ప్రెస్ బస్సులలో మహిళలకు పూర్తి ఉచిత ప్రయాణం"},
    "aadabidda-nidhi": {"monetary_val": 18000, "kind": "direct_cash", "label_en": "Rs 1,500 / month (Rs 18,000/yr women financial empowerment)", "label_te": "నెలకు రూ. 1,500 (సంవత్సరానికి రూ. 18,000 మహిళా భరోసా)"},
    "yuvagalam": {"monetary_val": 36000, "kind": "direct_cash", "label_en": "Rs 3,000 / month (Rs 36,000/yr educated youth allowance & training)", "label_te": "నెలకు రూ. 3,000 (సంవత్సరానికి రూ. 36,000 నిరుద్యోగ భృతి & శిక్షణ)"},
    "vidya-deevena": {"monetary_val": 50000, "kind": "fee_reimbursement", "label_en": "100% College Tuition Fee Reimbursement + Vasathi Deevena Hostel Grant", "label_te": "100% పూర్తి కళాశాల ఫీజు రీయింబర్స్‌మెంట్ + వసతి దీవెన హాస్టల్ గ్రాంట్"}
}

def evaluate_all_schemes(raw_facts: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    """
    Universal Beneficiary Portfolio Evaluator.
    Runs the Kleene 3-valued engine across all 7 welfare schemes simultaneously.
    Classifies schemes into Eligible, Conditionally Eligible, and Ineligible,
    and aggregates total annual cash and healthcare coverage benefits.
    """
    schemes = load_schemes_by_id()
    validated_facts = validate_facts(raw_facts, lang=lang)

    eligible_schemes = []
    conditionally_eligible_schemes = []
    ineligible_schemes = []

    total_annual_cash = 0
    total_health_cover = 0

    for sid, scheme in schemes.items():
        eval_res = check_eligibility(sid, validated_facts, lang=lang)
        status = eval_res["status"]
        name = scheme.get(f"name_{lang}", scheme["name_en"])
        dept = scheme["department"]
        benefit_spec = SCHEME_ANNUAL_BENEFITS.get(sid, {"monetary_val": 0, "kind": "other", "label_en": "", "label_te": ""})
        benefit_label = benefit_spec.get(f"label_{lang}", benefit_spec.get("label_en", ""))

        summary_item = {
            "scheme_id": sid,
            "name": name,
            "category": scheme["category"],
            "scope": scheme["scope"],
            "department": dept,
            "status": status,
            "benefit_label": benefit_label,
            "monetary_val": benefit_spec.get("monetary_val", 0),
            "benefit_kind": benefit_spec.get("kind", "other"),
            "reasons": eval_res["reasons"],
            "warnings": eval_res["warnings"],
            "missing_fields": eval_res["missing_fields"],
            "primary_source_url": scheme.get("sources", [{}])[0].get("url", "https://india.gov.in/")
        }

        if status == "eligible":
            eligible_schemes.append(summary_item)
            if benefit_spec["kind"] in ("direct_cash", "pension", "housing_grant", "fee_reimbursement"):
                total_annual_cash += benefit_spec["monetary_val"]
            elif benefit_spec["kind"] == "health_cover":
                total_health_cover += benefit_spec["monetary_val"]
        elif status == "cannot_determine":
            conditionally_eligible_schemes.append(summary_item)
        else:
            ineligible_schemes.append(summary_item)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input_facts": validated_facts,
        "total_schemes_evaluated": len(schemes),
        "eligible_count": len(eligible_schemes),
        "conditionally_eligible_count": len(conditionally_eligible_schemes),
        "ineligible_count": len(ineligible_schemes),
        "total_annual_cash_assistance": total_annual_cash,
        "total_healthcare_coverage": total_health_cover,
        "portfolio": {
            "eligible": eligible_schemes,
            "conditionally_eligible": conditionally_eligible_schemes,
            "ineligible": ineligible_schemes
        }
    }

