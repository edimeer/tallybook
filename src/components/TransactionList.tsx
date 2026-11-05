import { useId, useState, type RefObject } from "react";
import {
  categoryMap,
  filterAndSortTransactions,
  paginate,
  type SortKey,
  type TransactionFilters,
} from "../lib/calculations";
import { formatDateShort, formatDateLong } from "../lib/dates";
import { formatMoney } from "../lib/money";
import type { Category, Transaction } from "../types";
import { EmptyState } from "./EmptyState";
import {
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "./Icons";

interface TransactionListProps {
  /** Transactions for the selected month only. */
  transactions: Transaction[];
  categories: Category[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  monthLabel: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onRestoreStarter?: () => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Largest amount" },
  { value: "amount-asc", label: "Smallest amount" },
  { value: "description", label: "Description A to Z" },
];

export function TransactionList({
  transactions,
  categories,
  filters,
  onFiltersChange: setFilters,
  monthLabel,
  headingRef,
  onAdd,
  onEdit,
  onDelete,
  onRestoreStarter,
}: TransactionListProps) {
  const searchId = useId();
  const categoryId = useId();
  const sortId = useId();
  const lookup = categoryMap(categories);
  const [requestedPage, setRequestedPage] = useState(1);
  const matches = filterAndSortTransactions(transactions, categories, filters);
  const pageView = paginate(matches, requestedPage);
  const visible = pageView.items;

  // Any change to search, category or sort starts again from the first page.
  const onFiltersChange = (next: TransactionFilters) => {
    setRequestedPage(1);
    setFilters(next);
  };

  // After changing page, bring the top of the list into view and move focus there,
  // because the button that was pressed may be disabled on the last or first page.
  const goToPage = (page: number) => {
    setRequestedPage(page);
    headingRef.current?.scrollIntoView({ block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  };
  const hasFilters =
    filters.query.trim() !== "" || filters.categoryId !== "all";

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");

  return (
    <section className="panel" aria-labelledby="transactions-heading">
      <header className="panel__header panel__header--row">
        <div>
          <h2
            id="transactions-heading"
            className="panel__title"
            tabIndex={-1}
            ref={headingRef}
          >
            Transactions
          </h2>
          <p className="panel__subtitle">{monthLabel}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          <PlusIcon />
          Add transaction
        </button>
      </header>

      <div className="filters" role="search" aria-label="Filter transactions">
        <div className="field filters__search">
          <label htmlFor={searchId}>Search</label>
          <div className="input-icon">
            <SearchIcon />
            <input
              id={searchId}
              type="search"
              className="control"
              placeholder="Description or category"
              value={filters.query}
              onChange={(event) =>
                onFiltersChange({ ...filters, query: event.target.value })
              }
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor={categoryId}>Category</label>
          <select
            id={categoryId}
            className="control"
            value={filters.categoryId}
            onChange={(event) =>
              onFiltersChange({ ...filters, categoryId: event.target.value })
            }
          >
            <option value="all">All categories</option>
            <optgroup label="Expenses">
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Income">
              {incomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="field">
          <label htmlFor={sortId}>Sort by</label>
          <select
            id={sortId}
            className="control"
            value={filters.sort}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                sort: event.target.value as SortKey,
              })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="result-count" role="status">
        {matches.length === 0
          ? "No transactions to show"
          : `Showing ${pageView.start} to ${pageView.end} of ${matches.length}`}
        {hasFilters
          ? ` matching (${transactions.length} this month)`
          : matches.length === 0
            ? ""
            : matches.length === 1
              ? " transaction"
              : " transactions"}
        {hasFilters && (
          <>
            {" "}
            <button
              type="button"
              className="link-button"
              onClick={() =>
                onFiltersChange({ ...filters, query: "", categoryId: "all" })
              }
            >
              Clear filters
            </button>
          </>
        )}
      </p>

      {transactions.length === 0 ? (
        <EmptyState
          title={`No transactions in ${monthLabel}`}
          actions={
            <>
              <button
                type="button"
                className="btn btn--primary"
                onClick={onAdd}
              >
                <PlusIcon />
                Add transaction
              </button>
              {onRestoreStarter && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onRestoreStarter}
                >
                  Load starter data
                </button>
              )}
            </>
          }
        >
          Add an income or expense to see this month take shape, or switch to
          another month.
        </EmptyState>
      ) : matches.length === 0 ? (
        <EmptyState
          title="No matching transactions"
          actions={
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                onFiltersChange({ ...filters, query: "", categoryId: "all" })
              }
            >
              Clear filters
            </button>
          }
        >
          Nothing in {monthLabel} matches your search or category. Try a
          different term.
        </EmptyState>
      ) : (
        <>
          <ul className="txn-list">
            {visible.map((t) => {
              const category = lookup.get(t.categoryId);
              const isIncome = category?.kind === "income";
              return (
                <li key={t.id} className="txn">
                  <time
                    className="txn__date"
                    dateTime={t.date}
                    title={formatDateLong(t.date)}
                  >
                    {formatDateShort(t.date)}
                  </time>

                  <span
                    className={`indicator indicator--${isIncome ? "income" : "expense"}`}
                    aria-hidden="true"
                  >
                    {isIncome ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </span>

                  <div className="txn__main">
                    <span className="txn__description">{t.description}</span>
                    <span className="chip">
                      {category?.name ?? "Unknown category"}
                    </span>
                  </div>

                  <span
                    className={`txn__amount txn__amount--${isIncome ? "income" : "expense"}`}
                  >
                    <span className="sr-only">
                      {isIncome ? "Income " : "Expense "}
                    </span>
                    <span aria-hidden="true">{isIncome ? "+" : "-"}</span>
                    {formatMoney(t.amountCents)}
                  </span>

                  <div className="txn__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => onEdit(t)}
                    >
                      <PencilIcon />
                      <span className="sr-only">Edit {t.description}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => onDelete(t)}
                    >
                      <TrashIcon />
                      <span className="sr-only">Delete {t.description}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {pageView.pageCount > 1 && (
            <nav className="pager" aria-label="Transaction pages">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={pageView.page === 1}
                onClick={() => goToPage(pageView.page - 1)}
              >
                <ChevronLeftIcon />
                Previous
              </button>
              <p className="pager__status">
                Page {pageView.page} of {pageView.pageCount}
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={pageView.page === pageView.pageCount}
                onClick={() => goToPage(pageView.page + 1)}
              >
                Next
                <ChevronRightIcon />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
