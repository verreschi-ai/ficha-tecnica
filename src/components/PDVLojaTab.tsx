import React, { useState, useMemo } from 'react';
import { TechnicalSheet, AppSettings } from '../types';
import { Store, Search, Printer, Calculator, Info } from 'lucide-react';

interface PDVLojaTabProps {
  sheets: TechnicalSheet[];
  custoFixoPorPratoRS: number;
  variableCostPct: number;
  appSettings: AppSettings;
  calculateSuggestedPrice: (costInsumo: number) => number;
}

export const PDVLojaTab: React.FC<PDVLojaTabProps> = ({
  sheets,
  custoFixoPorPratoRS,
  variableCostPct,
  appSettings,
  calculateSuggestedPrice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const taxRate = Number(appSettings.defaultTaxRate) || 6;
  const targetMargin = Number(appSettings.targetReturnMargin) || 20;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // PDV/Balcão é o canal SEM comissão de plataforma — é a referência (baseline) usada como
  // ponto de partida pelo iFood e pelo 99Food, que somam suas próprias taxas em cima disso.
  const metrics = useMemo(() => {
    return sheets.map((sheet) => {
      const costInsumo = Number(sheet.costPerPortion) || 0;
      const sellPrice = Number(sheet.sellingPrice) || 0;
      const suggestedPrice = calculateSuggestedPrice(costInsumo);
      const activePrice = sellPrice > 0 ? sellPrice : suggestedPrice;

      const cmvPct = activePrice > 0 ? Number(((costInsumo / activePrice) * 100).toFixed(1)) : 0;
      const fixedPct = activePrice > 0 ? Number(((custoFixoPorPratoRS / activePrice) * 100).toFixed(1)) : 0;
      const profitPct = activePrice > 0 ? Number((100 - (cmvPct + fixedPct + variableCostPct + taxRate)).toFixed(1)) : 0;

      let status: 'healthy' | 'warning' | 'danger' = 'healthy';
      if (profitPct < 10) status = 'danger';
      else if (profitPct < targetMargin) status = 'warning';

      return { sheet, costInsumo, sellPrice, suggestedPrice, activePrice, cmvPct, fixedPct, profitPct, status };
    });
  }, [sheets, custoFixoPorPratoRS, variableCostPct, taxRate, targetMargin, calculateSuggestedPrice]);

  const filtered = metrics.filter(m =>
    m.sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.sheet.category && m.sheet.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = filtered.map(m => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${m.sheet.name} <span style="font-size: 10px; color: #666; font-weight: normal;">(${m.sheet.category})</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${m.costInsumo.toFixed(2).replace('.', ',')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #1A1513; background-color: #f5f5f4;">R$ ${m.suggestedPrice.toFixed(2).replace('.', ',')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${m.sellPrice > 0 ? `R$ ${m.sellPrice.toFixed(2).replace('.', ',')}` : '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head><title>Relatório de Preços PDV/Balcão - Base Chef</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1A1513; margin-bottom: 5px;">Relatório de Preços PDV / Balcão 🏪</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Sem comissão de plataforma. Impostos: ${taxRate}% | Custo Variável: ${variableCostPct}% | Custo Fixo/prato: R$ ${custoFixoPorPratoRS.toFixed(2).replace('.', ',')} | Margem Meta: ${targetMargin}%</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead><tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;"><th style="padding: 10px; text-align: left;">Produto / Prato</th><th style="padding: 10px; text-align: right;">Custo Ficha</th><th style="padding: 10px; text-align: right;">Preço Sugerido PDV</th><th style="padding: 10px; text-align: right;">Preço Praticado</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER — neutro, é o canal da própria casa, sem marca de terceiro */}
      <div className="bg-gradient-to-r from-[#2D201A] via-[#1A1513] to-[#1A1513] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Store size={18} className="text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Canal Próprio ⭐ NOVO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-fredoka tracking-tight">
              Preço de Balcão (PDV Loja)
            </h1>
            <p className="text-zinc-300 text-sm sm:text-base max-w-2xl font-medium">
              O preço de referência sem comissão de plataforma — a base sobre a qual iFood e 99Food somam suas próprias taxas.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white text-[#1A1513] flex items-center justify-center font-bold shadow-md">
              <Calculator size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-300 block font-medium">Pratos Analisados</span>
              <span className="text-2xl font-black font-fredoka">{sheets.length} itens</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          Este preço já inclui <strong>CMV + Custo Fixo rateado (R$ {custoFixoPorPratoRS.toFixed(2).replace('.', ',')}/prato) + Impostos ({taxRate}%) + Custo Variável do PDV ({variableCostPct}%) + Margem Meta ({targetMargin}%)</strong> — é o mesmo motor de cálculo do Relatório de Precificação. iFood e 99Food partem deste valor e somam a comissão da plataforma por cima.
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-fredoka">Tabela de Preços PDV / Balcão</h3>
            <p className="text-xs text-slate-500">Sem taxas de terceiros — o valor que sai do seu próprio caixa.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-[#2D201A] hover:bg-[#1A1513] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir / Exportar Lista PDV</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar prato ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Produto / Prato</th>
                <th className="py-3.5 px-4 text-right">CMV</th>
                <th className="py-3.5 px-4 text-right">Custo Fixo</th>
                <th className="py-3.5 px-4 text-right bg-slate-100">Preço Sugerido PDV</th>
                <th className="py-3.5 px-4 text-right">Preço Praticado</th>
                <th className="py-3.5 px-4 text-right">Margem</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Nenhum produto encontrado.</td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.sheet.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <span className="block">{m.sheet.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.sheet.category}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      <div className="font-bold text-slate-800">{formatCurrency(m.costInsumo)}</div>
                      <div className="text-[10px] text-slate-400">{m.cmvPct.toFixed(1)}%</div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      <div className="font-bold text-slate-800">{formatCurrency(custoFixoPorPratoRS)}</div>
                      <div className="text-[10px] text-slate-400">{m.fixedPct.toFixed(1)}%</div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-slate-900 text-sm bg-slate-50">
                      {formatCurrency(m.suggestedPrice)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-slate-600">
                      {m.sellPrice > 0 ? formatCurrency(m.sellPrice) : <span className="text-amber-600 text-[10px]">Não Def.</span>}
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      <span className={`px-2.5 py-1 rounded-lg font-bold ${
                        m.profitPct >= targetMargin ? 'bg-emerald-100 text-emerald-800' :
                        m.profitPct >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {m.profitPct > 0 ? `+${m.profitPct.toFixed(1)}%` : `${m.profitPct.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-block ${
                        m.status === 'healthy' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        m.status === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {m.status === 'healthy' ? '🟢 Saudável' : m.status === 'warning' ? '🟡 Apertado' : '⛔ Risco'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
