import React, { useState } from 'react';
import { TechnicalSheet } from '../types';
import { ShoppingCart, Store, Car, Percent, DollarSign, Search, Sparkles, AlertCircle, Info, Calculator, Tag, Flame, Printer } from 'lucide-react';
import { NineNineLogo } from './NineNineLogo';

interface NineninePricingTabProps {
  sheets: TechnicalSheet[];
}

export const NineninePricingTab: React.FC<NineninePricingTabProps> = ({ sheets }) => {
  // Logistics Plan state
  const [logisticsPlan, setLogisticsPlan] = useState<'store' | 'platform'>('store');
  const [commissionRate, setCommissionRate] = useState<number>(10.9); // 10.9% default for store delivery
  const [transactionRate, setTransactionRate] = useState<number>(3.2); // 3.2% default for payment online
  const [monthlyFee, setMonthlyFee] = useState<number>(0); // R$ 0 default
  const [additionalLogisticsFee, setAdditionalLogisticsFee] = useState<number>(5.00); // R$ 5.00 default additional logistics fee for platform delivery

  // Campaigns Global Configuration state (exclusively in percentage %)
  const [enableMyInvestment, setEnableMyInvestment] = useState<boolean>(false);
  const [myInvestmentPct, setMyInvestmentPct] = useState<number>(5.00); // Meu Investimento %

  const [enableNinetyNineInvestment, setEnableNinetyNineInvestment] = useState<boolean>(false);
  const [ninetyNineInvestmentPct, setNinetyNineInvestmentPct] = useState<number>(5.00); // Investimento da 99 %

  const [enableLogisticsCampaign, setEnableLogisticsCampaign] = useState<boolean>(false);
  const [logisticsCampaignPct, setLogisticsCampaignPct] = useState<number>(6.00); // Custos Logísticos / Frete Grátis %

  const [searchTerm, setSearchTerm] = useState('');

  // Handle plan selection
  const handleSelectPlan = (plan: 'store' | 'platform') => {
    setLogisticsPlan(plan);
    if (plan === 'store') {
      setCommissionRate(10.9);
      setTransactionRate(3.2);
      setMonthlyFee(0);
    } else {
      setCommissionRate(8.9);
      setTransactionRate(3.2);
      setMonthlyFee(0);
    }
  };

  // Total tax percentage (commission + online payment)
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

  // Print / Export view handler for easy filling in 99Food portal
  const handlePrintNinenineList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredSheets.map((sheet) => {
      const basePrice = sheet.sellingPrice > 0 ? sheet.sellingPrice : sheet.costPerPortion * 2.5;
      
      let totalCampaignPct = 0;
      if (enableMyInvestment) totalCampaignPct += myInvestmentPct;
      if (enableNinetyNineInvestment) totalCampaignPct += ninetyNineInvestmentPct;
      if (enableLogisticsCampaign) totalCampaignPct += logisticsCampaignPct;

      const totalDeductionPct = totalTaxPercent + totalCampaignPct;
      const divisor = 1 - (totalDeductionPct / 100);
      const logisticsFeeAddon = logisticsPlan === 'platform' ? additionalLogisticsFee : 0;
      const nineninePrice = divisor > 0 ? (basePrice + logisticsFeeAddon) / divisor : basePrice * 1.5;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${sheet.name} <span style="font-size: 10px; color: #666; font-weight: normal;">(${sheet.category})</span></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${sheet.costPerPortion.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${basePrice.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #ca8a04; background-color: #fefce8;">R$ ${nineninePrice.toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head><title>Relatório de Precificação 99Food - Base Chef</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ca8a04; margin-bottom: 5px;">Relatório de Preços para Cadastro no 99Food 🚗</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Plano: ${logisticsPlan === 'store' ? 'Entrega Própria (A loja entrega)' : 'Entrega pela Plataforma (Logística 99)'} | Taxas Totais: ${totalTaxPercent.toFixed(1)}%</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead><tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;"><th style="padding: 10px; text-align: left;">Produto / Prato</th><th style="padding: 10px; text-align: right;">Custo Ficha</th><th style="padding: 10px; text-align: right;">Preço Balcão</th><th style="padding: 10px; text-align: right; color: #ca8a04;">Preço 99Food Sugerido</th></tr></thead>
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
      
      {/* HEADER BANNER — amarelo, seguindo a identidade do 99Food (texto escuro p/ contraste) */}
      <div className="bg-gradient-to-r from-[#FFCC00] via-yellow-400 to-yellow-500 rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-black/10 backdrop-blur-md px-3 py-1.5 rounded-full">
              <NineNineLogo size={18} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Módulo Definitivo ⭐ NOVO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-fredoka tracking-tight text-slate-900">
              Precificação 99Food com Planos de Logística & Campanhas
            </h1>
            <p className="text-slate-800 text-sm sm:text-base max-w-2xl font-medium">
              Simule planos de entrega (Própria vs Logística 99), taxas de comissão e campanhas promocionais para garantir margens sólidas no 99Food.
            </p>
          </div>

          <div className="bg-black/10 backdrop-blur-md border border-black/10 p-4 rounded-2xl flex items-center space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-black text-[#FFCC00] flex items-center justify-center font-bold shadow-md">
              <Calculator size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-700 block font-medium">Pratos Analisados</span>
              <span className="text-2xl font-black font-fredoka text-slate-900">{sheets.length} itens</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: GLOBAL CONFIGURATION & CAMPAIGNS (TOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LOGISTICS PLAN & TAXES CARD (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-fredoka flex items-center space-x-2">
                <Car size={20} className="text-amber-600" />
                <span>1. Plano de Logística e Taxas do 99Food</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Escolha entre entrega própria ou logística da plataforma e ajuste as comissões.
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200">
              <Info size={14} />
              <span>Taxa Total: {totalTaxPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* PLAN SELECTOR TOGGLES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PLANO ENTREGA PRÓPRIA */}
            <div
              onClick={() => handleSelectPlan('store')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start space-x-3 ${
                logisticsPlan === 'store'
                  ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                logisticsPlan === 'store' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'
              }`}>
                <Store size={18} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs font-fredoka">
                    Plano Entrega Própria (A loja entrega)
                  </span>
                  {logisticsPlan === 'store' && (
                    <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  10.9% comissão + 3.2% pagamento online + R$ 0 mensalidade + Isenção de Custo Logístico (0).
                </p>
              </div>
            </div>

            {/* PLANO ENTREGA PELA PLATAFORMA */}
            <div
              onClick={() => handleSelectPlan('platform')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start space-x-3 ${
                logisticsPlan === 'platform'
                  ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                logisticsPlan === 'platform' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'
              }`}>
                <Car size={18} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs font-fredoka">
                    Plano Entrega pela Plataforma (Logística 99)
                  </span>
                  {logisticsPlan === 'platform' && (
                    <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  8.9% comissão + 3.2% pagamento online + R$ 0 mensalidade + Custo Logístico Adicional por pedido.
                </p>
              </div>
            </div>

          </div>

          {/* EDITABLE PERCENTAGE & LOGISTICS FEE INPUTS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Comissão 99 (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Custo Logístico Adic. (R$)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                disabled={logisticsPlan === 'store'}
                value={logisticsPlan === 'store' ? 0 : additionalLogisticsFee}
                onChange={(e) => setAdditionalLogisticsFee(parseFloat(e.target.value) || 0)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  logisticsPlan === 'store' ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : 'bg-white border border-slate-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* CAMPAIGNS SIMULATOR CARD (1 col) */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 font-fredoka flex items-center space-x-2">
              <Flame size={20} className="text-amber-600" />
              <span>2. Simulador de Campanhas (%)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ative investimentos e frete grátis em porcentagem.
            </p>
          </div>

          <div className="space-y-3">
            {/* Meu Investimento */}
            <div className={`p-3 rounded-xl border transition-all ${enableMyInvestment ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMyInvestment}
                    onChange={(e) => setEnableMyInvestment(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">Meu Investimento</span>
                </label>
                {enableMyInvestment && <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-bold">100% Loja</span>}
              </div>
              {enableMyInvestment && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Desconto (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={myInvestmentPct}
                    onChange={(e) => setMyInvestmentPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

            {/* Investimento da 99 */}
            <div className={`p-3 rounded-xl border transition-all ${enableNinetyNineInvestment ? 'bg-yellow-50/50 border-yellow-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableNinetyNineInvestment}
                    onChange={(e) => setEnableNinetyNineInvestment(e.target.checked)}
                    className="rounded text-yellow-600 focus:ring-yellow-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">Investimento da 99</span>
                </label>
                {enableNinetyNineInvestment && <span className="text-[10px] bg-yellow-600 text-white px-2 py-0.5 rounded font-bold">Cofinanciado</span>}
              </div>
              {enableNinetyNineInvestment && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Custo Loja (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={ninetyNineInvestmentPct}
                    onChange={(e) => setNinetyNineInvestmentPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

            {/* Custos Logísticos / Frete Grátis */}
            <div className={`p-3 rounded-xl border transition-all ${enableLogisticsCampaign ? 'bg-orange-50/50 border-orange-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLogisticsCampaign}
                    onChange={(e) => setEnableLogisticsCampaign(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">Custos Logísticos / Frete Grátis</span>
                </label>
                {enableLogisticsCampaign && <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded font-bold">Atrair Clientes</span>}
              </div>
              {enableLogisticsCampaign && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-600">Frete (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={logisticsCampaignPct}
                    onChange={(e) => setLogisticsCampaignPct(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* PRODUCTS PRICING TABLE SECTION */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* TABLE HEADER & SEARCH */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-fredoka">
              Tabela de Precificação e Impacto no 99Food
            </h3>
            <p className="text-xs text-slate-500">
              Regra aplicada: Dedução de comissões, campanhas e repasse líquido, cobrindo o custo logístico adicional quando aplicável.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintNinenineList}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer">
              <Printer size={16} />
              <span>Imprimir / Exportar Lista 99Food</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar prato ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                <th className="py-3.5 px-4 text-center">Campanhas Ativas</th>
                <th className="py-3.5 px-4 text-right">Total Descontos (%)</th>
                <th className="py-3.5 px-4 text-right bg-amber-50/60 text-amber-900">
                  Preço 99Food Sugerido
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
                  const basePrice = sheet.sellingPrice > 0 ? sheet.sellingPrice : sheet.costPerPortion * 2.5;

                  // Campaigns sum (cumulative on 99Food as requested)
                  let totalCampaignPct = 0;
                  const activeCampaignsList: string[] = [];

                  if (enableMyInvestment) {
                    totalCampaignPct += myInvestmentPct;
                    activeCampaignsList.push('Meu Inv.');
                  }
                  if (enableNinetyNineInvestment) {
                    totalCampaignPct += ninetyNineInvestmentPct;
                    activeCampaignsList.push('Inv. 99');
                  }
                  if (enableLogisticsCampaign) {
                    totalCampaignPct += logisticsCampaignPct;
                    activeCampaignsList.push('Frete Grátis');
                  }

                  const logisticsFeeAddon = logisticsPlan === 'platform' ? additionalLogisticsFee : 0;

                  // Formula: P_99 = (basePrice + logisticsFeeAddon) / (1 - (taxTotal + totalCampaign) / 100)
                  const totalDeductionPct = totalTaxPercent + totalCampaignPct;
                  const deductionDecimal = totalDeductionPct / 100;
                  const divisor = 1 - deductionDecimal;
                  const ninenineSuggestedPrice = divisor > 0 ? (basePrice + logisticsFeeAddon) / divisor : basePrice * 1.5;

                  // Net revenue received by restaurant after taxes and campaigns:
                  const netReceived = ninenineSuggestedPrice * (1 - (totalTaxPercent / 100) - (totalCampaignPct / 100)) - logisticsFeeAddon;
                  const netMarginPercent = ninenineSuggestedPrice > 0 ? ((netReceived - sheet.costPerPortion) / ninenineSuggestedPrice) * 100 : sheet.margin;

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
                        {activeCampaignsList.length === 0 ? (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                            Nenhuma
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {activeCampaignsList.join(' + ')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-600">
                        {totalCampaignPct.toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-amber-600 text-sm bg-amber-50/40">
                        {formatCurrency(ninenineSuggestedPrice)}
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
          <Sparkles size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Garantia de Margem 99Food:</strong> O motor calcula o impacto exato da comissão do plano escolhido, dedução de campanhas promocionais e absorção do custo logístico adicional para blindar seu lucro líquido.
          </span>
        </div>

      </div>

    </div>
  );
};
