/**
 * Unit tests for i18n, Indian number formatting, Telugu digits, and dates.
 */
import { t, formatIndianNumber, formatDate } from "../src/i18n/formatters";

describe("i18n and formatting unit tests", () => {
  test("String translations exist for Telugu and English", () => {
    expect(t("app_name", "en")).toBe("Government Sahayak");
    expect(t("app_name", "te")).toBe("గవర్నమెంట్ సహాయక్");

    expect(t("eligible", "en")).toBe("Eligible");
    expect(t("eligible", "te")).toBe("అర్హులు");

    expect(t("not_eligible", "en")).toBe("Not eligible");
    expect(t("not_eligible", "te")).toBe("అర్హులు కారు");

    expect(t("offline_bar", "en")).toContain("You are offline");
    expect(t("offline_bar", "te")).toContain("ఇంటర్నెట్ లేదు");
  });

  test("Indian number formatting grouping (1,50,000)", () => {
    expect(formatIndianNumber(6000)).toBe("6,000");
    expect(formatIndianNumber(50000)).toBe("50,000");
    expect(formatIndianNumber(150000)).toBe("1,50,000");
    expect(formatIndianNumber(250000)).toBe("2,50,000");
    expect(formatIndianNumber(1000000)).toBe("10,00,000");
  });

  test("Telugu digits conversion (౦-౯)", () => {
    const formatted = formatIndianNumber(6000, true);
    expect(formatted).toBe("౬,౦౦౦");

    const largeFormatted = formatIndianNumber(150000, true);
    expect(largeFormatted).toBe("౧,౫౦,౦౦౦");
  });

  test("Bilingual date formatting", () => {
    const dateStr = "2026-10-18";
    expect(formatDate(dateStr, "en")).toBe("18 Oct 2026");
    expect(formatDate(dateStr, "te")).toBe("18 అక్టోబర్ 2026");
  });
});
