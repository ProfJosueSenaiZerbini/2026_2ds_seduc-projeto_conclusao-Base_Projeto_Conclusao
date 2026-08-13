'use client';

import { FormEvent, useEffect, useState } from 'react';

type LivroOption = {
  id_livro: number;
  titulo_livro: string;
  isbn: string;
};

export default function CadastrarExemplarPage() {
  const [livros, setLivros] = useState<LivroOption[]>([]);
  const [livroSelecionado, setLivroSelecionado] = useState<string>('');
  const [statusExemplar, setStatusExemplar] = useState<string>('Dispon_vel');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Carrega a lista de livros para preencher o <select>
  useEffect(() => {
    async function carregarLivros() {
      try {
        const resposta = await fetch('/api/livros');
        if (resposta.ok) {
          const dados = await resposta.json();
          setLivros(dados);
        }
      } catch (erro) {
        console.error('Erro ao carregar lista de livros:', erro);
      }
    }
    carregarLivros();
  }, []);

  const enviarExemplarParaBackend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCarregando(true);
    setMensagem('');

    try {
      const resposta = await fetch('/api/exemplares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fk_livro_id_livro: Number(livroSelecionado),
          status_exemplar: statusExemplar,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || 'Erro ao cadastrar o exemplar.');
      }

      setMensagem('Nova cópia (exemplar) cadastrada com sucesso!');
      setLivroSelecionado('');
      setStatusExemplar('Dispon_vel');
    } catch (erro) {
      const mensagemErro =
        erro instanceof Error ? erro.message : 'Falha ao cadastrar exemplar.';
      setMensagem(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 700,
        margin: '2rem auto',
        padding: '2rem',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem' }}>Cadastro de Exemplar (Cópia)</h1>

      <form onSubmit={enviarExemplarParaBackend} style={{ display: 'grid', gap: '1rem' }}>
        <label>
          Livro
          <select
            value={livroSelecionado}
            onChange={(e) => setLivroSelecionado(e.target.value)}
            required
            style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
          >
            <option value="">-- Selecione um livro --</option>
            {livros.map((livro) => (
              <option key={livro.id_livro} value={livro.id_livro}>
                {livro.titulo_livro} (ISBN: {livro.isbn})
              </option>
            ))}
          </select>
        </label>

        <label>
          Status do Exemplar
          <select
            value={statusExemplar}
            onChange={(e) => setStatusExemplar(e.target.value)}
            style={{ width: '100%', padding: '0.7rem', marginTop: '0.3rem' }}
          >
            <option value="Dispon_vel">Disponível</option>
            <option value="Em_posse">Em posse</option>
            <option value="Danificado">Danificado</option>
          </select>
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
          {carregando ? 'Cadastrando...' : 'Cadastrar Exemplar'}
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