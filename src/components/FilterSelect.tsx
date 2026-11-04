import React from 'react';

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel?: string;
}

export const ALL_FILTER = 'Todos';

// Opções únicas e em ordem alfabética, sem vazios, a partir dos valores de uma lista.
export function uniqueOptions(values: Array<string | undefined | null>): string[] {
  const set = new Set<string>();
  values.forEach((v) => {
    const clean = (v ?? '').trim();
    if (clean) set.add(clean);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const FilterSelect: React.FC<FilterSelectProps> = ({ label, value, onChange, options, allLabel = 'Todas' }) => (
  <label className="no-print flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
    <span>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 cursor-pointer max-w-[12rem]"
    >
      <option value={ALL_FILTER}>{allLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);
