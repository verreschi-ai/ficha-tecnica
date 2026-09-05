import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { getStoredSubscription, saveSubscriptionStatus } from "./subscriptionStore";
import type { RawIngredientItem, TechnicalSheet } from "./src/types";

// Rate limiter simples em memória, por IP — sem dependência nova. Existe para conter dois
// abusos possíveis em rotas sem autenticação: varrer e-mails alheios em /mercadopago/status
// e criar pagamentos PIX reais em massa em /create-pix-payment. Não substitui autenticação de
// verdade (esse app não tem sessão de servidor), mas encarece bastante o abuso automatizado.
const rateLimitBuckets = new Map<string, number[]>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const timestamps = (rateLimitBuckets.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em alguns minutos.' });
    }

    timestamps.push(now);
    rateLimitBuckets.set(key, timestamps);
    next();
  };
}

async function startServer() {
  const app = express();
  // Hospedagens como Render/Railway/Cloud Run atribuem a porta dinamicamente via $PORT —
  // escutar numa porta fixa faz o deploy nunca ficar "healthy" nesses ambientes.
  const PORT = Number(process.env.PORT) || 3000;

  // Confia no proxy do Render/Cloudflare para que req.ip reflita o IP real do visitante
  // (senão todo mundo cai no mesmo IP interno do proxy e o rate limit vira inútil).
  app.set('trust proxy', 1);

  // Headers de segurança básicos. Sem CSP de propósito: esse app carrega Google Fonts,
  // o SDK do Mercado Pago e imagens do Unsplash de origens externas, e uma CSP genérica
  // quebraria esses recursos sem um mapeamento cuidadoso de cada origem permitida.
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  // Preço e marcador da Licença Vitalícia (pagamento único via PIX). O prefixo no
  // external_reference é o que permite reconhecer, no webhook e no polling, que um
  // pagamento aprovado é ESSA compra específica — e não outra cobrança qualquer.
  const LIFETIME_LICENSE_PRICE = 89.90;
  const LIFETIME_REFERENCE_PREFIX = 'lifetime-license_';

  // Initialize Mercado Pago SDK securely server-side with strict sanitization.
  // NUNCA usar um token de fallback hardcoded aqui: um access token é uma credencial secreta
  // (autoriza criar cobranças e ler assinaturas de qualquer cliente) e precisa vir só do ambiente.
  const getMercadoPagoClient = () => {
    const rawAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!rawAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente do servidor.');
    }
    const accessToken = rawAccessToken.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
    console.log("Mercado Pago Access Token loaded (prefix):", accessToken.substring(0, 12) + "...");
    return new MercadoPagoConfig({
      accessToken
    });
  };

  // Cache em memória do snapshot mais recente de fichas técnicas + insumos, alimentado pelo
  // próprio front-end (POST /api/export/push, chamado sempre que o usuário salva algo) e servido
  // pro painel de marketing (GET /api/export/summary). Não usa Firestore: os dados reais do app
  // vivem só no localStorage do navegador do usuário (o código de sincronização com o Firestore
  // em src/services/firebaseService.ts nunca chegou a ser ligado em lugar nenhum do app, e as
  // variáveis VITE_FIREBASE_* nem estão configuradas no Render), então a única fonte confiável é
  // o próprio front-end enviando o que tem em mãos. Some a cada reinício do servidor (Render free
  // tier reinicia em cada deploy e após ociosidade) — se reconstrói sozinho na próxima vez que
  // alguém abrir o app, o que é suficiente aqui já que só alimenta o resumo que a Ana comenta.
  let exportCache: { sheets: TechnicalSheet[]; insumos: RawIngredientItem[]; updatedAt: string } | null = null;

  // Initialize Gemini AI client server-side
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API endpoint for Chefinho AI chat powered by Gemini
  app.post("/api/gemini-chat", async (req, res) => {
    try {
      const { message, history = [], sheets = [], rawIngredients = [], fixedCosts, variableCosts, currentUser, aiModel } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          reply: `👨‍🍳 IA ainda não configurada aqui, mas posso te ajudar com dicas rápidas sobre fichas técnicas, custos e margem de lucro!`
        });
      }

      const displayName = currentUser && currentUser.name ? currentUser.name : 'Chefe';
      const modelToUse = aiModel && aiModel.includes('pro') ? 'gemini-3.6-pro' : 'gemini-3.6-flash';

      // Summarize app state for context
      const totalSheets = sheets.length;
      const avgCMV = totalSheets > 0 ? (sheets.reduce((acc: number, curr: any) => acc + (curr.cmv || 0), 0) / totalSheets).toFixed(1) : '0';
      const avgMargin = totalSheets > 0 ? (sheets.reduce((acc: number, curr: any) => acc + (curr.margin || 0), 0) / totalSheets).toFixed(1) : '0';
      const totalInsumos = rawIngredients.length;
      const totalFixed = fixedCosts?.fixedExpenses?.reduce((acc: number, f: any) => acc + (f.amount || 0), 0) || 0;
      const totalEmployees = fixedCosts?.employees?.length || 0;

      const systemInstruction = `
Você é o "Chefinho", um assistente de inteligência artificial mestre, especialista em gestão gastronômica, fichas técnicas, precificação (CMV), fator de correção e controle de custos para restaurantes, pizzarias e confeitarias.
Você está conversando diretamente com o usuário do aplicativo "Margem de Chefe". O nome do usuário é ${displayName}.

DIRETRIZES DE PERSONALIDADE E TOM DE VOZ:
1. Fale SEMPRE em primeira pessoa ("eu posso ajudar", "eu consigo fazer junto com você", "vamos passo a passo", "eu calculo", "eu te ajudo").
2. Seja um amigo especialista e acolhedor, com um tom de conversa pausado, humano, didático e amigável (como um chef mentor experiente conversando com um colega na cozinha).
3. NUNCA utilize símbolos matemáticos que possam confundir o usuário como maior que (>), menor que (<), diferente (!=) ou equivalentes. Sempre escreva por extenso ("maior que", "menor que", "por cento", "diferente").
4. NUNCA utilize asteriscos duplos (**) para negrito. No lugar de **destaques**, utilize parágrafos e quebras de linha normais para estruturar o texto em formato de conversa amigável.
5. Você tem acesso completo aos dados atuais do sistema do usuário:
   - Fichas Técnicas cadastradas: ${totalSheets} prato(s).
   - CMV Médio: ${avgCMV} por cento.
   - Margem de Lucro Média: ${avgMargin} por cento.
   - Insumos no estoque: ${totalInsumos} item(ns).
   - Despesas Fixas Mensais: R$ ${totalFixed.toFixed(2)}.
   - Colaboradores cadastrados: ${totalEmployees}.
6. Responda a qualquer dúvida sobre o sistema, relatórios gerais, duplicações de lançamentos (ex: descartáveis nos custos variáveis vs fichas técnicas), fator de correção, índice de cocção, fichas para parede da cozinha, e alterações nos dados.
7. SEJA BREVE. No máximo 3 a 4 frases curtas (ou uma lista bem enxuta de até 3 itens) por resposta. Vá direto ao ponto, sem introdução longa nem repetir o que o usuário perguntou. Só detalhe mais se o usuário pedir explicitamente "mais detalhes" ou "explica melhor".
8. Termine com no máximo uma pergunta ou próximo passo prático — não empilhe várias perguntas.
      `;

      // Build chat contents from history + current message
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      
      if (Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.sender === 'chefinho' ? 'model' : 'user',
            parts: [{ text: h.text }]
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents,
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          temperature: 0.7,
          // Teto de tokens: força respostas curtas e reduz o tempo de geração (menos texto pra gerar = mais rápido).
          maxOutputTokens: 350,
        }
      });

      const replyText = response.text || `👨‍🍳 ${displayName}, eu estou processando os dados do seu sistema. Como posso ajudar com sua cozinha agora?`;

      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to communicate with Gemini AI",
        reply: `👨‍🍳 Tive um problema técnico agora. Pode tentar de novo?`
      });
    }
  });

  // --- MERCADO PAGO PRODUCTION WEBHOOK & SUBSCRIPTION ENDPOINTS ---
  app.post("/api/mercadopago/webhook", async (req, res) => {
    try {
      const signature = req.headers['x-signature'];
      const requestId = req.headers['x-request-id'];
      
      console.log("Mercado Pago Subscription Webhook received:", {
        signature,
        requestId,
        body: req.body
      });

      const notification = req.body;
      const topic = notification?.type || notification?.topic;
      const dataId = notification?.data?.id || notification?.id;

      if ((topic === 'subscription_preapproval' || topic === 'preapproval') && dataId) {
        console.log(`Processing MP subscription notification topic: ${topic} for ID: ${dataId}`);

        // Busca o estado atual da assinatura (preapproval) e PERSISTE — é a fonte confiável de
        // "esse e-mail tem assinatura recorrente ativa?" usada por /api/mercadopago/status.
        try {
          const client = getMercadoPagoClient();
          const preApproval = new PreApproval(client);
          const subDetails = await preApproval.get({ id: dataId });
          console.log("Subscription details fetched from MP:", {
            id: subDetails.id,
            status: subDetails.status,
            payer_email: subDetails.payer_email,
            external_reference: subDetails.external_reference
          });

          if (subDetails.payer_email && subDetails.status) {
            saveSubscriptionStatus(subDetails.payer_email, subDetails.status, subDetails.id);
          } else {
            console.warn("Webhook de preapproval sem payer_email ou status utilizável; nada foi persistido.", { id: dataId });
          }
        } catch (fetchErr) {
          console.warn("Could not fetch subscription details during webhook:", fetchErr);
        }
      } else if (topic === 'payment' && dataId) {
        // Eventos de 'payment' representam cobranças individuais. A maioria (cobranças
        // recorrentes de uma assinatura já autorizada) é só informativa aqui — quem decide
        // 'authorized'/'cancelled' da assinatura é sempre o evento de preapproval acima.
        // A EXCEÇÃO é a Licença Vitalícia via PIX: como é pagamento único (não tem preapproval),
        // é este evento que confirma a compra e libera o acesso permanente.
        console.log(`Received MP payment notification for ID: ${dataId}`);
        try {
          const client = getMercadoPagoClient();
          const payment = new Payment(client);
          const paymentDetails = await payment.get({ id: dataId });

          const isLifetimePurchase = !!paymentDetails.external_reference?.startsWith(LIFETIME_REFERENCE_PREFIX);
          const amountMatches = Number(paymentDetails.transaction_amount) === LIFETIME_LICENSE_PRICE;

          if (isLifetimePurchase && paymentDetails.status === 'approved' && paymentDetails.payer?.email && amountMatches) {
            saveSubscriptionStatus(paymentDetails.payer.email, 'lifetime', paymentDetails.id);
          } else {
            console.log(`Payment ${dataId} não persistido como Licença Vitalícia (status=${paymentDetails.status}, isLifetimePurchase=${isLifetimePurchase}, amountMatches=${amountMatches}).`);
          }
        } catch (fetchErr) {
          console.warn("Could not fetch payment details during webhook:", fetchErr);
        }
      }

      res.status(200).json({ received: true, status: 'processed' });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Verifica de verdade no Mercado Pago se o e-mail tem uma assinatura (PreApproval) autorizada.
  // Antes este endpoint devolvia "ativo" fixo para qualquer e-mail, liberando o app pago de graça
  // para todo mundo — a checagem no App.tsx confiava cegamente nessa resposta.
  // Limite generoso: uso normal chama isso 1x por sessão/troca de usuário, não em loop.
  app.get("/api/mercadopago/status", rateLimit(15, 5 * 60 * 1000), async (req, res) => {
    const email = (req.query.email as string || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ status: 'pendente', plano_ativo: false, error: 'E-mail é obrigatório para verificar a assinatura.' });
    }

    // 1. Caminho rápido: status já persistido pelo webhook (não depende de nova chamada ao MP).
    // 'authorized' = assinatura mensal recorrente ativa; 'lifetime' = Licença Vitalícia paga via PIX.
    const cached = getStoredSubscription(email);
    if (cached) {
      const cachedIsActive = cached.status === 'authorized' || cached.status === 'lifetime';
      return res.json({
        status: cachedIsActive ? 'ativo' : cached.status,
        email,
        plano_ativo: cachedIsActive,
        subscriptionId: cached.subscriptionId,
        source: 'cache',
        updatedAt: cached.updatedAt
      });
    }

    // 2. Sem registro local ainda (ex.: primeira verificação antes de qualquer webhook chegar):
    // consulta ao vivo no Mercado Pago e, se encontrar algo, já alimenta o cache para a próxima vez.
    try {
      const client = getMercadoPagoClient();
      const preApproval = new PreApproval(client);

      const searchResult = await preApproval.search({
        options: { payer_email: email }
      });

      const subscriptions = searchResult?.results || [];
      // 'authorized' é o único status do PreApproval que representa uma assinatura recorrente ativa.
      const activeSubscription = subscriptions.find((s) => s.status === 'authorized');

      if (activeSubscription) {
        saveSubscriptionStatus(email, activeSubscription.status || 'authorized', activeSubscription.id);
        return res.json({
          status: 'ativo',
          email,
          plano_ativo: true,
          subscriptionId: activeSubscription.id,
          source: 'live'
        });
      }

      // Sem assinatura autorizada: devolve o status mais recente encontrado (pending, paused, cancelled...)
      // ou 'nenhuma' se o e-mail nunca teve nenhuma assinatura no Mercado Pago.
      const mostRecent = subscriptions[0];
      if (mostRecent) {
        saveSubscriptionStatus(email, mostRecent.status || 'pendente', mostRecent.id);
      }
      return res.json({
        status: mostRecent ? (mostRecent.status || 'pendente') : 'nenhuma',
        email,
        plano_ativo: false,
        subscriptionId: mostRecent?.id || null,
        source: 'live'
      });
    } catch (error: any) {
      console.error("Mercado Pago subscription status check error:", error);
      // Falha ao consultar o Mercado Pago: NÃO libera acesso (fail-closed). Devolve 200 com status
      // não-ativo em vez de 5xx para não forçar logout imediato do usuário por uma falha transitória.
      return res.json({
        status: 'pendente',
        email,
        plano_ativo: false,
        error: 'Não foi possível verificar a assinatura no Mercado Pago no momento.'
      });
    }
  });

  // Gera um pagamento PIX real via Mercado Pago para a Licença Vitalícia (pagamento único).
  // Substitui o fluxo antigo, que chamava um Google Apps Script externo e caía para um
  // código PIX ESTÁTICO hardcoded apontando para a chave pessoal de terceiro (miguel@gmail.com)
  // quando esse script falhava — ninguém verificava o pagamento, e o dinheiro nem ia para a conta certa.
  // Limite apertado: cada chamada cria uma cobrança PIX real no Mercado Pago da conta.
  app.post("/api/mercadopago/create-pix-payment", rateLimit(3, 10 * 60 * 1000), async (req, res) => {
    try {
      const email = (req.body?.email || '').trim().toLowerCase();
      const name = (req.body?.name || '').trim();

      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório para gerar o pagamento PIX.' });
      }

      const client = getMercadoPagoClient();
      const payment = new Payment(client);

      const result = await payment.create({
        body: {
          transaction_amount: LIFETIME_LICENSE_PRICE,
          description: 'Licença Vitalícia - Margem de Chef',
          payment_method_id: 'pix',
          payer: {
            email,
            first_name: name ? name.split(' ')[0] : undefined
          },
          external_reference: `${LIFETIME_REFERENCE_PREFIX}${email}`
        }
      });

      const txData = result.point_of_interaction?.transaction_data;
      if (!txData?.qr_code) {
        throw new Error('Mercado Pago não retornou os dados do QR Code PIX.');
      }

      res.json({
        paymentId: result.id,
        status: result.status,
        amount: result.transaction_amount,
        qrCode: txData.qr_code,
        qrCodeBase64: txData.qr_code_base64
      });
    } catch (error: any) {
      console.error("Erro ao criar pagamento PIX:", error);
      res.status(500).json({ error: error.message || 'Não foi possível gerar o PIX agora. Tente novamente em instantes ou fale com o suporte.' });
    }
  });

  // Consulta o status de um pagamento PIX específico (usado pelo polling do modal de pagamento).
  // Quando aprovado E identificado como a Licença Vitalícia (pelo external_reference), persiste
  // o status 'lifetime' no mesmo cache usado por /api/mercadopago/status — não depende só do
  // webhook chegar, o que importa caso ele não esteja configurado no painel do Mercado Pago.
  // Limite folgado: o modal do PIX faz polling automático a cada 5s (~12/min) enquanto aberto,
  // então precisa de espaço pra isso mais os cliques manuais em "Já paguei, verificar agora".
  app.get("/api/mercadopago/payment-status/:id", rateLimit(60, 5 * 60 * 1000), async (req, res) => {
    try {
      const client = getMercadoPagoClient();
      const payment = new Payment(client);
      const result = await payment.get({ id: req.params.id });

      const isLifetimePurchase = !!result.external_reference?.startsWith(LIFETIME_REFERENCE_PREFIX);
      if (isLifetimePurchase && result.status === 'approved' && result.payer?.email) {
        saveSubscriptionStatus(result.payer.email, 'lifetime', result.id);
      }

      res.json({ status: result.status, id: result.id });
    } catch (error: any) {
      console.error("Erro ao consultar status do pagamento PIX:", error);
      res.status(500).json({ error: 'Não foi possível consultar o status do pagamento no momento.' });
    }
  });

  // Securely provide public key to frontend with strict sanitization and fallback
  app.get("/api/mercadopago/public-key", (req, res) => {
    const rawPublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || "APP_USR-89390b89-0d0f-4a30-9594-b01022eac138";
    const publicKey = rawPublicKey.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
    res.json({ publicKey });
  });

  // Process monthly recurring subscription via Mercado Pago PreApproval SDK
  app.post("/api/process_payment", async (req, res) => {
    try {
      console.log("Received /api/process_payment request body:", req.body);
      const { token, description, payer } = req.body;
      const transaction_amount = Number(req.body.transaction_amount) > 0 ? Number(req.body.transaction_amount) : 49.90;

      if (!token || !payer?.email) {
        return res.status(400).json({ 
          error: "Campos obrigatórios ausentes para a assinatura (token, payer.email)." 
        });
      }

      const client = getMercadoPagoClient();
      const preApproval = new PreApproval(client);

      const subscriptionBody = {
        reason: description || "Assinatura Mensal Pro - Margem de Chef (R$ 49,90)",
        external_reference: `sub_${payer.email}_${Date.now()}`,
        payer_email: payer.email,
        card_token_id: token,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(transaction_amount),
          currency_id: "BRL"
        },
        status: "authorized",
        back_url: "https://margem.basechef.com.br"
      };

      console.log("Processing Mercado Pago monthly subscription request:", {
        amount: subscriptionBody.auto_recurring.transaction_amount,
        email: subscriptionBody.payer_email,
        frequency: "1 month"
      });

      const response = await preApproval.create({ body: subscriptionBody });
      
      console.log("Mercado Pago subscription response status:", response.id, response.status);

      if (response.status === 'authorized' || response.status === 'active' || response.status === 'pending') {
        saveSubscriptionStatus(payer.email, response.status, response.id);
        return res.json({
          success: true, 
          status: response.status,
          subscriptionId: response.id,
          plano_ativo: true,
          isPremium: true,
          subscription_status: response.status,
          status_assinatura: 'ativo',
          message: "Assinatura mensal autorizada e ativada com sucesso!" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          status: response.status,
          error: `Assinatura não autorizada (${response.status}).` 
        });
      }
    } catch (error: any) {
      console.error("Mercado Pago subscription error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Falha ao processar assinatura mensal no Mercado Pago." 
      });
    }
  });

  // Recebe do próprio front-end (chamado sempre que sheets/insumos mudam, ver src/App.tsx) o
  // snapshot atual de fichas técnicas + insumos do usuário logado, pra guardar em exportCache.
  // Só aceita o e-mail configurado em EXPORT_OWNER_ID_EMAIL (o dono do painel de marketing) —
  // outros usuários do "Margem de Chefe" que passarem por aqui são silenciosamente ignorados,
  // pra nunca vazar ou sobrescrever o cache com dados de outro cliente.
  app.post("/api/export/push", rateLimit(60, 5 * 60 * 1000), (req, res) => {
    const ownerEmail = process.env.EXPORT_OWNER_EMAIL;
    if (!ownerEmail) return res.status(204).send();

    const email = String(req.body?.email || "").trim().toLowerCase();
    if (email !== ownerEmail.trim().toLowerCase()) return res.status(204).send();

    const sheets = Array.isArray(req.body?.sheets) ? req.body.sheets : [];
    const insumos = Array.isArray(req.body?.insumos) ? req.body.insumos : [];
    // Um cardápio real não chega perto disso — só um teto pra não deixar a memória do
    // processo crescer sem limite com um payload malformado ou malicioso.
    if (sheets.length > 1000 || insumos.length > 5000) {
      return res.status(413).json({ error: "Quantidade de itens acima do esperado." });
    }

    exportCache = { sheets, insumos, updatedAt: new Date().toISOString() };
    res.status(204).send();
  });

  // Exporta um resumo somente-leitura das fichas técnicas e insumos (o último snapshot
  // recebido via POST /api/export/push) para o painel de marketing (GRE Marketing/Don
  // Giovanni) consumir e a IA de lá comentar sobre CMV e margem. Protegido por um token
  // compartilhado — só quem tiver o mesmo EXPORT_API_TOKEN configurado lá consegue ler.
  app.get("/api/export/summary", rateLimit(30, 5 * 60 * 1000), (req, res) => {
    const expectedToken = process.env.EXPORT_API_TOKEN;
    if (!expectedToken) {
      return res.status(503).json({ error: "Exportação não configurada no servidor (EXPORT_API_TOKEN)." });
    }
    const providedToken = String(req.header("x-export-token") || "").trim();
    if (!providedToken || providedToken !== expectedToken) {
      return res.status(401).json({ error: "Token de exportação inválido." });
    }

    if (!exportCache) {
      return res.status(503).json({
        error:
          "Ainda não chegou nenhum dado sincronizado. Abra o app da Ficha Técnica e navegue por ele uma vez pra iniciar a sincronização.",
      });
    }

    const sheets = exportCache.sheets.map((r) => ({
      id: String(r.id),
      code: String(r.code ?? ""),
      name: String(r.name ?? ""),
      category: String(r.category ?? ""),
      isActive: r.isActive !== false,
      sellingPrice: Number(r.sellingPrice) || 0,
      costPerPortion: Number(r.costPerPortion) || 0,
      totalRecipeCost: Number(r.totalRecipeCost) || 0,
      cmv: Number(r.cmv) || 0,
      margin: Number(r.margin) || 0,
      status: String(r.status ?? "ideal"),
    }));

    const insumos = exportCache.insumos.map((i) => ({
      id: String(i.id),
      name: String(i.name ?? ""),
      unit: String(i.unit ?? ""),
      unitPrice: Number(i.unitPrice) || 0,
      category: String(i.category ?? ""),
      supplier: String(i.supplier ?? ""),
    }));

    const activeSheets = sheets.filter((s) => s.isActive);
    const avgCmv = activeSheets.length
      ? activeSheets.reduce((acc, s) => acc + s.cmv, 0) / activeSheets.length
      : 0;
    const avgMargin = activeSheets.length
      ? activeSheets.reduce((acc, s) => acc + s.margin, 0) / activeSheets.length
      : 0;

    res.json({
      generatedAt: exportCache.updatedAt,
      totalSheets: sheets.length,
      avgCmv,
      avgMargin,
      sheets,
      totalInsumos: insumos.length,
      insumos,
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
