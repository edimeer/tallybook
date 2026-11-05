import type { Category, CategoryKind, TransactionInput } from "../types";
import { MAX_DATE, MIN_DATE, isValidIsoDate } from "./dates";
import { parseAmountToCents } from "./money";

export const DESCRIPTION_MIN = 2;
export const DESCRIPTION_MAX = 80;
/** $1,000,000.00 is far above anything a personal budget needs and catches typos. */
export const MAX_AMOUNT_CENTS = 100_000_000;

/** Raw values as typed into the form. Everything is a string until validated. */
export interface TransactionFormValues {
  type: CategoryKind;
  description: string;
  amount: string;
  date: string;
  categoryId: string;
}

export type FieldName = "description" | "amount" | "date" | "categoryId";
export type FieldErrors = Partial<Record<FieldName, string>>;

export type ValidationResult =
  { ok: true; value: TransactionInput } | { ok: false; errors: FieldErrors };

/** Order used to decide which invalid field receives focus first. */
export const FIELD_ORDER: FieldName[] = [
  "description",
  "amount",
  "date",
  "categoryId",
];

export function validateTransactionForm(
  values: TransactionFormValues,
  categories: Category[],
): ValidationResult {
  const errors: FieldErrors = {};

  const description = values.description.trim().replace(/\s+/g, " ");
  if (description.length < DESCRIPTION_MIN) {
    errors.description = `Enter a description of at least ${DESCRIPTION_MIN} characters.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  }

  const amountCents = parseAmountToCents(values.amount);
  if (values.amount.trim() === "") {
    errors.amount = "Enter an amount.";
  } else if (amountCents === null) {
    errors.amount =
      "Use a positive number with up to two decimals, like 42.50.";
  } else if (amountCents <= 0) {
    errors.amount = "The amount must be greater than zero.";
  } else if (amountCents > MAX_AMOUNT_CENTS) {
    errors.amount = "That amount is too large. The limit is $1,000,000.00.";
  }

  if (values.date === "") {
    errors.date = "Choose a date.";
  } else if (!isValidIsoDate(values.date)) {
    errors.date = "Enter a real date.";
  } else if (values.date < MIN_DATE || values.date > MAX_DATE) {
    errors.date = "Choose a date between 2000 and 2099.";
  }

  const category = categories.find((c) => c.id === values.categoryId);
  if (values.categoryId === "") {
    errors.categoryId = "Choose a category.";
  } else if (!category || category.kind !== values.type) {
    errors.categoryId = `Choose a valid ${values.type} category.`;
  }

  if (Object.keys(errors).length > 0 || amountCents === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      description,
      amountCents,
      date: values.date,
      categoryId: values.categoryId,
    },
  };
}
