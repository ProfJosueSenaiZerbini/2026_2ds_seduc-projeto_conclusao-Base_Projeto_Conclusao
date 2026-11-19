"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  itemLabel: string;
  ariaLabel: string;
  onPageChange: (page: number) => void;
};

const botaoNavegacaoClasse =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-35";

export default function Pagination({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalItems,
  itemLabel,
  ariaLabel,
  onPageChange,
}: PaginationProps) {
  const quantidadeVisivel = 5;
  const inicioJanela = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(quantidadeVisivel / 2),
      totalPages - quantidadeVisivel + 1,
    ),
  );
  const fimJanela = Math.min(
    totalPages,
    inicioJanela + quantidadeVisivel - 1,
  );
  const paginas = Array.from(
    { length: fimJanela - inicioJanela + 1 },
    (_, indice) => inicioJanela + indice,
  );

  return (
    <nav
      aria-label={ariaLabel}
      className="flex min-w-0 flex-col gap-4 rounded-[var(--radius-card)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Página {currentPage} de {totalPages}
        </p>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Mostrando{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {startItem}–{endItem}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </p>
      </div>

      <div className="flex min-w-0 items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Ir para a primeira página"
          title="Primeira página"
          className={botaoNavegacaoClasse}
        >
          <ChevronsLeft size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          className={botaoNavegacaoClasse}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        {inicioJanela > 1 && (
          <span
            aria-hidden="true"
            className="hidden px-0.5 text-sm text-[var(--text-muted)] min-[360px]:inline"
          >
            …
          </span>
        )}

        {paginas.map((pagina) => {
          const paginaSelecionada = pagina === currentPage;

          return (
            <button
              key={pagina}
              type="button"
              onClick={() => onPageChange(pagina)}
              aria-label={`Ir para a página ${pagina}`}
              aria-current={paginaSelecionada ? "page" : undefined}
              className={`inline-flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border px-2.5 text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
                paginaSelecionada
                  ? "border-none bg-[var(--brand-400)] text-[var(--text-inverse)] shadow-sm"
                  : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {pagina}
            </button>
          );
        })}

        {fimJanela < totalPages && (
          <span
            aria-hidden="true"
            className="hidden px-0.5 text-sm text-[var(--text-muted)] min-[360px]:inline"
          >
            …
          </span>
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
          className={botaoNavegacaoClasse}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Ir para a última página"
          title="Última página"
          className={botaoNavegacaoClasse}
        >
          <ChevronsRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
