import React, { useState } from 'react';
import { CreditCard, Lock, Sparkles, CheckCircle2, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface SubscriptionBarrierModalProps {
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
}

export const SubscriptionBarrierModal: React.FC<SubscriptionBarrierModalProps> = ({ currentUser, onUpdateUser, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          name: currentUser.name,
          restaurantName: currentUser.restaurantName,
          returnUrl: window.location.href
        })
      });

      const data = await res.json();
      if (res.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Erro ao gerar checkout no Mercado Pago.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto">
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-8 text-white text-center relative shrink-0">
          <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Acesso Restrito
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black">Regularize sua Assinatura</h2>
          <p className="text-orange-100 text-xs mt-1 max-w-sm mx-auto">
            Para acessar as ferramentas de custos, fichas técnicas e IA do Margem de Chef, ative seu plano mensal recorrente.
          </p>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plano Profissional</span>
              <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-0.5 rounded-full">Recorrente</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-slate-900">R$ 49,90</span>
              <span className="text-xs text-slate-500 font-medium">por mês</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-200">
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Fichas técnicas ilimitadas</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Precificação inteligente com CMV</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Assistente Chefinho IA (Gemini 2.5 Flash)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 text-xs space-y-2 text-center">
              <p className="font-bold text-slate-900">Sistema de Pagamentos em Reconfiguração para Produção</p>
              <p className="text-slate-600">O checkout foi temporariamente desativado devido ao reset total de credenciais e webhooks.</p>
            </div>
            <button
              disabled={true}
              className="w-full bg-slate-300 text-slate-600 font-bold py-4 rounded-2xl cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              <CreditCard size={20} />
              <span>Checkout Temporariamente Indisponível</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Logado como: <strong>{currentUser?.email}</strong></span>
            <button
              onClick={onLogout}
              className="text-red-600 hover:underline font-bold cursor-pointer"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
