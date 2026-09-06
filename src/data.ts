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

export const INITIAL_RAW_INGREDIENTS: RawIngredientItem[] = [];

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
  monthlyRevenue: 0,
  fixedExpenses: [],
  employees: []
};

export const INITIAL_SETTINGS: AppSettings = {
  defaultTaxRate: 6.0,
  targetReturnMargin: 20.0,
  monthlyRevenue: 0,
  whatsappNumber: ''
};

export const INITIAL_VARIABLE_COSTS: VariableCostsData = {
  items: []
};

export const INITIAL_SHEETS: TechnicalSheet[] = [];

export const INITIAL_PRICE_ALERTS: PriceAlert[] = [];

export const INITIAL_SUGGESTIONS: CommunitySuggestion[] = [];

export const INITIAL_NEWS: PlatformNews[] = [];

export const INITIAL_HELP_ARTICLES: HelpArticle[] = [];

export const INITIAL_CHANGELOG: ChangelogItem[] = [];
