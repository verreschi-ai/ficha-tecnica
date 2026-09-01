import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Copy, Check, X, LogOut, Mail, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface PixPaymentModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed?: () => void;
  onLogout?: () => void;
}

const APPS_SCRIPT_PIX_URL = 'https://script.google.com/macros/s/AKfycbyOZOkgs-FttJnldCmPPfN6xxi-P2PeZLrzT8eu7R_1-XIu6uHRTP8kkn-UKh1huYGdng/exec';

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  user,
  isOpen,
  onClose,
  onPaymentConfirmed,
  onLogout
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pixIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Standard fallback PIX payload for R$ 49,90 MARGEM CHEF MENSAL
  const defaultPixCode = `00020126580014BR.GOV.BCB.PIX0136miguel@gmail.com5204000053039865405849.905802BR5921MARGEM CHEF PRO MENSAL6009SAO PAULO62070503***6304DA71`;

  const stopPixCheck = () => {
    if (pixIntervalRef.current) {
      clearInterval(pixIntervalRef.current);
      pixIntervalRef.current = null;
    }
  };

  const handleCancelAndExit = () => {
    stopPixCheck();
    setPixCode('');
    setQrCodeUrl('');
    setCopied(false);
    setErrorMessage('');

    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  const fetchPixData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Send request to Google Apps Script endpoint
      const response = await fetch(APPS_SCRIPT_PIX_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'generate_pix',
          email: user.email,
          name: user.name,
          value: 49.90,
          description: 'Assinatura Mensal Pro - MARGEM CHEF'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.pix_code) {
          setPixCode(data.pix_code);
          if (data.qr_code_url) {
            setQrCodeUrl(data.qr_code_url);
          }
        } else {
          setPixCode(defaultPixCode);
        }
      } else {
        setPixCode(defaultPixCode);
      }
    } catch (err) {
      // Fallback to pre-computed BR Code
      setPixCode(defaultPixCode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPixData();

      // Optional background polling interval for automated status check
      pixIntervalRef.current = setInterval(() => {
        // Periodic check placeholder
      }, 10000);
    } else {
      stopPixCheck();
    }

    return () => {
      stopPixCheck();
    };
  }, [isOpen, user.email]);

  if (!isOpen) return null;

  const currentPixCode = pixCode || defaultPixCode;
  const currentQrUrl = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentPixCode)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
                Aprovação Imediata
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acesso Vitalício - MARGEM CHEF • R$ 89,90
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
              R$ 89,90
            </span>
            <span className="text-[10px] text-slate-400 block">Pagamento Único</span>
          </div>
        </div>

        {/* QR CODE & PIX CODE SECTION */}
        <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-center space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw size={28} className="text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Gerando código PIX dinâmico...</p>
            </div>
          ) : (
            <>
              {/* QR CODE DISPLAY */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-white rounded-2xl shadow-lg border-4 border-slate-800">
                  <img
                    src={currentQrUrl}
                    alt="PIX QR Code Margem Chef"
                    className="w-44 h-44 object-contain"
                  />
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
                    value={currentPixCode}
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
