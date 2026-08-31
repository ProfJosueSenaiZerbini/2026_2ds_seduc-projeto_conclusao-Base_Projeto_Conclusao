import Link from "next/link";
import {
    Home,
    LibraryBig,
    Stamp,
    ClockAlert,
    MessageCircleQuestionMark,
    UsersIcon,
} from "lucide-react";

export default function NavBibliotecario() {
    return (
        <aside className="
            w-20
            md:w-64
            shrink-0
            bg-[var(--brand-800)]
        ">
            <nav className="
                sticky
                top-0
                flex
                flex-col
                px-4
                py-6
            ">

                <Link
                    href="/bibliotecario/home"
                    className="
                        flex
                        items-center
                        justify-center
                        md:justify-start
                        gap-3
                        rounded-md
                        px-4
                        py-3
                        text-[var(--color-brand-300)]
                        hover:bg-white/10
                        hover:text-[var(--color-text-inverse)]
                    "
                >
                    <Home size={20} />
                    <span>Início</span>
                </Link>

                <Link
                    href="/bibliotecario/acervo"
                    className="
                        flex
                        items-center
                        justify-center
                        md:justify-start
                        gap-3
                        rounded-md
                        px-4
                        py-3
                        text-[var(--color-brand-300)]
                        hover:bg-white/10
                        hover:text-[var(--color-text-inverse)]
                    "
                >
                    <LibraryBig size={20} />
                    <span>Acervo</span>
                </Link>

                <Link
                    href="/bibliotecario/emprestimos"
                    className="
                        flex
                        items-center
                        justify-center
                        md:justify-start
                        gap-3
                        rounded-md
                        px-4
                        py-3
                        text-[var(--color-brand-300)]
                        hover:bg-white/10
                        hover:text-[var(--color-text-inverse)]
                    "
                >
                    <Stamp size={20} />
                    <span>Empréstimos</span>
                </Link>

                <Link
                    href="/bibliotecario/usuarios"
                    className="
                        flex
                        items-center
                        justify-center
                        md:justify-start
                        gap-3
                        rounded-md
                        px-4
                        py-3
                        text-[var(--color-brand-300)]
                        hover:bg-white/10
                        hover:text-[var(--color-text-inverse)]
                    "
                >
                    <UsersIcon size={20} />
                    <span>Usuários</span>
                </Link>

                <Link
                    href="/bibliotecario/multas"
                    className="
                        flex
                        items-center
                        justify-center
                        md:justify-start
                        gap-3
                        rounded-md
                        px-4
                        py-3
                        text-[var(--color-brand-300)]
                        hover:bg-white/10
                        hover:text-[var(--color-text-inverse)]
                    "
                >
                    <ClockAlert size={20} />
                    <span>Multas</span>
                </Link>

                <Link
                    href="/bibliotecario/ajuda"
                    className="
                        flex
                        items-center
                        justify-center
                        md:justify-start
                        gap-3
                        rounded-md
                        px-4
                        py-3
                        text-[var(--color-brand-300)]
                        hover:bg-white/10
                        hover:text-[var(--color-text-inverse)]
                    "
                >
                    <MessageCircleQuestionMark size={20} />
                    <span>Ajuda</span>
                </Link>

            </nav>
        </aside>
    );
}
