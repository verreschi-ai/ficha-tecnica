import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Calendar, Clock, Lock, Sparkles } from 'lucide-react';
import { User } from '../types';
import { CreditCardCheckoutModal } from './CreditCardCheckoutModal';
import { MercadoPagoLogo } from './MercadoPagoLogo';

interface SubscriptionTabProps {
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ currentUser, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<{
    status: 'ativo' | 'pendente' | 'cancelado' | 'expirado';
    subscriptionId?: string;
    expiresAt?: string;
  }>({
    status: currentUser?.status_assinatura || 'pendente',
    subscriptionId: currentUser?.mp_subscription_id,
    expiresAt: currentUser?.subscription_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      fetch(`/api/mercadopago/status?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.status) {
            setSubStatus({
              status: data.status,
              subscriptionId: data.subscriptionId,
              expiresAt: data.expiresAt
            });
            if (currentUser.status_assinatura !== data.status) {
              const updated = {
                ...currentUser,
                status_assinatura: data.status,
                mp_subscription_id: data.subscriptionId,
                subscription_expires_at: data.expiresAt
              };
              onUpdateUser(updated);
            }
          }
        })
        .catch(err => console.error("Error fetching sub status:", err));
    }
  }, [currentUser?.email]);

  const handleSubscribeClick = () => {
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setSubStatus({
      status: 'ativo',
      subscriptionId: updatedUser.mp_subscription_id,
      expiresAt: updatedUser.subscription_expires_at
    });
    setMessage('✅ Pagamento aprovado com sucesso! Assinatura Profissional Ativada.');
  };

  const isActive = subStatus.status === 'ativo';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
              <CreditCard size={14} />
              <span>Plano Profissional Recorrente</span>
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-black">Minha Assinatura -</h2>
              <div className="bg-white px-3 py-1 rounded-xl inline-flex items-center">
                <MercadoPagoLogo size={20} />
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Gerencie sua assinatura mensal do Margem de Chef. Acesso ilimitado a todas as ferramentas de precificação, fichas técnicas e IA Chefinho.
            </p>
          </div>
          <div className={`px-4 py-2.5 rounded-2xl flex items-center space-x-2 font-bold text-xs shadow-md ${
            isActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            {isActive ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            <span>{isActive ? 'STATUS: ASSINATURA ATIVA' : 'STATUS: TESTE 24H ATIVO'}</span>
          </div>
        </div>
      </div>

      {!isActive && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-amber-900 space-y-3 shadow-md flex items-start space-x-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0 font-bold">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-amber-950">Período de Teste de 24 Horas em Andamento</h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              Você está no período de teste de 24 horas. <strong>Todas as funções estão habilitadas, utilize a IA Chefinho à vontade!</strong> Quando desejar garantir acesso contínuo sem interrupções, realize a assinatura do Plano Profissional abaixo.
            </p>
          </div>
        </div>
      )}

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-blue-600 hover:text-blue-800 font-bold">×</button>
        </div>
      )}

      {/* DETAILS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>PLANO CONTRATADO</span>
            <ShieldCheck size={18} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Margem de Chef Mensal</h3>
            <p className="text-xs text-slate-500 mt-0.5">Cobrança automática via Cartão de Crédito</p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-orange-600">R$ 49,90</span>
            <span className="text-xs text-slate-500 font-medium">/ mês</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>PRÓXIMA RENOVAÇÃO</span>
            <Calendar size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-black font-mono text-slate-900">
              {subStatus.expiresAt ? new Date(subStatus.expiresAt).toLocaleDateString('pt-BR') : 'Ativo'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Renovação automática ativa</p>
          </div>
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            ID: <span className="font-mono">{subStatus.subscriptionId || 'N/D'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>PROCESSADOR SEGURO</span>
            <Lock size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="inline-flex items-center">
              <MercadoPagoLogo size={18} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Criptografia SSL de ponta a ponta</p>
          </div>
          <div className="pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
            <CheckCircle2 size={14} />
            <span>Ambiente Certificado PCI-DSS</span>
          </div>
        </div>
      </div>

      {/* ACTIONS CARD */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Gerenciamento de Pagamento</h3>
            <p className="text-xs text-slate-500">Insira um novo cartão, altere dados de cobrança ou cancele a assinatura a qualquer momento.</p>
          </div>
          <div className="bg-white px-3 py-1 rounded-full shadow-xs inline-flex items-center">
            <MercadoPagoLogo size={14} />
          </div>
        </div>

        {isActive ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 size={16} />
              <span>Assinatura Profissional Ativa</span>
            </div>
            <p className="text-sm font-bold text-slate-900">Seu acesso total está garantido!</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sua assinatura recorrente de R$ 49,90/mês está ativa no Mercado Pago. Todos os recursos do Margem de Chef Pro estão liberados sem restrições.
            </p>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
            <p className="font-bold text-xs uppercase tracking-wider text-emerald-700">Sistema de Pagamento Ativo</p>
            <p className="text-sm font-bold text-slate-900">Checkout Seguro Mercado Pago Pronto</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Faça sua assinatura do Plano Profissional com segurança via cartão de crédito (<strong className="text-emerald-700">R$ 49,90 / mês</strong>).
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubscribeClick}
                className="w-full sm:w-auto bg-[#009ee3] hover:bg-[#0082be] text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all cursor-pointer text-xs flex items-center justify-center space-x-2"
              >
                <CreditCard size={18} />
                <span>Abrir Checkout de Cartão de Crédito (R$ 49,90)</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
          <p className="font-bold flex items-center space-x-1">
            <AlertCircle size={14} className="text-amber-700" />
            <span>Informação Importante sobre Cancelamentos</span>
          </p>
          <p className="text-amber-800 leading-relaxed">
            O cancelamento da assinatura interrompe as cobranças automáticas futuras e o acesso ao sistema expira ao término do ciclo mensal pago. Você pode reativar a qualquer momento.
          </p>
        </div>
      </div>

      <CreditCardCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        currentUser={currentUser}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};
