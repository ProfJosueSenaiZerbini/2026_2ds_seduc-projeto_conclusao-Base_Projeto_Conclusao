"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  LoaderCircle,
} from "lucide-react";

import DashboardCard from "./components/DashboardCard";
import SearchFilters from "./components/SearchFilters";
import LoanCard from "./components/LoanCard";
import Pagination from "@/components/Pagination";

type Loan = {
  id: number;
  title: string;
  author: string;
  status: string;
  expiration: string;
  loanDate: string;
};

const EMPRESTIMOS_POR_PAGINA = 10;

function inicioDoDia(data: Date) {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
  ).getTime();
}

function dataFormatadaParaTimestamp(data: string) {
  if (!data || data === "-") return null;

  const [dia, mes, ano] = data.split("/").map(Number);

  if (!dia || !mes || !ano) return null;

  return new Date(ano, mes - 1, dia).getTime();
}

function corrigirStatus(loan: Loan): Loan {
  // Os status de devolução não devem ser alterados.
  if (
    loan.status !== "Em andamento" &&
    loan.status !== "Atrasado"
  ) {
    return loan;
  }

  const vencimento = dataFormatadaParaTimestamp(loan.expiration);

  if (vencimento === null) return loan;

  const hoje = inicioDoDia(new Date());

  return {
    ...loan,
    status: vencimento < hoje ? "Atrasado" : "Em andamento",
  };
}

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [statusFiltro, setStatusFiltro] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function buscarEmprestimos() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch("/api/emprestimos");
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.error ||
            dados.erro ||
            "Não foi possível buscar os empréstimos.",
          );
        }

        const emprestimosRecebidos: Loan[] = Array.isArray(
          dados.emprestimos,
        )
          ? dados.emprestimos
          : [];

        setLoans(emprestimosRecebidos.map(corrigirStatus));
      } catch (erro) {
        console.error("Erro ao buscar empréstimos:", erro);

        setErro(
          erro instanceof Error
            ? erro.message
            : "Não foi possível buscar os empréstimos.",
        );
      } finally {
        setCarregando(false);
      }
    }

    buscarEmprestimos();
  }, []);

  const loansFiltrados = loans.filter((loan) => {
    let correspondeAoStatus = true;

    if (statusFiltro === "em_andamento") {
      correspondeAoStatus = loan.status === "Em andamento";
    } else if (statusFiltro === "devolvido_no_prazo") {
      correspondeAoStatus = loan.status === "Devolvido no prazo";
    } else if (statusFiltro === "devolvido_com_atraso") {
      correspondeAoStatus = loan.status === "Devolvido com atraso";
    } else if (statusFiltro === "atrasado") {
      correspondeAoStatus = loan.status === "Atrasado";
    }

    let correspondeAData = true;

    if (dataFiltro) {
      const [ano, mes, dia] = dataFiltro.split("-");
      const dataFormatada = `${dia}/${mes}/${ano}`;

      correspondeAData = loan.loanDate === dataFormatada;
    }

    return correspondeAoStatus && correspondeAData;
  });

  const totalPaginas = Math.ceil(
    loansFiltrados.length / EMPRESTIMOS_POR_PAGINA,
  );

  const paginaSegura = Math.min(
    paginaAtual,
    Math.max(totalPaginas, 1),
  );

  const inicio = (paginaSegura - 1) * EMPRESTIMOS_POR_PAGINA;

  const loansDaPagina = loansFiltrados.slice(
    inicio,
    inicio + EMPRESTIMOS_POR_PAGINA,
  );

  const emprestimosEmAndamento = loans.filter(
    (loan) =>
      loan.status === "Em andamento" || loan.status === "Atrasado",
  ).length;

  function dataEhHoje(data: string) {
    const timestamp = dataFormatadaParaTimestamp(data);

    if (timestamp === null) return false;

    return timestamp === inicioDoDia(new Date());
  }

  const emprestimosQueExpiramHoje = loans.filter(
    (loan) =>
      (loan.status === "Em andamento" || loan.status === "Atrasado") &&
      dataEhHoje(loan.expiration),
  ).length;

  function limparFiltros() {
    setStatusFiltro("");
    setDataFiltro("");
    setPaginaAtual(1);
  }

  function atualizarStatusFiltro(status: string) {
    setStatusFiltro(status);
    setPaginaAtual(1);
  }

  function atualizarDataFiltro(data: string) {
    setDataFiltro(data);
    setPaginaAtual(1);
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-clip bg-[var(--app-background)] px-3 py-5 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 sm:space-y-8">
        <header>
          <h1 className="break-words text-2xl font-bold leading-tight min-[375px]:text-3xl sm:text-4xl">
            Meus empréstimos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Acompanhe seus livros emprestados, consulte as datas de devolução e
            confira o histórico dos seus empréstimos.
          </p>
        </header>

        <section
          aria-label="Resumo dos empréstimos"
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-6"
        >
          <DashboardCard
            title="Empréstimos em andamento"
            value={emprestimosEmAndamento}
            icon={Clock3}
            tone="info"
          />

          <DashboardCard
            title="Devoluções previstas para hoje"
            value={emprestimosQueExpiramHoje}
            icon={CalendarClock}
            tone="warning"
          />
        </section>

        <section
          aria-labelledby="titulo-pesquisa-emprestimos"
          className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <div className="mb-5">
            <h2
              id="titulo-pesquisa-emprestimos"
              className="text-lg font-bold sm:text-xl"
            >
              Pesquisar empréstimos
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              Filtre seus empréstimos por data ou status.
            </p>
          </div>

          <SearchFilters
            status={statusFiltro}
            data={dataFiltro}
            onStatusChange={atualizarStatusFiltro}
            onDataChange={atualizarDataFiltro}
            onClear={limparFiltros}
          />
        </section>

        <section
          aria-labelledby="titulo-lista-emprestimos"
          className="min-w-0"
        >
          <div className="mb-4 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2
                id="titulo-lista-emprestimos"
                className="break-words text-xl font-bold sm:text-2xl"
              >
                Histórico de empréstimos
              </h2>

              {!carregando && !erro && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {loansFiltrados.length === 1
                    ? "1 empréstimo encontrado"
                    : `${loansFiltrados.length} empréstimos encontrados`}
                </p>
              )}
            </div>

            {!carregando &&
              !erro &&
              loansFiltrados.length > 0 &&
              loansFiltrados.length <= EMPRESTIMOS_POR_PAGINA && (
                <p className="text-xs text-[var(--text-muted)]">
                  Exibindo {inicio + 1}–
                  {Math.min(
                    inicio + EMPRESTIMOS_POR_PAGINA,
                    loansFiltrados.length,
                  )}{" "}
                  de {loansFiltrados.length}
                </p>
              )}
          </div>

          {carregando && (
            <div
              role="status"
              className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-10 text-center shadow-[var(--shadow-card)]"
            >
              <LoaderCircle
                size={28}
                className="animate-spin text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <p className="text-sm text-[var(--text-secondary)]">
                Carregando seus empréstimos...
              </p>
            </div>
          )}

          {!carregando && erro && (
            <div
              role="alert"
              className="flex min-w-0 items-start gap-3 rounded-[var(--radius-card)] border border-[var(--status-danger)]/30 bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
            >
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0 text-[var(--status-danger)]"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Não foi possível carregar os empréstimos
                </h3>
                <p className="mt-1 break-words text-sm leading-relaxed text-[var(--text-secondary)]">
                  {erro}
                </p>
              </div>
            </div>
          )}

          {!carregando && !erro && loans.length === 0 && (
            <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-10 text-center shadow-[var(--shadow-card)] sm:py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-warm)] text-[var(--text-primary)]">
                <Clock3 size={26} aria-hidden="true" />
              </div>

              <h3 className="mt-4 font-bold">
                Você ainda não possui empréstimos
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                Quando você realizar um empréstimo na biblioteca, as informações
                aparecerão nesta página.
              </p>
            </div>
          )}

          {!carregando &&
            !erro &&
            loans.length > 0 &&
            loansFiltrados.length === 0 && (
              <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-10 text-center shadow-[var(--shadow-card)] sm:py-12">
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  Nenhum empréstimo corresponde aos filtros selecionados.
                </p>

                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-4 inline-flex hover:cursor-pointer min-h-11 max-w-full items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  Limpar filtros
                </button>
              </div>
            )}

          {!carregando && !erro && loansFiltrados.length > 0 && (
            <div className="min-w-0 space-y-3">
              {loansDaPagina.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          )}

          {!carregando &&
            !erro &&
            loansFiltrados.length > EMPRESTIMOS_POR_PAGINA && (
              <div className="mt-5">
                <Pagination
                  currentPage={paginaSegura}
                  totalPages={totalPaginas}
                  startItem={inicio + 1}
                  endItem={Math.min(
                    inicio + EMPRESTIMOS_POR_PAGINA,
                    loansFiltrados.length,
                  )}
                  totalItems={loansFiltrados.length}
                  itemLabel="empréstimos"
                  ariaLabel="Paginação dos empréstimos"
                  onPageChange={setPaginaAtual}
                />
              </div>
            )}
        </section>
      </div>
    </main>
  );
}