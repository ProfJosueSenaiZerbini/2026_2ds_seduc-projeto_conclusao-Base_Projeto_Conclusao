"use client";

import { useCallback, useEffect, useState } from "react";

import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type MultaView = {
  id: number;
  usuario: string;
  diasPunicao: number;
  status: string;
  tipo: string;
  data: string;
};

type MultasResponse = {
  multas: MultaView[];
  frequentadores: { id_freq: number; nome_freq: string }[];
  bibliotecarios: {
    id_bibliotecario: number;
    nome_bibliotecario: string;
  }[];
  tipos: string[];
  totais: {
    atraso: number;
    depredacao: number;
    extravio: number;
  };
};

export default function MultasPage() {
  const [dados, setDados] = useState<MultasResponse | null>(null);
  const [erro, setErro] = useState("");
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtros, setFiltros] = useState({
    usuario: "",
    data: "",
    status: "Pendente",
    tipo: "",
  });
  const [formulario, setFormulario] = useState({
    frequentadorId: "",
    bibliotecarioId: "",
    tipo: "",
    inicio: "",
    termino: "",
  });

  function obterDataAtual() {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    const dia = String(dataAtual.getDate()).padStart(2, "0");
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

  function atualizarTipo(tipo: string) {
    const inicio = obterDataAtual();
    const prazo = tipo === "DEPREDAÇÃO" ? 15 : tipo === "EXTRAVIO" ? 30 : 0;

    setFormulario({
      ...formulario,
      tipo,
      inicio,
      termino: prazo ? obterDataFinal(inicio, prazo) : "",
    });
  }

  const carregarMultas = useCallback(async (filtrosAtuais = { usuario: "", data: "", status: "Pendente", tipo: "" }) => {
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
      const resposta = await fetch(`/api/multas${queryString ? `?${queryString}` : ""}`);

      if (!resposta.ok) throw new Error("Não foi possível carregar as multas.");

      const resultado = await resposta.json();
      setDados(resultado);
      setErro("");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar as multas.");
    }
  }, []);

  useEffect(() => {
    const carregarDadosIniciais = () => {
      void carregarMultas({ usuario: "", data: "", status: "Pendente", tipo: "" });
    };

    const timeoutId = setTimeout(carregarDadosIniciais, 0);
    return () => clearTimeout(timeoutId);
  }, [carregarMultas]);

  async function atualizarFiltro(campo: "usuario" | "data" | "status" | "tipo", valor: string) {
    const proximoFiltro = { ...filtros, [campo]: valor };
    setFiltros(proximoFiltro);

    if (campo === "data" || campo === "status" || campo === "tipo") {
      await carregarMultas(proximoFiltro);
    }
  }

  async function buscarMultas(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await carregarMultas(filtros);
  }

  async function limparFiltros() {
    const filtrosVazios = { usuario: "", data: "", status: "Pendente", tipo: "" };
    setFiltros(filtrosVazios);
    await carregarMultas(filtrosVazios);
  }

  async function cancelarMulta(idMulta: number) {
    const resposta = await fetch("/api/multas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_multa: idMulta }),
    });

    if (!resposta.ok) {
      const resultado = await resposta.json().catch(() => null);
      alert(resultado?.erro ?? "Erro ao cancelar a multa.");
      return;
    }

    await carregarMultas(filtros);
  }

  async function cadastrarMulta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);

    try {
      const resposta = await fetch("/api/multas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dta_inicio_multa: formulario.inicio,
          dta_termino_multa: formulario.termino,
          tipomulta: formulario.tipo,
          fk_bibliotecario_id_bibliotecario: formulario.bibliotecarioId,
          fk_frequentador_id_frequentador: formulario.frequentadorId,
        }),
      });

      const resultado = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        alert(resultado?.erro ?? "Erro ao cadastrar a multa.");
        return;
      }

      setFormulario({ frequentadorId: "", bibliotecarioId: "", tipo: "", inicio: "", termino: "" });
      setMostrarCadastro(false);
      await carregarMultas(filtros);
    } finally {
      setSalvando(false);
    }
  }

  const multasFormatadas = dados?.multas ?? [];
  const atrasosAtivos = dados?.totais.atraso ?? 0;
  const depredacoesAtivas = dados?.totais.depredacao ?? 0;
  const extraviosAtivos = dados?.totais.extravio ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Nav />

        <main
          className="
            min-w-0
            flex-1
            p-3
            sm:p-5
            md:p-6
            lg:p-8
            xl:p-10
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-7xl
              space-y-6
              sm:space-y-8
            "
          >
            <section
              className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl bg-brand-500 p-3 text-center text-text-inverse shadow-md sm:min-h-[140px] sm:p-4 lg:min-h-[160px]">
                <h2 className="max-w-xs font-semibold leading-snug sm:text-base lg:text-lg">
                  Multas de Atraso
                  <br />
                  Ativas:
                </h2>
                <span className="mt-1 text-3xl font-bold md:text-4xl xl:text-5xl">
                  {atrasosAtivos}
                </span>
              </div>

              <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl bg-brand-500 p-3 text-center text-text-inverse shadow-md sm:min-h-[140px] sm:p-4 lg:min-h-[160px]">
                <h2 className="max-w-xs font-semibold leading-snug sm:text-base lg:text-lg">
                  Multas de Depredação
                  <br />
                  Ativas:
                </h2>
                <span className="mt-1 text-3xl font-bold md:text-4xl xl:text-5xl">
                  {depredacoesAtivas}
                </span>
              </div>

              <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl bg-brand-500 p-3 text-center text-text-inverse shadow-md sm:min-h-[140px] sm:p-4 lg:min-h-[160px]">
                <h2 className="max-w-xs font-semibold leading-snug sm:text-base lg:text-lg">
                  Multas de Extravio
                  <br />
                  Ativas:
                </h2>
                <span className="mt-1 text-3xl font-bold md:text-4xl xl:text-5xl">
                  {extraviosAtivos}
                </span>
              </div>
            </section>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const inicio = obterDataAtual();
                  setFormulario({
                    frequentadorId: "",
                    bibliotecarioId: "",
                    tipo: "",
                    inicio,
                    termino: "",
                  });
                  setMostrarCadastro(true);
                }}
                className="w-full max-w-md rounded-2xl bg-[var(--color-button-primary)] px-6 py-3 text-base font-bold text-text-inverse shadow-md transition hover:brightness-110 hover:shadow-lg active:scale-[0.98] sm:py-4 sm:text-lg"
              >
                Cadastrar Nova Multa
              </button>
            </div>

            {mostrarCadastro && (
              <div className="rounded-3xl bg-brand-200 p-4 shadow-sm sm:p-5 md:p-6 lg:p-8">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-(--color-text-primary) sm:text-2xl">
                    Cadastrar Nova Multa
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMostrarCadastro(false)}
                    className="rounded-xl px-3 py-2 font-bold text-brand-600 hover:bg-brand-100"
                  >
                    Fechar
                  </button>
                </div>

                <form onSubmit={cadastrarMulta} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 font-semibold text-brand-600">
                    Usuário
                    <select required value={formulario.frequentadorId} onChange={(event) => setFormulario({ ...formulario, frequentadorId: event.target.value })} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                      <option value="">Selecione o usuário</option>
                      {dados?.frequentadores.map((frequentador) => (
                        <option key={frequentador.id_freq} value={frequentador.id_freq}>{frequentador.nome_freq}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 font-semibold text-brand-600">
                    Bibliotecário
                    <select required value={formulario.bibliotecarioId} onChange={(event) => setFormulario({ ...formulario, bibliotecarioId: event.target.value })} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                      <option value="">Selecione o bibliotecário</option>
                      {dados?.bibliotecarios.map((bibliotecario) => (
                        <option key={bibliotecario.id_bibliotecario} value={bibliotecario.id_bibliotecario}>{bibliotecario.nome_bibliotecario}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 font-semibold text-brand-600">
                    Tipo da multa
                    <select required value={formulario.tipo} onChange={(event) => atualizarTipo(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
                      <option value="">Selecione o tipo</option>
                      {(dados?.tipos ?? []).map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 font-semibold text-brand-600">
                    Data de início
                    <input required readOnly type="date" value={formulario.inicio} className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3" />
                  </label>

                  <label className="flex flex-col gap-2 font-semibold text-brand-600">
                    Data de término
                    <input required readOnly={formulario.tipo === "DEPREDAÇÃO" || formulario.tipo === "EXTRAVIO"} type="date" value={formulario.termino} onChange={(event) => setFormulario({ ...formulario, termino: event.target.value })} className={`rounded-xl border border-gray-300 px-4 py-3 ${formulario.tipo === "DEPREDAÇÃO" || formulario.tipo === "EXTRAVIO" ? "bg-gray-100" : "bg-white"}`} />
                    {(formulario.tipo === "DEPREDAÇÃO" || formulario.tipo === "EXTRAVIO") && (
                      <span className="text-sm font-normal text-brand-600">
                        Prazo automático: {formulario.tipo === "DEPREDAÇÃO" ? "15" : "30"} dias.
                      </span>
                    )}
                  </label>

                  <button type="submit" disabled={salvando} className="self-end rounded-xl bg-[var(--color-button-primary)] px-4 py-3 font-bold text-text-inverse disabled:opacity-60">
                    {salvando ? "Cadastrando..." : "Cadastrar multa"}
                  </button>
                </form>
              </div>
            )}

            <section className="rounded-3xl bg-brand-200 p-4 shadow-sm sm:p-5 md:p-6 lg:p-8">
              <h1 className="mb-5 text-xl font-bold text-(--color-text-primary) sm:text-2xl lg:text-3xl">
                Pesquisar por Multas
              </h1>

              <form onSubmit={buscarMultas} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={filtros.usuario}
                    onChange={(event) => atualizarFiltro("usuario", event.target.value)}
                    placeholder="Nome do Usuário"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-3 text-brand-600 placeholder:text-brand-600/50 outline-none focus:ring-2 focus:ring-brand-500 sm:py-4"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    type="date"
                    value={filtros.data}
                    onChange={(event) => void atualizarFiltro("data", event.target.value)}
                    placeholder="Por data"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-3 text-brand-600 placeholder:text-brand-600/50 outline-none focus:ring-2 focus:ring-brand-500 sm:py-4"
                  />

                  <select
                    value={filtros.tipo}
                    onChange={(event) => void atualizarFiltro("tipo", event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-gray-300 bg-white px-5 py-3 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer sm:py-4"
                    aria-label="Filtrar por tipo de multa"
                  >
                    <option value="" disabled hidden>
                      Tipo de multas
                    </option>
                    <option value="ATRASO">Atrasado</option>
                    <option value="DEPREDAÇÃO">Depreciação</option>
                    <option value="EXTRAVIO">Extraviado</option>
                  </select>

                  <select
                    value={filtros.status}
                    onChange={(event) => void atualizarFiltro("status", event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-gray-300 bg-white px-5 py-3 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer sm:py-4"
                    aria-label="Filtrar por status"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="rounded-2xl bg-[var(--color-button-primary)] px-5 py-3 font-bold text-text-inverse shadow-md transition hover:brightness-110 sm:py-4"
                  >
                    Pesquisar
                  </button>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="rounded-2xl bg-[var(--color-button-secondary)] px-5 py-3 font-bold text-text-inverse shadow-md transition hover:brightness-110 sm:py-4"
                  >
                    Limpar
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-col gap-4">
                {erro && (
                  <div className="py-8 text-center text-base text-text-inverse">
                    {erro}
                  </div>
                )}

                {multasFormatadas.map((multa) => (
                  <div key={multa.id} className="grid grid-cols-1 gap-5 rounded-2xl bg-brand-400 px-4 py-4 text-sm font-bold text-text-inverse sm:px-5 sm:py-5 sm:text-base lg:px-8 lg:py-6 md:grid-cols-2 md:gap-8 lg:gap-12">

                    <div className="space-y-2">
                      <p className="text-lg">{multa.usuario}</p>
                      <p>Dias de punição: {multa.diasPunicao} dias</p>
                      <p>Status da Multa: {multa.status}</p>
                    </div>

                    <div className="space-y-2">
                      <p>Tipo da Multa: {multa.tipo}</p>
                      <p>Data da Multa: {multa.data}</p>
                    </div>

                    {multa.status !== "Cancelada" && (
                      <button
                        type="button"
                        onClick={() => cancelarMulta(multa.id)}
                        className="col-span-1 w-full rounded-xl bg-[var(--color-button-secondary)] px-4 py-3 text-sm font-bold text-text-inverse transition hover:brightness-110 active:scale-[0.99] md:col-span-2 sm:py-4 sm:text-base"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                ))}

                {multasFormatadas.length === 0 && (
                  <div className="py-8 text-center text-base text-text-inverse">
                    Nenhuma multa encontrada.
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}