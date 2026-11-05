import type { FinanceRepository } from "./financeRepository";
import { createLocalRepository } from "./localRepository";

/**
 * Picks the data source for the whole app.
 *
 * The local repository is the default and the only one built so far.
 * When a Rails API exists, add an `createApiRepository(baseUrl)` here and choose it
 * from a public build-time setting such as `import.meta.env.VITE_API_URL`.
 * Never put secrets in a VITE_ variable: they are visible to every visitor.
 */
export function createRepository(): FinanceRepository {
  return createLocalRepository();
}

export { errorMessage } from "./financeRepository";
export type { FinanceRepository } from "./financeRepository";
