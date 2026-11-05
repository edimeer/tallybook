import type { MonthSummary } from "../lib/calculations";
import { formatMoney, formatPercent } from "../lib/money";
import { ArrowDownIcon, ArrowUpIcon } from "./Icons";

interface MonthHeroProps {
  summary: MonthSummary;
  /** The previous month's summary, or null when there is no earlier data to compare. */
  previous: MonthSummary | null;
  previousLabel: string;
  plannedCents: number;
  monthLabel: string;
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

/**
 * The top of the page tells one story: how much of this month's plan is left.
 * Income, expenses and savings rate sit underneath as supporting facts.
 */
export function MonthHero({
  summary,
  previous,
  previousLabel,
  plannedCents,
  monthLabel,
}: MonthHeroProps) {
  const remaining = plannedCents - summary.expenseCents;
  const over = remaining < 0;
  const hasPrevious =
    previous !== null &&
    (previous.incomeCents > 0 || previous.expenseCents > 0);
  const compare = hasPrevious ? previous : null;

  // The bar runs from zero to whichever is larger, the plan or the spending.
  const scale = Math.max(plannedCents, summary.expenseCents, 1);
  const spentWidth = (summary.expenseCents / scale) * 100;
  const planTick = (plannedCents / scale) * 100;
  const tone = over
    ? "over"
    : plannedCents > 0 && summary.expenseCents / plannedCents >= 0.85
      ? "near"
      : "ok";

  return (
    <section className="hero" aria-labelledby="overview-heading">
      <div className="hero__main">
        <h2 id="overview-heading" className="hero__label">
          {over ? "Over budget in" : "Left to spend in"} {monthLabel}
        </h2>
        <p className={`hero__figure${over ? " hero__figure--over" : ""}`}>
          {formatMoney(Math.abs(remaining))}
        </p>
        <p className="hero__note">
          {over ? "Over the " : "Of the "}
          {formatMoney(plannedCents)} plan
        </p>
      </div>

      <div className="hero__meter">
        <div className="meter" aria-hidden="true">
          <div
            className={`meter__fill meter__fill--${tone}`}
            style={{ width: `${spentWidth}%` }}
          />
          {over && (
            <div className="meter__tick" style={{ left: `${planTick}%` }} />
          )}
        </div>
        <p className="meter__legend">
          <span>
            <span className="sr-only">Spent </span>
            {formatMoney(summary.expenseCents)} spent
          </span>
          <span>
            <span className="sr-only">Planned </span>
            {formatMoney(plannedCents)} planned
          </span>
        </p>
      </div>

      <dl className="facts">
        <div className="fact">
          <dt>
            <span className="indicator indicator--income" aria-hidden="true">
              <ArrowUpIcon />
            </span>
            Income
          </dt>
          <dd className="fact__value">{formatMoney(summary.incomeCents)}</dd>
          <dd className="fact__note">
            {changeText(
              summary.incomeCents,
              compare?.incomeCents,
              previousLabel,
            )}
          </dd>
        </div>

        <div className="fact">
          <dt>
            <span className="indicator indicator--expense" aria-hidden="true">
              <ArrowDownIcon />
            </span>
            Expenses
          </dt>
          <dd className="fact__value">{formatMoney(summary.expenseCents)}</dd>
          <dd className="fact__note">
            {changeText(
              summary.expenseCents,
              compare?.expenseCents,
              previousLabel,
            )}
          </dd>
        </div>

        <div className="fact">
          <dt>Savings rate</dt>
          <dd className="fact__value">
            {summary.savingsRate === null
              ? "N/A"
              : formatPercent(summary.savingsRate)}
          </dd>
          <dd className="fact__note">
            {summary.savingsRate === null
              ? "No income recorded this month"
              : summary.netCents >= 0
                ? `${formatMoney(summary.netCents)} left after expenses`
                : `Spent ${formatMoney(-summary.netCents)} more than earned`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
