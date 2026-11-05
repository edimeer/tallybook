import { describe, expect, it } from "vitest";
import { DEMO_CATEGORIES } from "../data/demoData";
import {
  validateTransactionForm,
  type TransactionFormValues,
} from "./validation";

const valid: TransactionFormValues = {
  type: "expense",
  description: "  Corner   Co-op ",
  amount: "42.50",
  date: "2026-10-14",
  categoryId: "groceries",
};

describe("validateTransactionForm", () => {
  it("accepts valid input and normalizes it", () => {
    const result = validateTransactionForm(valid, DEMO_CATEGORIES);
    expect(result).toEqual({
      ok: true,
      value: {
        description: "Corner Co-op",
        amountCents: 4250,
        date: "2026-10-14",
        categoryId: "groceries",
      },
    });
  });

  it("reports every invalid field", () => {
    const result = validateTransactionForm(
      {
        type: "expense",
        description: "a",
        amount: "",
        date: "",
        categoryId: "",
      },
      DEMO_CATEGORIES,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "amount",
        "categoryId",
        "date",
        "description",
      ]);
    }
  });

  it.each([
    ["zero", "0"],
    ["too many decimals", "1.999"],
    ["negative", "-3"],
    ["too large", "1000000.01"],
  ])("rejects an amount that is %s", (_name, amount) => {
    const result = validateTransactionForm(
      { ...valid, amount },
      DEMO_CATEGORIES,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBeDefined();
  });

  it("rejects impossible and out-of-range dates", () => {
    for (const date of [
      "2026-02-30",
      "1999-12-31",
      "2100-01-01",
      "not-a-date",
    ]) {
      const result = validateTransactionForm(
        { ...valid, date },
        DEMO_CATEGORIES,
      );
      expect(result.ok).toBe(false);
    }
  });

  it("rejects a category that does not match the type", () => {
    const result = validateTransactionForm(
      { ...valid, type: "income" },
      DEMO_CATEGORIES,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.categoryId).toBeDefined();
  });
});
