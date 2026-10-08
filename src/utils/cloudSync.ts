import type { SyncedUserData } from '../services/firebaseService';

const isPhoto = (url: unknown): url is string => typeof url === 'string' && url.startsWith('data:');

// Fotos enviadas pelo usuário ficam no cadastro como texto (data URL, centenas de KB cada) e
// estouram o limite de 1 MB por documento do Firestore. A cópia da nuvem vai sem elas; as
// fotos continuam no aparelho onde foram enviadas (as telas usam uma imagem padrão sem foto).
export function stripPhotos<T extends SyncedUserData>(data: T): T {
  if (!Array.isArray(data.sheets)) return data;
  return {
    ...data,
    sheets: data.sheets.map((s: any) => (isPhoto(s?.imageUrl) ? { ...s, imageUrl: '' } : s)),
  };
}

// Ao aplicar o cadastro vindo da nuvem (sem fotos), devolve a foto local de cada prato que
// já existe neste aparelho -- senão puxar da nuvem apagaria as fotos de quem as enviou.
export function restoreLocalPhotos<T extends SyncedUserData>(cloud: T, local: SyncedUserData | null | undefined): T {
  if (!Array.isArray(cloud.sheets) || !Array.isArray(local?.sheets)) return cloud;
  const photosById = new Map<string, string>();
  for (const s of local!.sheets!) {
    if (s?.id && isPhoto(s.imageUrl)) photosById.set(s.id, s.imageUrl);
  }
  if (photosById.size === 0) return cloud;
  return {
    ...cloud,
    sheets: cloud.sheets.map((s: any) =>
      s?.id && !s.imageUrl && photosById.has(s.id) ? { ...s, imageUrl: photosById.get(s.id) } : s
    ),
  };
}
