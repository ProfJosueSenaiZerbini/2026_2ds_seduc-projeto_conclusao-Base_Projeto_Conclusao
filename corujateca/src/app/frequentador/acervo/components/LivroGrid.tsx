"use client";

import LivroCard from "./LivroCard";

type Livro = {
    id_livro: number;
    titulo_livro: string;
    autor_livro: string;
    genero_livro: string;
    imgcapa_livro: string | null;
};

type LivroGridProps = {
    titulo: string;
    livros: Livro[];
};

export default function LivroGrid({
    titulo,
    livros,
}: LivroGridProps) {
    return (
        <section className="mb-8">
            <h2
                className="
          text-lg
          sm:text-xl
          font-bold
          text-[var(--color-text-primary)]
          mb-4
        "
            >
                {titulo}
            </h2>

            <div
                className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-4
        "
            >
                {livros.map((livro) => (
                    <div key={livro.id_livro} className="min-w-0">
                        <LivroCard livro={livro} />
                    </div>
                ))}
            </div>
        </section>
    );
}