/**
 * Client-side Deterministic Eligibility Rule Engine in TypeScript.
 * Port of backend/app/eligibility/engine.py implementing three-valued Kleene logic.
 */

export type RuleOp = "is" | "gte" | "lte" | "gt" | "lt";
export type RuleKind = "hard" | "list" | "advisory";
export type EligibilityStatus = "eligible" | "not_eligible" | "cannot_determine";

export interface Rule {
  field: string;
  op: RuleOp;
  value: any;
  kind: RuleKind;
  en: string;
  te: string;
}

export interface RulePath {
  [index: number]: Rule;
  length: number;
}

export interface SchemeRules {
  paths: Rule[][];
}

export interface SchemeRecord {
  scheme_id: string;
  name_en: string;
  name_te: string;
  rules: SchemeRules;
  [key: string]: any;
}

export interface EvaluatedRule {
  field: string;
  label: string;
  kind: RuleKind;
  result: "passed" | "failed" | "unknown";
  user_value: any;
}

export interface EligibilityResult {
  scheme_id: string;
  status: EligibilityStatus;
  reasons: EvaluatedRule[];
  warnings: string[];
  missing_fields: string[];
  disclaimer?: string;
}

export type KleeneResult = EligibilityResult;

export function evaluateRule(rule: Rule, userVal: any): boolean | null {
  if (userVal === undefined || userVal === null) {
    return null; // Unknown
  }

  const { op, value: targetVal } = rule;
  switch (op) {
    case "is":
      return userVal === targetVal;
    case "gte":
      return userVal >= targetVal;
    case "lte":
      return userVal <= targetVal;
    case "gt":
      return userVal > targetVal;
    case "lt":
      return userVal < targetVal;
    default:
      return false;
  }
}

export function checkEligibilityOffline(
  scheme: SchemeRecord,
  facts: Record<string, any>,
  lang: "en" | "te" = "en"
): EligibilityResult {
  const paths = scheme.rules?.paths || [];
  const advisoryWarnings: string[] = [];

  interface PathEval {
    pathIndex: number;
    status: boolean | null;
    rules: EvaluatedRule[];
    unknownFields: string[];
  }

  const pathEvaluations: PathEval[] = [];

  for (let pIdx = 0; pIdx < paths.length; pIdx++) {
    const path = paths[pIdx];
    let pathStatus: boolean | null = true;
    const evalRules: EvaluatedRule[] = [];
    const unknownFields: string[] = [];

    for (let rIdx = 0; rIdx < path.length; rIdx++) {
      const rule = path[rIdx];
      const field = rule.field;
      const kind = rule.kind || "hard";
      const userVal = facts[field];
      const res = evaluateRule(rule, userVal);

      const label = lang === "te" ? rule.te : rule.en;
      const ruleInfo: EvaluatedRule = {
        field,
        label,
        kind,
        result: res === true ? "passed" : res === false ? "failed" : "unknown",
        user_value: userVal,
      };

      if (kind === "advisory") {
        if (res === false) {
          advisoryWarnings.push(label);
        }
        continue;
      }

      evalRules.push(ruleInfo);

      if (res === false) {
        pathStatus = false;
      } else if (res === null) {
        if (pathStatus !== false) {
          pathStatus = null;
        }
        unknownFields.push(field);
      }
    }

    pathEvaluations.push({
      pathIndex: pIdx,
      status: pathStatus,
      rules: evalRules,
      unknownFields,
    });
  }

  // Scheme status is OR over paths:
  // 1. Any path True -> eligible
  // 2. All paths False -> not_eligible
  // 3. Otherwise -> cannot_determine

  const passingPaths = pathEvaluations.filter((p) => p.status === true);
  const undecidedPaths = pathEvaluations.filter((p) => p.status === null);

  let status: EligibilityStatus;
  let reasons: EvaluatedRule[] = [];
  let missingFields: string[] = [];

  if (passingPaths.length > 0) {
    status = "eligible";
    reasons = passingPaths[0].rules;
    missingFields = [];
  } else if (undecidedPaths.length > 0) {
    status = "cannot_determine";
    // Undecided path with fewest unknowns
    let bestUndecided = undecidedPaths[0];
    for (const p of undecidedPaths) {
      if (p.unknownFields.length < bestUndecided.unknownFields.length) {
        bestUndecided = p;
      }
    }

    // Collect missing fields preserving order and de-duplicating
    missingFields = [];
    for (const f of bestUndecided.unknownFields) {
      if (!missingFields.includes(f)) {
        missingFields.push(f);
      }
    }
    reasons = bestUndecided.rules;
  } else {
    status = "not_eligible";
    missingFields = [];
    const seen = new Set<string>();
    reasons = [];
    for (const p of pathEvaluations) {
      for (const r of p.rules) {
        if (r.result === "failed") {
          const key = `${r.field}:${r.kind}:${r.label}`;
          if (!seen.has(key)) {
            seen.add(key);
            reasons.push(r);
          }
        }
      }
    }
  }

  // De-duplicate warnings
  const uniqueWarnings = Array.from(new Set(advisoryWarnings));

  return {
    scheme_id: scheme.scheme_id,
    status,
    reasons,
    warnings: uniqueWarnings,
    missing_fields: missingFields,
  };
}

