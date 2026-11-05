import type { Budget, Category, MonthKey, Transaction } from "../types";
import { monthOf } from "./dates";

/** Pure functions only: given data in, numbers out. No React, no storage. */

export interface MonthSummary {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  /** net / income, or null when there is no income to compare against. */
  savingsRate: number | null;
}

export interface CategorySpend {
  category: Category;
  amountCents: number;
  /** Share of total spending, 0 to 1. */
  share: number;
}

export type BudgetStatus = "ok" | "near" | "over" | "unbudgeted";

export interface BudgetRow {
  category: Category;
  plannedCents: number;
  actualCents: number;
  /** planned - actual. Negative when over budget. */
  remainingCents: number;
  /** actual / planned (can exceed 1). 0 when nothing is planned. */
  ratio: number;
  status: BudgetStatus;
}

/** A category counts as "near its limit" from this share of the plan onwards. */
export const NEAR_LIMIT_RATIO = 0.85;

export type SortKey =
  "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description";

export interface TransactionFilters {
  query: string;
  /** A category id, or 'all'. */
  categoryId: string;
  sort: SortKey;
}

export function categoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

export function transactionsInMonth(
  transactions: Transaction[],
  month: MonthKey,
): Transaction[] {
  return transactions.filter((t) => monthOf(t.date) === month);
}

export function summarize(
  transactions: Transaction[],
  categories: Category[],
): MonthSummary {
  const lookup = categoryMap(categories);
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of transactions) {
    const kind = lookup.get(t.categoryId)?.kind;
    if (kind === "income") incomeCents += t.amountCents;
    else if (kind === "expense") expenseCents += t.amountCents;
  }
  const netCents = incomeCents - expenseCents;
  return {
    incomeCents,
    expenseCents,
    netCents,
    savingsRate: incomeCents > 0 ? netCents / incomeCents : null,
  };
}

export function totalPlanned(budgets: Budget[]): number {
  return budgets.reduce((sum, b) => sum + b.plannedCents, 0);
}

/** Expense totals per category, largest first. Categories with no spending are left out. */
export function spendingByCategory(
  transactions: Transaction[],
  categories: Category[],
): CategorySpend[] {
  const totals = new Map<string, number>();
  const lookup = categoryMap(categories);
  for (const t of transactions) {
    if (lookup.get(t.categoryId)?.kind !== "expense") continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amountCents);
  }
  const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0);
  const rows: CategorySpend[] = [];
  for (const [id, amountCents] of totals) {
    const category = lookup.get(id);
    if (category && amountCents > 0) {
      rows.push({ category, amountCents, share: amountCents / grandTotal });
    }
  }
  return rows.sort((a, b) => b.amountCents - a.amountCents);
}

/** Planned vs actual for every expense category, most-used budget first. */
export function budgetProgress(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
): BudgetRow[] {
  const spend = new Map(
    spendingByCategory(transactions, categories).map((s) => [
      s.category.id,
      s.amountCents,
    ]),
  );
  const planned = new Map(budgets.map((b) => [b.categoryId, b.plannedCents]));

  const rows = categories
    .filter((c) => c.kind === "expense")
    .map((category): BudgetRow => {
      const plannedCents = planned.get(category.id) ?? 0;
      const actualCents = spend.get(category.id) ?? 0;
      const ratio = plannedCents > 0 ? actualCents / plannedCents : 0;
      let status: BudgetStatus = "ok";
      if (plannedCents === 0) status = actualCents > 0 ? "unbudgeted" : "ok";
      else if (actualCents > plannedCents) status = "over";
      else if (ratio >= NEAR_LIMIT_RATIO) status = "near";
      return {
        category,
        plannedCents,
        actualCents,
        remainingCents: plannedCents - actualCents,
        ratio,
        status,
      };
    });

  return rows.sort(
    (a, b) => b.ratio - a.ratio || b.actualCents - a.actualCents,
  );
}

/** Sorted (oldest first) list of every month that has data, plus any extra months to always offer. */
export function availableMonths(
  transactions: Transaction[],
  alwaysInclude: MonthKey[],
): MonthKey[] {
  const months = new Set<MonthKey>(alwaysInclude);
  for (const t of transactions) months.add(monthOf(t.date));
  return [...months].sort();
}

export function filterAndSortTransactions(
  transactions: Transaction[],
  categories: Category[],
  filters: TransactionFilters,
): Transaction[] {
  const lookup = categoryMap(categories);
  const query = filters.query.trim().toLowerCase();

  const matches = transactions.filter((t) => {
    if (filters.categoryId !== "all" && t.categoryId !== filters.categoryId)
      return false;
    if (!query) return true;
    const categoryName = lookup.get(t.categoryId)?.name ?? "";
    return (
      t.description.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query)
    );
  });

  const byDateDesc = (a: Transaction, b: Transaction) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id);

  switch (filters.sort) {
    case "date-asc":
      return matches.sort((a, b) => -byDateDesc(a, b));
    case "amount-desc":
      return matches.sort(
        (a, b) => b.amountCents - a.amountCents || byDateDesc(a, b),
      );
    case "amount-asc":
      return matches.sort(
        (a, b) => a.amountCents - b.amountCents || byDateDesc(a, b),
      );
    case "description":
      return matches.sort(
        (a, b) =>
          a.description.localeCompare(b.description) || byDateDesc(a, b),
      );
    case "date-desc":
    default:
      return matches.sort(byDateDesc);
  }
}
