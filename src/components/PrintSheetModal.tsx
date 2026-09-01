import React from 'react';
import { TechnicalSheet } from '../types';
import { Printer, X, Scale } from 'lucide-react';

interface PrintSheetModalProps {
  sheet: TechnicalSheet;
  onClose: () => void;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({ sheet, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden my-auto flex flex-col kitchen-print-modal">
        
        {/* NON-PRINTING ACTION BAR */}
        <div className="no-print bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="bg-orange-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg uppercase tracking-wide">
              Ficha Técnica de Parede (Cozinha)
            </span>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Fontes grandes & foto visíveis à distância. Sem modo de preparo.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Printer size={18} />
              <span>IMPRIMIR FICHA (A4)</span>
            </button>
            
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl cursor-pointer transition-colors"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA (A4 WALL SHEET FORMAT SPEC 2.1) */}
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          
          {/* HEADER STRIP - "FICHA TÉCNICA DE PREPARAÇÃO" */}
          <div className="kitchen-print-header bg-orange-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-orange-100">
                BASE CHEF — GESTÃO DE RESTAURANTE
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5">
                FICHA TÉCNICA DE PREPARAÇÃO
              </h1>
            </div>
            <div className="text-right font-bold text-xs sm:text-sm bg-black/20 px-4 py-2 rounded-xl backdrop-blur-xs">
              <span className="text-orange-200 block text-[10px] uppercase">Data da Atualização</span>
              <span>{sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* DISH TITLE & LARGE PHOTO SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 p-5 rounded-2xl border-2 border-slate-200">
            <div className="md:col-span-2 space-y-3">
              <span className="bg-orange-100 text-orange-800 font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider">
                {sheet.category}
              </span>
              
              {/* LARGE DISH NAME FOR KITCHEN DISTANCE VIEWING */}
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight uppercase tracking-tight">
                {sheet.name}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm sm:text-base font-bold text-slate-800">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-normal block uppercase">Quantidade e Unidade Cadastrada</span>
                  <p className="text-base sm:text-xl font-extrabold text-orange-600">
                    {sheet.yieldServings} {sheet.portionWeight || 'un'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-normal block uppercase">Data da Atualização</span>
                  <p className="text-base sm:text-xl font-extrabold text-slate-900">
                    {sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* HIGH-VISIBILITY DISH PHOTO NEXT TO HEADER */}
            <div className="relative group rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-md aspect-square max-h-[220px] mx-auto md:mx-0 w-full bg-slate-100">
              <img
                src={sheet.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                alt={sheet.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 p-2 text-center">
                <span className="text-white text-[11px] font-bold uppercase tracking-wider">Foto do Prato Padrão</span>
              </div>
            </div>
          </div>

          {/* INGREDIENTS TABLE WITH COLUMNS SPECIFIED IN SPEC 2.1 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Scale size={22} className="text-orange-600" />
                Tabela de Itens & Pesos para Manipulação
              </h3>
              <span className="text-xs font-bold bg-slate-200 text-slate-800 px-3 py-1 rounded-full uppercase">
                {sheet.ingredients.length} Itens
              </span>
            </div>

            <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left kitchen-print-table">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-300 text-xs sm:text-sm uppercase">
                  <tr>
                    <th className="p-3 sm:p-4">Item</th>
                    <th className="p-3 sm:p-4 text-center">Unidade</th>
                    <th className="p-3 sm:p-4 text-center text-orange-700 bg-orange-50 font-black">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 text-sm sm:text-base">
                  {sheet.ingredients.map((ing, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                      {/* ITEM NAME EXTRA BIG */}
                      <td className="p-3 sm:p-4 font-black text-slate-900 text-base sm:text-lg">
                        {ing.name}
                      </td>
                      <td className="p-3 sm:p-4 text-center font-bold text-slate-600">
                        {ing.unit}
                      </td>
                      {/* UNICO CAMPO DE PESO */}
                      <td className="p-3 sm:p-4 text-center font-black text-orange-600 bg-orange-50/50 text-base sm:text-xl">
                        {ing.grossQty} {ing.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER SUMMARY BOX */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 border-2 border-slate-800 text-center sm:text-left">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase block">Quantidade e Unidade</span>
              <p className="text-xl sm:text-2xl font-extrabold text-orange-400 mt-0.5">
                {sheet.yieldServings} {sheet.portionWeight || 'un'}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-bold uppercase block">Data da Atualização</span>
              <p className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 font-mono">
                {sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* WALL NOTICE */}
          <div className="text-center pt-2 border-t border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Impresso via Base Chef • Fixar em local visível de pré-preparo na cozinha
          </div>

        </div>

      </div>
    </div>
  );
};
