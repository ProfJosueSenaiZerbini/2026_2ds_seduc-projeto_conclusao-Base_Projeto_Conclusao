"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type Livro = {
  id_livro: number;
  titulo_livro?: string;
  titulo?: string;
  autor_livro?: string;
  autor?: string;
  genero_livro?: string;
  genero?: string;
  cor_genero?: string | null;
  imgcapa_livro?: string | null;
  capa?: string | null;
  qtd_copias?: number;
  copias?: number;
};

const coresGenero: Record<string, string> = {
  romance: "var(--color-romance)",
  religião: "var(--color-religion-mythology)",
  religiao: "var(--color-religion-mythology)",
  mitologia: "var(--color-religion-mythology)",
  "ficção científica": "var(--color-science-fiction)",
  "ficcao cientifica": "var(--color-science-fiction)",
  fantasia: "var(--color-fantasy)",
  biografias: "var(--color-biographies-memoirs)",
  terror: "var(--color-horror)",
  aventura: "var(--color-adventure)",
  história: "var(--color-history)",
  historia: "var(--color-history)",
  literatura: "var(--color-literature)",
};

export default function AcervoFreq() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function carregarAcervo() {
      try {
        setCarregando(true);
        const res = await fetch("/api/livros");
        if (res.ok) {
          const dados = await res.json();
          const lista = Array.isArray(dados) ? dados : dados.livros || dados.data || [];
          setLivros(lista);
        }
      } catch (error) {
        console.error("Erro ao carregar acervo:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarAcervo();
  }, []);

  const livrosFiltrados = livros.filter((livro) => {
    const titulo = (livro.titulo_livro || livro.titulo || "").toLowerCase();
    const autor = (livro.autor_livro || livro.autor || "").toLowerCase();
    const termo = busca.toLowerCase();
    return titulo.includes(termo) || autor.includes(termo);
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      <div className="flex flex-1">
        <Nav />

        <main className="flex-1 min-w-0 p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl md:3xl font-extrabold text-black uppercase">
                Acervo da Biblioteca
              </h1>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Pesquisar por título ou autor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {carregando ? (
              <div className="p-12 text-center text-gray-600 animate-pulse font-medium">
                Carregando acervo...
              </div>
            ) : livrosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-gray-600 bg-gray-100 rounded-2xl">
                Nenhum livro encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {livrosFiltrados.map((livro) => {
                  const id = livro.id_livro;
                  const titulo = livro.titulo_livro || livro.titulo || "Sem Título";
                  const autor = livro.autor_livro || livro.autor || "Desconhecido";
                  const genero = livro.genero_livro || livro.genero || "";
                  const capa = livro.imgcapa_livro || livro.capa;
                  const copias = livro.qtd_copias ?? livro.copias ?? 0;

                  const generoChave = genero.trim().toLowerCase();
                  const corGenero =
                    livro.cor_genero || coresGenero[generoChave] || "var(--color-brand-500)";

                  return (
                    <Link
                      key={id}
                      href={`/frequentador/livros/${id}`}
                      className="bg-gray-100/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="w-full aspect-[3/4] bg-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
                          {capa ? (
                            <img
                              src={capa}
                              alt={titulo}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-gray-600 text-xs font-medium">Sem Capa</span>
                          )}
                        </div>

                        <div>
                          {genero && (
                            <span
                              style={{ backgroundColor: corGenero }}
                              className="inline-block text-xs font-bold uppercase px-3 py-1 rounded-full mb-2 leading-none text-black"
                            >
                              {genero}
                            </span>
                          )}
                          <h2 className="font-extrabold text-black text-base line-clamp-1 group-hover:underline">
                            {titulo}
                          </h2>
                          <p className="text-gray-700 text-sm line-clamp-1">{autor}</p>
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center text-xs font-semibold">
                        <span className={copias > 0 ? "text-green-700" : "text-red-600"}>
                          {copias > 0 ? `${copias} cópia(s) livre(s)` : "Indisponível"}
                        </span>
                        <span className="text-black group-hover:translate-x-1 transition-transform">
                          Ver mais →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}