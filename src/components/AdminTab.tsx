import React, { useState } from 'react';
import { DecimalInput } from './DecimalInput';
import {
  CommunitySuggestion,
  ClientRestaurant,
  AdminStats,
  PlatformNews,
  ActivationCode,
  User
} from '../types';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Layers,
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Bot,
  Settings,
  Building,
  DollarSign,
  Mail,
  MapPin,
  Lock,
  Unlock,
  Radio,
  Send,
  Sliders,
  Check,
  Phone,
  Key,
  Copy,
  MessageCircle,
  UserCheck
} from 'lucide-react';

interface AdminTabProps {
  suggestions: CommunitySuggestion[];
  clients: ClientRestaurant[];
  stats: AdminStats;
  news: PlatformNews[];
  activationCodes: ActivationCode[];
  onGenerateCode: (type: 'daily' | 'monthly') => void;
  usersList: User[];
  onUpdateUserLicense: (userId: string, newType: 'daily' | 'monthly' | 'expired') => void;
  onUpdateSuggestionStatus: (
    id: string,
    status: CommunitySuggestion['status']
  ) => void;
  onAddNews: (news: Omit<PlatformNews, 'id'>) => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  suggestions,
  clients: initialClients,
  stats,
  news,
  activationCodes,
  onGenerateCode,
  usersList,
  onUpdateUserLicense,
  onUpdateSuggestionStatus,
  onAddNews
}) => {
  const [activeAdminSubtab, setActiveAdminSubtab] = useState<
    'overview' | 'licenses' | 'suggestions' | 'clients' | 'ai-mascot' | 'broadcast' | 'settings'
  >('overview');

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [clients, setClients] = useState<ClientRestaurant[]>(initialClients);
  const [clientSearch, setClientSearch] = useState('');
  const [suggestionFilter, setSuggestionFilter] = useState<string>('Todos');

  // Broadcast news form
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newTag, setNewTag] = useState<'Lançamento' | 'Atualização' | 'Dica de Gestão'>('Lançamento');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // AI Mascot settings state
  const [aiModel, setAiModel] = useState('gemini-3.6-flash');
  const [dailyMsgLimit, setDailyMsgLimit] = useState(100);
  const [aiGreeting, setAiGreeting] = useState(
    'Olá, Chefe! Sou o Chefinho IA. Como posso te ajudar a calcular margens e reduzir perdas hoje?'
  );
  const [aiSaved, setAiSaved] = useState(false);

  // Global settings state
  const [maxCmvAlert, setMaxCmvAlert] = useState(30);
  const [defaultFgtsPct, setDefaultFgtsPct] = useState(8);
  const [defaultInssPct, setDefaultInssPct] = useState(20);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const filteredSuggestions = suggestions.filter((sug) => {
    if (suggestionFilter === 'Todos') return true;
    return sug.status === suggestionFilter;
  });

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.city.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleToggleClientStatus = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const nextStatus = c.status === 'Ativo' ? 'Cancelado' : 'Ativo';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleBroadcastNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    onAddNews({
      title: newTitle,
      summary: newSummary,
      date: new Date().toLocaleDateString('pt-BR'),
      tag: newTag,
      readTime: '2 min de leitura'
    });

    setNewTitle('');
    setNewSummary('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const handleSaveAiSettings = () => {
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2500);
  };

  const handleSaveGlobalSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={26} className="text-orange-600" />
            <h2 className="text-2xl font-fredoka font-bold text-slate-900">
              Painel de Administração Global
            </h2>
            <span className="bg-orange-100 text-orange-800 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border border-orange-200">
              Base Chef Platform
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Gestão completa de restaurantes assinantes, moderação de sugestões da comunidade, parâmetros de IA do Chefinho e relatórios financeiros do SaaS.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 px-2">Acesso Admin:</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Master Superuser</span>
          </span>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Visão Geral & Métricas', icon: TrendingUp },
          { id: 'licenses', label: 'Usuários & Licenças', icon: UserCheck, badge: usersList.length },
          { id: 'cancellations', label: 'Cancelamentos & Feedback', icon: XCircle, badge: clients.filter(c => c.status === 'Cancelado').length },
          { id: 'suggestions', label: 'Moderação de Sugestões', icon: MessageSquare, badge: suggestions.filter(s => s.status === 'Em Análise').length },
          { id: 'clients', label: 'Restaurantes Assinantes', icon: Users, badge: clients.length },
          { id: 'ai-mascot', label: 'Mascote Chefinho IA', icon: Bot },
          { id: 'broadcast', label: 'Publicar Comunicado', icon: Radio },
          { id: 'settings', label: 'Parâmetros do Sistema', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminSubtab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl font-fredoka font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUBTAB: CANCELAMENTOS & FEEDBACK */}
      {activeAdminSubtab === 'cancellations' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Relatório de Cancelamentos & Feedback de Clientes</h3>
              <p className="text-xs text-slate-500">Análise de motivos de cancelamento e comentários abertos enviados pelos assinantes.</p>
            </div>
            <span className="bg-red-50 text-red-700 font-bold text-xs px-3 py-1 rounded-xl border border-red-200">
              {clients.filter(c => c.status === 'Cancelado').length} Cancelamentos Registrados
            </span>
          </div>

          <div className="space-y-4">
            {clients.filter(c => c.status === 'Cancelado').length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="font-bold text-sm text-slate-700">Nenhum cancelamento registrado até o momento.</p>
                <p className="text-xs text-slate-500">Todos os restaurantes assinantes encontram-se ativos e satisfeitos.</p>
              </div>
            ) : (
              clients.filter(c => c.status === 'Cancelado').map((client) => (
                <div key={client.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{client.name}</h4>
                      <p className="text-xs text-slate-500">Proprietário: {client.ownerName} • {client.city}</p>
                    </div>
                    <span className="text-[11px] font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                      Assinatura Cancelada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-500 uppercase block mb-1">Motivo Selecionado:</span>
                      <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-lg inline-block">
                        {client.cancelReason || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block mb-1">Comentário / Feedback:</span>
                      <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200">
                        "{client.cancelFeedback || 'Nenhum comentário adicional fornecido.'}"
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 1: VISÃO GERAL & MÉTRICAS SAAS */}
      {activeAdminSubtab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bento-card">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Faturamento Mensal (MRR)</span>
                <DollarSign size={18} className="text-emerald-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-fredoka font-black text-slate-900">
                  R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center space-x-1">
                  <TrendingUp size={12} />
                  <span>+12.4% em relação ao mês anterior</span>
                </p>
              </div>
            </div>

            <div className="bento-card">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Assinantes Ativos</span>
                <Users size={18} className="text-blue-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-fredoka font-black text-slate-900">
                  {stats.activeSubscribers} <span className="text-xs text-slate-400 font-normal">/ {stats.totalSubscribers} total</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Taxa de retenção 98.6%</p>
              </div>
            </div>

            <div className="bento-card">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Fichas Técnicas</span>
                <Layers size={18} className="text-orange-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-fredoka font-black text-orange-600">
                  {stats.totalSheetsCreated.toLocaleString('pt-BR')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Média de 24 fichas por restaurante</p>
              </div>
            </div>

            <div className="bento-card">
              <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Taxa de Churn (Cancelamentos)</span>
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-fredoka font-black text-slate-900">
                  {stats.churnRate}%
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold">✓ Abaixo do limite de tolerância (2.5%)</p>
              </div>
            </div>
          </div>

          {/* QUICK SUMMARY BOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <h3 className="font-fredoka font-bold text-lg text-slate-900 flex items-center justify-between">
                <span>Últimos Restaurantes Cadastrados</span>
                <button
                  onClick={() => setActiveAdminSubtab('clients')}
                  className="text-xs text-orange-600 hover:underline font-normal"
                >
                  Ver todos ({clients.length})
                </button>
              </h3>

              <div className="space-y-3">
                {clients.slice(0, 4).map((cli) => (
                  <div
                    key={cli.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{cli.name}</p>
                      <p className="text-[11px] text-slate-500">{cli.ownerName} • {cli.city}</p>
                    </div>

                    <div className="text-right">
                      <span className="bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-lg text-[10px] block">
                        {cli.plan}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{cli.fichasCount} Fichas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <h3 className="font-fredoka font-bold text-lg text-slate-900 flex items-center justify-between">
                <span>Sugestões da Comunidade Pendentes</span>
                <button
                  onClick={() => setActiveAdminSubtab('suggestions')}
                  className="text-xs text-orange-600 hover:underline font-normal"
                >
                  Moderar Sugestões
                </button>
              </h3>

              <div className="space-y-3">
                {suggestions
                  .filter((s) => s.status === 'Em Análise')
                  .slice(0, 3)
                  .map((sug) => (
                    <div key={sug.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">{sug.title}</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {sug.votes} Votos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{sug.description}</p>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Por: {sug.author}</span>
                        <div className="space-x-1">
                          <button
                            onClick={() => onUpdateSuggestionStatus(sug.id, 'Aprovado')}
                            className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-500"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => onUpdateSuggestionStatus(sug.id, 'Rejeitado')}
                            className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-300"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: LICENÇAS E STATUS DOS USUÁRIOS */}
      {activeAdminSubtab === 'licenses' && (
        <div className="space-y-6">
          {/* GERENCIAMENTO DE LICENÇAS E STATUS DOS USUÁRIOS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-fredoka font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck size={20} className="text-orange-600" />
                <span>Lista e Status dos Usuários</span>
              </h3>
              <p className="text-xs text-slate-500">
                Consulte a lista de usuários cadastrados, seus e-mails e o status atual da conta.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nome / E-mail</th>
                    <th className="p-3.5">Restaurante / Telefone</th>
                    <th className="p-3.5">Status da Licença</th>
                    <th className="p-3.5 text-right">Ações do Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{usr.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{usr.email}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{usr.restaurantName}</span>
                        <span className="text-[10px] text-slate-500">{usr.phone}</span>
                      </td>

                      <td className="p-3.5">
                        {usr.role === 'admin' ? (
                          <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            Administrador Master
                          </span>
                        ) : usr.licenseType === 'monthly' || usr.status_assinatura === 'ativo' ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            Profissional (Ativo)
                          </span>
                        ) : usr.licenseType === 'daily' ? (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            Diária 24h (Ativa)
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            Expirada / Bloqueada
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {usr.role !== 'admin' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateUserLicense(usr.id, 'monthly')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer shadow-xs"
                              title="Liberar Plano Profissional"
                            >
                              + Pro Mensal
                            </button>

                            <button
                              type="button"
                              onClick={() => onUpdateUserLicense(usr.id, 'daily')}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer"
                              title="Renovar +24 horas de degustação"
                            >
                              + 24h Diária
                            </button>

                            <button
                              type="button"
                              onClick={() => onUpdateUserLicense(usr.id, 'expired')}
                              className="bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-bold px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer"
                              title="Expirar/Bloquear acesso do usuário"
                            >
                              Bloquear
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MODERAÇÃO DE SUGESTÕES DA COMUNIDADE */}
      {activeAdminSubtab === 'suggestions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-fredoka font-bold text-slate-900">
                Central de Moderação de Sugestões dos Clientes
              </h3>
              <p className="text-xs text-slate-500">
                Aprove, rejeite ou envie sugestões para a fila de desenvolvimento. Suas alterações aparecem instantaneamente no painel dos clientes.
              </p>
            </div>

            {/* FILTER BUTTONS */}
            <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
              {['Todos', 'Em Análise', 'Aprovado', 'Em Desenvolvimento', 'Concluído', 'Rejeitado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSuggestionFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                    suggestionFilter === st
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-slate-900 text-sm">{sug.title}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                      {sug.category}
                    </span>
                    <span className="text-xs text-orange-600 font-mono font-bold">
                      ({sug.votes} votos dos restaurantes)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{sug.description}</p>
                  <p className="text-[10px] text-slate-400">
                    Enviado por: <strong className="text-slate-700">{sug.author}</strong> em {sug.date}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-2 w-full md:w-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status Atual:</span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={sug.status}
                      onChange={(e) => onUpdateSuggestionStatus(sug.id, e.target.value as any)}
                      className="bg-white border border-slate-300 text-slate-800 font-fredoka font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
                    >
                      <option value="Em Análise">⏳ Em Análise</option>
                      <option value="Aprovado">✓ Aprovado</option>
                      <option value="Em Desenvolvimento">🚀 Em Desenvolvimento</option>
                      <option value="Concluído">🎉 Concluído</option>
                      <option value="Rejeitado">✕ Rejeitado</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhuma sugestão encontrada com o filtro selecionado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: GESTÃO DE RESTAURANTES ASSINANTES */}
      {activeAdminSubtab === 'clients' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-fredoka font-bold text-slate-900">
                Gestão de Restaurantes e Pizzarias Assinantes
              </h3>
              <p className="text-xs text-slate-500">
                Lista de estabelecimentos utilizando a plataforma Base Chef.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por restaurante, responsável ou cidade..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Restaurante / Razão</th>
                  <th className="p-3.5">Responsável / E-mail</th>
                  <th className="p-3.5">Cidade</th>
                  <th className="p-3.5">Plano SaaS</th>
                  <th className="p-3.5 text-center">Fichas Criadas</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClients.map((cli) => (
                  <tr key={cli.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <span className="block text-slate-900">{cli.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Desde {cli.joinedDate}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="block font-medium text-slate-800">{cli.ownerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{cli.email}</span>
                    </td>

                    <td className="p-3.5 text-slate-600 font-medium">
                      {cli.city}
                    </td>

                    <td className="p-3.5">
                      <span className="bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                        {cli.plan}
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-bold text-slate-900 font-mono">
                      {cli.fichasCount}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        cli.status === 'Ativo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cli.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleClientStatus(cli.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                          cli.status === 'Ativo'
                            ? 'bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {cli.status === 'Ativo' ? 'Bloquear' : 'Ativar Acesso'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: CONFIGURAÇÕES DO MASCOTE CHEFINHO IA */}
      {activeAdminSubtab === 'ai-mascot' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-lg font-fredoka font-bold text-slate-900">
                Parâmetros do Mascote Chefinho IA
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste o comportamento do assistente virtual de precificação alimentado pelo Gemini API.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Modelo de IA Utilizado
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Ultrarrápido & Econômico)</option>
                <option value="gemini-3.6-pro">Gemini 3.6 Pro (Raciocínio Avançado de Receitas)</option>
              </select>

              <label className="block text-xs font-bold text-slate-700 uppercase">
                Limite Diário de Mensagens por Restaurante
              </label>
              <DecimalInput
                value={dailyMsgLimit}
                onChange={(val) => setDailyMsgLimit(val)}
                placeholder="0"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Mensagem Inicial de Saudação do Chefinho
              </label>
              <textarea
                value={aiGreeting}
                onChange={(e) => setAiGreeting(e.target.value)}
                rows={4}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            {aiSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <Check size={16} />
                <span>Configurações salvas com sucesso!</span>
              </span>
            )}

            <button
              onClick={handleSaveAiSettings}
              className="bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Salvar Parâmetros da IA
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PUBLICAR COMUNICADO / NOVIDADE */}
      {activeAdminSubtab === 'broadcast' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h3 className="text-lg font-fredoka font-bold text-slate-900">
              Publicar Novo Comunicado na Aba Comunidade
            </h3>
            <p className="text-xs text-slate-500">
              Envie anúncios, dicas de gestão e novos lançamentos para a tela de todos os clientes assinantes.
            </p>
          </div>

          <form onSubmit={handleBroadcastNews} className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Título do Comunicado</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Novo Módulo de Controle de Estoque Disponível!"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Categoria / Tag</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="Lançamento">🚀 Lançamento</option>
                  <option value="Atualização">⚡ Atualização</option>
                  <option value="Dica de Gestão">💡 Dica de Gestão</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Resumo da Notícia</label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={4}
                placeholder="Descreva o lançamento ou dica de forma amigável para os donos de restaurante..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {broadcastSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <Check size={16} />
                  <span>Comunicado transmitido a todos os clientes!</span>
                </span>
              )}

              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xs px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ml-auto"
              >
                <Send size={16} />
                <span>Publicar Notícia Agora</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 6: PARÂMETROS DO SISTEMA */}
      {activeAdminSubtab === 'settings' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h3 className="text-lg font-fredoka font-bold text-slate-900">
              Parâmetros Globais de Precificação & Impostos Padrão
            </h3>
            <p className="text-xs text-slate-500">
              Define os valores padrão sugeridos nos formulários para novos usuários do sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">CMV Teto Alerta (%)</label>
              <DecimalInput
                value={maxCmvAlert}
                onChange={(val) => setMaxCmvAlert(val)}
                placeholder="0,00"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-500">
                Alerta de cor amarela ativado quando o CMV ultrapassa este valor.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">FGTS Padrão Sugerido (%)</label>
              <DecimalInput
                value={defaultFgtsPct}
                onChange={(val) => setDefaultFgtsPct(val)}
                placeholder="0,00"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-500">
                Pré-preenchimento para cálculo de folha de pagamento.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">INSS Patronal Padrão (%)</label>
              <DecimalInput
                value={defaultInssPct}
                onChange={(val) => setDefaultInssPct(val)}
                placeholder="0,00"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-500">
                Pré-preenchimento para encargos patronais.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <Check size={16} />
                <span>Parâmetros atualizados no servidor!</span>
              </span>
            )}

            <button
              onClick={handleSaveGlobalSettings}
              className="bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm cursor-pointer"
            >
              Salvar Parâmetros Globais
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
