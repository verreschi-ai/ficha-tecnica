import { auth } from './firebaseService';
import type { ItemDoEstoque } from '../utils/estoqueSync';

// Ligação com o app de estoque da Don Giovanni. Só funciona na conta da loja: o servidor daqui
// confirma o e-mail (EXPORT_OWNER_EMAIL) e o estoque confere o login Firebase de novo do lado dele.
// Para qualquer outro cliente nada aparece e nada é enviado.

const env = (import.meta as any).env || {};
export const ESTOQUE_URL: string = String(env.VITE_ESTOQUE_URL || 'https://controle-estoque-compras.vercel.app').replace(/\/+$/, '');

const CHAVE = 'basechef_conta_loja';

// A conta logada é a da loja? Pergunta ao servidor daqui uma vez por sessão do navegador.
export async function ehContaDaLoja(email: string): Promise<boolean> {
  const limpo = email.trim().toLowerCase();
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    if (salvo === `sim:${limpo}`) return true;
    if (salvo === `nao:${limpo}`) return false;
  } catch {
    // sem armazenamento: só pergunta de novo
  }
  try {
    const r = await fetch(`/api/estoque/dono?email=${encodeURIComponent(limpo)}`);
    const j = r.ok ? await r.json() : { dono: false };
    const dono = j?.dono === true;
    try {
      sessionStorage.setItem(CHAVE, `${dono ? 'sim' : 'nao'}:${limpo}`);
    } catch {
      // idem
    }
    return dono;
  } catch {
    return false;
  }
}

async function cabecalhos(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Faça login de novo no Ficha Técnica para falar com o estoque.');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function erroDe(r: Response): Promise<Error> {
  const j = await r.json().catch(() => ({}));
  return new Error(j?.erro || `O estoque respondeu ${r.status}.`);
}

// Ficha → estoque: manda os insumos (só id, nome, unidade, categoria e se é receita). Itens novos entram lá.
export async function enviarInsumosAoEstoque(
  insumos: { id: string; name: string; unit: string; category?: string; isRecipe?: boolean; lastUpdated?: string }[]
): Promise<{ novos: number; vinculados: number }> {
  const r = await fetch(`${ESTOQUE_URL}/api/ficha/sincronizar`, {
    method: 'POST',
    headers: await cabecalhos(),
    body: JSON.stringify({
      insumos: insumos.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        category: i.category ?? null,
        isRecipe: !!i.isRecipe,
        lastUpdated: i.lastUpdated ?? null,
      })),
    }),
  });
  if (!r.ok) throw await erroDe(r);
  return r.json();
}

// Estoque → Ficha: itens do estoque com o último preço pago nas notas.
export async function lerItensDoEstoque(): Promise<ItemDoEstoque[]> {
  const r = await fetch(`${ESTOQUE_URL}/api/ficha/estoque`, { headers: await cabecalhos() });
  if (!r.ok) throw await erroDe(r);
  const j = await r.json();
  return Array.isArray(j?.itens) ? j.itens : [];
}
