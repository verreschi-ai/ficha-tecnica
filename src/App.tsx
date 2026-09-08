import React, { useState, useRef } from 'react';
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
  ActiveTabType,
  RawIngredientItem,
  ClientRestaurant,
  AdminStats,
  User,
  ActivationCode,
  Employee
} from './types';
import { downloadCsvTemplate, parseCsvFile } from './utils/excelImportExport';
import {
  INITIAL_SHEETS,
  INITIAL_PRICE_ALERTS,
  INITIAL_SUGGESTIONS,
  INITIAL_NEWS,
  INITIAL_HELP_ARTICLES,
  INITIAL_CHANGELOG,
  INITIAL_FIXED_COSTS,
  INITIAL_VARIABLE_COSTS,
  INITIAL_SETTINGS,
  INITIAL_RAW_INGREDIENTS,
  INITIAL_CLIENTS,
  INITIAL_ADMIN_STATS
} from './data';
import { Sidebar } from './components/Sidebar';
import { PrintSheetModal } from './components/PrintSheetModal';
import { ProductFormModal } from './components/ProductFormModal';
import { CommunityTab } from './components/CommunityTab';
import { CustosFixosTab } from './components/CustosFixosTab';
import { CustosVariaveisTab } from './components/CustosVariaveisTab';
import { ItensReceitasTab } from './components/ItensReceitasTab';
import { AdminTab } from './components/AdminTab';
import { ConfiguracoesTab } from './components/ConfiguracoesTab';
import { ChefinhoMascot } from './components/ChefinhoMascot';
import { DashboardTab } from './components/DashboardTab';
import { AuthScreen } from './components/AuthScreen';
import { LicenseBarrierModal } from './components/LicenseBarrierModal';
import { PixPaymentModal } from './components/PixPaymentModal';
import { SubscriptionTab } from './components/SubscriptionTab';
import { SubscriptionBarrierModal } from './components/SubscriptionBarrierModal';
import { CreditCardCheckoutModal } from './components/CreditCardCheckoutModal';
import { IfoodPricingTab } from './components/IfoodPricingTab';
import { NineninePricingTab } from './components/NineninePricingTab';
import { PricingReportTab } from './components/PricingReportTab';
import { PriceSimulatorTab } from './components/PriceSimulatorTab';

import {
  Printer,
  Edit,
  Copy,
  Trash2,
  Search,
  DollarSign,
  Percent,
  AlertTriangle,
  Sparkles,
  Layers,
  ChefHat,
  Building2,
  Calculator,
  Plus,
  BookOpen,
  Package,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  MessageCircle,
  QrCode,
  X,
  LogOut
} from 'lucide-react';

