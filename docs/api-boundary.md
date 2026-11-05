# API boundary

The UI reads and writes data only through `FinanceRepository`, defined in `src/services/financeRepository.ts`. The first version implements it with browser storage (`src/services/localRepository.ts`). A Rails JSON API can implement the same interface later without changing any component.

This is a contract only. No backend is built.

## The interface

```ts
interface FinanceRepository {
  readonly mode: 'local' | 'api'
  listCategories(): Promise<Category[]>
  listBudgets(): Promise<Budget[]>
  listTransactions(): Promise<Transaction[]>
  createTransaction(input: TransactionInput): Promise<Transaction>
  updateTransaction(id: string, input: TransactionInput): Promise<Transaction>
  deleteTransaction(id: string): Promise<void>
  restoreStarterData?(): Promise<Transaction[]>   // local only
  clearAllData?(): Promise<Transaction[]>    // local only
}
```

Errors are thrown as `Error` objects with a message that is safe to show to people (the UI displays `error.message`).

## Suggested endpoints

| Method | Path                        | Maps to                |
| ------ | --------------------------- | ---------------------- |
| GET    | `/api/v1/categories`        | `listCategories`       |
| GET    | `/api/v1/budgets`           | `listBudgets`          |
| GET    | `/api/v1/transactions`      | `listTransactions`     |
| POST   | `/api/v1/transactions`      | `createTransaction`    |
| PATCH  | `/api/v1/transactions/:id`  | `updateTransaction`    |
| DELETE | `/api/v1/transactions/:id`  | `deleteTransaction`    |

For larger data sets, `GET /transactions` should accept `?from=YYYY-MM-DD&to=YYYY-MM-DD` and the repository would load one month at a time. The first version loads everything because the data set is small.

## JSON shapes

```json
// Category
{ "id": "groceries", "name": "Groceries", "kind": "expense", "color": "#d98e04", "pattern": "diag" }

// Budget (planned monthly amount, in cents)
{ "categoryId": "groceries", "plannedCents": 60000 }

// Transaction
{
  "id": "5f0c...",
  "date": "2026-10-14",
  "description": "Green Basket Market",
  "amountCents": 5420,
  "categoryId": "groceries"
}
```

Rules the API must enforce too (the client validates them for usability, the server for safety):

- `amountCents`: positive integer, at most 100,000,000
- `date`: real calendar date between 2000-01-01 and 2099-12-31
- `description`: 2 to 80 characters after trimming
- `categoryId`: must exist, and its `kind` decides whether the transaction is income or expense

Validation failures should return HTTP 422 with a readable message the repository can throw.

## Switching to the API

1. Write `createApiRepository(baseUrl)` in `src/services/apiRepository.ts`, returning an object with `mode: 'api'` that implements the methods above using `fetch`.
2. In `src/services/index.ts`, return it from `createRepository()` when a public setting such as `import.meta.env.VITE_API_URL` is set. Otherwise keep returning the local repository, which stays the default.
3. With `mode: 'api'` the UI hides the reset and clear actions automatically.

## Authentication and secrets

A static site cannot keep secrets: every `VITE_` variable is visible to visitors. Use a session cookie or token issued by Rails after sign-in, and never embed API keys in client code. Configure CORS (for example with `rack-cors`) to allow the GitHub Pages origin, and prefer `SameSite` cookies or short-lived tokens.
