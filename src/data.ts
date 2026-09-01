import {
  TechnicalSheet,
  PriceAlert,
  CommunitySuggestion,
  PlatformNews,
  HelpArticle,
  ChangelogItem,
  FixedCostsData,
  VariableCostsData,
  AppSettings,
  RawIngredientItem,
  ClientRestaurant,
  AdminStats
} from './types';

export const INITIAL_RAW_INGREDIENTS: RawIngredientItem[] = [
  { id: 'raw-1', code: 'INS-001', name: 'Massa Fermentação Natural', unit: 'kg', unitPrice: 12.00, fc: 1.00, supplier: 'Moinho Santo André', category: 'Massas', lastUpdated: '25/07/2026', isRecipe: false },
  { id: 'raw-2', code: 'INS-002', name: 'Massa Fermentação Natural (Maturada 48h)', unit: 'kg', unitPrice: 12.00, fc: 1.00, supplier: 'Moinho Santo André', category: 'Massas', lastUpdated: '25/07/2026', isRecipe: false },
  { id: 'raw-3', code: 'INS-003', name: 'Molho Tomate Pelato Italiano Mutti', unit: 'kg', unitPrice: 18.00, fc: 1.00, supplier: 'Importadora Roma', category: 'Molhos', lastUpdated: '25/07/2026', isRecipe: false },
  { id: 'raw-4', code: 'INS-004', name: 'Mussarela de Búfala Fresca ARL', unit: 'kg', unitPrice: 38.00, fc: 1.12, supplier: 'Laticínios Búfala', category: 'Frios e Queijos', lastUpdated: '25/07/2026', isRecipe: false },
  { id: 'raw-5', code: 'INS-005', name: 'Manjericão Gigante de Horta', unit: 'kg', unitPrice: 25.00, fc: 1.33, supplier: 'Hortifrúti Verde', category: 'Hortifrúti', lastUpdated: '25/07/2026', isRecipe: false },
  { id: 'raw-6', code: 'INS-006', name: 'Azeite Extra Virgem Italiano', unit: 'L', unitPrice: 102.00, fc: 1.00, supplier: 'Importadora Oliva', category: 'Mercearia', lastUpdated: '25/07/2026', isRecipe: false },
  { id: 'raw-rec-1', code: 'REC-001', name: 'Molho de Tomate Pelato Rústico', unit: 'kg', unitPrice: 18.00, fc: 1.00, supplier: 'Produção Própria', category: 'Receitas Base', lastUpdated: '24/07/2026', isRecipe: true }
];

export const INITIAL_CLIENTS: ClientRestaurant[] = [];

export const INITIAL_ADMIN_STATS: AdminStats = {
  mrr: 0,
  totalSubscribers: 0,
  activeSubscribers: 0,
  totalSheetsCreated: 0,
  pendingSuggestions: 0,
  churnRate: 0
};


export const INITIAL_FIXED_COSTS: FixedCostsData = {
  monthlyRevenue: 80000, // Faturamento Médio Mensal Estimado R$ 80.000,00
  fixedExpenses: [
    { id: 'fe-1', name: 'Aluguel do Imóvel Operacional', amount: 6500 },
    { id: 'fe-2', name: 'Energia Elétrica (Enel / Luz)', amount: 3200 },
    { id: 'fe-3', name: 'Água e Esgoto (Sabesp / Sanepar)', amount: 950 },
    { id: 'fe-4', name: 'Gás Encanado / Botijão P45 Cozinha', amount: 1800 },
    { id: 'fe-5', name: 'Internet, Telefone e Wi-Fi', amount: 280 },
    { id: 'fe-6', name: 'Honorários de Contabilidade', amount: 1200 },
    { id: 'fe-7', name: 'Licenças de Software & Sistemas POS', amount: 450 },
    { id: 'fe-8', name: 'Manutenção Preventiva de Fornos & Equipamentos', amount: 800 },
    { id: 'fe-9', name: 'Produtos de Limpeza e Higienização', amount: 650 }
  ],
  employees: [
    {
      id: 'emp-1',
      name: 'Carlos Alberto (Chef Pizzaiolo)',
      role: 'Pizzaiolo Chefe',
      baseSalary: 3200,
      fgts: 256,
      thirteenthSalary: 266,
      vacationOneThird: 355,
      inssPatronal: 640,
      valeTransporte: 280,
      valeRefeicao: 440,
      otherBenefits: 0
    },
    {
      id: 'emp-2',
      name: 'Juliana Mendes (Auxiliar de Cozinha)',
      role: 'Cozinheira Assistente',
      baseSalary: 2200,
      fgts: 176,
      thirteenthSalary: 183,
      vacationOneThird: 244,
      inssPatronal: 440,
      valeTransporte: 280,
      valeRefeicao: 440,
      otherBenefits: 0
    },
    {
      id: 'emp-3',
      name: 'Lucas Ferreira (Caixa & Operações)',
      role: 'Atendente / Caixa',
      baseSalary: 1800,
      fgts: 144,
      thirteenthSalary: 150,
      vacationOneThird: 200,
      inssPatronal: 360,
      valeTransporte: 280,
      valeRefeicao: 440,
      otherBenefits: 0
    }
  ]
};

