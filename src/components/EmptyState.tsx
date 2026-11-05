import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  children: ReactNode;
  /** Buttons shown under the text. */
  actions?: ReactNode;
}

export function EmptyState({ title, children, actions }: EmptyStateProps) {
  return (
    <div className="empty">
      <h3 className="empty__title">{title}</h3>
      <p className="empty__text">{children}</p>
      {actions && <div className="empty__actions">{actions}</div>}
    </div>
  );
}
