"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Pagination from "@/components/Pagination";
import LoanCard from "./LoanCard";

export type LoanView = {
  id: number;
  title: string;
  author: string;
  userName: string;
  status: string;
  daysOverdue: number;
  expiration: string;
  loanDate: string;
};

type LoansSectionProps = {
  loans: LoanView[];
};

const EMPRESTIMOS_POR_PAGINA = 10;

export default function LoansSection({ loans }: LoansSectionProps) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagemAtualizacao, setMensagemAtualizacao] = useState("");

  const totalPaginas = Math.ceil(loans.length / EMPRESTIMOS_POR_PAGINA);

  const paginaSegura = Math.min(paginaAtual, Math.max(totalPaginas, 1));

  const inicio = (paginaSegura - 1) * EMPRESTIMOS_POR_PAGINA;

  const loansDaPagina = loans.slice(inicio, inicio + EMPRESTIMOS_POR_PAGINA);

  return (
    <section aria-labelledby="titulo-lista-emprestimos" className="min-w-0">
      {mensagemAtualizacao && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--status-success)]/10 p-3 text-sm font-medium text-[var(--status-success)]"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {mensagemAtualizacao}
        </p>
      )}

      <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id="titulo-lista-emprestimos"
            className="break-words text-xl font-bold sm:text-2xl"
          >
            Empréstimos cadastrados
          </h2>

          <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">
            {loans.length === 1
              ? "1 empréstimo encontrado"
              : `${loans.length} empréstimos encontrados`}
          </p>
        </div>

        {loans.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">
            Exibindo {inicio + 1}–
            {Math.min(inicio + EMPRESTIMOS_POR_PAGINA, loans.length)} de{" "}
            {loans.length}
          </p>
        )}
      </div>

      {loans.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-10 text-center shadow-[var(--shadow-card)] sm:py-12">
          <p className="break-words text-sm leading-relaxed text-[var(--text-secondary)]">
            Não há empréstimos que correspondam aos filtros selecionados. Você
            pode limpar os filtros e tentar novamente.
          </p>

          <Link
            href="/bibliotecario/emprestimos"
            className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center rounded-[var(--radius-button)] border-2 border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Limpar filtros
          </Link>
        </div>
      ) : (
        <div className="min-w-0 space-y-3">
          {loansDaPagina.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onMutationSuccess={setMensagemAtualizacao}
            />
          ))}
        </div>
      )}

      {loans.length > EMPRESTIMOS_POR_PAGINA && (
        <div className="mt-4 min-w-0">
          <Pagination
            currentPage={paginaSegura}
            totalPages={totalPaginas}
            startItem={inicio + 1}
            endItem={Math.min(inicio + EMPRESTIMOS_POR_PAGINA, loans.length)}
            totalItems={loans.length}
            itemLabel="empréstimos"
            ariaLabel="Paginação dos empréstimos"
            onPageChange={setPaginaAtual}
          />
        </div>
      )}
    </section>
  );
}
