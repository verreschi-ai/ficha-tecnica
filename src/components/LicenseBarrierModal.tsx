import React, { useState } from 'react';
import { Lock, Key, CheckCircle2, Clock, ShieldAlert, Sparkles, LogOut, Mail, QrCode } from 'lucide-react';
import { User } from '../types';

interface LicenseBarrierModalProps {
  user: User;
  onActivateCode: (code: string) => boolean;
  onLogout: () => void;
  onOpenPixModal?: () => void;
}

export const LicenseBarrierModal: React.FC<LicenseBarrierModalProps> = ({
  user,
  onActivateCode,
  onLogout,
  onOpenPixModal
}) => {
  const [activationCode, setActivationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setCodeSuccess('');

    if (!activationCode.trim()) {
      setCodeError('Digite o código de ativação fornecido.');
      return;
    }

    const success = onActivateCode(activationCode.trim());
    if (success) {
      setCodeSuccess('Licença ativada com sucesso! Liberando acesso...');
      setActivationCode('');
    } else {
      setCodeError('Código de ativação inválido ou já utilizado. Verifique com o suporte.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h2 className="text-xl font-fredoka font-bold text-white">
                Período de Degustação Expirado
              </h2>
              <p className="text-xs text-slate-400">
                Sua Licença Diária de 24 horas chegou ao fim.
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            title="Sair da Conta"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>

        {/* ACCOUNT INFO */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Usuário Logado</span>
            <span className="font-bold text-white block">{user.name}</span>
            <span className="text-slate-400 font-mono">{user.email} • {user.restaurantName}</span>
          </div>

          <div className="text-right">
            <span className="bg-red-500/10 text-red-400 border border-red-500/30 font-bold px-2.5 py-1 rounded-lg text-[10px]">
              Acesso Expirado
            </span>
          </div>
        </div>

        {/* LICENSE COMPARISON & WHATSAPP BUTTON */}
        <div className="space-y-4">
          <h3 className="text-sm font-fredoka font-bold text-slate-200 uppercase tracking-wider">
            Escolha como Desbloquear seu Acesso:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OPTION 1: DIÁRIA */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 opacity-75">
              <div className="flex items-center space-x-2 text-slate-400">
                <Clock size={18} />
                <span className="font-bold text-xs uppercase">Licença Diária (Grátis)</span>
              </div>
              <p className="text-xl font-fredoka font-bold text-slate-300">24 Horas</p>
              <p className="text-[11px] text-slate-400">
                Período de testes inicial concluído. Renovação mediante código fornecido pelo suporte.
              </p>
            </div>

            {/* OPTION 2: VITALÍCIA (RECOMENDADA) */}
            <div className="bg-gradient-to-b from-orange-950/60 to-slate-950 p-4 rounded-2xl border-2 border-orange-500 space-y-2 relative shadow-lg shadow-orange-600/10">
              <span className="absolute -top-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                Recomendado
              </span>
              <div className="flex items-center space-x-2 text-orange-400">
                <Sparkles size={18} />
                <span className="font-bold text-xs uppercase">Licença Vitalícia</span>
              </div>
              <p className="text-2xl font-fredoka font-black text-amber-400">
                R$ 89,90 <span className="text-xs text-slate-300 font-normal">/ Pagamento Único</span>
              </p>
              <p className="text-[11px] text-slate-300">
                Acesso permanente sem mensalidades para todas as fichas técnicas, insumos e Chefinho IA.
              </p>
            </div>

          </div>

          {/* MAIN PIX ACTION BUTTON */}
          <button
            type="button"
            onClick={onOpenPixModal}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-fredoka font-black text-sm py-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
          >
            <QrCode size={22} />
            <span>Pagar R$ 89,90 via PIX Automático</span>
          </button>

          <div className="text-center pt-1 space-y-2">
            <a
              href="mailto:basechefappmargem@gmail.com?subject=D%C3%BAvidas%20ou%20Suporte%20-%20Licen%C3%A7a%20Base%20Chef"
              className="text-xs text-slate-400 hover:text-amber-300 underline transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Mail size={14} />
              <span>Dúvidas ou suporte? Clique aqui</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <LogOut size={16} className="text-red-400" />
              <span>Sair e voltar para a tela de login</span>
            </button>
          </div>
        </div>

        {/* ACTIVATION CODE INPUT */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
            <Key size={16} className="text-amber-400" />
            <span>Possui um Código de Ativação?</span>
          </div>

          <form onSubmit={handleApplyCode} className="flex gap-2">
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="Ex: CHEF-PRO-2026"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-400 placeholder-slate-600 uppercase focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-fredoka font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Ativar Agora
            </button>
          </form>

          {codeError && (
            <p className="text-[11px] font-semibold text-red-400 pt-1">{codeError}</p>
          )}

          {codeSuccess && (
            <p className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1 pt-1">
              <CheckCircle2 size={14} />
              <span>{codeSuccess}</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
