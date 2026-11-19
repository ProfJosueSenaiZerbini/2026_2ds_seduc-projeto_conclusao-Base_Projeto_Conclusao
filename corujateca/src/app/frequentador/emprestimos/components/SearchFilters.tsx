"use client";

import { CalendarDays, RotateCcw } from "lucide-react";

type SearchFiltersProps = {
  status: string;
  data: string;
  onStatusChange: (status: string) => void;
  onDataChange: (data: string) => void;
  onClear: () => void;
};

const campoClasse =
  "min-h-11 w-full min-w-0 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:px-4";

const opcoesStatus = [
  { value: "", label: "Todos os status" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "atrasado", label: "Atrasado" },
  { value: "devolvido_no_prazo", label: "Devolvido no prazo" },
  { value: "devolvido_com_atraso", label: "Devolvido com atraso" },
];

export default function SearchFilters({
  status,
  data,
  onStatusChange,
  onDataChange,
  onClear,
}: SearchFiltersProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="min-w-0">
        <label
          htmlFor="data-emprestimo"
          className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
        >
          Data do empréstimo
        </label>

        <div className="flex min-h-11 min-w-0 items-center rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] transition focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
          <CalendarDays
            size={17}
            className="ml-3 shrink-0 text-[var(--text-muted)]"
            aria-hidden="true"
          />

          <input
            id="data-emprestimo"
            type="date"
            value={data}
            onChange={(event) => onDataChange(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none sm:px-4"
          />
        </div>
      </div>

      <div className="min-w-0">
        <label
          htmlFor="status-emprestimo"
          className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
        >
          Status do empréstimo
        </label>

        <select
          id="status-emprestimo"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className={`${campoClasse} cursor-pointer`}
        >
          {opcoesStatus.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 sm:col-span-2">
        <button
          type="button"
          onClick={onClear}
          disabled={!status && !data}
          className="inline-flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
