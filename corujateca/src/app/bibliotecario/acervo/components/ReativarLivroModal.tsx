"use client";

import { useEffect, useState } from "react";

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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          fecharModal();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-background)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Reativar Livro
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-primary)]">
              Selecione um livro inativo para reativá-lo.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={carregando}
            className="text-lg font-bold text-[var(--color-text-primary)] cursor-pointer disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">
              Livro
            </label>

            {carregandoLivros ? (
              <p className="text-sm text-[var(--color-text-primary)]">
                Carregando livros...
              </p>
            ) : livros.length === 0 ? (
              <p className="text-sm text-[var(--color-text-primary)]">
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
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
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
            <p className="text-sm font-bold text-green-700">
              {mensagem}
            </p>
          )}

          {erro && (
            <p className="text-sm font-bold text-red-700">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={fecharModal}
              disabled={carregando}
              className="rounded-lg border border-[var(--color-brand-500)] px-5 py-2.5 font-bold text-[var(--color-brand-500)] cursor-pointer disabled:cursor-not-allowed"
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
              className="rounded-lg bg-[var(--color-button-primary)] px-5 py-2.5 font-bold text-[var(--color-text-inverse)] cursor-pointer disabled:cursor-not-allowed"
            >
              Reativar Livro
            </button>
          </div>
        </div>
      </div>

      {confirmacao && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cancelarConfirmacao();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-background)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Confirmar reativação
            </h3>

            <p className="mt-3 text-sm text-[var(--color-text-primary)]">
              Deseja realmente reativar esse livro?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelarConfirmacao}
                disabled={carregando}
                className="rounded-lg border border-[var(--color-brand-500)] px-4 py-2 font-bold text-[var(--color-brand-500)] cursor-pointer disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={reativarLivro}
                disabled={carregando}
                className="rounded-lg bg-[var(--color-button-primary)] px-4 py-2 font-bold text-[var(--color-text-inverse)] cursor-pointer disabled:cursor-not-allowed"
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