export interface NineninePreset {
  label: string;
  hint: string;
  discountPct: number;
  storeSharePct: number;
}

// Ofertas recomendadas pela 99 (portal do parceiro, período 12/07/26 a 31/12/26).
export const NINENINE_PRESETS: NineninePreset[] = [
  { label: '40% off com subsídio', hint: 'Loja cobre 75% / 99 cobre 25%', discountPct: 40, storeSharePct: 75 },
  { label: '30% off (aumentar pedidos)', hint: 'Loja cobre 84% / 99 cobre 16%', discountPct: 30, storeSharePct: 84 },
];

export interface NinenineDivisorInput {
  taxPct: number; // comissão + pagamento online, sobre o que o cliente paga
  discountPct: number; // desconto da oferta sobre o preço de lista (0 = sem oferta)
  storeSharePct: number; // parte do desconto que a loja paga; a 99 devolve o resto
  logisticsPct: number; // frete grátis em % do preço de lista (0 = desligado)
}

// Fração do preço de lista que chega à loja (antes do custo de entrega fixo):
//   cliente paga (1 - d); as taxas incidem sobre esse valor; a 99 devolve d * (1 - s) do preço de lista.
// Sem desconto vira 1 - taxas - frete, a conta que o app já fazia.
export function nineninePriceDivisor({ taxPct, discountPct, storeSharePct, logisticsPct }: NinenineDivisorInput): number {
  const d = Math.min(Math.max(discountPct, 0), 100) / 100;
  const s = Math.min(Math.max(storeSharePct, 0), 100) / 100;
  return (1 - d) * (1 - taxPct / 100) + d * (1 - s) - logisticsPct / 100;
}
