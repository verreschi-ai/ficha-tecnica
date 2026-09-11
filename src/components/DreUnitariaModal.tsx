import React from 'react';
import { X } from 'lucide-react';
import { TechnicalSheet } from '../types';

interface DreUnitariaModalProps {
  sheet: TechnicalSheet;
  activePrice: number;
  costInsumo: number;
  cmvPct: number;
  fixedCostValue: number;
  fixedCostPctRow: number;
  variableCostValue: number;
  variableCostPct: number;
  taxValue: number;
  taxRate: number;
  profitValue: number;
  profitPct: number;
  onClose: () => void;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const fmtPct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

// DRE Unitária: partindo do preço praticado (100%), cada linha desconta sua fatia real
// do preço — Impostos, Custos Variáveis e Custo Fixo entram como % sobre o preço, e o
// CMV entra pelo valor ABSOLUTO em R$ da ficha técnica (não por uma meta/gatilho fixo de
// CMV%). O que sobra é a Margem de Lucro Líquida de verdade, em R$ e %.
export const DreUnitariaModal: React.FC<DreUnitariaModalProps> = ({
  sheet, activePrice, costInsumo, cmvPct, fixedCostValue, fixedCostPctRow,
  variableCostValue, variableCostPct, taxValue, taxRate, profitValue, profitPct, onClose,
}) => {
  const rows = [
    { label: 'Preço de Venda', value: activePrice, pct: 100, sign: '' },
    { label: 'Impostos', value: taxValue, pct: taxRate, sign: '−' },
    { label: 'Custos Variáveis', value: variableCostValue, pct: variableCostPct, sign: '−' },
    { label: 'Custo Fixo (rateio)', value: fixedCostValue, pct: fixedCostPctRow, sign: '−' },
    { label: 'CMV (Custo Itens)', value: costInsumo, pct: cmvPct, sign: '−' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DRE Unitária</span>
            <h3 className="text-lg font-black text-slate-900">{sheet.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer" title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-600 font-medium">{r.sign} {r.label}</span>
              <div className="text-right">
                <div className="font-bold text-slate-900">{fmt(r.value)}</div>
                <div className="text-[10px] text-slate-400">{fmtPct(r.pct)}</div>
              </div>
            </div>
          ))}
          <div className={`flex items-center justify-between px-4 py-3 text-sm ${profitPct >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <span className="font-black text-slate-900">= Margem de Lucro Líquida</span>
            <div className="text-right">
              <div className={`font-black ${profitPct >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(profitValue)}</div>
              <div className={`text-[10px] font-bold ${profitPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtPct(profitPct)}</div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          O CMV entra pelo custo real da ficha técnica (R$), não por uma meta fixa — por isso
          um prato de ticket baixo pode ter CMV% naturalmente mais alto sem que isso, sozinho,
          signifique prejuízo. O que decide a saúde do prato é o que sobra na última linha.
        </p>
      </div>
    </div>
  );
};
