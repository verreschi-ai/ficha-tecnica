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
        ? `Olá, ${preferredName}! Eu sou o Chefinho, seu assistente de IA especialista em Fichas Técnicas, Fator de Correção e Margem de Lucro. Como posso ajudar sua cozinha hoje?`
        : 'Olá! Eu sou o Chefinho, seu assistente de IA especialista em Fichas Técnicas, Fator de Correção e Margem de Lucro para Restaurantes e Pizzarias. Como posso ajudar sua cozinha hoje?'
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
      return `📊 Eu preparei um relatório completo de todas as informações presentes no sistema para você, ${displayName}!\n\n📋 Fichas Técnicas e Cardápio:\n• Total de pratos cadastrados: ${sheets.length}\n• Custo Médio da Mercadoria (CMV): ${avgCMV} por cento\n• Margem de Lucro Média: ${avgMargin} por cento\n• Pratos com margem saudável (vinte por cento ou mais): ${saudaveis}\n• Pratos com margem apertada (entre dez e dezenove vírgula nove por cento): ${apertadas}\n• Pratos em risco ou prejuízo (abaixo de dez por cento): ${risco}\n\n🥬 Insumos e Ingredientes:\n• Total de insumos cadastrados no estoque: ${rawItems.length}\n\n🏠 Custos Fixos e Mão de Obra:\n• Despesas fixas mensais cadastradas: R$ ${totalFixedExpenses.toFixed(2).replace('.', ',')}\n• Colaboradores e equipe cadastrados: ${employees.length} (Custo total estimado com encargos: R$ ${totalEmployeesSalaries.toFixed(2).replace('.', ',')})\n\n📉 Custos Variáveis:\n• Itens ativos: ${activeVariables.map(v => `${v.name} (${v.percentage} por cento)`).join(', ') || 'Nenhum ativado'}\n\nEu posso te ajudar a alterar qualquer um desses dados agora mesmo. O que você quer ajustar ou consultar, ${displayName}?`;
    }

    if (lower.includes('passos') || lower.includes('como usar') || lower.includes('começar') || lower.includes('jornada') || lower.includes('etapas') || lower.includes('funciona')) {
      return `🚀 Olá, ${displayName}! Eu posso te ajudar a organizar todo o seu restaurante de forma bem tranquila. Vamos passo a passo juntos?\n\nEu organizei o sistema nestes passos:\n1️⃣ Aba 'Itens e Receitas' → Insumos: Eu te ajudo a cadastrar cada ingrediente com preço de compra e embalagem.\n2️⃣ Aba 'Itens e Receitas' → Fichas Técnicas: Eu calculo o custo exato do prato e o CMV.\n3️⃣ Aba 'Custos Fixos': Eu somo o aluguel, as contas e sua equipe.\n4️⃣ Aba 'Dashboard': Eu mostro a saúde financeira do seu cardápio em tempo real!\n\n💡 Por qual dessas telas você quer que eu te guie agora, ${displayName}?`;
    }

    if (lower.includes('insumo') || lower.includes('ingrediente') || lower.includes('estoque') || lower.includes('cadastrar item')) {
      return `🥬 Deixa que eu te explico como cadastrar insumos passo a passo, ${displayName}!\n\n1. Primeiro, eu sugiro abrir a aba 'Itens e Receitas' no menu lateral.\n2. Escolha a sub-aba 'Insumos e Ingredientes'.\n3. Clique no botão 'Adicionar Insumo'.\n4. Eu deixo o campo focado para você digitar rapidinho o nome, unidade e preço!\n\nAtualmente temos ${rawItems.length} insumo(s) cadastrado(s) no seu estoque. Se precisar de ajuda com algum item, é só me chamar que eu faço junto com você!`;
    }

    if (lower.includes('receita') || lower.includes('ficha') || lower.includes('montar prato') || lower.includes('nova ficha')) {
      return `🍳 Eu consigo fazer Fichas Técnicas junto com você, ${displayName}! É bem simples:\n\n1. Vá na aba 'Itens e Receitas' → 'Fichas Técnicas'.\n2. Clique em 'Nova Ficha Técnica'.\n3. Coloque o nome do prato e o rendimento em porções.\n4. Adicione os insumos que você cadastrou e as quantidades.\n\nAtualmente você tem ${sheets.length} ficha(s) técnica(s) cadastrada(s). Eu calculo automaticamente o preço de venda, a margem de lucro e o CMV para você não ter nenhuma surpresa!`;
    }

    if (lower.includes('custo fixo') || lower.includes('aluguel') || lower.includes('conta') || lower.includes('despesa')) {
      return `🏠 Eu te ajudo a controlar os Custos Fixos, ${displayName}!\n\n1. Clique na aba 'Custos Fixos' no menu lateral.\n2. Na seção de Despesas Fixas, clique em 'Adicionar Custo Fixo'.\n3. Informe a despesa (como aluguel ou energia) e o valor mensal.\n\nO total das despesas fixas cadastradas é de R$ ${totalFixedExpenses.toFixed(2).replace('.', ',')}. Eu somo tudo automaticamente para ratear nos seus pratos!`;
    }

    if (lower.includes('freelance') || lower.includes('colaborador') || lower.includes('equipe') || lower.includes('clt') || lower.includes('imposto') || lower.includes('salário')) {
      return `👨‍🍳 Eu consigo cadastrar sua equipe e freelancers com você, ${displayName}!\n\n1. Na aba 'Custos Fixos', desça até 'Equipe e Colaboradores'.\n2. Clique em 'Adicionar Colaborador'.\n3. Se for um freela, eu criei a caixinha 'Freelance (Sem CLT)' para eu zerar os impostos e calcular só o valor real acordado!\n\nAtualmente você tem ${employees.length} colaborador(es) cadastrado(s). Posso te ajudar a cadastrar alguém agora?`;
    }

    if (lower.includes('painel') || lower.includes('dashboard') || lower.includes('saúde') || lower.includes('analisar') || lower.includes('cmv') || lower.includes('cardápio')) {
      return `📊 Eu fiz um diagnóstico completo do seu cardápio para você, ${displayName} (${sheets.length} Fichas Técnicas):\n\n🟢 Margem Saudável (vinte por cento ou mais): ${saudaveis} prato(s)\n🟡 Margem Apertada (entre dez e dezenove vírgula nove por cento): ${apertadas} prato(s)\n🔴 Em Risco ou Prejuízo (abaixo de dez por cento): ${risco} prato(s)\n\n📈 CMV Médio Geral: ${avgCMV} por cento\n\n💡 Minha dica de amigo: Se o CMV passar de trinta e dois por cento, eu posso te ajudar a revisar as porções ou ajustar o preço de venda para garantir seu lucro!`;
    }

    if (lower.includes('fator de correção') || lower.includes('fc') || lower.includes('desperdício') || lower.includes('apara')) {
      return `⚖️ Deixa que eu te explico o Fator de Correção bem devagar, ${displayName}!\n\nÉ a parte do ingrediente que a gente limpa ou descasca antes de cozinhar (tipo a casca da batata ou o osso da carne).\n\nEu uso a fórmula: Peso Bruto dividido por Peso Líquido.\nSe você compra 1kg e sobra 800g limpo, o fator é 1,25. Assim, eu garanto que seu custo fica 100 por cento exato sem prejuízo invisível!`;
    }

    if (lower.includes('cocção') || lower.includes('cozimento') || lower.includes('ic') || lower.includes('rendimento')) {
      return `🍳 Eu te ajudo a entender o Índice de Cocção, ${displayName}!\n\nÉ a mudança de peso do alimento no fogo:\n• Carnes perdem água e reduzem.\n• Arroz e massas absorvem água e rendem muito mais.\n\nEu uso isso para padronizar o tamanho das porções servidas aos clientes!`;
    }

    if (lower.includes('impressão') || lower.includes('parede') || lower.includes('imprimir')) {
      return `📋 Eu preparo a ficha para a parede da sua cozinha, ${displayName}!\n\nNa aba 'Itens e Receitas' > 'Fichas Técnicas', é só clicar no botão 'Imprimir' do prato desejado. Eu gero uma ficha limpa, vertical e em página única, pronta para você colar na estação da cozinha!`;
    }

    if (lower.includes('duplic') || lower.includes('descart') || lower.includes('embalag') || lower.includes('repeti') || lower.includes('lancament') || lower.includes('duplicação')) {
      return `⚠️ Deixa que eu te explico sobre duplicações para proteger seu lucro, ${displayName}!\n\nEu vejo que muita gente tem essa dúvida com descartáveis (como marmitex e sacolas):\n\n❌ O Erro que eu quero te ajudar a evitar: Lançar o pacote total de descartáveis nos Custos Variáveis E TAMBÉM colocar cada caixinha separada dentro de cada Ficha Técnica. Fazendo isso, você acaba pagando duas vezes pelo mesmo insumo!\n\n✅ Como eu te aconselho a fazer:\n• Caminho A: Se você quer que a embalagem apareça no custo do prato, cadastre o descartável na Ficha Técnica (e não lance o pacote global nos custos variáveis).\n• Caminho B: Se prefere lançar o consumo mensal global nos Custos Variáveis, não coloque as caixinhas individuais nas fichas.\n\nEu consigo fazer junto com você na tela para ajustar do jeito certinho! Qual dos dois caminhos você prefere adotar, ${displayName}?`;
    }

    if (lower.includes('simular') || lower.includes('simulador') || lower.includes('e se') || lower.includes('cenário') || lower.includes('inflação') || lower.includes('aumento')) {
      return `⚡ Eu criei uma ferramenta incrível para você, ${displayName}: o **Simulador de Cenários & Preços 2.0**!\n\nCom ele, você pode testar 3 tipos de cenários sem arriscar seu lucro:\n1️⃣ **Reajuste Geral**: Simule +5%, +10% ou descontos em todo o cardápio ou em categorias específicas.\n2️⃣ **Alta de Insumo Específico**: Descubra o que acontece se o queijo, a carne ou o óleo subirem e veja todos os pratos afetados e o preço ideal sugerido.\n3️⃣ **Oscilação de Faturamento & Custos Fixos**: Simule contratação de equipe, aumento de aluguel ou queda de vendas para ver o novo rateio.\n\nVocê pode acessar a qualquer momento no menu lateral em **Custos & Precificação > Simulador de Cenários ⚡**!`;
    }

    if (lower.includes('preço') || lower.includes('margem') || lower.includes('lucro') || lower.includes('markup')) {
      return `💰 Eu calculo sua margem e preço na hora, ${displayName}!\n\nVocê digita o preço praticado e eu mostro instantaneamente a Margem Líquida em porcentagem e o CMV. Assim eu te ajudo a garantir que cada prato dê lucro de verdade!`;
    }

    return `👨‍🍳 Olá, ${displayName}! Eu sou o seu amigo e assistente mestre no Margem de Chefe.\n\nEu conheço cada tela e botão do sistema de cor! Eu posso te ajudar a:\n• Gerar relatórios e informações de todas as informações presentes no sistema\n• Cadastrar Itens e criar Fichas Técnicas\n• Simular reajustes de preços e cenários de inflação de insumos\n• Configurar Custos Fixos e Mão de Obra (CLT e Freelance)\n• Entender o Fator de Correção sem complicação\n• Analisar a Margem de Lucro e CMV\n\nVamos passo a passo? Como eu posso te ajudar agora, ${displayName}? 🚀`;
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
