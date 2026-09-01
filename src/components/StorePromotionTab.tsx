import React, { useState } from 'react';
import { TechnicalSheet } from '../types';
import { Tag, Percent, DollarSign, Search, Sparkles, Calculator, Flame, Printer, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

interface StorePromotionTabProps {
  sheets: TechnicalSheet[];
}

export const StorePromotionTab: React.FC<StorePromotionTabProps> = ({ sheets }) => {
  // Campaign simulation state
  const [directDiscountPct, setDirectDiscountPct] = useState<number>(10.0); // Desconto direto em %
  const [comboDiscountPct, setComboDiscountPct] = useState<number>(15.0); // Desconto de combo em %
  const [freeShippingSubsidy, setFreeShippingSubsidy] = useState<number>(5.00); // Subsídio de frete em R$

  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Print / Export view handler for store promotion summary
  const handlePrintPromotionList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredSheets.map((sheet) => {
      const basePrice = sheet.sellingPrice > 0 ? sheet.sellingPrice : sheet.costPerPortion * 2.5;
      const directDiscountVal = basePrice * (directDiscountPct / 100);
      const promoPrice = Math.max(0, basePrice - directDiscountVal - freeShippingSubsidy);
      const netMargin = promoPrice > 0 ? ((promoPrice - sheet.costPerPortion - freeShippingSubsidy) / promoPrice) * 100 : 0;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${sheet.name} <span style="font-size: 10px; color: #666; font-weight: normal;">(${sheet.category})</span></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${sheet.costPerPortion.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${basePrice.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #16a34a; background-color: #f0fdf4;">R$ ${promoPrice.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${netMargin.toFixed(1)}%</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head><title>Relatório Simulador de Promoções - Base Chef</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #16a34a; margin-bottom: 5px;">Relatório Simulador "Promoção Loja" ⭐</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Desconto Direto: ${directDiscountPct}% | Combo: ${comboDiscountPct}% | Subsídio Frete: R$ ${freeShippingSubsidy.toFixed(2)}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead><tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;"><th style="padding: 10px; text-align: left;">Produto / Prato</th><th style="padding: 10px; text-align: right;">Custo Ficha</th><th style="padding: 10px; text-align: right;">Preço Base</th><th style="padding: 10px; text-align: right; color: #16a34a;">Preço Promocional</th><th style="padding: 10px; text-align: right;">Nova Margem</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const filteredSheets = sheets.filter(
    (sheet) =>
      sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Tag size={14} className="text-emerald-200" />
              <span>Simulador Estratégico ⭐ NOVO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-fredoka tracking-tight">
              Simulador "Promoção Loja" (Canal Direto)
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-2xl font-medium">
              Teste descontos diretos, combos e subsídios de frete no canal próprio, analisando o impacto na margem de lucro em tempo real antes de lançar campanhas.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold shadow-md">
              <Calculator size={24} />
            </div>
            <div>
              <span className="text-xs text-emerald-200 block font-medium">Pratos Simulados</span>
              <span className="text-2xl font-black font-fredoka">{sheets.length} itens</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: CAMPAIGN CONFIGURATION PANEL (TOP) */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-fredoka flex items-center space-x-2">
              <Tag size={20} className="text-emerald-600" />
              <span>1. Painel de Simulação de Campanhas Promocionais</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ajuste os parâmetros abaixo para recalcular instantaneamente o impacto nos preços e na saúde financeira.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
            <Sparkles size={14} />
            <span>Simulação em Tempo Real</span>
          </div>
        </div>

        {/* CONTROLS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Desconto Direto */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Desconto Direto (%)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={directDiscountPct}
                onChange={(e) => setDirectDiscountPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Redução percentual direta no preço balcão.</p>
          </div>

          {/* Desconto de Combo */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Desconto de Combo (%)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={comboDiscountPct}
                onChange={(e) => setComboDiscountPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Redução aplicada em vendas casadas/combos.</p>
          </div>

          {/* Subsídio de Frete */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Taxa Grátis / Subsídio de Frete (R$)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.5"
                min="0"
                value={freeShippingSubsidy}
                onChange={(e) => setFreeShippingSubsidy(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-500">R$</span>
            </div>
            <p className="text-[10px] text-slate-500">Valor em R$ assumido pela loja para frete grátis.</p>
          </div>

        </div>
      </div>

      {/* PRODUCTS SIMULATION TABLE SECTION */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* TABLE HEADER & SEARCH */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-fredoka">
              Tabela de Análise de Impacto Promocional
            </h3>
            <p className="text-xs text-slate-500">
              Comparativo entre Preço Base, Preços Promocionais Simulados (Direto vs Combo) e Alertas de Saúde Financeira.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintPromotionList}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer">
              <Printer size={16} />
              <span>Imprimir / Exportar Simulação</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar prato ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Produto / Prato</th>
                <th className="py-3.5 px-4 text-right">Custo Ficha</th>
                <th className="py-3.5 px-4 text-right">Preço Base</th>
                <th className="py-3.5 px-4 text-right bg-emerald-50/60 text-emerald-900">Preço Promo (Direto)</th>
                <th className="py-3.5 px-4 text-right bg-teal-50/60 text-teal-900">Preço Promo (Combo)</th>
                <th className="py-3.5 px-4 text-right">Nova Margem (Direto)</th>
                <th className="py-3.5 px-4 text-center">Saúde Financeira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredSheets.map((sheet) => {
                  const basePrice = sheet.sellingPrice > 0 ? sheet.sellingPrice : sheet.costPerPortion * 2.5;

                  // Simulations
                  const directDiscountVal = basePrice * (directDiscountPct / 100);
                  const promoPriceDirect = Math.max(0, basePrice - directDiscountVal - freeShippingSubsidy);

                  const comboDiscountVal = basePrice * (comboDiscountPct / 100);
                  const promoPriceCombo = Math.max(0, basePrice - comboDiscountVal - freeShippingSubsidy);

                  // Net margin direct calculation
                  const netRevenueDirect = promoPriceDirect - freeShippingSubsidy;
                  const netMarginDirect = promoPriceDirect > 0 ? ((netRevenueDirect - sheet.costPerPortion) / promoPriceDirect) * 100 : 0;

                  // Health Status Alert (using clear Portuguese terminology instead of inequality signs)
                  let healthStatus = 'green';
                  let healthLabel = 'Saudável (maior ou igual a 40%)';
                  let healthBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  if (netMarginDirect < 20) {
                    healthStatus = 'red';
                    healthLabel = 'Crítico / Prejuízo (abaixo de 20%)';
                    healthBg = 'bg-red-100 text-red-800 border-red-200';
                  } else if (netMarginDirect < 40) {
                    healthStatus = 'yellow';
                    healthLabel = 'Atenção (entre 20% e 40%)';
                    healthBg = 'bg-amber-100 text-amber-800 border-amber-200';
                  }

                  return (
                    <tr key={sheet.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 flex items-center space-x-3">
                        <img
                          src={sheet.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80"}
                          alt={sheet.name}
                          className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="block">{sheet.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{sheet.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(sheet.costPerPortion)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold text-slate-600">
                        {formatCurrency(basePrice)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-700 text-sm bg-emerald-50/40">
                        {formatCurrency(promoPriceDirect)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-teal-700 text-sm bg-teal-50/40">
                        {formatCurrency(promoPriceCombo)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        <span className={`px-2.5 py-1 rounded-lg font-bold ${
                          netMarginDirect >= 40 ? 'bg-emerald-100 text-emerald-800' :
                          netMarginDirect >= 20 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {netMarginDirect.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center space-x-1 ${healthBg}`}>
                          {healthStatus === 'red' && <AlertTriangle size={12} />}
                          {healthStatus === 'yellow' && <TrendingDown size={12} />}
                          {healthStatus === 'green' && <CheckCircle2 size={12} />}
                          <span>{healthLabel}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER ADVICE */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-3 text-xs text-slate-600">
          <Sparkles size={16} className="text-emerald-600 shrink-0" />
          <span>
            <strong>Simulador Estratégico:</strong> Avalie a elasticidade dos descontos diretos e o impacto dos subsídios de frete no seu canal de vendas direto para manter suas operações altamente lucrativas.
          </span>
        </div>

      </div>

    </div>
  );
};
