import type { BudgetRow, BudgetStatus } from "../lib/calculations";
import { formatMoney } from "../lib/money";
import { AlertIcon } from "./Icons";

interface BudgetPanelProps {
  rows: BudgetRow[];
  plannedCents: number;
  actualCents: number;
  monthLabel: string;
}

function statusText(row: BudgetRow): string {
  switch (row.status) {
    case "over":
      return `Over by ${formatMoney(-row.remainingCents)}`;
    case "near":
      return `Near limit, ${formatMoney(row.remainingCents)} left`;
    case "unbudgeted":
      return "No budget set";
    default:
      return `${formatMoney(row.remainingCents)} left`;
  }
}

const STATUS_CLASS: Record<BudgetStatus, string> = {
  ok: "ok",
  near: "near",
  over: "over",
  unbudgeted: "over",
};

export function BudgetPanel({
  rows,
  plannedCents,
  actualCents,
  monthLabel,
}: BudgetPanelProps) {
  return (
    <section className="card panel" aria-labelledby="budget-heading">
      <header className="panel__header">
        <h2 id="budget-heading" className="panel__title">
          Monthly budget
        </h2>
        <p className="panel__subtitle">
          {formatMoney(actualCents)} of {formatMoney(plannedCents)} spent in{" "}
          {monthLabel}
        </p>
      </header>

      <ul className="budget-list">
        {rows.map((row) => {
          const tone = STATUS_CLASS[row.status];
          const width = Math.min(row.ratio, 1) * 100;
          return (
            <li key={row.category.id} className="budget-row">
              <div className="budget-row__top">
                <span className="budget-row__name">{row.category.name}</span>
                <span
                  className={`budget-row__status budget-row__status--${tone}`}
                >
                  {(row.status === "over" || row.status === "unbudgeted") && (
                    <AlertIcon />
                  )}
                  {statusText(row)}
                </span>
              </div>
              <div className="bar" aria-hidden="true">
                <div
                  className={`bar__fill bar__fill--${tone}`}
                  style={{
                    width: `${row.status === "unbudgeted" ? 100 : width}%`,
                  }}
                />
              </div>
              <p className="budget-row__figures">
                <span>
                  <span className="sr-only">Spent </span>
                  {formatMoney(row.actualCents)}
                </span>
                <span>
                  <span className="sr-only">Planned </span>
                  {formatMoney(row.plannedCents)}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
