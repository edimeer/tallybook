import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Dashboard } from "./components/Dashboard";
import { EmptyState } from "./components/EmptyState";
import { PlusIcon } from "./components/Icons";
import { MonthSelector } from "./components/MonthSelector";
import { TransactionForm } from "./components/TransactionForm";
import { DEFAULT_MONTH, SEED_MONTHS } from "./data/seedData";
import { useFinanceData } from "./hooks/useFinanceData";
import { availableMonths, type TransactionFilters } from "./lib/calculations";
import { defaultDateForMonth, formatDateShort, monthOf } from "./lib/dates";
import { formatMoney } from "./lib/money";
import { createRepository } from "./services";
import type { MonthKey, Transaction, TransactionInput } from "./types";

/** One place describes which dialog (if any) is open, so two can never be open at once. */
type Dialog =
  | { kind: "none" }
  | { kind: "form"; editing: Transaction | null }
  | { kind: "delete"; transaction: Transaction }
  | { kind: "restore" }
  | { kind: "clear" };

const DEFAULT_FILTERS: TransactionFilters = {
  query: "",
  categoryId: "all",
  sort: "date-desc",
};

// Created once for the whole app. Swap the implementation in services/index.ts.
const repository = createRepository();

export default function App() {
  const finance = useFinanceData(repository);
  const [month, setMonth] = useState<MonthKey>(DEFAULT_MONTH);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [message, setMessage] = useState("");
  const transactionsHeadingRef = useRef<HTMLHeadingElement>(null);

  const canReset = Boolean(repository.restoreStarterData);
  const transactions = finance.data?.transactions;
  const months = useMemo(
    () => availableMonths(transactions ?? [], SEED_MONTHS),
    [transactions],
  );

  // Status messages are announced to screen readers, then cleared.
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const closeDialog = () => setDialog({ kind: "none" });

  async function saveTransaction(input: TransactionInput) {
    if (dialog.kind !== "form") return;
    const { editing } = dialog;
    const saved = editing
      ? await finance.editTransaction(editing.id, input)
      : await finance.addTransaction(input);
    // Jump to the month of the saved transaction so the person sees the change.
    setMonth(monthOf(saved.date));
    setMessage(
      `${editing ? "Updated" : "Added"} ${saved.description}, ${formatMoney(saved.amountCents)} on ${formatDateShort(saved.date)}.`,
    );
    closeDialog();
  }

  function showCategory(categoryId: string) {
    setFilters({ ...filters, categoryId, query: "" });
    transactionsHeadingRef.current?.scrollIntoView({ block: "start" });
    transactionsHeadingRef.current?.focus({ preventScroll: true });
  }

  const hasAnyData = (transactions?.length ?? 0) > 0;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              T
            </span>
            <div>
              <p className="brand__name">Tallybook</p>
              <p className="brand__tag">Personal finance dashboard</p>
            </div>
          </div>
          <div className="site-header__controls">
            <MonthSelector months={months} value={month} onChange={setMonth} />
          </div>
        </div>
      </header>

      <main id="main" className="container main">
        {finance.status === "loading" && (
          <p className="loading" role="status">
            Loading your dashboard...
          </p>
        )}

        {finance.status === "error" && (
          <div className="panel" role="alert">
            <EmptyState
              title="The dashboard could not load"
              actions={
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={finance.retry}
                >
                  Try again
                </button>
              }
            >
              {finance.loadError}
            </EmptyState>
          </div>
        )}

        {finance.status === "ready" && finance.data && !hasAnyData && (
          <div className="panel">
            <EmptyState
              title="No transactions yet"
              actions={
                <>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setDialog({ kind: "form", editing: null })}
                  >
                    <PlusIcon />
                    Add your first transaction
                  </button>
                  {canReset && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setDialog({ kind: "restore" })}
                    >
                      Load starter data
                    </button>
                  )}
                </>
              }
            >
              Start from a blank slate by adding income and expenses yourself,
              or load the starter transactions to see the dashboard filled in.
            </EmptyState>
          </div>
        )}

        {finance.status === "ready" && finance.data && hasAnyData && (
          <Dashboard
            month={month}
            categories={finance.data.categories}
            budgets={finance.data.budgets}
            transactions={finance.data.transactions}
            filters={filters}
            onFiltersChange={setFilters}
            transactionsHeadingRef={transactionsHeadingRef}
            onSelectCategory={showCategory}
            onAdd={() => setDialog({ kind: "form", editing: null })}
            onEdit={(transaction) =>
              setDialog({ kind: "form", editing: transaction })
            }
            onDelete={(transaction) =>
              setDialog({ kind: "delete", transaction })
            }
            onRestoreStarter={
              canReset ? () => setDialog({ kind: "restore" }) : undefined
            }
          />
        )}
      </main>

      <footer className="container site-footer">
        <p>
          Tallybook organizes and visualizes the data you enter. It does not
          connect to banks, move money, or give financial advice.
        </p>
        {canReset && finance.status === "ready" && (
          <p className="site-footer__data">
            Your data is stored only in this browser.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setDialog({ kind: "restore" })}
            >
              Load starter data
            </button>{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setDialog({ kind: "clear" })}
            >
              Clear all data
            </button>
          </p>
        )}
      </footer>

      {/* Dialogs */}
      {dialog.kind === "form" && finance.data && (
        <TransactionForm
          categories={finance.data.categories}
          editing={dialog.editing}
          defaultDate={defaultDateForMonth(month)}
          onSave={saveTransaction}
          onCancel={closeDialog}
        />
      )}

      {dialog.kind === "delete" && (
        <ConfirmDialog
          title="Delete transaction?"
          message={`"${dialog.transaction.description}" for ${formatMoney(dialog.transaction.amountCents)} will be removed.`}
          confirmLabel="Delete"
          onCancel={closeDialog}
          onConfirm={async () => {
            await finance.removeTransaction(dialog.transaction.id);
            setMessage(`Deleted ${dialog.transaction.description}.`);
            closeDialog();
          }}
        />
      )}

      {dialog.kind === "restore" && (
        <ConfirmDialog
          title="Load starter data?"
          message="This replaces every transaction, including any you added or edited, with the starter data."
          confirmLabel="Load"
          onCancel={closeDialog}
          onConfirm={async () => {
            await finance.restoreStarterData();
            setMonth(DEFAULT_MONTH);
            setFilters(DEFAULT_FILTERS);
            setMessage("Starter data loaded.");
            closeDialog();
          }}
        />
      )}

      {dialog.kind === "clear" && (
        <ConfirmDialog
          title="Clear all data?"
          message="This removes every transaction so you can start from an empty dashboard. You can load the starter data again at any time."
          confirmLabel="Clear all"
          onCancel={closeDialog}
          onConfirm={async () => {
            await finance.clearAllData();
            setFilters(DEFAULT_FILTERS);
            setMessage("All transactions cleared.");
            closeDialog();
          }}
        />
      )}

      <p className="toast" role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
