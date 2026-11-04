import test from "node:test";
import assert from "node:assert/strict";
import { computePrintZoom, printablePageWidthPx, MIN_PRINT_ZOOM } from "./printReport";

test("largura útil: paisagem é maior que retrato, sem as margens de 8 mm", () => {
  assert.equal(Math.round(printablePageWidthPx("landscape")), 1062); // (297 - 16) mm
  assert.equal(Math.round(printablePageWidthPx("portrait")), 733); // (210 - 16) mm
});

test("conteúdo que cabe na folha não é reduzido nem ampliado", () => {
  assert.equal(computePrintZoom(900, "landscape"), 1);
  assert.equal(computePrintZoom(1062, "landscape"), 1);
});

test("conteúdo largo é reduzido na proporção da folha", () => {
  assert.equal(computePrintZoom(1500, "landscape"), 0.708);
  assert.equal(computePrintZoom(1500, "portrait"), 0.489);
});

test("a redução nunca passa do piso de legibilidade", () => {
  assert.equal(computePrintZoom(5000, "portrait"), MIN_PRINT_ZOOM);
});

test("largura inválida não quebra a impressão", () => {
  assert.equal(computePrintZoom(0, "landscape"), 1);
  assert.equal(computePrintZoom(NaN, "portrait"), 1);
});
