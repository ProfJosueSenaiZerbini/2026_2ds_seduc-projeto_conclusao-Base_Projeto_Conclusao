"use client";

import Image from "next/image";

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  const membros = [
    "Maria Luiza",
    "Stephanny Borrozzino",
    "Rogério Malto",
    "Enzo Barbino",
    "Alexandra Pereira",
  ];

  return (
    <footer
      className="
      w-full border-t border-[var(--color-horror)]/30
      bg-[var(--brand-700)]
      text-[var(--text-inverse)]
    "
    >
      <div
        className="
        mx-auto grid w-full max-w-7xl
        grid-cols-1 gap-8
        px-5 py-8
        sm:px-8
        md:grid-cols-2 md:gap-12
        lg:px-10
      "
      >
        {/* Identidade do projeto */}
        <section className="min-w-0">
          <Image
            src="/images/logo_corujatecaFooter.png"
            alt=""
            width={400}
            height={200}
            priority
            // className="object-contain md:hidden"
          />
        </section>

        {/* Integrantes */}
        <section className="min-w-0">
          <h2
            className="
            mb-3 text-base font-semibold
            text-[var(--brand-400)]
          "
          >
            Membros do projeto
          </h2>

          <ul
            className="
            grid grid-cols-1 gap-x-6 gap-y-2
            text-sm
            sm:grid-cols-2
          "
          >
            {membros.map((membro) => (
              <li key={membro} className="min-w-0 leading-6">
                {membro}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Copyright */}
      <div
        className="
        border-t border-[var(--color-horror)]/30
        px-5 py-4 sm:px-8 lg:px-10
      "
      >
        <p
          className="
          mx-auto max-w-7xl
          text-xs leading-5
          text-center
          text-[var(--brand-400)]
        "
        >
          &copy; {anoAtual} Corujateca. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
