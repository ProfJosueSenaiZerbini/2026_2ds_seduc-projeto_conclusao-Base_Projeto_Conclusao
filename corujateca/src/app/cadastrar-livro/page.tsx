'use client';

import { FormEvent, useState } from 'react';

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
  isbn: '',
  titulo_livro: '',
  autor_livro: '',
  editora_livro: '',
  anopub_livro: '',
  genero_livro: '',
  localizacao_livro: '',
  imgcapa_livro: '',
  sinopse_livro: '',
};

export default function CadastrarLivroPage() {
  const [form, setForm] = useState<LivroForm>(estadoInicial);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const enviarLivroParaBackend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCarregando(true);
    setMensagem('');

    try {
      const dadosParaEnviar = {
        ...form,
        anopub_livro: Number(form.anopub_livro),
      };

      const resposta = await fetch('/api/livros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnviar),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || 'Erro ao cadastrar o livro.');
      }

      setMensagem('Livro cadastrado com sucesso!');
      setForm(estadoInicial);
      console.log('Livro salvo:', resultado.livro);
    } catch (erro) {
      const mensagemErro =
        erro instanceof Error ? erro.message : 'Falha ao cadastrar livro.';
      setMensagem(mensagemErro);
      console.error('Falha na requisição:', erro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: '2rem auto',
        padding: '2rem',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem' }}>Cadastro de livro</h1>

      {/*
        Área pronta para receber ajustes visuais depois.
        A funcionalidade de integração com o backend já está ativa.
      */}
      <form onSubmit={enviarLivroParaBackend} style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <label>
            ISBN
            <input
              type="text"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
            />
          </label>

          <label>
            Título
            <input
              type="text"
              name="titulo_livro"
              value={form.titulo_livro}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
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
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
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
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
            />
          </label>

          <label>
            Ano
            <input
              type="number"
              name="anopub_livro"
              value={form.anopub_livro}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
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
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
            />
          </label>

          <label>
            Localização
            <input
              type="text"
              name="localizacao_livro"
              value={form.localizacao_livro}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
            />
          </label>

          <label>
            URL da capa
            <input
              type="url"
              name="imgcapa_livro"
              value={form.imgcapa_livro}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
            />
          </label>
        </div>

        <label>
          Sinopse
          <textarea
            name="sinopse_livro"
            value={form.sinopse_livro}
            onChange={handleChange}
            rows={5}
            style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem', resize: 'vertical' }}
          />
        </label>

        <button
          type="submit"
          disabled={carregando}
          style={{
            padding: '0.9rem 1.2rem',
            backgroundColor: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: carregando ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {carregando ? 'Enviando...' : 'Cadastrar'}
        </button>

        {mensagem && (
          <p
            style={{
              margin: 0,
              color: mensagem.includes('sucesso') ? '#15803d' : '#b91c1c',
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