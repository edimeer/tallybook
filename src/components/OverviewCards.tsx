import { formatMoney, formatPercent } from "../lib/money";
import type { MonthSummary } from "../lib/calculations";
import { ArrowDownIcon, ArrowUpIcon } from "./Icons";

interface OverviewCardsProps {
  summary: MonthSummary;
  /** The previous month's summary, or null when there is no earlier data to compare. */
  previous: MonthSummary | null;
  previousLabel: string;
  plannedCents: number;
}

function changeText(
  current: number,
  previous: number | undefined,
  label: string,
): string {
  if (previous === undefined || previous === 0)
    return `No ${label} data to compare`;
  const change = (current - previous) / previous;
  if (Math.abs(change) < 0.005) return `About the same as ${label}`;
  return `${formatPercent(Math.abs(change))} ${change > 0 ? "higher" : "lower"} than ${label}`;
}

export function OverviewCards({
  summary,
  previous,
  previousLabel,
  plannedCents,
}: OverviewCardsProps) {
  const remaining = plannedCents - summary.expenseCents;
  const over = remaining < 0;
  const hasPrevious =
    previous !== null &&
    (previous.incomeCents > 0 || previous.expenseCents > 0);
  const compare = hasPrevious ? previous : null;

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="sr-only">
        Monthly overview
      </h2>
      <div className="stats">
        <article className="card stat">
          <h3 className="stat__label">
            <span className="indicator indicator--income" aria-hidden="true">
              <ArrowUpIcon />
            </span>
            Income
          </h3>
          <p className="stat__value">{formatMoney(summary.incomeCents)}</p>
          <p className="stat__note">
            {changeText(
              summary.incomeCents,
              compare?.incomeCents,
              previousLabel,
            )}
          </p>
        </article>

        <article className="card stat">
          <h3 className="stat__label">
            <span className="indicator indicator--expense" aria-hidden="true">
              <ArrowDownIcon />
            </span>
            Expenses
          </h3>
          <p className="stat__value">{formatMoney(summary.expenseCents)}</p>
          <p className="stat__note">
            {changeText(
              summary.expenseCents,
              compare?.expenseCents,
              previousLabel,
            )}
          </p>
        </article>

        <article className="card stat">
          <h3 className="stat__label">Remaining budget</h3>
          <p className={`stat__value${over ? " stat__value--alert" : ""}`}>
            {formatMoney(remaining)}
          </p>
          <p className="stat__note">
            {over ? "Over budget. " : ""}
            {formatMoney(plannedCents)} planned this month
          </p>
        </article>

        <article className="card stat">
          <h3 className="stat__label">Savings rate</h3>
          <p className="stat__value">
            {summary.savingsRate === null
              ? "N/A"
              : formatPercent(summary.savingsRate)}
          </p>
          <p className="stat__note">
            {summary.savingsRate === null
              ? "No income recorded this month"
              : summary.netCents >= 0
                ? `${formatMoney(summary.netCents)} left after expenses`
                : `Spent ${formatMoney(-summary.netCents)} more than earned`}
          </p>
        </article>
      </div>
    </section>
  );
}
