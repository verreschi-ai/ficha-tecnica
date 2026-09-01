import React from 'react';
import { TechnicalSheet, RawIngredientItem, AppSettings, FixedCostsData, VariableCostsData } from '../types';
import {
  Package,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Percent,
  Sparkles,
  Layers,
  Building2,
  ArrowUpRight,
  ShieldAlert,
  Lightbulb,
  ChefHat,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

interface DashboardTabProps {
  sheets: TechnicalSheet[];
  rawIngredients: RawIngredientItem[];
  appSettings: AppSettings;
  fixedCosts: FixedCostsData;
  variableCosts: VariableCostsData;
  onNavigateTab: (tab: any) => void;
  onOpenCreateProduct: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sheets,
  rawIngredients,
  appSettings,
  fixedCosts,
  variableCosts,
  onNavigateTab,
  onOpenCreateProduct
}) => {
  // 1. Módulos Contadores
  const totalItensCadastrados = rawIngredients.filter(i => !i.isRecipe).length;
  const totalReceitasBase = rawIngredients.filter(i => i.isRecipe).length;
  const totalPratosCadastrados = sheets.length;
  const totalReceitasCadastradas = totalPratosCadastrados + totalReceitasBase;

  // Calculation for fixed & variable cost percentages
  const totalFixedExpensesVal = fixedCosts.fixedExpenses.reduce((a, b) => a + b.amount, 0);
  const calculateEmployeeTotal = (emp: any) => {
    if (emp.isFreelance) {
      return (emp.baseSalary || 0) + (emp.otherBenefits || 0);
    }
    const inc13 = emp.includeThirteenth !== false;
    const incVac = emp.includeVacation !== false;
    const incTrans = emp.includeTransport !== false;
    const incMeal = emp.includeMeal !== false;

    return (
      (emp.baseSalary || 0) +
      (emp.fgts || 0) +
      (inc13 ? (emp.thirteenthSalary || 0) : 0) +
      (incVac ? (emp.vacationOneThird || 0) : 0) +
      (emp.inssPatronal || 0) +
      (incTrans ? (emp.valeTransporte || 0) : 0) +
      (incMeal ? (emp.valeRefeicao || 0) : 0) +
      (emp.otherBenefits || 0)
    );
  };
  const totalPayrollVal = fixedCosts.employees.reduce((acc, emp) => acc + calculateEmployeeTotal(emp), 0);
  const totalFixedCostVal = totalFixedExpensesVal + totalPayrollVal;
  const fixedCostPctNum = Number(((totalFixedCostVal / (fixedCosts.monthlyRevenue || appSettings.monthlyRevenue || 1)) * 100).toFixed(1));
  const variableCostPctNum = Number(variableCosts.items
    .filter(i => i.enabled)
    .reduce((acc, i) => acc + i.percentage, 0)
    .toFixed(1));
  const taxRateNum = Number(appSettings.defaultTaxRate || 6);

  // Helper to get true profit pct based on Preço Praticado
  const getSheetProfitPct = (sheet: TechnicalSheet) => {
    const costInsumo = sheet.costPerPortion;
    const sellPrice = sheet.sellingPrice;
    const activePrice = sellPrice > 0 ? sellPrice : 0;
    if (activePrice === 0) return -100;
    const cmvPct = (costInsumo / activePrice) * 100;
    const profitPct = 100 - (cmvPct + fixedCostPctNum + variableCostPctNum + taxRateNum);
    return Number(profitPct.toFixed(1));
  };

  const sheetsWithProfit = sheets.map(s => ({
    ...s,
    calcProfitPct: getSheetProfitPct(s)
  }));

  // 2. Saúde Financeira dos Pratos (4 Tiers)
  const pratosSaudaveis = sheetsWithProfit.filter(s => s.calcProfitPct >= 20);
  const pratosApertados = sheetsWithProfit.filter(s => s.calcProfitPct >= 10 && s.calcProfitPct < 20);
  const pratosRisco = sheetsWithProfit.filter(s => s.calcProfitPct >= 0 && s.calcProfitPct < 10);
  const pratosNaoVender = sheetsWithProfit.filter(s => s.calcProfitPct < 0);

  const totalPratos = sheets.length || 1;
  const pctSaudaveis = Math.round((pratosSaudaveis.length / totalPratos) * 100);
  const pctApertados = Math.round((pratosApertados.length / totalPratos) * 100);
  const pctRisco = Math.round((pratosRisco.length / totalPratos) * 100);
  const pctNaoVender = Math.round((pratosNaoVender.length / totalPratos) * 100);

  // 3. Métricas Complementares robustas
  const totalDivisor = sheets.length > 0 ? sheets.length : 1;
  const avgCMV = (sheets.reduce((acc, curr) => acc + (typeof curr.cmv === 'number' && !isNaN(curr.cmv) ? curr.cmv : 30.0), 0) / totalDivisor).toFixed(1);
  const avgMargin = (sheets.reduce((acc, curr) => acc + (typeof curr.margin === 'number' && !isNaN(curr.margin) ? curr.margin : 70.0), 0) / totalDivisor).toFixed(1);
  const ticketMedioPrato = (sheets.reduce((acc, curr) => {
    return acc + (curr.sellingPrice > 0 ? curr.sellingPrice : (curr.costPerPortion > 0 ? curr.costPerPortion * 3.33 : 0));
  }, 0) / totalDivisor).toFixed(2);
  const insumosPendentes = rawIngredients.filter(i => i.unitPrice <= 0 || !i.unitPrice);

  // Data for Health Pie Chart (4 categories)
  const healthPieData = [
    { name: 'Saudável (>= 20%)', value: pratosSaudaveis.length, color: '#10b981' },
    { name: 'Apertado (10-20%)', value: pratosApertados.length, color: '#f59e0b' },
    { name: 'Em Risco (0-10%)', value: pratosRisco.length, color: '#f97316' },
    { name: 'Não Vender (< 0%)', value: pratosNaoVender.length, color: '#dc2626' },
  ].filter(d => d.value > 0);

  // Data for Top Dishes Bar Chart (up to 8 dishes)
  const topDishesData = sheets.slice(0, 8).map(s => ({
    name: s.name.length > 14 ? s.name.substring(0, 12) + '...' : s.name,
    Custo: Number(s.costPerPortion.toFixed(2)),
    Venda: Number(s.sellingPrice.toFixed(2)),
    Margem: Number(s.margin)
  }));

  // Data for Cost Composition
  const avgCmvNum = Number(avgCMV);
  const avgProfitNum = Number(avgMargin);
  const compositionData = [
    { name: 'CMV (Itens)', value: avgCmvNum, fill: '#3b82f6' },
    { name: 'Custo Fixo', value: fixedCostPctNum, fill: '#6366f1' },
    { name: 'Var. + Impostos', value: variableCostPctNum + taxRateNum, fill: '#f59e0b' },
    { name: 'Margem / Lucro', value: avgProfitNum, fill: '#10b981' },
  ];

  // 4. CÁLCULO DE PONTO DE EQUILÍBRIO (BREAK-EVEN POINT) & CONTRIBUIÇÃO
  const avgContributionMarginPct = Math.max(1, 100 - (avgCmvNum + variableCostPctNum + taxRateNum));
  const pontoEquilibrioMensal = totalFixedCostVal / (avgContributionMarginPct / 100);
  const pontoEquilibrioDiario = pontoEquilibrioMensal / 30;
  const ticketMedioNum = Number(ticketMedioPrato) || 35;
  const pedidosMinimosDiarios = Math.ceil(pontoEquilibrioDiario / (ticketMedioNum > 0 ? ticketMedioNum : 35));

  // 5. ÍNDICE DE EFICIÊNCIA OPERACIONAL (SCORE 0 A 100)
  let healthScore = 0;
  // CMV criteria (max 35 pts)
  if (avgCmvNum >= 20 && avgCmvNum <= 32) healthScore += 35;
  else if (avgCmvNum <= 36) healthScore += 25;
  else if (avgCmvNum <= 42) healthScore += 15;
  else healthScore += 5;

  // Healthy dishes criteria (max 35 pts)
  healthScore += Math.round((pctSaudaveis / 100) * 35);

  // Raw items without price criteria (max 15 pts)
  const itemsWithoutPricePct = rawIngredients.length > 0 ? (insumosPendentes.length / rawIngredients.length) : 0;
  if (itemsWithoutPricePct === 0) healthScore += 15;
  else if (itemsWithoutPricePct < 0.1) healthScore += 10;
  else if (itemsWithoutPricePct < 0.25) healthScore += 5;

  // Average Profit criteria (max 15 pts)
  if (avgProfitNum >= 20) healthScore += 15;
  else if (avgProfitNum >= 12) healthScore += 10;
  else if (avgProfitNum >= 5) healthScore += 5;

  healthScore = Math.min(100, Math.max(10, healthScore));

  let scoreLabel = 'Excelente 🟢';
  let scoreBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (healthScore < 50) {
    scoreLabel = 'Crítico ⛔';
    scoreBg = 'bg-red-50 text-red-800 border-red-200';
  } else if (healthScore < 70) {
    scoreLabel = 'Atenção 🟡';
    scoreBg = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (healthScore < 85) {
    scoreLabel = 'Bom 🔵';
    scoreBg = 'bg-blue-50 text-blue-800 border-blue-200';
  }

  // 7. ITENS DE MAIOR RETORNO & CMV PARA GRÁFICOS
  const topReturnData = [...sheetsWithProfit]
    .map(s => {
      const profitVal = s.sellingPrice > 0 ? s.sellingPrice * (s.calcProfitPct / 100) : 0;
      return {
        name: s.name.length > 14 ? s.name.substring(0, 12) + '...' : s.name,
        fullName: s.name,
        LucroR$: Number(profitVal.toFixed(2)),
        Margem: s.calcProfitPct
      };
    })
    .sort((a, b) => b.LucroR$ - a.LucroR$)
    .slice(0, 6);

  const topCmvData = [...sheets]
    .map(s => ({
      name: s.name.length > 14 ? s.name.substring(0, 12) + '...' : s.name,
      fullName: s.name,
      CMV: Number(s.cmv.toFixed(1)),
      Custo: Number(s.costPerPortion.toFixed(2)),
      Venda: Number(s.sellingPrice.toFixed(2))
    }))
    .sort((a, b) => b.CMV - a.CMV)
    .slice(0, 6);

  const attentionData = sheetsWithProfit
    .filter(s => s.calcProfitPct < 15)
    .map(s => ({
      name: s.name.length > 14 ? s.name.substring(0, 12) + '...' : s.name,
      fullName: s.name,
      Margem: s.calcProfitPct,
      CMV: s.cmv
    }))
    .sort((a, b) => a.calcProfitPct - b.calcProfitPct)
    .slice(0, 6);

  // Pratos Estrelas (Campeões) e Vilões
  const pratosEstrelas = [...sheetsWithProfit]
    .filter(s => s.calcProfitPct >= 20 && (s.cmv <= 32 || isNaN(s.cmv)))
    .slice(0, 3);

  const pratosViloes = [...sheetsWithProfit]
    .filter(s => s.calcProfitPct < 10)
    .sort((a, b) => a.calcProfitPct - b.calcProfitPct)
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* EXECUTIVE HEADER BANNER 2.0 */}
      <div className="bg-gradient-to-br from-[#1A1513] via-[#2A1D17] to-[#1A1513] text-white p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-[#3E2B20]/60 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
              Painel Executivo 2.0
            </span>
            <span className="text-zinc-400 text-xs font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sincronização em tempo real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Visão Geral & Indicadores de Gestão
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Monitore o CMV médio ponderado, a distribuição da saúde financeira do cardápio e a rentabilidade líquida do seu estabelecimento.
          </p>
        </div>
        
        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={onOpenCreateProduct}
            className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Sparkles size={16} />
            <span>Novo Prato / Ficha</span>
          </button>
        </div>
      </div>

      {/* HEALTH SCORE & BREAK-EVEN POINT BANNER 2.0 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SCORE DE SAÚDE OPERACIONAL */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Score de Saúde Geral
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black font-mono text-slate-900">{healthScore}</span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500">Baseado em CMV, margens e estoque.</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1.5 rounded-2xl text-xs font-black border inline-block ${scoreBg}`}>
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* PONTO DE EQUILÍBRIO MENSAL */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ponto de Equilíbrio (Mês)
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                R$ {pontoEquilibrioMensal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Faturamento mínimo p/ cobrir custos fixos.</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-2xs">
            <Building2 size={20} />
          </div>
        </div>

        {/* META DIÁRIA DE COBERTURA */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Meta Diária de Equilíbrio
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono text-emerald-900">
                R$ {pontoEquilibrioDiario.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[11px] font-bold text-slate-500">/dia</span>
            </div>
            <p className="text-[11px] text-slate-500">~{pedidosMinimosDiarios} pratos/dia (ticket R$ {ticketMedioNum.toFixed(2).replace('.', ',')})</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-2xs">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* SECÇÃO 1: MÓDULOS CONTADORES & MÉTRICAS PRINCIPAIS (2.0 BENTO CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: SAÚDE DO CARDÁPIO */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Saúde do Cardápio</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-2xs">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>Pratos Lucrativos</span>
              <span className="text-emerald-600 font-mono text-sm font-black">{pctSaudaveis}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
              <div style={{ width: `${pctSaudaveis}%` }} className="bg-emerald-500 h-full transition-all" title={`Saudável: ${pctSaudaveis}%`} />
              <div style={{ width: `${pctApertados}%` }} className="bg-amber-500 h-full transition-all" title={`Apertado: ${pctApertados}%`} />
              <div style={{ width: `${pctRisco}%` }} className="bg-orange-500 h-full transition-all" title={`Em Risco: ${pctRisco}%`} />
              <div style={{ width: `${pctNaoVender}%` }} className="bg-red-600 h-full transition-all" title={`Não Vender: ${pctNaoVender}%`} />
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-medium pt-1">
              <span className="text-emerald-700 font-bold">🟢 {pratosSaudaveis.length} saudáveis</span>
              <span className="text-amber-700 font-bold">🟡 {pratosApertados.length} apertados</span>
              <span className="text-orange-700 font-bold">🟠 {pratosRisco.length} em risco</span>
              <span className="text-red-700 font-bold">⛔ {pratosNaoVender.length} não vender</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('fichas')}
            className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-between cursor-pointer group"
          >
            <span>Ver Fichas Técnicas</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* CARD 2: RECEITAS CADASTRADAS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Receitas & Pratos</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-2xs">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalReceitasCadastradas}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totalPratosCadastrados} pratos + {totalReceitasBase} bases preparadas
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('receitas')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-between cursor-pointer group"
          >
            <span>Ver Receitas Base</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* CARD 3: CMV MÉDIO */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>CMV Médio Cardápio</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-2xs">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-purple-700 font-mono tracking-tight">
              {avgCMV}%
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Ticket Médio</span>
              <span className="font-mono font-bold text-slate-800">R$ {ticketMedioPrato.replace('.', ',')}</span>
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('precificacao')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center justify-between cursor-pointer group"
          >
            <span>Relatório de Precificação</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* CARD 4: ITENS DE ESTOQUE */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Itens & Estoque</span>
            <div className={`p-2.5 rounded-2xl border shadow-2xs ${
              insumosPendentes.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-3xl font-black font-mono tracking-tight ${
              insumosPendentes.length > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {totalItensCadastrados}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {insumosPendentes.length > 0
                ? `${insumosPendentes.length} item(ns) sem preço atualizado`
                : '✓ Todos os itens cotados e atualizados'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('itens')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between cursor-pointer group"
          >
            <span>Gerenciar Itens</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* SECÇÃO 2: GRÁFICOS PROFISSIONAIS (RECHARTS 2.0) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO 1: COMPARATIVO DE CUSTO VS PREÇO DOS PRATOS (BAR CHART) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BarChart3 size={18} className="text-orange-600" />
              <h3 className="text-base font-extrabold text-slate-900">Comparativo: Custo dos Itens vs. Preço de Venda</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl">Top Pratos (R$)</span>
          </div>

          <div className="h-72 w-full pt-4">
            {topDishesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDishesData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1513', borderColor: '#3E2B20', borderRadius: '16px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2).replace('.', ',')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Custo" fill="#3b82f6" name="Custo dos Itens (R$)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Venda" fill="#f97316" name="Preço Venda (R$)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Nenhum prato cadastrado para exibir no gráfico.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: DISTRIBUIÇÃO DA SAÚDE DO CARDÁPIO (PIE CHART) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <PieChartIcon size={18} className="text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">Saúde do Cardápio</h3>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-xl">Rentabilidade</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center pt-2">
            {healthPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {healthPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1513', borderColor: '#3E2B20', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Sem dados de margem.
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-[10px]">
            <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-900 border border-emerald-100">
              <span className="block font-black text-sm">{pratosSaudaveis.length}</span>
              <span className="font-semibold">Saudáveis</span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-2xl text-amber-900 border border-amber-100">
              <span className="block font-black text-sm">{pratosApertados.length}</span>
              <span className="font-semibold">Apertados</span>
            </div>
            <div className="bg-red-50 p-2.5 rounded-2xl text-red-900 border border-red-100">
              <span className="block font-black text-sm">{pratosRisco.length + pratosNaoVender.length}</span>
              <span className="font-semibold">Em Risco</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECÇÃO 3: COMPOSIÇÃO MÉDIA DOS CUSTOS DO RESTAURANTE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Composição Estrutural do Preço de Venda</h3>
            <p className="text-xs text-slate-500">Média ponderada do CMV, custos fixos, custos variáveis e margem líquida do seu cardápio.</p>
          </div>
          <button
            onClick={() => onNavigateTab('precificacao')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>Gerenciar Custos & Impostos</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {compositionData.map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{item.name}</span>
                <div className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: item.fill }} />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black font-mono text-slate-900">{item.value}%</span>
                <span className="text-[10px] text-slate-500 font-medium">do preço final</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(100, item.value)}%`, backgroundColor: item.fill }} className="h-full rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* DIÁGNOSTICO INTERNO DE CMV */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Percent size={20} />
            </div>
            <div>
              <h4 className="font-bold text-blue-950 text-sm">Diagnóstico Interno de CMV (Custo da Mercadoria Vendida)</h4>
              <p className="text-xs text-blue-800 mt-0.5">
                CMV Médio Atual: <strong>{avgCMV}%</strong>. O patamar ideal de mercado para estabelecimentos lucrativos situa-se entre <strong>25% e 32%</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              Number(avgCMV) <= 32 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {Number(avgCMV) <= 32 ? '✓ CMV Saudável para Gestão' : '⚠ CMV Acima da Média Ideal'}
            </span>
          </div>
        </div>
      </div>

      {/* SECÇÃO: ANÁLISES ESPECÍFICAS DE RENTABILIDADE E CMV (3 GRÁFICOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO A: ITENS DE MAIOR RETORNO FINANCEIRO */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <DollarSign size={18} className="text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Maior Retorno Financeiro</h3>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg">Lucro (R$)</span>
          </div>
          <div className="h-64 w-full pt-4">
            {topReturnData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topReturnData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2).replace('.', ',')}`, 'Lucro Est.']}
                  />
                  <Bar dataKey="LucroR$" fill="#10b981" name="Lucro (R$)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Sem dados suficientes.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO B: ITENS COM MAIOR CUSTO DE CMV */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Percent size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Maior Custo de CMV (%)</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg">Insumos (%)</span>
          </div>
          <div className="h-64 w-full pt-4">
            {topCmvData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCmvData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'CMV']}
                  />
                  <Bar dataKey="CMV" fill="#3b82f6" name="CMV (%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Sem dados suficientes.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO C: PRATOS QUE EXIGEM ATENÇÃO */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShieldAlert size={18} className="text-red-600" />
              <h3 className="text-base font-bold text-slate-900">Pratos que Exigem Atenção</h3>
            </div>
            <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-lg">Margem Baixa</span>
          </div>
          <div className="h-64 w-full pt-4">
            {attentionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attentionData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Margem']}
                  />
                  <Bar dataKey="Margem" fill="#ef4444" name="Margem (%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-emerald-600 text-xs font-bold bg-emerald-50 rounded-2xl p-4 text-center">
                🎉 Parabéns! Nenhum prato em situação crítica ou de atenção no momento.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECÇÃO 4: DIAGNÓSTICOS E AÇÕES AUTOMÁTICAS DO CHEFINHO IA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-amber-500" />
            <h3 className="text-base font-extrabold text-slate-900">
              Recomendações Práticas do Chefinho IA
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Diagnósticos em Tempo Real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: CAMPEÕES DE MARGEM */}
          <div className="bento-card bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200/80">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                  🌟 Estrelas de Lucro
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">{pratosEstrelas.length} pratos</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 mt-2">Pratos com Maior Margem</h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Pratos com margem líquida acima de 20% e CMV sob controle. Excelentes para posicionar no topo do cardápio ou criar combos.
              </p>
              <div className="mt-3 space-y-1.5 border-t border-emerald-100 pt-2">
                {pratosEstrelas.length > 0 ? (
                  pratosEstrelas.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]">{s.name}</span>
                      <span className="font-mono font-bold text-emerald-700">+{s.calcProfitPct}%</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhum prato com margem &gt; 20% ainda.</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('fichas')}
              className="mt-3 pt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center justify-between border-t border-emerald-100 cursor-pointer"
            >
              <span>Ver Fichas dos Pratos</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* CARD 2: VILÕES DE MARGEM / EM RISCO */}
          <div className="bento-card bg-gradient-to-br from-white to-red-50/30 border-red-200/80">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-100/80 px-2.5 py-0.5 rounded-md">
                  ⚠️ Oportunidade de Reajuste
                </span>
                <span className="text-xs font-mono font-bold text-red-700">{pratosViloes.length} pratos</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 mt-2">Pratos Queimadores de Margem</h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Pratos com margem inferior a 10% ou prejuízo. Necessitam de reajuste de preço ou redução de porção.
              </p>
              <div className="mt-3 space-y-1.5 border-t border-red-100 pt-2">
                {pratosViloes.length > 0 ? (
                  pratosViloes.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]">{s.name}</span>
                      <span className="font-mono font-bold text-red-600">{s.calcProfitPct}%</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 font-bold">🎉 Nenhum prato em risco!</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('simulador')}
              className="mt-3 pt-2 text-xs font-bold text-red-700 hover:text-red-900 flex items-center justify-between border-t border-red-100 cursor-pointer"
            >
              <span>Simular Reajuste no Simulador ⚡</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* CARD 3: COTAÇÕES & ESTOQUE */}
          <div className="bento-card bg-gradient-to-br from-white to-amber-50/30 border-amber-200/80">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-md">
                  📦 Cotações & Estoque
                </span>
                <span className="text-xs font-mono font-bold text-amber-700">{totalItensCadastrados} itens</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 mt-2">Precisão dos Custos</h4>
              <p className="text-[11px] text-slate-600 mt-1">
                {insumosPendentes.length > 0
                  ? `Existem ${insumosPendentes.length} item(ns) com preço zerado. Atualize para o cálculo do CMV ficar 100% fiel.`
                  : '✓ Todas as cotações de insumos estão preenchidas. Seus relatórios têm 100% de precisão.'}
              </p>
              <div className="mt-3 p-2.5 bg-amber-100/50 rounded-xl text-amber-900 text-xs font-medium border border-amber-200/60">
                <span>💡 Dica: Ao alterar o preço de um item, todas as receitas e fichas técnicas são recalculadas automaticamente!</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('itens')}
              className="mt-3 pt-2 text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center justify-between border-t border-amber-100 cursor-pointer"
            >
              <span>Atualizar Cotações de Itens</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* SÍNTESE CHEFINHO IA 2.0 */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#1A1513] text-amber-400 border border-[#3E2B20] flex items-center justify-center shrink-0 shadow-md">
            <ChefHat size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-extrabold text-slate-900 text-sm">Síntese do Chefinho IA</h4>
              <span className="bg-orange-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">DIAGNÓSTICO AUTOMÁTICO</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              Você tem <strong>{totalItensCadastrados} itens de estoque</strong> e <strong>{totalReceitasCadastradas} receitas/pratos</strong> cadastrados. Seu cardápio conta com <strong>{pratosSaudaveis.length} pratos com margem saudável (20% ou mais)</strong>, <strong>{pratosApertados.length} pratos com margem apertada (10% a 19,9%)</strong> e <strong>{pratosRisco.length + pratosNaoVender.length} em risco ou prejuízo</strong>. Recomendo ajustar os preços no Relatório de Precificação para equilibrar a lucratividade.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('precificacao')}
          className="bg-[#1A1513] hover:bg-[#2A1D17] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
        >
          Ajustar Preços
        </button>
      </div>



    </div>
  );
};
