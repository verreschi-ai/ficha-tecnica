import fs from "fs";
import path from "path";

// Persistência simples em arquivo local do status de assinatura por e-mail, alimentada
// pelo webhook do Mercado Pago (e pela criação de assinatura). Existe para que o endpoint
// /api/mercadopago/status não dependa só de uma consulta ao vivo ao Mercado Pago a cada
// verificação — o webhook, que já recebe a confirmação em tempo real, agora grava esse
// resultado em vez de só logar e descartar.
export interface StoredSubscription {
  email: string;
  status: string; // 'authorized' | 'pending' | 'paused' | 'cancelled' | ...
  subscriptionId: string | null;
  updatedAt: string; // ISO timestamp
}

const STORE_PATH = path.join(process.cwd(), "data", "subscriptions.json");

function readAll(): Record<string, StoredSubscription> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StoredSubscription>) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[subscriptionStore] Falha ao gravar data/subscriptions.json:", err);
  }
}

export function getStoredSubscription(email: string): StoredSubscription | null {
  const clean = (email || "").trim().toLowerCase();
  if (!clean) return null;
  const all = readAll();
  return all[clean] || null;
}

export function saveSubscriptionStatus(email: string | undefined | null, status: string, subscriptionId: string | number | null | undefined) {
  const clean = (email || "").trim().toLowerCase();
  if (!clean) {
    console.warn("[subscriptionStore] Ignorando gravação: nenhum e-mail de pagador associado ao evento.");
    return;
  }

  const all = readAll();
  all[clean] = {
    email: clean,
    status,
    subscriptionId: subscriptionId != null ? String(subscriptionId) : null,
    updatedAt: new Date().toISOString()
  };
  writeAll(all);
  console.log(`[subscriptionStore] ${clean} -> status "${status}" (assinatura ${subscriptionId ?? "n/a"})`);
}
