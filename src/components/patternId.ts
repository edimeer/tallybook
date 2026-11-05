import type { Category } from "../types";

/** Pattern id for a category. Shared by the chart slices and the legend swatches. */
export const patternId = (category: Category): string =>
  `pattern-${category.id}`;
