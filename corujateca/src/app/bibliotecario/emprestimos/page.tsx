import { db } from "@/app/db";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

import DashboardCard from "./components/DashboardCard";
import SearchFilters from "./components/SearchFilters";
import CreateEmprestimoForm from "./components/CreateEmprestimoForm";
import LoansSection, { type LoanView } from "./components/LoansSection";
import { Prisma } from "@prisma/client";

function formatarData(data: Date | string | null) {
  if (!data) {
    return "-";
  }

  const valor = new Date(data);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(valor);
}

interface PageProps {
  searchParams: Promise<{
    nome?: string;
    status?: string;
    dataExpiracao?: string;
    dataEmprestimo?: string;
    data?: string;
  }>;
}

export default async function EmprestimosPage({ searchParams }: PageProps) {
  const { nome, status, dataExpiracao, dataEmprestimo, data: nomeLivro } = await searchParams;
  const hoje = new Date();

  const whereClause: Prisma.emprestimoWhereInput = {
    inativo_emprestimo: false,
  };

  if (nome) {
    whereClause.frequentador = {
      nome_freq: {
        contains: nome,
        mode: "insensitive",
      },
    };
  }

  if (status) {
    if (status === "Em andamento") {
      whereClause.dta_devolucao_real = null;
      whereClause.dta_devolucao = { gte: hoje };
    } else if (status === "Atrasado") {
      whereClause.dta_devolucao_real = null;
      whereClause.dta_devolucao = { lt: hoje };
    } else if (status === "Devolvido no prazo" || status === "Devolvido com atraso") { 
      whereClause.dta_devolucao_real = { not: null };
    }
  }

  // PROGRAMADO EM UMA LINHA: Agrupa Data do Empréstimo (Início) e Data de Expiração (Fim) juntas
  if (dataEmprestimo || dataExpiracao) {
    whereClause.AND = [
      ...(dataEmprestimo ? [{ dta_emprestimo: { gte: new Date(`${dataEmprestimo}T00:00:00`), lte: new Date(`${dataEmprestimo}T23:59:59`) } }] : []),
      ...(dataExpiracao ? [{ dta_devolucao: { gte: new Date(`${dataExpiracao}T00:00:00`), lte: new Date(`${dataExpiracao}T23:59:59`) } }] : [])
    ];
  }

  if (nomeLivro) {
    whereClause.exemplar = {
      livro: {
        titulo_livro: {
          contains: nomeLivro,
          mode: "insensitive",
        },
      },
    };
  }

  const [emprestimosFiltrados, exemplaresDisponiveis, frequentadores, todosEmprestimosAtivos] = await Promise.all([
    db.emprestimo.findMany({
      where: whereClause,
      include: {
        exemplar: {
          include: {
            livro: true,
          },
        },
        frequentador: true,
      },
      orderBy: { dta_emprestimo: "desc" },
    }),
    db.exemplar.findMany({
      where: {
        inativo_exemplar: false,
        status_exemplar: "Dispon_vel",
      },
      include: {
        livro: true,
      },
      take: 50,
    }),
    db.frequentador.findMany({
      where: { inativo_freq: false },
      orderBy: { nome_freq: "asc" },
      take: 50,
    }),
    db.emprestimo.findMany({
      where: { inativo_emprestimo: false },
      select: { dta_devolucao_real: true, dta_devolucao: true }
    })
  ]);

  let emprestimosProcessados = emprestimosFiltrados;

  if (status === "Devolvido no prazo") {
    emprestimosProcessados = emprestimosFiltrados.filter(emp => {
      if (!emp.dta_devolucao_real) return false;
      return new Date(emp.dta_devolucao_real) <= new Date(emp.dta_devolucao);
    });
  } else if (status === "Devolvido com atraso") {
    emprestimosProcessados = emprestimosFiltrados.filter(emp => {
      if (!emp.dta_devolucao_real) return false;
      return new Date(emp.dta_devolucao_real) > new Date(emp.dta_devolucao);
    });
  }

  const loans: LoanView[] = emprestimosProcessados.map((emprestimo) => {
    let statusCalculado = "Em andamento";
    
    if (emprestimo.dta_devolucao_real) {
      const real = new Date(emprestimo.dta_devolucao_real);
      const prevista = new Date(emprestimo.dta_devolucao);
      statusCalculado = real <= prevista ? "Devolvido no prazo" : "Devolvido com atraso";
    } else if (new Date(emprestimo.dta_devolucao) < hoje) {
      statusCalculado = "Atrasado";
    }

    return {
      id: emprestimo.id_emprestimo,
      title: emprestimo.exemplar.livro.titulo_livro,
      author: emprestimo.exemplar.livro.autor_livro,
      userName: emprestimo.frequentador.nome_freq,
      status: statusCalculado,
      expiration: formatarData(emprestimo.dta_devolucao),
      loanDate: formatarData(emprestimo.dta_emprestimo),
    };
  });

  const quantidadeEmAndamento = todosEmprestimosAtivos.filter(
    (emp) => !emp.dta_devolucao_real
  ).length;

  const quantidadeExpirandoHoje = todosEmprestimosAtivos.filter((emp) => {
    if (emp.dta_devolucao_real) return false;
    const dataExpiracao = new Date(emp.dta_devolucao);
    return dataExpiracao.toDateString() === hoje.toDateString();
  }).length;

  return (
    // Adicionado suppressHydrationWarning para matar o erro de renderização de data do servidor
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col" suppressHydrationWarning>
      <Header />

      <div className="flex flex-1 min-w-0">
        <Nav />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">

            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <DashboardCard
                title="Empréstimos em Andamento:"
                value={quantidadeEmAndamento}
              />

              <DashboardCard
                title="Quantidade de Livros que Expiram Hoje:"
                value={quantidadeExpirandoHoje}
              />
            </section>

            <section className="rounded-3xl bg-brand-200 p-4 shadow-sm md:p-6">
              <CreateEmprestimoForm
                frequentadores={frequentadores}
                exemplaresDisponiveis={exemplaresDisponiveis}
              />

              <h2 className="mb-5 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
                Pesquisar por Empréstimos
              </h2>

              <SearchFilters />

              <LoansSection loans={loans} />
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

