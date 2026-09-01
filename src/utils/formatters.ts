/**
 * Formata um valor numérico ou string para o padrão de moeda brasileiro (BRL).
 * @param {number|string} value - O valor a ser formatado.
 * @returns {string} - Valor formatado (ex: R$ 1.500,50)
 */
export function formatarMoedaBRL(value: number | string): string {
  if (value === undefined || value === null || value === '') return "R$ 0,00";

  // Se for um número direto válido, podemos formatar de forma direta se não for uma string formatada de digitação
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
  
  // Remove tudo que não for dígito
  const apenasNumeros = String(value).replace(/\D/g, "");
  if (!apenasNumeros) return "R$ 0,00";
  
  // Converte para centavos e depois para float
  const numero = parseFloat(apenasNumeros) / 100;
  
  if (isNaN(numero)) return "R$ 0,00";

  // Formata para o padrão monetário do Brasil
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/**
 * Extrai o valor numérico bruto de uma string formatada em R$ para cálculos.
 * @param {string|number} valorFormatado - Ex: "R$ 1.500,50" ou 1500.5
 * @returns {number} - Valor numérico limpo (ex: 1500.50)
 */
export function obterValorNumerico(valorFormatado: string | number): number {
  if (typeof valorFormatado === 'number') return isNaN(valorFormatado) ? 0 : valorFormatado;
  if (!valorFormatado) return 0;
  
  let s = String(valorFormatado).replace("R$", "").trim();
  
  // If there are both dots and commas
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // comma as decimal separator
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // only dots
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) {
      s = s.replace(/\./g, '');
    }
    // If 1 dot, check if it looks like thousand separator or decimal
    // e.g., 1.500 vs 15.5
    else if (dotCount === 1) {
      const parts = s.split('.');
      if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
        // likely thousand separator like 1.500
        s = s.replace('.', '');
      }
    }
  }
  
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata um número para o padrão PT-BR com separador de milhar e 2 decimais (ex: 1.000,00).
 */
export function formatNumeroBRL(value: number | string): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

