"use client";

import { FormEvent, useState } from "react";

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

const generos = [
  "Romance",
  "Religião e Mitologia",
  "Ficção Científica",
  "Arte e Cultura",
  "Fantasia",
  "Biografias e Memórias",
  "Thriller e Mistério",
  "Quadrinhos e Mangá",
  "Terror",
  "Infantojuvenil",
  "Aventura",
  "Ciência e Conhecimento",
  "Poesia e Crônicas",
  "História",
  "Guia, Manual e Gastronomia",
  "Política",
  "Autoajuda e Desenvolvimento Pessoal",
  "Economia",
  "Literatura",
];

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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          fecharModal();
        }
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Cadastrar Novo Livro
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-primary)]">
              Cadastre uma nova obra no acervo.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={carregando || buscandoIsbn}
            className="text-lg font-bold text-[var(--color-text-primary)] cursor-pointer disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={enviarLivroParaBackend}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-bold mb-2">
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
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />

              <button
                type="button"
                onClick={buscarDadosPorIsbn}
                disabled={buscandoIsbn}
                className="shrink-0 rounded-lg bg-[var(--color-button-primary)] px-4 py-2 font-bold text-[var(--color-text-inverse)] cursor-pointer disabled:cursor-not-allowed"
              >
                {buscandoIsbn ? "Buscando..." : "Buscar ISBN"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-2">
                Título
              </label>

              <input
                type="text"
                name="titulo_livro"
                value={form.titulo_livro}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Autor
              </label>

              <input
                type="text"
                name="autor_livro"
                value={form.autor_livro}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Editora
              </label>

              <input
                type="text"
                name="editora_livro"
                value={form.editora_livro}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Ano de Publicação
              </label>

              <input
                type="number"
                name="anopub_livro"
                value={form.anopub_livro}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Gênero
              </label>

              <select
                name="genero_livro"
                value={form.genero_livro}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
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
              <label className="block text-sm font-bold mb-2">
                Localização
              </label>

              <input
                type="text"
                name="localizacao_livro"
                value={form.localizacao_livro}
                onChange={handleChange}
                placeholder="Estante / Prateleira"
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">
                URL da Capa
              </label>

              <input
                type="url"
                name="imgcapa_livro"
                value={form.imgcapa_livro}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Sinopse
            </label>

            <textarea
              name="sinopse_livro"
              value={form.sinopse_livro}
              onChange={handleChange}
              rows={4}
              className="w-full resize-y rounded-lg border border-[var(--color-brand-300)] bg-[var(--color-background)] px-3 py-2"
            />
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
              disabled={carregando || buscandoIsbn}
              className="rounded-lg border border-[var(--color-brand-500)] px-5 py-2.5 font-bold text-[var(--color-brand-500)] cursor-pointer disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando || buscandoIsbn}
              className="rounded-lg bg-[var(--color-button-primary)] px-5 py-2.5 font-bold text-[var(--color-text-inverse)] cursor-pointer disabled:cursor-not-allowed"
            >
              {carregando ? "Cadastrando..." : "Cadastrar Livro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}