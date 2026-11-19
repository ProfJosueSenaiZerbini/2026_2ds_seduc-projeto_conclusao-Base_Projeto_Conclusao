"use client";

import { FormEvent, useEffect, useState } from "react";

const campoClasse =
  "w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const botaoPrimarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
const botaoSecundarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

type LivroOption = {
  id_livro: number;
  titulo_livro: string;
  isbn?: string;
};

type ModalCadastrarExemplarProps = {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  livro: LivroOption | null;
};

export default function CadastrarExemplarModal({
  aberto,
  onFechar,
  onSucesso,
  livro,
}: ModalCadastrarExemplarProps) {
  const [livroSelecionado, setLivroSelecionado] = useState("");
  const [statusExemplar, setStatusExemplar] = useState("Dispon_vel");
  const [quantidade, setQuantidade] = useState("1");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;

    setLivroSelecionado(livro ? String(livro.id_livro) : "");
    setStatusExemplar("Dispon_vel");
    setQuantidade("1");
    setMensagem("");
    setErro("");
  }, [aberto, livro]);

  function fecharModal() {
    if (carregando) return;

    setMensagem("");
    setErro("");
    onFechar();
  }

  async function enviarExemplar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantidadeNumerica = Number(quantidade);

    if (!livro || !livroSelecionado) {
      setErro("Não foi possível identificar o livro selecionado.");
      return;
    }

    if (!Number.isInteger(quantidadeNumerica) || quantidadeNumerica < 1) {
      setErro("A quantidade deve ser de pelo menos 1 cópia.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");
      setErro("");

      for (let i = 0; i < quantidadeNumerica; i++) {
        const resposta = await fetch("/api/exemplares", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fk_livro_id_livro: Number(livroSelecionado),
            status_exemplar: statusExemplar,
          }),
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            resultado.erro || `Erro ao cadastrar a cópia ${i + 1}.`,
          );
        }
      }

      onSucesso();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao cadastrar as cópias.",
      );
    } finally {
      setCarregando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) fecharModal();
      }}
    >
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Cadastrar novas cópias
            </h2>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Adicione uma ou mais cópias a este livro.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={carregando}
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed"
            aria-label="Fechar cadastro de cópias"
          >
            ×
          </button>
        </div>

        <form onSubmit={enviarExemplar} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="livro"
              className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]"
            >
              Livro selecionado
            </label>

            <input
              id="livro"
              type="text"
              value={livro?.titulo_livro ?? ""}
              readOnly
              disabled={!livro}
              className={`${campoClasse} bg-[var(--surface-hover)]`}
            />

            {livro?.isbn && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                ISBN: {livro.isbn}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="quantidade"
              className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]"
            >
              Quantidade de cópias
            </label>

            <input
              id="quantidade"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              disabled={carregando}
              required
              className={campoClasse}
            />
          </div>

          <div>
            <label
              htmlFor="status-exemplar"
              className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]"
            >
              Status das cópias
            </label>

            <select
              id="status-exemplar"
              value={statusExemplar}
              onChange={(event) => setStatusExemplar(event.target.value)}
              disabled={carregando}
              className={campoClasse}
            >
              <option value="Dispon_vel">Disponível</option>
            </select>
          </div>

          {erro && (
            <div
              role="alert"
              className="rounded-lg bg-[var(--status-danger)]/10 px-4 py-3 text-sm text-[var(--status-danger)]"
            >
              {erro}
            </div>
          )}

          {mensagem && (
            <div
              role="status"
              className="rounded-lg bg-[var(--status-success)]/10 px-4 py-3 text-sm text-[var(--status-success)]"
            >
              {mensagem}
            </div>
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
              type="submit"
              disabled={carregando || !livro}
              className={`${botaoPrimarioClasse} w-full sm:w-auto`}
            >
              {carregando ? "Cadastrando..." : "Cadastrar Cópias"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
