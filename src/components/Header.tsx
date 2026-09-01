import React from 'react';
import { Plus, Layers, BarChart3, Users, Building2, Percent } from 'lucide-react';
import { BaseChefLogo } from './BaseChefLogo';

export type ActiveTabType = 'fichas' | 'custos-fixos' | 'custos-variaveis' | 'precificacao' | 'comunidade';

interface HeaderProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  onOpenNewModal: () => void;
  totalProductsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  totalProductsCount
}) => {
  return (
    <header className="no-print bg-[#1A1513] border-b border-[#2E231D] sticky top-0 z-30 shadow-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* LOGO & BRANDING */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center space-x-3">
            <BaseChefLogo className="w-10 h-10 shrink-0 shadow-md rounded-xl overflow-hidden" />

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-none">
                  Margem Chef
                </h1>
                <span className="bg-gradient-to-r from-[#3E2B20] to-[#261C16] border border-[#4E372A] text-[#F3EBE3] font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  Base Chef
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Gestão de fichas técnicas, cálculo de custos e inteligência artificial
              </p>
            </div>
          </div>

          {/* MOBILE NEW BUTTON */}
          <button
            onClick={onOpenNewModal}
            className="lg:hidden bg-[#2D201A] hover:bg-[#1A1513] border border-[#4A352A] text-white font-bold p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-[#1A1513]/40"
            title="Nova Ficha Técnica"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* MAIN NAVIGATION TABS */}
        <nav className="flex items-center space-x-1 bg-[#0F0C0B] p-1.5 rounded-2xl border border-[#2E231D] w-full lg:w-auto justify-start overflow-x-auto">
          <button
            onClick={() => setActiveTab('fichas')}
            className={`px-3.5 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fichas'
                ? 'bg-[#2D201A] text-white border border-[#4A352A] shadow-md shadow-[#1A1513]/40'
                : 'text-zinc-400 hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Layers size={16} />
            <span>Fichas ({totalProductsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('custos-fixos')}
            className={`px-3.5 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'custos-fixos'
                ? 'bg-[#2D201A] text-white border border-[#4A352A] shadow-md shadow-[#1A1513]/40'
                : 'text-zinc-400 hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Building2 size={16} />
            <span>Custos Fixos</span>
          </button>

          <button
            onClick={() => setActiveTab('custos-variaveis')}
            className={`px-3.5 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'custos-variaveis'
                ? 'bg-[#2D201A] text-white border border-[#4A352A] shadow-md shadow-[#1A1513]/40'
                : 'text-zinc-400 hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Percent size={16} />
            <span>Custos Variáveis</span>
          </button>

          <button
            onClick={() => setActiveTab('precificacao')}
            className={`px-3.5 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'precificacao'
                ? 'bg-[#2D201A] text-white border border-[#4A352A] shadow-md shadow-[#1A1513]/40'
                : 'text-zinc-400 hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <BarChart3 size={16} />
            <span>Precificação & Margem</span>
          </button>

          <button
            onClick={() => setActiveTab('comunidade')}
            className={`px-3.5 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'comunidade'
                ? 'bg-[#2D201A] text-white border border-[#4A352A] shadow-md shadow-[#1A1513]/40'
                : 'text-zinc-400 hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Users size={16} />
            <span>Comunidade</span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          </button>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden lg:flex items-center space-x-3">
          <button
            onClick={onOpenNewModal}
            className="bg-[#2D201A] hover:bg-[#1A1513] border border-[#4A352A] text-white font-fredoka font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-[#1A1513]/40 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Nova Ficha Técnica</span>
          </button>
        </div>

      </div>
    </header>
  );
};
