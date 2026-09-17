"use client";

import { FormEvent, useEffect, useState } from "react";

type LivroOption = {
  id_livro: number;
  titulo_livro: string;
  isbn: string;
};

type ModalCadastrarExemplarProps = {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
};

export default function CadastrarExemplarModal({
  aberto,
  onFechar,
  onSucesso,
}: ModalCadastrarExemplarProps) {
  const [livros, setLivros] = useState<LivroOption[]>([]);
  const [livroSelecionado, setLivroSelecionado] = useState("");
  const [statusExemplar, setStatusExemplar] = useState("Dispon_vel");
  const [quantidade, setQuantidade] = useState("1");

  const [carregandoLivros, setCarregandoLivros] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) {
      return;
    }

    async function carregarLivros() {
      try {
        setCarregandoLivros(true);
        setErro("");

        const resposta = await fetch("/api/livros");

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os livros.");
        }

        const dados = await resposta.json();

        setLivros(dados);
      } catch (error) {
        console.error(error);

        setErro("Não foi possível carregar a lista de livros.");
      } finally {
        setCarregandoLivros(false);
      }
    }

    carregarLivros();
  }, [aberto]);

  function fecharModal() {
    if (carregando) {
      return;
    }

    setLivroSelecionado("");
    setStatusExemplar("Dispon_vel");
    setQuantidade("1");
    setMensagem("");
    setErro("");

    onFechar();
  }

  async function enviarExemplar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const quantidadeNumerica = Number(quantidade);

    if (!livroSelecionado) {
      setErro("Selecione um livro.");
      return;
    }

    if (
      !Number.isInteger(quantidadeNumerica) ||
      quantidadeNumerica < 1
    ) {
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
            resultado.erro ||
              `Erro ao cadastrar a cópia ${i + 1}.`,
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

  if (!aberto) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[999]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          fecharModal();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-2xl
          bg-[var(--color-background)]
          p-6
          shadow-2xl
        "
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-[var(--color-text-primary)]
              "
            >
              Cadastrar Novas Cópias
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[var(--color-text-secondary)]
              "
            >
              Adicione uma ou mais cópias a um livro já cadastrado.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={carregando}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-xl
              text-[var(--color-text-secondary)]
              hover:bg-[var(--color-brand-100)]
              hover:text-[var(--color-text-primary)]
              transition-colors
            "
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={enviarExemplar}
          className="flex flex-col gap-5"
        >
          <div>
            <label
              htmlFor="livro"
              className="
                mb-2
                block
                text-sm
                font-bold
                text-[var(--color-text-primary)]
              "
            >
              Livro
            </label>

            <select
              id="livro"
              value={livroSelecionado}
              onChange={(event) =>
                setLivroSelecionado(event.target.value)
              }
              required
              disabled={carregandoLivros || carregando}
              className="
                w-full
                rounded-lg
                border
                border-[var(--color-brand-300)]
                bg-[var(--color-background)]
                px-3
                py-3
                text-sm
                text-[var(--color-text-primary)]
                outline-none
              "
            >
              <option value="">
                {carregandoLivros
                  ? "Carregando livros..."
                  : "Selecione um livro"}
              </option>

              {livros.map((livro) => (
                <option
                  key={livro.id_livro}
                  value={livro.id_livro}
                >
                  {livro.titulo_livro} — ISBN: {livro.isbn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quantidade"
              className="
                mb-2
                block
                text-sm
                font-bold
                text-[var(--color-text-primary)]
              "
            >
              Quantidade de cópias
            </label>

            <input
              id="quantidade"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              onChange={(event) =>
                setQuantidade(event.target.value)
              }
              disabled={carregando}
              required
              className="
                w-full
                rounded-lg
                border
                border-[var(--color-brand-300)]
                bg-[var(--color-background)]
                px-3
                py-3
                text-sm
                text-[var(--color-text-primary)]
                outline-none
              "
            />
          </div>

          <div>
            <label
              htmlFor="status-exemplar"
              className="
                mb-2
                block
                text-sm
                font-bold
                text-[var(--color-text-primary)]
              "
            >
              Status das cópias
            </label>

            <select
              id="status-exemplar"
              value={statusExemplar}
              onChange={(event) =>
                setStatusExemplar(event.target.value)
              }
              disabled={carregando}
              className="
                w-full
                rounded-lg
                border
                border-[var(--color-brand-300)]
                bg-[var(--color-background)]
                px-3
                py-3
                text-sm
                text-[var(--color-text-primary)]
                outline-none
              "
            >
              <option value="Dispon_vel">
                Disponível
              </option>
            </select>
          </div>

          {erro && (
            <div
              className="
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700
              "
            >
              {erro}
            </div>
          )}

          {mensagem && (
            <div
              className="
                rounded-lg
                border
                border-green-200
                bg-green-50
                px-4
                py-3
                text-sm
                text-green-700
              "
            >
              {mensagem}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={fecharModal}
              disabled={carregando}
              className="
                rounded-lg
                border
                border-[var(--color-brand-500)]
                px-5
                py-2.5
                font-bold
                text-[var(--color-brand-500)]
                transition-colors
                hover:bg-[var(--color-brand-100)]
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando || carregandoLivros}
              className="
                rounded-lg
                bg-[var(--color-brand-500)]
                px-5
                py-2.5
                font-bold
                text-[var(--color-text-inverse)]
                transition-colors
                hover:bg-[var(--color-brand-400)]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {carregando
                ? "Cadastrando..."
                : "Cadastrar Cópias"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}