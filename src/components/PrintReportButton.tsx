import React, { useEffect, useRef, useState } from 'react';
import { Printer, ChevronDown } from 'lucide-react';
import { PrintOrientation, PrintPrefs, loadPrintPrefs, printReport, savePrintPrefs } from '../utils/printReport';

interface PrintReportButtonProps {
  label?: string;
  variant?: 'dark' | 'light';
}

const DEFAULT_PREFS: PrintPrefs = { orientation: 'landscape', fit: true };

export const PrintReportButton: React.FC<PrintReportButtonProps> = ({ label = 'Imprimir', variant = 'dark' }) => {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<PrintPrefs>(() => loadPrintPrefs(DEFAULT_PREFS));
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const update = (patch: Partial<PrintPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrintPrefs(next);
  };

  const handlePrint = () => {
    setOpen(false);
    // Deixa o painel fechar antes de capturar a tela para imprimir.
    setTimeout(() => printReport(prefs), 50);
  };

  const triggerClass =
    variant === 'dark'
      ? 'bg-[#1A1513] hover:bg-[#2A1D17] text-white px-5 py-3 rounded-2xl shadow-md'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl';

  const orientationBtn = (value: PrintOrientation, text: string) => (
    <button
      type="button"
      onClick={() => update({ orientation: value })}
      aria-pressed={prefs.orientation === value}
      className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
        prefs.orientation === value
          ? 'bg-[#1A1513] text-white border-[#1A1513]'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div ref={boxRef} className="no-print relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer active:scale-95 ${triggerClass}`}
        title="Opções de impressão"
      >
        <Printer size={16} />
        <span>{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Opções de impressão"
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl p-4 z-40 space-y-3"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Orientação da folha</span>
            <div className="flex gap-2">
              {orientationBtn('landscape', 'Paisagem (deitada)')}
              {orientationBtn('portrait', 'Retrato (em pé)')}
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.fit}
              onChange={(e) => update({ fit: e.target.checked })}
              className="mt-0.5 accent-[#1A1513]"
            />
            <span>
              <strong>Reduzir para caber na página.</strong>{' '}
              Diminui a tabela para nenhuma coluna ser cortada. Em retrato a letra fica bem pequena; prefira paisagem.
            </span>
          </label>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full bg-[#1A1513] hover:bg-[#2A1D17] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      )}
    </div>
  );
};
