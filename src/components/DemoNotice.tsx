import { InfoIcon } from "./Icons";

interface DemoNoticeProps {
  onRestore: () => void;
  onClear: () => void;
}

/** Always-visible explanation that the numbers are sample data, with the reset controls. */
export function DemoNotice({ onRestore, onClear }: DemoNoticeProps) {
  return (
    <section className="demo-notice" aria-label="About the demo data">
      <p className="demo-notice__text">
        <InfoIcon />
        <span>
          <strong>Demo data.</strong> These are invented transactions, not
          connected to a bank. Your edits are saved only in this browser.
        </span>
      </p>
      <div className="demo-notice__actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onRestore}
        >
          Restore sample data
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onClear}
        >
          Clear all data
        </button>
      </div>
    </section>
  );
}
