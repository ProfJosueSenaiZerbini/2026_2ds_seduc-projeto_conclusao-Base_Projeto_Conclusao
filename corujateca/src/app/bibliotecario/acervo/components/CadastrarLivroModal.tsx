"use client";

import { FormEvent, useState } from "react";
import { generos } from "@/lib/generos";

const campoClasse =
  "w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";
const botaoPrimarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
const botaoSecundarioClasse =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

type LivroForm = {
  isbn: string;
  titulo_livro: string;
  autor_livro: string;
  editora_livro: string;
  anopub_livro: string;
  genero_livro: string;
  localizacao_livro: string;
  imgcapa_livro: string;
  sinopse_livro: string;
};

type CadastrarLivroModalProps = {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
};

const estadoInicial: LivroForm = {
  isbn: "",
  titulo_livro: "",
  autor_livro: "",
  editora_livro: "",
  anopub_livro: "",
  genero_livro: "",
  localizacao_livro: "",
  imgcapa_livro: "",
  sinopse_livro: "",
};

export default function CadastrarLivroModal({
  aberto,
  onFechar,
  onSucesso,
}: CadastrarLivroModalProps) {
  const [form, setForm] = useState<LivroForm>(estadoInicial);
  const [carregando, setCarregando] = useState(false);
  const [buscandoIsbn, setBuscandoIsbn] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function buscarDadosPorIsbn() {
    const isbnLimpo = form.isbn.replace(/[^0-9X]/gi, "");

    if (!isbnLimpo) {
      setErro("Digite um ISBN válido para buscar.");
      return;
    }

    try {
      setBuscandoIsbn(true);
      setErro("");
      setMensagem("");

      const resposta = await fetch(
        `/api/google-books?isbn=${isbnLimpo}`,
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao buscar dados do livro.",
        );
      }

      setForm((prev) => ({
        ...prev,
        isbn: isbnLimpo,
        titulo_livro:
          dados.titulo_livro || prev.titulo_livro,
        autor_livro:
          dados.autor_livro || prev.autor_livro,
        editora_livro:
          dados.editora_livro || prev.editora_livro,
        anopub_livro: dados.anopub_livro
          ? String(dados.anopub_livro)
          : prev.anopub_livro,
        imgcapa_livro:
          dados.imgcapa_livro || prev.imgcapa_livro,
        sinopse_livro:
          dados.sinopse_livro || prev.sinopse_livro,
      }));

      setMensagem(
        "Campos preenchidos automaticamente via Google Books!",
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao buscar ISBN.",
      );
    } finally {
      setBuscandoIsbn(false);
    }
  }

  async function enviarLivroParaBackend(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const dadosParaEnviar = {
        ...form,
        anopub_livro: Number(form.anopub_livro),
      };

      const resposta = await fetch("/api/livros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.erro || "Erro ao cadastrar o livro.",
        );
      }

      onSucesso();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao cadastrar livro.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    if (carregando || buscandoIsbn) return;

    setForm(estadoInicial);
    setMensagem("");
    setErro("");
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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Cadastrar Novo Livro
            </h2>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Cadastre uma nova obra no acervo.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={carregando || buscandoIsbn}
            aria-label="Fechar cadastro de livro"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button)] text-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={enviarLivroParaBackend}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
              ISBN
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                placeholder="Ex: 9788535902778"
                required
                className={campoClasse}
              />

              <button
                type="button"
                onClick={buscarDadosPorIsbn}
                disabled={buscandoIsbn}
                className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buscandoIsbn ? "Buscando..." : "Buscar ISBN"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                Título
              </label>

              <input
                type="text"
                name="titulo_livro"
                value={form.titulo_livro}
                onChange={handleChange}
                required
                className={campoClasse}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                Autor
              </label>

              <input
                type="text"
                name="autor_livro"
                value={form.autor_livro}
                onChange={handleChange}
                required
                className={campoClasse}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                Editora
              </label>

              <input
                type="text"
                name="editora_livro"
                value={form.editora_livro}
                onChange={handleChange}
                required
                className={campoClasse}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                Ano de Publicação
              </label>

              <input
                type="number"
                name="anopub_livro"
                value={form.anopub_livro}
                onChange={handleChange}
                required
                className={campoClasse}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                Gênero
              </label>

              <select
                name="genero_livro"
                value={form.genero_livro}
                onChange={handleChange}
                required
                className={campoClasse}
              >
                <option value="" disabled>
                  Selecione um gênero
                </option>

                {generos.map((genero) => (
                  <option key={genero} value={genero}>
                    {genero}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                Localização
              </label>

              <input
                type="text"
                name="localizacao_livro"
                value={form.localizacao_livro}
                onChange={handleChange}
                placeholder="Estante / Prateleira"
                className={campoClasse}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
                URL da Capa
              </label>

              <input
                type="url"
                name="imgcapa_livro"
                value={form.imgcapa_livro}
                onChange={handleChange}
                placeholder="https://..."
                className={campoClasse}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
              Sinopse
            </label>

            <textarea
              name="sinopse_livro"
              value={form.sinopse_livro}
              onChange={handleChange}
              rows={4}
              className={`${campoClasse} resize-y`}
            />
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
              disabled={carregando || buscandoIsbn}
              className={`${botaoSecundarioClasse} w-full sm:w-auto`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando || buscandoIsbn}
              className={`${botaoPrimarioClasse} w-full sm:w-auto`}
            >
              {carregando ? "Cadastrando..." : "Cadastrar Livro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}