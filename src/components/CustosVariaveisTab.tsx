import React, { useState, useRef } from 'react';
import { VariableCostsData, VariableCostItem } from '../types';
import { DecimalInput } from './DecimalInput';
import {
  Percent,
  Plus,
  Trash2,
  TrendingUp,
  CreditCard,
  Package,
  Bike,
  Sparkles,
  Info,
  DollarSign,
  Receipt,
  Megaphone,
  AlertOctagon,
  Landmark,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Search
} from 'lucide-react';
import { downloadExcelTemplate, parseExcelOrCsvFile, parsePriceValue } from '../utils/excelImportExport';

interface CustosVariaveisTabProps {
  data: VariableCostsData;
  onChange: (newData: VariableCostsData) => void;
}

export const CustosVariaveisTab: React.FC<CustosVariaveisTabProps> = ({ data, onChange }) => {
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Template Handler (exports current registered items or standard defaults as native .xlsx)
  const handleDownloadTemplate = () => {
    const sampleRows = (data.items && data.items.length > 0)
      ? data.items.map(item => [item.name, item.percentage != null ? Number(item.percentage).toFixed(2).replace('.', ',') : '0,00'])
      : [
          ['Taxa de Cartão de Crédito', '2,50'],
          ['Taxa de Cartão de Débito', '1,20'],
          ['Embalagens para Viagem', '3,00'],
          ['Comissão iFood / Delivery', '12,00'],
          ['Imposto Simples Nacional', '6,00'],
          ['Margem de Perdas e Desperdício', '2,00']
        ];

    downloadExcelTemplate(
      'modelo_custos_variaveis_basechef',
      ['Nome da Taxa ou Custo', 'Percentual (%)'],
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
        return c.includes('nome') || c.includes('taxa') || c.includes('percentual') || c.includes('%');
      });
      if (isHeaderRow) startIndex = 1;

      let newItems = [...data.items];
      let count = 0;

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const hasData = row.some(cell => cell && String(cell).trim().length > 0);
        if (!hasData) continue;

        const name = row[0]?.trim() || `Custo Variável Importado ${i}`;
        const rawPct = row[1] || row[0] || '0';
        const percentage = parsePriceValue(rawPct);

        newItems.push({
          id: `vc-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          name: name,
          percentage: percentage,
          enabled: true
        });
        count++;
      }

      onChange({ ...data, items: newItems });
      setImportMessage(`${count} custo(s) variável(is) cadastrado(s) com sucesso!`);
      setTimeout(() => setImportMessage(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Erro ao processar a planilha. Verifique se o arquivo é um Excel (.xlsx, .xls) ou CSV válido.');
    }
  };
  
  const handleItemChange = (id: string, field: 'percentage' | 'name' | 'enabled', val: any) => {
    const updated = data.items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'percentage' ? (parseFloat(String(val).replace(',', '.')) || 0) : val
        };
      }
      return item;
    });
    onChange({ ...data, items: updated });
  };

  const handleAddItem = () => {
    const newId = `vc-${Date.now()}`;
    const newItem: VariableCostItem = {
      id: newId,
      name: 'Nova Taxa / Custo Variável',
      percentage: 2.0,
      enabled: true
    };
    onChange({
      ...data,
      items: [...data.items, newItem]
    });

    setTimeout(() => {
      const el = document.getElementById(`vc-name-input-${newId}`) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  };

  const handleRemoveItem = (id: string) => {
    onChange({
      ...data,
      items: data.items.filter((item) => item.id !== id)
    });
  };

  const totalVariablePercentage = (data.items || [])
    .filter((item) => item.enabled)
    .reduce((acc, item) => acc + Number(item.percentage || 0), 0)
    .toFixed(2);

  // Icon mapper for suggested examples
  const getIconForName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cartã') || lower.includes('debit') || lower.includes('crédit')) return <CreditCard size={18} className="text-amber-400" />;
    if (lower.includes('embalag')) return <Package size={18} className="text-orange-400" />;
    if (lower.includes('motoboy') || lower.includes('entrega')) return <Bike size={18} className="text-emerald-400" />;
    if (lower.includes('imposto') || lower.includes('simples')) return <Receipt size={18} className="text-blue-400" />;
    if (lower.includes('market') || lower.includes('anúncio')) return <Megaphone size={18} className="text-purple-400" />;
    if (lower.includes('perda') || lower.includes('quebra')) return <AlertOctagon size={18} className="text-red-400" />;
    if (lower.includes('juro') || lower.includes('banc')) return <Landmark size={18} className="text-zinc-400" />;
    return <Percent size={18} className="text-orange-400" />;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & SUMMARY */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-orange-100 text-orange-800 font-bold text-xs px-3 py-1 rounded-lg border border-orange-200">
                GESTÃO DE CUSTOS VARIÁVEIS & TAXAS
              </span>
              <span className="text-xs text-slate-500">Cartões, Embalagens, Freelance e Entregas</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Custos Variáveis (%) sobre a Venda do Cardápio
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ADICIONAR CUSTO VARIÁVEL */}
            <button
              onClick={handleAddItem}
              className="bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Plus size={16} />
              <span>Adicionar Custo Variável</span>
            </button>
          </div>
        </div>

        {/* SUCCESS IMPORT MESSAGE BANNER */}
        {importMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        {/* TOTAL VARIABLE COST KPI & FORMULA BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1 bento-card bg-orange-50/50 border-orange-200">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
              Total de Custos Variáveis Ativos
            </span>
            <p className="text-3xl font-black text-orange-600 mt-1">
              {totalVariablePercentage}%
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Descontados direto do preço bruto de venda
            </p>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start space-x-3 text-xs">
            <Info size={20} className="text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider">Como o Custo Variável afeta seu Lucro Líquido:</h4>
              <p>
                A cada venda realizada, esse percentual é retido automaticamente por maquininhas de cartão, impostos da nota fiscal, compras de embalagem e entregadores.
                O sistema usa essa porcentagem junto com os Custos Fixos para calcular a <strong>Margem Real de Lucro Líquido</strong> de cada produto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LIST OF VARIABLE COSTS ITEMS (SUGGESTED EXAMPLES PRE-CONFIGURED) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <h3 className="font-fredoka font-bold text-lg text-slate-900">
            Tabela de Exposição de Taxas & Custos do Restaurante / Pizzaria
          </h3>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar taxa ou custo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.items
            .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                item.enabled
                  ? 'bg-slate-50 border-slate-200 shadow-xs'
                  : 'bg-slate-100/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5 flex-1">
                  <button
                    onClick={() => handleItemChange(item.id, 'enabled', !item.enabled)}
                    className="text-orange-600 hover:text-orange-500 transition-colors cursor-pointer shrink-0"
                    title={item.enabled ? 'Desativar este custo' : 'Ativar este custo'}
                  >
                    {item.enabled ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
                  </button>

                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                    {getIconForName(item.name)}
                  </div>

                  <input
                    id={`vc-name-input-${item.id}`}
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 text-xs font-bold text-slate-900 focus:outline-none w-full"
                  />
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                  title="Excluir taxa"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-[11px] text-slate-500 font-medium uppercase">Porcentagem sobre Venda</span>
                <div className="flex items-center space-x-1">
                  <DecimalInput
                    value={item.percentage}
                    onChange={(val) => handleItemChange(item.id, 'percentage', val)}
                    placeholder="0,00"
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 w-20 text-right focus:outline-none focus:border-orange-500"
                  />
                  <span className="font-bold text-orange-600">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
