"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LibraryBig,
  Stamp,
  ClockAlert,
  MessageCircleQuestionMark,
  UsersIcon,
} from "lucide-react";

const itens = [
  {
    nome: "Início",
    href: "/bibliotecario/home",
    Icone: Home,
  },
  {
    nome: "Acervo",
    href: "/bibliotecario/acervo",
    Icone: LibraryBig,
  },
  {
    nome: "Empréstimos",
    href: "/bibliotecario/emprestimos",
    Icone: Stamp,
  },
  {
    nome: "Usuários",
    href: "/bibliotecario/usuarios",
    Icone: UsersIcon,
  },
  {
    nome: "Multas",
    href: "/bibliotecario/multas",
    Icone: ClockAlert,
  },
  {
    nome: "FAQ",
    href: "/bibliotecario/ajuda",
    Icone: MessageCircleQuestionMark,
  },
];

export default function NavBibliotecario() {
  const pathname = usePathname();

  return (
    <aside
      className="
        w-14 md:w-46
        shrink-0
        self-stretch
        bg-[var(--brand-800)]
        text-[var(--brand-300)]
      "
    >
      <div className="sticky top-0 flex flex-col">
        <Link
          href="/bibliotecario/home"
          aria-label="Corujateca — página inicial"
          className="
            flex h-32 items-center justify-center
            px-1 md:px-3
          "
        >
          <Image
            src="/images/logo_corujatecaMobile.png"
            alt=""
            width={48}
            height={48}
            priority
            className="object-contain md:hidden"
          />

          <Image
            src="/images/logo_corujatecaAlt.png"
            alt=""
            width={200}
            height={200}
            priority
            className="hidden h-auto w-full max-w-40 object-contain md:block transition-all duration-300 hover:scale-[1.02]"
          />
        </Link>

        <nav
          aria-label="Navegação do bibliotecário"
          className="
            flex flex-col gap-1
            px-2 py-4
            md:px-3 md:py-5
          "
        >
          {itens.map(({ nome, href, Icone }) => {
            const ativo =
              pathname === href ||
              (href !== "/bibliotecario/home" &&
                pathname.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                title={nome}
                aria-current={ativo ? "page" : undefined}
                className={`
                  flex min-h-10 items-center justify-center gap-3
                  rounded-md px-2 py-2.5
                  text-sm font-medium
                  transition-colors duration-200
                  md:justify-start md:px-3 hover:scale-[1.02] transition-all duration-300
                  ${
                    ativo
                      ? "bg-[var(--brand-500)] !text-[var(--text-inverse)] shadow-sm"
                      : "text-[var(--brand-300)] hover:bg-[var(--brand-500)]/20 hover:!text-[var(--brand-200)]"
                  }
                `}
              >
                <Icone size={20} className="shrink-0" />
                <span className="hidden md:inline">{nome}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
