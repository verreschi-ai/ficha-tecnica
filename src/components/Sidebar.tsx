import React, { useState } from 'react';
import { ActiveTabType, User } from '../types';
import { BaseChefLogo } from './BaseChefLogo';
import {
  CookingPot,
  LayoutDashboard,
  Package,
  BookOpen,
  Building2,
  Percent,
  Layers,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  Sparkles,
  User as UserIcon,
  Clock,
  MessageCircle,
  CreditCard,
  ShoppingCart,
  Car,
  Sliders,
  Wand2,
  Store
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  onOpenNewModal: () => void;
  totalProductsCount: number;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  currentUser: User | null;
  onLogout: () => void;
  showBuyButton?: boolean;
  onOpenPixModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  totalProductsCount,
  isAdmin,
  setIsAdmin,
  currentUser,
  onLogout,
  showBuyButton = false,
  onOpenPixModal
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [
    {
      title: 'OPERACIONAL',
      items: [
        { id: 'dashboard' as ActiveTabType, label: 'Painel Principal', icon: LayoutDashboard },
        { id: 'itens' as ActiveTabType, label: 'Itens de Estoque', icon: Package },
        { id: 'receitas' as ActiveTabType, label: 'Receitas Base', icon: BookOpen },
        { id: 'fichas' as ActiveTabType, label: 'Cadastro de Produtos', icon: Layers, badge: totalProductsCount },
      ]
    },
    {
      title: 'CUSTOS & PRECIFICAÇÃO',
      items: [
        { id: 'custos-fixos' as ActiveTabType, label: 'Custos Fixos', icon: Building2 },
        { id: 'custos-variaveis' as ActiveTabType, label: 'Custos Variáveis', icon: Percent },
        { id: 'precificacao' as ActiveTabType, label: 'Relatório de Precificação', icon: BarChart3, highlight: true },
        { id: 'simulador' as ActiveTabType, label: 'Simulador de Cenários ⚡', icon: Sliders, badgeText: 'NOVO' },
      ]
    },
    {
      title: 'CANAIS & DELIVERY',
      items: [
        { id: 'pdv-loja' as ActiveTabType, label: 'PDV Loja', icon: Store, badgeText: 'NOVO' },
        { id: 'ifood' as ActiveTabType, label: 'Preço iFood ⭐', icon: ShoppingCart, badgeText: 'NOVO' },
        { id: '99food' as ActiveTabType, label: 'Preço 99Food 🚗', icon: Car, badgeText: 'NOVO' },
      ]
    },
    {
      title: 'GESTÃO & CONTA',
      items: [
        { id: 'comunidade' as ActiveTabType, label: 'Comunidade', icon: Users },
        ...(isAdmin ? [{ id: 'admin' as ActiveTabType, label: 'Painel Admin', icon: ShieldCheck, adminOnly: true }] : []),
        { id: 'configuracoes' as ActiveTabType, label: 'Configurações', icon: Settings },
        { id: 'assinatura' as ActiveTabType, label: 'Minha Assinatura', icon: CreditCard },
      ]
    }
  ];

  const handleSelectTab = (tab: ActiveTabType) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const isTrialUser = currentUser && (currentUser.licenseType === 'daily' || currentUser.status_conta === 'trial');

  return (
    <>
      {/* MOBILE TOP BAR WITH HAMBURGER MENU */}
      <div className="lg:hidden no-print bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl transition-all cursor-pointer active:scale-95"
            aria-label="Abrir menu lateral"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center space-x-2">
            <BaseChefLogo className="w-8 h-8 shrink-0 rounded-lg overflow-hidden shadow-xs" />
            <div>
              <h1 className="font-extrabold text-sm text-slate-900 leading-none">
                Margem Chef
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Base Chef • Gestão</p>
            </div>
          </div>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Sair e voltar para tela de login"
          >
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        )}
      </div>

      {/* BACKDROP FOR MOBILE */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* FIXED SIDEBAR CONTAINER FOR DESKTOP & MOBILE DRAWERS */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 w-68 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-sm ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* TOP BRANDING & LOGO */}
        <div className="overflow-y-auto flex-1">
          {/* STATUS PULSE BAR */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-b border-emerald-100/60 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
              <span className="text-[10px] font-bold text-emerald-950 tracking-tight">Sistema Conectado</span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
              Tempo Real
            </span>
          </div>

          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <BaseChefLogo className="w-10 h-10 shrink-0 rounded-2xl overflow-hidden shadow-md" />
              <div>
                <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                  Margem Chef
                </h1>
                <span className="text-[10px] text-[#38261E] font-extrabold uppercase tracking-widest block mt-1">
                  Base Chef • Gestão 2.0
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* GROUPED NAVIGATION */}
          <nav className="p-3 space-y-4">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1A1513] text-white shadow-sm shadow-[#1A1513]/20 translate-x-0.5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          size={16}
                          className={isActive ? 'text-amber-300' : 'text-slate-400'}
                        />
                        <span className="tracking-tight">{item.label}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {(item as any).badgeText && (
                          <span className="text-[9px] bg-gradient-to-r from-orange-600 to-amber-600 text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shadow-2xs">
                            {(item as any).badgeText}
                          </span>
                        )}

                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {(item as any).adminOnly && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'
                          }`}>
                            Admin
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* BOTTOM USER CARD, BUY ACCESS & LOGOUT */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
          
          {/* BOTÃO COMPRE AGORA PARA USUÁRIOS DE TESTE 24H */}
          {isTrialUser && (
            <button
              type="button"
              onClick={() => setActiveTab('assinatura')}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-fredoka font-bold text-xs py-3 px-3 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 animate-pulse"
            >
              <ShoppingCart size={16} />
              <span>Compre Agora (Assinar Pro)</span>
            </button>
          )}

          {/* BUY ACCESS BUTTON FOR NON-VITALICIO USERS */}
          {showBuyButton && !isTrialUser && (
            <button
              type="button"
              onClick={() => setActiveTab('assinatura')}
              className="w-full bg-[#1A1513] hover:bg-[#2D201A] border border-[#3D2B1F] text-white font-fredoka font-bold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>Liberar Assinatura Pro</span>
            </button>
          )}

          {currentUser && (
            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#1A1513] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name[0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block break-words leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block break-words">
                      {currentUser.restaurantName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                  title="Sair e voltar para a tela de login"
                >
                  <LogOut size={14} />
                  <span>Sair</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase">Licença:</span>
                {currentUser.role === 'admin' ? (
                  <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md uppercase">
                    Admin Master
                  </span>
                ) : currentUser.status_assinatura === 'ativo' ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md uppercase flex items-center space-x-1">
                    <Sparkles size={10} />
                    <span>Profissional</span>
                  </span>
                ) : (
                  <span className="bg-[#F5EFE8] text-[#2D201A] font-bold px-2 py-0.5 rounded-md uppercase flex items-center space-x-1 border border-[#E5D7C8]">
                    <Clock size={10} />
                    <span>Degustação 24h</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="bg-[#F5EFE8] p-2.5 rounded-xl border border-[#E5D7C8] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-[#2D201A] font-bold">
                <ShieldCheck size={16} className="text-[#2D201A]" />
                <span>Modo Admin Ativo</span>
              </div>
              <span className="text-[10px] bg-[#1A1513] text-white font-mono font-bold px-1.5 py-0.5 rounded">
                Master
              </span>
            </div>
          )}

          <div className="text-[10px] text-slate-400 text-center font-medium">
            Base Chef • v3.0 Sistema de Gestão
          </div>
        </div>
      </aside>
    </>
  );
};
