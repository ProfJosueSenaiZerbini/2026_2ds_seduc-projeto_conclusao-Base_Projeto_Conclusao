"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import LivroCarousel from "@/app/frequentador/acervo/components/LivroCarousel";
import LivroGrid from "@/app/frequentador/acervo/components/LivroGrid";
import Pagination from "@/components/Pagination";
import { AlertCircle, RotateCcw, Search } from "lucide-react";

type Livro = {
  id_livro: number;
  titulo_livro: string;
  autor_livro: string;
  genero_livro: string;
  imgcapa_livro: string | null;
  possui_exemplar_disponivel?: boolean;
};

const LIVROS_POR_PAGINA = 20;

export default function AcervoFreq() {
  const [nomeUsuario, setNomeUsuario] = useState("");

  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [copias, setCopias] = useState("");
  const [ano, setAno] = useState("");
  const [autor, setAutor] = useState("");

  const [livros, setLivros] = useState<Livro[]>([]);
  const [livrosTodos, setLivrosTodos] = useState<Livro[]>([]);
  const [livrosGeneroSemana, setLivrosGeneroSemana] = useState<Livro[]>([]);
  const [livrosMaisEmprestados, setLivrosMaisEmprestados] = useState<Livro[]>(
    [],
  );

  // Gênero sorteado da semana
  const [generoSemana, setGeneroSemana] = useState("");

  // Paginação da seção "Todos"
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalLivros, setTotalLivros] = useState(0);

  // Paginação dos resultados da pesquisa
  const [paginaPesquisa, setPaginaPesquisa] = useState(1);
  const [totalPaginasPesquisa, setTotalPaginasPesquisa] = useState(1);
  const [totalLivrosPesquisa, setTotalLivrosPesquisa] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (session?.nome) {
      setNomeUsuario(session.nome);
    }
  }, []);

  /*
   * Carrega os dados do acervo principal.
   */
  useEffect(() => {
    async function carregarDadosAcervo() {
      try {
        setCarregando(true);
        setErro("");

        const [respostaTodos, respostaGenero, respostaMaisEmprestados] =
          await Promise.all([
            fetch(`/api/livros?page=${paginaAtual}&limit=${LIVROS_POR_PAGINA}`),
            fetch("/api/livros/genero-semana"),
            fetch("/api/livros/mais-emprestados"),
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

        const dadosTodos = await respostaTodos.json();
        const dadosGenero = await respostaGenero.json();
        const dadosMaisEmprestados = await respostaMaisEmprestados.json();

        setLivrosTodos(dadosTodos.livros);
        setTotalPaginas(dadosTodos.totalPaginas);
        setTotalLivros(dadosTodos.total);

        // Gênero sorteado pela API
        setGeneroSemana(dadosGenero.genero);
        setLivrosGeneroSemana(dadosGenero.livros);

        setLivrosMaisEmprestados(dadosMaisEmprestados.livros);
      } catch (error) {
        console.error(error);

        setErro("Não foi possível carregar os livros.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosAcervo();
  }, [paginaAtual]);

  /*
   * Busca os livros.
   *
   * A função recebe a página que deverá ser carregada.
   */
  async function buscarLivros(pagina = 1) {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams();

      if (titulo.trim()) {
        params.append("titulo", titulo.trim());
      }

      if (genero.trim()) {
        params.append("genero", genero.trim());
      }

      if (copias) {
        params.append("copias", copias);
      }

      if (ano.trim()) {
        params.append("ano", ano.trim());
      }

      if (autor.trim()) {
        params.append("autor", autor.trim());
      }

      // Paginação da pesquisa
      params.append("page", pagina.toString());
      params.append("limit", LIVROS_POR_PAGINA.toString());

      const resposta = await fetch(`/api/livros?${params.toString()}`);

      if (!resposta.ok) {
        throw new Error("Erro ao buscar livros.");
      }

      const dados = await resposta.json();

      setLivros(dados.livros);

      // Atualiza a paginação da pesquisa
      setPaginaPesquisa(dados.pagina);
      setTotalPaginasPesquisa(dados.totalPaginas);
      setTotalLivrosPesquisa(dados.total);

      setPesquisaRealizada(true);
    } catch (error) {
      console.error(error);

      setErro("Não foi possível buscar os livros.");
      setLivros([]);

      setPaginaPesquisa(1);
      setTotalPaginasPesquisa(1);
      setTotalLivrosPesquisa(0);
    } finally {
      setCarregando(false);
    }
  }

  /*
   * Limpa a pesquisa e volta para o acervo.
   */
  function limparPesquisa() {
    setTitulo("");
    setGenero("");
    setCopias("");
    setAno("");
    setAutor("");

    setLivros([]);

    setPesquisaRealizada(false);

    setPaginaPesquisa(1);
    setTotalPaginasPesquisa(1);
    setTotalLivrosPesquisa(0);

    setPaginaAtual(1);

    setErro("");
  }

  /*
   * Muda a página da seção "Todos".
   */
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

  /*
   * Muda a página dos resultados da pesquisa.
   */
  function mudarPaginaPesquisa(novaPagina: number) {
    if (novaPagina < 1 || novaPagina > totalPaginasPesquisa) {
      return;
    }

    buscarLivros(novaPagina);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 text-[var(--text-primary)] sm:space-y-8">
        <main className="min-w-0">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Acervo
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              Bem-vindo(a),{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {nomeUsuario || "Visitante"}
              </span>
              . Consulte os livros disponíveis na biblioteca.
            </p>
          </header>

              {/* Pesquisa */}

              <section className="mt-6 space-y-4 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
                <header>
                  <h2 className="text-base font-bold sm:text-lg">
                    Pesquisar no acervo
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Filtre por título, gênero, disponibilidade, ano ou autor.
                  </p>
                </header>

                  <div className="space-y-4">
                    <input
                      aria-label="Título do livro"
                      type="text"
                      placeholder="Buscar por título..."
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    />

                    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
                      <select
                        aria-label="Filtrar por gênero"
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        className="w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        <option value="">Todos os gêneros</option>

                        <option value="Romance">Romance</option>

                        <option value="Religião e Mitologia">
                          Religião e Mitologia
                        </option>

                        <option value="Ficção">Ficção</option>

                        <option value="Arte e Cultura">Arte e Cultura</option>

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

                        <option value="Infantojuvenil">Infantojuvenil</option>

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

                      <select
                        aria-label="Filtrar por disponibilidade de cópias"
                        value={copias}
                        onChange={(e) => setCopias(e.target.value)}
                        className="w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        <option value="">Todos os livros</option>
                        <option value="com">Com cópias</option>
                        <option value="sem">Sem cópias</option>
                      </select>

                      <input
                        aria-label="Filtrar por ano"
                        type="number"
                        placeholder="Ano"
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      />

                      <input
                        aria-label="Filtrar por autor"
                        type="text"
                        placeholder="Autor"
                        value={autor}
                        onChange={(e) => setAutor(e.target.value)}
                        className="w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      />
                    </div>

                    <div className="grid grid-cols-[4fr_1fr] gap-2">
                      <button
                        type="button"
                        onClick={() => buscarLivros(1)}
                        disabled={carregando}
                        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                      >
                        <Search size={17} aria-hidden="true" />
                        {carregando ? "Buscando..." : "Pesquisar"}
                      </button>

                      <button
                        type="button"
                        onClick={limparPesquisa}
                        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-1 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:gap-2 sm:px-2 sm:text-sm"
                      >
                        <RotateCcw
                          size={14}
                          aria-hidden="true"
                          className="hidden sm:block"
                        />
                        <span className="sm:hidden">Limpar</span>
                        <span className="hidden sm:inline">Limpar filtros</span>
                      </button>
                    </div>
                  </div>
              </section>

              {/* Erro */}

              {erro && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--status-danger)]/10 p-4 text-sm font-medium text-[var(--status-danger)]"
                >
                  <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
                  <p>{erro}</p>
                </div>
              )}

              {/* Acervo */}

              <section className="mt-6 space-y-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
                {!pesquisaRealizada ? (
                  carregando && livrosTodos.length === 0 ? (
                    <div className="space-y-3" aria-live="polite">
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-hover)]"
                        />
                      ))}
                    </div>
                  ) : (
                  <>
                    {/* Gênero da Semana */}

                    <LivroCarousel
                      titulo={
                        generoSemana
                          ? `Gênero da Semana: ${generoSemana}`
                          : "Gênero da Semana"
                      }
                      livros={livrosGeneroSemana}
                      baseUrl="/frequentador/acervo"
                    />

                    {/* Mais Emprestados */}

                    <LivroCarousel
                      titulo="Mais Emprestados"
                      livros={livrosMaisEmprestados}
                      baseUrl="/frequentador/acervo"
                    />

                    {/* Todos */}

                    <LivroGrid
                      titulo="Todos"
                      livros={livrosTodos}
                      baseUrl="/frequentador/acervo"
                    />

                    {/* Paginação - Todos */}

                    {totalPaginas > 1 && (
                      <Pagination
                        currentPage={paginaAtual}
                        totalPages={totalPaginas}
                        startItem={(paginaAtual - 1) * LIVROS_POR_PAGINA + 1}
                        endItem={Math.min(
                          paginaAtual * LIVROS_POR_PAGINA,
                          totalLivros,
                        )}
                        totalItems={totalLivros}
                        itemLabel="livros"
                        ariaLabel="Paginação dos livros do acervo"
                        onPageChange={mudarPagina}
                      />
                    )}
                  </>
                  )
                ) : (
                  <>
                    {/* Resultados da Pesquisa */}

                    {livros.length > 0 ? (
                      <>
                        <LivroGrid
                          titulo="Resultados da pesquisa"
                          livros={livros}
                        />

                        {/* Paginação - Resultados da Pesquisa */}

                        {totalPaginasPesquisa > 1 && (
                          <Pagination
                            currentPage={paginaPesquisa}
                            totalPages={totalPaginasPesquisa}
                            startItem={
                              (paginaPesquisa - 1) * LIVROS_POR_PAGINA + 1
                            }
                            endItem={Math.min(
                              paginaPesquisa * LIVROS_POR_PAGINA,
                              totalLivrosPesquisa,
                            )}
                            totalItems={totalLivrosPesquisa}
                            itemLabel="resultados"
                            ariaLabel="Paginação dos resultados da pesquisa"
                            onPageChange={mudarPaginaPesquisa}
                          />
                        )}
                      </>
                    ) : (
                      !carregando && (
                        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--border-default)] bg-[var(--surface-hover)] px-4 py-10 text-center">
                          <Search
                            size={30}
                            className="mb-3 text-[var(--text-muted)]"
                            aria-hidden="true"
                          />
                          <p className="font-semibold text-[var(--text-primary)]">
                            Nenhum livro encontrado
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Tente ajustar os filtros e pesquisar novamente.
                          </p>
                        </div>
                      )
                    )}
                  </>
                )}
              </section>
        </main>
      </div>
    </>
  );
}
