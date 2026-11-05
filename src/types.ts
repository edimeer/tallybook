/** Shared domain types. Money is always stored as integer cents to avoid float errors. */

export type CategoryKind = "income" | "expense";

/** Fill patterns used by the chart so categories never depend on color alone. */
export type PatternKind =
  | "solid"
  | "diag"
  | "diag-rev"
  | "dots"
  | "cross"
  | "horiz"
  | "vert"
  | "checks";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  pattern: PatternKind;
}

export interface Transaction {
  id: string;
  /** ISO calendar date, YYYY-MM-DD. */
  date: string;
  description: string;
  /** Always a positive integer. Whether it is income or expense comes from the category. */
  amountCents: number;
  categoryId: string;
}

/** What the UI sends when creating or editing a transaction (the id is assigned by the repository). */
export type TransactionInput = Omit<Transaction, "id">;

/** Planned monthly spending for one expense category. */
export interface Budget {
  categoryId: string;
  plannedCents: number;
}

/** Month key in YYYY-MM form. */
export type MonthKey = string;
