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

export default function CadastrarLivroPage() {
  const [form, setForm] = useState<LivroForm>(estadoInicial);
  const [carregando, setCarregando] = useState(false);
  const [buscandoIsbn, setBuscandoIsbn] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔍 Função para buscar dados do livro na API do Google Books
  const buscarDadosPorIsbn = async () => {
    // Limpa pontuações ou traços do ISBN
    const isbnLimpo = form.isbn.replace(/[^0-9X]/gi, "");

    if (!isbnLimpo) {
      setMensagem("Por favor, digite um ISBN válido para buscar.");
      return;
    }

    setBuscandoIsbn(true);
    setMensagem("");

    try {
      const resposta = await fetch(`/api/google-books?isbn=${isbnLimpo}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao buscar dados do livro.");
      }

      // Preenche os campos do formulário automaticamente com os dados retornados
      setForm((prev) => ({
        ...prev,
        isbn: isbnLimpo,
        titulo_livro: dados.titulo_livro || prev.titulo_livro,
        autor_livro: dados.autor_livro || prev.autor_livro,
        editora_livro: dados.editora_livro || prev.editora_livro,
        anopub_livro: dados.anopub_livro
          ? String(dados.anopub_livro)
          : prev.anopub_livro,
        genero_livro: dados.genero_livro || prev.genero_livro,
        imgcapa_livro: dados.imgcapa_livro || prev.imgcapa_livro,
        sinopse_livro: dados.sinopse_livro || prev.sinopse_livro,
      }));

      setMensagem("Campos preenchidos automaticamente via Google Books!");
    } catch (erro) {
      const msg =
        erro instanceof Error ? erro.message : "Falha ao buscar ISBN.";
      setMensagem(msg);
    } finally {
      setBuscandoIsbn(false);
    }
  };

  const enviarLivroParaBackend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCarregando(true);
    setMensagem("");

    try {
      const dadosParaEnviar = {
        ...form,
        anopub_livro: Number(form.anopub_livro),
      };

      const resposta = await fetch("/api/livros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || "Erro ao cadastrar o livro.");
      }

      setMensagem("Livro cadastrado com sucesso!");
      setForm(estadoInicial);
    } catch (erro) {
      const mensagemErro =
        erro instanceof Error ? erro.message : "Falha ao cadastrar livro.";
      setMensagem(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem" }}>Cadastro de Livro</h1>

      <form
        onSubmit={enviarLivroParaBackend}
        style={{ display: "grid", gap: "1rem" }}
      >
        {/* Campo ISBN com o botão de busca lado a lado */}
        <div>
          <label
            style={{
              fontWeight: 600,
              display: "block",
              marginBottom: "0.3rem",
            }}
          >
            ISBN
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              placeholder="Ex: 9788535902778"
              required
              style={{
                flex: 1,
                padding: "0.7rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              type="button"
              onClick={buscarDadosPorIsbn}
              disabled={buscandoIsbn}
              style={{
                padding: "0.7rem 1.2rem",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: buscandoIsbn ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {buscandoIsbn ? "Buscando..." : "Buscar ISBN 🔍"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <label>
            Título
            <input
              type="text"
              name="titulo_livro"
              value={form.titulo_livro}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>

          <label>
            Autor
            <input
              type="text"
              name="autor_livro"
              value={form.autor_livro}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>

          <label>
            Editora
            <input
              type="text"
              name="editora_livro"
              value={form.editora_livro}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>

          <label>
            Ano de Publicação
            <input
              type="number"
              name="anopub_livro"
              value={form.anopub_livro}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>

          <label>
            Gênero
            <input
              type="text"
              name="genero_livro"
              value={form.genero_livro}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>

          <label>
            Localização (Estante/Prateleira)
            <input
              type="text"
              name="localizacao_livro"
              value={form.localizacao_livro}
              onChange={handleChange}
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>

          <label>
            URL da Capa
            <input
              type="url"
              name="imgcapa_livro"
              value={form.imgcapa_livro}
              onChange={handleChange}
              style={{ width: "100%", padding: "0.7rem", marginTop: "0.3rem" }}
            />
          </label>
        </div>

        <label>
          Sinopse
          <textarea
            name="sinopse_livro"
            value={form.sinopse_livro}
            onChange={handleChange}
            rows={4}
            style={{
              width: "100%",
              padding: "0.7rem",
              marginTop: "0.3rem",
              resize: "vertical",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={carregando}
          style={{
            padding: "0.9rem 1.2rem",
            backgroundColor: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: carregando ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {carregando ? "Cadastrando..." : "Cadastrar Livro"}
        </button>

        {mensagem && (
          <p
            style={{
              margin: 0,
              color:
                mensagem.includes("sucesso") ||
                mensagem.includes("automaticamente")
                  ? "#15803d"
                  : "#b91c1c",
              fontWeight: 600,
            }}
          >
            {mensagem}
          </p>
        )}
      </form>
    </main>
  );
}
