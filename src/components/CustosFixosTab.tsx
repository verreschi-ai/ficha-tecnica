import React, { useState, useRef } from 'react';
import { FixedCostsData, Employee, FixedExpenseItem } from '../types';
import { MoneyInput } from './MoneyInput';
import {
  Building2,
  Users,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Info,
  Briefcase,
  Sparkles,
  Calculator,
  ShieldCheck,
  Edit2,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';
import { downloadExcelTemplate, parseExcelOrCsvFile, parsePriceValue } from '../utils/excelImportExport';

interface CustosFixosTabProps {
  data: FixedCostsData;
  onChange: (newData: FixedCostsData) => void;
}

export const CustosFixosTab: React.FC<CustosFixosTabProps> = ({ data, onChange }) => {
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [searchExpenseQuery, setSearchExpenseQuery] = useState('');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Template Handler (exports current registered items or standard defaults as native .xlsx)
  const handleDownloadTemplate = () => {
    const expenseRows = (data.fixedExpenses && data.fixedExpenses.length > 0)
      ? data.fixedExpenses.map(exp => ['Despesa', exp.name, exp.amount != null ? Number(exp.amount).toFixed(2).replace('.', ',') : '0,00'])
      : [];
    const employeeRows = (data.employees && data.employees.length > 0)
      ? data.employees.map(emp => ['Colaborador', emp.name || emp.role, emp.baseSalary != null ? Number(emp.baseSalary).toFixed(2).replace('.', ',') : '0,00'])
      : [];

    const combinedRows = [...expenseRows, ...employeeRows];
    const sampleRows = combinedRows.length > 0
      ? combinedRows
      : [
          ['Despesa', 'Aluguel do Imóvel', '4500,00'],
          ['Despesa', 'Energia Elétrica & Gás', '1800,00'],
          ['Despesa', 'Sistemas de Gestão & Telefone', '350,00'],
          ['Colaborador', 'Cozinheiro Chefe', '2800,00'],
          ['Colaborador', 'Auxiliar de Cozinha', '1800,00'],
          ['Colaborador', 'Atendente de Salão', '1600,00']
        ];

    downloadExcelTemplate(
      'modelo_custos_fixos_basechef',
      ['Tipo', 'Nome Ou Cargo', 'Valor Ou Salário Base'],
      sampleRows
    );
  };

  // Import Excel/CSV Handler - registers all imported rows individually
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelOrCsvFile(file);
      if (rows.length === 0) {
        alert('O arquivo selecionado está vazio.');
        return;
      }

      let startIndex = 0;
      const firstRow = rows[0] || [];
      const isHeaderRow = firstRow.some(cell => {
        const c = String(cell).toLowerCase();
        return c.includes('tipo') || c.includes('nome') || c.includes('cargo') || c.includes('valor') || c.includes('salário') || c.includes('salario');
      });
      if (isHeaderRow) startIndex = 1;

      let newExpenses = [...data.fixedExpenses];
      let newEmployees = [...data.employees];
      let expCount = 0;
      let empCount = 0;

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const hasData = row.some(cell => cell && String(cell).trim().length > 0);
        if (!hasData) continue;

        const col0 = row[0]?.trim() || '';
        const col1 = row[1]?.trim() || '';
        const col2 = row[2]?.trim() || '';

        let type = col0.toLowerCase();
        let nameOrRole = col1;
        let valStr = col2;

        if (!col1 && !col2 && col0) {
          type = 'despesa';
          nameOrRole = col0;
          valStr = '0';
        } else if (!col2 && col0 && col1) {
          if (col0.match(/\d/)) {
            type = 'despesa';
            valStr = col0;
            nameOrRole = col1;
          } else {
            type = col0.toLowerCase();
            nameOrRole = col1;
            valStr = '0';
          }
        }

        const val = parsePriceValue(valStr);
        const isEmp = type.includes('colaborador') || type.includes('funcionario') || type.includes('equipe') || type.includes('cargo');

        if (isEmp) {
          const newEmp: Employee = {
            id: `emp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            name: nameOrRole || `Colaborador ${i}`,
            role: 'Colaborador',
            baseSalary: val,
            fgts: Math.round(val * 0.08 * 100) / 100,
            thirteenthSalary: Math.round((val / 12) * 100) / 100,
            vacationOneThird: Math.round((val / 9) * 100) / 100,
            inssPatronal: Math.round(val * 0.20 * 100) / 100,
            valeTransporte: 280,
            valeRefeicao: 440,
            otherBenefits: 0,
            includeThirteenth: true,
            includeVacation: true,
            includeTransport: true,
            includeMeal: true
          };
          newEmployees.push(newEmp);
          empCount++;
        } else {
          const newExp: FixedExpenseItem = {
            id: `fe-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            name: nameOrRole || `Despesa Fixa ${i}`,
            amount: val
          };
          newExpenses.push(newExp);
          expCount++;
        }
      }

      onChange({
        ...data,
        fixedExpenses: newExpenses,
        employees: newEmployees
      });

      setImportMessage(`${expCount} despesa(s) e ${empCount} colaborador(es) cadastrado(s) com sucesso!`);
      setTimeout(() => setImportMessage(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Erro ao processar a planilha. Verifique se o arquivo é um Excel (.xlsx, .xls) ou CSV válido.');
    }
  };

  // Revenue change
  const handleRevenueChange = (val: number) => {
    onChange({
      ...data,
      monthlyRevenue: val > 0 ? val : 1
    });
  };

  // Fixed Expense item change
  const handleExpenseChange = (id: string, field: 'name' | 'amount', val: any) => {
    const updatedExpenses = data.fixedExpenses.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          [field]: field === 'amount' ? (parseFloat(String(val).replace(',', '.')) || 0) : val
        };
      }
      return e;
    });
    onChange({ ...data, fixedExpenses: updatedExpenses });
  };

  const handleAddExpense = () => {
    const newId = `fe-${Date.now()}`;
    const newExpense: FixedExpenseItem = {
      id: newId,
      name: 'Outra Despesa Fixa',
      amount: 500
    };
    onChange({
      ...data,
      fixedExpenses: [...data.fixedExpenses, newExpense]
    });

    setTimeout(() => {
      const el = document.getElementById(`fixed-expense-name-${newId}`) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  };

  const handleRemoveExpense = (id: string) => {
    onChange({
      ...data,
      fixedExpenses: data.fixedExpenses.filter((e) => e.id !== id)
    });
  };

  // Employee change
  const handleEmployeeChange = (id: string, field: keyof Employee, val: any) => {
    const updatedEmployees = data.employees.map((emp) => {
      if (emp.id === id) {
        if (field === 'isFreelance') {
          return {
            ...emp,
            isFreelance: !!val
          };
        }

        if (field === 'includeThirteenth') {
          const checked = !!val;
          const thirteenth = checked ? Math.round(((emp.baseSalary || 0) / 12) * 100) / 100 : 0;
          return {
            ...emp,
            includeThirteenth: checked,
            thirteenthSalary: thirteenth
          };
        }

        if (field === 'includeVacation') {
          const checked = !!val;
          const vacation = checked ? Math.round(((emp.baseSalary || 0) / 9) * 100) / 100 : 0;
          return {
            ...emp,
            includeVacation: checked,
            vacationOneThird: vacation
          };
        }

        if (field === 'includeTransport') {
          const checked = !!val;
          const transport = checked ? (emp.valeTransporte || 280) : 0;
          return {
            ...emp,
            includeTransport: checked,
            valeTransporte: transport
          };
        }

        if (field === 'includeMeal') {
          const checked = !!val;
          const meal = checked ? (emp.valeRefeicao || 440) : 0;
          return {
            ...emp,
            includeMeal: checked,
            valeRefeicao: meal
          };
        }

        const numFields = ['baseSalary', 'fgts', 'thirteenthSalary', 'vacationOneThird', 'inssPatronal', 'valeTransporte', 'valeRefeicao', 'otherBenefits'];
        const parsedVal = numFields.includes(field as string) ? (parseFloat(String(val).replace(',', '.')) || 0) : val;

        if (field === 'baseSalary') {
          const newSalary = parsedVal as number;
          const inc13 = emp.includeThirteenth !== false;
          const incVac = emp.includeVacation !== false;
          return {
            ...emp,
            baseSalary: newSalary,
            fgts: emp.isFreelance ? 0 : Math.round(newSalary * 0.08 * 100) / 100, // Suggested 8%
            thirteenthSalary: inc13 ? Math.round((newSalary / 12) * 100) / 100 : (emp.thirteenthSalary || 0),
            vacationOneThird: incVac ? Math.round((newSalary / 9) * 100) / 100 : (emp.vacationOneThird || 0),
            inssPatronal: emp.isFreelance ? 0 : Math.round(newSalary * 0.20 * 100) / 100 // Suggested 20%
          };
        }

        return {
          ...emp,
          [field]: parsedVal
        };
      }
      return emp;
    });
    onChange({ ...data, employees: updatedEmployees });
  };

  const handleAddEmployee = () => {
    const defaultSalary = 1800;
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      id: newId,
      name: 'Novo Colaborador',
      role: 'Auxil. de Cozinha',
      baseSalary: defaultSalary,
      fgts: Math.round(defaultSalary * 0.08 * 100) / 100, // 8% = 144
      thirteenthSalary: Math.round((defaultSalary / 12) * 100) / 100,
      vacationOneThird: Math.round((defaultSalary / 9) * 100) / 100,
      inssPatronal: Math.round(defaultSalary * 0.20 * 100) / 100, // 20% = 360
      valeTransporte: 280,
      valeRefeicao: 440,
      otherBenefits: 0,
      includeThirteenth: true,
      includeVacation: true,
      includeTransport: true,
      includeMeal: true
    };
    onChange({
      ...data,
      employees: [...data.employees, newEmp]
    });
    setEditingEmpId(newEmp.id);

    setTimeout(() => {
      const el = document.getElementById(`emp-name-input-${newId}`) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  };

  const handleRemoveEmployee = (id: string) => {
    onChange({
      ...data,
      employees: data.employees.filter((emp) => emp.id !== id)
    });
  };

  // Calculations
  const totalFixedExpenses = data.fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const calculateEmployeeTotal = (emp: Employee) => {
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

  const totalPayroll = data.employees.reduce((acc, emp) => acc + calculateEmployeeTotal(emp), 0);
  const grandTotalFixedCost = totalFixedExpenses + totalPayroll;
  const fixedCostPercentage = ((grandTotalFixedCost / (data.monthlyRevenue || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* EXPLANATORY HEADER & MANUAL EDITS BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#F5EFE8] text-[#2A1D17] font-bold text-xs px-3 py-1 rounded-lg border border-[#E5D7C8]">
                GESTÃO DE CUSTOS FIXOS
              </span>
              <span className="text-xs text-slate-500">Base de Rateio & Precificação Real</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Custos Fixos, Aluguel & Encargos de Colaboradores
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
          </div>
        </div>

        {/* SUCCESS IMPORT MESSAGE BANNER */}
        {importMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        {/* DECISÃO DE PRODUTO: EDITAÇÃO LIVRE E MANUAL COM SUGESTÕES FIXAS */}
        <div className="bg-[#F5EFE8] border border-[#E5D7C8] rounded-2xl p-4 flex items-start space-x-3">
          <Info size={22} className="text-[#38261E] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-[#2A1D17] uppercase tracking-wide">
              Encargos Pré-preenchidos (FGTS 8% e INSS Patronal 20%) & Edição Livre
            </h4>
            <p className="text-slate-700 leading-relaxed">
              O <strong>FGTS (8%)</strong> e o <strong>INSS Patronal (20%)</strong> vêm pré-preenchidos automaticamente com base no salário base, mas <strong>todos os campos são 100% livres e editáveis manualmente</strong> para você ajustar conforme o holerite ou orientação do seu contador.
            </p>
          </div>
        </div>
      </div>

      {/* KPI CARDS RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card bg-slate-50/80 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Faturamento Mensal</span>
            <DollarSign size={18} className="text-amber-600" />
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-black text-slate-900">
              R$ {(data.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <Lock size={12} className="text-slate-400 shrink-0" />
              <span>Definido na aba Configurações</span>
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Despesas Operacionais</span>
            <Building2 size={18} className="text-[#38261E]" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900">
              R$ {totalFixedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Aluguel, Luz, Água, Gás...</p>
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Folha + Encargos</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900">
              R$ {totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{data.employees.length} Colaboradores ativos</p>
          </div>
        </div>

        <div className="bento-card bg-[#F5EFE8] border-[#E5D7C8]">
          <div className="flex items-center justify-between text-[#2D201A] text-xs font-bold uppercase tracking-wider">
            <span>% Custo Fixo Total</span>
            <TrendingUp size={18} className="text-[#38261E]" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black text-[#1A1513]">
              {fixedCostPercentage}%
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
              R$ {grandTotalFixedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês
            </p>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: FIXED EXPENSES & EMPLOYEES FLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: DESPESAS OPERACIONAIS FIXAS */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Building2 size={20} className="text-[#38261E]" />
              <h3 className="font-fredoka font-bold text-lg text-slate-900">Despesas Fixas</h3>
            </div>
            <button
              onClick={handleAddExpense}
              className="bg-[#2D201A] hover:bg-[#1A1513] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 shadow-xs border border-[#4A352A]"
            >
              <Plus size={14} />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar despesa..."
              value={searchExpenseQuery}
              onChange={(e) => setSearchExpenseQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#8C5A3C]"
            />
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {data.fixedExpenses
              .filter((exp) => exp.name.toLowerCase().includes(searchExpenseQuery.toLowerCase()))
              .map((exp) => (
              <div key={exp.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                <input
                  id={`fixed-expense-name-${exp.id}`}
                  type="text"
                  value={exp.name}
                  onChange={(e) => handleExpenseChange(exp.id, 'name', e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#8C5A3C] flex-1 shadow-xs"
                />

                <div className="flex items-center space-x-1 shrink-0">
                  <MoneyInput
                    value={exp.amount}
                    onChange={(val) => handleExpenseChange(exp.id, 'amount', val)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 w-28 text-right focus:outline-none focus:border-[#8C5A3C] shadow-xs"
                  />
                  <button
                    onClick={() => handleRemoveExpense(exp.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Excluir despesa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Subtotal Despesas Operacionais:</span>
            <span className="text-sm font-black text-[#1A1513]">
              R$ {totalFixedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: EQUIPE & FLUXO DE SALÁRIO COM ENCARGOS E BENEFÍCIOS */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users size={20} className="text-blue-600" />
              <div>
                <h3 className="font-bold text-lg text-slate-900">Equipe & Encargos / Benefícios</h3>
                <p className="text-[11px] text-slate-500">Salários, 13º, Férias, FGTS, INSS, VT e VR</p>
              </div>
            </div>

            <button
              onClick={handleAddEmployee}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Plus size={16} />
              <span>Novo Colaborador</span>
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar colaborador ou cargo..."
              value={searchEmployeeQuery}
              onChange={(e) => setSearchEmployeeQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* LIST OF EMPLOYEES WITH EXPANDABLE ENCARGOS CARD */}
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {data.employees
              .filter((emp) => emp.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) || emp.role.toLowerCase().includes(searchEmployeeQuery.toLowerCase()))
              .map((emp) => {
              const empTotal = calculateEmployeeTotal(emp);
              const isEditing = editingEmpId === emp.id;

              return (
                <div key={emp.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  
                  {/* EMPLOYEE MAIN ROW */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full items-center">
                      <input
                        id={`emp-name-input-${emp.id}`}
                        type="text"
                        value={emp.name}
                        onChange={(e) => handleEmployeeChange(emp.id, 'name', e.target.value)}
                        placeholder="Nome do colaborador"
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                      />
                      <input
                        type="text"
                        value={emp.role}
                        onChange={(e) => handleEmployeeChange(emp.id, 'role', e.target.value)}
                        placeholder="Cargo (ex: Pizzaiolo)"
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
                      />
                      <label className="flex items-center space-x-2 cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 shrink-0 select-none">
                        <input
                          type="checkbox"
                          checked={!!emp.isFreelance}
                          onChange={(e) => handleEmployeeChange(emp.id, 'isFreelance', e.target.checked)}
                          className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Freelance (Sem CLT)</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Custo Total Mensal</span>
                        <span className="font-black text-sm text-blue-600">
                          R$ {empTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingEmpId(isEditing ? null : emp.id)}
                          className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isEditing ? 'bg-[#2D201A] text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Abrir/Fechar Encargos"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remover colaborador"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SPEC 0.1: CARD "ENCARGOS E BENEFÍCIOS" (ALWAYS VISIBLE OR EXPANDABLE) */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-[#38261E] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        Card: Encargos e Benefícios (Edição Livre R$)
                      </span>
                      {emp.isFreelance ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">Freelance Ativo</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">Sem cálculo automático</span>
                      )}
                    </div>

                    {emp.isFreelance && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold p-2.5 rounded-xl">
                        ⚡ Modo Freelance Ativo: Isento de encargos sociais e impostos CLT (FGTS, 13º, Férias, INSS, VT, VR). O campo 'Outros Benefícios' permanece ativo.
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* SALÁRIO BASE */}
                      <div className="col-span-2 sm:col-span-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Salário Base *</label>
                        <MoneyInput
                          value={emp.baseSalary}
                          onChange={(val) => handleEmployeeChange(emp.id, 'baseSalary', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900 mt-1 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* FGTS */}
                      <div className={`bg-slate-50 p-2 rounded-lg border border-slate-200 ${emp.isFreelance ? 'opacity-40' : ''}`}>
                        <label className="text-[10px] font-bold text-[#38261E] uppercase block">FGTS</label>
                        <MoneyInput
                          disabled={!!emp.isFreelance}
                          value={emp.isFreelance ? 0 : emp.fgts}
                          onChange={(val) => handleEmployeeChange(emp.id, 'fgts', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 mt-1 focus:outline-none focus:border-[#8C5A3C] disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* 13º SALÁRIO */}
                      <div className={`bg-slate-50 p-2 rounded-lg border border-slate-200 ${emp.isFreelance ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-[#38261E] uppercase">13º Salário</label>
                          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={emp.includeThirteenth !== false}
                              disabled={!!emp.isFreelance}
                              onChange={(e) => handleEmployeeChange(emp.id, 'includeThirteenth', e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Base/12</span>
                          </label>
                        </div>
                        <MoneyInput
                          disabled={!!emp.isFreelance || emp.includeThirteenth === false}
                          value={emp.isFreelance || emp.includeThirteenth === false ? 0 : emp.thirteenthSalary}
                          onChange={(val) => handleEmployeeChange(emp.id, 'thirteenthSalary', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#8C5A3C] disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* FÉRIAS + 1/3 */}
                      <div className={`bg-slate-50 p-2 rounded-lg border border-slate-200 ${emp.isFreelance ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-[#38261E] uppercase">Férias + 1/3</label>
                          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={emp.includeVacation !== false}
                              disabled={!!emp.isFreelance}
                              onChange={(e) => handleEmployeeChange(emp.id, 'includeVacation', e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Férias/12</span>
                          </label>
                        </div>
                        <MoneyInput
                          disabled={!!emp.isFreelance || emp.includeVacation === false}
                          value={emp.isFreelance || emp.includeVacation === false ? 0 : emp.vacationOneThird}
                          onChange={(val) => handleEmployeeChange(emp.id, 'vacationOneThird', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#8C5A3C] disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* INSS PATRONAL */}
                      <div className={`bg-slate-50 p-2 rounded-lg border border-slate-200 ${emp.isFreelance ? 'opacity-40' : ''}`}>
                        <label className="text-[10px] font-bold text-blue-600 uppercase block">INSS Patronal</label>
                        <MoneyInput
                          disabled={!!emp.isFreelance}
                          value={emp.isFreelance ? 0 : emp.inssPatronal}
                          onChange={(val) => handleEmployeeChange(emp.id, 'inssPatronal', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 mt-1 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* VALE-TRANSPORTE */}
                      <div className={`bg-slate-50 p-2 rounded-lg border border-slate-200 ${emp.isFreelance ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase">Vale-Transporte</label>
                          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={emp.includeTransport !== false}
                              disabled={!!emp.isFreelance}
                              onChange={(e) => handleEmployeeChange(emp.id, 'includeTransport', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Opcional</span>
                          </label>
                        </div>
                        <MoneyInput
                          disabled={!!emp.isFreelance || emp.includeTransport === false}
                          value={emp.isFreelance || emp.includeTransport === false ? 0 : emp.valeTransporte}
                          onChange={(val) => handleEmployeeChange(emp.id, 'valeTransporte', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* VALE-REFEIÇÃO */}
                      <div className={`bg-slate-50 p-2 rounded-lg border border-slate-200 ${emp.isFreelance ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase">Vale-Refeição</label>
                          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={emp.includeMeal !== false}
                              disabled={!!emp.isFreelance}
                              onChange={(e) => handleEmployeeChange(emp.id, 'includeMeal', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Opcional</span>
                          </label>
                        </div>
                        <MoneyInput
                          disabled={!!emp.isFreelance || emp.includeMeal === false}
                          value={emp.isFreelance || emp.includeMeal === false ? 0 : emp.valeRefeicao}
                          onChange={(val) => handleEmployeeChange(emp.id, 'valeRefeicao', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* OUTROS BENEFÍCIOS - PERMANECE ATIVO E EDITÁVEL */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Outros Benefícios</label>
                        <MoneyInput
                          value={emp.otherBenefits}
                          onChange={(val) => handleEmployeeChange(emp.id, 'otherBenefits', val)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 mt-1 focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Subtotal Folha + Encargos:</span>
            <span className="text-sm font-fredoka font-black text-blue-600">
              R$ {totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

    </div>
  );

};
