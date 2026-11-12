import test from "node:test";
import assert from "node:assert/strict";
import { classifyMargin, riskLimit } from "./marginStatus";

test("meta 20%: faixas em 0, 10 e 20", () => {
  assert.equal(classifyMargin(-0.1, 20), "loss");
  assert.equal(classifyMargin(0, 20), "risk");
  assert.equal(classifyMargin(9.9, 20), "risk");
  assert.equal(classifyMargin(10, 20), "tight");
  assert.equal(classifyMargin(19.9, 20), "tight");
  assert.equal(classifyMargin(20, 20), "healthy");
});

test("meta 8%: prato com 9% é saudável, não 'em risco'", () => {
  assert.equal(classifyMargin(9, 8), "healthy");
  assert.equal(classifyMargin(8, 8), "healthy");
  assert.equal(classifyMargin(5, 8), "tight");
  assert.equal(classifyMargin(3.9, 8), "risk");
});

test("limite de risco é metade da meta", () => {
  assert.equal(riskLimit(8), 4);
  assert.equal(riskLimit(20), 10);
});
