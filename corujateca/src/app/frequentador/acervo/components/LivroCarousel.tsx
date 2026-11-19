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
  possui_exemplar_disponivel?: boolean;
};

type LivroCarouselProps = {
  titulo: string;
  livros: Livro[];
  baseUrl?: string;
};

export default function LivroCarousel({
  titulo,
  livros,
  baseUrl = "/frequentador/acervo",
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
          {titulo}
        </h2>

        <div className="flex gap-2">
          {/* Voltar */}
          <button
            type="button"
            onClick={voltar}
            aria-label="Livros anteriores"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Avançar */}
          <button
            type="button"
            onClick={avancar}
            aria-label="Próximos livros"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Carrossel */}
      <div
        ref={carouselRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-0.5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {livros.map((livro) => (
          <Link
            key={livro.id_livro}
            href={`${baseUrl}/${livro.id_livro}`}
            className="block w-[min(42vw,190px)] shrink-0 snap-start rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:w-[190px]"
          >
            <LivroCard livro={livro} />
          </Link>
        ))}
      </div>
    </section>
  );
}
