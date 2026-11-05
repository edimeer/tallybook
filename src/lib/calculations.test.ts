import { describe, expect, it } from "vitest";
import { SEED_BUDGETS, SEED_CATEGORIES } from "../data/seedData";
import type { Transaction } from "../types";
import {
  availableMonths,
  budgetProgress,
  filterAndSortTransactions,
  paginate,
  spendingByCategory,
  summarize,
  transactionsInMonth,
} from "./calculations";

let n = 0;
const tx = (
  date: string,
  categoryId: string,
  amountCents: number,
  description = "x",
): Transaction => ({
  id: `t${(n += 1)}`,
  date,
  categoryId,
  amountCents,
  description,
});

const sample: Transaction[] = [
  tx("2026-10-01", "salary", 500000, "Paycheck"),
  tx("2026-10-02", "housing", 150000, "Rent"),
  tx("2026-10-05", "groceries", 30000, "Market"),
  tx("2026-10-09", "groceries", 30000, "Co-op"),
  tx("2026-10-20", "dining", 5000, "Tacos"),
  tx("2026-09-15", "groceries", 9999, "Old"),
];

describe("summarize", () => {
  it("totals income and expenses and computes the savings rate", () => {
    const result = summarize(
      transactionsInMonth(sample, "2026-10"),
      SEED_CATEGORIES,
    );
    expect(result.incomeCents).toBe(500000);
    expect(result.expenseCents).toBe(215000);
    expect(result.netCents).toBe(285000);
    expect(result.savingsRate).toBeCloseTo(0.57);
  });

  it("returns a null savings rate when there is no income", () => {
    const result = summarize(
      [tx("2026-10-02", "housing", 100)],
      SEED_CATEGORIES,
    );
    expect(result.savingsRate).toBeNull();
  });

  it("handles an empty month", () => {
    expect(summarize([], SEED_CATEGORIES)).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      netCents: 0,
      savingsRate: null,
    });
  });
});

describe("spendingByCategory", () => {
  it("sorts largest first, ignores income, and shares add up to 1", () => {
    const rows = spendingByCategory(
      transactionsInMonth(sample, "2026-10"),
      SEED_CATEGORIES,
    );
    expect(rows.map((r) => r.category.id)).toEqual([
      "housing",
      "groceries",
      "dining",
    ]);
    expect(rows[1].amountCents).toBe(60000);
    expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1);
  });
});

describe("budgetProgress", () => {
  it("flags over-budget and near-limit categories", () => {
    const month = [
      tx("2026-10-01", "groceries", 61000), // 60,000 planned: over
      tx("2026-10-01", "dining", 25000), // 28,000 planned: 89%, near
      tx("2026-10-01", "fun", 1000), // 12,000 planned: ok
    ];
    const rows = budgetProgress(month, SEED_BUDGETS, SEED_CATEGORIES);
    const status = Object.fromEntries(
      rows.map((r) => [r.category.id, r.status]),
    );
    expect(status.groceries).toBe("over");
    expect(status.dining).toBe("near");
    expect(status.fun).toBe("ok");
    expect(
      rows.find((r) => r.category.id === "groceries")?.remainingCents,
    ).toBe(-1000);
    expect(rows[0].category.id).toBe("groceries"); // highest usage first
  });
});

describe("availableMonths", () => {
  it("merges data months with always-included months, sorted oldest first", () => {
    expect(availableMonths(sample, ["2026-08", "2026-10"])).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });
});

describe("filterAndSortTransactions", () => {
  const october = transactionsInMonth(sample, "2026-10");
  const base = { query: "", categoryId: "all", sort: "date-desc" as const };

  it("searches descriptions and category names, case-insensitively", () => {
    expect(
      filterAndSortTransactions(october, SEED_CATEGORIES, {
        ...base,
        query: "CO-OP",
      }),
    ).toHaveLength(1);
    expect(
      filterAndSortTransactions(october, SEED_CATEGORIES, {
        ...base,
        query: "dining",
      }),
    ).toHaveLength(1);
  });

  it("filters by category", () => {
    const result = filterAndSortTransactions(october, SEED_CATEGORIES, {
      ...base,
      categoryId: "groceries",
    });
    expect(result).toHaveLength(2);
  });

  it("sorts by amount and date", () => {
    const byAmount = filterAndSortTransactions(october, SEED_CATEGORIES, {
      ...base,
      sort: "amount-desc",
    });
    expect(byAmount[0].description).toBe("Paycheck");
    const oldest = filterAndSortTransactions(october, SEED_CATEGORIES, {
      ...base,
      sort: "date-asc",
    });
    expect(oldest[0].date).toBe("2026-10-01");
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  it("slices into pages of the requested size", () => {
    const first = paginate(items, 1, 10);
    expect(first.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(first).toMatchObject({
      page: 1,
      pageCount: 3,
      start: 1,
      end: 10,
      total: 23,
    });
    const last = paginate(items, 3, 10);
    expect(last.items).toEqual([21, 22, 23]);
    expect(last).toMatchObject({ start: 21, end: 23 });
  });

  it("clamps out-of-range pages", () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, Number.NaN, 10).page).toBe(1);
  });

  it("handles an empty list", () => {
    expect(paginate([], 1, 10)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      start: 0,
      end: 0,
      total: 0,
    });
  });
});
