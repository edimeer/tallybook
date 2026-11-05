import { useState } from "react";
import { errorMessage } from "../services";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Runs when confirmed. Throwing shows the error inside the dialog. */
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="modal__text">{message}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          autoFocus
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
