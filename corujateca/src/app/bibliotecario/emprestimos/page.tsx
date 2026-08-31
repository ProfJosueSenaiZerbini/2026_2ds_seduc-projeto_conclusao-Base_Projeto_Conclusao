import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

import DashboardCard from "./components/DashboardCard";
import SearchFilters from "./components/SearchFilters";
import LoanCard from "./components/LoanCard";

const loans = [
  {
    id: 1,
    title: "Nome do livro",
    author: "Nome do autor",
    userName: "Nome do Usuário",
    status: "Status do Empréstimo",
    expiration: "xx/xx/xxxx",
    loanDate: "xx/xx/xxxx",
  },
  {
    id: 2,
    title: "Nome do livro",
    author: "Nome do autor",
    userName: "Nome do Usuário",
    status: "Status do Empréstimo",
    expiration: "xx/xx/xxxx",
    loanDate: "xx/xx/xxxx",
  },
];

export default function EmprestimosPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <Header />

      <div className="flex flex-1 min-w-0">
        <Nav />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">

            {/* Cards superiores */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <DashboardCard
                title="Quantidade de Livros Emprestados:"
                value={6}
              />

              <DashboardCard
                title="Quantidade de Livros que Expiram Hoje:"
                value={2}
              />
            </section>

            {/* Pesquisa */}
            <section className="rounded-3xl bg-brand-200 p-4 shadow-sm md:p-6">
              <h2 className="mb-5 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
                Pesquisar por Empréstimos
              </h2>

              <SearchFilters />

              <div className="mt-8 space-y-5">
                {loans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}