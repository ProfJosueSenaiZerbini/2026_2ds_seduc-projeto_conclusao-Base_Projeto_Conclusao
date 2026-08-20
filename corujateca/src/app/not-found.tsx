import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return(
            <div className="flex min-h-screen flex-col items-center justify-center">

                <Image
                    src="/images/Erro404.png"
                    alt="Erro 404"
                    width={500}
                    height={500}
                    className="rounded-lg"
                    />
            <h1 className="text-4xl text-black font-bold">
                404
            </h1>

            <p className="mb-4 text-black">
                Essa página não existe.
            </p>

            <Link
                href="/"
                className="rounded bg-[var(--brand-800)] px-4 py-2 text-white hover:bg-[var(--brand-700)] transition duration-300"
            >
                Voltar ao início
            </Link>
        </div>
    );
}
