"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  ReceiptText,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { getSession } from "@/lib/auth";

type Multa = {
  id: number;
  diasPunicao: number;
  status: string;
  tipo: string;
  dataInicio: string;
  dataTermino: string;
};

const MULTAS_POR_PAGINA = 10;

const campoClasse =
  "w-full min-w-0 max-w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:px-4";

const botaoSecundario =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-35";

function formatarData(data: string) {
  if (!data) return "Não informada";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    return data;
  }

  const correspondencia = data.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (correspondencia) {
    return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`;
  }

  return data;
}

function obterStatusVisual(status: string) {
  const normalizado = status.trim().toLocaleLowerCase("pt-BR");

  if (normalizado === "pendente") {
    return {
      classe: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
      icone: Clock,
    };
  }

  if (normalizado === "cancelada" || normalizado === "cancelado") {
    return {
      classe: "bg-[var(--status-danger)]/10 text-[var(--status-danger)]",
      icone: X,
    };
  }

  if (normalizado === "concluída" || normalizado === "concluida") {
    return {
      classe: "bg-[var(--status-success)]/10 text-[var(--status-success)]",
      icone: CheckCircle2,
    };
  }

  return {
    classe: "bg-[var(--status-info)]/10 text-[var(--status-info)]",
    icone: ReceiptText,
  };
}

function obterTipoVisual(tipo: string) {
  const normalizado = tipo.trim().toLocaleLowerCase("pt-BR");

  if (normalizado === "atraso") {
    return "bg-[var(--status-warning)]/10 text-[var(--status-warning)]";
  }

  if (normalizado === "depredação" || normalizado === "depredacao") {
    return "bg-[var(--status-danger)]/10 text-[var(--status-danger)]";
  }

  if (normalizado === "extravio") {
    return "bg-[var(--status-info)]/10 text-[var(--status-info)]";
  }

  return "bg-[var(--surface-warm)] text-[var(--text-primary)]";
}

function normalizarStatus(status: string) {
  return status
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function MultasPage() {
  const [data, setData] = useState("");
  const [status, setStatus] = useState("");
  const [multas, setMultas] = useState<Multa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [id_freq, setId_freq] = useState<number | null>(null);

  // Obtém o frequentador logado.
  useEffect(() => {
    const session = getSession();

    if (session?.id) {
      setId_freq(Number(session.id));
    } else {
      setErro("Não foi possível identificar o frequentador logado.");
      setCarregando(false);
    }
  }, []);

  // Carrega as multas do frequentador e aplica os filtros.
  useEffect(() => {
    if (id_freq === null) return;

    let cancelado = false;

    async function carregarMultas() {
      setCarregando(true);
      setErro("");

      try {
        const params = new URLSearchParams();

        params.set("fk_frequentador_id_frequentador", String(id_freq));

        if (data) {
          params.set("data", data);
        }

        if (status) {
          params.set("status", status);
        }

        const resposta = await fetch(`/api/multas?${params.toString()}`);

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar suas multas.");
        }

        const resultado = await resposta.json();

        if (!Array.isArray(resultado.multas)) {
          throw new Error("A resposta da API possui um formato inválido.");
        }

        if (!cancelado) {
          setMultas(resultado.multas);
        }
      } catch (error) {
        console.error("Erro ao carregar multas:", error);

        if (!cancelado) {
          setMultas([]);
          setErro("Não foi possível carregar suas multas. Tente novamente.");
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarMultas();

    return () => {
      cancelado = true;
    };
  }, [id_freq, data, status]);

  // Volta à primeira página quando os filtros mudam.
  useEffect(() => {
    setPaginaAtual(1);
  }, [data, status]);

  const totalPaginas = Math.ceil(multas.length / MULTAS_POR_PAGINA);

  const paginaSegura = Math.min(paginaAtual, Math.max(totalPaginas, 1));

  const inicio = (paginaSegura - 1) * MULTAS_POR_PAGINA;

  const multasDaPagina = multas.slice(inicio, inicio + MULTAS_POR_PAGINA);

  const multasPendentes = multas.filter(
    (multa) => normalizarStatus(multa.status) === "pendente",
  ).length;

  const totalDiasPunicao = multas.reduce(
    (total, multa) => total + (Number(multa.diasPunicao) || 0),
    0,
  );

  const filtrosAtivos = Boolean(data || status);

  function tentarNovamente() {
    setErro("");

    const session = getSession();

    if (session?.id) {
      setCarregando(true);
      setId_freq(Number(session.id));
    } else {
      setId_freq(null);
      setCarregando(false);
      setErro("Não foi possível identificar o frequentador logado.");
    }
  }

  function limparFiltros() {
    setData("");
    setStatus("");
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-clip bg-[var(--app-background)] px-3 py-4 text-[var(--text-primary)] min-[400px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 sm:space-y-8">
        {/* Cabeçalho */}
        <header className="flex min-w-0 flex-col gap-3">
          <h1 className="break-words text-2xl font-bold leading-tight min-[375px]:text-3xl sm:text-4xl">
            Minhas multas
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Consulte suas penalidades, acompanhe os prazos e confira a situação
            das multas registradas em seu nome.
          </p>
        </header>

        {/* Mensagem de erro */}
        {erro && (
          <div
            role="alert"
            className="flex min-w-0 items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-3 text-sm text-[var(--status-danger)] shadow-[var(--shadow-card)] sm:p-4"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />

            <p className="min-w-0 flex-1 break-words">{erro}</p>

            <button
              type="button"
              onClick={tentarNovamente}
              aria-label="Tentar novamente"
              className="shrink-0 rounded-lg p-1 transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Indicadores */}
        <section
          aria-label="Resumo das minhas multas"
          className="grid min-w-0 grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3"
        >
          <article className="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] min-[400px]:gap-4 min-[400px]:p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--status-warning)]/10 text-[var(--status-warning)] min-[400px]:h-12 min-[400px]:w-12 sm:h-14 sm:w-14">
              <Clock size={24} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
                Multas pendentes
              </p>

              <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {multasPendentes}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Aguardando resolução
              </p>
            </div>
          </article>

          <article className="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] min-[400px]:gap-4 min-[400px]:p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--status-danger)]/10 text-[var(--status-danger)] min-[400px]:h-12 min-[400px]:w-12 sm:h-14 sm:w-14">
              <ShieldAlert size={24} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
                Dias de punição
              </p>

              <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {totalDiasPunicao}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Total registrado
              </p>
            </div>
          </article>

          <article className="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] min-[400px]:gap-4 min-[400px]:p-4 sm:p-5 min-[520px]:col-span-2 lg:col-span-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--status-info)]/10 text-[var(--status-info)] min-[400px]:h-12 min-[400px]:w-12 sm:h-14 sm:w-14">
              <ReceiptText size={24} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
                Multas recebidas
              </p>

              <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {multas.length}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                De todos os status
              </p>
            </div>
          </article>
        </section>

        {/* Filtros */}
        <section className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] min-[400px]:p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold sm:text-xl">Pesquisar multas</h2>

            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              Filtre suas multas por data ou situação.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="filtro-data-multa"
                className="mb-1.5 block text-sm font-semibold"
              >
                Data
              </label>

              <input
                id="filtro-data-multa"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                aria-label="Filtrar pela data de início ou término da multa"
                className={campoClasse}
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="filtro-status-multa"
                className="mb-1.5 block text-sm font-semibold"
              >
                Status
              </label>

              <select
                id="filtro-status-multa"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={campoClasse}
              >
                <option value="">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONCLUÍDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          {filtrosAtivos && (
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-default)] pt-4 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-end">
              <button
                type="button"
                onClick={limparFiltros}
                className={`${botaoSecundario} w-full min-[400px]:w-auto`}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

        {/* Lista de multas */}
        <section className="min-w-0 space-y-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">
                Histórico de multas
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {multas.length === 1
                  ? "1 multa encontrada"
                  : `${multas.length} multas encontradas`}
              </p>
            </div>

            {!carregando && !erro && multas.length > 0 && (
              <p className="text-xs text-[var(--text-muted)] sm:text-right">
                Exibindo {inicio + 1}–
                {Math.min(inicio + MULTAS_POR_PAGINA, multas.length)} de{" "}
                {multas.length}
              </p>
            )}
          </div>

          {/* Carregamento */}
          {carregando ? (
            <div
              role="status"
              className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-card)]"
            >
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--button-primary)]" />

              <p className="text-sm text-[var(--text-secondary)]">
                Carregando suas multas...
              </p>
            </div>
          ) : erro ? (
            /* Erro ao carregar */
            <div
              role="alert"
              className="flex min-w-0 flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-center shadow-[var(--shadow-card)] sm:p-8"
            >
              <AlertCircle
                size={30}
                className="text-[var(--status-danger)]"
                aria-hidden="true"
              />

              <p className="text-sm text-[var(--text-secondary)]">
                Não foi possível exibir suas multas.
              </p>

              <button
                type="button"
                onClick={tentarNovamente}
                className={botaoSecundario}
              >
                Tentar novamente
              </button>
            </div>
          ) : multasDaPagina.length === 0 ? (
            /* Lista vazia */
            <div className="flex min-h-48 flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-5 text-center shadow-[var(--shadow-card)] sm:p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-secondary)]">
                <ReceiptText size={25} aria-hidden="true" />
              </div>

              <h3 className="font-semibold">Nenhuma multa encontrada</h3>

              <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
                Não há multas que correspondam aos filtros selecionados. Você
                pode limpar os filtros e consultar novamente.
              </p>

              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className={`${botaoSecundario} mt-4 w-full min-[400px]:w-auto`}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            /* Multas encontradas */
            <div className="min-w-0 space-y-3">
              {multasDaPagina.map((multa) => {
                const statusVisual = obterStatusVisual(multa.status);
                const tipoVisual = obterTipoVisual(multa.tipo);
                const IconeStatus = statusVisual.icone;

                return (
                  <article
                    key={multa.id}
                    className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition hover:border-[var(--border-strong)]"
                  >
                    <div className="flex min-w-0 flex-col gap-4 p-3 min-[400px]:p-4 sm:p-5 lg:p-6">
                      {/* Identificação e status */}
                      <div className="flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-500)] text-[var(--text-inverse)]">
                            <UserRound size={20} aria-hidden="true" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words font-bold sm:text-lg">
                              Multa #{multa.id}
                            </h3>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              Detalhes da penalidade
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit max-w-full items-center gap-1.5 self-start break-words rounded-full px-3 py-1.5 text-xs font-semibold ${statusVisual.classe}`}
                        >
                          <IconeStatus
                            size={14}
                            className="shrink-0"
                            aria-hidden="true"
                          />
                          {multa.status}
                        </span>
                      </div>

                      {/* Informações da multa */}
                      <div className="grid min-w-0 grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:grid-cols-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-secondary)]">
                            Tipo da multa
                          </p>

                          <p
                            className={`mt-1 inline-flex max-w-full break-words rounded-full px-3 py-1 text-sm font-semibold ${tipoVisual}`}
                          >
                            {multa.tipo}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-secondary)]">
                            Dias de punição
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold">
                            {multa.diasPunicao}{" "}
                            {multa.diasPunicao === 1 ? "dia" : "dias"}
                          </p>
                        </div>

                        <div className="flex min-w-0 items-start gap-2">
                          <CalendarDays
                            size={17}
                            className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                            aria-hidden="true"
                          />

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                              Início
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold">
                              {formatarData(multa.dataInicio)}
                            </p>
                          </div>
                        </div>

                        <div className="flex min-w-0 items-start gap-2">
                          <CalendarDays
                            size={17}
                            className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                            aria-hidden="true"
                          />

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                              Término
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold">
                              {formatarData(multa.dataTermino)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {!carregando && !erro && totalPaginas > 1 && (
            <nav
              aria-label="Paginação das minhas multas"
              className="flex min-w-0 flex-col gap-4 rounded-[var(--radius-card)] px-0 py-4 min-[400px]:px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2"
            >
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Página {paginaSegura} de {totalPaginas}
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Mostrando{" "}
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {inicio + 1}–
                    {Math.min(inicio + MULTAS_POR_PAGINA, multas.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {multas.length}
                  </span>{" "}
                  multas
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1 sm:w-auto sm:flex-nowrap sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaSegura === 1}
                  aria-label="Ir para a primeira página"
                  title="Primeira página"
                  className={botaoSecundario + " h-10 w-9 shrink-0 p-0"}
                >
                  <ChevronsLeft size={18} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtual((pagina) => Math.max(pagina - 1, 1))
                  }
                  disabled={paginaSegura === 1}
                  aria-label="Página anterior"
                  className={botaoSecundario + " h-10 w-9 shrink-0 p-0"}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                {(() => {
                  const quantidadeVisivel = 3;

                  const inicioJanela = Math.max(
                    1,
                    Math.min(
                      paginaSegura - Math.floor(quantidadeVisivel / 2),
                      totalPaginas - quantidadeVisivel + 1,
                    ),
                  );

                  const fimJanela = Math.min(
                    totalPaginas,
                    inicioJanela + quantidadeVisivel - 1,
                  );

                  const paginas = Array.from(
                    { length: fimJanela - inicioJanela + 1 },
                    (_, indice) => inicioJanela + indice,
                  );

                  return (
                    <>
                      {inicioJanela > 1 && (
                        <span
                          aria-hidden="true"
                          className="px-0.5 text-sm text-[var(--text-muted)]"
                        >
                          …
                        </span>
                      )}

                      {paginas.map((pagina) => {
                        const selecionada = pagina === paginaSegura;

                        return (
                          <button
                            key={pagina}
                            type="button"
                            onClick={() => setPaginaAtual(pagina)}
                            aria-label={`Ir para a página ${pagina}`}
                            aria-current={selecionada ? "page" : undefined}
                            className={`inline-flex h-10 min-w-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] border px-2 text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
                              selecionada
                                ? "border-[var(--button-primary)] bg-[var(--button-primary)] text-[var(--text-inverse)]"
                                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-hover)]"
                            }`}
                          >
                            {pagina}
                          </button>
                        );
                      })}

                      {fimJanela < totalPaginas && (
                        <span
                          aria-hidden="true"
                          className="px-0.5 text-sm text-[var(--text-muted)]"
                        >
                          …
                        </span>
                      )}
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtual((pagina) =>
                      Math.min(pagina + 1, totalPaginas),
                    )
                  }
                  disabled={paginaSegura === totalPaginas}
                  aria-label="Próxima página"
                  className={botaoSecundario + " h-10 w-9 shrink-0 p-0"}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaSegura === totalPaginas}
                  aria-label="Ir para a última página"
                  title="Última página"
                  className={botaoSecundario + " h-10 w-9 shrink-0 p-0"}
                >
                  <ChevronsRight size={18} aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
