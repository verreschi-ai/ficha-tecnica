import { test } from "node:test";
import assert from "node:assert/strict";
import { assinaturaInsumos, compararComEstoque, precoNaUnidadeDoFicha, unidadeParaFicha, type InsumoFicha, type ItemDoEstoque } from "./estoqueSync";

const insumos: InsumoFicha[] = [
  { id: "raw-1", name: "Mussarela", unit: "kg", unitPrice: 30 },
  { id: "raw-2", name: "Açúcar", unit: "g", unitPrice: 0.005 },
  { id: "raw-3", name: "Refrigerante Lata", unit: "un", unitPrice: 4 },
  { id: "raw-4", name: "Molho da Casa", unit: "kg", unitPrice: 9, isRecipe: true },
  { id: "raw-5", name: "Óleo", unit: "L", unitPrice: 8 },
];
const item = (parcial: Partial<ItemDoEstoque>): ItemDoEstoque => ({ itemId: 1, codigoFicha: null, nome: "", unidade: "un", ultimoPreco: null, fornecedor: null, data: null, ...parcial });

test("preço convertido para a unidade do Ficha", () => {
  assert.equal(precoNaUnidadeDoFicha(32, "kg", "kg"), 32);
  assert.equal(precoNaUnidadeDoFicha(6, "kg", "g"), 0.006);
  assert.equal(precoNaUnidadeDoFicha(0.01, "g", "kg"), 10);
  assert.equal(precoNaUnidadeDoFicha(9, "L", "mL"), 0.009);
  assert.equal(precoNaUnidadeDoFicha(5, "cx", "un"), null);
  assert.equal(unidadeParaFicha("ml"), "mL");
  assert.equal(unidadeParaFicha("cx"), "cx");
});

test("comparação: preço diferente vira atualização; igual não; sem preço não; unidade sem relação avisa", () => {
  const r = compararComEstoque(insumos, [
    item({ itemId: 1, codigoFicha: "raw-1", nome: "Mussarela Fatiada", unidade: "kg", ultimoPreco: 32.5, fornecedor: "Atacado", data: "2026-11-10" }),
    item({ itemId: 2, nome: "acucar", unidade: "kg", ultimoPreco: 5 }), // ligado pelo nome (sem acento/maiúscula); 5/kg = 0,005/g: igual
    item({ itemId: 3, codigoFicha: "raw-3", nome: "Refrigerante Lata", unidade: "un", ultimoPreco: null }),
    item({ itemId: 5, codigoFicha: "raw-5", nome: "Óleo", unidade: "cx", ultimoPreco: 90 }),
  ]);
  assert.deepEqual(r.precos, [
    { insumoId: "raw-1", nome: "Mussarela", unidade: "kg", precoAtual: 30, precoEstoque: 32.5, fornecedor: "Atacado", data: "2026-11-10" },
  ]);
  assert.deepEqual(r.semUnidadeComum, ["Óleo"]);
  assert.deepEqual(r.novos, []);
});

test("itens novos: só o que não existe aqui; sub-receita com o mesmo nome não vira insumo", () => {
  const r = compararComEstoque(insumos, [
    item({ itemId: 7, nome: "Calabresa", unidade: "kg", ultimoPreco: 28, fornecedor: "Frigorífico" }),
    item({ itemId: 8, nome: "molho da casa", unidade: "kg" }),
    item({ itemId: 9, nome: "Creme de Leite", unidade: "ml", ultimoPreco: 0.02 }),
  ]);
  assert.deepEqual(
    r.novos.map((n) => [n.nome, n.unidade, n.preco]),
    [
      ["Calabresa", "kg", 28],
      ["Creme de Leite", "mL", 0.02],
    ],
  );
});

test("assinatura só muda com id, nome, unidade ou tipo (não com preço)", () => {
  const a = assinaturaInsumos(insumos);
  assert.equal(assinaturaInsumos(insumos.map((i) => ({ ...i, unitPrice: 999 }))), a);
  assert.equal(assinaturaInsumos([...insumos].reverse()), a, "ordem não importa");
  assert.notEqual(assinaturaInsumos(insumos.map((i) => (i.id === "raw-1" ? { ...i, name: "Mussarela Bola" } : i))), a);
});
