import test from "node:test";
import assert from "node:assert/strict";
import { nineninePriceDivisor } from "./ninenineCampaign";

const round4 = (n: number) => Number(n.toFixed(4));

test("sem oferta: só as taxas, igual à conta antiga", () => {
  assert.equal(round4(nineninePriceDivisor({ taxPct: 14.1, discountPct: 0, storeSharePct: 100, logisticsPct: 0 })), 0.859);
});

test("40% off, loja cobre 75%: divisor 0,6154", () => {
  assert.equal(round4(nineninePriceDivisor({ taxPct: 14.1, discountPct: 40, storeSharePct: 75, logisticsPct: 0 })), 0.6154);
});

test("30% off, loja cobre 84%: divisor 0,6493 (o da skill do 99Food)", () => {
  assert.equal(round4(nineninePriceDivisor({ taxPct: 14.1, discountPct: 30, storeSharePct: 84, logisticsPct: 0 })), 0.6493);
});

test("cupom 100% da loja: sem devolução da 99", () => {
  assert.equal(round4(nineninePriceDivisor({ taxPct: 14.1, discountPct: 40, storeSharePct: 100, logisticsPct: 0 })), 0.5154);
});

test("frete grátis em % reduz o divisor", () => {
  assert.equal(round4(nineninePriceDivisor({ taxPct: 14.1, discountPct: 0, storeSharePct: 100, logisticsPct: 6 })), 0.799);
});

test("valores fora de 0–100 são limitados (desconto 100% pago todo pela 99 devolve o preço inteiro)", () => {
  assert.equal(round4(nineninePriceDivisor({ taxPct: 14.1, discountPct: 250, storeSharePct: -10, logisticsPct: 0 })), 1);
});