export interface SchemePortfolioSummary {
  scheme_id: string;
  name: string;
  category: string;
  scope: string;
  status: EligibilityStatus;
  benefit_label: string;
  monetary_val: number;
  benefit_kind: string;
  reasons: EvaluatedRule[];
  warnings: string[];
  missing_fields: string[];
}

export interface UniversalPortfolioResult {
  total_schemes_evaluated: number;
  eligible_count: number;
  conditionally_eligible_count: number;
  ineligible_count: number;
  total_annual_cash_assistance: number;
  total_healthcare_coverage: number;
  portfolio: {
    eligible: SchemePortfolioSummary[];
    conditionally_eligible: SchemePortfolioSummary[];
    ineligible: SchemePortfolioSummary[];
  };
}

const SCHEME_BENEFITS: Record<string, { monetary_val: number; kind: string; label_en: string; label_te: string }> = {
  "pm-kisan": { monetary_val: 6000, kind: "direct_cash", label_en: "Rs 6,000 / year (Direct DBT in 3 installments)", label_te: "సంవత్సరానికి రూ. 6,000 (3 వాయిదాలలో డీబీటీ)" },
  "ignoaps": { monetary_val: 3600, kind: "pension", label_en: "Rs 200 - 500 / month (Central basic pension)", label_te: "నెలకు రూ. 200 - 500 (కేంద్ర ప్రాథమిక పింఛను)" },
  "ntr-bharosa-oap": { monetary_val: 48000, kind: "pension", label_en: "Rs 4,000 / month (AP State Social Security Pension)", label_te: "నెలకు రూ. 4,000 (ఆంధ్రప్రదేశ్ సామాజిక భద్రతా పింఛను)" },
  "pm-jay": { monetary_val: 500000, kind: "health_cover", label_en: "Rs 5,00,000 cashless health insurance cover per family/year", label_te: "కుటుంబానికి సంవత్సరానికి రూ. 5 లక్షల ఉచిత వైద్య బీమా" },
  "pmay-g": { monetary_val: 120000, kind: "housing_grant", label_en: "Rs 1,20,000 - 1,30,000 unit assistance for pucca house", label_te: "పక్కా ఇంటి నిర్మాణానికి రూ. 1,20,000 - 1,30,000 నిధుల సహాయం" },
  "ssy": { monetary_val: 0, kind: "savings_interest", label_en: "8.2% Compound Interest + Section 80C Tax Exemption", label_te: "8.2% అత్యధిక వడ్డీ రేటు + 80C కింద పన్ను మినహాయింపు" },
  "post-matric-sc": { monetary_val: 13500, kind: "fee_reimbursement", label_en: "100% Tuition Fee Reimbursement + Academic Maintenance Allowance", label_te: "100% పూర్తి కళాశాల ఫీజు రీయింబర్స్‌మెంట్ + అకడమిక్ భత్యం" },
  "talliki-vandanam": { monetary_val: 15000, kind: "direct_cash", label_en: "Rs 15,000 / year (Deposited to mother's account for school child)", label_te: "సంవత్సరానికి రూ. 15,000 (బడి పిల్లల కోసం తల్లి ఖాతాలో జమ)" },
  "annadata-sukhibhava": { monetary_val: 20000, kind: "direct_cash", label_en: "Rs 20,000 / year (Farmer investment assistance - State + PM-Kisan)", label_te: "సంవత్సరానికి రూ. 20,000 (రైతు పెట్టుబడి సాయం - రాష్ట్రం + పీఎం కిసాన్)" },
  "deepam-2": { monetary_val: 2600, kind: "direct_cash", label_en: "3 Free Domestic LPG Gas Cylinder Refills / year (100% subsidy)", label_te: "సంవత్సరానికి 3 ఉచిత గ్యాస్ సిలిండర్ రీఫిల్‌లు (100% సబ్సిడీ)" },
  "maha-shakti-free-bus": { monetary_val: 12000, kind: "direct_cash", label_en: "100% Free Travel in APSRTC Palle Velugu & Express buses for women", label_te: "APSRTC పల్లె వెలుగు మరియు ఎక్స్‌ప్రెస్ బస్సులలో మహిళలకు పూర్తి ఉచిత ప్రయాణం" },
  "aadabidda-nidhi": { monetary_val: 18000, kind: "direct_cash", label_en: "Rs 1,500 / month (Rs 18,000/yr women financial empowerment)", label_te: "నెలకు రూ. 1,500 (సంవత్సరానికి రూ. 18,000 మహిళా భరోసా)" },
  "yuvagalam": { monetary_val: 36000, kind: "direct_cash", label_en: "Rs 3,000 / month (Rs 36,000/yr educated youth allowance & training)", label_te: "నెలకు రూ. 3,000 (సంవత్సరానికి రూ. 36,000 నిరుద్యోగ భృతి & శిక్షణ)" },
  "vidya-deevena": { monetary_val: 50000, kind: "fee_reimbursement", label_en: "100% College Tuition Fee Reimbursement + Vasathi Deevena Hostel Grant", label_te: "100% పూర్తి కళాశాల ఫీజు రీయింబర్స్‌మెంట్ + వసతి దీవెన హాస్టల్ గ్రాంట్" }
};

