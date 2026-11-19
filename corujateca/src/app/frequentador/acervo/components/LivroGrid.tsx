"use client";

import Link from "next/link";
import LivroCard from "./LivroCard";

type Livro = {
  id_livro: number;
  titulo_livro: string;
  autor_livro: string;
  genero_livro: string;
  imgcapa_livro: string | null;
  possui_exemplar_disponivel?: boolean;
};

type LivroGridProps = {
  titulo: string;
  livros: Livro[];
  baseUrl?: string;
};

export default function LivroGrid({
  titulo,
  livros,
  baseUrl = "/frequentador/acervo",
}: LivroGridProps) {
  const tituloClasse =
    "mb-4 text-lg font-bold text-[var(--text-primary)] sm:text-xl";

  return (
    <section className="mb-8">
      <h2 className={tituloClasse}>{titulo}</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {livros.map((livro) => (
          <Link
            key={livro.id_livro}
            href={`${baseUrl}/${livro.id_livro}`}
            className="block min-w-0 rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <LivroCard livro={livro} />
          </Link>
        ))}
      </div>
    </section>
  );
}
