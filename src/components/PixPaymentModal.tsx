import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Copy, Check, X, LogOut, Mail, RefreshCw, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface PixPaymentModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed?: () => void;
  onLogout?: () => void;
}

const POLL_INTERVAL_MS = 5000;
const FALLBACK_AMOUNT = 89.90;

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  user,
  isOpen,
  onClose,
  onPaymentConfirmed,
  onLogout
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentId, setPaymentId] = useState<string | number | null>(null);
  const [pixCode, setPixCode] = useState<string>('');
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('');
  const [amount, setAmount] = useState<number>(FALLBACK_AMOUNT);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const checkPaymentStatus = useCallback(async (id: string | number, silent: boolean) => {
    if (!silent) setChecking(true);
    try {
      const response = await fetch(`/api/mercadopago/payment-status/${id}`);
      const data = await response.json();

      if (response.ok && data.status === 'approved') {
        stopPolling();
        setConfirmed(true);
        onPaymentConfirmed?.();
      } else if (!response.ok && !silent) {
        setErrorMessage(data.error || 'Não foi possível verificar o pagamento agora.');
      }
    } catch {
      if (!silent) setErrorMessage('Falha de conexão ao verificar o pagamento. Tente novamente.');
    } finally {
      if (!silent) setChecking(false);
    }
  }, [onPaymentConfirmed]);

  const fetchPixData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setConfirmed(false);
    stopPolling();

    try {
      const response = await fetch('/api/mercadopago/create-pix-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name })
      });
      const data = await response.json();

      if (!response.ok || !data.qrCode) {
        throw new Error(data.error || 'Não foi possível gerar o pagamento PIX.');
      }

      setPaymentId(data.paymentId);
      setPixCode(data.qrCode);
      setQrCodeBase64(data.qrCodeBase64 || '');
      setAmount(typeof data.amount === 'number' ? data.amount : FALLBACK_AMOUNT);

      // Verificação automática em segundo plano — sem sobrescrever a tela com erros transitórios.
      pollIntervalRef.current = setInterval(() => {
        checkPaymentStatus(data.paymentId, true);
      }, POLL_INTERVAL_MS);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível gerar o PIX agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }, [user.email, user.name, checkPaymentStatus]);

  useEffect(() => {
    if (isOpen) {
      fetchPixData();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user.email]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCancelAndExit = () => {
    stopPolling();
    setPixCode('');
    setQrCodeBase64('');
    setPaymentId(null);
    setCopied(false);
    setErrorMessage('');

    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  const qrImageSrc = qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative space-y-6 animate-in fade-in zoom-in duration-200 my-auto">

        {/* CLOSE / EXIT BUTTON */}
        <button
          onClick={handleCancelAndExit}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Sair / Cancelar Compra"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <QrCode size={26} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-fredoka font-bold text-white">
                Pagamento via PIX
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30">
                Mercado Pago Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acesso Vitalício - MARGEM CHEF • R$ {amount.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* DETAILS BOX */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Conta Beneficiária</span>
            <span className="font-bold text-white block">{user.name} ({user.email})</span>
            <span className="text-slate-400 font-medium">{user.restaurantName}</span>
          </div>

          <div className="text-right">
            <span className="text-2xl font-fredoka font-black text-emerald-400 block">
              R$ {amount.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-slate-400 block">Pagamento Único</span>
          </div>
        </div>

        {/* QR CODE & PIX CODE SECTION */}
        <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-center space-y-4">
          {confirmed ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                <Check size={28} className="text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-300">Pagamento confirmado!</p>
              <p className="text-xs text-slate-400">Liberando seu acesso vitalício...</p>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw size={28} className="text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Gerando código PIX no Mercado Pago...</p>
            </div>
          ) : errorMessage ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <AlertTriangle size={28} className="text-amber-400" />
              <p className="text-xs text-amber-300 font-medium max-w-xs">{errorMessage}</p>
              <button
                type="button"
                onClick={fetchPixData}
                className="mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* QR CODE DISPLAY */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-white rounded-2xl shadow-lg border-4 border-slate-800">
                  {qrImageSrc ? (
                    <img
                      src={qrImageSrc}
                      alt="PIX QR Code Margem Chef"
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-[10px]">
                      QR Code indisponível
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Abra o app do seu banco e escaneie a imagem
                </p>
              </div>

              {/* PIX COPIA E COLA */}
              <div className="space-y-2 text-left pt-2 border-t border-slate-800/80">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Pix Copia e Cola
                </label>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={pixCode}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-300 pr-10 focus:outline-none select-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-fredoka font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Código PIX Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copiar Código PIX</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => paymentId && checkPaymentStatus(paymentId, false)}
                  disabled={checking || !paymentId}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                  <span>{checking ? 'Verificando...' : 'Já paguei, verificar agora'}</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Verificamos automaticamente a cada poucos segundos assim que o pagamento é aprovado no Mercado Pago.
                </p>
              </div>
            </>
          )}
        </div>

        {/* SUPPORT & CANCEL / EXIT SECTION */}
        <div className="pt-2 text-center space-y-3">
          <a
            href="mailto:basechefappmargem@gmail.com?subject=D%C3%BAvidas%20ou%20Suporte%20-%20Pagamento%20PIX"
            className="text-xs text-slate-400 hover:text-emerald-400 underline transition-colors cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Mail size={14} />
            <span>Dúvidas ou suporte? Clique aqui</span>
          </a>

          <button
            type="button"
            onClick={handleCancelAndExit}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-98"
          >
            <LogOut size={16} className="text-red-400" />
            <span>Sair e voltar para a tela de login</span>
          </button>
        </div>

      </div>
    </div>
  );
};
