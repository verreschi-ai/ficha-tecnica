export type MarginLevel = 'healthy' | 'tight' | 'risk' | 'loss';

// Faixas de margem de lucro, todas ancoradas na Margem Desejada (meta) das Configurações:
//   Saudável: ≥ meta
//   Apertada: de metade da meta até a meta
//   Em risco: de 0% até metade da meta
//   Prejuízo: abaixo de 0%
// Com a meta padrão de 20% as faixas ficam em 10% e 20%. Antes o corte de risco era fixo em
// 10% — com meta de 8%, pratos acima da meta apareciam "em risco" e a faixa Apertada nunca existia.
export function riskLimit(targetMargin: number): number {
  return targetMargin / 2;
}

export function classifyMargin(profitPct: number, targetMargin: number): MarginLevel {
  if (profitPct < 0) return 'loss';
  if (profitPct < riskLimit(targetMargin)) return 'risk';
  if (profitPct < targetMargin) return 'tight';
  return 'healthy';
}
