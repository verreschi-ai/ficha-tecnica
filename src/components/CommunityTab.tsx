import React, { useState } from 'react';
import { CommunitySuggestion, PlatformNews, HelpArticle, ChangelogItem } from '../types';
import {
  MessageSquarePlus,
  Newspaper,
  HelpCircle,
  History,
  ThumbsUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  Send,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Search
} from 'lucide-react';

interface CommunityTabProps {
  suggestions: CommunitySuggestion[];
  news: PlatformNews[];
  helpArticles: HelpArticle[];
  changelog: ChangelogItem[];
  onAddSuggestion: (newSug: CommunitySuggestion) => void;
  onVoteSuggestion: (id: string) => void;
  onAdminUpdateStatus: (id: string, newStatus: CommunitySuggestion['status']) => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  suggestions,
  news,
  helpArticles,
  changelog,
  onAddSuggestion,
  onVoteSuggestion,
  onAdminUpdateStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sugestoes' | 'novidades' | 'ajuda' | 'historico'>('sugestoes');
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDesc, setSuggestionDesc] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState<CommunitySuggestion['category']>('Impressão');
  const [authorName, setAuthorName] = useState('Chef Pizzaiolo');

  const [isAdminView, setIsAdminView] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const anonymizeName = (name: string): string => {
    if (!name || !name.trim()) return 'Cliente...';
    const clean = name.trim();
    const words = clean.split(/\s+/);
    if (words.length > 1) {
      const firstWord = words[0];
      if (firstWord.length <= 3) {
        return `${firstWord[0]}...`;
      }
      return `${firstWord}...`;
    }
    if (clean.length <= 3) {
      return `${clean[0]}...`;
    }
    return `${clean}...`;
  };

  const handleCreateSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionTitle.trim() || !suggestionDesc.trim()) return;

    const newSug: CommunitySuggestion = {
      id: `sug-${Date.now()}`,
      title: suggestionTitle,
      description: suggestionDesc,
      author: authorName || 'Cliente Base Chef',
      date: new Date().toLocaleDateString('pt-BR'),
      category: suggestionCategory,
      status: 'Em Análise',
      votes: 1,
      userVoted: true
    };

    onAddSuggestion(newSug);
    setShowNewSuggestionModal(false);
    setSuggestionTitle('');
    setSuggestionDesc('');
  };

  const filteredSuggestions = suggestions.filter((item) => {
    if (filterCategory !== 'Todos' && item.category !== filterCategory) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* SUB-TAB NAVIGATION STRIP */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('sugestoes')}
            className={`px-4 py-2.5 rounded-xl font-fredoka font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'sugestoes'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquarePlus size={16} />
            <span>1. Sugestões & Melhorias</span>
          </button>

          <button
            onClick={() => setActiveSubTab('novidades')}
            className={`px-4 py-2.5 rounded-xl font-fredoka font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'novidades'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Newspaper size={16} />
            <span>2. Novidades & Lançamentos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ajuda')}
            className={`px-4 py-2.5 rounded-xl font-fredoka font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'ajuda'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle size={16} />
            <span>3. Central de Ajuda</span>
          </button>

          <button
            onClick={() => setActiveSubTab('historico')}
            className={`px-4 py-2.5 rounded-xl font-fredoka font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'historico'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History size={16} />
            <span>4. Histórico de Melhorias</span>
          </button>
        </div>

        {/* ADMIN TOGGLE SIMULATOR FOR SPEC 2.2 */}
        <button
          onClick={() => setIsAdminView(!isAdminView)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
            isAdminView
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Simular Painel de Administração"
        >
          <ShieldCheck size={14} />
          <span>{isAdminView ? 'Modo Admin Ativo' : 'Simular Painel Admin'}</span>
        </button>
      </div>

      {/* SUB-SECTION 1: SUGESTÕES E MELHORIAS */}
      {activeSubTab === 'sugestoes' && (
        <div className="space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-orange-100 text-orange-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-orange-200">
                  Co-Criação com Clientes
                </span>
                {isAdminView && (
                  <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                    Modo Moderação
                  </span>
                )}
              </div>
              <h3 className="text-xl font-fredoka font-bold text-slate-900 mt-1">
                Sugestões & Melhorias da Comunidade
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Envie suas ideias de recursos e vote nas melhorias prioritárias para o sistema.
              </p>
            </div>

            <button
              onClick={() => setShowNewSuggestionModal(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus size={18} />
              <span>Enviar Nova Sugestão</span>
            </button>
          </div>

          {/* SEARCH BAR FOR SUGGESTIONS */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar sugestões por título ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* SUGGESTION LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuggestions.map((sug) => {
              const getStatusBadge = (status: CommunitySuggestion['status']) => {
                switch (status) {
                  case 'Aprovado':
                    return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> Aprovado</span>;
                  case 'Em Desenvolvimento':
                    return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock size={12} /> Em Desenvolvimento</span>;
                  case 'Concluído':
                    return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Sparkles size={12} /> Concluído</span>;
                  case 'Rejeitado':
                    return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle size={12} /> Rejeitado</span>;
                  default:
                    return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle size={12} /> Em Análise</span>;
                }
              };

              return (
                <div
                  key={sug.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {sug.category}
                      </span>
                      {getStatusBadge(sug.status)}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {sug.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sug.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-700">{anonymizeName(sug.author)}</p>
                      <p className="text-[10px] text-slate-400">{sug.date}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* VOTE BUTTON */}
                      <button
                        onClick={() => onVoteSuggestion(sug.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                          sug.userVoted
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        <span>{sug.votes} Votos</span>
                      </button>

                      {/* ADMIN STATUS SELECTOR */}
                      {isAdminView && (
                        <select
                          value={sug.status}
                          onChange={(e) => onAdminUpdateStatus(sug.id, e.target.value as any)}
                          className="bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px] rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="Em Análise">Em Análise</option>
                          <option value="Aprovado">Aprovado</option>
                          <option value="Em Desenvolvimento">Em Desenvolvimento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Rejeitado">Rejeitado</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: NOVIDADES & LANÇAMENTOS */}
      {activeSubTab === 'novidades' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-fredoka font-bold text-slate-900">
              Novidades & Lançamentos da Plataforma
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Acompanhe as últimas atualizações de apps e funcionalidades do ecossistema Chefinho.app / Base Chef.
            </p>
          </div>

          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {item.tag}
                    </span>
                    <span className="text-xs text-slate-500">{item.date} • {item.readTime}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                </div>
                
                <button
                  onClick={() => alert(`Artigo completo: ${item.title}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto flex items-center space-x-1"
                >
                  <span>Ler Mais</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: CENTRAL DE AJUDA */}
      {activeSubTab === 'ajuda' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-fredoka font-bold text-slate-900">
              Central de Ajuda & Guia de Custos
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Respostas rápidas sobre cálculo de Fator de Correção (FC), CMV, margem de contribuição e impressão de cozinha.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {helpArticles.map((art) => (
              <div key={art.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <span className="text-[10px] font-extrabold text-orange-800 bg-orange-100 border border-orange-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {art.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{art.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{art.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: HISTÓRICO DE MELHORIAS APLICADAS (CHANGELOG) */}
      {activeSubTab === 'historico' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-fredoka font-bold text-slate-900">
              Histórico de Melhorias Aplicadas (Changelog)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Transparência sobre todas as atualizações e correções implementadas na plataforma.
            </p>
          </div>

          <div className="space-y-4">
            {changelog.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-orange-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                      {item.version}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{item.date}</span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600">
                  {item.changes.map((change, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PARA CRIAR SUGESTÃO */}
      {showNewSuggestionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-fredoka font-bold text-slate-900 flex items-center gap-2">
                <MessageSquarePlus className="text-orange-600" size={20} />
                Enviar Ideia de Melhoria
              </h3>
              <button
                onClick={() => setShowNewSuggestionModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSuggestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seu Nome / Pizzaria</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: Pizzaria Forno a Lenha"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">🔒 Proteção de dados: O nome será exibido de forma anônima na comunidade (ex: Pizzaria...).</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria da Sugestão</label>
                <select
                  value={suggestionCategory}
                  onChange={(e) => setSuggestionCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="Impressão">Impressão de Ficha Técnica</option>
                  <option value="Relatórios">Relatórios & Precificação</option>
                  <option value="Calculadora">Calculadora de FC / CMV</option>
                  <option value="Sistema">Sistema / Usabilidade Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título Curto da Sugestão</label>
                <input
                  type="text"
                  value={suggestionTitle}
                  onChange={(e) => setSuggestionTitle(e.target.value)}
                  placeholder="Ex: Gerar QR Code na ficha impressa para ver no celular"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detalhamento</label>
                <textarea
                  rows={3}
                  value={suggestionDesc}
                  onChange={(e) => setSuggestionDesc(e.target.value)}
                  placeholder="Descreva como essa funcionalidade ajudará sua cozinha no dia a dia..."
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSuggestionModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                >
                  Enviar Sugestão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
