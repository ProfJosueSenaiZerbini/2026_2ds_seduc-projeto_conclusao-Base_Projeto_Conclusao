"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  ReceiptText,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Pagination from "@/components/Pagination";

type MultaView = {
  id: number;
  usuario: string;
  diasPunicao: number;
  status: string;
  tipo: string;
  dataInicio: string;
  dataTermino: string;
};

type MultasResponse = {
  multas: MultaView[];
  frequentadores: { id_freq: number; nome_freq: string }[];
  tipos: string[];
  tiposCadastro: string[];
  totais: {
    atraso: number;
    depredacao: number;
    extravio: number;
  };
};

type Filtros = {
  usuario: string;
  data: string;
  status: string;
  tipo: string;
};

type FormularioMulta = {
  frequentadorId: string;
  tipo: string;
  inicio: string;
  termino: string;
};

const MULTAS_POR_PAGINA = 10;

const FILTROS_INICIAIS: Filtros = {
  usuario: "",
  data: "",
  status: "Pendente",
  tipo: "",
};

const FORMULARIO_INICIAL: FormularioMulta = {
  frequentadorId: "",
  tipo: "",
  inicio: "",
  termino: "",
};

const campoClasse =
  "w-full min-w-0 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4";

const botaoPrimario =
  "inline-flex min-h-11 hover:cursor-pointer min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-4 py-2.5 text-sm text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

const botaoSecundario =
  "inline-flex min-h-11 hover:cursor-pointer min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

const modalClasse =
  "relative my-auto max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-lg overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--radius-modal)] border border-[var(--border-default)] bg-[var(--surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-modal)] sm:max-h-[calc(100dvh-2.5rem)] sm:p-6";

function obterDataAtual() {
  const data = new Date();

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterDataFinal(dataInicial: string, dias: number) {
  const dataFinal = new Date(`${dataInicial}T00:00:00`);

  dataFinal.setDate(dataFinal.getDate() + dias);

  const ano = dataFinal.getFullYear();
  const mes = String(dataFinal.getMonth() + 1).padStart(2, "0");
  const dia = String(dataFinal.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterPrazo(tipo: string) {
  if (tipo === "DEPREDAÇÃO") return 15;
  if (tipo === "EXTRAVIO") return 30;

  return 0;
}

function formatarData(data: string) {
  if (!data) return "Não informada";

  // Já está no formato brasileiro.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    return data;
  }

  // Evita deslocamento de dia ao formatar uma data ISO.
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
      classe:
        "border-none bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
      icone: Clock,
    };
  }

  if (normalizado === "cancelada" || normalizado === "cancelado") {
    return {
      classe:
        "border-none bg-[var(--status-danger)]/10 text-[var(--status-danger)]",
      icone: X,
    };
  }

  if (normalizado === "concluída" || normalizado === "concluida") {
    return {
      classe:
        "border-none bg-[var(--status-success)]/10 text-[var(--status-success)]",
      icone: CheckCircle2,
    };
  }

  return {
    classe:
      "border-[var(--status-info)]/25 bg-[var(--status-info)]/10 text-[var(--status-info)]",
    icone: ReceiptText,
  };
}

function obterTipoVisual(tipo: string) {
  const normalizado = tipo.trim().toLocaleLowerCase("pt-BR");

  if (normalizado === "atraso") {
    return "border-none bg-[var(--status-warning)]/10 text-[var(--status-warning)]";
  }

  if (normalizado === "depredação" || normalizado === "depredacao") {
    return "border-none bg-[var(--status-danger)]/10 text-[var(--status-danger)]";
  }

  if (normalizado === "extravio") {
    return "border-none bg-[var(--status-info)]/10 text-[var(--status-info)]";
  }

  return "border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]";
}

