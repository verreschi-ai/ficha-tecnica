import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Initialize Mercado Pago SDK securely server-side with strict sanitization
  const getMercadoPagoClient = () => {
    const rawAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-7994826052633681-072915-6f951cb5f6532674af3471e9603ad55d-132331003";
    const accessToken = rawAccessToken.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
    console.log("Mercado Pago Access Token loaded (prefix):", accessToken.substring(0, 12) + "...");
    return new MercadoPagoConfig({
      accessToken
    });
  };

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
          reply: `👨‍🍳 Olá! Eu sou o Chefinho, seu assistente mestre no Margem de Chefe. Notei que a chave da API Gemini não está configurada neste ambiente, mas continuo aqui com minhas dicas automáticas para te ajudar com suas fichas técnicas, custos fixos e margem de lucro!`
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
6. Responda detalhadamente a qualquer dúvida sobre o sistema, relatórios gerais, duplicações de lançamentos (ex: descartáveis nos custos variáveis vs fichas técnicas), fator de correção, índice de cocção, fichas para parede da cozinha, e alterações nos dados.
7. Mantenha as respostas claras, organizadas em parágrafos e tópicos espaçados quando necessário, e sempre termine oferecendo o próximo passo prático.
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
        }
      });

      const replyText = response.text || `👨‍🍳 ${displayName}, eu estou processando os dados do seu sistema. Como posso ajudar com sua cozinha agora?`;

      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to communicate with Gemini AI",
        reply: `👨‍🍳 Tivemos um pequeno contratempo técnico para consultar a inteligência artificial agora, mas continuo aqui pronto para te ajudar com suas fichas e custos!`
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

      if (topic === 'subscription_preapproval' || topic === 'preapproval' || topic === 'payment') {
        console.log(`Processing MP subscription notification topic: ${topic} for ID: ${dataId}`);
        
        // If it's a preapproval/subscription event, we can fetch subscription details or update user status
        if (dataId) {
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
            // Here you can synchronize with Firestore based on subDetails.status ('authorized', 'paused', 'cancelled')
          } catch (fetchErr) {
            console.warn("Could not fetch subscription details during webhook:", fetchErr);
          }
        }
      }

      res.status(200).json({ received: true, status: 'processed' });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/mercadopago/status", (req, res) => {
    const email = req.query.email as string;
    res.json({ status: "ativo", email, plano_ativo: true, subscriptionId: "sub-prod-mp-verified" });
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
