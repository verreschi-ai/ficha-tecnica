export type PrintOrientation = 'portrait' | 'landscape';

export interface PrintPrefs {
  orientation: PrintOrientation;
  fit: boolean;
}

export const PRINT_AREA_SELECTOR = '[data-print-area]';

const STORAGE_KEY = 'print_report_prefs';
const PAGE_MARGIN_MM = 8;
const PX_PER_MM = 96 / 25.4;
// Abaixo disso a letra fica ilegível no papel; melhor deixar a tabela quebrar em mais linhas.
export const MIN_PRINT_ZOOM = 0.4;

// Largura útil (em px de tela) de uma folha A4, já sem as margens.
export function printablePageWidthPx(orientation: PrintOrientation): number {
  const sheetMm = orientation === 'landscape' ? 297 : 210;
  return (sheetMm - 2 * PAGE_MARGIN_MM) * PX_PER_MM;
}

// Fator de redução para o conteúdo caber na largura da folha; nunca amplia (máx. 1).
export function computePrintZoom(contentWidthPx: number, orientation: PrintOrientation): number {
  if (!Number.isFinite(contentWidthPx) || contentWidthPx <= 0) return 1;
  const zoom = printablePageWidthPx(orientation) / contentWidthPx;
  return Math.max(MIN_PRINT_ZOOM, Math.min(1, Number(zoom.toFixed(3))));
}

export function loadPrintPrefs(defaults: PrintPrefs): PrintPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      orientation: parsed.orientation === 'portrait' ? 'portrait' : parsed.orientation === 'landscape' ? 'landscape' : defaults.orientation,
      fit: typeof parsed.fit === 'boolean' ? parsed.fit : defaults.fit,
    };
  } catch {
    return defaults;
  }
}

export function savePrintPrefs(prefs: PrintPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Sem armazenamento (modo privado): a escolha só vale nesta impressão.
  }
}

// Largura que a maior tabela da área ocuparia sem quebrar nenhuma linha de texto, já sem o que
// não sai no papel (.no-print, como a coluna de botões). Sobra de 2% para não quebrar por arredondamento.
function naturalContentWidth(area: Element): number {
  const hidden: Array<[HTMLElement, string]> = [];
  area.querySelectorAll<HTMLElement>('.no-print').forEach((el) => {
    hidden.push([el, el.style.display]);
    el.style.display = 'none';
  });

  let widest = 0;
  area.querySelectorAll('table').forEach((table) => {
    const el = table as HTMLElement;
    const previous = el.style.width;
    el.style.width = 'max-content';
    widest = Math.max(widest, el.offsetWidth);
    el.style.width = previous;
  });

  hidden.forEach(([el, display]) => {
    el.style.display = display;
  });
  return widest * 1.02;
}

// Imprime a área marcada com data-print-area na orientação escolhida e, se pedido, reduzindo
// o conteúdo para caber na largura da folha. Tudo é temporário: sai ao fechar a impressão.
export function printReport(prefs: PrintPrefs, areaSelector: string = PRINT_AREA_SELECTOR) {
  const root = document.documentElement;
  const area = document.querySelector(areaSelector);

  const zoom = prefs.fit && area ? computePrintZoom(naturalContentWidth(area), prefs.orientation) : 1;

  const style = document.createElement('style');
  style.id = 'print-report-page-style';
  style.textContent = `@page { size: A4 ${prefs.orientation}; margin: ${PAGE_MARGIN_MM}mm; }`;
  document.head.appendChild(style);
  root.style.setProperty('--print-zoom', String(zoom));
  root.classList.add('print-report');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    root.classList.remove('print-report');
    root.style.removeProperty('--print-zoom');
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  // Safari/iOS devolve do print() antes de o usuário terminar: limpa só no afterprint.
  window.addEventListener('afterprint', cleanup);
  setTimeout(cleanup, 5 * 60 * 1000);

  window.print();
}