export default function MultasPage() {
  const [dados, setDados] = useState<MultasResponse | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [salvando, setSalvando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [formulario, setFormulario] =
    useState<FormularioMulta>(FORMULARIO_INICIAL);

  const [multaParaCancelar, setMultaParaCancelar] = useState<MultaView | null>(
    null,
  );

  const carregarMultas = useCallback(
    async (filtrosAtuais: Filtros = FILTROS_INICIAIS) => {
      setCarregando(true);
      setErro("");

      try {
        const params = new URLSearchParams();

        if (filtrosAtuais.usuario.trim()) {
          params.set("usuario", filtrosAtuais.usuario.trim());
        }

        if (filtrosAtuais.data) {
          params.set("data", filtrosAtuais.data);
        }

        if (filtrosAtuais.status) {
          params.set("status", filtrosAtuais.status);
        }

        if (filtrosAtuais.tipo) {
          params.set("tipo", filtrosAtuais.tipo);
        }

        const queryString = params.toString();

        const resposta = await fetch(
          `/api/multas${queryString ? `?${queryString}` : ""}`,
        );

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar as multas.");
        }

        const resultado: MultasResponse = await resposta.json();

        setDados(resultado);
      } catch (error) {
        console.error("Erro ao carregar multas:", error);
        setErro("Não foi possível carregar as multas. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void carregarMultas(FILTROS_INICIAIS);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [carregarMultas]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [dados?.multas]);

  function atualizarTipo(tipo: string) {
    const inicio = obterDataAtual();
    const prazo = obterPrazo(tipo);

    setFormulario((anterior) => ({
      ...anterior,
      tipo,
      inicio,
      termino: prazo ? obterDataFinal(inicio, prazo) : "",
    }));
  }

  function abrirCadastro() {
    setFormulario({
      ...FORMULARIO_INICIAL,
      inicio: obterDataAtual(),
    });

    setMostrarCadastro(true);
  }

  function fecharCadastro() {
    if (salvando) return;

    setMostrarCadastro(false);
    setFormulario(FORMULARIO_INICIAL);
  }

  async function atualizarFiltro(campo: keyof Filtros, valor: string) {
    const proximosFiltros = { ...filtros, [campo]: valor };

    setFiltros(proximosFiltros);

    // Os filtros de data, status e tipo atualizam os resultados imediatamente.
    if (campo === "data" || campo === "status" || campo === "tipo") {
      await carregarMultas(proximosFiltros);
    }
  }

  async function buscarMultas(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    setPaginaAtual(1);
    await carregarMultas(filtros);
  }

  async function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
    setPaginaAtual(1);
    await carregarMultas(FILTROS_INICIAIS);
  }

  async function cadastrarMulta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formulario.frequentadorId || !formulario.tipo) {
      setErro("Selecione o frequentador e o tipo da multa.");
      return;
    }

    if (!formulario.inicio || !formulario.termino) {
      setErro("Informe as datas de início e término.");
      return;
    }

    if (formulario.termino < formulario.inicio) {
      setErro("A data de término não pode ser anterior à data de início.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const resposta = await fetch("/api/multas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dta_inicio_multa: formulario.inicio,
          dta_termino_multa: formulario.termino,
          tipomulta: formulario.tipo,
          fk_frequentador_id_frequentador: formulario.frequentadorId,
        }),
      });

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(resultado?.erro ?? "Erro ao cadastrar a multa.");
        return;
      }

      setMostrarCadastro(false);
      setFormulario(FORMULARIO_INICIAL);
      setPaginaAtual(1);

      await carregarMultas(filtros);
    } catch (error) {
      console.error("Erro ao cadastrar multa:", error);
      setErro("Não foi possível cadastrar a multa. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirConfirmacaoCancelamento(multa: MultaView) {
    setMultaParaCancelar(multa);
  }

  function fecharConfirmacaoCancelamento() {
    if (cancelando) return;

    setMultaParaCancelar(null);
  }

  async function confirmarCancelamento() {
    if (!multaParaCancelar || cancelando) return;

    setCancelando(true);
    setErro("");

    try {
      const resposta = await fetch("/api/multas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_multa: multaParaCancelar.id,
        }),
      });

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(resultado?.erro ?? "Erro ao cancelar a multa.");
        return;
      }

      setMultaParaCancelar(null);
      await carregarMultas(filtros);
    } catch (error) {
      console.error("Erro ao cancelar multa:", error);
      setErro("Não foi possível cancelar a multa. Tente novamente.");
    } finally {
      setCancelando(false);
    }
  }

  const multasFormatadas = dados?.multas ?? [];

  const totalPaginas = Math.ceil(multasFormatadas.length / MULTAS_POR_PAGINA);

  const paginaSegura = Math.min(paginaAtual, Math.max(totalPaginas, 1));

  const inicioLista = (paginaSegura - 1) * MULTAS_POR_PAGINA;

  const multasDaPagina = multasFormatadas.slice(
    inicioLista,
    inicioLista + MULTAS_POR_PAGINA,
  );

  const atrasosAtivos = dados?.totais.atraso ?? 0;
  const depredacoesAtivas = dados?.totais.depredacao ?? 0;
  const extraviosAtivos = dados?.totais.extravio ?? 0;

  const filtrosAtivos = Boolean(
    filtros.usuario.trim() ||
    filtros.data ||
    filtros.tipo ||
    filtros.status !== "Pendente",
  );

  const modalAberto = mostrarCadastro || Boolean(multaParaCancelar);

  return (
    <main className="min-w-0 flex-1 overflow-x-clip bg-[var(--app-background)] px-3 py-5 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold leading-tight min-[375px]:text-3xl sm:text-4xl">
              Gerenciamento de multas
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Consulte as penalidades, acompanhe os prazos e gerencie as multas
              dos frequentadores.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirCadastro}
            className={`${botaoPrimario} w-full shrink-0 sm:w-auto`}
          >
            <ReceiptText size={18} aria-hidden="true" />
            Cadastrar nova multa
          </button>
        </header>

        {/* Mensagem global */}
        {erro && !mostrarCadastro && (
          <div
            role="alert"
            className="flex min-w-0 items-start gap-3 rounded-[var(--radius-card)] border-none bg-[var(--surface)] p-4 text-sm text-[var(--status-danger)] shadow-[var(--shadow-card)]"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />

            <div className="min-w-0 flex-1 break-words">{erro}</div>

            <button
              type="button"
              onClick={() => setErro("")}
              aria-label="Fechar mensagem"
              className="shrink-0 rounded-lg p-1 transition hover:bg-[var(--surface-hover)]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Indicadores */}
        <section
          aria-label="Resumo das multas ativas"
          className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3"
        >
          <article className="flex min-w-0 items-center gap-4 rounded-[var(--radius-card)] border-2 border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--status-warning)]/10 text-[var(--status-warning)] sm:h-14 sm:w-14">
              <Clock size={25} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
                Multas de atraso
              </p>

              <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {atrasosAtivos}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">Ativas</p>
            </div>
          </article>

          <article className="flex min-w-0 items-center gap-4 rounded-[var(--radius-card)] border-2 border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--status-danger)]/10 text-[var(--status-danger)] sm:h-14 sm:w-14">
              <ShieldAlert size={25} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
                Multas de depredação
              </p>

              <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {depredacoesAtivas}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">Ativas</p>
            </div>
          </article>

          <article className="flex min-w-0 items-center gap-4 rounded-[var(--radius-card)] border-2 border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:col-span-2 sm:p-5 lg:col-span-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--status-info)]/10 text-[var(--status-info)] sm:h-14 sm:w-14">
              <ReceiptText size={25} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
                Multas de extravio
              </p>

              <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {extraviosAtivos}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">Ativas</p>
            </div>
          </article>
        </section>

        <section className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold sm:text-xl">
                  Pesquisar multas
                </h2>

                <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                  Encontre multas por frequentador, data, tipo ou status.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarFiltros((anterior) => !anterior)}
              aria-expanded={mostrarFiltros}
              className={`${botaoSecundario} shrink-0 px-3 sm:hidden`}
            >
              <Filter size={17} aria-hidden="true" />
              <span className="sr-only">
                {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
              </span>
            </button>
          </div>

          <form onSubmit={buscarMultas} className="min-w-0 space-y-4">
            <div className="min-w-0">
              <label
                htmlFor="pesquisa-usuario"
                className="mb-1.5 block text-sm font-semibold"
              >
                Nome do frequentador
              </label>

              <div className="group flex min-w-0 items-center rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] transition focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-10 shrink-0 items-center justify-center text-[var(--text-muted)]"
                >
                  <Search size={18} />
                </span>
                <input
                  id="pesquisa-usuario"
                  type="search"
                  value={filtros.usuario}
                  onChange={(event) =>
                    void atualizarFiltro("usuario", event.target.value)
                  }
                  placeholder="Digite o nome do frequentador..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:px-4"
                />
              </div>
            </div>

            <div
              className={`min-w-0 grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 ${
                mostrarFiltros ? "grid" : "hidden sm:grid"
              }`}
            >
              <div className="min-w-0">
                <label
                  htmlFor="filtro-data"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Data
                </label>

                <input
                  id="filtro-data"
                  type="date"
                  value={filtros.data}
                  onChange={(event) =>
                    void atualizarFiltro("data", event.target.value)
                  }
                  className={campoClasse}
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="filtro-tipo"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Tipo da multa
                </label>

                <select
                  id="filtro-tipo"
                  value={filtros.tipo}
                  onChange={(event) =>
                    void atualizarFiltro("tipo", event.target.value)
                  }
                  className={campoClasse}
                >
                  <option value="">Todos os tipos</option>
                  <option value="ATRASO">Atraso</option>
                  <option value="DEPREDAÇÃO">Depredação</option>
                  <option value="EXTRAVIO">Extravio</option>
                </select>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="filtro-status"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Status
                </label>

                <select
                  id="filtro-status"
                  value={filtros.status}
                  onChange={(event) =>
                    void atualizarFiltro("status", event.target.value)
                  }
                  className={campoClasse}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Concluída">Concluída</option>
                  <option value="">Todos os status</option>
                </select>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 border-[var(--border-default)] pt-4 sm:flex-row sm:items-center">
              <div className="flex w-full min-w-0 gap-2 sm:flex-1">
                <button type="submit" className={`${botaoPrimario} flex-[8]`}>
                  <Search size={17} aria-hidden="true" />
                  Pesquisar
                </button>

                <button
                  type="button"
                  onClick={limparFiltros}
                  className={`${botaoSecundario} flex-[2]`}
                >
                  Limpar filtros
                </button>
              </div>

              {filtrosAtivos && (
                <span className="text-xs text-[var(--text-secondary)] sm:ml-auto">
                  Há filtros personalizados aplicados.
                </span>
              )}
            </div>
          </form>
        </section>

        <section className="min-w-0 space-y-4">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">
                Multas cadastradas
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {multasFormatadas.length === 1
                  ? "1 multa encontrada"
                  : `${multasFormatadas.length} multas encontradas`}
              </p>
            </div>

            {!carregando && multasFormatadas.length > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                Exibindo {inicioLista + 1}–
                {Math.min(
                  inicioLista + MULTAS_POR_PAGINA,
                  multasFormatadas.length,
                )}{" "}
                de {multasFormatadas.length}
              </p>
            )}
          </div>

          {carregando ? (
            <div
              role="status"
              className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-card)]"
            >
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--button-primary)]" />

              <p className="text-sm text-[var(--text-secondary)]">
                Carregando multas...
              </p>
            </div>
          ) : erro ? (
            <div
              role="alert"
              className="flex min-w-0 flex-col items-center gap-3 rounded-[var(--radius-card)] border-none bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]"
            >
              <AlertCircle
                size={30}
                className="text-[var(--status-danger)]"
                aria-hidden="true"
              />

              <p className="text-sm text-[var(--text-secondary)]">
                Não foi possível exibir as multas.
              </p>

              <button
                type="button"
                onClick={() => void carregarMultas(filtros)}
                className={botaoSecundario}
              >
                Tentar novamente
              </button>
            </div>
          ) : multasDaPagina.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-card)]">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md">
                <ReceiptText
                  size={25}
                  className="text-[var(--text-secondary)]"
                  aria-hidden="true"
                />
              </div>

              <h3 className="font-semibold">Nenhuma multa encontrada</h3>

              <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
                Não há multas que correspondam aos filtros selecionados. Você
                pode limpar os filtros ou cadastrar uma nova multa.
              </p>

              <button
                type="button"
                onClick={limparFiltros}
                className={`${botaoSecundario} mt-4`}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
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
                    <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:p-6">
                      <div className="flex min-w-0 flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[var(--text-inverse)] bg-[var(--brand-500)]">
                            <UserRound size={20} aria-hidden="true" />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words font-bold sm:text-lg">
                              {multa.usuario}
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              Multa #{multa.id}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit max-w-full shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusVisual.classe}`}
                        >
                          <IconeStatus size={14} aria-hidden="true" />
                          {multa.status}
                        </span>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-secondary)]">
                            Tipo da multa
                          </p>

                          <p
                            className={`mt-1 inline-flex max-w-full break-words rounded-full border px-3 py-1 text-sm font-semibold ${tipoVisual}`}
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

                      {multa.status === "Pendente" && (
                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => abrirConfirmacaoCancelamento(multa)}
                            className="inline-flex hover:cursor-pointer min-h-11 bg-[var(--button-primary)] mt-2 w-full min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                          >
                            <Trash2 size={17} aria-hidden="true" />
                            Cancelar multa
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!carregando && totalPaginas > 1 && (
            <Pagination
              currentPage={paginaSegura}
              totalPages={totalPaginas}
              startItem={inicioLista + 1}
              endItem={Math.min(
                inicioLista + MULTAS_POR_PAGINA,
                multasFormatadas.length,
              )}
              totalItems={multasFormatadas.length}
              itemLabel="multas"
              ariaLabel="Paginação das multas"
              onPageChange={setPaginaAtual}
            />
          )}
        </section>
      </div>

      {/* Modal de cadastro */}
      {mostrarCadastro && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharCadastro();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cadastro-multa"
            className={modalClasse}
          >
            <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-warm)]">
                  <ReceiptText size={22} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-cadastro-multa"
                    className="break-words text-lg font-bold sm:text-xl"
                  >
                    Cadastrar nova multa
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Preencha os dados da penalidade.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharCadastro}
                disabled={salvando}
                aria-label="Fechar cadastro"
                className="shrink-0 rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {erro && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-md border-none bg-[var(--status-danger)]/5 p-3 text-sm text-[var(--status-danger)]"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />

                <p className="min-w-0 break-words">{erro}</p>
              </div>
            )}

            <form onSubmit={cadastrarMulta} className="min-w-0 space-y-4">
              <div className="min-w-0">
                <label
                  htmlFor="frequentador-multa"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Frequentador
                </label>

                <select
                  id="frequentador-multa"
                  required
                  value={formulario.frequentadorId}
                  onChange={(event) =>
                    setFormulario((anterior) => ({
                      ...anterior,
                      frequentadorId: event.target.value,
                    }))
                  }
                  className={campoClasse}
                >
                  <option value="">Selecione o frequentador</option>

                  {(dados?.frequentadores ?? []).map((frequentador) => (
                    <option
                      key={frequentador.id_freq}
                      value={frequentador.id_freq}
                    >
                      {frequentador.nome_freq}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="tipo-multa"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Tipo da multa
                </label>

                <select
                  id="tipo-multa"
                  required
                  value={formulario.tipo}
                  onChange={(event) => atualizarTipo(event.target.value)}
                  className={campoClasse}
                >
                  <option value="">Selecione o tipo</option>

                  {(dados?.tiposCadastro ?? []).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 min-[400px]:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="inicio-multa"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Data de início
                  </label>

                  <input
                    id="inicio-multa"
                    required
                    readOnly
                    type="date"
                    value={formulario.inicio}
                    className={`${campoClasse} bg-[var(--surface-warm)] hover:cursor-not-allowed`}
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="termino-multa"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Data de término
                  </label>

                  <input
                    id="termino-multa"
                    required
                    readOnly={Boolean(obterPrazo(formulario.tipo))}
                    min={formulario.inicio || undefined}
                    type="date"
                    value={formulario.termino}
                    onChange={(event) =>
                      setFormulario((anterior) => ({
                        ...anterior,
                        termino: event.target.value,
                      }))
                    }
                    className={`${campoClasse} ${
                      obterPrazo(formulario.tipo)
                        ? "bg-[var(--surface-warm)]"
                        : ""
                    }`}
                  />
                </div>
              </div>

              {formulario.tipo && (
                <div className="flex min-w-0 items-start gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-warm)] p-3 text-sm text-[var(--text-secondary)]">
                  <CalendarDays
                    size={18}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="min-w-0 leading-relaxed">
                    {obterPrazo(formulario.tipo) > 0
                      ? `O prazo de ${obterPrazo(formulario.tipo)} dias é calculado automaticamente para este tipo de multa.`
                      : "Confira a data de término antes de cadastrar a multa."}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-[var(--border-default)] pt-4 min-[400px]:flex-row min-[400px]:justify-end">
                <button
                  type="button"
                  onClick={fecharCadastro}
                  disabled={salvando}
                  className={`${botaoSecundario} w-full min-[400px]:w-auto`}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className={`${botaoPrimario} w-full min-[400px]:w-auto`}
                >
                  {salvando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} aria-hidden="true" />
                      Cadastrar multa
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {multaParaCancelar && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharConfirmacaoCancelamento();
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-cancelar-multa"
            aria-describedby="descricao-cancelar-multa"
            className={modalClasse}
          >
            <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-none bg-[var(--status-danger)]/10 text-[var(--status-danger)]">
                  <AlertCircle size={23} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-cancelar-multa"
                    className="break-words text-lg font-bold sm:text-xl"
                  >
                    Cancelar multa
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Confirme se deseja continuar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharConfirmacaoCancelamento}
                disabled={cancelando}
                aria-label="Fechar confirmação"
                className="shrink-0 rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="rounded-md border border-[var(--border-default)] bg-[var(--surface)] p-3 sm:p-4">
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  Multa selecionada
                </p>

                <p className="mt-1 break-words font-bold">
                  {multaParaCancelar.usuario}
                </p>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Multa #{multaParaCancelar.id}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterTipoVisual(multaParaCancelar.tipo)}`}
                  >
                    {multaParaCancelar.tipo}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterStatusVisual(multaParaCancelar.status).classe}`}
                  >
                    {multaParaCancelar.status}
                  </span>
                </div>
              </div>

              <p
                id="descricao-cancelar-multa"
                className="text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                Tem certeza de que deseja cancelar esta multa? A operação será
                enviada ao sistema e poderá alterar a situação da penalidade.
              </p>
            </div>

            {erro && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-md border-none bg-[var(--status-danger)]/5 p-3 text-sm text-[var(--status-danger)]"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />

                <p className="min-w-0 break-words">{erro}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 min-[400px]:flex-row min-[400px]:justify-end">
              <button
                type="button"
                onClick={fecharConfirmacaoCancelamento}
                disabled={cancelando}
                className={`${botaoSecundario} w-full min-[400px]:w-auto`}
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={confirmarCancelamento}
                disabled={cancelando}
                className="inline-flex min-h-11 w-full hover:cursor-pointer min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--status-danger)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:w-auto"
              >
                {cancelando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} aria-hidden="true" />
                    Confirmar cancelamento
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
