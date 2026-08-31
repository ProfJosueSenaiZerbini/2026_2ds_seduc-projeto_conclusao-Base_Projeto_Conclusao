import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";

import {
    LibraryBig,
    Stamp
} from "lucide-react";

export default function HomeFreq() {
    return (
        <div>
              <Header />
        
              <div className="flex">
                <Nav />
        
                <main className="flex-1 min-w-0 p-10 md:p-10">
        
                  <section className="mb-6">
                    <p className="text-base sm:text-lg text-[var(--color-text-primary)]">
                      Bem-vindo,{" "}
                      <strong className="font-bold">
                        NOME DO USUÁRIO!
                        {/* parte que precisa puxar o nome do usuário do back e da autenticação */}
                      </strong>
                    </p>
                  </section>
        
        
                  <section className="grid grid-cols-2 gap-1.5 mb-4">
        
                    <div
                      className="
                        rounded-xl
                        shadow-md
                        bg-[var(--color-brand-500)]
                        text-[var(--color-text-inverse)]
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-center
                        min-h-28
                        sm:min-h-32
                        p-3
                      "
                    >
                      <p className="text-sm sm:text-base md:text-lg leading-tight">
                        Empréstimos em
                        <br />
                        Andamento:
                      </p>
        
                      <strong className="text-3xl sm:text-4xl font-bold mt-2">
                        2
                        {/* parte que precisa puxar o número do back e da autenticação */}
                      </strong>
                    </div>
        
        
                    {/* Quantidade de multas */}
                    <div
                      className="
                        rounded-xl
                        shadow-md
                        bg-[var(--color-brand-500)]
                        text-[var(--color-text-inverse)]
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-center
                        min-h-28
                        sm:min-h-32
                        p-3
                      "
                    >
                      <p className="text-sm sm:text-base md:text-lg leading-tight">
                        Minhas Multas
                        <br />
                        Pendentes:
                      </p>
        
                      <strong className="text-3xl sm:text-4xl font-bold mt-2">
                        8
                        {/* parte que precisa puxar o número do back */}
                      </strong>
                    </div>
        
                  </section>
        
        
                  <section
                    className="
                      bg-[var(--color-brand-200)]
                      shadow-md
                      rounded-2xl
                      p-3
                      sm:p-4
                      mb-6
                    "
                  >
                    <h2
                      className="
                        text-base
                        sm:text-lg
                        font-bold
                        text-[var(--color-text-primary)]
                        mb-2
                      "
                    >
                      Empréstimos que vencem hoje
                    </h2>
        
                    <article
                      className="
                        bg-[var(--color-brand-400)]
                        text-[var(--color-text-inverse)]
                        rounded-2xl
                        p-3
                        grid
                        grid-cols-1
                        sm:grid-cols-[1fr_auto]
                        gap-y-2
                        sm:gap-x-6
                      "
                    >
        
                      {/* Informações do livro */}
                      <div
                        className="
                          flex
                          flex-col
                          min-w-0
                        "
                      >
                        <strong
                          className="
                            text-sm
                            sm:text-base
                            leading-tight
                          "
                        >
                          Nome do livro
                        </strong>
        
                        <span
                          className="
                            text-xs
                            leading-tight
                          "
                        >
                          Nome do autor
                        </span>
                      </div>
        
        
                      {/* Datas do empréstimo */}
                      <div
                        className="
                          text-xs
                          leading-snug
                          sm:min-w-max
                        "
                      >
                        <p>
                          <strong>Data de Expiração:</strong>{" "}
                          xx/xx/xxxx
                          {/* parte que precisa puxar a data do back */}
                        </p>
        
                        <p>
                          <strong>Data do Empréstimo:</strong>{" "}
                          xx/xx/xxxx
                          {/* parte que precisa puxar a data do back */}
                        </p>
                      </div>
        
        
                      {/* Usuário que realizou o empréstimo */}
                      <span
                        className="
                          text-sm
                          sm:col-span-1
                        "
                      >
                        Nome do Usuário
                        {/* parte que precisa puxar o nome do usuário do back */}
                      </span>
        
                    </article>
        
                  </section>
        
                  <section
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[1.7fr_1fr]
                      gap-2
                    "
                  >
        
                    {/* Coluna esquerda */}
                    <div
                      className="
                        flex
                        flex-col
                        gap-2
                      "
                    >
        
                    <Link href="/frequentador/acervo" className="
                        cursor-pointer
                        shadow-md
                        w-full
                        min-h-12
                        bg-[var(--color-brand-200)]
                        rounded-2xl
                        flex
                        items-center
                          px-4
                          text-base
                          sm:text-lg
                          font-bold
                          text-left
                          text-[var(--color-text-primary)]
                          hover:bg-[var(--color-brand-100)]
                          transition-colors
                        ">
                        <LibraryBig size={20} className="mr-2"/>
                        <span>Acervo</span>
                    </Link>
        
        
                    <Link href="/frequentador/emprestimos" className="
                        shadow-md
                        cursor-pointer  
                        w-full
                        min-h-12
                        bg-[var(--color-brand-200)]
                        rounded-2xl
                        flex
                        items-center
                        px-4
                        text-base
                        sm:text-lg
                        font-bold
                        text-left
                        text-[var(--color-text-primary)]
                        hover:bg-[var(--color-brand-100)]
                        transition-colors">
                        <Stamp size={20} className="mr-2"/>
                        <span>Empréstimos</span>
                    </Link>
        
                    </div>
        
                <Link href="/frequentador/ajuda" className="
                        cursor-pointer
                        shadow-md
                        min-h-28
                        sm:min-h-full
                        bg-[var(--color-brand-200)]
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        text-center
                        text-base
                        sm:text-lg
                        font-bold
                        leading-tight
                        text-[var(--color-text-primary)]
                        hover:bg-[var(--color-brand-100)]
                        transition-colors
                      ">
                    <button>
                      <span>
                        Precisa
                        <br />
                        de
                        <br />
                        Ajuda?
                      </span>
                    </button>
                </Link>
        
                  </section>
        
                </main>
              </div>
        
              <Footer />
            </div>
    );
}