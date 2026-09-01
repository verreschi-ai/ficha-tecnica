import React, { useState, useRef, useEffect } from 'react';
import { RawIngredientItem } from '../types';
import { MoneyInput } from './MoneyInput';
import { DecimalInput } from './DecimalInput';
import {
  Package,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Check
} from 'lucide-react';
import { downloadExcelTemplate, parseExcelOrCsvFile, parsePriceValue } from '../utils/excelImportExport';
import { formatNumeroBRL } from '../utils/formatters';

interface ItensReceitasTabProps {
  ingredients: RawIngredientItem[];
  onAddIngredient: (item: Omit<RawIngredientItem, 'id' | 'lastUpdated'> | Omit<RawIngredientItem, 'id' | 'lastUpdated'>[]) => void;
  onUpdateIngredient: (item: RawIngredientItem) => void;
  onDeleteIngredient: (id: string) => void;
  mode?: 'itens' | 'receitas' | 'todos';
}

export const ItensReceitasTab: React.FC<ItensReceitasTabProps> = ({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  mode = 'itens'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RawIngredientItem | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Template Handler
  const handleDownloadTemplate = () => {
    if (mode === 'receitas') {
      const existingRecipes = ingredients.filter(i => i.isRecipe);
      const sampleRows = existingRecipes.length > 0
        ? existingRecipes.map(r => [
            r.name,
            1,
            r.unit || 'kg',
            r.unitPrice ? formatNumeroBRL(r.unitPrice) : '0,00'
          ])
        : [
            ['Molho de Tomate Rústico', 5, 'kg', '12,50'],
            ['Massa de Pizza Especial', 10, 'kg', '4,20'],
            ['Caldo de Legumes Concentrado', 8, 'L', '6,80']
          ];

      downloadExcelTemplate(
        'modelo_cadastro_receitas_basechef',
        ['Nome da Receita', 'Rendimento Qtd', 'Rendimento Unidade', 'Preço Quilo'],
        sampleRows
      );
    } else {
      const existingItems = ingredients.filter(i => !i.isRecipe);
      const sampleRows = existingItems.length > 0
        ? existingItems.map(item => [
            item.name,
            item.unit || 'kg',
            item.unitPrice ? formatNumeroBRL(item.unitPrice) : '0,00'
          ])
        : [
            ['Farinha de Trigo Especial', 'kg', '6,50'],
            ['Azeite Extra Virgem 500ml', 'un', '28,90'],
            ['Queijo Mozzarella Fatiado', 'kg', '38,00']
          ];

      downloadExcelTemplate(
        'modelo_cadastro_itens_basechef',
        ['Nome do Item', 'Unidade', 'Preço Quilo'],
        sampleRows
      );
    }
  };

  // Import Excel/CSV Handler
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
      let nameIdx = 0;
      let unitIdx = 1;
      let priceIdx = 2;
      let yieldQtyIdx = 1;
      let yieldUnitIdx = 2;

      const firstRow = rows[0] || [];
      const isHeaderRow = firstRow.some(cell => {
        const c = String(cell).toLowerCase();
        return c.includes('nome') || c.includes('item') || c.includes('unidade') || c.includes('preço') || c.includes('preco');
      });

      if (isHeaderRow) {
        startIndex = 1;
        firstRow.forEach((cell, idx) => {
          const c = String(cell).toLowerCase();
          if (c.includes('nome') || c.includes('item') || c.includes('desc') || c.includes('produto')) {
            nameIdx = idx;
          } else if (c.includes('rendimento') && (c.includes('qtd') || c.includes('quantidade'))) {
            yieldQtyIdx = idx;
          } else if (c.includes('unid') || c.includes('medida') || c.includes('um')) {
            unitIdx = idx;
            yieldUnitIdx = idx;
          } else if (c.includes('preç') || c.includes('prec') || c.includes('valor') || c.includes('custo') || c.includes('r$')) {
            priceIdx = idx;
          }
        });
      }

      const itemsToBatch: Omit<RawIngredientItem, 'id' | 'lastUpdated'>[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const hasData = row.some(cell => cell && String(cell).trim().length > 0);
        if (!hasData) continue;

        const nameRaw = row[nameIdx]?.trim();
        if (!nameRaw) continue;

        if (mode === 'receitas') {
          const yieldQty = parsePriceValue(row[yieldQtyIdx]) || 1;
          const yieldUnit = row[yieldUnitIdx]?.trim() || 'kg';
          const price = parsePriceValue(row[priceIdx]);

          itemsToBatch.push({
            code: '',
            supplier: '',
            name: nameRaw,
            unit: yieldUnit,
            yieldQty: yieldQty,
            unitPrice: price,
            fc: 1.0,
            category: 'Receitas',
            isRecipe: true
          });
        } else {
          const unit = row[unitIdx]?.trim() || 'kg';
          const price = parsePriceValue(row[priceIdx]);

          itemsToBatch.push({
            code: '',
            supplier: '',
            name: nameRaw,
            unit: unit,
            unitPrice: price,
            fc: 1.0,
            category: 'Geral',
            isRecipe: false
          });
        }
      }

      if (itemsToBatch.length === 0) {
        alert('Nenhum item válido foi encontrado na planilha importada.');
        return;
      }

      onAddIngredient(itemsToBatch);

      setImportMessage(`${itemsToBatch.length} ${mode === 'receitas' ? 'receita(s)' : 'item(ns)'} cadastrado(s) com sucesso!`);
      setTimeout(() => setImportMessage(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Erro ao processar o arquivo. Verifique se o formato é uma planilha Excel (.xlsx, .xls) ou .csv válida.');
    }
  };

  // Form State for "Itens"
  const [itemFormData, setItemFormData] = useState({
    name: '',
    unit: 'kg',
    unitPrice: 0
  });

  // Form State for "Receitas"
  const [recipeFormData, setRecipeFormData] = useState({
    name: '',
    yieldQty: 1,
    yieldUnit: 'kg'
  });

  const [recipeSubItems, setRecipeSubItems] = useState<Array<{
    ingredientId: string;
    name: string;
    unit: string;
    unitPrice: number;
    qty: number;
  }>>([]);

  const [newSubItem, setNewSubItem] = useState({
    name: '',
    qty: 1,
    unit: 'kg',
    unitPrice: 0
  });

  useEffect(() => {
    if (!ingredients || ingredients.length === 0) return;
    setRecipeSubItems(prev => prev.map(sub => {
      const found = ingredients.find(i => i.name.toLowerCase().trim() === sub.name.toLowerCase().trim());
      if (found && typeof found.unitPrice === 'number') {
        return {
          ...sub,
          unitPrice: found.unitPrice,
          unit: found.unit || sub.unit
        };
      }
      return sub;
    }));
  }, [ingredients]);

  const filteredItems = ingredients.filter((item) => {
    if (mode === 'itens' && item.isRecipe) return false;
    if (mode === 'receitas' && !item.isRecipe) return false;

    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    if (mode === 'receitas') {
      setRecipeSubItems([]);
      setNewSubItem({ name: '', qty: 1, unit: 'kg', unitPrice: 0 });
      setRecipeFormData({
        name: '',
        yieldQty: 1,
        yieldUnit: 'kg'
      });
    } else {
      setItemFormData({
        name: '',
        unit: 'kg',
        unitPrice: 0
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: RawIngredientItem) => {
    setEditingItem(item);
    if (mode === 'receitas') {
      const existingSubItems = item.subItems || [];
      setRecipeSubItems(existingSubItems.map(sub => ({
        ingredientId: sub.ingredientId || 'sub-' + Math.random(),
        name: sub.name,
        unit: sub.unit || 'kg',
        unitPrice: sub.unitPrice || 0,
        qty: sub.qty
      })));
      setNewSubItem({ name: '', qty: 1, unit: 'kg', unitPrice: 0 });
      setRecipeFormData({
        name: item.name,
        yieldQty: item.yieldQty || 1,
        yieldUnit: item.unit
      });
    } else {
      setItemFormData({
        name: item.name,
        unit: item.unit,
        unitPrice: item.unitPrice
      });
    }
    setIsModalOpen(true);
  };

  // Handle Duplicate Item
  const handleDuplicate = (item: RawIngredientItem) => {
    onAddIngredient({
      code: item.code || '',
      supplier: item.supplier || '',
      name: `${item.name} (Cópia)`,
      unit: item.unit,
      yieldQty: item.yieldQty,
      unitPrice: item.unitPrice,
      fc: 1.0,
      category: item.category || 'Geral',
      isRecipe: item.isRecipe,
      subItems: item.subItems
    });
  };

  // Add Item Submit (Salvar Item)
  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) return;

    if (editingItem) {
      onUpdateIngredient({
        ...editingItem,
        name: itemFormData.name,
        category: 'Geral',
        unit: itemFormData.unit,
        unitPrice: itemFormData.unitPrice,
        fc: 1.0,
        lastUpdated: new Date().toLocaleDateString('pt-BR')
      });
    } else {
      onAddIngredient({
        code: '',
        supplier: '',
        name: itemFormData.name,
        category: 'Geral',
        unit: itemFormData.unit,
        unitPrice: itemFormData.unitPrice,
        fc: 1.0,
        isRecipe: false
      });
    }
    setIsModalOpen(false);
  };

  // Recipe sub-items handlers
  const handleAddRecipeSubItem = () => {
    if (!newSubItem.name.trim()) return;
    setRecipeSubItems([
      ...recipeSubItems,
      {
        ingredientId: 'sub-' + Date.now(),
        name: newSubItem.name.trim(),
        unit: newSubItem.unit,
        unitPrice: newSubItem.unitPrice,
        qty: newSubItem.qty
      }
    ]);
    setNewSubItem({ name: '', qty: 1, unit: 'kg', unitPrice: 0 });
  };

  const handleRemoveRecipeSubItem = (index: number) => {
    setRecipeSubItems(recipeSubItems.filter((_, idx) => idx !== index));
  };

  const handleRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeFormData.name.trim()) return;

    const activeSubItems = recipeSubItems.map(i => ({
      ingredientId: i.ingredientId,
      name: i.name,
      qty: i.qty,
      unit: i.unit,
      unitPrice: i.unitPrice
    }));

    if (activeSubItems.length === 0) {
      alert('Adicione pelo menos um item para a receita.');
      return;
    }

    const totalCost = activeSubItems.reduce((acc, sub) => acc + sub.qty * sub.unitPrice, 0);
    const effectiveYield = recipeFormData.yieldQty > 0 ? recipeFormData.yieldQty : 1;
    const finalUnitPrice = parseFloat((totalCost / effectiveYield).toFixed(2));

    if (editingItem) {
      onUpdateIngredient({
        ...editingItem,
        name: recipeFormData.name,
        unit: recipeFormData.yieldUnit,
        yieldQty: recipeFormData.yieldQty,
        unitPrice: finalUnitPrice,
        subItems: activeSubItems,
        lastUpdated: new Date().toLocaleDateString('pt-BR')
      });
    } else {
      onAddIngredient({
        code: '',
        supplier: 'Produção Própria',
        name: recipeFormData.name,
        unit: recipeFormData.yieldUnit,
        yieldQty: recipeFormData.yieldQty,
        unitPrice: finalUnitPrice,
        fc: 1.0,
        category: 'Receitas',
        isRecipe: true,
        subItems: activeSubItems
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {mode === 'receitas' ? (
              <BookOpen size={24} className="text-[#38261E]" />
            ) : (
              <Package size={24} className="text-[#38261E]" />
            )}
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'receitas'
                ? 'Cadastrar Nova Receita'
                : 'Cadastrar Novo Item'}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode !== 'receitas' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <button
                onClick={handleDownloadTemplate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
                title="Baixar arquivo modelo Excel"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span>Baixar Arquivo Modelo</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Importar itens via planilha"
              >
                <Upload size={16} />
                <span>Importar Planilha</span>
              </button>
            </>
          )}

          {/* CADASTRAR NOVO ITEM / RECEITA */}
          <button
            onClick={handleOpenCreate}
            className="bg-[#2D201A] hover:bg-[#1A1513] text-white border border-[#4A352A] font-bold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>{mode === 'receitas' ? 'Cadastrar Nova Receita' : 'Cadastrar Novo Item'}</span>
          </button>
        </div>
      </div>

      {/* IMPORT SUCCESS MESSAGE */}
      {importMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{importMessage}</span>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={mode === 'receitas' ? 'Buscar por receita...' : 'Buscar por nome do item...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 placeholder-slate-400"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          {filteredItems.length} {mode === 'receitas' ? 'Receitas Cadastradas' : 'Itens Cadastrados'}
        </span>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 whitespace-nowrap">{mode === 'receitas' ? 'Nome da Receita' : 'Nome do Item'}</th>
                {mode !== 'itens' && <th className="p-4 whitespace-nowrap">Categoria</th>}
                <th className="p-4 text-center whitespace-nowrap">Unidade</th>
                <th className="p-4 text-right whitespace-nowrap">Preço (R$)</th>
                <th className="p-4 text-right whitespace-nowrap">Última Atualização</th>
                <th className="p-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                    {item.name}
                  </td>

                  {mode !== 'itens' && (
                    <td className="p-4 text-slate-700 whitespace-nowrap font-medium">
                      <span className="bg-orange-50 text-orange-900 px-2.5 py-1 rounded-lg border border-orange-200 text-[11px]">
                        {item.category || 'Geral'}
                      </span>
                    </td>
                  )}

                  <td className="p-4 text-center whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-lg border border-slate-200">
                      {item.unit}
                    </span>
                  </td>

                  <td className="p-4 text-right font-bold text-slate-900 font-mono text-sm whitespace-nowrap">
                    R$ {formatNumeroBRL(item.unitPrice)} / {item.unit}
                  </td>

                  <td className="p-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {item.lastUpdated || 'Hoje'}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                        title="Alterar"
                      >
                        <Edit size={15} />
                      </button>

                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                        title="Duplicar"
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        onClick={() => onDeleteIngredient(item.id)}
                        className="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 font-bold rounded-lg transition-colors cursor-pointer"
                        title="Retirar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhum {mode === 'receitas' ? 'registro de receita' : 'item'} cadastrado.
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL FOR ITENS */}
      {isModalOpen && mode !== 'receitas' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingItem ? 'Alterar Item' : 'Cadastrar Novo Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Itens e receitas</label>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="Ex: Filé Mignon Fatiado"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Unidade *</label>
                  <select
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="un">un</option>
                    <option value="g">g</option>
                    <option value="mL">mL</option>
                    <option value="lata">lata</option>
                    <option value="pct">pct</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Preço (R$) *</label>
                  <MoneyInput
                    value={itemFormData.unitPrice}
                    onChange={(val) => setItemFormData({ ...itemFormData, unitPrice: val })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2D201A] hover:bg-[#1A1513] text-white font-bold rounded-xl cursor-pointer shadow-xs border border-[#4A352A] flex items-center space-x-2"
                >
                  <Check size={16} />
                  <span>Salvar Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL FOR RECEITAS */}
      {isModalOpen && mode === 'receitas' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingItem ? 'Alterar Receita' : 'Cadastrar Nova Receita'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecipeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Nome da Receita *</label>
                <input
                  type="text"
                  value={recipeFormData.name}
                  onChange={(e) => setRecipeFormData({ ...recipeFormData, name: e.target.value })}
                  placeholder="Ex: Molho de Tomate Rústico Especial"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Rendimento (Qtd) *</label>
                  <DecimalInput
                    value={recipeFormData.yieldQty}
                    onChange={(val) => setRecipeFormData({ ...recipeFormData, yieldQty: val })}
                    placeholder="0,00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Unidade *</label>
                  <select
                    value={recipeFormData.yieldUnit}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, yieldUnit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="un">un</option>
                    <option value="g">g</option>
                    <option value="mL">mL</option>
                  </select>
                </div>
              </div>

              {/* ADD ITEM TO RECIPE */}
              <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-900 uppercase text-xs">Itens e Componentes da Receita</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Digite o nome do item, quantidade e unidade para adicionar à receita.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-300 space-y-3 sm:space-y-0 sm:flex sm:items-end sm:gap-2">
                  <div className="flex-[2] min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nome do Item *</label>
                    <input
                      type="text"
                      list="raw-ingredients-autocomplete"
                      value={newSubItem.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = ingredients.find(i => i.name.toLowerCase() === val.toLowerCase());
                        if (matched) {
                          setNewSubItem({
                            ...newSubItem,
                            name: val,
                            unit: matched.unit || 'kg',
                            unitPrice: matched.unitPrice || 0
                          });
                        } else {
                          setNewSubItem({ ...newSubItem, name: val });
                        }
                      }}
                      placeholder="Ex: Farinha de Trigo"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                    <datalist id="raw-ingredients-autocomplete">
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Qtd *</label>
                    <DecimalInput
                      value={newSubItem.qty}
                      onChange={(val) => setNewSubItem({ ...newSubItem, qty: val })}
                      placeholder="0,00"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-sm text-center font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Unidade *</label>
                    <select
                      value={newSubItem.unit}
                      disabled
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-2 py-3 text-sm font-bold text-slate-700 cursor-not-allowed"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="un">un</option>
                      <option value="g">g</option>
                      <option value="mL">mL</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-32 text-center">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Total (R$)</label>
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-3 text-sm text-center font-mono font-bold text-amber-900">
                      R$ {formatNumeroBRL(newSubItem.qty * newSubItem.unitPrice)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRecipeSubItem}
                    className="w-full sm:w-12 h-12 bg-[#2D201A] hover:bg-[#1A1513] text-white font-bold p-3 rounded-xl flex items-center justify-center cursor-pointer shrink-0 transition-colors shadow-md"
                  >
                    <Plus size={22} />
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recipeSubItems.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Nenhum item adicionado ainda. Digite o nome acima e clique em Adicionar.
                    </div>
                  ) : (
                    recipeSubItems.map((sub, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs shadow-2xs"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <span className="font-bold text-slate-900 block break-words" title={sub.name}>
                            {sub.name}
                          </span>
                        </div>
                        <div className="w-full sm:w-32 flex items-center space-x-1">
                          <DecimalInput
                            value={sub.qty}
                            onChange={(val) => {
                              const updated = [...recipeSubItems];
                              updated[idx].qty = val;
                              setRecipeSubItems(updated);
                            }}
                            placeholder="0,00"
                            className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-slate-900"
                          />
                          <span className="font-bold text-slate-600">{sub.unit}</span>
                        </div>
                        <div className="w-28 text-right font-mono font-bold text-slate-900">
                          R$ {formatNumeroBRL(sub.qty * sub.unitPrice)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeSubItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="text-slate-900 font-bold text-sm">
                  Custo Total Calculado: <span className="font-mono text-amber-700">R$ {formatNumeroBRL(recipeSubItems.reduce((acc, sub) => acc + sub.qty * sub.unitPrice, 0))}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#2D201A] hover:bg-[#1A1513] text-white font-bold rounded-xl cursor-pointer shadow-xs border border-[#4A352A] flex items-center space-x-2"
                  >
                    <Check size={16} />
                    <span>Salvar Receita</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
