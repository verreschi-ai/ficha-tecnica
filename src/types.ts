export interface Ingredient {
  name: string;
  grossQty: number; // Peso Bruto
  netQty: number;   // Peso Líquido
  unit: string;     // kg, L, un, g, mL
  unitPrice: number; // Preço por unidade de medida
  fc: number;        // Fator de Correção (grossQty / netQty)
  totalCost: number; // Custo Total = grossQty * unitPrice
}

export interface TechnicalSheet {
  id: string;
  code: string;
  name: string;
  category: 'Pizzas' | 'Pratos Principais' | 'Entradas' | 'Sobremesas' | 'Bebidas' | 'Mini-porção';
  isActive?: boolean;
  imageUrl: string;
  yieldServings: number;
  portionWeight: string;
  prepTime: string;
  costPerPortion: number;
  totalRecipeCost: number;
  sellingPrice: number;
  cmv: number; // % (Custo / Preço de Venda * 100)
  margin: number; // % (100 - CMV)
  status: 'ideal' | 'warning' | 'critical';
  ingredients: Ingredient[];
  preparationSteps: string[];
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  ingredient: string;
  priceIncrease: string;
  impactDish: string;
  suggestedAction: string;
}

export interface CommunitySuggestion {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: 'Sistema' | 'Impressão' | 'Relatórios' | 'Calculadora';
  status: 'Em Análise' | 'Aprovado' | 'Em Desenvolvimento' | 'Concluído' | 'Rejeitado';
  votes: number;
  userVoted?: boolean;
}

export interface PlatformNews {
  id: string;
  title: string;
  summary: string;
  date: string;
  tag: 'Lançamento' | 'Atualização' | 'Dica de Gestão';
  readTime: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  baseSalary: number; // Salário Base (R$)
  isFreelance?: boolean; // Flag Freelance (Isento de encargos CLT)
  // Encargos e benefícios (Manually editable fields)
  fgts: number;
  thirteenthSalary: number; // 13º Salário
  vacationOneThird: number; // Férias + 1/3
  inssPatronal: number;
  valeTransporte: number;
  valeRefeicao: number;
  otherBenefits: number;
  includeThirteenth?: boolean;
  includeVacation?: boolean;
  includeTransport?: boolean;
  includeMeal?: boolean;
}

export interface FixedExpenseItem {
  id: string;
  name: string; // Aluguel, Luz, Água, Gás, Internet, Contabilidade, Software, Manutenção, Outros
  amount: number; // R$
}

export interface FixedCostsData {
  monthlyRevenue: number; // Faturamento Médio Mensal Estimado (R$)
  fixedExpenses: FixedExpenseItem[];
  employees: Employee[];
}

export interface VariableCostItem {
  id: string;
  name: string; // Cartões débito/crédito, Embalagens, Freelance, Juros e taxas bancárias, Marketing, Motoboys, Perda, Impostos
  percentage: number; // % sobre a venda
  enabled: boolean;
}

export interface VariableCostsData {
  items: VariableCostItem[];
}

export interface HelpArticle {
  id: string;
  title: string;
  category: 'Fator de Correção' | 'CMV & Precificação' | 'Impressão Cozinha' | 'Custos Fixos e Variáveis' | 'Geral';
  content: string;
}

export type ActiveTabType =
  | 'itens'
  | 'receitas'
  | 'custos-fixos'
  | 'custos-variaveis'
  | 'fichas'
  | 'precificacao'
  | 'simulador'
  | 'pdv-loja'
  | 'ifood'
  | '99food'
  | 'comunidade'
  | 'admin'
  | 'configuracoes'
  | 'assinatura';

export interface AppSettings {
  defaultTaxRate: number; // Imposto padrão (%)
  targetReturnMargin: number; // Margem de retorno (%)
  monthlyRevenue: number; // Faturamento médio/mês (R$)
  theme?: 'light' | 'dark'; // Modo Dia / Modo Noite
  whatsappNumber?: string; // Número do WhatsApp de suporte/ativação de licenças
  // Mix de vendas: % do faturamento mensal que vem de cada categoria (ex.: Marmitex 40%,
  // Pizzas 30%...). Usado pra estimar quantos pedidos de cada categoria isso representa
  // (receita da categoria ÷ ticket médio da categoria), em vez de assumir que todo prato
  // vende a mesma quantidade — o que penalizava pratos de ticket baixo e alto giro no
  // rateio de Custo Fixo por prato.
  categoryRevenueShare?: Record<string, number>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  restaurantName: string;
  phone: string;
  role: 'admin' | 'user';
  licenseType: 'daily' | 'monthly' | 'expired';
  status_conta?: 'trial' | 'pendente' | 'expirado';
  status_assinatura?: 'ativo' | 'pendente' | 'cancelado' | 'expirado';
  mp_subscription_id?: string;
  subscription_expires_at?: string;
  createdAt: string; // ISO String
  data_inicio?: number | string; // Timestamp ms or ISO date for trial tracking
  dailyLicenseExpiresAt?: string; // ISO String
  isBlocked?: boolean;
}

export interface ActivationCode {
  id: string;
  code: string;
  type: 'daily' | 'monthly';
  used: boolean;
  usedByEmail?: string;
  createdAt: string;
}

export interface RawIngredientItem {
  id: string;
  code: string;
  name: string;
  unit: string; // kg, L, un, g
  unitPrice: number; // R$ per unit
  fc: number; // Fator de Correção
  supplier: string;
  category: string;
  lastUpdated: string;
  isRecipe?: boolean; // Distinguishes between Raw Item vs Sub-recipe Base
  yieldQty?: number; // Rendimento da receita base
  subItems?: Array<{
    ingredientId: string;
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
  }>;
}

export interface ClientRestaurant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  city: string;
  plan: 'Pro Mensal' | 'Pro Anual' | 'Degustação (7 dias)' | 'Enterprise';
  status: 'Ativo' | 'Pendente' | 'Inadimplente' | 'Cancelado';
  fichasCount: number;
  joinedDate: string;
  monthlyValue: number;
}

export interface AdminStats {
  mrr: number;
  totalSubscribers: number;
  activeSubscribers: number;
  totalSheetsCreated: number;
  pendingSuggestions: number;
  churnRate: number;
}

export interface ChangelogItem {
  id: string;
  version: string;
  date: string;
  title: string;
  changes: string[];
}

