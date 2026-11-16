import React, { useState } from 'react';
import type { RawIngredientItem } from '../types';
import { lerItensDoEstoque } from '../services/estoqueService';
import { compararComEstoque, type ItemNovo, type PrecoNovo } from '../utils/estoqueSync';

// Painel "Estoque da loja" (só aparece na conta da Don Giovanni): traz do app de estoque o último
// preço pago nas notas fiscais e os itens que existem lá e ainda não estão aqui.
// Nada muda sozinho: a pessoa confere e escolhe o que aplicar.

interface Props {
  ingredients: RawIngredientItem[];
  onAplicarPrecos: (mudancas: { id: string; unitPrice: number; supplier: string | null }[]) => void;
  onTrazerItens: (itens: Omit<RawIngredientItem, 'id' | 'lastUpdated'>[]) => void;
}

const reais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 4 : 2 });
const dataBr = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

export const EstoqueLojaPanel: React.FC<Props> = ({ ingredients, onAplicarPrecos, onTrazerItens }) => {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [precos, setPrecos] = useState<PrecoNovo[] | null>(null);
  const [novos, setNovos] = useState<ItemNovo[]>([]);
  const [semUnidade, setSemUnidade] = useState<string[]>([]);
  const [marcPrecos, setMarcPrecos] = useState<Set<string>>(new Set());
  const [marcNovos, setMarcNovos] = useState<Set<number>>(new Set());

  async function buscar() {
    setErro(null);
    setOk(null);
    setCarregando(true);
    try {
      const estoque = await lerItensDoEstoque();
      const r = compararComEstoque(ingredients, estoque);
      setPrecos(r.precos);
      setNovos(r.novos);
      setSemUnidade(r.semUnidadeComum);
      setMarcPrecos(new Set(r.precos.map((p) => p.insumoId)));
      setMarcNovos(new Set());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível falar com o estoque.');
    } finally {
      setCarregando(false);
    }
  }

  function aplicar() {
    const escolhidos = (precos ?? []).filter((p) => marcPrecos.has(p.insumoId));
    if (escolhidos.length === 0) return;
    onAplicarPrecos(escolhidos.map((p) => ({ id: p.insumoId, unitPrice: p.precoEstoque, supplier: p.fornecedor })));
    setOk(`${escolhidos.length} preço(s) atualizado(s). As fichas técnicas foram recalculadas.`);
    setPrecos((precos ?? []).filter((p) => !marcPrecos.has(p.insumoId)));
    setMarcPrecos(new Set());
  }

  function trazer() {
    const escolhidos = novos.filter((n) => marcNovos.has(n.itemId));
    if (escolhidos.length === 0) return;
    onTrazerItens(
      escolhidos.map((n) => ({
        code: '',
        name: n.nome,
        unit: n.unidade,
        unitPrice: n.preco ?? 0,
        fc: 1,
        supplier: n.fornecedor ?? '',
        category: 'Geral',
        isRecipe: false,
      }))
    );
    setOk(`${escolhidos.length} item(ns) trazido(s) do estoque. Confira o preço dos que não tinham nota.`);
    setNovos(novos.filter((n) => !marcNovos.has(n.itemId)));
    setMarcNovos(new Set());
  }

  const alternar = <T,>(conjunto: Set<T>, v: T) => {
    const novo = new Set(conjunto);
    if (novo.has(v)) novo.delete(v);
    else novo.add(v);
    return novo;
  };

  return (
    <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">Estoque da loja</h3>
          <p className="text-xs text-slate-600">
            Preço real pago nas notas fiscais e itens cadastrados no app de estoque. Os insumos novos daqui já vão para o estoque sozinhos.
          </p>
        </div>
        <button
          type="button"
          onClick={buscar}
          disabled={carregando}
          className="min-h-[40px] rounded-xl bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
        >
          {carregando ? 'Consultando…' : precos ? 'Consultar de novo' : 'Buscar preços do estoque'}
        </button>
      </div>

      {erro && <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-red-800">{erro}</p>}
      {ok && <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-emerald-900">{ok}</p>}

      {precos && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold">Preços diferentes do último pago ({precos.length})</h4>
            {precos.length === 0 ? (
              <p className="text-slate-600">Todos os preços estão iguais aos das últimas notas.</p>
            ) : (
              <>
                <ul className="mt-2 divide-y divide-emerald-100 rounded-xl border border-emerald-100 bg-white">
                  {precos.map((p) => (
                    <li key={p.insumoId}>
                      <label className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                        <input type="checkbox" checked={marcPrecos.has(p.insumoId)} onChange={() => setMarcPrecos(alternar(marcPrecos, p.insumoId))} />
                        <span className="min-w-0 flex-1 font-medium">{p.nome}</span>
                        <span className="tabular-nums text-slate-500 line-through">{reais(p.precoAtual)}</span>
                        <span className="font-semibold tabular-nums">
                          {reais(p.precoEstoque)}/{p.unidade}
                        </span>
                        <span className="w-full text-xs text-slate-500">
                          {[p.fornecedor, dataBr(p.data)].filter(Boolean).join(' · ')}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={aplicar} disabled={marcPrecos.size === 0} className="mt-2 min-h-[40px] rounded-xl bg-emerald-700 px-4 font-semibold text-white disabled:opacity-50">
                  Atualizar {marcPrecos.size} preço(s)
                </button>
              </>
            )}
            {semUnidade.length > 0 && (
              <p className="mt-2 text-xs text-amber-800">
                Unidade diferente entre os apps (não dá para comparar): {semUnidade.join(', ')}.
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold">No estoque e ainda não aqui ({novos.length})</h4>
            {novos.length === 0 ? (
              <p className="text-slate-600">Nenhum item novo no estoque.</p>
            ) : (
              <>
                <ul className="mt-2 divide-y divide-emerald-100 rounded-xl border border-emerald-100 bg-white">
                  {novos.map((n) => (
                    <li key={n.itemId}>
                      <label className="flex cursor-pointer flex-wrap items-center gap-3 px-3 py-2">
                        <input type="checkbox" checked={marcNovos.has(n.itemId)} onChange={() => setMarcNovos(alternar(marcNovos, n.itemId))} />
                        <span className="min-w-0 flex-1 font-medium">{n.nome}</span>
                        <span className="tabular-nums text-slate-600">{n.preco != null ? `${reais(n.preco)}/${n.unidade}` : `sem nota · ${n.unidade}`}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={trazer} disabled={marcNovos.size === 0} className="mt-2 min-h-[40px] rounded-xl border border-emerald-700 px-4 font-semibold text-emerald-800 disabled:opacity-50">
                  Trazer {marcNovos.size} item(ns) para o Ficha
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
