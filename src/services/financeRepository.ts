import type { Budget, Category, Transaction, TransactionInput } from "../types";

/**
 * The only way the UI reads or writes finance data.
 *
 * Today the app uses `localDemoRepository` (browser storage, sample data).
 * To connect a Rails JSON API later, write another object that implements this
 * interface (see docs/api-boundary.md) and return it from `createRepository`
 * in services/index.ts. No component needs to change.
 *
 * Every method returns a Promise even though the demo version is instant, so
 * the UI already handles loading and error states.
 */
export interface FinanceRepository {
  /** "demo" shows the Demo data badge and the restore/clear actions. */
  readonly mode: "demo" | "api";

  listCategories(): Promise<Category[]>;
  listBudgets(): Promise<Budget[]>;
  listTransactions(): Promise<Transaction[]>;

  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  /** Demo-only. Replaces all transactions with the original sample data. */
  resetDemoData?(): Promise<Transaction[]>;
  /** Demo-only. Removes every transaction so the empty state can be explored. */
  clearAllData?(): Promise<Transaction[]>;
}

/** Thrown when data cannot be stored, for example storage is full or blocked. */
export class PersistenceError extends Error {
  constructor(message = "Changes could not be saved in this browser.") {
    super(message);
    this.name = "PersistenceError";
  }
}

/** Thrown when a record to edit or delete no longer exists. */
export class NotFoundError extends Error {
  constructor(message = "That transaction no longer exists.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
