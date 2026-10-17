import test from "node:test";
import assert from "node:assert/strict";
import { newDb } from "pg-mem";
import { createExportStore } from "./exportStore";

const snapshot = (n: number) => ({
  sheets: [{ id: "p1", name: "Pizza", sellingPrice: 61 + n }],
  insumos: [],
  fixedCosts: { monthlyRevenue: 120000, fixedExpenses: [{ id: "f1", name: "Aluguel", amount: 5000 }], employees: [{ id: "e1", name: "Ana" }] },
  variableCosts: { items: [] },
  appSettings: { defaultTaxRate: 6, targetReturnMargin: 20 },
  updatedAt: "2026-10-17T12:00:00.000Z",
});

test("o snapshot sobrevive a um reinício do servidor (novo store, mesmo banco)", async () => {
  const pool = new (newDb({ noAstCoverageCheck: true }).adapters.createPg().Pool)();
  const antes = createExportStore(pool);
  await antes.save("Dono@Exemplo.com", snapshot(0));

  const depoisDoReinicio = createExportStore(pool);
  assert.deepEqual(await depoisDoReinicio.load("dono@exemplo.com"), snapshot(0));
});

test("salvar de novo substitui o snapshot anterior (um por e-mail)", async () => {
  const pool = new (newDb({ noAstCoverageCheck: true }).adapters.createPg().Pool)();
  const store = createExportStore(pool);
  await store.save("dono@exemplo.com", snapshot(0));
  await store.save("dono@exemplo.com", snapshot(5));

  assert.equal((await store.load<any>("dono@exemplo.com"))!.sheets[0].sellingPrice, 66);
  const total = await pool.query("SELECT count(*)::int AS n FROM export_snapshots");
  assert.equal(total.rows[0].n, 1);
});

test("e-mail sem snapshot devolve null; e-mails diferentes não se misturam", async () => {
  const pool = new (newDb({ noAstCoverageCheck: true }).adapters.createPg().Pool)();
  const store = createExportStore(pool);
  assert.equal(await store.load("ninguem@exemplo.com"), null);
  await store.save("a@exemplo.com", snapshot(0));
  assert.equal(await store.load("b@exemplo.com"), null);
});

test("se criar a tabela falhar, a próxima chamada tenta de novo", async () => {
  const real = new (newDb({ noAstCoverageCheck: true }).adapters.createPg().Pool)();
  let falhas = 1;
  const pool = {
    query: async (text: string, params?: unknown[]) => {
      if (falhas > 0 && text.includes("CREATE TABLE")) {
        falhas--;
        throw new Error("banco acordando");
      }
      return real.query(text, params);
    },
  };
  const store = createExportStore(pool);
  await assert.rejects(store.save("a@exemplo.com", snapshot(0)), /banco acordando/);
  await store.save("a@exemplo.com", snapshot(0));
  assert.deepEqual(await store.load("a@exemplo.com"), snapshot(0));
});
