import React, { useState, useMemo } from 'react';
import { BarChart3, Printer, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Search, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { TechnicalSheet, AppSettings } from '../types';

interface PricingReportTabProps {
  sheets: TechnicalSheet[];
  fixedCostPct: number;
  variableCostPct: number;
  appSettings: AppSettings;
  calculateSuggestedPrice: (costInsumo: number) => number;
  setPrintSheet: (sheet: TechnicalSheet) => void;
  onEditSheet?: (sheet: TechnicalSheet) => void;
}

interface SheetMetrics {
  sheet: TechnicalSheet;
  costInsumo: number;
  sellPrice: number;
  suggestedPrice: number;
  activePrice: number;
  cmvPct: number;
  profitPct: number;
  status: 'healthy' | 'warning' | 'danger';
}

export const PricingReportTab: React.FC<PricingReportTabProps> = ({
  sheets,
  fixedCostPct,
  variableCostPct,
  appSettings,
  calculateSuggestedPrice,
  setPrintSheet,
  onEditSheet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'danger'>('all');

  const taxRate = Number(appSettings.defaultTaxRate) || 6;
  const targetMargin = Number(appSettings.targetReturnMargin) || 20;

  // Fonte única de cálculo: todo card, filtro e linha da tabela lê deste mesmo array,
  // para que o número exibido no resumo NUNCA divirja do que aparece ao clicar/filtrar.
  const allMetrics: SheetMetrics[] = useMemo(() => {
    return sheets.map((sheet) => {
      const costInsumo = Number(sheet.costPerPortion) || 0;
      const sellPrice = Number(sheet.sellingPrice) || 0;
      const suggestedPrice = calculateSuggestedPrice(costInsumo);
      const activePrice = sellPrice > 0 ? sellPrice : (suggestedPrice > 0 ? suggestedPrice : (costInsumo > 0 ? costInsumo * 3.5 : 0));

      const cmvPct = sellPrice > 0 && !isNaN(sheet.cmv) && sheet.cmv > 0
        ? sheet.cmv
        : (activePrice > 0 ? Number(((costInsumo / activePrice) * 100).toFixed(1)) : (costInsumo === 0 ? 0 : 100));

      const totalDeductions = cmvPct + fixedCostPct + variableCostPct + taxRate;
      const profitPct = activePrice > 0 ? Number((100 - totalDeductions).toFixed(1)) : 0;

      let status: SheetMetrics['status'] = 'healthy';
      if (profitPct < 10) status = 'danger';
      else if (profitPct < targetMargin) status = 'warning';

      return { sheet, costInsumo, sellPrice, suggestedPrice, activePrice, cmvPct, profitPct, status };
    });
  }, [sheets, fixedCostPct, variableCostPct, taxRate, targetMargin, calculateSuggestedPrice]);

  const healthyCount = allMetrics.filter(m => m.status === 'healthy').length;
  const warningCount = allMetrics.filter(m => m.status === 'warning').length;
  const dangerCount = allMetrics.filter(m => m.status === 'danger').length;

  // Tabela ordenada da menor para a maior margem: os pratos mais arriscados aparecem primeiro.
  const filteredMetrics = allMetrics
    .filter((m) => {
      const matchesSearch = m.sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (m.sheet.category && m.sheet.category.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return m.status === statusFilter;
    })
    .sort((a, b) => a.profitPct - b.profitPct);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER BANNER 2.0 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-[#1A1513] text-amber-300 rounded-2xl shadow-xs">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Análise de Rentabilidade & Preço Saudável 2.0
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Motor de Inteligência de Preços
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl pt-1">
            Compara o preço praticado com o <strong>Preço Sugerido</strong> considerando Custo dos Itens, Impostos ({appSettings.defaultTaxRate}%), Custos Variáveis ({variableCostPct}%), Custos Fixos ({fixedCostPct}%) e Margem Desejada ({appSettings.targetReturnMargin}%).
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-[#1A1513] hover:bg-[#2A1D17] text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center space-x-2 transition-all shadow-md cursor-pointer shrink-0 active:scale-95"
        >
          <Printer size={16} />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* HEALTH STATUS KPI CARDS 2.0 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`bento-card cursor-pointer ${statusFilter === 'all' ? 'border-[#38261E] ring-2 ring-[#38261E]/10 bg-slate-50/50' : 'hover:border-slate-300'}`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total de Pratos</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-slate-900">{sheets.length}</span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">Todos</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('healthy')}
          className={`bento-card cursor-pointer ${statusFilter === 'healthy' ? 'border-emerald-600 ring-2 ring-emerald-500/10 bg-emerald-50/30' : 'hover:border-emerald-200'}`}
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={15} /> Margem Saudável (&ge; {appSettings.targetReturnMargin}%)
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-emerald-900">{healthyCount}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">Lucro Ótimo</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('warning')}
          className={`bento-card cursor-pointer ${statusFilter === 'warning' ? 'border-amber-600 ring-2 ring-amber-500/10 bg-amber-50/30' : 'hover:border-amber-200'}`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={15} /> Margem Apertada (10-{appSettings.targetReturnMargin - 0.1}%)
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-amber-900">{warningCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl">Atenção</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('danger')}
          className={`bento-card cursor-pointer ${statusFilter === 'danger' ? 'border-red-600 ring-2 ring-red-500/10 bg-red-50/30' : 'hover:border-red-200'}`}
        >
          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={15} /> Em Risco / Prejuízo (&lt; 10%)
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-red-900">{dangerCount}</span>
            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-xl">Urgente</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND CONTROLS */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar prato ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Exibindo <strong className="text-slate-900 font-bold">{filteredMetrics.length}</strong> de {sheets.length} itens</span>
        </div>
      </div>

      {/* MAIN PRICING & HEALTH CARDS / TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Tabela Detalhada de Preços & Status de Saúde</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordenado do maior risco para o maior lucro</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Prato / Receita</th>
                <th className="p-3.5 text-right">Custo Itens</th>
                <th className="p-3.5 text-right">CMV</th>
                <th className="p-3.5 text-right">C. Fixo</th>
                <th className="p-3.5 text-right">C. Variável</th>
                <th className="p-3.5 text-right">Preço Praticado</th>
                <th className="p-3.5 text-right text-emerald-700">Preço Sugerido</th>
                <th className="p-3.5 text-right">Lucro Esperado</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400 italic">
                    Nenhum prato encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map(({ sheet, costInsumo, sellPrice, suggestedPrice, cmvPct, profitPct, status }) => {
                  let statusLabel = 'Saudável 🟢';
                  let statusBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                  let statusDesc = 'Excelente margem de lucro';
                  let barColor = 'bg-emerald-500';

                  if (profitPct < 0) {
                    statusLabel = 'Prejuízo ⛔';
                    statusBg = 'bg-red-200 text-red-900 border-red-300 font-bold';
                    statusDesc = 'Preço abaixo do custo total!';
                    barColor = 'bg-red-600';
                  } else if (status === 'danger') {
                    statusLabel = 'Em Risco 🟠';
                    statusBg = 'bg-orange-100 text-orange-900 border-orange-300';
                    statusDesc = 'Lucro muito baixo, risco de prejuízo';
                    barColor = 'bg-orange-500';
                  } else if (status === 'warning') {
                    statusLabel = 'Apertado 🟡';
                    statusBg = 'bg-amber-100 text-amber-900 border-amber-300';
                    statusDesc = 'Margem inferior à meta ideal';
                    barColor = 'bg-amber-500';
                  }

                  // Barra visual: 0% de margem = vazia, >= 2x a meta = cheia (limitada entre 0 e 100%)
                  const barWidthPct = Math.max(0, Math.min(100, (profitPct / (targetMargin * 2)) * 100));

                  return (
                    <tr key={sheet.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-950">
                        <div className="text-sm font-black">{sheet.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{sheet.category || 'Geral'}</div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                        R$ {costInsumo.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {cmvPct.toFixed(1).replace('.', ',')}%
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-600">
                        {fixedCostPct.toFixed(1).replace('.', ',')}%
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-600">
                        {variableCostPct.toFixed(1).replace('.', ',')}%
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {sellPrice > 0 ? `R$ ${sellPrice.toFixed(2).replace('.', ',')}` : <span className="text-amber-600 text-[10px]">Não Def.</span>}
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                        R$ {suggestedPrice.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="p-3.5 text-right font-mono min-w-[110px]">
                        <div className={`font-black ${profitPct >= targetMargin ? 'text-emerald-700' : profitPct >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
                          {profitPct > 0 ? `+${profitPct.toFixed(1)}%` : `${profitPct.toFixed(1)}%`}
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidthPct}%` }} />
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-block ${statusBg}`}>
                            {statusLabel}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{statusDesc}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {onEditSheet && (
                            <button
                              onClick={() => onEditSheet(sheet)}
                              className="px-2.5 py-1.5 bg-[#38261E] hover:bg-[#201511] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                              title="Editar Preço ou Ficha"
                            >
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => setPrintSheet(sheet)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center space-x-1"
                            title="Imprimir Ficha Técnica"
                          >
                            <Printer size={14} />
                            <span>Ficha</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
