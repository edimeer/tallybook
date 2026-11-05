import { useState } from "react";
import type { CategorySpend } from "../lib/calculations";
import { formatMoney, formatPercent } from "../lib/money";
import type { Category } from "../types";
import { Swatch } from "./chartPatterns";
import { DonutChart } from "./DonutChart";
import { EmptyState } from "./EmptyState";

interface SpendingBreakdownProps {
  categories: Category[];
  slices: CategorySpend[];
  totalCents: number;
  monthLabel: string;
  /** Called when a legend item is chosen, to filter the transaction list. */
  onSelectCategory: (categoryId: string) => void;
}

export function SpendingBreakdown({
  categories,
  slices,
  totalCents,
  monthLabel,
  onSelectCategory,
}: SpendingBreakdownProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section className="panel" aria-labelledby="breakdown-heading">
      <header className="panel__header">
        <h2 id="breakdown-heading" className="panel__title">
          Spending by category
        </h2>
        <p className="panel__subtitle">{monthLabel}</p>
      </header>

      {slices.length === 0 ? (
        <EmptyState title="No spending yet">
          Expenses you add for {monthLabel} will be charted here.
        </EmptyState>
      ) : (
        <div className="breakdown">
          <DonutChart
            categories={categories}
            slices={slices}
            totalCents={totalCents}
            activeId={activeId}
          />
          <ul
            className="legend"
            aria-label="Spending legend. Choose a category to filter transactions."
          >
            {slices.map(({ category, amountCents, share }) => (
              <li key={category.id}>
                <button
                  type="button"
                  className="legend__item"
                  onMouseEnter={() => setActiveId(category.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(category.id)}
                  onBlur={() => setActiveId(null)}
                  onClick={() => onSelectCategory(category.id)}
                  aria-label={`${category.name}: ${formatMoney(amountCents)}, ${formatPercent(share)} of spending. Show these transactions.`}
                >
                  <Swatch category={category} />
                  <span className="legend__name">{category.name}</span>
                  <span className="legend__percent">
                    {formatPercent(share)}
                  </span>
                  <span className="legend__amount">
                    {formatMoney(amountCents)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
