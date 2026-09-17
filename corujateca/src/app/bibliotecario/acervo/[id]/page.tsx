"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type Livro = {
  id_livro: number;
  titulo_livro?: string;
  titulo?: string;
  autor_livro?: string;
  autor?: string;
  genero_livro?: string;
  genero?: string;
  cor_genero?: string | null;
  editora_livro?: string;
  editora?: string;
  anopub_livro?: number;
  ano_publicacao?: number;
  ano?: number;
  qtd_paginas?: number;
  paginas?: number;
  qtd_copias?: number;
  copias?: number;
  status_livro?: string;
  status?: string;
  localizacao_livro?: string;
  localizacao?: string;
  sinopse_livro?: string;
  sinopse?: string;
  imgcapa_livro?: string | null;
  capa?: string | null;
};

type Frequentador = {
  id: number;
  nome: string;
  inativo?: boolean;
  suspenso?: boolean;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const coresGenero: Record<string, string> = {
  romance: "var(--color-romance)",
  religião: "var(--color-religion-mythology)",
  religiao: "var(--color-religion-mythology)",
  mitologia: "var(--color-religion-mythology)",
  "religião e mitologia": "var(--color-religion-mythology)",
  "religiao e mitologia": "var(--color-religion-mythology)",
  "ficção científica": "var(--color-science-fiction)",
  "ficcao cientifica": "var(--color-science-fiction)",
  "arte e cultura": "var(--color-art-culture)",
  fantasia: "var(--color-fantasy)",
  biografias: "var(--color-biographies-memoirs)",
  memórias: "var(--color-biographies-memoirs)",
  memorias: "var(--color-biographies-memoirs)",
  thriller: "var(--color-thriller-mystery)",
  mistério: "var(--color-thriller-mystery)",
  misterio: "var(--color-thriller-mystery)",
  "quadrinhos e mangá": "var(--color-comics-manga)",
  "quadrinhos e manga": "var(--color-comics-manga)",
  terror: "var(--color-horror)",
  infantojuvenil: "var(--color-children-young-adult)",
  aventura: "var(--color-adventure)",
  "ciência e conhecimento": "var(--color-science-knowledge)",
  "ciencia e conhecimento": "var(--color-science-knowledge)",
  "poesia e crônicas": "var(--color-poetry-chronicles)",
  "poesia e cronicas": "var(--color-poetry-chronicles)",
  história: "var(--color-history)",
  historia: "var(--color-history)",
  "guia, manual e gastronomia": "var(--color-guide-manual-gastronomy)",
  política: "var(--color-politics)",
  politica: "var(--color-politics)",
  "autoajuda e desenvolvimento pessoal":
    "var(--color-selfHelp-personal-development)",
  economia: "var(--color-economy)",
  literatura: "var(--color-literature)",
};

export default function DetalhesLivroBibPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const [livro, setLivro] = useState<Livro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Estados dos Modais
  const [modalEmprestimoAberto, setModalEmprestimoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Lista de Frequentadores do Banco
  const [listaFrequentadores, setListaFrequentadores] = useState<Frequentador[]>([]);

  // Formulário do Empréstimo
  const [idFrequentadorSelecionado, setIdFrequentadorSelecionado] = useState("");
  const [senhaFrequentador, setSenhaFrequentador] = useState("");
  const [prazoDias, setPrazoDias] = useState<number>(15);
  const [dataEmprestimo, setDataEmprestimo] = useState("");
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [enviandoEmprestimo, setEnviandoEmprestimo] = useState(false);

  // Formulário de Edição do Livro
  const [formLivro, setFormLivro] = useState({
    titulo: "",
    autor: "",
    genero: "",
    editora: "",
    ano: "",
    paginas: "",
    copias: "",
    localizacao: "",
    sinopse: "",
    capa: "",
  });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  function calcularDataDevolucao(dataInicialStr: string, dias: number) {
    if (!dataInicialStr) return "";
    const data = new Date(dataInicialStr + "T00:00:00");
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  async function carregarFrequentadores() {
    try {
      const res = await fetch("/api/frequentador");
      if (res.ok) {
        const dados = await res.json();
        setListaFrequentadores(Array.isArray(dados) ? dados : []);
      }
    } catch (e) {
      console.error("Erro ao carregar frequentadores:", e);
    }
  }

  function abrirModalEmprestimo() {
    const copiasDisponiveis = livro?.qtd_copias ?? livro?.copias ?? 0;
    if (copiasDisponiveis <= 0) {
      alert("Aviso: Não há exemplares disponíveis para empréstimo no momento.");
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];
    setDataEmprestimo(hoje);
    setPrazoDias(15);
    setDataDevolucao(calcularDataDevolucao(hoje, 15));
    setIdFrequentadorSelecionado("");
    setSenhaFrequentador("");
    carregarFrequentadores();
    setModalEmprestimoAberto(true);
  }

  function handlePrazoChange(dias: number) {
    setPrazoDias(dias);
    setDataDevolucao(calcularDataDevolucao(dataEmprestimo, dias));
  }

  useEffect(() => {
    async function carregarLivro() {
      if (!id) return;

      try {
        setCarregando(true);
        setErro("");

        const res = await fetch(`/api/livros/${id}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar informações do livro.");
        }

        const dados = await res.json();
        const livroDados = dados.livro || dados;
        setLivro(livroDados);

        setFormLivro({
          titulo: livroDados.titulo_livro || livroDados.titulo || "",
          autor: livroDados.autor_livro || livroDados.autor || "",
          genero: livroDados.genero_livro || livroDados.genero || "",
          editora: livroDados.editora_livro || livroDados.editora || "",
          ano: (livroDados.anopub_livro || livroDados.ano_publicacao || livroDados.ano || "").toString(),
          paginas: (livroDados.qtd_paginas ?? livroDados.paginas ?? "").toString(),
          copias: (livroDados.qtd_copias ?? livroDados.copias ?? "").toString(),
          localizacao: livroDados.localizacao_livro || livroDados.localizacao || "",
          sinopse: livroDados.sinopse_livro || livroDados.sinopse || "",
          capa: livroDados.imgcapa_livro || livroDados.capa || "",
        });
      } catch (err) {
        console.error("Erro na requisição do livro:", err);
        setErro("Não foi possível carregar os dados deste livro.");
      } finally {
        setCarregando(false);
      }
    }

    carregarLivro();
  }, [id]);

  async function handleExcluirLivro() {
    if (!id) return;
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;

    try {
      const res = await fetch(`/api/livros/${id}/desativar`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("Livro excluído com sucesso!");
        window.location.href = "/bibliotecario/acervo";
      } else {
        const dadosErro = await res.json().catch(() => ({}));
        alert(dadosErro.erro || "Erro ao excluir o livro.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao excluir o livro.");
    }
  }

  async function handleCriarEmprestimo(e: React.FormEvent) {
    e.preventDefault();

    const copiasDisponiveis = livro?.qtd_copias ?? livro?.copias ?? 0;
    if (copiasDisponiveis <= 0) {
      alert("Não é possível realizar o empréstimo pois não há exemplares disponíveis.");
      return;
    }

    if (!idFrequentadorSelecionado) {
      alert("Por favor, selecione um frequentador.");
      return;
    }

    if (!senhaFrequentador) {
      alert("Por favor, digite a senha do frequentador.");
      return;
    }

    try {
      setEnviandoEmprestimo(true);

      const res = await fetch("/api/emprestimos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fk_frequentador_id_freq: Number(idFrequentadorSelecionado),
          fk_exemplar_id_exemplar: Number(id),
          prazo_dias: Number(prazoDias),
          senha: senhaFrequentador,
        }),
      });

      if (res.ok) {
        alert("Empréstimo cadastrado e realizado com sucesso!");
        setModalEmprestimoAberto(false);
        setIdFrequentadorSelecionado("");
        setSenhaFrequentador("");
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || err.erro || "Erro ao cadastrar empréstimo.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao cadastrar empréstimo.");
    } finally {
      setEnviandoEmprestimo(false);
    }
  }

  async function handleSalvarLivro(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvandoEdicao(true);

      const res = await fetch(`/api/livros/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo_livro: formLivro.titulo,
          autor_livro: formLivro.autor,
          genero_livro: formLivro.genero,
          editora_livro: formLivro.editora,
          anopub_livro: Number(formLivro.ano) || null,
          qtd_paginas: Number(formLivro.paginas) || null,
          qtd_copias: Number(formLivro.copias) || 0,
          localizacao_livro: formLivro.localizacao,
          sinopse_livro: formLivro.sinopse,
          imgcapa_livro: formLivro.capa,
        }),
      });

      if (res.ok) {
        alert("Livro atualizado com sucesso!");
        setModalEditarAberto(false);
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.erro || "Erro ao atualizar o livro.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao atualizar o livro.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  const titulo = livro?.titulo_livro || livro?.titulo;
  const autor = livro?.autor_livro || livro?.autor;
  const genero = livro?.genero_livro || livro?.genero;
  const editora = livro?.editora_livro || livro?.editora;
  const ano = livro?.anopub_livro || livro?.ano_publicacao || livro?.ano;
  const paginas = livro?.qtd_paginas ?? livro?.paginas;
  const copias = livro?.qtd_copias ?? livro?.copias ?? 0;
  const status = livro?.status_livro || livro?.status;
  const localizacao = livro?.localizacao_livro || livro?.localizacao;
  const sinopse = livro?.sinopse_livro || livro?.sinopse;
  const capa = livro?.imgcapa_livro || livro?.capa;

  const generoChave = genero?.trim().toLowerCase() ?? "";
  const corGenero =
    livro?.cor_genero || coresGenero[generoChave] || "var(--color-brand-500)";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      <div className="flex flex-1">
        <Nav />

        <main className="flex-1 min-w-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto bg-gray-100/85 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <Link
                href="/bibliotecario/acervo"
                className="inline-flex items-center text-black font-semibold text-base hover:opacity-75 transition-opacity"
              >
                ← Voltar
              </Link>
            </div>

            {carregando ? (
              <div className="p-12 text-center text-gray-600 animate-pulse font-medium">
                Carregando informações do livro...
              </div>
            ) : erro ? (
              <div className="p-12 text-center text-red-600 font-medium">
                {erro}
              </div>
            ) : livro ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-5 flex flex-col items-center gap-3">
                    <div className="w-full aspect-[3/4] bg-gray-400 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                      {capa ? (
                        <img
                          src={capa}
                          alt={titulo || "Capa do livro"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-700 font-medium">Sem Capa</span>
                      )}
                    </div>

                    <div className="w-full bg-[#3e3e3e] text-white text-center py-2 px-4 rounded-full font-bold text-xs uppercase tracking-wider">
                      {status || "Disponível"}
                    </div>
                  </div>

                  <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-black uppercase mb-2">
                        {titulo || "Título Indefinido"}
                      </h1>

                      {genero && (
                        <span
                          style={{ backgroundColor: corGenero }}
                          className="inline-block text-[var(--color-text-primary)] text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4 leading-none"
                        >
                          {genero}
                        </span>
                      )}

                      <div className="space-y-1.5 text-black text-sm md:text-base">
                        <p>
                          <span className="font-semibold">Autor:</span>{" "}
                          {autor || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Ano de publicação:</span>{" "}
                          {ano || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Quantidade de páginas:</span>{" "}
                          {paginas ?? "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Editora:</span>{" "}
                          {editora || "Não informada"}
                        </p>
                        <p>
                          <span className="font-semibold">Quantidade de cópias:</span>{" "}
                          <span className={copias === 0 ? "text-red-600 font-bold" : ""}>
                            {copias} {copias === 0 ? "(Indisponível)" : ""}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={abrirModalEmprestimo}
                        className="w-full text-center bg-gray-300 text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                      >
                        Criar Empréstimo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-black text-base pt-2">
                  <span className="font-semibold">Localização:</span>{" "}
                  {localizacao || "Não informada"}
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-black">Sinopse</h2>
                  <p className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-line">
                    {sinopse || "Nenhuma sinopse cadastrada para este livro."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalEditarAberto(true)}
                    className="w-full text-center bg-gray-300 text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                  >
                    Atualizar Livro
                  </button>

                  <button
                    type="button"
                    onClick={handleExcluirLivro}
                    className="w-full bg-gray-300 text-black font-semibold py-3 px-6 rounded-lg hover:bg-red-200 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Excluir Livro
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <Footer />

      {/* ==================== MODAL CRIAR EMPRÉSTIMO ==================== */}
      {modalEmprestimoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-black">Criar Empréstimo</h3>
              <button
                type="button"
                onClick={() => setModalEmprestimoAberto(false)}
                className="text-gray-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarEmprestimo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Livro:
                </label>
                <input
                  type="text"
                  disabled
                  value={titulo || ""}
                  className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Nome do Frequentador *
                </label>
                <select
                  required
                  value={idFrequentadorSelecionado}
                  onChange={(e) => setIdFrequentadorSelecionado(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="" disabled>
                    Selecione um frequentador...
                  </option>
                  {listaFrequentadores.map((freq) => (
                    <option key={freq.id} value={freq.id}>
                      {freq.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Senha do Frequentador *
                </label>
                <input
                  type="password"
                  required
                  value={senhaFrequentador}
                  onChange={(e) => setSenhaFrequentador(e.target.value)}
                  placeholder="Digite a senha do frequentador"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Data de Empréstimo
                </label>
                <input
                  type="date"
                  value={dataEmprestimo}
                  disabled
                  className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Prazo de Empréstimo
                </label>
                <select
                  value={prazoDias}
                  onChange={(e) => handlePrazoChange(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Data Limite de Devolução
                </label>
                <input
                  type="date"
                  value={dataDevolucao}
                  readOnly
                  className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-black font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEmprestimoAberto(false)}
                  className="w-1/2 py-2.5 bg-gray-200 text-black font-semibold rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoEmprestimo}
                  className="w-1/2 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {enviandoEmprestimo ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL ATUALIZAR LIVRO ==================== */}
      {modalEditarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-black">Atualizar Livro</h3>
              <button
                type="button"
                onClick={() => setModalEditarAberto(false)}
                className="text-gray-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarLivro} className="space-y-4 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={formLivro.titulo}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, titulo: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Autor</label>
                  <input
                    type="text"
                    required
                    value={formLivro.autor}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, autor: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Gênero</label>
                  <input
                    type="text"
                    value={formLivro.genero}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, genero: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Editora</label>
                  <input
                    type="text"
                    value={formLivro.editora}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, editora: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Ano</label>
                  <input
                    type="number"
                    value={formLivro.ano}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, ano: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Páginas</label>
                  <input
                    type="number"
                    value={formLivro.paginas}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, paginas: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Cópias</label>
                  <input
                    type="number"
                    value={formLivro.copias}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, copias: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Localização</label>
                  <input
                    type="text"
                    value={formLivro.localizacao}
                    onChange={(e) =>
                      setFormLivro({ ...formLivro, localizacao: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  URL da Capa
                </label>
                <input
                  type="text"
                  value={formLivro.capa}
                  onChange={(e) =>
                    setFormLivro({ ...formLivro, capa: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Sinopse</label>
                <textarea
                  rows={4}
                  value={formLivro.sinopse}
                  onChange={(e) =>
                    setFormLivro({ ...formLivro, sinopse: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
                  className="w-1/2 py-2.5 bg-gray-200 text-black font-semibold rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="w-1/2 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {salvandoEdicao ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}