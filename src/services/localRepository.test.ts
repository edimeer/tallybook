import { beforeEach, describe, expect, it } from "vitest";
import { createSeedTransactions } from "../data/seedData";
import { NotFoundError, PersistenceError } from "./financeRepository";
import { createLocalRepository } from "./localRepository";

/** Minimal in-memory Storage so the repository can be tested without a browser. */
function fakeStorage(failWrites = false): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => {
      if (failWrites) throw new Error("quota");
      map.set(key, value);
    },
  };
}

const input = {
  date: "2026-10-10",
  description: "Test",
  amountCents: 500,
  categoryId: "dining",
};

describe("local repository", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = fakeStorage();
  });

  it("starts with the starter data", async () => {
    const repo = createLocalRepository(storage);
    expect(await repo.listTransactions()).toEqual(createSeedTransactions());
  });

  it("creates, updates and deletes, and persists between instances", async () => {
    const repo = createLocalRepository(storage);
    const before = (await repo.listTransactions()).length;

    const created = await repo.createTransaction(input);
    expect(
      (await createLocalRepository(storage).listTransactions()).length,
    ).toBe(before + 1);

    const updated = await repo.updateTransaction(created.id, {
      ...input,
      description: "Renamed",
    });
    expect(updated.description).toBe("Renamed");

    await repo.deleteTransaction(created.id);
    expect((await repo.listTransactions()).length).toBe(before);
    await expect(repo.deleteTransaction(created.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("clears and restores the starter data", async () => {
    const repo = createLocalRepository(storage);
    await repo.clearAllData?.();
    expect(await repo.listTransactions()).toEqual([]);
    await repo.restoreStarterData?.();
    expect(await repo.listTransactions()).toEqual(createSeedTransactions());
  });

  it("falls back to starter data when stored data is corrupted", async () => {
    storage.setItem("tallybook:v1", "{not json");
    const repo = createLocalRepository(storage);
    expect(await repo.listTransactions()).toEqual(createSeedTransactions());

    storage.setItem(
      "tallybook:v1",
      JSON.stringify({ version: 1, transactions: [{ id: 1 }] }),
    );
    expect(await repo.listTransactions()).toEqual(createSeedTransactions());
  });

  it("reports a readable error when storage cannot be written", async () => {
    const repo = createLocalRepository(fakeStorage(true));
    await expect(repo.createTransaction(input)).rejects.toBeInstanceOf(
      PersistenceError,
    );
  });
});
