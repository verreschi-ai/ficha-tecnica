import React, { useState, useMemo } from 'react';
import { TechnicalSheet, RawIngredientItem, AppSettings, FixedCostsData } from '../types';
import {
  Sliders,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  Search,
  Printer,
  Package,
  Building2,
  Check,
  Target,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { formatNumeroBRL } from '../utils/formatters';

interface PriceSimulatorTabProps {
  sheets: TechnicalSheet[];
  rawIngredients: RawIngredientItem[];
  fixedCostPct: number;
  custoFixoPorPratoRS: number;
  variableCostPct: number;
  appSettings: AppSettings;
  fixedCosts: FixedCostsData;
  calculateSuggestedPrice: (costInsumo: number) => number;
  onBatchUpdatePrices?: (updatedSheets: { id: string; newPrice: number }[]) => void;
}

export const PriceSimulatorTab: React.FC<PriceSimulatorTabProps> = ({
  sheets,
  rawIngredients,
  fixedCostPct,
  custoFixoPorPratoRS,
  variableCostPct,
  appSettings,
  fixedCosts,
  calculateSuggestedPrice,
  onBatchUpdatePrices,
}) => {
  // Mode selection: 'general' | 'ingredient' | 'overhead' | 'toc'
  const [simulationMode, setSimulationMode] = useState<'general' | 'ingredient' | 'overhead' | 'toc'>('general');

  // Mode 4: TOC (Teoria das Restrições) — Preço Mínimo sem Prejuízo.
  // CMV, Impostos e Custo Variável ficam travados (são os únicos custos que realmente
  // desaparecem se a venda não acontecer); só Custo Fixo a recuperar e Margem são livres,
  // pra achar até onde o preço pode cair sem virar prejuízo real.
  const [tocFixedRecoveryPct, setTocFixedRecoveryPct] = useState<number>(100);
  const [tocMarginGoal, setTocMarginGoal] = useState<number>(appSettings.targetReturnMargin || 20);

  // Mode 1: General Price Adjustment
  const [globalPriceDeltaPct, setGlobalPriceDeltaPct] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [targetMarginGoal, setTargetMarginGoal] = useState<number>(appSettings.targetReturnMargin || 20);

  // Mode 2: Specific Item Cost Fluctuation
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [ingredientPriceDeltaPct, setIngredientPriceDeltaPct] = useState<number>(15); // e.g. +15%
  const [simulatedIngredientCustomPrice, setSimulatedIngredientCustomPrice] = useState<number | null>(null);

  // Mode 3: Overhead / Revenue Fluctuation
  const [simulatedRevenueDeltaPct, setSimulatedRevenueDeltaPct] = useState<number>(0); // e.g. -10%
  const [simulatedExtraFixedExpense, setSimulatedExtraFixedExpense] = useState<number>(0); // e.g. +R$ 1500

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    sheets.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [sheets]);

  // Selected Raw Ingredient Object
  const selectedIngredient = useMemo(() => {
    return rawIngredients.find(i => i.id === selectedIngredientId) || null;
  }, [rawIngredients, selectedIngredientId]);

  // Calculate simulated Fixed Cost % based on Overhead mode
  const simulatedFixedCostPct = useMemo(() => {
    if (simulationMode !== 'overhead') return fixedCostPct;

    const baseRevenue = fixedCosts.monthlyRevenue || appSettings.monthlyRevenue || 1;
    const effectiveRevenue = baseRevenue * (1 + simulatedRevenueDeltaPct / 100);

    const baseFixedExpenses = fixedCosts.fixedExpenses.reduce((a, b) => a + b.amount, 0);
    const basePayroll = fixedCosts.employees.reduce((acc, emp) => {
      if (emp.isFreelance) return acc + (emp.baseSalary || 0) + (emp.otherBenefits || 0);
      return acc + (emp.baseSalary || 0) + (emp.fgts || 0) + (emp.inssPatronal || 0) + (emp.otherBenefits || 0);
    }, 0);
    const totalSimulatedFixedCost = baseFixedExpenses + basePayroll + simulatedExtraFixedExpense;

    const newFixedPct = (totalSimulatedFixedCost / (effectiveRevenue > 0 ? effectiveRevenue : 1)) * 100;
    return Number(newFixedPct.toFixed(1));
  }, [simulationMode, fixedCostPct, fixedCosts, appSettings, simulatedRevenueDeltaPct, simulatedExtraFixedExpense]);

  // Reset Simulation
  const handleResetSimulation = () => {
    setGlobalPriceDeltaPct(0);
    setSelectedCategory('all');
    setTargetMarginGoal(appSettings.targetReturnMargin || 20);
    setSelectedIngredientId('');
    setIngredientPriceDeltaPct(15);
    setSimulatedIngredientCustomPrice(null);
    setSimulatedRevenueDeltaPct(0);
    setSimulatedExtraFixedExpense(0);
    setTocFixedRecoveryPct(100);
    setTocMarginGoal(appSettings.targetReturnMargin || 20);
    setAppliedSuccessMsg(null);
  };

  // Cenário 4 (TOC): CMV, Impostos e Custo Variável usam sempre o valor REAL cadastrado —
  // não são simulados aqui de propósito. Só Custo Fixo (via slider de % a recuperar do
  // rateio real) e Margem são exploráveis livremente.
  const taxRateToc = Number(appSettings.defaultTaxRate) || 6;
  const tocMetrics = useMemo(() => {
    return sheets.map((sheet) => {
      const costInsumo = Number(sheet.costPerPortion) || 0;
      const sellPrice = Number(sheet.sellingPrice) || 0;

      // Preço Mínimo Absoluto: 0% de recuperação de custo fixo e 0% de margem — abaixo
      // disso, cada venda perde dinheiro de caixa de verdade (CMV + Variável + Imposto
      // já não cabem no preço).
      const pctDivisorFloor = 1 - (variableCostPct + taxRateToc) / 100;
      const absoluteFloorPrice = pctDivisorFloor > 0 ? Number((costInsumo / pctDivisorFloor).toFixed(2)) : costInsumo * 2;

      // Preço do Cenário: aplica os sliders (quanto de Custo Fixo recuperar + margem desejada).
      const fixedRecoveryValue = Number(((custoFixoPorPratoRS * tocFixedRecoveryPct) / 100).toFixed(2));
      const pctDivisorScenario = 1 - (variableCostPct + taxRateToc + tocMarginGoal) / 100;
      const scenarioPrice = pctDivisorScenario > 0
        ? Number(((costInsumo + fixedRecoveryValue) / pctDivisorScenario).toFixed(2))
        : (costInsumo + fixedRecoveryValue) * 2;

      const variableValueAtScenario = Number(((scenarioPrice * variableCostPct) / 100).toFixed(2));
      const taxValueAtScenario = Number(((scenarioPrice * taxRateToc) / 100).toFixed(2));

      // Onde o preço PRATICADO hoje está, em relação ao piso absoluto e ao cenário simulado.
      let situacao: 'prejuizo' | 'so_variavel' | 'seguro' = 'seguro';
      if (sellPrice > 0 && sellPrice < absoluteFloorPrice) situacao = 'prejuizo';
      else if (sellPrice > 0 && sellPrice < scenarioPrice) situacao = 'so_variavel';

      return {
        sheet,
        costInsumo,
        sellPrice,
        absoluteFloorPrice,
        fixedRecoveryValue,
        variableValueAtScenario,
        taxValueAtScenario,
        scenarioPrice,
        situacao
      };
    });
  }, [sheets, variableCostPct, taxRateToc, custoFixoPorPratoRS, tocFixedRecoveryPct, tocMarginGoal]);

  const filteredTocMetrics = useMemo(() => {
    return tocMetrics.filter(m =>
      m.sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.sheet.category && m.sheet.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tocMetrics, searchTerm]);

  // Perform Simulation on each sheet
  const simulatedSheets = useMemo(() => {
    return sheets.map((sheet) => {
      const origCostInsumo = Number(sheet.costPerPortion) || 0;
      const origSellPrice = Number(sheet.sellingPrice) || 0;
      const origSuggestedPrice = calculateSuggestedPrice(origCostInsumo);
      const origActivePrice = origSellPrice > 0 ? origSellPrice : (origSuggestedPrice > 0 ? origSuggestedPrice : origCostInsumo * 3.5);

      const taxRate = Number(appSettings.defaultTaxRate) || 6;

      // 1. Calculate Simulated Cost of Insumos
      let simCostInsumo = origCostInsumo;

      if (simulationMode === 'ingredient' && selectedIngredient) {
        const matchingIngredient = sheet.ingredients.find(
          ing => ing.name.trim().toLowerCase() === selectedIngredient.name.trim().toLowerCase()
        );

        if (matchingIngredient) {
          const originalUnitCost = selectedIngredient.unitPrice || matchingIngredient.unitPrice || 0;
          const newUnitCost = simulatedIngredientCustomPrice !== null
            ? simulatedIngredientCustomPrice
            : originalUnitCost * (1 + ingredientPriceDeltaPct / 100);

          const originalIngTotalCost = (matchingIngredient.grossQty || matchingIngredient.netQty || 0) * originalUnitCost;
          const newIngTotalCost = (matchingIngredient.grossQty || matchingIngredient.netQty || 0) * newUnitCost;
          const costDiff = newIngTotalCost - originalIngTotalCost;
          const portionYield = sheet.yieldServings > 0 ? sheet.yieldServings : 1;

          simCostInsumo = Math.max(0, origCostInsumo + (costDiff / portionYield));
        }
      }

      // 2. Calculate Simulated Selling Price
      let simSellPrice = origSellPrice;

      if (simulationMode === 'general') {
        const categoryMatches = selectedCategory === 'all' || sheet.category === selectedCategory;
        if (categoryMatches && globalPriceDeltaPct !== 0) {
          if (origSellPrice > 0) {
            simSellPrice = Number((origSellPrice * (1 + globalPriceDeltaPct / 100)).toFixed(2));
          } else {
            const baseSug = calculateSuggestedPrice(simCostInsumo);
            simSellPrice = Number((baseSug * (1 + globalPriceDeltaPct / 100)).toFixed(2));
          }
        }
      }

      const simActivePrice = simSellPrice > 0 ? simSellPrice : (calculateSuggestedPrice(simCostInsumo) || simCostInsumo * 3.5);

      // 3. Calculate Original vs Simulated Margins & CMV
      const origCmvPct = origActivePrice > 0 ? Number(((origCostInsumo / origActivePrice) * 100).toFixed(1)) : 0;
      const origDeductions = origCmvPct + fixedCostPct + variableCostPct + taxRate;
      const origProfitPct = origActivePrice > 0 ? Number((100 - origDeductions).toFixed(1)) : 0;
      const origProfitVal = origActivePrice > 0 ? origActivePrice * (origProfitPct / 100) : 0;

      const simFixedPct = simulatedFixedCostPct;
      const simCmvPct = simActivePrice > 0 ? Number(((simCostInsumo / simActivePrice) * 100).toFixed(1)) : 0;
      const simDeductions = simCmvPct + simFixedPct + variableCostPct + taxRate;
      const simProfitPct = simActivePrice > 0 ? Number((100 - simDeductions).toFixed(1)) : 0;
      const simProfitVal = simActivePrice > 0 ? simActivePrice * (simProfitPct / 100) : 0;

      // Recommended price to maintain or hit target margin
      const targetMargin = targetMarginGoal || 20;
      const targetDivisor = 100 - (simFixedPct + variableCostPct + taxRate + targetMargin);
      const idealPriceToKeepMargin = targetDivisor > 0 ? Number(((simCostInsumo / targetDivisor) * 100).toFixed(2)) : simCostInsumo * 3;

      // Delta
      const profitValDelta = simProfitVal - origProfitVal;
      const profitPctDelta = Number((simProfitPct - origProfitPct).toFixed(1));
      const costDelta = simCostInsumo - origCostInsumo;

      // Status
      let simStatus: 'healthy' | 'warning' | 'danger' = 'healthy';
      if (simProfitPct < 0) simStatus = 'danger';
      else if (simProfitPct < 10) simStatus = 'danger';
      else if (simProfitPct < targetMargin) simStatus = 'warning';

      return {
        ...sheet,
        origCostInsumo,
        simCostInsumo,
        costDelta,
        origSellPrice,
        simSellPrice,
        origProfitPct,
        simProfitPct,
        profitPctDelta,
        origProfitVal,
        simProfitVal,
        profitValDelta,
        origCmvPct,
        simCmvPct,
        idealPriceToKeepMargin,
        simStatus,
        usesSelectedIngredient: simulationMode === 'ingredient' && selectedIngredient
          ? sheet.ingredients.some(ing => ing.name.trim().toLowerCase() === selectedIngredient.name.trim().toLowerCase())
          : true,
      };
    });
  }, [
    sheets,
    simulationMode,
    globalPriceDeltaPct,
    selectedCategory,
    targetMarginGoal,
    selectedIngredient,
    ingredientPriceDeltaPct,
    simulatedIngredientCustomPrice,
    simulatedFixedCostPct,
    fixedCostPct,
    variableCostPct,
    appSettings,
    calculateSuggestedPrice
  ]);

  // Filtered by search and mode
  const filteredSimulatedSheets = useMemo(() => {
    return simulatedSheets.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (simulationMode === 'ingredient' && selectedIngredientId) {
        return s.usesSelectedIngredient;
      }
      return true;
    });
  }, [simulatedSheets, searchTerm, simulationMode, selectedIngredientId]);

  // Global KPIs summary
  const summary = useMemo(() => {
    const total = simulatedSheets.length || 1;
    const avgOrigCmv = (simulatedSheets.reduce((a, b) => a + b.origCmvPct, 0) / total).toFixed(1);
    const avgSimCmv = (simulatedSheets.reduce((a, b) => a + b.simCmvPct, 0) / total).toFixed(1);
    const cmvDelta = Number((Number(avgSimCmv) - Number(avgOrigCmv)).toFixed(1));

    const avgOrigProfitPct = (simulatedSheets.reduce((a, b) => a + b.origProfitPct, 0) / total).toFixed(1);
    const avgSimProfitPct = (simulatedSheets.reduce((a, b) => a + b.simProfitPct, 0) / total).toFixed(1);
    const profitPctDelta = Number((Number(avgSimProfitPct) - Number(avgOrigProfitPct)).toFixed(1));

    const origHealthy = simulatedSheets.filter(s => s.origProfitPct >= (appSettings.targetReturnMargin || 20)).length;
    const simHealthy = simulatedSheets.filter(s => s.simStatus === 'healthy').length;

    const simInRisk = simulatedSheets.filter(s => s.simStatus === 'danger').length;

    return {
      avgOrigCmv,
      avgSimCmv,
      cmvDelta,
      avgOrigProfitPct,
      avgSimProfitPct,
      profitPctDelta,
      origHealthy,
      simHealthy,
      simInRisk
    };
  }, [simulatedSheets, appSettings]);

  // Apply simulated prices to real technical sheets
  const handleApplySimulatedPrices = () => {
    if (!onBatchUpdatePrices) {
      alert('Função de aplicação em lote não configurada.');
      return;
    }

    const updates = simulatedSheets
      .filter(s => s.simSellPrice > 0 && s.simSellPrice !== s.origSellPrice)
      .map(s => ({ id: s.id, newPrice: s.simSellPrice }));

    if (updates.length === 0) {
      alert('Nenhum prato teve o preço alterado na simulação para ser aplicado.');
      return;
    }

    if (window.confirm(`Deseja aplicar os novos preços simulados em ${updates.length} prato(s)? Essa alteração atualizará suas fichas técnicas reais.`)) {
      onBatchUpdatePrices(updates);
      setAppliedSuccessMsg(`✓ Sucesso! Novos preços aplicados em ${updates.length} prato(s).`);
      setTimeout(() => setAppliedSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER BANNER 2.0 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-sm">
              <Sliders size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Simulador de Cenários & Preços 2.0
              </h2>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
                Ferramenta Preditiva "E Se...?"
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl pt-1">
            Simule reajustes gerais de cardápio, aumentos de insumos específicos ou oscilações de faturamento e visualize o impacto instantâneo no seu lucro antes de tomar qualquer decisão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSimulation}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Resetar todos os parâmetros simulados"
          >
            <RotateCcw size={15} />
            <span>Resetar</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Imprimir simulação"
          >
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER WHEN APPLIED */}
      {appliedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{appliedSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* SIMULATION MODE SELECTOR TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setSimulationMode('general')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            simulationMode === 'general'
              ? 'bg-[#1A1513] text-white border-[#3E2B20] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider">Cenário 1</span>
            <TrendingUp size={16} className={simulationMode === 'general' ? 'text-amber-400' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-sm leading-tight">Reajuste Geral de Preços</h4>
            <p className={`text-[11px] mt-0.5 ${simulationMode === 'general' ? 'text-zinc-300' : 'text-slate-500'}`}>
              Simular aumento/desconto em lote ou por categoria
            </p>
          </div>
        </button>

        <button
          onClick={() => setSimulationMode('ingredient')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            simulationMode === 'ingredient'
              ? 'bg-[#1A1513] text-white border-[#3E2B20] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider">Cenário 2</span>
            <Package size={16} className={simulationMode === 'ingredient' ? 'text-amber-400' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-sm leading-tight">Alta de Item de Estoque</h4>
            <p className={`text-[11px] mt-0.5 ${simulationMode === 'ingredient' ? 'text-zinc-300' : 'text-slate-500'}`}>
              Simular inflação de um item e ver pratos afetados
            </p>
          </div>
        </button>

        <button
          onClick={() => setSimulationMode('overhead')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            simulationMode === 'overhead'
              ? 'bg-[#1A1513] text-white border-[#3E2B20] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider">Cenário 3</span>
            <Building2 size={16} className={simulationMode === 'overhead' ? 'text-amber-400' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-sm leading-tight">Custos Fixos & Faturamento</h4>
            <p className={`text-[11px] mt-0.5 ${simulationMode === 'overhead' ? 'text-zinc-300' : 'text-slate-500'}`}>
              Simular nova equipe, aluguel ou queda de vendas
            </p>
          </div>
        </button>

        <button
          onClick={() => setSimulationMode('toc')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            simulationMode === 'toc'
              ? 'bg-[#1A1513] text-white border-[#3E2B20] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider">Cenário 4</span>
            <Target size={16} className={simulationMode === 'toc' ? 'text-amber-400' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-sm leading-tight">Preço Mínimo (TOC)</h4>
            <p className={`text-[11px] mt-0.5 ${simulationMode === 'toc' ? 'text-zinc-300' : 'text-slate-500'}`}>
              Até onde o preço pode cair sem dar prejuízo
            </p>
          </div>
        </button>
      </div>

      {/* DYNAMIC PARAMETER CONTROLS BOX */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* MODE 1 CONTROLS */}
        {simulationMode === 'general' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Parâmetros do Reajuste de Cardápio
              </h3>
              <span className="text-xs text-slate-500 font-medium">Aplicação instantânea</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Filtrar Categoria:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="all">Todas as Categorias ({sheets.length} pratos)</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Variação de Preço de Venda:
                  </label>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                    globalPriceDeltaPct > 0 ? 'bg-emerald-100 text-emerald-800' : globalPriceDeltaPct < 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {globalPriceDeltaPct > 0 ? `+${globalPriceDeltaPct}%` : `${globalPriceDeltaPct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  step="1"
                  value={globalPriceDeltaPct}
                  onChange={(e) => setGlobalPriceDeltaPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A1513]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+25%</span>
                  <span>+50%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Meta de Margem Saudável Alvo:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={targetMarginGoal}
                    onChange={(e) => setTargetMarginGoal(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none"
                    placeholder="20"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2 CONTROLS */}
        {simulationMode === 'ingredient' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Simular Impacto da Inflação de um Item
              </h3>
              <span className="text-xs text-slate-500 font-medium">Recálculo em cadeia de receitas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Selecione o Item de Estoque:
                </label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => {
                    setSelectedIngredientId(e.target.value);
                    setSimulatedIngredientCustomPrice(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">-- Escolha um item para simular --</option>
                  {rawIngredients.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Preço Atual: R$ {formatNumeroBRL(item.unitPrice)}/{item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Aumento do Item (%):
                  </label>
                  <span className="text-xs font-black font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    +{ingredientPriceDeltaPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={ingredientPriceDeltaPct}
                  onChange={(e) => {
                    setIngredientPriceDeltaPct(Number(e.target.value));
                    setSimulatedIngredientCustomPrice(null);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>+0%</span>
                  <span>+25%</span>
                  <span>+50%</span>
                  <span>+100%</span>
                </div>
              </div>

              {selectedIngredient && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Preço Simulado:</span>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-slate-500 line-through">R$ {formatNumeroBRL(selectedIngredient.unitPrice)}</span>
                    <span className="text-sm font-black text-amber-900">
                      R$ {formatNumeroBRL(selectedIngredient.unitPrice * (1 + ingredientPriceDeltaPct / 100))}/{selectedIngredient.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 3 CONTROLS */}
        {simulationMode === 'overhead' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Simulação de Oscilação de Faturamento & Custos Fixos
              </h3>
              <span className="text-xs text-slate-500 font-medium">Rateio de Custo Fixo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Variação no Faturamento Mensal:
                  </label>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                    simulatedRevenueDeltaPct < 0 ? 'bg-red-100 text-red-800' : simulatedRevenueDeltaPct > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {simulatedRevenueDeltaPct > 0 ? `+${simulatedRevenueDeltaPct}%` : `${simulatedRevenueDeltaPct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={simulatedRevenueDeltaPct}
                  onChange={(e) => setSimulatedRevenueDeltaPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Novas Despesas Fixas Extras (R$/mês):
                </label>
                <input
                  type="number"
                  value={simulatedExtraFixedExpense}
                  onChange={(e) => setSimulatedExtraFixedExpense(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none"
                  placeholder="Ex: 2000 (Novo aluguel/funcionário)"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-800 block">Novo Rateio Fixo Simulado:</span>
                <div className="flex items-baseline space-x-2 font-mono">
                  <span className="text-slate-500 line-through">{fixedCostPct}%</span>
                  <span className="text-sm font-black text-blue-900">{simulatedFixedCostPct}%</span>
                  <span className="text-[10px] text-blue-700">({simulatedFixedCostPct > fixedCostPct ? `+${(simulatedFixedCostPct - fixedCostPct).toFixed(1)}%` : `${(simulatedFixedCostPct - fixedCostPct).toFixed(1)}%`})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 4 CONTROLS (TOC) */}
        {simulationMode === 'toc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Preço Mínimo sem Prejuízo (Teoria das Restrições)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Decisão pontual, não é política de preço</span>
            </div>

            <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-800 leading-relaxed">
                <strong>Use com cuidado:</strong> esse é o piso pra decisões pontuais — pedido extra fora de horário, giro de estoque, promoção específica. Se você passar a vender o cardápio inteiro perto desse piso todo dia, o Custo Fixo deixa de ser coberto por ninguém, e o negócio fecha no vermelho mesmo com cada venda "sem prejuízo individual".
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    % do Custo Fixo que você quer recuperar nesta venda:
                  </label>
                  <span className="text-xs font-black font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {tocFixedRecoveryPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={tocFixedRecoveryPct}
                  onChange={(e) => setTocFixedRecoveryPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>0% (piso absoluto)</span>
                  <span>100% (rateio integral)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Margem de lucro desejada neste cenário:
                  </label>
                  <span className="text-xs font-black font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {tocMarginGoal}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(30, (appSettings.targetReturnMargin || 20) * 2)}
                  step="1"
                  value={tocMarginGoal}
                  onChange={(e) => setTocMarginGoal(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>0% (só empatar)</span>
                  <span>Meta atual: {appSettings.targetReturnMargin || 20}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <Lock size={13} className="text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-700">CMV, Impostos ({taxRateToc}%) e Custo Variável ({variableCostPct}%) travados</strong> nos valores reais cadastrados — são os únicos custos que desaparecem de verdade se a venda não acontecer, então não fazem sentido serem "flexibilizados" numa análise de piso de preço.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TOP COMPARATIVE KPI CARDS (BEFORE VS AFTER) — não se aplica ao Cenário 4 (TOC), que tem seu próprio resumo */}
      {simulationMode !== 'toc' && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bento-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">CMV Médio Simulado</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-slate-900">{summary.avgSimCmv}%</span>
            <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-xl flex items-center gap-0.5 ${
              summary.cmvDelta > 0 ? 'bg-red-50 text-red-700' : summary.cmvDelta < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {summary.cmvDelta > 0 ? `▲ +${summary.cmvDelta}%` : summary.cmvDelta < 0 ? `▼ ${summary.cmvDelta}%` : '0.0%'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Base atual: {summary.avgOrigCmv}%</span>
        </div>

        <div className="bento-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Margem Líquida Média</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-slate-900">{summary.avgSimProfitPct}%</span>
            <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-xl flex items-center gap-0.5 ${
              summary.profitPctDelta > 0 ? 'bg-emerald-50 text-emerald-700' : summary.profitPctDelta < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {summary.profitPctDelta > 0 ? `▲ +${summary.profitPctDelta}%` : summary.profitPctDelta < 0 ? `▼ ${summary.profitPctDelta}%` : '0.0%'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Base atual: {summary.avgOrigProfitPct}%</span>
        </div>

        <div className="bento-card">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 size={14} /> Pratos Saudáveis
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-emerald-900">{summary.simHealthy}</span>
            <span className="text-xs font-bold text-slate-500">de {sheets.length}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Antes: {summary.origHealthy} pratos</span>
        </div>

        <div className="bento-card">
          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert size={14} /> Pratos em Risco
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-red-900">{summary.simInRisk}</span>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-lg">Atenção</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Margem &lt; 10% ou prejuízo</span>
        </div>
      </div>

      {/* MAIN SIMULATION COMPARISON TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Tabela Comparativa: Antes vs. Simulação
            </h3>
            <p className="text-xs text-slate-500">
              Analise o impacto individual em cada prato e veja o preço ideal para proteger seu lucro.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar prato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>

            {onBatchUpdatePrices && (
              <button
                onClick={handleApplySimulatedPrices}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer shrink-0 active:scale-95"
              >
                <Check size={14} />
                <span>Aplicar Preços</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Prato / Receita</th>
                <th className="p-3.5 text-right">Custo Insumos</th>
                <th className="p-3.5 text-right">Preço de Venda</th>
                <th className="p-3.5 text-right">CMV Simulado</th>
                <th className="p-3.5 text-right">Margem Líquida</th>
                <th className="p-3.5 text-right">Lucro Simulado</th>
                <th className="p-3.5 text-right text-emerald-700 bg-emerald-50/50">Preço Sugerido Ideal</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSimulatedSheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                    Nenhum prato correspondente aos filtros de simulação.
                  </td>
                </tr>
              ) : (
                filteredSimulatedSheets.map((sheet) => {
                  return (
                    <tr key={sheet.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-950">
                        <div className="text-xs font-black">{sheet.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{sheet.category || 'Geral'}</div>
                      </td>

                      {/* Custo de Insumos (Antes -> Simulado) */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-slate-900">
                          R$ {sheet.simCostInsumo.toFixed(2).replace('.', ',')}
                        </div>
                        {sheet.costDelta !== 0 && (
                          <div className={`text-[10px] font-bold ${sheet.costDelta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {sheet.costDelta > 0 ? `+R$ ${sheet.costDelta.toFixed(2).replace('.', ',')}` : `-R$ ${Math.abs(sheet.costDelta).toFixed(2).replace('.', ',')}`}
                          </div>
                        )}
                      </td>

                      {/* Preço de Venda (Antes -> Simulado) */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-slate-900">
                          R$ {sheet.simSellPrice > 0 ? sheet.simSellPrice.toFixed(2).replace('.', ',') : sheet.origSellPrice.toFixed(2).replace('.', ',')}
                        </div>
                        {sheet.simSellPrice !== sheet.origSellPrice && sheet.simSellPrice > 0 && (
                          <div className="text-[10px] text-slate-500 line-through">
                            R$ {sheet.origSellPrice.toFixed(2).replace('.', ',')}
                          </div>
                        )}
                      </td>

                      {/* CMV Simulado */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        <div>{sheet.simCmvPct.toFixed(1).replace('.', ',')}%</div>
                        {sheet.simCmvPct !== sheet.origCmvPct && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Antes: {sheet.origCmvPct.toFixed(1).replace('.', ',')}%
                          </div>
                        )}
                      </td>

                      {/* Margem Líquida */}
                      <td className="p-3.5 text-right font-mono">
                        <div className={`font-black ${
                          sheet.simProfitPct >= (appSettings.targetReturnMargin || 20)
                            ? 'text-emerald-700'
                            : sheet.simProfitPct >= 10
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}>
                          {sheet.simProfitPct > 0 ? `+${sheet.simProfitPct.toFixed(1)}%` : `${sheet.simProfitPct.toFixed(1)}%`}
                        </div>
                        {sheet.profitPctDelta !== 0 && (
                          <div className={`text-[10px] font-bold ${sheet.profitPctDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {sheet.profitPctDelta > 0 ? `+${sheet.profitPctDelta}%` : `${sheet.profitPctDelta}%`}
                          </div>
                        )}
                      </td>

                      {/* Lucro em R$ */}
                      <td className="p-3.5 text-right font-mono">
                        <div className={`font-bold ${sheet.simProfitVal >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>
                          R$ {sheet.simProfitVal.toFixed(2).replace('.', ',')}
                        </div>
                        {sheet.profitValDelta !== 0 && (
                          <div className={`text-[10px] font-bold ${sheet.profitValDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {sheet.profitValDelta > 0 ? `+R$ ${sheet.profitValDelta.toFixed(2).replace('.', ',')}` : `-R$ ${Math.abs(sheet.profitValDelta).toFixed(2).replace('.', ',')}`}
                          </div>
                        )}
                      </td>

                      {/* Preço Sugerido Ideal */}
                      <td className="p-3.5 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                        R$ {sheet.idealPriceToKeepMargin.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                          sheet.simStatus === 'healthy'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : sheet.simStatus === 'warning'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-red-200 text-red-900 border-red-300'
                        }`}>
                          {sheet.simStatus === 'healthy' ? '🟢 Saudável' : sheet.simStatus === 'warning' ? '🟡 Apertado' : '⛔ Risco'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* CENÁRIO 4 (TOC): KPIs + TABELA PRÓPRIA */}
      {simulationMode === 'toc' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bento-card">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Custo Fixo Considerado</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black font-mono text-slate-900">R$ {((custoFixoPorPratoRS * tocFixedRecoveryPct) / 100).toFixed(2).replace('.', ',')}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">de R$ {custoFixoPorPratoRS.toFixed(2).replace('.', ',')} (rateio integral real)</span>
            </div>

            <div className="bento-card">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block flex items-center gap-1">
                <ShieldAlert size={14} /> Vendidos Abaixo do Piso Absoluto
              </span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black font-mono text-red-900">
                  {tocMetrics.filter(m => m.situacao === 'prejuizo').length}
                </span>
                <span className="text-xs font-bold text-slate-500">de {sheets.length}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Prejuízo de caixa real, hoje, no preço praticado</span>
            </div>

            <div className="bento-card">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                <AlertTriangle size={14} /> Só Cobrindo Variável (sem Fixo/Margem)
              </span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black font-mono text-amber-900">
                  {tocMetrics.filter(m => m.situacao === 'so_variavel').length}
                </span>
                <span className="text-xs font-bold text-slate-500">de {sheets.length}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Acima do piso, mas abaixo do cenário simulado</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Piso de Preço por Prato (Teoria das Restrições)
                </h3>
                <p className="text-xs text-slate-500">
                  CMV, Impostos e Custo Variável travados no valor real — só Custo Fixo e Margem seguem os sliders acima.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar prato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Prato / Receita</th>
                    <th className="p-3.5 text-right"><span className="inline-flex items-center gap-1"><Lock size={10} />CMV</span></th>
                    <th className="p-3.5 text-right"><span className="inline-flex items-center gap-1"><Lock size={10} />Variável</span></th>
                    <th className="p-3.5 text-right"><span className="inline-flex items-center gap-1"><Lock size={10} />Impostos</span></th>
                    <th className="p-3.5 text-right">Fixo Considerado</th>
                    <th className="p-3.5 text-right bg-red-50/60 text-red-800">Piso Absoluto<br/><span className="normal-case font-normal text-red-500">(0% fixo, 0% margem)</span></th>
                    <th className="p-3.5 text-right bg-emerald-50/60 text-emerald-800">Preço do Cenário</th>
                    <th className="p-3.5 text-right">Preço Praticado</th>
                    <th className="p-3.5 text-center">Situação Hoje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTocMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-slate-400 italic">
                        Nenhum prato correspondente ao filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredTocMetrics.map(({ sheet, costInsumo, sellPrice, absoluteFloorPrice, fixedRecoveryValue, variableValueAtScenario, taxValueAtScenario, scenarioPrice, situacao }) => (
                      <tr key={sheet.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-950">
                          <div className="text-xs font-black">{sheet.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{sheet.category || 'Geral'}</div>
                        </td>

                        <td className="p-3.5 text-right font-mono text-slate-500">
                          R$ {costInsumo.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="p-3.5 text-right font-mono text-slate-500">
                          R$ {variableValueAtScenario.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="p-3.5 text-right font-mono text-slate-500">
                          R$ {taxValueAtScenario.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-blue-800">
                          R$ {fixedRecoveryValue.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-red-800 bg-red-50/40">
                          R$ {absoluteFloorPrice.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-emerald-800 bg-emerald-50/40">
                          R$ {scenarioPrice.toFixed(2).replace('.', ',')}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {sellPrice > 0 ? `R$ ${sellPrice.toFixed(2).replace('.', ',')}` : <span className="text-amber-600 text-[10px]">Não Def.</span>}
                        </td>

                        <td className="p-3.5 text-center">
                          {situacao === 'prejuizo' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block bg-red-200 text-red-900 border-red-300">
                              ⛔ Prejuízo real
                            </span>
                          ) : situacao === 'so_variavel' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block bg-amber-100 text-amber-900 border-amber-300">
                              🟡 Abaixo do cenário
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block bg-emerald-100 text-emerald-900 border-emerald-300">
                              🟢 Seguro
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
