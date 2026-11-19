"use client";

import { useEffect, useState } from "react";

const campoClasse =
  "w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const botaoPrimarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
const botaoSecundarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

type Livro = {
  id_livro: number;
  titulo_livro: string;
  autor_livro: string;
  isbn: string;
};

type ReativarLivroModalProps = {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
};

export default function ReativarLivroModal({
  aberto,
  onFechar,
  onSucesso,
}: ReativarLivroModalProps) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [livroSelecionado, setLivroSelecionado] = useState("");

  const [carregandoLivros, setCarregandoLivros] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [confirmacao, setConfirmacao] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;

    async function carregarLivrosInativos() {
      try {
        setCarregandoLivros(true);
        setErro("");
        setMensagem("");

        const resposta = await fetch("/api/livros/reativar-livros");

        if (!resposta.ok) {
          throw new Error(
            "Não foi possível carregar os livros inativos.",
          );
        }

        const dados = await resposta.json();

        setLivros(dados);
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os livros inativos.",
        );
      } finally {
        setCarregandoLivros(false);
      }
    }

    carregarLivrosInativos();
  }, [aberto]);

  function abrirConfirmacao() {
    if (!livroSelecionado) {
      setErro("Selecione um livro para reativar.");
      return;
    }

    setErro("");
    setConfirmacao(true);
  }

  function cancelarConfirmacao() {
    if (carregando) return;

    setConfirmacao(false);
  }

  async function reativarLivro() {
    if (!livroSelecionado) {
      setErro("Selecione um livro para reativar.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const resposta = await fetch(
        `/api/livros/${livroSelecionado}/reativar`,
        {
          method: "PATCH",
        },
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.erro || "Erro ao reativar o livro.",
        );
      }

      onSucesso();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao reativar o livro.",
      );

      setConfirmacao(false);
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    if (carregando) return;

    setLivroSelecionado("");
    setMensagem("");
    setErro("");
    setConfirmacao(false);

    onFechar();
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          fecharModal();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Reativar Livro
            </h2>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Selecione um livro inativo para reativá-lo.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={carregando}
            aria-label="Fechar reativação de livro"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
              Livro
            </label>

            {carregandoLivros ? (
              <p aria-live="polite" className="rounded-lg bg-[var(--surface-hover)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                Carregando livros...
              </p>
            ) : livros.length === 0 ? (
              <p className="rounded-lg bg-[var(--surface-hover)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                Não há livros inativos para reativar.
              </p>
            ) : (
              <select
                value={livroSelecionado}
                onChange={(event) => {
                  setLivroSelecionado(event.target.value);
                  setErro("");
                  setMensagem("");
                }}
                className={campoClasse}
              >
                <option value="" disabled>
                  Selecione um livro
                </option>

                {livros.map((livro) => (
                  <option
                    key={livro.id_livro}
                    value={livro.id_livro}
                  >
                    {livro.titulo_livro} — {livro.autor_livro}
                  </option>
                ))}
              </select>
            )}
          </div>

          {mensagem && (
            <p role="status" className="rounded-lg bg-[var(--status-success)]/10 px-3 py-2 text-sm font-medium text-[var(--status-success)]">
              {mensagem}
            </p>
          )}

          {erro && (
            <p role="alert" className="rounded-lg bg-[var(--status-danger)]/10 px-3 py-2 text-sm font-medium text-[var(--status-danger)]">
              {erro}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={fecharModal}
              disabled={carregando}
              className={`${botaoSecundarioClasse} w-full sm:w-auto`}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={abrirConfirmacao}
              disabled={
                carregando ||
                carregandoLivros ||
                !livroSelecionado
              }
              className={`${botaoPrimarioClasse} w-full sm:w-auto`}
            >
              Reativar Livro
            </button>
          </div>
        </div>
      </div>

      {confirmacao && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cancelarConfirmacao();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Confirmar reativação
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Deseja realmente reativar esse livro?
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelarConfirmacao}
                disabled={carregando}
                className={`${botaoSecundarioClasse} w-full sm:w-auto`}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={reativarLivro}
                disabled={carregando}
                className={`${botaoPrimarioClasse} w-full sm:w-auto`}
              >
                {carregando ? "Reativando..." : "Sim, reativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}