// Helper to get user data linked to email with robust non-zero sanitization
const getUserDataFromStorage = (email?: string) => {
  if (!email) return null;
  try {
    const key = `basechef_data_${email.trim().toLowerCase()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure rawIngredients and sheets are never empty or zeroed out
      if (!parsed.rawIngredients || parsed.rawIngredients.length === 0) {
        parsed.rawIngredients = INITIAL_RAW_INGREDIENTS;
      } else {
        parsed.rawIngredients = parsed.rawIngredients.map((item: any) => ({
          ...item,
          unit: item.unit || 'kg',
          unitPrice: typeof item.unitPrice === 'number' && item.unitPrice > 0 ? item.unitPrice : 12.00,
          fc: typeof item.fc === 'number' && item.fc > 0 ? item.fc : 1.00
        }));
      }
      if (!parsed.sheets || parsed.sheets.length === 0) {
        parsed.sheets = INITIAL_SHEETS;
      } else {
        parsed.sheets = parsed.sheets.map((s: any) => {
          const sellPriceNum = Number(s.sellingPrice) > 0 ? Number(s.sellingPrice) : 0;
          const costPerPortion = Number(s.costPerPortion) > 0 ? Number(s.costPerPortion) : 0;
          const cmv = sellPriceNum > 0 && !isNaN(costPerPortion) ? parseFloat(((costPerPortion / sellPriceNum) * 100).toFixed(1)) : (typeof s.cmv === 'number' && !isNaN(s.cmv) ? s.cmv : 0.0);
          const margin = sellPriceNum > 0 ? parseFloat((100 - cmv).toFixed(1)) : (typeof s.margin === 'number' && !isNaN(s.margin) ? s.margin : 0.0);
          return {
            ...s,
            cmv: isNaN(cmv) ? 0.0 : cmv,
            margin: isNaN(margin) ? 0.0 : margin
          };
        });
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading user data from storage:', e);
  }
  return null;
};

// Helper for Global Reactive Cascade Recalculation of Raw Ingredients & Recipes with zero-price protection
const recalculateRawIngredients = (currentRaw: RawIngredientItem[]): RawIngredientItem[] => {
  const base = currentRaw && currentRaw.length > 0 ? currentRaw : INITIAL_RAW_INGREDIENTS;
  let updated = base.map((item) => ({
    ...item,
    unit: item.unit || 'kg',
    unitPrice: typeof item.unitPrice === 'number' && item.unitPrice > 0 ? item.unitPrice : 12.00,
    fc: typeof item.fc === 'number' && item.fc > 0 ? item.fc : 1.00
  }));

  for (let pass = 0; pass < 2; pass++) {
    updated = updated.map((item) => {
      if (!item.isRecipe || !item.subItems || item.subItems.length === 0) {
        return item;
      }
      const updatedSubItems = item.subItems.map((sub) => {
        const found = updated.find(
          (r) => r.name.toLowerCase().trim() === sub.name.toLowerCase().trim()
        );
        if (found) {
          const newUnitPrice = found.unitPrice;
          return {
            ...sub,
            unitPrice: newUnitPrice > 0 ? newUnitPrice : 12.00,
            unit: found.unit || sub.unit || 'kg'
          };
        }
        return {
          ...sub,
          unitPrice: sub.unitPrice > 0 ? sub.unitPrice : 12.00,
          unit: sub.unit || 'kg'
        };
      });

      const totalCost = updatedSubItems.reduce((acc, sub) => acc + (sub.qty || 0) * (sub.unitPrice || 0), 0);
      const effectiveYield = item.yieldQty && item.yieldQty > 0 ? item.yieldQty : 1;
      const unitPrice = parseFloat((totalCost / effectiveYield).toFixed(2));

      return {
        ...item,
        subItems: updatedSubItems,
        unitPrice: unitPrice > 0 ? unitPrice : 15.00
      };
    });
  }
  return updated;
};

const recalculateSheets = (
  currentSheets: TechnicalSheet[],
  currentIngredients: RawIngredientItem[]
): TechnicalSheet[] => {
  let sheetsCopy = [...currentSheets];

  // Run 2 passes to ensure sub-recipes update parent recipes in cascade
  for (let pass = 0; pass < 2; pass++) {
    sheetsCopy = sheetsCopy.map((sheet) => {
      const updatedIngredients = sheet.ingredients.map((ing) => {
        // Auto-cura de fichas salvas antes da correção do formulário de cadastro, que gravava a
        // quantidade como "qty" em vez de "grossQty" — isso fazia grossQty ficar undefined e todo
        // custo virar NaN (mascarado como R$ 0,00 pelo `Number(...) || 0` usado no resto do app).
        const safeGrossQty = ing.grossQty > 0 ? ing.grossQty : ((ing as any).qty > 0 ? (ing as any).qty : 0);
        if (safeGrossQty !== ing.grossQty) {
          ing = { ...ing, grossQty: safeGrossQty, netQty: ing.netQty > 0 ? ing.netQty : safeGrossQty };
        }

        // 1. Check if ingredient matches a raw ingredient
        const foundRaw = currentIngredients.find(
          (r) => r.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
        );
        if (foundRaw) {
          const newUnitPrice = foundRaw.unitPrice;
          const totalCost = parseFloat((safeGrossQty * newUnitPrice).toFixed(2));
          return {
            ...ing,
            unitPrice: newUnitPrice,
            unit: foundRaw.unit || ing.unit,
            totalCost
          };
        }

        // 2. Check if ingredient matches another recipe/sub-dish in sheetsCopy
        const foundSubRecipe = sheetsCopy.find(
          (s) => s.id !== sheet.id && s.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
        );
        if (foundSubRecipe) {
          const subCostPerPortion = foundSubRecipe.yieldServings > 0 ? foundSubRecipe.totalRecipeCost / foundSubRecipe.yieldServings : foundSubRecipe.totalRecipeCost;
          const totalCost = parseFloat((safeGrossQty * subCostPerPortion).toFixed(2));
          return {
            ...ing,
            unitPrice: subCostPerPortion,
            totalCost
          };
        }

        return {
          ...ing,
          unitPrice: ing.unitPrice > 0 ? ing.unitPrice : 12.00,
          unit: ing.unit || 'kg',
          totalCost: parseFloat((safeGrossQty * (ing.unitPrice > 0 ? ing.unitPrice : 12.00)).toFixed(2))
        };
      });

      const totalRecipeCost = updatedIngredients.reduce((acc, curr) => acc + curr.totalCost, 0);
      const effectiveYield = sheet.yieldServings > 0 ? sheet.yieldServings : 1;
      const costPerPortion = parseFloat((totalRecipeCost / effectiveYield).toFixed(2));
      const sellPriceNum = Number(sheet.sellingPrice) > 0 ? Number(sheet.sellingPrice) : 0;
      const cmv = sellPriceNum > 0 ? parseFloat(((costPerPortion / sellPriceNum) * 100).toFixed(1)) : 0.0;
      const margin = sellPriceNum > 0 ? parseFloat((100 - cmv).toFixed(1)) : 0.0;
      const status = 'ideal';

      return {
        ...sheet,
        ingredients: updatedIngredients,
        totalRecipeCost,
        costPerPortion,
        cmv,
        margin,
        status
      };
    });
  }

  return sheetsCopy;
};

export function App() {
  // --- USER AUTHENTICATION & LICENSE STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('basechef_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const initialUserData = getUserDataFromStorage(currentUser?.email);

  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>(() => {
    try {
      const saved = localStorage.getItem('basechef_activation_codes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'code-1', code: 'CHEF-PRO-2026', type: 'monthly', used: false, createdAt: new Date().toISOString() },
      { id: 'code-2', code: 'DEGUSTACAO-24H', type: 'daily', used: false, createdAt: new Date().toISOString() },
      { id: 'code-3', code: 'BASECHEF-PRO', type: 'monthly', used: false, createdAt: new Date().toISOString() }
    ];
  });

  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('basechef_users_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'usr-admin',
        name: 'Gabriel Verreschi',
        email: 'gverreschi@hotmail.com',
        restaurantName: 'Matriz Principal',
        phone: '(11) 99999-8888',
        role: 'admin',
        licenseType: 'monthly',
        status_assinatura: 'ativo',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-demo',
        name: 'Chef Marcelo',
        email: 'degustacao@basechef.com.br',
        restaurantName: 'Pizzaria Bella Napoli',
        phone: '(11) 98888-7777',
        role: 'user',
        licenseType: 'daily',
        createdAt: new Date().toISOString(),
        dailyLicenseExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  });

  // Raw Ingredients & Admin SaaS state
  const [rawIngredients, setRawIngredients] = useState<RawIngredientItem[]>(() => {
    const raw = initialUserData?.rawIngredients || INITIAL_RAW_INGREDIENTS;
    return recalculateRawIngredients(raw);
  });

  const [sheets, setSheets] = useState<TechnicalSheet[]>(() => {
    const raw = initialUserData?.rawIngredients || INITIAL_RAW_INGREDIENTS;
    const sh = initialUserData?.sheets || INITIAL_SHEETS;
    return recalculateSheets(sh, raw);
  });

  // Global cascade effect: whenever rawIngredients change, update all registered products / sheets instantly
  React.useEffect(() => {
    setSheets((prevSheets) => recalculateSheets(prevSheets, rawIngredients));
  }, [rawIngredients]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(INITIAL_PRICE_ALERTS);
  const [suggestions, setSuggestions] = useState<CommunitySuggestion[]>(() => initialUserData?.suggestions || INITIAL_SUGGESTIONS);
  const [news] = useState<PlatformNews[]>(INITIAL_NEWS);
  const [helpArticles] = useState<HelpArticle[]>(INITIAL_HELP_ARTICLES);
  const [changelog] = useState<ChangelogItem[]>(INITIAL_CHANGELOG);
  const [clients, setClients] = useState<ClientRestaurant[]>(INITIAL_CLIENTS);
  const [adminStats, setAdminStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);

  // Fixed & Variable Costs State
  const [fixedCosts, setFixedCosts] = useState<FixedCostsData>(() => initialUserData?.fixedCosts || INITIAL_FIXED_COSTS);
  const [variableCosts, setVariableCosts] = useState<VariableCostsData>(() => initialUserData?.variableCosts || INITIAL_VARIABLE_COSTS);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => initialUserData?.appSettings || INITIAL_SETTINGS);

  // Dynamic Categories list
  const [categoriesList, setCategoriesList] = useState<string[]>(() => initialUserData?.categoriesList || [
    'Pizzas',
    'Pratos Principais',
    'Entradas',
    'Sobremesas',
    'Bebidas'
  ]);

  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const [welcomeMessage, setWelcomeMessage] = useState<{ show: boolean; text: string; subtext: string } | null>(null);

  React.useEffect(() => {
    if (currentUser) {
      const userName = currentUser.name || currentUser.restaurantName || 'Chef';
      setWelcomeMessage({
        show: true,
        text: `Que bom ter você de volta, ${userName}!`,
        subtext: 'Seu sistema BaseChef está pronto com todas as suas configurações, fichas técnicas e insumos atualizados.'
      });
      const timer = setTimeout(() => {
        setWelcomeMessage(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.id, currentUser?.email]);

  const [productImportMessage, setProductImportMessage] = useState<string | null>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Download Product Template Handler (exports current registered products from catalog or standard defaults)
  const handleDownloadProductTemplate = () => {
    const sampleRows = (sheets && sheets.length > 0)
      ? sheets.map(s => [
          s.name,
          s.category,
          String(s.yieldServings || 1),
          s.portionWeight || '1 porção',
          s.sellingPrice != null ? s.sellingPrice.toFixed(2) : '0.00'
        ])
      : [
          ['Pizza Margherita 35cm', 'Pizzas', '1', '480g', '52.00'],
          ['Hambúrguer Artesanal Smash', 'Pratos Principais', '1', '220g', '34.90'],
          ['Petit Gâteau de Chocolate', 'Sobremesas', '1', '180g', '24.00'],
          ['Massa Fettuccine ao Pesto', 'Pratos Principais', '1', '350g', '48.00']
        ];

    downloadCsvTemplate(
      'modelo_cadastro_produtos_basechef',
      ['NomeProduto', 'Categoria', 'RendimentoPorcoes', 'PesoPorcao', 'PrecoVenda'],
      sampleRows
    );
  };

  // Import Product CSV Handler - registers all imported rows individually with intelligent fallbacks
  const handleImportProductFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseCsvFile(file);
      if (rows.length <= 1) {
        alert('O arquivo selecionado está vazio ou contém apenas o cabeçalho.');
        return;
      }

      let newSheets = [...sheets];
      let count = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const hasData = row.some(cell => cell && String(cell).trim().length > 0);
        if (!hasData) continue;

        const name = row[0]?.trim() || `Produto Importado ${i}`;
        const category = row[1]?.trim() || 'Pratos Principais';
        const yieldServings = parseInt(row[2]) || 1;
        const portionWeight = row[3]?.trim() || '1 porção';
        const rawPrice = row[4] || row[2] || '0';
        const price = parseFloat(String(rawPrice).replace('R$', '').replace(/\s/g, '').replace(',', '.')) || 0;

        const validCategory: TechnicalSheet['category'] =
          ['Pizzas', 'Pratos Principais', 'Entradas', 'Sobremesas', 'Bebidas'].includes(category)
            ? (category as TechnicalSheet['category'])
            : 'Pratos Principais';

        const costVal = Math.round((price * 0.3) * 100) / 100;

        const newSheet: TechnicalSheet = {
          id: `p-${Date.now()}-${i}`,
          code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: name,
          category: validCategory,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          yieldServings: yieldServings,
          portionWeight: portionWeight,
          prepTime: '20 min',
          costPerPortion: costVal,
          totalRecipeCost: costVal * yieldServings,
          sellingPrice: price,
          cmv: price > 0 ? Math.round(((costVal / price) * 100) * 10) / 10 : 30.0,
          margin: price > 0 ? Math.round(((price - costVal) / price * 100) * 10) / 10 : 70.0,
          status: 'ideal',
          createdAt: new Date().toISOString(),
          preparationSteps: ['Modo de preparo padrão da ficha técnica.'],
          ingredients: [
            {
              name: 'Insumos Diversos da Ficha',
              grossQty: 1,
              netQty: 1,
              unit: 'un',
              unitPrice: costVal,
              fc: 1.0,
              totalCost: costVal
            }
          ]
        };

        newSheets.push(newSheet);
        count++;
      }

      setSheets(newSheets);
      setProductImportMessage(`${count} produtos cadastrados individualmente com sucesso via planilha!`);
      setTimeout(() => setProductImportMessage(null), 4000);
      if (productFileInputRef.current) productFileInputRef.current.value = '';
    } catch (err) {
      alert('Erro ao processar o arquivo. Verifique se a planilha está no formato CSV correto.');
    }
  };

  // Modals state
  const [printSheet, setPrintSheet] = useState<TechnicalSheet | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<TechnicalSheet | null>(null);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isGlobalCheckoutOpen, setIsGlobalCheckoutOpen] = useState(false);

  // --- AUTH HANDLERS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('basechef_current_user', JSON.stringify(user));

    setUsersList((prev) => {
      const exists = prev.find((u) => u.email === user.email);
      let updated;
      if (exists) {
        updated = prev.map((u) => (u.email === user.email ? { ...u, ...user } : u));
      } else {
        updated = [...prev, user];
      }
      localStorage.setItem('basechef_users_list', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRegister = (userData: Omit<User, 'id' | 'createdAt' | 'licenseType' | 'dailyLicenseExpiresAt' | 'role'>) => {
    const isMasterAdmin = userData.email.trim().toLowerCase() === 'gverreschi@hotmail.com';
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      role: isMasterAdmin ? 'admin' : 'user',
      licenseType: isMasterAdmin ? 'monthly' : 'daily',
      status_assinatura: isMasterAdmin ? 'ativo' : undefined,
      createdAt: new Date().toISOString(),
      dailyLicenseExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    handleLogin(newUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('basechef_current_user');
  };

  const handleActivateCode = (enteredCode: string): boolean => {
    if (!currentUser) return false;
    const cleanCode = enteredCode.trim().toUpperCase();

    const codeObj = activationCodes.find((c) => c.code.toUpperCase() === cleanCode && !c.used);

    let licenseTypeToSet: 'daily' | 'monthly' = 'monthly';

    if (codeObj) {
      licenseTypeToSet = codeObj.type;
      const updatedCodes = activationCodes.map((c) =>
        c.id === codeObj.id ? { ...c, used: true, usedByEmail: currentUser.email } : c
      );
      setActivationCodes(updatedCodes);
      localStorage.setItem('basechef_activation_codes', JSON.stringify(updatedCodes));
    } else if (cleanCode === 'CHEF-PRO-2026' || cleanCode === 'BASECHEF-PRO') {
      licenseTypeToSet = 'monthly';
    } else if (cleanCode === 'DEGUSTACAO-24H' || cleanCode === 'DAILY-24H') {
      licenseTypeToSet = 'daily';
    } else {
      return false;
    }

    const updatedUser: User = {
      ...currentUser,
      licenseType: licenseTypeToSet,
      status_assinatura: licenseTypeToSet === 'monthly' ? 'ativo' : currentUser.status_assinatura,
      dailyLicenseExpiresAt: licenseTypeToSet === 'daily' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('basechef_current_user', JSON.stringify(updatedUser));

    const updatedUsers = usersList.map((u) => (u.email === currentUser.email ? updatedUser : u));
    setUsersList(updatedUsers);
    localStorage.setItem('basechef_users_list', JSON.stringify(updatedUsers));

    return true;
  };

  const handleGenerateCode = (type: 'daily' | 'monthly') => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCodeStr = type === 'monthly' ? `CHEF-PRO-${randomSuffix}` : `CHEF-24H-${randomSuffix}`;
    const newCode: ActivationCode = {
      id: `code-${Date.now()}`,
      code: newCodeStr,
      type,
      used: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newCode, ...activationCodes];
    setActivationCodes(updated);
    localStorage.setItem('basechef_activation_codes', JSON.stringify(updated));
  };

  const handleUpdateUserLicense = (userId: string, newType: 'daily' | 'monthly' | 'expired') => {
    const updatedUsers = usersList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          licenseType: newType,
          status_assinatura: newType === 'monthly' ? ('ativo' as const) : u.status_assinatura,
          dailyLicenseExpiresAt: newType === 'daily' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : u.dailyLicenseExpiresAt
        };
      }
      return u;
    });
    setUsersList(updatedUsers);
    localStorage.setItem('basechef_users_list', JSON.stringify(updatedUsers));

    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = updatedUsers.find((u) => u.id === userId);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        localStorage.setItem('basechef_current_user', JSON.stringify(updatedCurrent));
      }
    }
  };

  // Chamado quando o PixPaymentModal confirma (via /api/mercadopago/payment-status) que o
  // pagamento da Licença Vitalícia foi aprovado de verdade no Mercado Pago. Antes, esse callback
  // chamava handleActivateCode('VITALICIA-8990') — um código que não existe em lugar nenhum do
  // app, então mesmo um pagamento aprovado não liberava nada. 'ativo' já é suficiente para
  // isLicenseExpired nunca bloquear o usuário novamente, independentemente do licenseType.
  const handleLifetimeLicenseConfirmed = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      status_assinatura: 'ativo'
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('basechef_current_user', JSON.stringify(updatedUser));

    const updatedUsers = usersList.map((u) => (u.email === currentUser.email ? updatedUser : u));
    setUsersList(updatedUsers);
    localStorage.setItem('basechef_users_list', JSON.stringify(updatedUsers));
  };

  const handleUpdateWhatsapp = (num: string) => {
    const updatedSettings = { ...appSettings, whatsappNumber: num };
    setAppSettings(updatedSettings);
    localStorage.setItem('basechef_app_settings', JSON.stringify(updatedSettings));
  };

  // Zera fichas técnicas, insumos, custos fixos e variáveis da conta logada para começar do zero.
  // Mantém o tema visual (preferência de interface, não é "dado do negócio") e a lista de categorias
  // (só nomes de categoria, não informação cadastrada). O autosave existente já persiste a limpeza.
  const handleResetAllData = () => {
    setSheets([]);
    setRawIngredients([]);
    setFixedCosts({ monthlyRevenue: 0, fixedExpenses: [], employees: [] });
    setVariableCosts({ items: [] });
    setAppSettings((prev) => ({
      ...prev,
      defaultTaxRate: 6.0,
      targetReturnMargin: 20.0,
      monthlyRevenue: 0,
      whatsappNumber: ''
    }));
  };

  // ADMIN STATUS DETERMINATION
  const isAdmin = currentUser?.email?.trim().toLowerCase() === 'miguel@gmail.com' || currentUser?.role === 'admin';

  // SUBSCRIPTION BUY BUTTON DETERMINATION:
  const showBuyButton = !!currentUser &&
    currentUser.email?.trim().toLowerCase() !== 'miguel@gmail.com' &&
    currentUser.status_assinatura !== 'ativo';

  // 24-HOUR TRIAL SECURITY & ACCESS DETERMINATION:
  const isLicenseExpired = (() => {
    if (!currentUser) return false;

    const emailClean = currentUser.email?.trim().toLowerCase();
    if (emailClean === 'miguel@gmail.com' || currentUser.role === 'admin') return false;
    if (currentUser.status_assinatura === 'ativo') return false;

    const dataInicioRaw = currentUser.data_inicio || currentUser.createdAt;
    const dataInicioMs = dataInicioRaw
      ? (typeof dataInicioRaw === 'number' ? dataInicioRaw : new Date(dataInicioRaw).getTime())
      : Date.now();
    const validDataInicio = isNaN(dataInicioMs) ? Date.now() : dataInicioMs;

    const horasPassadas = (Date.now() - validDataInicio) / (1000 * 60 * 60);

    if (horasPassadas < 24) {
      return false; // Trial de 24h ativo - Acesso liberado
    }

    return true; // Passou de 24h E não tem assinatura ativa -> Bloquear e solicitar assinatura
  })();

  // Add custom category
  const handleAddCategory = (newCat: string) => {
    if (!categoriesList.includes(newCat)) {
      setCategoriesList([...categoriesList, newCat]);
    }
  };

  // Filter products
  const filteredSheets = sheets.filter((s) => {
    const matchesCat = selectedCategory === 'Todos' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate counts for Painel de Comando
  const rawItemsCount = rawIngredients.filter((i) => !i.isRecipe).length;
  const recipesCount = rawIngredients.filter((i) => i.isRecipe).length;
  const productsCount = sheets.length;

  // Calculate global KPIs
  const pricedSheetsForApp = sheets.filter(s => s.sellingPrice > 0);
  const avgCMV = pricedSheetsForApp.length > 0
    ? (pricedSheetsForApp.reduce((acc, curr) => acc + curr.cmv, 0) / pricedSheetsForApp.length).toFixed(1)
    : (sheets.length > 0 ? (sheets.reduce((acc, curr) => acc + curr.cmv, 0) / sheets.length).toFixed(1) : "0.0");

  // Fixed & Variable Costs Percentages
  const totalFixedExpensesVal = fixedCosts.fixedExpenses.reduce((a, b) => a + b.amount, 0);
  const calculateEmployeeTotal = (emp: Employee) => {
    if (emp.isFreelance) {
      return (emp.baseSalary || 0) + (emp.otherBenefits || 0);
    }
    const inc13 = emp.includeThirteenth !== false;
    const incVac = emp.includeVacation !== false;
    const incTrans = emp.includeTransport !== false;
    const incMeal = emp.includeMeal !== false;

    return (
      (emp.baseSalary || 0) +
      (emp.fgts || 0) +
      (inc13 ? (emp.thirteenthSalary || 0) : 0) +
      (incVac ? (emp.vacationOneThird || 0) : 0) +
      (emp.inssPatronal || 0) +
      (incTrans ? (emp.valeTransporte || 0) : 0) +
      (incMeal ? (emp.valeRefeicao || 0) : 0) +
      (emp.otherBenefits || 0)
    );
  };
  const totalPayrollVal = fixedCosts.employees.reduce((acc, emp) => acc + calculateEmployeeTotal(emp), 0);
  const totalFixedCostVal = totalFixedExpensesVal + totalPayrollVal;
  // Métrica de saúde do negócio como um todo (média geral) — usada no Dashboard e no
  // Simulador de Cenários. NÃO é mais usada para calcular o preço sugerido por prato
  // (ver custoFixoPorPratoRS abaixo), porque tratar custo fixo como "% do preço de CADA
  // prato" distorcia pratos baratos e caros de forma desigual e reagia mal quando esse %
  // ficava alto.
  const fixedCostPct = parseFloat(((totalFixedCostVal / (fixedCosts.monthlyRevenue || appSettings.monthlyRevenue || 1)) * 100).toFixed(1));

  const variableCostPct = parseFloat(
    variableCosts.items
      .filter((i) => i.enabled)
      .reduce((acc, i) => acc + i.percentage, 0)
      .toFixed(1)
  );

  // Rateio de Custo Fixo por prato, via Ticket Médio (sem precisar de volume de vendas por
  // prato, que é volátil e difícil de manter atualizado). Faturamento Médio ÷ Ticket Médio
  // estima quantos pedidos o estabelecimento faz por mês; dividindo o Custo Fixo Total por
  // esse volume, chegamos a um valor em R$ fixo por prato — igual pra todos, e não mais um
  // % do preço de cada um.
  const ticketMedioGeral = sheets.length > 0
    ? sheets.reduce((acc, s) => acc + (s.sellingPrice > 0 ? s.sellingPrice : (s.costPerPortion > 0 ? s.costPerPortion * 3.33 : 0)), 0) / sheets.length
    : 0;
  const faturamentoMedioMensal = fixedCosts.monthlyRevenue || appSettings.monthlyRevenue || 0;
  const volumeMensalEstimado = ticketMedioGeral > 0 ? faturamentoMedioMensal / ticketMedioGeral : 0;
  const custoFixoPorPratoRS = volumeMensalEstimado > 0 ? parseFloat((totalFixedCostVal / volumeMensalEstimado).toFixed(2)) : 0;

  // Suggested Price Formula Calculation helper
  const calculateSuggestedPrice = (costInsumo: number) => {
    const taxPct = appSettings.defaultTaxRate || 6.0;
    const varPct = variableCostPct;
    const marginPct = appSettings.targetReturnMargin || 20.0;
    // Custo Fixo entra como valor fixo em R$ somado ao custo do insumo (não escala com o
    // preço), só Impostos + Variável + Margem continuam sendo % do preço de venda.
    const costWithOverhead = costInsumo + custoFixoPorPratoRS;
    const totalPctDeductions = taxPct + varPct + marginPct;

    if (totalPctDeductions < 90) {
      return costWithOverhead / (1 - totalPctDeductions / 100);
    }
    return costWithOverhead * 3.5;
  };



  // Actions for Fichas Técnicas
  const handleOpenCreate = () => {
    setEditingSheet(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sheet: TechnicalSheet) => {
    setEditingSheet(sheet);
    setIsFormOpen(true);
  };

  const handleDuplicate = (sheet: TechnicalSheet) => {
    const duplicated: TechnicalSheet = {
      ...sheet,
      id: `ft-${Date.now()}`,
      code: `${sheet.code}-COP`,
      name: `${sheet.name} (Cópia)`,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };
    setSheets([duplicated, ...sheets]);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este Cadastro de Produto?')) {
      setSheets(sheets.filter((s) => s.id !== id));
    }
  };

  const handleSaveProduct = (savedSheet: TechnicalSheet) => {
    const recalculated = recalculateSheets([savedSheet], rawIngredients)[0];
    if (editingSheet) {
      setSheets(sheets.map((s) => (s.id === recalculated.id ? recalculated : s)));
    } else {
      setSheets([recalculated, ...sheets]);
    }
    setIsFormOpen(false);
    setEditingSheet(null);
  };

  const handleBatchUpdatePrices = (updatedSheets: { id: string; newPrice: number }[]) => {
    setSheets((prev) => {
      const updated = prev.map((sheet) => {
        const match = updatedSheets.find((u) => u.id === sheet.id);
        if (match) {
          const newPrice = match.newPrice;
          const costVal = Number(sheet.costPerPortion) || 0;
          const newCmv = newPrice > 0 ? parseFloat(((costVal / newPrice) * 100).toFixed(1)) : 0;
          const newMargin = newPrice > 0 ? parseFloat((100 - newCmv).toFixed(1)) : 0;
          return {
            ...sheet,
            sellingPrice: newPrice,
            cmv: newCmv,
            margin: newMargin,
          };
        }
        return sheet;
      });
      try {
        localStorage.setItem('chef_sheets', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setProductImportMessage(`⚡ Sucesso: Preços de ${updatedSheets.length} prato(s) atualizados com sucesso via Simulador!`);
    setTimeout(() => setProductImportMessage(null), 5000);
  };

  // Actions for Raw Ingredients with Full Reactive Cascade
  const handleAddIngredient = (item: Omit<RawIngredientItem, 'id' | 'lastUpdated'> | Omit<RawIngredientItem, 'id' | 'lastUpdated'>[]) => {
    const itemsArray = Array.isArray(item) ? item : [item];
    const newItems: RawIngredientItem[] = itemsArray.map((it, idx) => ({
      ...it,
      id: `raw-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    }));
    const rawList = [...newItems, ...rawIngredients];
    const updatedRaw = recalculateRawIngredients(rawList);
    setRawIngredients(updatedRaw);
    setSheets(recalculateSheets(sheets, updatedRaw));
    setProductImportMessage('🔄 Atualização em Cadeia: Insumo adicionado e fichas técnicas recalculadas em tempo real!');
    setTimeout(() => setProductImportMessage(null), 5000);
  };

  const handleUpdateIngredient = (item: RawIngredientItem) => {
    const rawList = rawIngredients.map((r) => (r.id === item.id ? item : r));
    const updatedRaw = recalculateRawIngredients(rawList);
    setRawIngredients(updatedRaw);
    setSheets(recalculateSheets(sheets, updatedRaw));
    setProductImportMessage(`🔄 Atualização em Cadeia: Insumo "${item.name}" atualizado (R$ ${(item.unitPrice ?? 0).toFixed(2)}). Receitas e Fichas técnicas recalculadas instantaneamente!`);
    setTimeout(() => setProductImportMessage(null), 5000);
  };

  const handleDeleteIngredient = (id: string) => {
    const target = rawIngredients.find(r => r.id === id);
    const rawList = rawIngredients.filter((r) => r.id !== id);
    const updatedRaw = recalculateRawIngredients(rawList);
    setRawIngredients(updatedRaw);
    setSheets(recalculateSheets(sheets, updatedRaw));
    if (target) {
      setProductImportMessage(`⚠️ Insumo "${target.name}" removido e fichas técnicas atualizadas em cascata.`);
      setTimeout(() => setProductImportMessage(null), 5000);
    }
  };

  // Actions for Client Restaurants (Admin)
  const handleAddClient = (client: ClientRestaurant) => {
    setClients([client, ...clients]);
    setAdminStats((prev) => ({
      ...prev,
      totalSubscribers: prev.totalSubscribers + 1,
      activeSubscribers: prev.activeSubscribers + 1,
      mrr: prev.mrr + client.monthlyValue
    }));
  };

  const handleUpdateClientStatus = (id: string, status: ClientRestaurant['status']) => {
    setClients(clients.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  // Community actions
  const handleAddSuggestion = (newSug: CommunitySuggestion) => {
    setSuggestions([newSug, ...suggestions]);
  };

  const handleVoteSuggestion = (id: string) => {
    setSuggestions(
      suggestions.map((s) => {
        if (s.id === id) {
          const userVoted = !s.userVoted;
          return {
            ...s,
            votes: userVoted ? s.votes + 1 : s.votes - 1,
            userVoted
          };
        }
        return s;
      })
    );
  };

  const handleAdminUpdateStatus = (id: string, newStatus: CommunitySuggestion['status']) => {
    setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
  };

  const activeUserEmailRef = useRef<string | null>(currentUser?.email ? currentUser.email.trim().toLowerCase() : null);
  const exportPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // LOAD USER DATA ON CURRENT USER CHANGE (INDETERNIMATE PERMANENT STORAGE LINKED TO EMAIL)
  React.useEffect(() => {
    if (!currentUser?.email) {
      activeUserEmailRef.current = null;
      return;
    }

    const cleanEmail = currentUser.email.trim().toLowerCase();

    if (activeUserEmailRef.current !== cleanEmail) {
      const userData = getUserDataFromStorage(cleanEmail);
      if (userData) {
        if (userData.sheets) setSheets(userData.sheets);
        if (userData.rawIngredients) setRawIngredients(userData.rawIngredients);
        if (userData.fixedCosts) setFixedCosts(userData.fixedCosts);
        if (userData.variableCosts) setVariableCosts(userData.variableCosts);
        if (userData.appSettings) setAppSettings(userData.appSettings);
        if (userData.categoriesList) setCategoriesList(userData.categoriesList);
        if (userData.suggestions) setSuggestions(userData.suggestions);
      } else {
        const defaultData = {
          sheets: INITIAL_SHEETS,
          rawIngredients: INITIAL_RAW_INGREDIENTS,
          fixedCosts: INITIAL_FIXED_COSTS,
          variableCosts: INITIAL_VARIABLE_COSTS,
          appSettings: INITIAL_SETTINGS,
          categoriesList: ['Pizzas', 'Pratos Principais', 'Entradas', 'Sobremesas', 'Bebidas'],
          suggestions: INITIAL_SUGGESTIONS
        };
        try {
          localStorage.setItem(`basechef_data_${cleanEmail}`, JSON.stringify(defaultData));
        } catch (e) {}
        setSheets(INITIAL_SHEETS);
        setRawIngredients(INITIAL_RAW_INGREDIENTS);
        setFixedCosts(INITIAL_FIXED_COSTS);
        setVariableCosts(INITIAL_VARIABLE_COSTS);
        setAppSettings(INITIAL_SETTINGS);
        setCategoriesList(['Pizzas', 'Pratos Principais', 'Entradas', 'Sobremesas', 'Bebidas']);
        setSuggestions(INITIAL_SUGGESTIONS);
      }
      activeUserEmailRef.current = cleanEmail;
    }
  }, [currentUser]);

  // AUTO-SAVE USER DATA CONTINUOUSLY INDEFINITELY TO LOCALSTORAGE LINKED TO USER EMAIL
  React.useEffect(() => {
    if (!currentUser?.email) return;
    const cleanEmail = currentUser.email.trim().toLowerCase();

    if (activeUserEmailRef.current !== cleanEmail) return;

    const payload = {
      sheets,
      rawIngredients,
      fixedCosts,
      variableCosts,
      appSettings,
      categoriesList,
      suggestions
    };

    try {
      localStorage.setItem(`basechef_data_${cleanEmail}`, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving user data:', e);
    }

    // Envia (com debounce) o snapshot atual de fichas técnicas/insumos/custos/colaboradores
    // pro backend, que guarda em memória pra servir o painel de marketing (GRE Marketing) —
    // ver POST /api/export/push em server.ts. O backend ignora silenciosamente qualquer
    // e-mail diferente do configurado lá (EXPORT_OWNER_EMAIL), então isso não afeta outros
    // usuários.
    if (exportPushTimerRef.current) clearTimeout(exportPushTimerRef.current);
    exportPushTimerRef.current = setTimeout(() => {
      fetch('/api/export/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          sheets,
          insumos: rawIngredients,
          fixedCosts,
          variableCosts,
          appSettings: {
            defaultTaxRate: appSettings.defaultTaxRate,
            targetReturnMargin: appSettings.targetReturnMargin
          }
        })
      }).catch(() => {
        // Best-effort: se falhar, o próximo salvamento tenta de novo. Não afeta o uso do app.
      });
    }, 2000);
  }, [sheets, rawIngredients, fixedCosts, variableCosts, appSettings, categoriesList, suggestions, currentUser]);

  // Synchronized Settings and Fixed Costs Handlers (Indefinite Persistence & Global Propagation)
  const handleUpdateAppSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    if (newSettings.monthlyRevenue && newSettings.monthlyRevenue !== fixedCosts.monthlyRevenue) {
      setFixedCosts((prev) => ({
        ...prev,
        monthlyRevenue: newSettings.monthlyRevenue
      }));
    }
  };

  const handleUpdateFixedCosts = (newFixedCosts: FixedCostsData) => {
    setFixedCosts(newFixedCosts);
    if (newFixedCosts.monthlyRevenue && newFixedCosts.monthlyRevenue !== appSettings.monthlyRevenue) {
      setAppSettings((prev) => ({
        ...prev,
        monthlyRevenue: newFixedCosts.monthlyRevenue
      }));
    }
  };

  React.useEffect(() => {
    if (appSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings.theme]);

  const isDarkMode = appSettings.theme === 'dark';

  // --- STRICT AUTH & SUBSCRIPTION GUARD (SECURITY ENGINEER SPEC) ---
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => !!currentUser);

  React.useEffect(() => {
    let isMounted = true;

    async function verifyAuthAndSubscription() {
      if (!currentUser) {
        if (isMounted) setIsCheckingAuth(false);
        return;
      }

      const email = currentUser.email?.trim().toLowerCase();
      const isAdminUser = email === 'miguel@gmail.com' || currentUser.role === 'admin';
      const isPro = currentUser.licenseType === 'monthly' || currentUser.status_assinatura === 'ativo';
      
      const dataInicioRaw = currentUser.data_inicio || currentUser.createdAt;
      const dataInicioMs = dataInicioRaw
        ? (typeof dataInicioRaw === 'number' ? dataInicioRaw : new Date(dataInicioRaw).getTime())
        : Date.now();
      const validDataInicio = isNaN(dataInicioMs) ? Date.now() : dataInicioMs;
      const horasPassadas = (Date.now() - validDataInicio) / (1000 * 60 * 60);
      const isTrialActive = horasPassadas < 24;

      if (isAdminUser || isPro || currentUser.status_assinatura === 'ativo') {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/mercadopago/status?email=${encodeURIComponent(email || '')}`);
        if (!res.ok) {
          throw new Error('Falha na comunicação com o servidor de segurança.');
        }
        const data = await res.json();

        if (!isMounted) return;

        if (data.status === 'ativo') {
          const updated = {
            ...currentUser,
            status_assinatura: 'ativo' as const,
            mp_subscription_id: data.subscriptionId
          };
          setCurrentUser(updated);
          localStorage.setItem('basechef_current_user', JSON.stringify(updated));
        } else {
          if (!isTrialActive) {
            const updated = {
              ...currentUser,
              status_assinatura: data.status || 'pendente'
            };
            setCurrentUser(updated);
            localStorage.setItem('basechef_current_user', JSON.stringify(updated));
          }
        }
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Security verification error:', error);
        // Forçamento de Logout em Caso de Erro por segurança
        handleLogout();
        setIsCheckingAuth(false);
      }
    }

    verifyAuthAndSubscription();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email]);

  // SECURITY LOADING STATE: block protected content while verifying subscription status
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <p className="font-fredoka font-bold text-lg text-white">Margem de Chef</p>
          <p className="text-xs text-slate-400 font-mono">Verificando segurança, criptografia e status de assinatura...</p>
        </div>
      </div>
    );
  }

  // IF USER IS NOT LOGGED IN, RENDER AUTH SCREEN
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        whatsappNumber={appSettings.whatsappNumber || '5511999999999'}
        activationCodes={activationCodes}
        usersList={usersList}
      />
    );
  }

  return (
    <div className={`min-h-screen font-inter pb-24 selection:bg-[#1A1513] selection:text-white transition-colors duration-200 ${isDarkMode ? 'bg-[#121214] text-zinc-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* SIDEBAR NAVIGATION (FIXED) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewModal={handleOpenCreate}
        totalProductsCount={sheets.length}
        isAdmin={isAdmin}
        setIsAdmin={() => {}}
        currentUser={currentUser}
        onLogout={handleLogout}
        whatsappNumber={appSettings.whatsappNumber || '5511999999999'}
        showBuyButton={showBuyButton}
        onOpenPixModal={() => setIsPixModalOpen(true)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-64">
        <main className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-6 space-y-6">





          {/* TAB 0: PAINEL PRINCIPAL (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <DashboardTab
              sheets={sheets}
              rawIngredients={rawIngredients}
              appSettings={appSettings}
              fixedCosts={fixedCosts}
              variableCosts={variableCosts}
              onNavigateTab={setActiveTab}
              onOpenCreateProduct={handleOpenCreate}
            />
          )}

          {/* TAB 1: CADASTRO DE PRODUTOS (LISTAGEM & NOVO CADASTRO) */}
          {activeTab === 'fichas' && (
            <div className="space-y-6">
              
              {/* SEARCH & "NOVO CADASTRO DE PRODUTO" BUTTON */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                
                {/* SEARCH INPUT */}
                <div className="relative w-full sm:w-80">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do produto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 placeholder-slate-400"
                  />
                </div>

                {/* ACTION BUTTONS GROUP */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* SPEC 3.5: BOTÃO "NOVO CADASTRO DE PRODUTO" */}
                  <button
                    onClick={handleOpenCreate}
                    className="bg-[#2D201A] hover:bg-[#1A1513] text-white border border-[#4A352A] font-bold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus size={16} />
                    <span>Novo Cadastro de Produto</span>
                  </button>
                </div>

              </div>

              {/* SUCCESS PRODUCT IMPORT BANNER */}
              {productImportMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{productImportMessage}</span>
                </div>
              )}

              {/* PRODUCT CARDS LISTING */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSheets.map((sheet) => {
                  const isActive = sheet.isActive !== false;

                  return (
                  <div
                    key={sheet.id}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs group"
                  >

                      {/* HEADER WITH NAME, TYPE & ACTIVE STATUS */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <span className="bg-orange-100 text-orange-800 font-bold text-[10px] px-2 py-0.5 rounded-md border border-orange-200 uppercase inline-block">
                            {sheet.category}
                          </span>
                          <h3 className="text-sm font-black text-slate-900 break-words">
                            {sheet.name}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isActive ? '● Ativo' : '○ Inativo'}
                        </span>
                      </div>

                    {/* ACTION BUTTONS (IMPRIMIR, ALTERAR, CÓPIA/DUPLICAR, EXCLUSÃO) */}
                    <div className="pt-2 flex items-center justify-between gap-1 text-xs">
                      
                      <button
                        onClick={() => setPrintSheet(sheet)}
                        className="bg-[#2D201A] hover:bg-[#1A1513] text-white font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Imprimir Produto"
                      >
                        <Printer size={15} />
                        <span>Imprimir</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(sheet)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 rounded-xl transition-colors cursor-pointer"
                          title="Alterar Produto"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDuplicate(sheet)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 rounded-xl transition-colors cursor-pointer"
                          title="Duplicar Produto"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(sheet.id)}
                          className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold p-2 rounded-xl transition-colors cursor-pointer"
                          title="Excluir Produto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>

                  </div>
                  );
                })}
              </div>

              {filteredSheets.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <ChefHat size={48} className="mx-auto text-slate-400" />
                  <h3 className="text-lg font-bold text-slate-900">Nenhum produto cadastrado</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tente alterar a busca ou faça o cadastro de um novo produto.
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="bg-[#2D201A] hover:bg-[#1A1513] text-white border border-[#4A352A] font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus size={16} />
                    <span>Novo Cadastro de Produto</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: ITENS (SPEC 3.2) */}
          {activeTab === 'itens' && (
            <ItensReceitasTab
              mode="itens"
              ingredients={rawIngredients}
              onAddIngredient={handleAddIngredient}
              onUpdateIngredient={handleUpdateIngredient}
              onDeleteIngredient={handleDeleteIngredient}
            />
          )}

          {/* TAB 2B: RECEITAS BASE (SPEC 3.3) */}
          {activeTab === 'receitas' && (
            <ItensReceitasTab
              mode="receitas"
              ingredients={rawIngredients}
              onAddIngredient={handleAddIngredient}
              onUpdateIngredient={handleUpdateIngredient}
              onDeleteIngredient={handleDeleteIngredient}
            />
          )}

          {/* TAB 3: CUSTOS FIXOS */}
          {activeTab === 'custos-fixos' && (
            <CustosFixosTab
              data={fixedCosts}
              onChange={handleUpdateFixedCosts}
            />
          )}

          {/* TAB 4: CUSTOS VARIÁVEIS */}
          {activeTab === 'custos-variaveis' && (
            <CustosVariaveisTab
              data={variableCosts}
              onChange={setVariableCosts}
            />
          )}

          {/* TAB 5: RELATÓRIO DE PRECIFICAÇÃO (REBUILT CLEAN) */}
          {activeTab === 'precificacao' && (
            <PricingReportTab
              sheets={sheets}
              fixedCostPct={fixedCostPct}
              custoFixoPorPratoRS={custoFixoPorPratoRS}
              variableCostPct={variableCostPct}
              appSettings={appSettings}
              calculateSuggestedPrice={calculateSuggestedPrice}
              setPrintSheet={setPrintSheet}
              onEditSheet={handleOpenEdit}
            />
          )}

          {/* TAB: SIMULADOR DE CENÁRIOS & PREÇOS ⚡ NOVO */}
          {activeTab === 'simulador' && (
            <PriceSimulatorTab
              sheets={sheets}
              rawIngredients={rawIngredients}
              fixedCostPct={fixedCostPct}
              variableCostPct={variableCostPct}
              appSettings={appSettings}
              fixedCosts={fixedCosts}
              calculateSuggestedPrice={calculateSuggestedPrice}
              onBatchUpdatePrices={handleBatchUpdatePrices}
            />
          )}

          {/* TAB: PREÇO IFOOD ⭐ NOVO */}
          {activeTab === 'ifood' && (
            <IfoodPricingTab sheets={sheets} />
          )}

          {/* TAB: PREÇO 99FOOD 🚗 NOVO */}
          {activeTab === '99food' && (
            <NineninePricingTab sheets={sheets} />
          )}

          {/* TAB 6: COMUNIDADE (SPEC 3.9) */}
          {activeTab === 'comunidade' && (
            <CommunityTab
              suggestions={suggestions}
              news={news}
              helpArticles={helpArticles}
              changelog={changelog}
              onAddSuggestion={handleAddSuggestion}
              onVoteSuggestion={handleVoteSuggestion}
              onAdminUpdateStatus={handleAdminUpdateStatus}
            />
          )}

          {/* TAB 7: PAINEL ADMIN */}
          {activeTab === 'admin' && isAdmin && (
            <AdminTab
              stats={adminStats}
              clients={clients}
              suggestions={suggestions}
              news={news}
              activationCodes={activationCodes}
              onGenerateCode={handleGenerateCode}
              usersList={usersList}
              onUpdateUserLicense={handleUpdateUserLicense}
              onUpdateSuggestionStatus={handleAdminUpdateStatus}
              onAddNews={() => {}}
            />
          )}

          {/* TAB 8: CONFIGURAÇÕES */}
          {activeTab === 'configuracoes' && (
            <ConfiguracoesTab
              settings={appSettings}
              onChangeSettings={handleUpdateAppSettings}
              onLogout={handleLogout}
              currentUser={currentUser}
              onNavigateToSubscription={() => setActiveTab('assinatura')}
              onResetAllData={handleResetAllData}
            />
          )}

          {/* TAB 9: MINHA ASSINATURA MERCADO PAGO */}
          {activeTab === 'assinatura' && (
            <SubscriptionTab
              currentUser={currentUser}
              onUpdateUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem('basechef_current_user', JSON.stringify(updated));
              }}
            />
          )}

          {/* GLOBAL FOOTER WITH ASSINAR PLANO / PAGAMENTO BUTTON */}
          <footer className="mt-16 pt-8 pb-12 border-t border-slate-200 text-center text-xs text-slate-500 space-y-4 no-print">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto px-4">
              <div>
                <p className="font-bold text-slate-700">Margem de Chef • Sistema Profissional de Precificação</p>
                <p className="text-slate-400 mt-0.5">Ambiente seguro integrado com Mercado Pago</p>
              </div>
              {currentUser?.status_assinatura === 'ativo' ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Plano Profissional Ativo (Assinatura Garantida)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGlobalCheckoutOpen(true)}
                  className="bg-[#009ee3] hover:bg-[#0082be] text-white font-fredoka font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles size={16} className="text-amber-200" />
                  <span>💳 Assinar Plano / Pagamento (R$ 49,90)</span>
                </button>
              )}
            </div>
          </footer>

        </main>
      </div>

      {/* SUBSCRIPTION BARRIER MODAL (MERCADO PAGO RECURRING SUBSCRIPTION GUARD) */}
      {currentUser && 
       currentUser.role !== 'admin' && 
       currentUser.email?.trim().toLowerCase() !== 'miguel@gmail.com' && 
       currentUser.status_assinatura !== 'ativo' && 
       (() => {
         const dataInicioRaw = currentUser.data_inicio || currentUser.createdAt;
         const dataInicioMs = dataInicioRaw ? (typeof dataInicioRaw === 'number' ? dataInicioRaw : new Date(dataInicioRaw).getTime()) : Date.now();
         const validDataInicio = isNaN(dataInicioMs) ? Date.now() : dataInicioMs;
         const horasPassadas = (Date.now() - validDataInicio) / (1000 * 60 * 60);
         return horasPassadas >= 24; // Only show barrier if trial expired and subscription is not active
       })() && (
        <SubscriptionBarrierModal
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('basechef_current_user', JSON.stringify(updated));
          }}
          onLogout={handleLogout}
        />
      )}

      {/* FIXED BOTTOM SYSTEM BUY ACCESS BAR (VISIBLE ONLY IN TRIAL / TEST PHASE) */}
      {showBuyButton && (
        <div className="no-print fixed bottom-0 left-0 right-0 z-30 lg:pl-64 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-white shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-fredoka font-bold text-xs sm:text-sm text-white block leading-tight">
                  Margem de Chef Pro
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Teste 24h Ativo
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Assine o Plano Profissional e libere todos os recursos sem limites!
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('assinatura')}
            className="bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Sparkles size={16} className="text-amber-200" />
            <span>Assinar Plano Mensal (R$ 49,90)</span>
          </button>
        </div>
      )}

      {/* PIX PAYMENT MODAL */}
      {currentUser && (
        <PixPaymentModal
          user={currentUser}
          isOpen={isPixModalOpen}
          onClose={() => setIsPixModalOpen(false)}
          onLogout={handleLogout}
          onPaymentConfirmed={() => {
            handleLifetimeLicenseConfirmed();
            setIsPixModalOpen(false);
          }}
        />
      )}

      {/* LICENSE EXPIRED BARRIER MODAL — escondido enquanto o PixPaymentModal está aberto: os dois usam
          fixed inset-0 com o mesmo z-index, e como este vem depois no JSX ele sempre ficaria por cima,
          tornando o botão "Pagar via PIX Automático" clicável mas visualmente inacessível. */}
      {isLicenseExpired && currentUser && !isPixModalOpen && (
        <LicenseBarrierModal
          user={currentUser}
          onActivateCode={handleActivateCode}
          onLogout={handleLogout}
          onOpenPixModal={() => setIsPixModalOpen(true)}
        />
      )}

      {/* FLOATING CHEFINHO AI MASCOT */}
      <ChefinhoMascot 
        sheets={sheets} 
        rawIngredients={rawIngredients}
        fixedCosts={fixedCosts}
        variableCosts={variableCosts}
        currentUser={currentUser} 
      />

      {/* PRINT MODAL FOR KITCHEN WALL */}
      {printSheet && (
        <PrintSheetModal
          sheet={printSheet}
          onClose={() => setPrintSheet(null)}
        />
      )}

      {/* PRODUCT FORM MODAL FOR CREATE/EDIT */}
      {isFormOpen && (
        <ProductFormModal
          initialSheet={editingSheet}
          onClose={() => {
            setIsFormOpen(false);
            setEditingSheet(null);
          }}
          onSave={handleSaveProduct}
          existingCount={sheets.length}
          availableItems={rawIngredients}
          availableRecipes={sheets}
          categoriesList={categoriesList}
          onAddCategory={handleAddCategory}
          fixedCostPct={fixedCostPct}
          variableCostPct={variableCostPct}
          taxRate={appSettings.defaultTaxRate || 6.0}
          targetMargin={appSettings.targetReturnMargin || 20.0}
          calculateSuggestedPrice={calculateSuggestedPrice}
        />
      )}

      {/* GLOBAL CREDIT CARD CHECKOUT MODAL */}
      <CreditCardCheckoutModal
        isOpen={isGlobalCheckoutOpen}
        onClose={() => setIsGlobalCheckoutOpen(false)}
        currentUser={currentUser}
        onSuccess={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem('basechef_current_user', JSON.stringify(updated));
          setIsGlobalCheckoutOpen(false);
        }}
      />

    </div>
  );
}

export default App;
