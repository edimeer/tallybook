import { useMemo, type RefObject } from "react";
import {
  availableMonths,
  budgetProgress,
  spendingByCategory,
  summarize,
  totalPlanned,
  transactionsInMonth,
  type TransactionFilters,
} from "../lib/calculations";
import { formatMonth, formatMonthName } from "../lib/dates";
import type { Budget, Category, MonthKey, Transaction } from "../types";
import { DEMO_MONTHS } from "../data/demoData";
import { BudgetPanel } from "./BudgetPanel";
import { OverviewCards } from "./OverviewCards";
import { SpendingBreakdown } from "./SpendingBreakdown";
import { TransactionList } from "./TransactionList";

interface DashboardProps {
  month: MonthKey;
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  transactionsHeadingRef: RefObject<HTMLHeadingElement | null>;
  onSelectCategory: (categoryId: string) => void;
  onAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onRestoreDemo?: () => void;
}

/** Everything that depends on the selected month. All numbers come from lib/calculations. */
export function Dashboard({
  month,
  categories,
  budgets,
  transactions,
  filters,
  onFiltersChange,
  transactionsHeadingRef,
  onSelectCategory,
  onAdd,
  onEdit,
  onDelete,
  onRestoreDemo,
}: DashboardProps) {
  const view = useMemo(() => {
    const months = availableMonths(transactions, DEMO_MONTHS);
    const index = months.indexOf(month);
    const previousMonth = index > 0 ? months[index - 1] : null;

    const inMonth = transactionsInMonth(transactions, month);
    const summary = summarize(inMonth, categories);
    const previous = previousMonth
      ? summarize(transactionsInMonth(transactions, previousMonth), categories)
      : null;
    const slices = spendingByCategory(inMonth, categories);
    const rows = budgetProgress(inMonth, budgets, categories);
    return { previousMonth, inMonth, summary, previous, slices, rows };
  }, [transactions, categories, budgets, month]);

  const monthLabel = formatMonth(month);
  const plannedCents = totalPlanned(budgets);

  return (
    <div className="dashboard">
      <OverviewCards
        summary={view.summary}
        previous={view.previous}
        previousLabel={
          view.previousMonth
            ? formatMonthName(view.previousMonth)
            : "last month"
        }
        plannedCents={plannedCents}
      />

      <div className="dashboard__panels">
        <SpendingBreakdown
          categories={categories}
          slices={view.slices}
          totalCents={view.summary.expenseCents}
          monthLabel={monthLabel}
          onSelectCategory={onSelectCategory}
        />
        <BudgetPanel
          rows={view.rows}
          plannedCents={plannedCents}
          actualCents={view.summary.expenseCents}
          monthLabel={monthLabel}
        />
      </div>

      <TransactionList
        transactions={view.inMonth}
        categories={categories}
        filters={filters}
        onFiltersChange={onFiltersChange}
        monthLabel={monthLabel}
        headingRef={transactionsHeadingRef}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestoreDemo={onRestoreDemo}
      />
    </div>
  );
}
