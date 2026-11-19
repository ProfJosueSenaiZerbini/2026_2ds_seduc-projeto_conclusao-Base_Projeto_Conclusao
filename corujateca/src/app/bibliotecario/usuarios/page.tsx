"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Eye,
  Info,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  UserRoundCheck,
  UserRoundX,
  X,
  ReceiptText,
} from "lucide-react";
import ModalFeedback, {
  type FeedbackType,
} from "@/components/ModalFeedback";

type Usuario = {
  id: number;
  nome: string;
  ddd?: string;
  telefone?: string;
};

type UsuarioDetalhe = {
  id: number;
  nome: string;
  inativo: boolean;
  suspenso: boolean;
  ddd?: string;
  telefone?: string;
  totalEmprestimos: number;
  totalMultas: number;
};

const campoClasse =
  "w-full min-w-0 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]";

const botaoSecundario =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 hover:cursor-pointer border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

const botaoPrimario =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] hover:cursor-pointer bg-[var(--button-primary)] px-4 py-2.5 text-sm text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

const modalClasse =
  "relative my-auto max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-lg overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--radius-modal)] border border-[var(--border-default)] bg-[var(--surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-modal)] sm:max-h-[calc(100dvh-2.5rem)] sm:p-6";

export default function UsuariosBibli() {
  const [feedback, setFeedback] = useState<{
    titulo: string;
    mensagem: string;
    tipo: FeedbackType;
  } | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [totalUsuarios, setTotalUsuarios] = useState(0);

  // Cadastro e edição
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);

  const [novoNome, setNovoNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoDdd, setNovoDdd] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Desativação
  const [modalDesativarAberto, setModalDesativarAberto] = useState(false);
  const [usuarioParaDesativar, setUsuarioParaDesativar] =
    useState<Usuario | null>(null);
  const [carregandoDesativacao, setCarregandoDesativacao] = useState(false);

  // Detalhes
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [usuarioDetalhe, setUsuarioDetalhe] = useState<UsuarioDetalhe | null>(
    null,
  );
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // Reativação
  const [reativarModalAberto, setReativarModalAberto] = useState(false);
  const [usuariosDesativados, setUsuariosDesativados] = useState<Usuario[]>([]);
  const [usuarioSelecionadoReativar, setUsuarioSelecionadoReativar] =
    useState("");
  const [carregandoReativacao, setCarregandoReativacao] = useState(false);

  async function carregarUsuarios() {
    try {
      const resposta = await fetch("/api/frequentador");

      if (!resposta.ok) {
        throw new Error("Erro ao carregar frequentadores.");
      }

      const dados = await resposta.json();

      setUsuarios(dados);
      setTotalUsuarios(dados.length);
    } catch (erro) {
      console.error("Erro ao carregar usuários:", erro);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Cadastro e edição
  function abrirModalEdicao(usuario: Usuario) {
    setUsuarioEmEdicao(usuario);
    setNovoNome(usuario.nome || "");
    setNovaSenha("");
    setNovoDdd(usuario.ddd || "");
    setNovoTelefone(usuario.telefone || "");
    setModalAberto(true);
  }

  function abrirModalCadastro() {
    setUsuarioEmEdicao(null);
    setNovoNome("");
    setNovaSenha("");
    setNovoDdd("");
    setNovoTelefone("");
    setModalAberto(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!novoNome.trim()) {
      setFeedback({
        titulo: "Verifique os dados",
        mensagem: "O nome é obrigatório.",
        tipo: "error",
      });
      return;
    }

    if (!usuarioEmEdicao) {
      if (!novaSenha.trim()) {
        setFeedback({
          titulo: "Verifique os dados",
          mensagem: "A senha é obrigatória.",
          tipo: "error",
        });
        return;
      }

      if (novaSenha.trim().length < 8) {
        setFeedback({
          titulo: "Verifique os dados",
          mensagem: "A senha precisa ter no mínimo 8 caracteres.",
          tipo: "error",
        });
        return;
      }
    }

    setCarregando(true);

    try {
      const url = usuarioEmEdicao
        ? `/api/frequentador/${usuarioEmEdicao.id}`
        : "/api/frequentador";

      const method = usuarioEmEdicao ? "PUT" : "POST";

      const bodyData: Record<string, unknown> = {
        nome: novoNome.trim(),
        ddd: novoDdd,
        telefone: novoTelefone,
      };

      if (!usuarioEmEdicao) {
        bodyData.senha = novaSenha.trim();
      }

      const resposta = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (resposta.ok) {
        fecharModal();
        await carregarUsuarios();
        setFeedback({
          titulo: usuarioEmEdicao
            ? "Cadastro atualizado"
            : "Frequentador cadastrado",
          mensagem: usuarioEmEdicao
            ? "Os dados do frequentador foram atualizados com sucesso."
            : "O frequentador foi cadastrado com sucesso.",
          tipo: "success",
        });
      } else {
        const erro = await resposta.json();
        setFeedback({
          titulo: "Não foi possível salvar",
          mensagem: erro.erro || "Erro ao salvar os dados do usuário.",
          tipo: "error",
        });
      }
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      setFeedback({
        titulo: "Erro de comunicação",
        mensagem: "Não foi possível comunicar com o servidor.",
        tipo: "error",
      });
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    if (carregando) return;

    setModalAberto(false);
    setUsuarioEmEdicao(null);
    setNovoNome("");
    setNovaSenha("");
    setNovoDdd("");
    setNovoTelefone("");
  }

  function deletarFrequentador(usuario: Usuario) {
    setUsuarioParaDesativar(usuario);
    setModalDesativarAberto(true);
  }

  function fecharModalDesativar() {
    if (carregandoDesativacao) return;

    setModalDesativarAberto(false);
    setUsuarioParaDesativar(null);
  }

  async function confirmarDesativacao() {
    if (!usuarioParaDesativar || carregandoDesativacao) return;

    setCarregandoDesativacao(true);

    try {
      const resposta = await fetch(
        `/api/frequentador/${usuarioParaDesativar.id}/desativar`,
        {
          method: "PATCH",
        },
      );

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setFeedback({
          titulo: "Não foi possível desativar",
          mensagem: resultado?.erro ?? "Erro ao desativar o frequentador.",
          tipo: "error",
        });
        return;
      }

      setModalDesativarAberto(false);
      setUsuarioParaDesativar(null);

      await carregarUsuarios();
      setFeedback({
        titulo: "Frequentador desativado",
        mensagem: "O frequentador foi desativado com sucesso.",
        tipo: "success",
      });
    } catch (erro) {
      console.error("Erro ao desativar frequentador:", erro);
      setFeedback({
        titulo: "Não foi possível desativar",
        mensagem: "Ocorreu um erro ao desativar o frequentador.",
        tipo: "error",
      });
    } finally {
      setCarregandoDesativacao(false);
    }
  }

  async function abrirDetalhes(id: number) {
    setDetalheAberto(true);
    setCarregandoDetalhe(true);
    setUsuarioDetalhe(null);

    try {
      const resposta = await fetch(`/api/frequentador/${id}`);

      if (!resposta.ok) {
        throw new Error("Não foi possível carregar os detalhes.");
      }

      const dados = await resposta.json();
      setUsuarioDetalhe(dados);
    } catch (erro) {
      console.error("Erro ao buscar detalhes:", erro);
      setFeedback({
        titulo: "Não foi possível carregar",
        mensagem: "Não foi possível carregar os detalhes do frequentador.",
        tipo: "error",
      });
      setDetalheAberto(false);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function fecharDetalhes() {
    if (carregandoDetalhe) return;

    setDetalheAberto(false);
    setUsuarioDetalhe(null);
  }

  async function carregarUsuariosDesativados() {
    try {
      const resposta = await fetch("/api/frequentador?inativos=true");
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error("Erro ao carregar usuários desativados.");
      }

      setUsuariosDesativados(dados);
    } catch (erro) {
      console.error("Erro ao carregar usuários desativados:", erro);
      setFeedback({
        titulo: "Não foi possível carregar",
        mensagem: "Não foi possível carregar os usuários desativados.",
        tipo: "error",
      });
    }
  }

  async function abrirModalReativar() {
    setUsuarioSelecionadoReativar("");
    setUsuariosDesativados([]);
    setReativarModalAberto(true);

    await carregarUsuariosDesativados();
  }

  async function reativarFrequentador() {
    if (!usuarioSelecionadoReativar) {
      setFeedback({
        titulo: "Selecione um frequentador",
        mensagem: "Escolha um frequentador antes de continuar.",
        tipo: "error",
      });
      return;
    }

    const id = Number(usuarioSelecionadoReativar);

    setCarregandoReativacao(true);

    try {
      const resposta = await fetch(`/api/frequentador/${id}/reativar`, {
        method: "PATCH",
      });

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setFeedback({
          titulo: "Não foi possível reativar",
          mensagem: resultado?.erro ?? "Erro ao reativar o frequentador.",
          tipo: "error",
        });
        return;
      }

      setReativarModalAberto(false);
      setUsuarioSelecionadoReativar("");

      await carregarUsuarios();
      setFeedback({
        titulo: "Frequentador reativado",
        mensagem:
          resultado?.mensagem ?? "Frequentador reativado com sucesso.",
        tipo: "success",
      });
    } catch (erro) {
      console.error("Erro ao reativar frequentador:", erro);
      setFeedback({
        titulo: "Não foi possível reativar",
        mensagem: "Ocorreu um erro ao reativar o frequentador.",
        tipo: "error",
      });
    } finally {
      setCarregandoReativacao(false);
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) =>
    usuario.nome?.toLowerCase().includes(termoPesquisa.toLowerCase().trim()),
  );

  return (
    <main className="min-w-0 flex-1 overflow-x-clip bg-[var(--app-background)] px-3 py-5 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-5 sm:space-y-7">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold leading-tight min-[375px]:text-2xl sm:text-3xl">
              Gerenciamento de usuários
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Consulte, cadastre e gerencie os usuários da biblioteca.
            </p>
          </div>
        </header>

        <section
          aria-label="Resumo de frequentadores"
          className="flex min-w-0 items-center gap-4 rounded-[var(--radius-card)] border-2 border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--status-warning)]/10 text-[var(--status-warning)] sm:h-14 sm:w-14">
            <Users size={25} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
              Total de frequentadores
            </p>

            <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
              {totalUsuarios}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Usuários encontrados no cadastro ativo.
            </p>
          </div>
        </section>

        <section
          aria-label="Ações de frequentadores"
          className="grid min-w-0 grid-cols-1 gap-2.5 min-[375px]:gap-3 sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={abrirModalCadastro}
            className={`${botaoPrimario} min-h-12 w-full min-w-0 whitespace-normal px-3 text-center leading-snug min-[375px]:px-4`}
          >
            <UserPlus size={20} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0">Cadastrar novo frequentador</span>
          </button>

          <button
            type="button"
            onClick={abrirModalReativar}
            className={`${botaoSecundario} min-h-12 w-full min-w-0 whitespace-normal px-3 text-center leading-snug min-[375px]:px-4`}
          >
            <UserRoundCheck size={20} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0">Reativar frequentador</span>
          </button>
        </section>

        {/* Pesquisa */}
        <section className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] min-[375px]:p-4 sm:p-5">
          <label
            htmlFor="pesquisa-usuario"
            className="mb-2 block text-sm font-semibold"
          >
            Pesquisar frequentador
          </label>

          <div className="relative min-w-0">
            <Search
              size={19}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              id="pesquisa-usuario"
              type="search"
              placeholder="Digite o nome do frequentador..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className={`${campoClasse} pl-10`}
            />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            {usuariosFiltrados.length === 1
              ? "1 frequentador encontrado"
              : `${usuariosFiltrados.length} frequentadores encontrados`}
          </p>
        </section>

        <section className="hidden min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)] md:block">
          <div className="border-b border-[var(--border-default)] px-5 py-4">
            <h2 className="font-semibold">Lista de frequentadores</h2>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-hover)]">
                  <th scope="col" className="w-[50%] px-5 py-3 text-sm">
                    Nome
                  </th>

                  <th scope="col" className="w-[50%] px-5 py-3 text-right text-sm">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border-default)]">
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <td className="max-w-0 px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-500)] text-[var(--text-inverse)]">
                            <Users size={19} aria-hidden="true" />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words font-medium">
                              {usuario.nome}
                            </p>

                            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                              ID: {usuario.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirDetalhes(usuario.id)}
                            className={botaoSecundario}
                          >
                            <Eye size={16} aria-hidden="true" />
                            Detalhes
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirModalEdicao(usuario)}
                            className={botaoPrimario}
                          >
                            <Pencil size={16} aria-hidden="true" />
                            Atualizar
                          </button>

                          <button
                            type="button"
                            onClick={() => deletarFrequentador(usuario)}
                            className="inline-flex items-center justify-center gap-2 hover:cursor-pointer rounded-[var(--radius-button)] border-2 border-[var(--status-danger)]/30 px-3 py-2.5 text-sm font-semibold text-[var(--status-danger)] transition hover:bg-[var(--status-danger)]/10 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                          >
                            <UserRoundX size={16} aria-hidden="true" />
                            Desativar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                    >
                      <Search
                        size={28}
                        className="mx-auto mb-3 opacity-60"
                        aria-hidden="true"
                      />
                      Nenhum frequentador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 space-y-3 md:hidden">
          <h2 className="text-base">Lista de frequentadores</h2>

          {usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map((usuario) => (
              <article
                key={usuario.id}
                className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border-2 border-[var(--border-default)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)] min-[375px]:p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-warm)] min-[375px]:h-10 min-[375px]:w-10">
                    <Users size={20} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-semibold min-[375px]:text-base">
                      {usuario.nome}
                    </h3>

                    <p className="mt-1 break-words text-xs text-[var(--text-secondary)]">
                      Identificação: {usuario.id}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => abrirDetalhes(usuario.id)}
                    className={`${botaoSecundario} min-h-11 min-w-0 whitespace-normal px-2 text-center leading-snug`}
                  >
                    <Eye size={16} className="shrink-0" aria-hidden="true" />
                    Detalhes
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirModalEdicao(usuario)}
                    className={`${botaoPrimario} min-h-11 min-w-0 whitespace-normal px-2 text-center leading-snug`}
                  >
                    <Pencil size={16} className="shrink-0" aria-hidden="true" />
                    Atualizar
                  </button>

                  <button
                    type="button"
                    onClick={() => deletarFrequentador(usuario)}
                    className="col-span-1 inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-[var(--status-danger)]/30 px-2 py-2.5 text-center text-sm font-semibold leading-snug text-[var(--status-danger)] transition hover:bg-[var(--status-danger)]/10 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] min-[400px]:col-span-2"
                  >
                    <UserRoundX
                      size={16}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    Desativar frequentador
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
              <Search
                size={28}
                className="mx-auto mb-3 opacity-60"
                aria-hidden="true"
              />
              Nenhum frequentador encontrado.
            </div>
          )}
        </section>
      </div>

      {detalheAberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharDetalhes();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalhes"
            className={modalClasse}
          >
            <div className="mb-5 flex min-w-0 items-start justify-between gap-2 min-[375px]:gap-3">
              <div className="flex min-w-0 items-start gap-2.5 min-[375px]:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] min-[375px]:h-11 min-[375px]:w-11">
                  <Info size={22} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-detalhes"
                    className="break-words text-base font-bold min-[375px]:text-lg sm:text-xl"
                  >
                    Detalhes do frequentador
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Informações da conta e atividade na biblioteca.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharDetalhes}
                disabled={carregandoDetalhe}
                aria-label="Fechar detalhes"
                className="shrink-0 rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {carregandoDetalhe ? (
              <div className="flex items-center justify-center gap-3 py-10 text-sm text-[var(--text-secondary)]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--button-primary)]" />
                Carregando informações...
              </div>
            ) : usuarioDetalhe ? (
              <div className="min-w-0 space-y-4">
                <div className="rounded-lg border-2 border-[var(--border-default)] bg-[var(--surface-warm)] p-3 min-[375px]:p-4">
                  <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                    Nome completo
                  </p>

                  <p className="mt-1 break-words font-semibold">
                    {usuarioDetalhe.nome}
                  </p>

                  <p className="text-xs mt-3 font-medium text-[var(--text-secondary)]">
                    Identificação
                  </p>

                  <p className="mt-1 text-lg font-bold">#{usuarioDetalhe.id}</p>
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <Phone
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Telefone
                    </p>

                    <p className="mt-1 break-words text-sm">
                      {usuarioDetalhe.ddd && usuarioDetalhe.telefone
                        ? `(${usuarioDetalhe.ddd}) ${usuarioDetalhe.telefone}`
                        : "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                  <div className="min-w-0 rounded-xl border border-[var(--border-default)] p-3">
                    <p className="mb-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Situação da conta
                    </p>

                    <span
                      className={`inline-flex max-w-full items-center gap-1.5 break-words text-sm font-semibold ${
                        usuarioDetalhe.inativo
                          ? "text-[var(--status-danger)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {usuarioDetalhe.inativo ? (
                        <UserRoundX
                          size={16}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <CheckCircle2
                          size={16}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                      )}

                      {usuarioDetalhe.inativo ? "Inativo" : "Ativo"}
                    </span>
                  </div>

                  <div className="min-w-0 rounded-xl border border-[var(--border-default)] p-3">
                    <p className="mb-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Situação de empréstimo
                    </p>

                    <span
                      className={`inline-flex max-w-full items-center gap-1.5 break-words text-sm font-semibold ${
                        usuarioDetalhe.suspenso
                          ? "text-[var(--status-danger)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      <ShieldCheck
                        size={16}
                        className="shrink-0"
                        aria-hidden="true"
                      />

                      {usuarioDetalhe.suspenso ? "Suspenso" : "Regular"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-default)] pt-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    Atividade na biblioteca
                  </h3>

                  <div className="grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                    <div className="min-w-0 rounded-xl border border-[var(--border-default)] p-3">
                      <BookOpen
                        size={19}
                        className="mb-2 text-[var(--text-secondary)]"
                        aria-hidden="true"
                      />

                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        Empréstimos ativos
                      </p>

                      <p className="mt-1 text-2xl font-bold tabular-nums">
                        {usuarioDetalhe.totalEmprestimos}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl border border-[var(--border-default)] p-3">
                      <ReceiptText
                        size={19}
                        className="mb-2 text-[var(--text-secondary)]"
                        aria-hidden="true"
                      />

                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        Multas ativas
                      </p>

                      <p className="mt-1 text-2xl font-bold tabular-nums">
                        {usuarioDetalhe.totalMultas}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="flex items-start gap-2 py-5 text-sm text-[var(--status-danger)]">
                <CircleAlert
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                Não foi possível carregar os dados do frequentador.
              </p>
            )}

            <div className="mt-6 flex justify-end border-t border-[var(--border-default)] pt-4">
              <button
                type="button"
                onClick={fecharDetalhes}
                disabled={carregandoDetalhe}
                className={`${botaoPrimario} w-full min-[400px]:w-auto`}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario"
            className={modalClasse}
          >
            <div className="mb-5 flex min-w-0 items-start justify-between gap-2 min-[375px]:gap-3">
              <div className="flex min-w-0 items-start gap-2.5 min-[375px]:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] min-[375px]:h-11 min-[375px]:w-11">
                  {usuarioEmEdicao ? (
                    <Pencil size={21} aria-hidden="true" />
                  ) : (
                    <UserPlus size={21} aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-formulario"
                    className="break-words text-base font-bold min-[375px]:text-lg sm:text-xl"
                  >
                    {usuarioEmEdicao
                      ? "Atualizar frequentador"
                      : "Cadastrar frequentador"}
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {usuarioEmEdicao
                      ? `Editando o cadastro #${usuarioEmEdicao.id}.`
                      : "Preencha os dados para criar uma nova conta."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={carregando}
                aria-label="Fechar formulário"
                className="shrink-0 rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
              <div className="min-w-0">
                <label
                  htmlFor="nome-frequentador"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Nome completo
                </label>

                <input
                  id="nome-frequentador"
                  type="text"
                  autoComplete="name"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex.: Ana Souza"
                  className={campoClasse}
                />
              </div>

              {!usuarioEmEdicao && (
                <div className="min-w-0">
                  <label
                    htmlFor="senha-frequentador"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Senha
                  </label>

                  <input
                    id="senha-frequentador"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    className={campoClasse}
                  />

                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                    A senha deve conter pelo menos 8 caracteres.
                  </p>
                </div>
              )}

              <div className="min-w-0">
                <label
                  htmlFor="ddd-frequentador"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Telefone{" "}
                  <span className="font-normal text-[var(--text-muted)]">
                    (opcional)
                  </span>
                </label>

                <div className="flex min-w-0 gap-2">
                  <div className="w-[76px] shrink-0 min-[375px]:w-24">
                    <input
                      id="ddd-frequentador"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-area-code"
                      value={novoDdd}
                      onChange={(e) =>
                        setNovoDdd(
                          e.target.value.replace(/\D/g, "").slice(0, 2),
                        )
                      }
                      placeholder="DDD"
                      maxLength={2}
                      aria-label="DDD"
                      className={campoClasse}
                    />
                  </div>

                  <input
                    id="telefone-frequentador"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={novoTelefone}
                    onChange={(e) =>
                      setNovoTelefone(
                        e.target.value.replace(/\D/g, "").slice(0, 9),
                      )
                    }
                    placeholder="Número de telefone"
                    maxLength={9}
                    aria-label="Número de telefone"
                    className={campoClasse}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 min-[400px]:flex-row min-[400px]:justify-end">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={carregando}
                  className={`${botaoSecundario} w-full min-w-0 min-[400px]:w-auto`}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className={`${botaoPrimario} w-full min-w-0 min-[400px]:w-auto`}
                >
                  {carregando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Salvando...
                    </>
                  ) : usuarioEmEdicao ? (
                    <>
                      <CheckCircle2 size={17} aria-hidden="true" />
                      Salvar alterações
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} aria-hidden="true" />
                      Cadastrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {reativarModalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !carregandoReativacao) {
              setReativarModalAberto(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-reativacao"
            className={modalClasse}
          >
            <div className="mb-5 flex min-w-0 items-start justify-between gap-2 min-[375px]:gap-3">
              <div className="flex min-w-0 items-start gap-2.5 min-[375px]:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] min-[375px]:h-11 min-[375px]:w-11">
                  <UserRoundCheck size={22} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-reativacao"
                    className="break-words text-base font-bold min-[375px]:text-lg sm:text-xl"
                  >
                    Reativar frequentador
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Selecione uma conta desativada para restaurar o acesso.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReativarModalAberto(false)}
                disabled={carregandoReativacao}
                aria-label="Fechar reativação"
                className="shrink-0 rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="selecionar-frequentador"
                className="mb-1.5 block text-sm font-semibold"
              >
                Frequentador
              </label>

              <select
                id="selecionar-frequentador"
                value={usuarioSelecionadoReativar}
                onChange={(e) => setUsuarioSelecionadoReativar(e.target.value)}
                disabled={carregandoReativacao}
                className={`${campoClasse} bg-[var(--surface)]`}
              >
                <option value="">Selecione um frequentador</option>

                {usuariosDesativados.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome} — ID {usuario.id}
                  </option>
                ))}
              </select>
            </div>

            {usuariosDesativados.length === 0 && (
              <div className="mt-4 flex min-w-0 items-start gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-warm)] p-3 text-sm text-[var(--text-secondary)]">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />

                <p>Nenhum frequentador desativado foi encontrado.</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 min-[400px]:flex-row min-[400px]:justify-end">
              <button
                type="button"
                onClick={() => setReativarModalAberto(false)}
                disabled={carregandoReativacao}
                className={`${botaoSecundario} w-full min-w-0 min-[400px]:w-auto`}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={reativarFrequentador}
                disabled={carregandoReativacao || !usuarioSelecionadoReativar}
                className={`${botaoPrimario} w-full min-w-0 min-[400px]:w-auto`}
              >
                {carregandoReativacao ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Reativando...
                  </>
                ) : (
                  <>
                    <UserRoundCheck size={17} aria-hidden="true" />
                    Reativar conta
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {modalDesativarAberto && usuarioParaDesativar && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              fecharModalDesativar();
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-desativacao"
            aria-describedby="descricao-desativacao"
            className={modalClasse}
          >
            <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--status-danger)]/20 bg-[var(--status-danger)]/10 text-[var(--status-danger)] min-[375px]:h-11 min-[375px]:w-11">
                  <CircleAlert size={23} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-desativacao"
                    className="break-words text-base font-bold min-[375px]:text-lg sm:text-xl"
                  >
                    Desativar frequentador
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Confirme se deseja continuar com esta ação.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="rounded-md border-2 border-[var(--border-default)] bg-[var(--surface-warm)] p-3 min-[375px]:p-4">
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  Frequentador selecionado
                </p>

                <p className="mt-1 break-words font-semibold">
                  {usuarioParaDesativar.nome}
                </p>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Identificação: {usuarioParaDesativar.id}
                </p>
              </div>

              <p
                id="descricao-desativacao"
                className="text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                Tem certeza de que deseja desativar esta conta? O frequentador
                deixará de fazer parte da lista de usuários ativos. Você poderá
                reativar a conta posteriormente pela opção de reativação.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 min-[400px]:flex-row min-[400px]:justify-end">
              <button
                type="button"
                disabled={carregandoDesativacao}
                onClick={fecharModalDesativar}
                className={`${botaoSecundario} w-full min-w-0 min-[400px]:w-auto`}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={carregandoDesativacao}
                onClick={confirmarDesativacao}
                className="inline-flex hover:cursor-pointer w-full min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--status-danger)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:w-auto"
              >
                {carregandoDesativacao ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Desativando...
                  </>
                ) : (
                  <>
                    <UserRoundX size={18} aria-hidden="true" />
                    Confirmar desativação
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
      {feedback && (
        <ModalFeedback
          aberto
          titulo={feedback.titulo}
          mensagem={feedback.mensagem}
          tipo={feedback.tipo}
          onFechar={() => setFeedback(null)}
        />
      )}
    </main>
  );
}
