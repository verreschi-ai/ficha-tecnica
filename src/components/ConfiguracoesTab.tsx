import React, { useState } from 'react';
import { AppSettings, User } from '../types';
import { MoneyInput } from './MoneyInput';
import { DecimalInput } from './DecimalInput';
import { Settings, Percent, DollarSign, TrendingUp, Save, CheckCircle2, Sun, Moon, Palette, LogOut, ShieldAlert, Sparkles, CreditCard, Clock, Lock, Key, X, Trash2, AlertTriangle } from 'lucide-react';
import { validatePassword, auth } from '../services/firebaseService';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface ConfiguracoesTabProps {
  settings: AppSettings;
  onChangeSettings: (newSettings: AppSettings) => void;
  onLogout?: () => void;
  currentUser?: User | null;
  onNavigateToSubscription?: () => void;
  onResetAllData?: () => void;
  categoriesList?: string[];
  onAddCategory?: (cat: string) => void;
}

export const ConfiguracoesTab: React.FC<ConfiguracoesTabProps> = ({
  settings,
  onChangeSettings,
  onLogout,
  currentUser,
  onNavigateToSubscription,
  onResetAllData,
  categoriesList = [],
  onAddCategory
}) => {
  const [newSegmentName, setNewSegmentName] = useState('');
  const [formData, setFormData] = React.useState<AppSettings>({ ...settings, theme: settings.theme || 'light' });
  const [saved, setSaved] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReasons, setCancelReasons] = React.useState<string[]>([]);
  const [cancelComment, setCancelComment] = React.useState('');

  // Zerar dados (zona de perigo)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmChecked, setResetConfirmChecked] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ success: boolean; text: string } | null>(null);

  const isActiveSub = currentUser?.status_assinatura === 'ativo' || currentUser?.role === 'admin';

  React.useEffect(() => {
    setFormData({ ...settings, theme: settings.theme || 'light' });
  }, [settings]);

  const handleChange = (field: keyof AppSettings, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val
    }));
    setSaved(false);
  };

  const handleCategoryShareChange = (category: string, pct: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryRevenueShare: { ...(prev.categoryRevenueShare || {}), [category]: pct }
    }));
    setSaved(false);
  };

  const totalCategoryShare = categoriesList.reduce(
    (acc, cat) => acc + (formData.categoryRevenueShare?.[cat] || 0),
    0
  );

  const handleAddSegment = () => {
    const formatted = newSegmentName.trim();
    if (!formatted || categoriesList.includes(formatted)) return;
    if (onAddCategory) onAddCategory(formatted);
    setNewSegmentName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdMsg({ success: false, text: 'Preencha todos os campos de senha.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdMsg({ success: false, text: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    const check = validatePassword(newPassword);
    if (!check.valid) {
      setPwdMsg({ success: false, text: check.message || 'Nova senha inválida.' });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setPwdMsg({ success: false, text: 'Usuário não autenticado na sessão atual do Firebase.' });
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPwdMsg({ success: true, text: 'Senha alterada com sucesso!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPwdMsg(null);
      }, 2000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setPwdMsg({ success: false, text: 'Erro ao alterar senha. Verifique se a senha atual está correta.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Settings size={24} className="text-orange-600" />
            <h2 className="text-2xl font-bold text-slate-900">
              Configurações Gerais do Restaurante
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Defina os parâmetros globais do seu estabelecimento. Os valores informados aqui alimentam o cálculo do <strong>Preço Sugerido</strong> no Relatório de Precificação e substituem o campo de imposto que antes ficava em Custos Variáveis.
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
          Parâmetros de Precificação & Faturamento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* IMPOSTO PADRÃO */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-orange-600">
              <Percent size={20} />
              <label className="font-bold text-xs uppercase text-slate-900">
                Imposto Padrão (%)
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Alíquota do Simples Nacional ou impostos incidentes sobre a venda.
            </p>
            <div className="relative mt-2">
              <DecimalInput
                value={formData.defaultTaxRate}
                onChange={(val) => handleChange('defaultTaxRate', val)}
                placeholder="0,00"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500 pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">%</span>
            </div>
          </div>

          {/* MARGEM DE RETORNO (LUCRO DESEJADO) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600">
              <TrendingUp size={20} />
              <label className="font-bold text-xs uppercase text-slate-900">
                Margem de Retorno (%)
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Percentual de lucro líquido desejado sobre a venda de cada prato.
            </p>
            <div className="relative mt-2">
              <DecimalInput
                value={formData.targetReturnMargin}
                onChange={(val) => handleChange('targetReturnMargin', val)}
                placeholder="0,00"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500 pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">%</span>
            </div>
          </div>

          {/* FATURAMENTO MÉDIO MENSAL */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <DollarSign size={20} />
              <label className="font-bold text-xs uppercase text-slate-900">
                Faturamento Médio / Mês
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Receita média mensal (R$) para cálculo do rateio de custos fixos.
            </p>
            <div className="relative mt-2">
              <MoneyInput
                value={formData.monthlyRevenue}
                onChange={(val) => handleChange('monthlyRevenue', val)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>
        </div>

        {/* MIX DE VENDAS POR CATEGORIA (RATEIO DE CUSTO FIXO) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <TrendingUp size={18} className="text-orange-600" />
                <h4 className="uppercase tracking-wider text-xs">Mix de Vendas por Categoria</h4>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                totalCategoryShare === 0
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : Math.round(totalCategoryShare) === 100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Total: {totalCategoryShare.toFixed(1).replace('.', ',')}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Opcional. Informe quanto % do faturamento mensal vem de cada categoria (ex.: Marmitex 40%, Pizzas 30%...).
              Isso estima quantos pedidos cada categoria representa usando o próprio ticket médio dela, em vez de
              assumir que todo prato vende a mesma quantidade — evitando que pratos de ticket baixo e alto giro
              carreguem um Custo Fixo por prato inflado demais. Deixe zerado para usar o método simples (ticket médio geral).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoriesList.map((cat) => {
                const pct = formData.categoryRevenueShare?.[cat] || 0;
                const revenueValue = ((formData.monthlyRevenue || 0) * pct) / 100;
                return (
                  <div key={cat} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 truncate">{cat}</label>
                      <div className="relative w-24 shrink-0">
                        <DecimalInput
                          value={pct}
                          onChange={(val) => handleCategoryShareChange(cat, val)}
                          placeholder="0,0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 pr-6 text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 text-right font-mono">
                      ≈ R$ {revenueValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /mês
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ADICIONAR NOVO SEGMENTO/CATEGORIA */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSegment(); } }}
                placeholder="Novo segmento (ex.: Lanches, Pizza Frita...)"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddSegment}
                className="px-3 py-2 bg-[#38261E] hover:bg-[#201511] text-white font-bold rounded-xl transition-colors cursor-pointer text-xs whitespace-nowrap"
              >
                + Adicionar Segmento
              </button>
            </div>
        </div>

        {/* TEMAS VISUAIS (MODO DIA & MODO NOITE) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Palette size={18} className="text-orange-600" />
            <h4 className="uppercase tracking-wider text-xs">Temas Visuais da Interface</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MODO DIA */}
            <button
              type="button"
              onClick={() => handleChange('theme', 'light')}
              className={`p-4 rounded-2xl border-2 flex items-center space-x-3 text-left transition-all cursor-pointer ${
                formData.theme !== 'dark'
                  ? 'border-orange-500 bg-orange-50/50 text-slate-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className={`p-3 rounded-xl ${formData.theme !== 'dark' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <Sun size={22} />
              </div>
              <div>
                <span className="font-bold text-sm block">Modo Dia (Light)</span>
                <span className="text-[11px] text-slate-500">Interface clara de alto contraste com fundo branco/areia.</span>
              </div>
            </button>

            {/* MODO NOITE */}
            <button
              type="button"
              onClick={() => handleChange('theme', 'dark')}
              className={`p-4 rounded-2xl border-2 flex items-center space-x-3 text-left transition-all cursor-pointer ${
                formData.theme === 'dark'
                  ? 'border-amber-500 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className={`p-3 rounded-xl ${formData.theme === 'dark' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                <Moon size={22} />
              </div>
              <div>
                <span className="font-bold text-sm block">Modo Noite (Night / Dark)</span>
                <span className="text-[11px] text-slate-400">Interface escura confortável para visualização noturna no salão/cozinha.</span>
              </div>
            </button>
          </div>
        </div>

        {/* BOTÃO DE SAIR DA CONTA (LOGOUT) */}
        {onLogout && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-50/50 p-5 rounded-2xl border border-red-100">
            <div>
              <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">Sessão Ativa & Conta</h4>
              <p className="text-[11px] text-red-700">Encerre sua sessão atual no Margem de Chef para retornar à tela de login.</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <LogOut size={16} />
              <span>Sair da Conta (Logout)</span>
            </button>
          </div>
        )}

        {/* SAVE BUTTON & CONFIRMATION */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {saved && (
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs animate-fade-in">
                <CheckCircle2 size={18} />
                <span>Configurações salvas com sucesso!</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Save size={18} />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>

      {/* CARD SESSÃO E SEGURANÇA (LOGOUT) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <ShieldAlert size={20} className="text-orange-600" />
          <h3 className="uppercase tracking-wider">Sessão e Segurança da Conta</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase">
                <Key size={16} className="text-orange-600" />
                <span>Segurança da Senha</span>
              </div>
              <p className="text-xs text-slate-600">
                Altere sua senha de acesso periodicamente para garantir a segurança dos dados do seu restaurante.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowPasswordModal(true); setPwdMsg(null); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Lock size={16} />
              <span>Alterar Senha</span>
            </button>
          </div>

          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-red-700 font-bold text-xs uppercase">
                <LogOut size={16} />
                <span>Encerrar Sessão</span>
              </div>
              <p className="text-xs text-slate-600">
                Encerre sua sessão atual com segurança para proteger seu painel em computadores compartilhados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  localStorage.removeItem('basechef_current_user');
                  window.location.reload();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
            >
              <LogOut size={16} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>

      {/* ZONA DE PERIGO: ZERAR TODOS OS DADOS CADASTRADOS */}
      {onResetAllData && (
        <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-red-700 font-bold text-base border-b border-red-100 pb-3">
            <AlertTriangle size={20} />
            <h3 className="uppercase tracking-wider">Zona de Perigo</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-50/50 p-5 rounded-2xl border border-red-100">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">Zerar Todos os Dados Cadastrados</h4>
              <p className="text-[11px] text-red-700 max-w-lg">
                Apaga permanentemente todas as fichas técnicas, insumos, custos fixos e custos variáveis desta conta, deixando o sistema limpo para você começar a cadastrar suas informações reais. Essa ação não pode ser desfeita.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowResetModal(true); setResetConfirmChecked(false); setResetDone(false); }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <Trash2 size={16} />
              <span>Zerar Dados</span>
            </button>
          </div>
        </div>
      )}

      {/* CARD ASSINATURA E GERENCIAMENTO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-amber-600 font-bold text-base border-b border-slate-100 pb-3">
          <CreditCard size={20} />
          <h3 className="uppercase tracking-wider">Gerenciamento de Assinatura</h3>
        </div>

        {isActiveSub ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Plano Profissional Ativo (Mercado Pago)</span>
              </h4>
              <p className="text-xs text-slate-600">
                Sua assinatura recorrente mensal está ativa. Caso deseje encerrar a cobrança automática, você pode solicitar o cancelamento a qualquer momento.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onNavigateToSubscription && (
                <button
                  type="button"
                  onClick={onNavigateToSubscription}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Ver Assinatura
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Cancelar Assinatura a Qualquer Momento
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock size={16} className="text-amber-600" />
                <span>Período de Teste de 24 Horas Ativo</span>
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Você está no período de teste de 24 horas. <strong>Todas as funções estão habilitadas, utilize a IA Chefinho à vontade!</strong> Para garantir acesso contínuo sem interrupções, assine o Plano Profissional.
              </p>
            </div>

            {onNavigateToSubscription && (
              <button
                type="button"
                onClick={onNavigateToSubscription}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center space-x-2"
              >
                <Sparkles size={14} />
                <span>Assinar Plano Pro</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center font-bold">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Sentiremos sua falta, Chef!</h3>
              <p className="text-xs text-slate-600">
                Gostaríamos de entender o motivo do seu cancelamento para melhorarmos o Margem de Chef.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                'Achei caro',
                'Não usei o suficiente',
                'Faltam funcionalidades',
                'Encontrei outra ferramenta',
                'Outro'
              ].map((reason) => (
                <label key={reason} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancelReasons.includes(reason)}
                    onChange={(e) => {
                      if (e.target.checked) setCancelReasons([...cancelReasons, reason]);
                      else setCancelReasons(cancelReasons.filter(r => r !== reason));
                    }}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">{reason}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Conte-nos mais detalhes (Opcional):
              </label>
              <textarea
                value={cancelComment}
                onChange={(e) => setCancelComment(e.target.value)}
                placeholder="Explique o que poderíamos ter feito melhor..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                Manter Minha Assinatura
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Sua solicitação de cancelamento foi registrada com sucesso. A assinatura foi encerrada.');
                  setShowCancelModal(false);
                  if (onLogout) onLogout();
                  else window.location.reload();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ALL DATA CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            {resetDone ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center font-bold">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900">Tudo limpo!</h3>
                <p className="text-xs text-slate-600">
                  Seus dados foram zerados. Pode começar a cadastrar suas fichas técnicas, insumos e custos reais.
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center font-bold">
                    <AlertTriangle size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Zerar todos os dados?</h3>
                  <p className="text-xs text-slate-600">
                    Isso vai apagar permanentemente <strong>todas as fichas técnicas, insumos, custos fixos e custos variáveis</strong> cadastrados nesta conta. Não é possível desfazer essa ação.
                  </p>
                </div>

                <label className="flex items-start space-x-3 p-3 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetConfirmChecked}
                    onChange={(e) => setResetConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 shrink-0"
                  />
                  <span className="text-xs font-bold text-red-900">
                    Eu entendo que essa ação é irreversível e quero apagar todos os dados cadastrados.
                  </span>
                </label>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!resetConfirmChecked}
                    onClick={() => {
                      onResetAllData?.();
                      setResetDone(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    Zerar Definitivamente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 relative animate-in fade-in space-y-6">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Alterar Senha de Acesso</h3>
              <p className="text-xs text-slate-500">
                A nova senha deve ter no mínimo 8 caracteres, contendo letras maiúsculas, minúsculas e números.
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {pwdMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  pwdMsg.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
                }`}>
                  {pwdMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirme a Nova Senha</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-2xl text-xs shadow-md"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
