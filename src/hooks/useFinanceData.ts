import { useCallback, useEffect, useState } from "react";
import { errorMessage, type FinanceRepository } from "../services";
import type { Budget, Category, Transaction, TransactionInput } from "../types";

interface Data {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
}

type Status = "loading" | "ready" | "error";

/**
 * Loads data from a repository and keeps it in React state.
 * Components call these actions and never touch storage or the network directly.
 */
export function useFinanceData(repository: FinanceRepository) {
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  // Bumping this number re-runs the load effect (used by the "Try again" button).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      repository.listCategories(),
      repository.listBudgets(),
      repository.listTransactions(),
    ])
      .then(([categories, budgets, transactions]) => {
        if (cancelled) return;
        setData({ categories, budgets, transactions });
        setLoadError(null);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(errorMessage(error));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [repository, attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const setTransactions = useCallback(
    (update: (previous: Transaction[]) => Transaction[]) => {
      setData((current) =>
        current
          ? { ...current, transactions: update(current.transactions) }
          : current,
      );
    },
    [],
  );

  // Each action throws if the repository fails, so the caller can show a message
  // next to whatever the person was doing (a form, a confirm dialog).

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      const created = await repository.createTransaction(input);
      setTransactions((all) => [...all, created]);
      return created;
    },
    [repository, setTransactions],
  );

  const editTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const updated = await repository.updateTransaction(id, input);
      setTransactions((all) => all.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [repository, setTransactions],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await repository.deleteTransaction(id);
      setTransactions((all) => all.filter((t) => t.id !== id));
    },
    [repository, setTransactions],
  );

  const resetDemoData = useCallback(async () => {
    if (!repository.resetDemoData) return;
    const transactions = await repository.resetDemoData();
    setTransactions(() => transactions);
  }, [repository, setTransactions]);

  const clearAllData = useCallback(async () => {
    if (!repository.clearAllData) return;
    const transactions = await repository.clearAllData();
    setTransactions(() => transactions);
  }, [repository, setTransactions]);

  return {
    status,
    loadError,
    data,
    retry,
    addTransaction,
    editTransaction,
    removeTransaction,
    resetDemoData,
    clearAllData,
  };
}
