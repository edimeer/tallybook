import type { Budget, Category, MonthKey, Transaction } from "../types";

/**
 * Sample data. Everything here is invented; nothing comes from a real account.
 * Transactions are generated from a seeded random number generator, so the demo
 * looks the same for every visitor and on every reload.
 */

export const DEMO_CATEGORIES: Category[] = [
  {
    id: "housing",
    name: "Housing",
    kind: "expense",
    color: "#2f5d50",
    pattern: "solid",
  },
  {
    id: "groceries",
    name: "Groceries",
    kind: "expense",
    color: "#d98e04",
    pattern: "diag",
  },
  {
    id: "dining",
    name: "Dining out",
    kind: "expense",
    color: "#c8553d",
    pattern: "dots",
  },
  {
    id: "transport",
    name: "Transport",
    kind: "expense",
    color: "#3d6fb6",
    pattern: "cross",
  },
  {
    id: "utilities",
    name: "Utilities",
    kind: "expense",
    color: "#7a5ea8",
    pattern: "horiz",
  },
  {
    id: "health",
    name: "Health",
    kind: "expense",
    color: "#2c9aa0",
    pattern: "vert",
  },
  {
    id: "fun",
    name: "Entertainment",
    kind: "expense",
    color: "#b8457b",
    pattern: "diag-rev",
  },
  {
    id: "shopping",
    name: "Shopping",
    kind: "expense",
    color: "#8a6d3b",
    pattern: "checks",
  },
  {
    id: "salary",
    name: "Salary",
    kind: "income",
    color: "#1d6b4f",
    pattern: "solid",
  },
  {
    id: "freelance",
    name: "Freelance",
    kind: "income",
    color: "#4b8f6e",
    pattern: "diag",
  },
  {
    id: "other-income",
    name: "Other income",
    kind: "income",
    color: "#6aa58a",
    pattern: "dots",
  },
];

/** Monthly plan per expense category, in cents. */
export const DEMO_BUDGETS: Budget[] = [
  { categoryId: "housing", plannedCents: 175000 },
  { categoryId: "groceries", plannedCents: 60000 },
  { categoryId: "dining", plannedCents: 28000 },
  { categoryId: "transport", plannedCents: 18000 },
  { categoryId: "utilities", plannedCents: 23000 },
  { categoryId: "health", plannedCents: 9000 },
  { categoryId: "fun", plannedCents: 12000 },
  { categoryId: "shopping", plannedCents: 20000 },
];

/** The months the sample data covers, oldest first. */
export const DEMO_MONTHS: MonthKey[] = [
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
];

/** The month shown on first load. */
export const DEFAULT_MONTH: MonthKey = DEMO_MONTHS[DEMO_MONTHS.length - 1];

// --- generator ---------------------------------------------------------------

/** Small deterministic PRNG (mulberry32). Same seed gives the same sequence. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dollars = (amount: number): number => Math.round(amount * 100);

const GROCERY_STORES = [
  "Green Basket Market",
  "Corner Co-op",
  "Fresh Mart",
  "Sunday Farmers Market",
];
const DINING_SPOTS = [
  "Luna Taqueria",
  "Birch Coffee",
  "Noodle House",
  "Slice Brothers Pizza",
  "Harbor Bistro",
  "Morning Bakery",
];
const SHOPS = [
  "Threadline Apparel",
  "Paperkite Books",
  "Homestead Goods",
  "Northside Hardware",
];
const FUN = [
  "Cinema 9 tickets",
  "Riverside Concert",
  "Escape room night",
  "Board game cafe",
];

export function createDemoTransactions(): Transaction[] {
  const result: Transaction[] = [];

  DEMO_MONTHS.forEach((month, monthIndex) => {
    const random = createRandom(2026 * 100 + monthIndex);
    const between = (min: number, max: number) => min + random() * (max - min);
    const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];
    const day = (n: number) => `${month}-${String(n).padStart(2, "0")}`;

    let counter = 0;
    const add = (
      date: string,
      description: string,
      amount: number,
      categoryId: string,
    ) => {
      counter += 1;
      result.push({
        id: `demo-${month.replace("-", "")}-${String(counter).padStart(2, "0")}`,
        date,
        description,
        amountCents: dollars(amount),
        categoryId,
      });
    };

    // Income
    add(day(1), "Paycheck, Northwind Labs", 2850, "salary");
    add(day(15), "Paycheck, Northwind Labs", 2850, "salary");
    if (monthIndex % 3 !== 2) {
      add(
        day(20),
        pick([
          "Logo design project",
          "Website fixes for a client",
          "Workshop fee",
        ]),
        between(380, 1150),
        "freelance",
      );
    }
    add(day(28), "Savings account interest", between(14, 22), "other-income");

    // Fixed costs
    add(day(1), "Rent, Maple Street Apartments", 1650, "housing");
    add(day(5), "Renter's insurance", 18, "housing");
    add(day(3), "Climb Gym membership", 38, "health");
    add(day(8), "Home internet", 65, "utilities");
    add(day(12), "Electric and gas", between(68, 118), "utilities");
    add(day(17), "Mobile plan", 45, "utilities");
    add(day(9), "Streaming bundle", 15.99, "fun");
    add(day(2), "Monthly transit pass", 82, "transport");

    // Variable costs
    const groceryTrips = 7 + Math.floor(random() * 3);
    for (let i = 0; i < groceryTrips; i += 1) {
      const date = day(2 + Math.floor((i * 27) / groceryTrips));
      add(date, pick(GROCERY_STORES), between(24, 96), "groceries");
    }

    const diningCount = 6 + Math.floor(random() * 4);
    for (let i = 0; i < diningCount; i += 1) {
      add(
        day(3 + Math.floor(random() * 25)),
        pick(DINING_SPOTS),
        between(6, 52),
        "dining",
      );
    }

    const rideCount = 1 + Math.floor(random() * 3);
    for (let i = 0; i < rideCount; i += 1) {
      add(
        day(4 + Math.floor(random() * 24)),
        "Rideshare",
        between(11, 34),
        "transport",
      );
    }

    add(
      day(6 + Math.floor(random() * 20)),
      "Corner Pharmacy",
      between(9, 41),
      "health",
    );
    add(day(10 + Math.floor(random() * 16)), pick(FUN), between(18, 70), "fun");

    const shopCount = 1 + Math.floor(random() * 3);
    for (let i = 0; i < shopCount; i += 1) {
      add(
        day(5 + Math.floor(random() * 22)),
        pick(SHOPS),
        between(22, 125),
        "shopping",
      );
    }
  });

  return result;
}