export const INITIAL_SETTINGS: AppSettings = {
  defaultTaxRate: 6.0,
  targetReturnMargin: 20.0,
  monthlyRevenue: 80000.00,
  whatsappNumber: '5511999999999'
};

export const INITIAL_VARIABLE_COSTS: VariableCostsData = {
  items: [
    { id: 'vc-1', name: 'Cartões débito/crédito (Taxas de Maquininha)', percentage: 3.5, enabled: true },
    { id: 'vc-2', name: 'Embalagens de Pizzas & Sacolas Delivery', percentage: 4.0, enabled: true },
    { id: 'vc-4', name: 'Motoboys / Taxa de Entrega Própria', percentage: 5.0, enabled: true },
    { id: 'vc-5', name: 'Marketing, Anúncios & Tráfego Pago', percentage: 2.5, enabled: true },
    { id: 'vc-6', name: 'Perda, Quebra & Desperdício Operacional', percentage: 2.0, enabled: true },
    { id: 'vc-7', name: 'Juros, Taxas Bancárias & Antecipação', percentage: 1.5, enabled: true },
    { id: 'vc-8', name: 'Freelance & Equipe Extra Fim de Semana', percentage: 3.0, enabled: true }
  ]
};

export const INITIAL_SHEETS: TechnicalSheet[] = [
  {
    id: 'ft-101',
    code: 'FT-001',
    name: 'Pizza Margherita Especial de Fermentação Natural',
    category: 'Pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    yieldServings: 2,
    portionWeight: '450g (8 fatias)',
    prepTime: '15 min (Assamento 3 min)',
    costPerPortion: 7.80,
    totalRecipeCost: 15.60,
    sellingPrice: 62.00,
    cmv: 25.1,
    margin: 74.9,
    status: 'ideal',
    createdAt: '15/05/2026',
    ingredients: [
      { name: 'Massa Fermentação Natural (Maturada 48h)', grossQty: 0.380, netQty: 0.380, unit: 'kg', unitPrice: 12.00, fc: 1.00, totalCost: 4.56 },
      { name: 'Molho Tomate Pelato Italiano Mutti', grossQty: 0.120, netQty: 0.120, unit: 'kg', unitPrice: 18.00, fc: 1.00, totalCost: 2.16 },
      { name: 'Mussarela de Búfala Fresca ARL', grossQty: 0.180, netQty: 0.160, unit: 'kg', unitPrice: 38.00, fc: 1.12, totalCost: 6.84 },
      { name: 'Manjericão Gigante de Horta', grossQty: 0.020, netQty: 0.015, unit: 'kg', unitPrice: 25.00, fc: 1.33, totalCost: 0.50 },
      { name: 'Azeite Extra Virgem Italiano', grossQty: 0.015, netQty: 0.015, unit: 'L', unitPrice: 102.00, fc: 1.00, totalCost: 1.54 }
    ],
    preparationSteps: [
      'Abrir o disco de massa manualmente mantendo a cornicione (borda alta).',
      'Espalhar 120g de molho de tomate San Marzano em movimentos espirais do centro para fora.',
      'Distribuir os pedaços de mussarela de búfala drenada sobre o molho.',
      'Assar em forno de alta temperatura (420°C a 450°C) por aproximadamente 2,5 a 3 minutos.',
      'Finalizar ao sair do forno com folhas frescas de manjericão e fio de azeite extra virgem.'
    ]
  }
];

export const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'a-1',
    ingredient: 'Azeite Extra Virgem',
    priceIncrease: '+18.5%',
    impactDish: 'Pizza Margherita & Molhos Base',
    suggestedAction: 'Impacto de +R$ 0,85/pizza — Cotação com fornecedor local recomendada'
  },
  {
    id: 'a-2',
    ingredient: 'Camarão Rosa (20/30)',
    priceIncrease: '+14.0%',
    impactDish: 'Risoto de Camarão',
    suggestedAction: 'CMV subiu para 27.1% (Ainda dentro do limite seguro de 30%)'
  },
  {
    id: 'a-3',
    ingredient: 'Filé Mignon Bovina',
    priceIncrease: '+8.2%',
    impactDish: 'Grelhados e Rôti',
    suggestedAction: 'Revisar porcionamento ou reajustar preço em R$ 3,00'
  }
];

export const INITIAL_SUGGESTIONS: CommunitySuggestion[] = [];

export const INITIAL_NEWS: PlatformNews[] = [];

export const INITIAL_HELP_ARTICLES: HelpArticle[] = [];

export const INITIAL_CHANGELOG: ChangelogItem[] = [];
