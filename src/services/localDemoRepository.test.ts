import { beforeEach, describe, expect, it } from "vitest";
import { createDemoTransactions } from "../data/demoData";
import { NotFoundError, PersistenceError } from "./financeRepository";
import { createLocalDemoRepository } from "./localDemoRepository";

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

describe("local demo repository", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = fakeStorage();
  });

  it("starts with the sample data", async () => {
    const repo = createLocalDemoRepository(storage);
    expect(await repo.listTransactions()).toEqual(createDemoTransactions());
  });

  it("creates, updates and deletes, and persists between instances", async () => {
    const repo = createLocalDemoRepository(storage);
    const before = (await repo.listTransactions()).length;

    const created = await repo.createTransaction(input);
    expect(
      (await createLocalDemoRepository(storage).listTransactions()).length,
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

  it("clears and restores the sample data", async () => {
    const repo = createLocalDemoRepository(storage);
    await repo.clearAllData?.();
    expect(await repo.listTransactions()).toEqual([]);
    await repo.resetDemoData?.();
    expect(await repo.listTransactions()).toEqual(createDemoTransactions());
  });

  it("falls back to sample data when stored data is corrupted", async () => {
    storage.setItem("tallybook:demo:v1", "{not json");
    const repo = createLocalDemoRepository(storage);
    expect(await repo.listTransactions()).toEqual(createDemoTransactions());

    storage.setItem(
      "tallybook:demo:v1",
      JSON.stringify({ version: 1, transactions: [{ id: 1 }] }),
    );
    expect(await repo.listTransactions()).toEqual(createDemoTransactions());
  });

  it("reports a readable error when storage cannot be written", async () => {
    const repo = createLocalDemoRepository(fakeStorage(true));
    await expect(repo.createTransaction(input)).rejects.toBeInstanceOf(
      PersistenceError,
    );
  });
});
