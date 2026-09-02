import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, MessageCircle, X, Sparkles, Send, Lightbulb, TrendingUp, RefreshCw, Settings } from 'lucide-react';
import { TechnicalSheet, User, RawIngredientItem, FixedCostsData, VariableCostsData } from '../types';

interface ChefinhoMascotProps {
  sheets: TechnicalSheet[];
  rawIngredients?: RawIngredientItem[];
  fixedCosts?: FixedCostsData;
  variableCosts?: VariableCostsData;
  currentUser?: User | null;
}

export const ChefinhoMascot: React.FC<ChefinhoMascotProps> = ({ 
  sheets, 
  rawIngredients = [], 
  fixedCosts, 
  variableCosts, 
  currentUser 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Preferred name state & persistence
  const [preferredName, setPreferredName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('basechef_user_ai_nickname');
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
    return currentUser?.name || '';
  });
  const [nameInput, setNameInput] = useState(preferredName);
  const [isEditingName, setIsEditingName] = useState(!preferredName);

  const [messages, setMessages] = useState<Array<{ sender: 'chefinho' | 'user'; text: string }>>([
    {
      sender: 'chefinho',
      text: preferredName
        ? `Olá, ${preferredName}! Sou o Chefinho, seu assistente de fichas técnicas e margem de lucro. Como posso ajudar hoje?`
        : 'Olá! Sou o Chefinho, seu assistente de fichas técnicas e margem de lucro. Como posso ajudar hoje?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setPreferredName(trimmed);
      try {
        localStorage.setItem('basechef_user_ai_nickname', trimmed);
      } catch (e) {}
      setIsEditingName(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setHasDragged(true);
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const maxX = window.innerWidth - 140;
    const maxY = window.innerHeight - 80;
    setPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY))
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleButtonClick = () => {
    if (!hasDragged) {
      setIsOpen(!isOpen);
    }
  };

  // Helper to generate consultant replies with injected user name in first person conversational tone
  const getBotReply = (
    input: string, 
    sheets: TechnicalSheet[], 
    rawItems: RawIngredientItem[], 
    fixCosts?: FixedCostsData, 
    varCosts?: VariableCostsData, 
    name?: string
  ) => {
    const lower = input.toLowerCase();
    const displayName = name && name.trim() ? name.trim() : 'Chefe';

    // Quick stats robustes
    const mascotDivisor = sheets.length > 0 ? sheets.length : 1;
    const avgCMV = (sheets.reduce((acc, curr) => acc + (typeof curr.cmv === 'number' && !isNaN(curr.cmv) ? curr.cmv : 30.0), 0) / mascotDivisor).toFixed(1);
    const avgMargin = (sheets.reduce((acc, curr) => acc + (typeof curr.margin === 'number' && !isNaN(curr.margin) ? curr.margin : 70.0), 0) / mascotDivisor).toFixed(1);
    const saudaveis = sheets.filter(s => s.margin >= 20).length;
    const apertadas = sheets.filter(s => s.margin >= 10 && s.margin < 20).length;
    const risco = sheets.filter(s => s.margin < 10).length;

    const totalFixedExpenses = fixCosts?.fixedExpenses?.reduce((acc, f) => acc + f.amount, 0) || 0;
    const employees = fixCosts?.employees || [];
    const totalEmployeesSalaries = employees.reduce((acc, emp) => {
      let base = emp.baseSalary || 0;
      if (!emp.isFreelance) {
        if (emp.includeThirteenth) base += (emp.baseSalary / 12);
        if (emp.includeVacation) base += (emp.baseSalary / 3);
        if (emp.includeTransport) base += (emp.valeTransporte || 0);
        if (emp.includeMeal) base += (emp.valeRefeicao || 0);
      }
      return acc + base;
    }, 0);

    const activeVariables = varCosts?.items?.filter(v => v.enabled) || [];

    // Comprehensive report request across all system data
    if (lower.includes('relatório') || lower.includes('resumo') || lower.includes('todos') || lower.includes('sistema') || lower.includes('geral') || lower.includes('informações')) {
      return `📊 Resumo rápido, ${displayName}: ${sheets.length} fichas (CMV médio ${avgCMV}%, margem média ${avgMargin}%) — ${saudaveis} saudáveis, ${apertadas} apertadas, ${risco} em risco. ${rawItems.length} insumos no estoque. Custos fixos: R$ ${totalFixedExpenses.toFixed(2).replace('.', ',')} (${employees.length} colaborador(es)).\n\nQuer que eu detalhe algum desses pontos?`;
    }

    if (lower.includes('passos') || lower.includes('como usar') || lower.includes('começar') || lower.includes('jornada') || lower.includes('etapas') || lower.includes('funciona')) {
      return `🚀 ${displayName}, é rapidinho:\n1️⃣ Itens e Receitas → cadastre os insumos\n2️⃣ Fichas Técnicas → monte os pratos (eu calculo o CMV)\n3️⃣ Custos Fixos → some aluguel e equipe\n\nPor qual eu te guio agora?`;
    }

    if (lower.includes('insumo') || lower.includes('ingrediente') || lower.includes('estoque') || lower.includes('cadastrar item')) {
      return `🥬 Vá em 'Itens e Receitas' → 'Insumos e Ingredientes' → 'Adicionar Insumo'. Você já tem ${rawItems.length} cadastrado(s). Quer ajuda com algum item específico?`;
    }

    if (lower.includes('receita') || lower.includes('ficha') || lower.includes('montar prato') || lower.includes('nova ficha')) {
      return `🍳 Vá em 'Itens e Receitas' → 'Fichas Técnicas' → 'Nova Ficha Técnica', informe o rendimento e adicione os insumos. Você tem ${sheets.length} ficha(s) hoje — eu calculo CMV, preço e margem automaticamente.`;
    }

    if (lower.includes('custo fixo') || lower.includes('aluguel') || lower.includes('conta') || lower.includes('despesa')) {
      return `🏠 Aba 'Custos Fixos' → 'Adicionar Custo Fixo', informe o valor mensal. Total cadastrado hoje: R$ ${totalFixedExpenses.toFixed(2).replace('.', ',')}. Quer adicionar uma despesa agora?`;
    }

    if (lower.includes('freelance') || lower.includes('colaborador') || lower.includes('equipe') || lower.includes('clt') || lower.includes('imposto') || lower.includes('salário')) {
      return `👨‍🍳 Em 'Custos Fixos' → 'Equipe e Colaboradores' → 'Adicionar Colaborador'. Marque 'Freelance' pra zerar os encargos de CLT. Você tem ${employees.length} cadastrado(s) — quer adicionar alguém?`;
    }

    if (lower.includes('painel') || lower.includes('dashboard') || lower.includes('saúde') || lower.includes('analisar') || lower.includes('cmv') || lower.includes('cardápio')) {
      return `📊 Seu cardápio (${sheets.length} fichas): 🟢 ${saudaveis} saudáveis, 🟡 ${apertadas} apertadas, 🔴 ${risco} em risco. CMV médio: ${avgCMV}%. Se passar de 32%, vale revisar porção ou preço.`;
    }

    if (lower.includes('fator de correção') || lower.includes('fc') || lower.includes('desperdício') || lower.includes('apara')) {
      return `⚖️ Fator de Correção = Peso Bruto ÷ Peso Líquido (a parte que se perde limpando/descascando). Compra 1kg, sobra 800g limpo → fator 1,25. Garante o custo real sem prejuízo escondido.`;
    }

    if (lower.includes('cocção') || lower.includes('cozimento') || lower.includes('ic') || lower.includes('rendimento')) {
      return `🍳 Índice de Cocção é a mudança de peso no fogo: carnes reduzem, arroz e massa rendem mais absorvendo água. Uso isso pra padronizar o tamanho da porção servida.`;
    }

    if (lower.includes('impressão') || lower.includes('parede') || lower.includes('imprimir')) {
      return `📋 Em 'Fichas Técnicas', clique em 'Imprimir' no prato desejado — gero uma ficha limpa, pronta pra colar na cozinha.`;
    }

    if (lower.includes('duplic') || lower.includes('descart') || lower.includes('embalag') || lower.includes('repeti') || lower.includes('lancament') || lower.includes('duplicação')) {
      return `⚠️ Cuidado pra não pagar duas vezes pelo descartável: ou lança o pacote nos Custos Variáveis, ou coloca a caixinha em cada Ficha Técnica — nunca os dois juntos. Qual caminho você prefere?`;
    }

    if (lower.includes('simular') || lower.includes('simulador') || lower.includes('e se') || lower.includes('cenário') || lower.includes('inflação') || lower.includes('aumento')) {
      return `⚡ Usa o Simulador de Cenários (menu lateral, Custos & Precificação): reajuste geral, alta de um insumo específico, ou mudança em custos fixos — sem mexer no cardápio real. Quer que eu te leve pra lá?`;
    }

    if (lower.includes('preço') || lower.includes('margem') || lower.includes('lucro') || lower.includes('markup')) {
      return `💰 Digita o preço praticado na ficha que eu mostro na hora a Margem Líquida e o CMV, pra garantir que o prato dá lucro de verdade.`;
    }

    return `👨‍🍳 Olá, ${displayName}! Posso te ajudar com fichas técnicas, insumos, custos fixos, CMV, fator de correção ou o simulador de preços. Por onde começamos?`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg = { sender: 'user' as const, text };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          sheets,
          rawIngredients,
          fixedCosts,
          variableCosts,
          currentUser,
          aiModel: 'gemini-3.6-flash'
        })
      });
      const data = await res.json();
      const reply = data.reply || getBotReply(text, sheets, rawIngredients, fixedCosts, variableCosts, preferredName);

      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'chefinho', text: '' }]);

      let currentCharIndex = 0;
      const interval = setInterval(() => {
        currentCharIndex += 2;
        if (currentCharIndex >= reply.length) {
          currentCharIndex = reply.length;
          clearInterval(interval);
        }

        const currentChunk = reply.slice(0, currentCharIndex);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].sender === 'chefinho') {
            updated[updated.length - 1] = { sender: 'chefinho', text: currentChunk };
          }
          return updated;
        });
      }, 32);

    } catch (err) {
      // Fallback to local rule-based reply if network fails
      const reply = getBotReply(text, sheets, rawIngredients, fixedCosts, variableCosts, preferredName);
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'chefinho', text: '' }]);

      let currentCharIndex = 0;
      const interval = setInterval(() => {
        currentCharIndex += 2;
        if (currentCharIndex >= reply.length) {
          currentCharIndex = reply.length;
          clearInterval(interval);
        }

        const currentChunk = reply.slice(0, currentCharIndex);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].sender === 'chefinho') {
            updated[updated.length - 1] = { sender: 'chefinho', text: currentChunk };
          }
          return updated;
        });
      }, 32);
    }
  };

  return (
    <>
      {/* FLOATING DRAGGABLE AVATAR BUTTON (SPHERICAL BOLA) */}
      <div
        className="fixed bottom-5 right-5 z-40 no-print select-none touch-none"
        style={position ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' } : {}}
      >
        <button
          onClick={handleButtonClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white shadow-2xl chefinho-glow flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing border-2 border-amber-300/60 group"
          title="Chefinho IA - Clique para abrir ou arraste para mover"
        >
          {/* SPHERE INNER GLOW & ICON */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner group-hover:bg-white/30 transition-all">
            <ChefHat size={26} className="text-white drop-shadow-md transform group-hover:rotate-6 transition-transform" />
          </div>

          {/* ONLINE / AI PULSE RING */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121214] shadow-sm animate-pulse"></span>
          <span className="absolute inset-0 rounded-full border-2 border-orange-400/50 animate-ping pointer-events-none opacity-40"></span>
        </button>
      </div>

      {/* CHEFINHO DRAWER / CHAT PANEL */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[400px] bg-[#1a1a1e] text-[#F4F4F5] rounded-3xl border border-[#2e2e38] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[570px] animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-fredoka font-black text-xl shadow-md">
                <ChefHat size={24} />
              </div>
              <div>
                <h3 className="font-fredoka font-bold text-base leading-tight">Chefinho IA</h3>
                <p className="text-[11px] text-orange-100 font-medium">Assistente de Margem & Custos</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* PERSONALIZATION SECTION (DISCRETE SECTION ABOVE MESSAGES) */}
          {(!preferredName || isEditingName) ? (
            <div className="p-3 bg-[#24242e] border-b border-[#2e2e38] flex items-center space-x-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                  Como você gostaria de ser chamado pelo assistente?
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="Ex: Chefe Carlos, Ana, etc."
                  className="w-full bg-[#121214] border border-[#3f3f4e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveName}
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg self-end cursor-pointer transition-all shadow-xs"
              >
                Salvar
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-[#1f1f25] border-b border-[#2e2e38] flex items-center justify-between text-[11px] text-zinc-400">
              <span>Atendimento para: <strong className="text-orange-400 font-semibold">{preferredName}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setNameInput(preferredName);
                  setIsEditingName(true);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer flex items-center space-x-1"
                title="Alterar como o assistente te chama"
              >
                <Settings size={13} />
                <span className="text-[10px]">Alterar</span>
              </button>
            </div>
          )}

          {/* MESSAGES LIST */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs max-h-[360px] bg-[#121214]">
            {messages.map((m, idx) => {
              const formatMessageText = (txt: string) => {
                return txt
                  .replace(/\*\*(.*?)\*\*/g, '$1')
                  .replace(/\*\*/g, '');
              };

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-line ${
                      m.sender === 'user'
                        ? 'bg-orange-600 text-white rounded-tr-none font-medium'
                        : 'bg-[#24242a] text-zinc-200 rounded-tl-none border border-[#3f3f4e]'
                    }`}
                  >
                    {formatMessageText(m.text)}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-2 text-zinc-400 text-[11px] font-medium p-2 animate-pulse">
                <RefreshCw size={12} className="animate-spin text-orange-500" />
                <span>O assistente está analisando seus dados...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-[#1a1a1e] border-t border-[#2e2e38] flex items-center space-x-2">
            <input
              type="text"
              placeholder="Pergunte sobre receitas, CMV ou impostos..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-[#24242a] border border-[#3f3f4e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-zinc-500"
            />
            <button
              onClick={() => handleSendMessage()}
              className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
