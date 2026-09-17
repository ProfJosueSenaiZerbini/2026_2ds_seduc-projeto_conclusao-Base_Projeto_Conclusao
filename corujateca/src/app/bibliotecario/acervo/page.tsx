"use client";

import { useEffect, useState } from "react";
import CadastrarExemplarModal from "@/app/bibliotecario/acervo/components/CadastrarExemplarModal";

import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth";
import LivroCarousel from "@/app/frequentador/acervo/components/LivroCarousel";
import CadastrarLivroModal from "@/app/bibliotecario/acervo/components/CadastrarLivroModal";
import ReativarLivroModal from "@/app/bibliotecario/acervo/components/ReativarLivroModal";
import LivroGrid from "@/app/frequentador/acervo/components/LivroGrid";

type Livro = {
  id_livro: number;
  titulo_livro: string;
  autor_livro: string;
  genero_livro: string;
  imgcapa_livro: string | null;
};

const LIVROS_POR_PAGINA = 20;

export default function AcervoBib() {
  const [nomeUsuario, setNomeUsuario] = useState("Visitante");
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [ano, setAno] = useState("");
  const [autor, setAutor] = useState("");

  const [modalReativarLivro, setModalReativarLivro] = useState(false);
  const [modalCadastrarLivro, setModalCadastrarLivro] = useState(false);
  const [modalCadastrarExemplar, setModalCadastrarExemplar] =
    useState(false);

  const [livros, setLivros] = useState<Livro[]>([]);
  const [livrosTodos, setLivrosTodos] = useState<Livro[]>([]);
  const [livrosGeneroSemana, setLivrosGeneroSemana] = useState<Livro[]>([]);
  const [livrosMaisEmprestados, setLivrosMaisEmprestados] =
    useState<Livro[]>([]);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [quantidadeTitulos, setQuantidadeTitulos] = useState(0);
  const [quantidadeTotal, setQuantidadeTotal] = useState(0);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session?.nome) {
      setNomeUsuario(session.nome);
    }
  }, []);

  useEffect(() => {
    async function carregarDadosAcervo() {
      try {
        setErro("");

        const [
          respostaTodos,
          respostaGenero,
          respostaMaisEmprestados,
          respostaQuantidade,
        ] = await Promise.all([
          fetch(
            `/api/livros?page=${paginaAtual}&limit=${LIVROS_POR_PAGINA}`,
          ),
          fetch("/api/livros/genero-semana"),
          fetch("/api/livros/mais-emprestados"),
          fetch("/api/livros/quantidade"),
        ]);

        if (!respostaTodos.ok) {
          throw new Error("Erro ao buscar todos os livros.");
        }

        if (!respostaGenero.ok) {
          throw new Error("Erro ao buscar o gênero da semana.");
        }

        if (!respostaMaisEmprestados.ok) {
          throw new Error("Erro ao buscar os livros mais emprestados.");
        }

        if (!respostaQuantidade.ok) {
          throw new Error("Erro ao buscar a quantidade do acervo.");
        }

        const dadosTodos = await respostaTodos.json();
        const dadosGenero = await respostaGenero.json();
        const dadosMaisEmprestados = await respostaMaisEmprestados.json();
        const dadosQuantidade = await respostaQuantidade.json();

        setLivrosTodos(dadosTodos.livros);
        setTotalPaginas(dadosTodos.totalPaginas);

        setLivrosGeneroSemana(dadosGenero.livros);
        setLivrosMaisEmprestados(dadosMaisEmprestados.livros);

        setQuantidadeTitulos(dadosQuantidade.quantidadeTitulos);
        setQuantidadeTotal(dadosQuantidade.quantidadeTotal);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os livros.");
      }
    }

    if (!pesquisaRealizada) {
      carregarDadosAcervo();
    }
  }, [paginaAtual, pesquisaRealizada]);

  async function buscarLivros() {
    try {
      setCarregando(true);
      setErro("");
      setPesquisaRealizada(true);

      const params = new URLSearchParams();

      if (titulo.trim()) {
        params.append("titulo", titulo.trim());
      }

      if (genero.trim()) {
        params.append("genero", genero.trim());
      }

      if (ano.trim()) {
        params.append("ano", ano.trim());
      }

      if (autor.trim()) {
        params.append("autor", autor.trim());
      }

      const resposta = await fetch(`/api/livros?${params.toString()}`);

      if (!resposta.ok) {
        throw new Error("Erro ao buscar livros.");
      }

      const dados = await resposta.json();

      setLivros(dados.livros);
    } catch (error) {
      console.error(error);

      setErro("Não foi possível buscar os livros.");
      setLivros([]);
    } finally {
      setCarregando(false);
    }
  }

  function limparPesquisa() {
    setTitulo("");
    setGenero("");
    setAno("");
    setAutor("");

    setLivros([]);
    setPesquisaRealizada(false);
    setPaginaAtual(1);
    setErro("");
  }

  function atualizarTela() {
    window.location.reload();
  }

  function mudarPagina(novaPagina: number) {
    if (novaPagina < 1 || novaPagina > totalPaginas) {
      return;
    }

    setPaginaAtual(novaPagina);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <Header />

      <div className="flex">
        <Nav />

        <main className="flex-1 min-w-0 p-6 md:p-14 bg-(--color-background)">
          {/* Boas-vindas */}

          <section className="mb-4">
            <p className="text-base sm:text-lg text-[var(--color-text-primary)]">
              Bem-vindo,{" "}
              <strong className="font-bold">{nomeUsuario}</strong>
            </p>
          </section>

          {/* Informações do acervo */}

          <section className="mb-4">
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              <div
                className="
                rounded-xl
                shadow-md
                bg-[var(--color-brand-500)]
                text-[var(--color-text-inverse)]
                flex
                flex-col
                items-center
                justify-center
                text-center
                min-h-28
                sm:min-h-32
                p-3
                py-12
              "
              >
                <p className="text-sm sm:text-base md:text-lg leading-tight">
                  Quantidade de
                  <br />
                  Títulos:
                </p>

                <p className="text-sm sm:text-base md:text-lg leading-tight">
                  {quantidadeTitulos}
                </p>
              </div>

              <div
                className="
                rounded-xl
                shadow-md
                bg-[var(--color-brand-500)]
                text-[var(--color-text-inverse)]
                flex
                flex-col
                items-center
                justify-center
                text-center
                min-h-28
                sm:min-h-32
                p-3
                py-12
              "
              >
                <p className="text-sm sm:text-base md:text-lg leading-tight">
                  Quantidade Total
                  <br />
                  de Livros:
                </p>

                <p className="text-sm sm:text-base md:text-lg leading-tight">
                  {quantidadeTotal}
                </p>
              </div>
            </div>
          </section>

          {/* Funções do bibliotecário */}

          <section className="mb-6">
            <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setModalCadastrarLivro(true)}
                className="
                  w-full
                  px-5
                  py-2.5
                  rounded-lg
                  bg-[var(--color-button-primary)]
                  text-[var(--color-text-inverse)]
                  font-bold
                  cursor-pointer
                "
              >
                Cadastrar Novo Livro
              </button>

              <button
                type="button"
                onClick={() => setModalCadastrarExemplar(true)}
                className="
                  w-full
                  px-5
                  py-2.5
                  rounded-lg
                  bg-[var(--color-button-primary)]
                  text-[var(--color-text-inverse)]
                  font-bold
                  cursor-pointer
                "
              >
                Cadastrar Nova Cópia
              </button>

              <button
                type="button"
                onClick={() => setModalReativarLivro(true)}
                className="
                  col-span-2
                  justify-self-center
                  px-12
                  py-2.5
                  rounded-lg
                  bg-[var(--color-button-primary)]
                  text-[var(--color-text-inverse)]
                  font-bold
                  cursor-pointer
                "
              >
                Reativar Livro
              </button>
            </div>
          </section>

          {/* Pesquisa */}

          <div className="bg-[var(--color-brand-100)] p-8 rounded-xl mb-6">
            <section className="mb-6">
              <p className="text-sm mb-2">
                Interessado em algum livro?
              </p>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Título"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="
                    w-full
                    border
                    rounded-lg
                    px-3
                    py-2
                  "
                />

                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                    "
                  >
                    <option value="">Todos os gêneros</option>
                    <option value="Romance">Romance</option>
                    <option value="Religião e Mitologia">
                      Religião e Mitologia
                    </option>
                    <option value="Ficção Científica">
                      Ficção Científica
                    </option>
                    <option value="Arte e Cultura">
                      Arte e Cultura
                    </option>
                    <option value="Fantasia">Fantasia</option>
                    <option value="Biografias e Memórias">
                      Biografias e Memórias
                    </option>
                    <option value="Thriller e Mistério">
                      Thriller e Mistério
                    </option>
                    <option value="Quadrinhos e Mangá">
                      Quadrinhos e Mangá
                    </option>
                    <option value="Terror">Terror</option>
                    <option value="Infantojuvenil">
                      Infantojuvenil
                    </option>
                    <option value="Aventura">Aventura</option>
                    <option value="Ciência e Conhecimento">
                      Ciência e Conhecimento
                    </option>
                    <option value="Poesia e Crônicas">
                      Poesia e Crônicas
                    </option>
                    <option value="História">História</option>
                    <option value="Guia, Manual e Gastronomia">
                      Guia, Manual e Gastronomia
                    </option>
                    <option value="Política">Política</option>
                    <option value="Autoajuda e Desenvolvimento Pessoal">
                      Autoajuda e Desenvolvimento Pessoal
                    </option>
                    <option value="Economia">Economia</option>
                    <option value="Literatura">Literatura</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Ano"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                    "
                  />

                  <input
                    type="text"
                    placeholder="Autor"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                    "
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={buscarLivros}
                    disabled={carregando}
                    className="
                      mt-2
                      px-6
                      py-3
                      rounded-lg
                      bg-[var(--color-brand-500)]
                      text-[var(--color-text-inverse)]
                      font-bold
                      hover:bg-[var(--color-brand-400)]
                      transition-colors
                    "
                  >
                    {carregando ? "Buscando..." : "Pesquisar"}
                  </button>

                  {pesquisaRealizada && (
                    <button
                      type="button"
                      onClick={limparPesquisa}
                      className="
                        mt-2
                        px-6
                        py-3
                        rounded-lg
                        border
                        border-[var(--color-brand-500)]
                        text-[var(--color-brand-500)]
                        font-bold
                      "
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Erro */}

          {erro && (
            <p className="mb-4 text-[var(--color-text-primary)]">
              {erro}
            </p>
          )}

          {/* Acervo */}

          <div className="bg-[var(--color-brand-100)] p-8 rounded-xl">
            {!pesquisaRealizada ? (
              <>
                {/* Gênero da Semana */}

                <LivroCarousel
                  titulo="Gênero da Semana"
                  livros={livrosGeneroSemana}
                />

                {/* Mais Emprestados */}

                <LivroCarousel
                  titulo="Mais Emprestados"
                  livros={livrosMaisEmprestados}
                />

                {/* Todos */}

                <LivroGrid
                  titulo="Todos"
                  livros={livrosTodos}
                />

                {/* Paginação */}

                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        mudarPagina(paginaAtual - 1)
                      }
                      disabled={paginaAtual === 1}
                      className="
                        w-10
                        h-10
                        rounded-full
                        bg-[var(--color-brand-500)]
                        text-[var(--color-text-inverse)]
                        flex
                        items-center
                        justify-center
                        font-bold
                        text-lg
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                        cursor-pointer
                      "
                      aria-label="Página anterior"
                    >
                      ←
                    </button>

                    <span className="font-bold text-[var(--color-text-primary)]">
                      {paginaAtual} / {totalPaginas}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        mudarPagina(paginaAtual + 1)
                      }
                      disabled={paginaAtual === totalPaginas}
                      className="
                        w-10
                        h-10
                        rounded-full
                        bg-[var(--color-brand-500)]
                        text-[var(--color-text-inverse)]
                        flex
                        items-center
                        justify-center
                        font-bold
                        text-lg
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                        cursor-pointer
                      "
                      aria-label="Próxima página"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Resultados da Pesquisa */}

                {livros.length > 0 ? (
                  <LivroCarousel
                    titulo="Resultados da pesquisa"
                    livros={livros}
                  />
                ) : (
                  !carregando && (
                    <p className="text-[var(--color-text-primary)]">
                      Nenhum livro encontrado.
                    </p>
                  )
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />

      <CadastrarExemplarModal
        aberto={modalCadastrarExemplar}
        onFechar={() => setModalCadastrarExemplar(false)}
        onSucesso={atualizarTela}
      />

      <CadastrarLivroModal
        aberto={modalCadastrarLivro}
        onFechar={() => setModalCadastrarLivro(false)}
        onSucesso={atualizarTela}
      />

      <ReativarLivroModal
        aberto={modalReativarLivro}
        onFechar={() => setModalReativarLivro(false)}
        onSucesso={atualizarTela}
      />
    </div>
  );
}