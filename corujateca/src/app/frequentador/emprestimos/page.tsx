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
    status: "Em andamento",
    expiration: "20/08/2026",
    loanDate: "10/08/2026",
  },
  {
    id: 2,
    title: "Nome do livro",
    author: "Nome do autor",
    status: "Em andamento",
    expiration: "20/08/2026",
    loanDate: "10/08/2026",
  },
  {
    id: 3,
    title: "Nome do livro",
    author: "Nome do autor",
    status: "Em andamento",
    expiration: "20/08/2026",
    loanDate: "10/08/2026",
  },
];

export default function EmprestimosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-background)">
      <Header />

      <div className="flex flex-1 min-w-0">
        <Nav />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">

            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <DashboardCard
                title="Empréstimos em Andamento:"
                value={2}
              />

              <DashboardCard
                title="Quantidade de Livros que Expiram Hoje:"
                value={2}
              />
            </section>

            <section className="rounded-3xl bg-brand-200 p-4 shadow-sm md:p-6">
              <h2 className="mb-5 text-xl font-bold text-(--color-text-primary) sm:text-2xl">
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