export function evaluateAllSchemesOffline(
  schemes: SchemeRecord[],
  facts: Record<string, any>,
  lang: "en" | "te" = "en"
): UniversalPortfolioResult {
  const eligible: SchemePortfolioSummary[] = [];
  const conditionally_eligible: SchemePortfolioSummary[] = [];
  const ineligible: SchemePortfolioSummary[] = [];

  let total_cash = 0;
  let total_health = 0;

  for (const s of schemes) {
    const res = checkEligibilityOffline(s, facts, lang);
    const bSpec = SCHEME_BENEFITS[s.scheme_id] || { monetary_val: 0, kind: "other", label_en: "", label_te: "" };
    const bLabel = lang === "te" ? bSpec.label_te : bSpec.label_en;
    const name = lang === "te" ? s.name_te : s.name_en;

    const summary: SchemePortfolioSummary = {
      scheme_id: s.scheme_id,
      name,
      category: s.category,
      scope: s.scope,
      status: res.status,
      benefit_label: bLabel,
      monetary_val: bSpec.monetary_val,
      benefit_kind: bSpec.kind,
      reasons: res.reasons,
      warnings: res.warnings,
      missing_fields: res.missing_fields,
    };

    if (res.status === "eligible") {
      eligible.push(summary);
      if (["direct_cash", "pension", "housing_grant", "fee_reimbursement"].includes(bSpec.kind)) {
        total_cash += bSpec.monetary_val;
      } else if (bSpec.kind === "health_cover") {
        total_health += bSpec.monetary_val;
      }
    } else if (res.status === "cannot_determine") {
      conditionally_eligible.push(summary);
    } else {
      ineligible.push(summary);
    }
  }

  return {
    total_schemes_evaluated: schemes.length,
    eligible_count: eligible.length,
    conditionally_eligible_count: conditionally_eligible.length,
    ineligible_count: ineligible.length,
    total_annual_cash_assistance: total_cash,
    total_healthcare_coverage: total_health,
    portfolio: {
      eligible,
      conditionally_eligible,
      ineligible,
    },
  };
}

