import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, ShieldCheck, X, CheckCircle2, AlertCircle, Sparkles, Award } from 'lucide-react';
import { User } from '../types';
import { MercadoPagoLogo } from './MercadoPagoLogo';

interface CreditCardCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: (updatedUser: User) => void;
  onNavigateToCommunity?: () => void;
}

export const CreditCardCheckoutModal: React.FC<CreditCardCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onNavigateToCommunity
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [installments, setInstallments] = useState('1');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [publicKey, setPublicKey] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Diagnostic fetch of Mercado Pago Public Key
      fetch('/api/mercadopago/public-key')
        .then(res => res.json())
        .then(data => {
          if (data && data.publicKey) {
            setPublicKey(data.publicKey);
            console.log("MP Public Key diagnostic loaded successfully:", data.publicKey.substring(0, 10) + "...");
          } else {
            console.warn("MP Public Key not configured in backend environment.");
          }
        })
        .catch(err => console.error("Error fetching MP public key diagnostic:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cardCpf) {
      setErrorMsg('Por favor, preencha todos os campos do cartão para prosseguir.');
      setLoading(false);
      return;
    }

    try {
      const activePublicKey = publicKey || 'APP_USR-89390b89-0d0f-4a30-9594-b01022eac138';
      console.log("Initiating payment tokenization with Mercado Pago SDK using Public Key:", activePublicKey.substring(0, 12) + "...");

      if (!(window as any).MercadoPago) {
        throw new Error("SDK JavaScript do Mercado Pago não carregada.");
      }

      const mp = new (window as any).MercadoPago(activePublicKey);

      const expiryParts = cardExpiry.split('/');
      const cardExpirationMonth = expiryParts[0] || '';
      const yearRaw = expiryParts[1] || '';
      const cardExpirationYear = yearRaw.length === 2 ? '20' + yearRaw : yearRaw;

      const tokenPayload = {
        cardNumber: cardNumber.replace(/\D/g, ''),
        cardholderName: cardName.trim(),
        cardExpirationMonth,
        cardExpirationYear,
        securityCode: cardCvv.replace(/\D/g, ''),
        identificationType: 'CPF',
        identificationNumber: cardCpf.replace(/\D/g, '')
      };

      console.log("Tokenization payload prepared (card number and CVV masked for security)");

      let tokenResult;
      try {
        tokenResult = await mp.createCardToken(tokenPayload);
      } catch (tokenErr: any) {
        console.error("Mercado Pago Card Tokenization Service Error:", tokenErr);
        const causeCode = tokenErr?.cause?.[0]?.code || tokenErr?.code || tokenErr?.status || 'unknown_code';
        const errorMessage = tokenErr?.message || tokenErr?.cause?.[0]?.description || 'Erro desconhecido na tokenização';
        throw new Error(`Card token service bad request (cause.code: ${causeCode}): ${errorMessage}`);
      }

      const cardTokenId = tokenResult?.id;
      if (!cardTokenId) {
        throw new Error("Falha ao obter token de cartão do Mercado Pago (token ID ausente).");
      }

      console.log("Card token generated successfully:", cardTokenId);

      const payload = {
        transaction_amount: 49.90,
        token: cardTokenId,
        description: 'Assinatura Mensal Pro - Margem de Chef (R$ 49,90)',
        payer: {
          email: currentUser?.email || 'chef@margem.basechef.com.br',
          identification: { type: 'CPF', number: cardCpf.replace(/\D/g, '') }
        }
      };

      console.log("Sending payment request to backend /api/process_payment with token...");

      const response = await fetch('/api/process_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("Backend payment response received:", data);

      if (response.ok && data.success) {
        setLoading(false);
        const updated: User = currentUser ? {
          ...currentUser,
          status_assinatura: 'ativo',
          subscription_status: data.subscription_status || 'authorized',
          isPremium: true,
          licenseType: 'monthly',
          mp_subscription_id: data.subscriptionId || `sub-${Date.now()}`,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } : {
          id: `usr-${Date.now()}`,
          name: cardName,
          email: currentUser?.email || 'chef@margem.basechef.com.br',
          restaurantName: 'Meu Restaurante',
          phone: '(11) 99999-9999',
          role: 'user',
          licenseType: 'monthly',
          status_assinatura: 'ativo',
          subscription_status: 'authorized',
          isPremium: true,
          createdAt: new Date().toISOString()
        };

        onSuccess(updated);
        setPaymentSuccess(true);
      } else {
        setLoading(false);
        setErrorMsg(data.error || 'Falha ao processar assinatura no Mercado Pago. Verifique os dados do cartão.');
      }
    } catch (err: any) {
      console.error("Payment submission exception:", err);
      setLoading(false);
      setErrorMsg(err.message || 'Erro ao processar pagamento. Verifique os dados do cartão.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col my-auto">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#009ee3] text-white rounded-2xl shadow-md">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-white">
                <span className="font-bold text-base">Checkout Seguro •</span>
                <div className="bg-white px-2.5 py-0.5 rounded-lg inline-flex items-center">
                  <MercadoPagoLogo size={18} />
                </div>
              </div>
              <p className="text-xs text-slate-300">Plano Profissional Mensal • R$ 49,90 / mês</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {paymentSuccess ? (
          /* SUCCESS VIEW (FASE 2 POSITIVE RETURN) */
          <div className="p-8 text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Parabéns, Chef!</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Sua assinatura foi processada e seu acesso total foi liberado com sucesso.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recursos Exclusivos Desbloqueados:</span>
              <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Relatórios avançados de CMV e margem de lucro</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Fichas técnicas e insumos ilimitados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Suporte prioritário e Consultoria IA 24/7</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToCommunity) onNavigateToCommunity();
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold py-3.5 rounded-2xl shadow-lg text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Acessar Campo de Comunidade</span>
                <Award size={18} />
              </button>
              <button
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* MODAL BODY (CHECKOUT FORM) */
          <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* SECURITY NOTICE */}
            <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl flex items-start space-x-3 text-sky-900">
              <ShieldCheck size={20} className="text-[#009ee3] shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold">Ambiente Criptografado & Verificação 3D Secure</p>
                <p className="text-sky-800">Seus dados são processados com segurança máxima pelo Mercado Pago. O acesso Pro é liberado imediatamente após a confirmação positiva.</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* CARD NUMBER */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Número do Cartão
              </label>
              <div className="relative">
                <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleFormatCardNumber}
                  placeholder="4532 •••• •••• 8890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#009ee3]"
                  required
                />
              </div>
            </div>

            {/* CARD HOLDER NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Titular (como no cartão)
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="EX: JOÃO DA SILVA"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:border-[#009ee3]"
                required
              />
            </div>

            {/* EXPIRY & CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Validade (MM/AA)
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={handleFormatExpiry}
                  placeholder="12/28"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#009ee3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CVV / Segurança
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#009ee3]"
                  required
                />
              </div>
            </div>

            {/* CPF / CNPJ DO TITULAR */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                CPF ou CNPJ do Titular do Cartão
              </label>
              <input
                type="text"
                value={cardCpf}
                onChange={(e) => setCardCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#009ee3]"
                required
              />
            </div>

            {/* INSTALLMENTS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Forma de Pagamento Recorrente
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#009ee3]"
              >
                <option value="1">1x de R$ 49,90 / mês (Renovação Automática)</option>
              </select>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#009ee3] hover:bg-[#0082be] text-white font-fredoka font-bold text-base py-4 rounded-2xl shadow-xl shadow-[#009ee3]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              <Lock size={18} />
              <span>{loading ? 'Validando Cartão no Mercado Pago...' : 'Finalizar Assinatura Segura (R$ 49,90)'}</span>
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Transação processada com criptografia SSL 256-bit</span>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
