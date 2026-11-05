import { describe, expect, it } from "vitest";
import { centsToInputValue, formatMoney, parseAmountToCents } from "./money";

describe("parseAmountToCents", () => {
  it("parses plain, decimal, grouped and dollar-prefixed amounts", () => {
    expect(parseAmountToCents("12")).toBe(1200);
    expect(parseAmountToCents("12.5")).toBe(1250);
    expect(parseAmountToCents("1,234.56")).toBe(123456);
    expect(parseAmountToCents(" $0.07 ")).toBe(7);
  });

  it("avoids floating point errors", () => {
    expect(parseAmountToCents("0.29")).toBe(29);
    expect(parseAmountToCents("19.99")).toBe(1999);
  });

  it("rejects invalid input", () => {
    for (const bad of ["", "abc", "-5", "1.234", "1..2", "12 34", "$"]) {
      expect(parseAmountToCents(bad)).toBeNull();
    }
  });
});

describe("formatting", () => {
  it("formats cents as US dollars", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(-1200)).toBe("-$12.00");
  });

  it("round trips through the input value", () => {
    expect(parseAmountToCents(centsToInputValue(4250))).toBe(4250);
  });
});
