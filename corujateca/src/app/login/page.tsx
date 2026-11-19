"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "@/lib/auth";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, LibraryBig } from "lucide-react";

const perfis = [
  {
    nome: "Bibliotecário",
    descricao: "Acessar a área de gerenciamento da biblioteca",
    href: "/login/bibliotecario",
    imagem: "/images/logo_login-bibliotecario.png",
    cor: "bg-[#3565AD]",
    Icone: LibraryBig,
  },
  {
    nome: "Frequentador",
    descricao: "Acessar o acervo e seus empréstimos",
    href: "/login/frequentador",
    imagem: "/images/logo_login-frequentador.png",
    cor: "bg-[#BD4FA0]",
    Icone: BookOpen,
  },
];

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();

    if (session) {
      router.replace(
        session.role === "bibliotecario"
          ? "/bibliotecario/home"
          : "/frequentador/home",
      );
    }
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[url('/images/backgroundLoginSignup.png')] bg-cover bg-center bg-no-repeat px-5 py-10">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <section className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <Image
          src="/images/logo_Index.png"
          alt="Corujateca"
          width={280}
          height={160}
          priority
          className="h-auto w-64 drop-shadow-lg sm:w-80 md:w-[30rem] hover:cursor-default"
        />

        <div className="mb-9 mt-7 max-w-3xl text-white drop-shadow-md">
          <p className="text-base leading-relaxed sm:text-lg md:text-xl">
            Olá! Seja muito bem-vindo(a) à nossa biblioteca!
            <br/>
            Para começarmos a nossa jornada de leitura, selecione o seu perfil
            de usuário.
          </p>
        </div>

        <div className="grid w-full max-w-lg grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8 text-white">
          {perfis.map(({ nome, descricao, href, imagem, cor, Icone }) => (
            <Link
              key={nome}
              href={href}
              className={`
                  group flex min-h-72 flex-col items-center justify-center
                  rounded-xl ${cor} p-5 text-white
                  shadow-xl transition duration-200
                  hover:-translate-y-1 hover:shadow-2xl
                  focus-visible:outline-4 focus-visible:outline-offset-4
                  focus-visible:outline-white
                  active:translate-y-0
                  sm:min-h-80 sm:p-6
                `}
            >
              <div className="relative mb-3 h-40 w-full transition-transform duration-200 group-hover:scale-105 sm:h-48">
                <Image
                  src={imagem}
                  alt={`Ilustração do perfil ${nome}`}
                  fill
                  sizes="(max-width: 640px) 80vw, 300px"
                  className="object-contain drop-shadow-md"
                />
              </div>

              <h2 className="text-xl font-bold sm:text-2xl">{nome}</h2>

              <p className="mt-2 max-w-56 text-sm leading-relaxed text-white/90">
                {descricao}
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition-colors group-hover:bg-white/25">
                <Icone size={18} />
                Acessar
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
