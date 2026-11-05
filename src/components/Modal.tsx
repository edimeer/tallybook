import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Dialog built on the native <dialog> element. The browser provides the focus trap,
 * the Escape key and the page backdrop. We add focus restoration and click-outside.
 * Render it only while it should be visible.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (previouslyFocused && document.contains(previouslyFocused))
        previouslyFocused.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal__panel">
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
          >
            <CloseIcon />
            <span className="sr-only">Close dialog</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
