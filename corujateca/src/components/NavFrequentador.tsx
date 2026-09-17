import Link from "next/link";
import {
    Home,
    LibraryBig,
    Stamp,
    ClockAlert,
    MessageCircleQuestionMark
} from "lucide-react";

export default function NavFrequentador() {
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
                    href="/frequentador/home"
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
                    <span className="hidden md:inline">
                        Início
                    </span>
                </Link>

                <Link
                    href="/frequentador/acervo"
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
                    <span className="hidden md:inline">
                        Acervo
                    </span>
                </Link>

                <Link
                    href="/frequentador/emprestimos"
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
                    <span className="hidden md:inline">
                        Empréstimos
                    </span>
                </Link>

                <Link
                    href="/frequentador/multas"
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
                    <span className="hidden md:inline">
                        Multas
                    </span>
                </Link>

                <Link
                    href="/frequentador/ajuda"
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
                    <span className="hidden md:inline">
                        Ajuda
                    </span>
                </Link>

            </nav>
        </aside>
    );
}
