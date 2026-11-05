import { useId, useRef, useState, type FormEvent } from "react";
import { centsToInputValue } from "../lib/money";
import { MAX_DATE, MIN_DATE } from "../lib/dates";
import {
  DESCRIPTION_MAX,
  FIELD_ORDER,
  validateTransactionForm,
  type FieldErrors,
  type FieldName,
  type TransactionFormValues,
} from "../lib/validation";
import { errorMessage } from "../services";
import type {
  Category,
  CategoryKind,
  Transaction,
  TransactionInput,
} from "../types";
import { Modal } from "./Modal";

interface TransactionFormProps {
  categories: Category[];
  /** The transaction being edited, or null when adding a new one. */
  editing: Transaction | null;
  /** Date pre-filled for new transactions (YYYY-MM-DD). */
  defaultDate: string;
  /** Saves the transaction. Throwing shows the error in the form. */
  onSave: (input: TransactionInput) => Promise<void>;
  onCancel: () => void;
}

function initialValues(
  editing: Transaction | null,
  categories: Category[],
  defaultDate: string,
): TransactionFormValues {
  if (editing) {
    const kind =
      categories.find((c) => c.id === editing.categoryId)?.kind ?? "expense";
    return {
      type: kind,
      description: editing.description,
      amount: centsToInputValue(editing.amountCents),
      date: editing.date,
      categoryId: editing.categoryId,
    };
  }
  return {
    type: "expense",
    description: "",
    amount: "",
    date: defaultDate,
    categoryId: "",
  };
}

export function TransactionForm({
  categories,
  editing,
  defaultDate,
  onSave,
  onCancel,
}: TransactionFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(() =>
    initialValues(editing, categories, defaultDate),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options = categories.filter((c) => c.kind === values.type);

  function change<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    // Clear the message for a field as soon as the person edits it.
    if (key in errors)
      setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function changeType(type: CategoryKind) {
    // A category belongs to one type, so switching type clears the choice.
    setValues((current) => ({ ...current, type, categoryId: "" }));
    setErrors((current) => ({ ...current, categoryId: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const result = validateTransactionForm(values, categories);
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((field) => result.errors[field]);
      if (first)
        formRef.current
          ?.querySelector<HTMLElement>(`[data-field="${first}"]`)
          ?.focus();
      return;
    }

    setSaving(true);
    try {
      await onSave(result.value);
    } catch (error) {
      setSubmitError(errorMessage(error));
      setSaving(false);
    }
  }

  const fieldProps = (name: FieldName) => ({
    id: `${formId}-${name}`,
    "data-field": name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${formId}-${name}-error` : undefined,
  });

  const fieldError = (name: FieldName) =>
    errors[name] ? (
      <p id={`${formId}-${name}-error`} className="field__error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <Modal
      title={editing ? "Edit transaction" : "Add transaction"}
      onClose={onCancel}
    >
      <form ref={formRef} onSubmit={submit} noValidate className="form">
        <fieldset className="segmented">
          <legend>Type</legend>
          <div className="segmented__group">
            {(["expense", "income"] as const).map((type) => (
              <label key={type} className="segmented__option">
                <input
                  type="radio"
                  name={`${formId}-type`}
                  value={type}
                  checked={values.type === type}
                  onChange={() => changeType(type)}
                />
                <span>{type === "expense" ? "Expense" : "Income"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor={`${formId}-description`}>Description</label>
          <input
            {...fieldProps("description")}
            className="control"
            type="text"
            maxLength={DESCRIPTION_MAX + 20}
            autoComplete="off"
            value={values.description}
            onChange={(event) => change("description", event.target.value)}
          />
          {fieldError("description")}
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor={`${formId}-amount`}>Amount (USD)</label>
            <div className="input-prefix">
              <span aria-hidden="true">$</span>
              <input
                {...fieldProps("amount")}
                className="control"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={values.amount}
                onChange={(event) => change("amount", event.target.value)}
              />
            </div>
            {fieldError("amount")}
          </div>

          <div className="field">
            <label htmlFor={`${formId}-date`}>Date</label>
            <input
              {...fieldProps("date")}
              className="control"
              type="date"
              min={MIN_DATE}
              max={MAX_DATE}
              value={values.date}
              onChange={(event) => change("date", event.target.value)}
            />
            {fieldError("date")}
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${formId}-categoryId`}>Category</label>
          <select
            {...fieldProps("categoryId")}
            className="control"
            value={values.categoryId}
            onChange={(event) => change("categoryId", event.target.value)}
          >
            <option value="">Select a category</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldError("categoryId")}
        </div>

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Add transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
