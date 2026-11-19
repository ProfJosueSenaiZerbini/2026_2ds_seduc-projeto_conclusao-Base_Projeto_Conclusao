"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Boxes,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import CadastrarExemplarModal from "@/app/bibliotecario/acervo/components/CadastrarExemplarModal";
import ModalFeedback, {
  type FeedbackType,
} from "@/components/ModalFeedback";
import { generos } from "@/lib/generos";

const campoClasse =
  "w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const botaoPrimarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
const botaoSecundarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
const botaoPerigoClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--status-danger)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
const rotuloClasse =
  "mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]";

type Exemplar = {
  id_exemplar: number;
  inativo_exemplar: boolean;
  status_exemplar?: string;
};

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
  qtd_copias?: number;
  copias_disponiveis?: number;
  copias?: number;
  status_livro?: string;
  status?: string;
  localizacao_livro?: string;
  localizacao?: string;
  sinopse_livro?: string;
  sinopse?: string;
  imgcapa_livro?: string | null;
  capa?: string | null;
  exemplar?: Exemplar[];
  exemplares?: Exemplar[];
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
  ficção: "var(--color-fiction)",
  ficcao: "var(--color-fiction)",
  "arte e cultura": "var(--color-art-culture)",
  fantasia: "var(--color-fantasy)",
  biografias: "var(--color-biographies-memoirs)",
  memórias: "var(--color-biographies-memoirs)",
  memorias: "var(--color-biographies-memoirs)",
  "biografias e memórias": "var(--color-biographies-memoirs)",
  "biografias e memorias": "var(--color-biographies-memoirs)",
  thriller: "var(--color-thriller-mystery)",
  mistério: "var(--color-thriller-mystery)",
  misterio: "var(--color-thriller-mystery)",
  "thriller e mistério": "var(--color-thriller-mystery)",
  "thriller e misterio": "var(--color-thriller-mystery)",
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
  const router = useRouter();

  const [livro, setLivro] = useState<Livro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState<{
    titulo: string;
    mensagem: string;
    tipo: FeedbackType;
  } | null>(null);
  const [recarregarAoFecharFeedback, setRecarregarAoFecharFeedback] =
    useState(false);

  // Estados dos Modais
  const [modalEmprestimoAberto, setModalEmprestimoAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalCadastrarExemplarAberto, setModalCadastrarExemplarAberto] =
    useState(false);
  const [modalGerenciarExemplaresAberto, setModalGerenciarExemplaresAberto] =
    useState(false);

  // Lista de Frequentadores do Banco
  const [listaFrequentadores, setListaFrequentadores] = useState<
    Frequentador[]
  >([]);

  // Formulário do Empréstimo
  const [idFrequentadorSelecionado, setIdFrequentadorSelecionado] =
    useState("");
  const [senhaFrequentador, setSenhaFrequentador] = useState("");
  const [prazoDias, setPrazoDias] = useState<number>(15);
  const [dataEmprestimo, setDataEmprestimo] = useState("");
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [enviandoEmprestimo, setEnviandoEmprestimo] = useState(false);
  const [erroEmprestimo, setErroEmprestimo] = useState("");
  const [excluindoLivro, setExcluindoLivro] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  // Formulário de Edição do Livro
  const [formLivro, setFormLivro] = useState({
    titulo: "",
    autor: "",
    genero: "",
    editora: "",
    ano: "",
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
    const hoje = new Date().toISOString().split("T")[0];
    setDataEmprestimo(hoje);
    setPrazoDias(15);
    setDataDevolucao(calcularDataDevolucao(hoje, 15));
    setIdFrequentadorSelecionado("");
    setSenhaFrequentador("");
    setErroEmprestimo("");
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

        const livroDados = await res.json();
        setLivro(livroDados);

        setFormLivro({
          titulo: livroDados.titulo_livro || livroDados.titulo || "",
          autor: livroDados.autor_livro || livroDados.autor || "",
          genero: livroDados.genero_livro || livroDados.genero || "",
          editora: livroDados.editora_livro || livroDados.editora || "",
          ano: (
            livroDados.anopub_livro ||
            livroDados.ano_publicacao ||
            livroDados.ano ||
            ""
          ).toString(),
          copias: (livroDados.qtd_copias ?? livroDados.copias ?? "").toString(),
          localizacao:
            livroDados.localizacao_livro || livroDados.localizacao || "",
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

    try {
      setExcluindoLivro(true);
      setErroExclusao("");
      const res = await fetch(`/api/livros/${id}/desativar`, {
        method: "PATCH",
      });

      if (res.ok) {
        router.push("/bibliotecario/acervo");
      } else {
        const dadosErro = await res.json().catch(() => ({}));
        setErroExclusao(dadosErro.erro || "Erro ao excluir o livro.");
      }
    } catch (error) {
      console.error(error);
      setErroExclusao("Erro de conexão ao excluir o livro.");
    } finally {
      setExcluindoLivro(false);
    }
  }

  async function handleMudarStatusCopia(
    idExemplar: number,
    inativoAtual: boolean,
  ) {
    const acao = inativoAtual ? "reativar" : "desativar";
    if (!confirm(`Tem certeza que deseja ${acao} esta cópia?`)) return;

    try {
      const res = await fetch(`/api/exemplares/${idExemplar}/${acao}`, {
        method: "PATCH",
      });

      if (res.ok) {
        setRecarregarAoFecharFeedback(true);
        setFeedback({
          titulo: `Cópia ${inativoAtual ? "reativada" : "desativada"}`,
          mensagem: `A cópia foi ${inativoAtual ? "reativada" : "desativada"} com sucesso.`,
          tipo: "success",
        });
      } else {
        const dadosErro = await res.json().catch(() => ({}));
        setFeedback({
          titulo: `Não foi possível ${acao}`,
          mensagem: dadosErro.erro || `Erro ao ${acao} a cópia.`,
          tipo: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        titulo: "Erro de conexão",
        mensagem: `Erro de conexão ao ${acao} a cópia.`,
        tipo: "error",
      });
    }
  }

  async function handleCriarEmprestimo(e: React.FormEvent) {
    e.preventDefault();

    const listaExemplares = livro?.exemplar || livro?.exemplares || [];
    const exemplarAtivo = listaExemplares.find(
      (ex) => !ex.inativo_exemplar && ex.status_exemplar === "Dispon_vel",
    );

    if (!exemplarAtivo) {
      setErroEmprestimo(
        "Não é possível realizar o empréstimo porque não há exemplares disponíveis.",
      );
      return;
    }

    if (!idFrequentadorSelecionado) {
      setErroEmprestimo("Selecione um frequentador para continuar.");
      return;
    }

    if (!senhaFrequentador) {
      setErroEmprestimo("Digite a senha do frequentador para continuar.");
      return;
    }

    try {
      setEnviandoEmprestimo(true);
      setErroEmprestimo("");

      const res = await fetch("/api/emprestimos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fk_frequentador_id_freq: Number(idFrequentadorSelecionado),
          fk_exemplar_id_exemplar: exemplarAtivo.id_exemplar,
          prazo_dias: Number(prazoDias),
          senha: senhaFrequentador,
        }),
      });

      if (res.ok) {
        setModalEmprestimoAberto(false);
        setIdFrequentadorSelecionado("");
        setSenhaFrequentador("");
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        setErroEmprestimo(
          err.error || err.erro || "Erro ao cadastrar empréstimo.",
        );
      }
    } catch (error) {
      console.error(error);
      setErroEmprestimo("Erro de conexão ao cadastrar empréstimo.");
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
          qtd_copias: Number(formLivro.copias) || 0,
          localizacao_livro: formLivro.localizacao,
          sinopse_livro: formLivro.sinopse,
          imgcapa_livro: formLivro.capa,
        }),
      });

      if (res.ok) {
        setModalEditarAberto(false);
        setRecarregarAoFecharFeedback(true);
        setFeedback({
          titulo: "Livro atualizado",
          mensagem: "As informações do livro foram atualizadas com sucesso.",
          tipo: "success",
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({
          titulo: "Não foi possível atualizar",
          mensagem: err.erro || "Erro ao atualizar o livro.",
          tipo: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        titulo: "Erro de conexão",
        mensagem: "Erro de conexão ao atualizar o livro.",
        tipo: "error",
      });
    } finally {
      setSalvandoEdicao(false);
    }
  }

  const titulo = livro?.titulo_livro || livro?.titulo;
  const autor = livro?.autor_livro || livro?.autor;
  const genero = livro?.genero_livro || livro?.genero;
  const editora = livro?.editora_livro || livro?.editora;
  const ano = livro?.anopub_livro || livro?.ano_publicacao || livro?.ano;
  const copiasTotais = livro?.qtd_copias ?? 0;
  const copiasDisponiveis = livro?.copias_disponiveis ?? 0;
  const status = livro?.status_livro || livro?.status;
  const localizacao = livro?.localizacao_livro || livro?.localizacao;
  const sinopse = livro?.sinopse_livro || livro?.sinopse;
  const capa = livro?.imgcapa_livro || livro?.capa;

  const listaExemplares = livro?.exemplar || livro?.exemplares || [];
  const exemplaresDisponiveis = listaExemplares.filter(
    (ex) => !ex.inativo_exemplar && ex.status_exemplar === "Dispon_vel",
  ).length;

  const generoChave = genero?.trim().toLowerCase() ?? "";
  const corGenero =
    livro?.cor_genero || coresGenero[generoChave] || "var(--color-brand-500)";

  return (
    <>
      <section className="min-w-0">
        <div className="min-w-0">
          <div className="flex flex-1">
            <main className="min-w-0 flex-1">
              <div className="mx-auto w-full max-w-5xl space-y-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6 lg:p-8">
                <div>
                  <Link
                    href="/bibliotecario/acervo"
                    className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-button)] px-3 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <ArrowLeft size={17} aria-hidden="true" />
                    Voltar ao acervo
                  </Link>
                </div>

                {carregando ? (
                  <div
                    className="space-y-4 py-10"
                    role="status"
                    aria-live="polite"
                  >
                    <LoaderCircle
                      size={28}
                      className="mx-auto animate-spin text-[var(--brand-500)]"
                      aria-hidden="true"
                    />
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      Carregando informações do livro...
                    </p>
                  </div>
                ) : erro ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl bg-[var(--status-danger)]/10 p-4 text-sm font-medium text-[var(--status-danger)]"
                  >
                    <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
                    <p>{erro}</p>
                  </div>
                ) : livro ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                      <div className="flex flex-col items-center gap-3 md:col-span-5">
                        <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-warm)]">
                          {capa ? (
                            <img
                              src={capa}
                              alt={titulo || "Capa do livro"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-[var(--text-muted)]">
                              Sem Capa
                            </span>
                          )}
                        </div>

                        <div className="w-full rounded-full bg-[var(--brand-400)] px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-inverse)]">
                          {status || "Disponível"}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between space-y-5 md:col-span-7">
                        <div>
                          <h1 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                            {titulo || "Título Indefinido"}
                          </h1>

                          {genero && (
                            <span
                              style={{ backgroundColor: corGenero }}
                              className="mb-4 inline-block rounded-full px-3 py-1.5 text-xs font-semibold uppercase leading-none text-[var(--text-primary)]"
                            >
                              {genero}
                            </span>
                          )}

                          <div className="space-y-2 rounded-[var(--radius-card)] bg-[var(--surface-hover)] p-4 text-sm text-[var(--text-secondary)] sm:text-base">
                            <p>
                              <span className="font-semibold">Autor:</span>{" "}
                              {autor || "Não informado"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Ano de publicação:
                              </span>{" "}
                              {ano || "Não informado"}
                            </p>
                            <p>
                              <span className="font-semibold">Editora:</span>{" "}
                              {editora || "Não informada"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Cópias totais:
                              </span>{" "}
                              {copiasTotais}
                            </p>

                            <p>
                              <span className="font-semibold">
                                Cópias disponíveis:
                              </span>{" "}
                              <span
                                className={
                                  copiasDisponiveis === 0
                                    ? "font-semibold text-[var(--status-danger)]"
                                    : "font-semibold text-[var(--status-success)]"
                                }
                              >
                                {copiasDisponiveis}
                                {copiasDisponiveis === 0
                                  ? " (Indisponível)"
                                  : ""}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={abrirModalEmprestimo}
                            className={`${botaoPrimarioClasse} w-full`}
                          >
                            <BookOpen size={18} aria-hidden="true" />
                            Criar Empréstimo
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold">Localização:</span>{" "}
                      {localizacao || "Não informada"}
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                        Sinopse
                      </h2>
                      <p className="rounded-[var(--radius-card)] bg-[var(--surface-hover)] p-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base whitespace-pre-line">
                        {sinopse ||
                          "Nenhuma sinopse cadastrada para este livro."}
                      </p>
                    </div>

                    {/* Botões Administrativos */}
                    <div className="grid grid-cols-1 gap-3 border-t border-[var(--border-default)] pt-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setModalEditarAberto(true)}
                        className={`${botaoSecundarioClasse} w-full`}
                      >
                        <Pencil size={17} aria-hidden="true" />
                        Atualizar Livro
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalCadastrarExemplarAberto(true)}
                        className={`${botaoSecundarioClasse} w-full`}
                      >
                        <Plus size={17} aria-hidden="true" />
                        Cadastrar Nova Cópia
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setErroExclusao("");
                          setModalExcluirAberto(true);
                        }}
                        className={`${botaoPerigoClasse} w-full`}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                        Excluir Livro
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalGerenciarExemplaresAberto(true)}
                        className={`${botaoSecundarioClasse} w-full`}
                      >
                        <Boxes size={17} aria-hidden="true" />
                        Gerenciar Exemplares
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </main>
          </div>

          <CadastrarExemplarModal
            aberto={modalCadastrarExemplarAberto}
            onFechar={() => setModalCadastrarExemplarAberto(false)}
            onSucesso={() => window.location.reload()}
            livro={
              livro
                ? {
                    id_livro: livro.id_livro,
                    titulo_livro:
                      livro.titulo_livro || livro.titulo || "Livro sem título",
                  }
                : null
            }
          />

          {/* ==================== MODAL GERENCIAR EXEMPLARES ==================== */}
          {modalGerenciarExemplaresAberto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5">
              <div className="max-h-[85vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    Gerenciar Exemplares
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalGerenciarExemplaresAberto(false)}
                    aria-label="Fechar gerenciamento de exemplares"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <X size={19} aria-hidden="true" />
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  Visualize abaixo todas as cópias deste livro e escolha qual
                  deseja desativar ou reativar de forma prática:
                </p>

                <div className="space-y-3 pt-2">
                  {listaExemplares.length === 0 ? (
                    <p className="rounded-lg bg-[var(--surface-hover)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                      Nenhum exemplar cadastrado.
                    </p>
                  ) : (
                    listaExemplares.map((ex, index) => {
                      const isInativo = ex.inativo_exemplar;
                      const statusTexto = isInativo
                        ? "Inativo"
                        : ex.status_exemplar === "Em_posse"
                          ? "Em Posse (Emprestado)"
                          : "Disponível";

                      return (
                        <div
                          key={ex.id_exemplar}
                          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between"
                        >
                          <div>
                            <span className="block font-semibold text-[var(--text-primary)]">
                              Cópia #{index + 1} (ID: {ex.id_exemplar})
                            </span>
                            <span
                              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isInativo
                                  ? "bg-[var(--status-danger)]/10 text-[var(--status-danger)]"
                                  : ex.status_exemplar === "Em_posse"
                                    ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                                    : "bg-[var(--status-success)]/10 text-[var(--status-success)]"
                              }`}
                            >
                              {statusTexto}
                            </span>
                          </div>

                          <div>
                            {isInativo ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMudarStatusCopia(ex.id_exemplar, true)
                                }
                                className={`${botaoPrimarioClasse} min-h-9 px-3 py-2 text-xs`}
                              >
                                Reativar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMudarStatusCopia(ex.id_exemplar, false)
                                }
                                className={`${botaoPerigoClasse} min-h-9 px-3 py-2 text-xs`}
                              >
                                Desativar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end border-t border-[var(--border-default)] pt-4">
                  <button
                    type="button"
                    onClick={() => setModalGerenciarExemplaresAberto(false)}
                    className={botaoSecundarioClasse}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalExcluirAberto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmar-exclusao-titulo"
                className="w-full max-w-md space-y-4 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
                  <h3
                    id="confirmar-exclusao-titulo"
                    className="text-xl font-bold text-[var(--text-primary)]"
                  >
                    Excluir livro
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalExcluirAberto(false)}
                    disabled={excluindoLivro}
                    aria-label="Fechar confirmação de exclusão"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={19} aria-hidden="true" />
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  Tem certeza de que deseja excluir{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {titulo || "este livro"}
                  </span>
                  ? O livro será desativado no acervo.
                </p>

                {erroExclusao && (
                  <p
                    role="alert"
                    className="rounded-[var(--radius-input)] border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 px-3 py-2.5 text-sm font-medium text-[var(--status-danger)]"
                  >
                    {erroExclusao}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setModalExcluirAberto(false)}
                    disabled={excluindoLivro}
                    className={`${botaoSecundarioClasse} w-full sm:w-auto`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExcluirLivro}
                    disabled={excluindoLivro}
                    className={`${botaoPerigoClasse} w-full sm:w-auto`}
                  >
                    {excluindoLivro ? "Excluindo..." : "Confirmar exclusão"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== MODAL CRIAR EMPRÉSTIMO ==================== */}
          {modalEmprestimoAberto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="criar-emprestimo-titulo"
                className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
                  <h3
                    id="criar-emprestimo-titulo"
                    className="text-xl font-bold text-[var(--text-primary)]"
                  >
                    Criar Empréstimo
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalEmprestimoAberto(false)}
                    aria-label="Fechar cadastro de empréstimo"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <X size={19} aria-hidden="true" />
                  </button>
                </div>

                {exemplaresDisponiveis === 0 ? (
                  <>
                    <div
                      role="status"
                      className="flex min-h-24 items-center justify-center rounded-[var(--radius-input)] bg-[var(--status-danger)] p-4 text-center text-sm font-semibold leading-relaxed text-white"
                    >
                      Este livro está sem exemplares disponíveis para
                      empréstimo. Cadastre ou reative um exemplar para
                      continuar.
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalEmprestimoAberto(false)}
                      className={`${botaoSecundarioClasse} w-full`}
                    >
                      Fechar
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleCriarEmprestimo} className="space-y-4">
                    {erroEmprestimo && (
                      <p
                        role="alert"
                        className="rounded-[var(--radius-input)] border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 px-3 py-2.5 text-sm font-medium text-[var(--status-danger)]"
                      >
                        {erroEmprestimo}
                      </p>
                    )}
                  <div>
                    <label className={rotuloClasse}>
                      Livro:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={titulo || ""}
                      className={`${campoClasse} bg-[var(--surface-hover)]`}
                    />
                  </div>

                  <div>
                    <label className={rotuloClasse}>
                      Nome do Frequentador *
                    </label>
                    <select
                      required
                      value={idFrequentadorSelecionado}
                      onChange={(e) =>
                        setIdFrequentadorSelecionado(e.target.value)
                      }
                      className={campoClasse}
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
                    <label className={rotuloClasse}>
                      Senha do Frequentador *
                    </label>
                    <input
                      type="password"
                      required
                      value={senhaFrequentador}
                      onChange={(e) => setSenhaFrequentador(e.target.value)}
                      placeholder="Digite a senha do frequentador"
                      className={campoClasse}
                    />
                  </div>

                  <div>
                    <label className={rotuloClasse}>
                      Data de Empréstimo
                    </label>
                    <input
                      type="date"
                      value={dataEmprestimo}
                      disabled
                      className={`${campoClasse} bg-[var(--surface-hover)]`}
                    />
                  </div>

                  <div>
                    <label className={rotuloClasse}>
                      Prazo de Empréstimo
                    </label>
                    <select
                      value={prazoDias}
                      onChange={(e) =>
                        handlePrazoChange(Number(e.target.value))
                      }
                      className={`${campoClasse} cursor-pointer`}
                    >
                      <option value={7}>7 dias</option>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias</option>
                    </select>
                  </div>

                  <div>
                    <label className={rotuloClasse}>
                      Data Limite de Devolução
                    </label>
                    <input
                      type="date"
                      value={dataDevolucao}
                      readOnly
                      className={`${campoClasse} bg-[var(--surface-hover)]`}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setModalEmprestimoAberto(false)}
                      className={`${botaoSecundarioClasse} w-full sm:flex-1`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviandoEmprestimo}
                      className={`${botaoPrimarioClasse} w-full sm:flex-1`}
                    >
                      {enviandoEmprestimo ? "Cadastrando..." : "Cadastrar"}
                    </button>
                  </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ==================== MODAL ATUALIZAR LIVRO ==================== */}
          {modalEditarAberto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5">
              <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    Atualizar Livro
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalEditarAberto(false)}
                    aria-label="Fechar edição do livro"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <X size={19} aria-hidden="true" />
                  </button>
                </div>

                <form
                  onSubmit={handleSalvarLivro}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={rotuloClasse}>
                        Título
                      </label>
                      <input
                        type="text"
                        required
                        value={formLivro.titulo}
                        onChange={(e) =>
                          setFormLivro({ ...formLivro, titulo: e.target.value })
                        }
                        className={campoClasse}
                      />
                    </div>

                    <div>
                      <label className={rotuloClasse}>
                        Autor
                      </label>
                      <input
                        type="text"
                        required
                        value={formLivro.autor}
                        onChange={(e) =>
                          setFormLivro({ ...formLivro, autor: e.target.value })
                        }
                        className={campoClasse}
                      />
                    </div>

                    <div>
                      <label className={rotuloClasse}>
                        Gênero
                      </label>
                      <select
                        value={formLivro.genero}
                        onChange={(e) =>
                          setFormLivro({ ...formLivro, genero: e.target.value })
                        }
                        required
                        className={`${campoClasse} cursor-pointer`}
                      >
                        <option value="" disabled>
                          Selecione um gênero
                        </option>
                        {formLivro.genero &&
                          !generos.some(
                            (genero) => genero === formLivro.genero,
                          ) && (
                            <option value={formLivro.genero}>
                              {formLivro.genero}
                            </option>
                          )}
                        {generos.map((genero) => (
                          <option key={genero} value={genero}>
                            {genero}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={rotuloClasse}>
                        Editora
                      </label>
                      <input
                        type="text"
                        value={formLivro.editora}
                        onChange={(e) =>
                          setFormLivro({
                            ...formLivro,
                            editora: e.target.value,
                          })
                        }
                        className={campoClasse}
                      />
                    </div>

                    <div>
                      <label className={rotuloClasse}>
                        Ano
                      </label>
                      <input
                        type="number"
                        value={formLivro.ano}
                        onChange={(e) =>
                          setFormLivro({ ...formLivro, ano: e.target.value })
                        }
                        className={campoClasse}
                      />
                    </div>

                    <div>
                      <label className={rotuloClasse}>
                        Localização
                      </label>
                      <input
                        type="text"
                        value={formLivro.localizacao}
                        onChange={(e) =>
                          setFormLivro({
                            ...formLivro,
                            localizacao: e.target.value,
                          })
                        }
                        className={campoClasse}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={rotuloClasse}>
                      URL da Capa
                    </label>
                    <input
                      type="text"
                      value={formLivro.capa}
                      onChange={(e) =>
                        setFormLivro({ ...formLivro, capa: e.target.value })
                      }
                      className={campoClasse}
                    />
                  </div>

                  <div>
                    <label className={rotuloClasse}>
                      Sinopse
                    </label>
                    <textarea
                      rows={4}
                      value={formLivro.sinopse}
                      onChange={(e) =>
                        setFormLivro({ ...formLivro, sinopse: e.target.value })
                      }
                      className={`${campoClasse} resize-y`}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setModalEditarAberto(false)}
                      className={`${botaoSecundarioClasse} w-full sm:flex-1`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={salvandoEdicao}
                      className={`${botaoPrimarioClasse} w-full sm:flex-1`}
                    >
                      {salvandoEdicao ? "Salvando..." : "Salvar Alterações"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {feedback && (
        <ModalFeedback
          aberto
          titulo={feedback.titulo}
          mensagem={feedback.mensagem}
          tipo={feedback.tipo}
          onFechar={() => {
            const recarregar = recarregarAoFecharFeedback;
            setFeedback(null);
            setRecarregarAoFecharFeedback(false);
            if (recarregar) {
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}
