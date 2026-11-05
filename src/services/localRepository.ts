import {
  SEED_BUDGETS,
  SEED_CATEGORIES,
  createSeedTransactions,
} from "../data/seedData";
import { isValidIsoDate } from "../lib/dates";
import type { Transaction, TransactionInput } from "../types";
import {
  NotFoundError,
  PersistenceError,
  type FinanceRepository,
} from "./financeRepository";

/** Bump the version if the stored shape changes; old data is then replaced by the starter data. */
const STORAGE_KEY = "tallybook:v1";

interface StoredData {
  version: 1;
  transactions: Transaction[];
}

const validCategoryIds = new Set(SEED_CATEGORIES.map((c) => c.id));

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.description === "string" &&
    t.description.length > 0 &&
    typeof t.date === "string" &&
    isValidIsoDate(t.date) &&
    typeof t.amountCents === "number" &&
    Number.isInteger(t.amountCents) &&
    t.amountCents > 0 &&
    typeof t.categoryId === "string" &&
    validCategoryIds.has(t.categoryId)
  );
}

function isStoredData(value: unknown): value is StoredData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    data.version === 1 &&
    Array.isArray(data.transactions) &&
    data.transactions.every(isTransaction)
  );
}

/** Browsers can block storage (private mode, strict settings), so even touching it is guarded. */
function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Local repository: starter data on first load, then the user's changes in localStorage.
 * The storage is injectable so it can be tested without a browser.
 */
export function createLocalRepository(
  storage: Storage | null = getBrowserStorage(),
): FinanceRepository {
  function write(transactions: Transaction[]): void {
    if (!storage)
      throw new PersistenceError(
        "Browser storage is unavailable, so changes cannot be saved.",
      );
    try {
      const data: StoredData = { version: 1, transactions };
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      throw new PersistenceError(
        "Browser storage is full or blocked, so changes could not be saved.",
      );
    }
  }

  /** Reads saved data. Missing, corrupted or outdated data falls back to the starter data. */
  function read(): Transaction[] {
    let raw: string | null = null;
    try {
      raw = storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return createSeedTransactions();
    }
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isStoredData(parsed)) return parsed.transactions;
      } catch {
        // fall through to the starter data
      }
    }
    const seed = createSeedTransactions();
    try {
      write(seed);
    } catch {
      // Not being able to save the first copy is fine; writes report the problem later.
    }
    return seed;
  }

  return {
    mode: "local",

    async listCategories() {
      return SEED_CATEGORIES;
    },
    async listBudgets() {
      return SEED_BUDGETS;
    },
    async listTransactions() {
      return read();
    },

    async createTransaction(input: TransactionInput) {
      const created: Transaction = { id: newId(), ...input };
      write([...read(), created]);
      return created;
    },

    async updateTransaction(id: string, input: TransactionInput) {
      const all = read();
      if (!all.some((t) => t.id === id)) throw new NotFoundError();
      const updated: Transaction = { id, ...input };
      write(all.map((t) => (t.id === id ? updated : t)));
      return updated;
    },

    async deleteTransaction(id: string) {
      const all = read();
      if (!all.some((t) => t.id === id)) throw new NotFoundError();
      write(all.filter((t) => t.id !== id));
    },

    async restoreStarterData() {
      const seed = createSeedTransactions();
      write(seed);
      return seed;
    },

    async clearAllData() {
      write([]);
      return [];
    },
  };
}
