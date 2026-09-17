"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LivroCard from "./LivroCard";

type Livro = {
  id_livro: number;
  titulo_livro: string;
  autor_livro: string;
  genero_livro: string;
  imgcapa_livro: string | null;
};

type LivroCarouselProps = {
  titulo: string;
  livros: Livro[];
  baseUrl?: string; // Ex: "/bibliotecario/acervo" ou "/frequentador/acervo"
};

export default function LivroCarousel({
  titulo,
  livros,
  baseUrl = "/bibliotecario/acervo",
}: LivroCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function voltar() {
    if (!carouselRef.current) return;

    carouselRef.current.scrollBy({
      left: -carouselRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  function avancar() {
    if (!carouselRef.current) return;

    carouselRef.current.scrollBy({
      left: carouselRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <section className="mb-8">
      {/* Título e setas */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="
            text-lg
            sm:text-xl
            font-bold
            text-[var(--color-text-primary)]
          "
        >
          {titulo}
        </h2>

        <div className="flex gap-2">
          {/* Voltar */}
          <button
            type="button"
            onClick={voltar}
            aria-label="Livros anteriores"
            className="
              w-9
              h-9
              rounded-full
              bg-[var(--color-brand-500)]
              text-[var(--color-text-inverse)]
              flex
              items-center
              justify-center
              hover:bg-[var(--color-brand-400)]
              transition-colors
              cursor-pointer
            "
          >
            <ChevronLeft size={20} />
          </button>

          {/* Avançar */}
          <button
            type="button"
            onClick={avancar}
            aria-label="Próximos livros"
            className="
              w-9
              h-9
              rounded-full
              bg-[var(--color-brand-500)]
              text-[var(--color-text-inverse)]
              flex
              items-center
              justify-center
              hover:bg-[var(--color-brand-400)]
              transition-colors
              cursor-pointer
            "
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Carrossel */}
      <div
        ref={carouselRef}
        className="
          flex
          gap-1
          overflow-x-auto
          scroll-smooth
          snap-x
          snap-mandatory
          pb-1

          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {livros.map((livro) => (
          <Link
            key={livro.id_livro}
            href={`${baseUrl}/${livro.id_livro}`}
            className="
              shrink-0
              snap-start
              w-[255px]
              block
              transition-transform
              hover:scale-[1.02]
            "
          >
            <LivroCard livro={livro} />
          </Link>
        ))}
      </div>
    </section>
  );
}