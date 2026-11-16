// Comparação entre os insumos do Ficha Técnica e o app de estoque da loja (Don Giovanni).
// Funções puras: sem rede, sem React. Usadas pelo painel "Estoque da loja" e testadas em estoqueSync.test.ts.

export type ItemDoEstoque = {
  itemId: number;
  codigoFicha: string | null; // id do insumo aqui no Ficha, quando o item veio daqui
  nome: string;
  unidade: string; // unidade do estoque (un, kg, g, L, ml, cx, ...)
  ultimoPreco: number | null; // último preço pago nas notas, na unidade do estoque
  fornecedor: string | null;
  data: string | null; // AAAA-MM-DD
};

export type InsumoFicha = { id: string; name: string; unit: string; unitPrice: number; supplier?: string; isRecipe?: boolean };

export type PrecoNovo = {
  insumoId: string;
  nome: string;
  unidade: string;
  precoAtual: number;
  precoEstoque: number;
  fornecedor: string | null;
  data: string | null;
};

export type ItemNovo = { itemId: number; nome: string; unidade: string; preco: number | null; fornecedor: string | null };

export const normalizarNome = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const unidadeBase = (u: string) => {
  const t = (u || "").trim().toLowerCase();
  if (t === "l" || t === "lt" || t === "litro") return "l";
  if (t === "unidade" || t === "und" || t === "unid") return "un";
  return t;
};

// Converte o preço da unidade do estoque para a unidade do Ficha. Mesma unidade: igual.
// kg↔g e L↔mL: multiplica ou divide por 1000. Sem relação: null (não dá para comparar).
export function precoNaUnidadeDoFicha(preco: number, unidadeEstoque: string, unidadeFicha: string): number | null {
  const de = unidadeBase(unidadeEstoque);
  const para = unidadeBase(unidadeFicha);
  if (de === para) return preco;
  if (de === "kg" && para === "g") return preco / 1000;
  if (de === "g" && para === "kg") return preco * 1000;
  if (de === "l" && para === "ml") return preco / 1000;
  if (de === "ml" && para === "l") return preco * 1000;
  return null;
}

// Unidade do estoque escrita como o Ficha usa nos menus (mL com L maiúsculo).
export const unidadeParaFicha = (u: string) => (unidadeBase(u) === "ml" ? "mL" : unidadeBase(u) === "l" ? "L" : u);

const arred = (n: number) => Math.round(n * 100) / 100;

// Liga cada item do estoque a um insumo daqui (pelo id que veio do Ficha; sem id, pelo nome igual) e devolve:
// - precos: insumos cujo custo aqui está diferente do último preço pago nas notas (diferença de 1 centavo ou mais);
// - novos: itens do estoque que não existem aqui (cadastrados na loja ou vindos de nota).
// Sub-receitas daqui nunca entram: o custo delas sai dos ingredientes.
export function compararComEstoque(insumos: InsumoFicha[], estoque: ItemDoEstoque[]): { precos: PrecoNovo[]; novos: ItemNovo[]; semUnidadeComum: string[] } {
  const compras = insumos.filter((i) => !i.isRecipe);
  const porId = new Map(compras.map((i) => [i.id, i]));
  const porNome = new Map(compras.map((i) => [normalizarNome(i.name), i]));
  const todosOsNomes = new Set(insumos.map((i) => normalizarNome(i.name)));
  const precos: PrecoNovo[] = [];
  const novos: ItemNovo[] = [];
  const semUnidadeComum: string[] = [];

  for (const e of estoque) {
    const insumo = (e.codigoFicha ? porId.get(e.codigoFicha) : undefined) ?? porNome.get(normalizarNome(e.nome));
    if (!insumo) {
      // Nome de sub-receita daqui não vira insumo novo.
      if (!(e.codigoFicha && insumos.some((i) => i.id === e.codigoFicha)) && !todosOsNomes.has(normalizarNome(e.nome))) {
        novos.push({ itemId: e.itemId, nome: e.nome, unidade: unidadeParaFicha(e.unidade), preco: e.ultimoPreco, fornecedor: e.fornecedor });
      }
      continue;
    }
    if (e.ultimoPreco == null) continue;
    const convertido = precoNaUnidadeDoFicha(e.ultimoPreco, e.unidade, insumo.unit);
    if (convertido == null) {
      semUnidadeComum.push(insumo.name);
      continue;
    }
    const novo = arred(convertido);
    if (Math.abs(novo - arred(insumo.unitPrice || 0)) >= 0.01) {
      precos.push({ insumoId: insumo.id, nome: insumo.name, unidade: insumo.unit, precoAtual: insumo.unitPrice || 0, precoEstoque: novo, fornecedor: e.fornecedor, data: e.data });
    }
  }
  precos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  novos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { precos, novos, semUnidadeComum };
}

// Assinatura do que interessa ao estoque (id, nome, unidade, se é receita): só sincroniza quando muda,
// e não a cada ajuste de preço ou de ficha.
export function assinaturaInsumos(insumos: { id: string; name: string; unit: string; isRecipe?: boolean }[]): string {
  return insumos
    .map((i) => `${i.id}|${normalizarNome(i.name)}|${i.unit}|${i.isRecipe ? 1 : 0}`)
    .sort()
    .join("\n");
}
