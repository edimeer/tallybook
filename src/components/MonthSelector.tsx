import { useId } from "react";
import { formatMonth } from "../lib/dates";
import type { MonthKey } from "../types";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface MonthSelectorProps {
  /** Every selectable month, oldest first. */
  months: MonthKey[];
  value: MonthKey;
  onChange: (month: MonthKey) => void;
}

export function MonthSelector({ months, value, onChange }: MonthSelectorProps) {
  const selectId = useId();
  const index = months.indexOf(value);
  const previous = index > 0 ? months[index - 1] : null;
  const next =
    index >= 0 && index < months.length - 1 ? months[index + 1] : null;

  return (
    <div className="month-selector" role="group" aria-label="Choose month">
      <button
        type="button"
        className="btn btn--ghost btn--icon"
        disabled={!previous}
        onClick={() => previous && onChange(previous)}
      >
        <ChevronLeftIcon />
        <span className="sr-only">Previous month</span>
      </button>

      <label htmlFor={selectId} className="sr-only">
        Month
      </label>
      <select
        id={selectId}
        className="control month-selector__select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {[...months].reverse().map((month) => (
          <option key={month} value={month}>
            {formatMonth(month)}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn btn--ghost btn--icon"
        disabled={!next}
        onClick={() => next && onChange(next)}
      >
        <ChevronRightIcon />
        <span className="sr-only">Next month</span>
      </button>
    </div>
  );
}
