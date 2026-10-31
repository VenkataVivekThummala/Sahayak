/**
 * TypeScript Engine Parity Test Suite
 * Tests TS engine on all 24 eval cases and asserts 100% equivalence with Python engine.
 */
import * as fs from "fs";
import * as path from "path";
import { checkEligibilityOffline, SchemeRecord } from "../src/engine/engine";

const dataDir = path.resolve(__dirname, "../../data");
const schemesData: SchemeRecord[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, "schemes.json"), "utf-8")
);
const evalSet = JSON.parse(
  fs.readFileSync(path.join(dataDir, "eval_set.json"), "utf-8")
);

const schemesById = new Map<string, SchemeRecord>();
for (const s of schemesData) {
  schemesById.set(s.scheme_id, s);
}

describe("TypeScript Eligibility Engine Parity with Python Engine", () => {
  const cases = evalSet.eligibility_cases;

  test("Eval set contains 24 cases", () => {
    expect(cases).toHaveLength(24);
  });

  cases.forEach((c: any) => {
    test(`Case ${c.case_id}: ${c.description}`, () => {
      const scheme = schemesById.get(c.scheme_id);
      expect(scheme).toBeDefined();

      const result = checkEligibilityOffline(scheme!, c.facts, "en");

      // Assert status matches
      expect(result.status).toBe(c.expected_status);

      // Assert missing fields match
      expect(result.missing_fields).toEqual(c.expected_missing_fields || []);

      // Assert warnings match
      if (c.expected_warning === true) {
        expect(result.warnings.length).toBeGreaterThan(0);
      } else if (c.expected_warning === false) {
        expect(result.warnings.length).toBe(0);
      }
    });
  });

  test("PM-JAY Senior Citizen 70+ route vs SECC List route", () => {
    const pmJay = schemesById.get("pm-jay")!;
    // 72 years old -> eligible immediately
    const res72 = checkEligibilityOffline(pmJay, { age: 72 });
    expect(res72.status).toBe("eligible");
    expect(res72.missing_fields).toHaveLength(0);

    // 40 years old without list -> cannot_determine with in_secc_deprivation_list
    const res40 = checkEligibilityOffline(pmJay, { age: 40 });
    expect(res40.status).toBe("cannot_determine");
    expect(res40.missing_fields).toEqual(["in_secc_deprivation_list"]);
  });

  test("PMAY-G never eligible without list fact", () => {
    const pmayg = schemesById.get("pmay-g")!;
    const res = checkEligibilityOffline(pmayg, { has_pucca_house: false });
    expect(res.status).toBe("cannot_determine");
    expect(res.missing_fields).toContain("in_pmayg_beneficiary_list");
  });

  test("NTR Bharosa warning for age 60-64 and none for 65+", () => {
    const ntr = schemesById.get("ntr-bharosa-oap")!;
    const res62 = checkEligibilityOffline(ntr, {
      ap_resident: true,
      age: 62,
      is_bpl: true,
    });
    expect(res62.status).toBe("eligible");
    expect(res62.warnings).toHaveLength(1);

    const res65 = checkEligibilityOffline(ntr, {
      ap_resident: true,
      age: 65,
      is_bpl: true,
    });
    expect(res65.status).toBe("eligible");
    expect(res65.warnings).toHaveLength(0);
  });
});
