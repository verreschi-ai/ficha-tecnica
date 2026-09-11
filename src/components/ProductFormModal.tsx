import React, { useState, useRef } from 'react';
import { TechnicalSheet, RawIngredientItem } from '../types';
import { X, Check, Plus, Trash2, Upload, Image as ImageIcon, Calculator } from 'lucide-react';
import { MoneyInput } from './MoneyInput';
import { DecimalInput } from './DecimalInput';
import { formatNumeroBRL } from '../utils/formatters';

interface ProductFormModalProps {
  initialSheet?: TechnicalSheet | null;
  onClose: () => void;
  onSave: (sheet: TechnicalSheet) => void;
  existingCount: number;
  availableItems?: RawIngredientItem[];
  availableRecipes?: TechnicalSheet[];
  categoriesList?: string[];
  onAddCategory?: (cat: string) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialSheet,
  onClose,
  onSave,
  existingCount,
  availableItems = [],
  availableRecipes = [],
  categoriesList = ['Pratos Principais', 'Entradas', 'Sobremesas', 'Bebidas & Drinks', 'Porções', 'Mini-porção'],
  onAddCategory
}) => {
  const [name, setName] = useState(initialSheet?.name || '');
  const [category, setCategory] = useState<string>(initialSheet?.category || categoriesList[0] || 'Pratos Principais');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [yieldServings, setYieldServings] = useState<number>(initialSheet?.yieldServings || 1);
  const [prepTime, setPrepTime] = useState<string>(initialSheet?.prepTime || '20 min');
  const [sellingPrice, setSellingPrice] = useState<number>(initialSheet?.sellingPrice || 0);
  const [imageUrl, setImageUrl] = useState<string>(
    initialSheet?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  );
  const [isActive, setIsActive] = useState<boolean>(initialSheet?.isActive !== false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ingredients inside the recipe
  // O que fica salvo na ficha usa grossQty/netQty/totalCost (tipo Ingredient), não "qty" —
  // ao reabrir pra edição, precisa converter de volta pro formato que este formulário usa
  // internamente. Sem isso, toda quantidade carregava como undefined (exibida como zerada) e
  // o totalizador (Custo Total/CMV) somava undefined * preço = NaN, sumindo da tela.
  const [ingredients, setIngredients] = useState<Array<{ name: string; qty: number; unit: string; unitPrice: number; type: 'item' | 'recipe' }>>(
    (initialSheet?.ingredients || []).map((ing: any) => ({
      name: ing.name,
      qty: ing.grossQty > 0 ? ing.grossQty : (ing.qty > 0 ? ing.qty : 0),
      unit: ing.unit,
      unitPrice: ing.unitPrice,
      type: ing.type || 'item'
    }))
  );

  // Selection state: First select the item/recipe name, then auto-detect type
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [newIngQty, setNewIngQty] = useState<number>(1);

  // Preparation steps
  const [steps, setSteps] = useState<string[]>(initialSheet?.preparationSteps || ['']);

  // Handle image file upload (click only)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImageUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const formatted = newCategoryName.trim();
    if (onAddCategory) {
      onAddCategory(formatted);
    }
    setCategory(formatted);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // Find if selected ID belongs to item or recipe
  const filteredRecipes = availableRecipes.filter(r => !initialSheet || r.id !== initialSheet.id);

  const getSourceDetails = (id: string) => {
    const foundItem = availableItems.find(i => i.id === id || i.name === id);
    if (foundItem) {
      return {
        name: foundItem.name,
        unit: foundItem.unit || 'kg',
        unitPrice: foundItem.unitPrice || 0,
        type: 'item' as const
      };
    }
    const foundRecipe = filteredRecipes.find(r => r.id === id || r.name === id);
    if (foundRecipe) {
      const unitCost = foundRecipe.yieldServings > 0 ? foundRecipe.totalRecipeCost / foundRecipe.yieldServings : foundRecipe.totalRecipeCost;
      return {
        name: foundRecipe.name,
        unit: 'porção',
        unitPrice: unitCost,
        type: 'recipe' as const
      };
    }
    return null;
  };

  const currentSelectedSource = getSourceDetails(selectedSourceId);

  // Add ingredient
  const handleAddSelectedSource = () => {
    if (!selectedSourceId || !currentSelectedSource) return;

    const existingIdx = ingredients.findIndex(i => i.name.toLowerCase() === currentSelectedSource.name.toLowerCase());
    if (existingIdx >= 0) {
      const updated = [...ingredients];
      updated[existingIdx].qty += newIngQty;
      setIngredients(updated);
    } else {
      setIngredients([
        ...ingredients,
        {
          name: currentSelectedSource.name,
          qty: newIngQty,
          unit: currentSelectedSource.unit,
          unitPrice: currentSelectedSource.unitPrice,
          type: currentSelectedSource.type
        }
      ]);
    }

    setSelectedSourceId('');
    setNewIngQty(1);
  };

  // Alter quantity directly in list
  const handleUpdateIngredientQty = (index: number, newQty: number) => {
    const updated = [...ingredients];
    updated[index].qty = Math.max(0.001, newQty);
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Calculations for summary (Only Custo Total and Custo por Porção)
  const totalRecipeCost = ingredients.reduce((acc, ing) => acc + (ing.qty * ing.unitPrice), 0);
  const costPerPortion = yieldServings > 0 ? totalRecipeCost / yieldServings : totalRecipeCost;
  const cmv = sellingPrice > 0 ? Number(((costPerPortion / sellingPrice) * 100).toFixed(1)) : 0;
  const margin = sellingPrice > 0 ? Number((100 - cmv).toFixed(1)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedSheet: TechnicalSheet = {
      id: initialSheet?.id || `ft-${Date.now()}`,
      code: initialSheet?.code || `FT-${(existingCount + 1).toString().padStart(3, '0')}`,
      name: name.trim(),
      category: category as any,
      isActive,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      yieldServings,
      portionWeight: `${yieldServings > 0 ? (1000 / yieldServings).toFixed(0) : 350}g`,
      prepTime,
      costPerPortion,
      totalRecipeCost,
      sellingPrice,
      cmv,
      margin,
      status: 'ideal',
      // O tipo Ingredient (e o motor de recálculo em cascata no App.tsx) espera grossQty/netQty/fc/
      // totalCost — não "qty". Salvar como "qty" faz grossQty ficar undefined, e undefined * preço
      // vira NaN, que o `Number(...) || 0` de todo o resto do app disfarça como um custo de R$ 0,00.
      ingredients: ingredients.map(({ name, qty, unit, unitPrice }) => ({
        name,
        grossQty: qty,
        netQty: qty,
        unit,
        unitPrice,
        fc: 1,
        totalCost: parseFloat((qty * unitPrice).toFixed(2))
      })),
      preparationSteps: steps.filter(s => s.trim().length > 0),
      createdAt: initialSheet?.createdAt || new Date().toLocaleDateString('pt-BR')
    };

    onSave(savedSheet);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col space-y-6 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <span className="bg-orange-100 text-orange-800 font-bold text-[10px] px-2.5 py-0.5 rounded-md border border-orange-200 uppercase">
              {initialSheet ? 'Editar Ficha Técnica / Produto' : 'Novo Cadastro Completo de Produto'}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {initialSheet ? `Alterar ${initialSheet.name}` : 'Cadastro Completo de Produto e Ficha Técnica'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* 1. PHOTO AT THE VERY BEGINNING (CLICK ONLY, NO HTTPS INPUT) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-700 uppercase tracking-wider">
              Foto do Produto (Início da Página)
            </label>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-sm flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
              </div>

              <div className="flex-1 w-full">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-slate-300 hover:border-orange-500 bg-white hover:bg-orange-50/30"
                >
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="font-bold text-slate-700 text-xs">Clique aqui para selecionar a foto do prato</p>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP suportados</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Prato / Produto *
              </label>
              <input
                type="text"
                placeholder="Ex: Filé à Parmegiana com Fritas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* CATEGORY & TYPE REGISTRATION */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Categoria / Tipo *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-orange-600 hover:text-orange-800 font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{isAddingCategory ? 'Cancelar' : 'Nova Categoria'}</span>
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Nome da nova categoria..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="bg-[#2D201A] text-white px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preço de Venda Sugerido (R$) *
              </label>
              <MoneyInput
                value={sellingPrice}
                onChange={setSellingPrice}
                placeholder="Ex: 59,90"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rendimento (Porções) *
              </label>
              <DecimalInput
                value={yieldServings}
                onChange={(val) => setYieldServings(val || 1)}
                placeholder="1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* 3. INGREDIENTS SECTION (FLAT LIST, NO OPTGROUPS/SEGMENTATION) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Itens e Receitas da Ficha Técnica</span>
              <span className="text-[10px] text-slate-500 font-normal">Selecione o item ou receita</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              {/* Flat list select (no optgroup segmentation) */}
              <div className="sm:col-span-7">
                <label className="block font-bold text-slate-600 mb-1">Selecione o Item / Receita *</label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                >
                  <option value="">-- Escolher Item ou Receita --</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (R$ {formatNumeroBRL(item.unitPrice)}/{item.unit})
                    </option>
                  ))}
                  {filteredRecipes.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.name} (R$ {formatNumeroBRL(rec.costPerPortion || 0)}/porção)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity / Unit */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-slate-600 mb-1">
                  Quantidade ({currentSelectedSource ? currentSelectedSource.unit : 'kg/un'})
                </label>
                <DecimalInput
                  value={newIngQty}
                  onChange={(val) => setNewIngQty(val)}
                  placeholder="0,00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-center"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddSelectedSource}
                  disabled={!selectedSourceId}
                  className="w-full bg-[#2D201A] hover:bg-[#1A1513] disabled:bg-slate-300 text-white font-bold p-2 rounded-xl flex items-center justify-center cursor-pointer h-10"
                  title="Adicionar"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* INGREDIENTS LIST */}
            <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
              {ingredients.length === 0 ? (
                <p className="text-slate-400 text-center py-4 italic">Nenhum insumo ou receita adicionado a esta ficha técnica.</p>
              ) : (
                ingredients.map((ing, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      <span className="font-bold text-slate-900 text-sm">{ing.name}</span>
                      <span className="text-slate-400 text-[11px] font-mono">R$ {formatNumeroBRL(ing.unitPrice)} / {ing.unit}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto">
                      <div className="flex items-center space-x-1.5">
                        <DecimalInput
                          value={ing.qty}
                          onChange={(val) => handleUpdateIngredientQty(idx, val)}
                          placeholder="0,00"
                          className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-center font-bold text-slate-900"
                        />
                        <span className="text-slate-600 font-bold">{ing.unit}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          R$ {formatNumeroBRL(ing.qty * ing.unitPrice)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. PREPARATION STEPS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider">Modo de Preparo (Passo a Passo)</h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-orange-600 hover:text-orange-800 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Adicionar Passo</span>
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-400 w-6 text-right">#{idx + 1}</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Passo ${idx + 1} do preparo...`}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. AUTOMATIC SUMMARY (CUSTO TOTAL, CUSTO POR PORÇÃO, CMV, MARGEM) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-orange-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-200/60 pb-3">
              <div className="flex items-center space-x-2 text-orange-900">
                <Calculator size={20} />
                <h3 className="font-black text-sm uppercase tracking-wide">Resumo de Custos e CMV (Itens)</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-orange-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Custo Total</span>
                <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">
                  R$ {formatNumeroBRL(totalRecipeCost)}
                </span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-orange-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Custo / Porção</span>
                <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">
                  R$ {formatNumeroBRL(costPerPortion)}
                </span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-orange-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-blue-700 uppercase">CMV (Itens)</span>
                <span className="text-base font-black font-mono text-blue-900 mt-0.5 block">
                  {sellingPrice > 0 ? `${cmv.toFixed(1)}%` : 'Sem Preço'}
                </span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-orange-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase">Margem Lucro</span>
                <span className="text-base font-black font-mono text-emerald-900 mt-0.5 block">
                  {sellingPrice > 0 ? `${margin.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE / INACTIVE TOGGLE */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="block font-bold text-slate-900 uppercase">Item Ativo no Cardápio</span>
              <span className="text-[11px] text-slate-500">Produtos inativos ficam ocultos das vendas.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#2D201A] hover:bg-[#1A1513] text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Check size={16} />
              <span>Salvar Produto Completo</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
