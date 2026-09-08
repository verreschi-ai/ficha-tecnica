import React, { useState } from 'react';
import { TechnicalSheet, AppSettings } from '../types';
import { ShoppingCart, Store, Bike, Percent, DollarSign, Search, Sparkles, AlertCircle, Info, Calculator, Tag, Flame, Gift, CheckCircle2, Printer } from 'lucide-react';
import { IfoodLogo } from './IfoodLogo';

interface IfoodPricingTabProps {
  sheets: TechnicalSheet[];
  custoFixoPorPratoRS: number;
  appSettings: AppSettings;
  calculateSuggestedPrice: (costInsumo: number) => number;
}

export const IfoodPricingTab: React.FC<IfoodPricingTabProps> = ({ sheets, custoFixoPorPratoRS, appSettings, calculateSuggestedPrice }) => {
  const taxRate = Number(appSettings.defaultTaxRate) || 6;
  // Delivery Plan state
  const [deliveryPlan, setDeliveryPlan] = useState<'store' | 'partner'>('store');
  const [commissionRate, setCommissionRate] = useState<number>(12); // 12% default for store delivery
  const [transactionRate, setTransactionRate] = useState<number>(3.2); // 3.2% default for transaction
  const [monthlyFee, setMonthlyFee] = useState<number>(110); // R$ 110 default for store plan

  // Campaigns Global Configuration state (exclusively in percentage %)
  const [enableCI, setEnableCI] = useState<boolean>(false);
  const [ciPct, setCiPct] = useState<number>(5.00); // Campanha Inteligente percentage %

  const [enableDI, setEnableDI] = useState<boolean>(false);
  const [diPct, setDiPct] = useState<number>(10.00); // Desconto em Item percentage %

  const [enableHIT, setEnableHIT] = useState<boolean>(false);
  const [hitPct, setHitPct] = useState<number>(15.00); // iFood Hits percentage %

  const [enableFreeShipping, setEnableFreeShipping] = useState<boolean>(false);
  const [freeShippingPct, setFreeShippingPct] = useState<number>(8.00); // Free shipping cost assumed by restaurant %

  const [searchTerm, setSearchTerm] = useState('');

  // Handle plan selection
  const handleSelectPlan = (plan: 'store' | 'partner') => {
    setDeliveryPlan(plan);
    if (plan === 'store') {
      setCommissionRate(12);
      setTransactionRate(3.2);
      setMonthlyFee(110);
    } else {
      setCommissionRate(23);
      setTransactionRate(3.2);
      setMonthlyFee(150);
    }
  };

  // Total tax percentage
  const totalTaxPercent = commissionRate + transactionRate;

  // Filtered sheets
  const filteredSheets = sheets.filter(
    (sheet) =>
      sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Print / Export view handler for easy filling in iFood portal
  const handlePrintIfoodList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredSheets.map((sheet) => {
      // Base = preço de balcão real, ou (quando ainda não cadastrado) o mesmo motor do
      // Relatório de Precificação — CMV + Custo Fixo rateado + Impostos + Margem Meta —
      // em vez do antigo "custo × 2,5" arbitrário e desconectado da configuração real.
      const basePrice = sheet.sellingPrice > 0 ? sheet.sellingPrice : calculateSuggestedPrice(sheet.costPerPortion);
      
      let itemDiscountPct = 0;
      if (enableHIT) {
        itemDiscountPct = hitPct;
      } else {
        const pctCI = enableCI ? ciPct : 0;
        const pctDI = enableDI ? diPct : 0;
        itemDiscountPct = Math.max(pctCI, pctDI);
      }
      const shippingAddonPct = enableFreeShipping ? freeShippingPct : 0;
      const totalDeductionPct = totalTaxPercent + itemDiscountPct + shippingAddonPct;
      const divisor = 1 - (totalDeductionPct / 100);
      const ifoodPrice = divisor > 0 ? basePrice / divisor : basePrice * 1.5;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${sheet.name} <span style="font-size: 10px; color: #666; font-weight: normal;">(${sheet.category})</span></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${sheet.costPerPortion.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${basePrice.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #ea580c; background-color: #fff7ed;">R$ ${ifoodPrice.toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head><title>Relatório de Precificação iFood - Base Chef</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea580c; margin-bottom: 5px;">Relatório de Preços para Cadastro no iFood ⭐</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Plano: ${deliveryPlan === 'store' ? 'Plano Básico (Entrega Própria)' : 'Plano Entrega (Parceiro iFood)'} | Taxas Totais: ${totalTaxPercent.toFixed(1)}%</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead><tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;"><th style="padding: 10px; text-align: left;">Produto / Prato</th><th style="padding: 10px; text-align: right;">Custo Ficha</th><th style="padding: 10px; text-align: right;">Preço Balcão</th><th style="padding: 10px; text-align: right; color: #ea580c;">Preço iFood Sugerido</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
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
      
      {/* HEADER BANNER — vermelho, seguindo a identidade do iFood */}
      <div className="bg-gradient-to-r from-[#EA1D2C] via-red-600 to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full">
              <IfoodLogo size={18} light />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Módulo Definitivo ⭐ NOVO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-fredoka tracking-tight">
              Precificação iFood com Campanhas & Cumulatividade
            </h1>
            <p className="text-red-100 text-sm sm:text-base max-w-2xl font-medium">
              Simule planos, taxas e campanhas (cupom de desconto, taxa grátis) já considerando o CMV, Custo Fixo e Impostos reais do seu negócio — não só a taxa do iFood.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white text-[#EA1D2C] flex items-center justify-center font-bold shadow-md">
              <Calculator size={24} />
            </div>
            <div>
              <span className="text-xs text-red-200 block font-medium">Pratos Analisados</span>
              <span className="text-2xl font-black font-fredoka">{sheets.length} itens</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: GLOBAL CONFIGURATION & CAMPAIGNS (TOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PLAN & TAXES CARD (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-fredoka flex items-center space-x-2">
                <Store size={20} className="text-orange-600" />
                <span>1. Plano e Taxas do iFood</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Escolha o tipo de entrega e ajuste as taxas contratuais de comissão e transação.
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-orange-50 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-orange-200">
              <Info size={14} />
              <span>Taxa Total: {totalTaxPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* PLAN SELECTOR TOGGLES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PLANO BÁSICO */}
            <div
              onClick={() => handleSelectPlan('store')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start space-x-3 ${
                deliveryPlan === 'store'
                  ? 'border-orange-600 bg-orange-50/50 shadow-md ring-2 ring-orange-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                deliveryPlan === 'store' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'
              }`}>
                <Store size={18} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs font-fredoka">
                    Plano Básico (Entrega Própria)
                  </span>
                  {deliveryPlan === 'store' && (
                    <span className="text-[9px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  12% comissão + 3.2% transação + R$ 110 mensalidade (se vendas &gt; R$ 1.800).
                </p>
              </div>
            </div>

            {/* PLANO ENTREGA */}
            <div
              onClick={() => handleSelectPlan('partner')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start space-x-3 ${
                deliveryPlan === 'partner'
                  ? 'border-orange-600 bg-orange-50/50 shadow-md ring-2 ring-orange-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                deliveryPlan === 'partner' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'
              }`}>
                <Bike size={18} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs font-fredoka">
                    Plano Entrega (Parceiro iFood)
                  </span>
                  {deliveryPlan === 'partner' && (
                    <span className="text-[9px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  23% comissão + 3.2% transação + R$ 150 mensalidade (se vendas &gt; R$ 1.800).
                </p>
              </div>
            </div>

          </div>

          {/* EDITABLE PERCENTAGE & MONTHLY FEE INPUTS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Comissão iFood (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Pagamento Online (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={transactionRate}
                onChange={(e) => setTransactionRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Mensalidade (R$)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* CAMPAIGNS SIMULATOR CARD (1 col) */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 font-fredoka flex items-center space-x-2">
              <Flame size={20} className="text-red-600" />
              <span>2. Simulador de Campanhas</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ative campanhas e avalie as regras de cumulatividade.
            </p>
          </div>

          <div className="space-y-3">
            {/* iFood Hits */}
            <div className={`p-3 rounded-xl border transition-all ${enableHIT ? 'bg-red-50/50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableHIT}
                    onChange={(e) => setEnableHIT(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">iFood Hits (HIT)</span>
                </label>
                {enableHIT && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">Prioritário</span>}
              </div>
              {enableHIT && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Desconto (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={hitPct}
                    onChange={(e) => setHitPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

            {/* Campanha Inteligente (CI) */}
            <div className={`p-3 rounded-xl border transition-all ${enableCI ? 'bg-orange-50/50 border-orange-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCI}
                    onChange={(e) => setEnableCI(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">Campanha Inteligente (CI)</span>
                </label>
                {enableCI && <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded font-bold">Coparticipativo</span>}
              </div>
              {enableCI && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Custo (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={ciPct}
                    onChange={(e) => setCiPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

            {/* Desconto em Item (DI) */}
            <div className={`p-3 rounded-xl border transition-all ${enableDI ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDI}
                    onChange={(e) => setEnableDI(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">Desconto em Item (DI) — Cupom de Desconto</span>
                </label>
                {enableDI && <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-bold">100% Restaurante</span>}
              </div>
              {enableDI && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Desconto (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={diPct}
                    onChange={(e) => setDiPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

            {/* Taxa Grátis */}
            <div className={`p-3 rounded-xl border transition-all ${enableFreeShipping ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableFreeShipping}
                    onChange={(e) => setEnableFreeShipping(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">Taxa Grátis (Frete)</span>
                </label>
                {enableFreeShipping && <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">+ Cumulativo</span>}
              </div>
              {enableFreeShipping && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Frete (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={freeShippingPct}
                    onChange={(e) => setFreeShippingPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* PRODUCTS PRICING TABLE SECTION WITH CUMULATIVITY RULES */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* TABLE HEADER & SEARCH */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-fredoka">
              Tabela de Precificação e Impacto de Campanhas iFood
            </h3>
            <p className="text-xs text-slate-500">
              Regra aplicada: <strong>HIT vs DI/CI</strong> (não cumulativo no item, priorizando Hits ou o pior cenário entre DI e CI) + <strong>Taxa Grátis</strong> (cumulativa).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintIfoodList}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer">
              <Printer size={16} />
              <span>Imprimir / Exportar Lista iFood</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar prato ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                <th className="py-3.5 px-4 text-right">Preço Balcão</th>
                <th className="py-3.5 px-4 text-center">Campanha Aplicada</th>
                <th className="py-3.5 px-4 text-right">Desconto / Custo (%)</th>
                <th className="py-3.5 px-4 text-right bg-orange-50/60 text-orange-900">
                  Preço iFood Sugerido
                </th>
                <th className="py-3.5 px-4 text-right">Margem Líquida</th>
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
                  // Base = preço de balcão real, ou (quando ainda não cadastrado) o mesmo motor do
      // Relatório de Precificação — CMV + Custo Fixo rateado + Impostos + Margem Meta —
      // em vez do antigo "custo × 2,5" arbitrário e desconectado da configuração real.
      const basePrice = sheet.sellingPrice > 0 ? sheet.sellingPrice : calculateSuggestedPrice(sheet.costPerPortion);

                  // Apply business rules for cumulativity (exclusively in %):
                  // 1. HIT vs (CI / DI): HIT overrides CI/DI on the item.
                  let activeCampaignName = 'Nenhuma';
                  let itemDiscountPct = 0;

                  if (enableHIT) {
                    activeCampaignName = 'iFood Hits (HIT)';
                    itemDiscountPct = hitPct;
                  } else {
                    // Compare CI and DI (worst case / highest cost for restaurant in %)
                    const pctCI = enableCI ? ciPct : 0;
                    const pctDI = enableDI ? diPct : 0;
                    if (pctCI > 0 && pctDI > 0) {
                      if (pctCI >= pctDI) {
                        activeCampaignName = 'Campanha Inteligente (CI)';
                        itemDiscountPct = pctCI;
                      } else {
                        activeCampaignName = 'Desconto em Item (DI)';
                        itemDiscountPct = pctDI;
                      }
                    } else if (pctCI > 0) {
                      activeCampaignName = 'Campanha Inteligente (CI)';
                      itemDiscountPct = pctCI;
                    } else if (pctDI > 0) {
                      activeCampaignName = 'Desconto em Item (DI)';
                      itemDiscountPct = pctDI;
                    }
                  }

                  // 2. Free shipping is cumulative exception (%)
                  const shippingAddonPct = enableFreeShipping ? freeShippingPct : 0;
                  if (enableFreeShipping && activeCampaignName !== 'Nenhuma') {
                    activeCampaignName += ' + Taxa Grátis';
                  } else if (enableFreeShipping) {
                    activeCampaignName = 'Taxa Grátis (Frete)';
                  }

                  const totalCampaignPct = itemDiscountPct + shippingAddonPct;

                  // Formula: P_ifood = basePrice / (1 - (taxTotalPct + totalCampaignPct) / 100)
                  const totalDeductionPct = totalTaxPercent + totalCampaignPct;
                  const deductionDecimal = totalDeductionPct / 100;
                  const divisor = 1 - deductionDecimal;
                  const ifoodSuggestedPrice = divisor > 0 ? basePrice / divisor : basePrice * 1.5;

                  // Net revenue received by restaurant after iFood's own fees and campaigns:
                  const netReceived = ifoodSuggestedPrice * (1 - (totalTaxPercent / 100) - (totalCampaignPct / 100));
                  // Margem de verdade: também desconta Custo Fixo (rateio real por prato) e os
                  // Impostos do PRÓPRIO restaurante (Simples Nacional etc.) — esses continuam
                  // devidos independente do canal de venda, e antes não entravam nessa conta.
                  const taxValueAtIfoodPrice = (ifoodSuggestedPrice * taxRate) / 100;
                  const netMarginPercent = ifoodSuggestedPrice > 0
                    ? ((netReceived - sheet.costPerPortion - custoFixoPorPratoRS - taxValueAtIfoodPrice) / ifoodSuggestedPrice) * 100
                    : sheet.margin;

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
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-block ${
                          activeCampaignName.includes('Hits') ? 'bg-red-100 text-red-800 border border-red-200' :
                          activeCampaignName.includes('CI') || activeCampaignName.includes('DI') ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          activeCampaignName.includes('Taxa Grátis') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {activeCampaignName}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-600">
                        {totalCampaignPct.toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-orange-600 text-sm bg-orange-50/40">
                        {formatCurrency(ifoodSuggestedPrice)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        <span className={`px-2.5 py-1 rounded-lg font-bold ${
                          netMarginPercent >= 50 ? 'bg-emerald-100 text-emerald-800' :
                          netMarginPercent >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {netMarginPercent.toFixed(1)}%
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
          <Sparkles size={16} className="text-orange-600 shrink-0" />
          <span>
            <strong>Garantia de Margem iFood:</strong> O motor calcula o impacto exato da cumulatividade (Hits substitui descontos de item; CI e DI avaliam o pior cenário; Taxa Grátis soma-se como exceção cumulativa) e a Margem Líquida já desconta CMV, Custo Fixo rateado e Impostos do seu negócio — não só a taxa do iFood.
          </span>
        </div>

      </div>

    </div>
  );
};
