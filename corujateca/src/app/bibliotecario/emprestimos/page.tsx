import { db } from "@/app/db";
import DashboardCard from "./components/DashboardCard";
import SearchFilters from "./components/SearchFilters";
import LoansSection, { type LoanView } from "./components/LoansSection";
import { Prisma } from "@prisma/client";
import { CalendarClock, Clock3 } from "lucide-react";

function inicioDoDiaUTC(data: Date | string) {
  const dataConvertida = new Date(data);

  return Date.UTC(
    dataConvertida.getUTCFullYear(),
    dataConvertida.getUTCMonth(),
    dataConvertida.getUTCDate(),
  );
}

function formatarData(data: Date | string | null) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(data));
}

interface PageProps {
  searchParams: Promise<{
    nome?: string;
    status?: string;
    data?: string;
    dataFiltro?: string;
    page?: string;
  }>;
}

export default async function EmprestimosPage({
  searchParams,
}: PageProps) {
  const { nome, status, data: nomeLivro, dataFiltro } =
    await searchParams;

  const hoje = inicioDoDiaUTC(new Date());
  const amanha = hoje + 24 * 60 * 60 * 1000;

  const whereClause: Prisma.emprestimoWhereInput = {};

  // Filtro pelo nome do frequentador.
  if (nome) {
    whereClause.frequentador = {
      nome_freq: {
        contains: nome,
        mode: "insensitive",
      },
    };
  }

  // Filtro por status.
  if (status === "Em andamento") {
    whereClause.inativo_emprestimo = false;
    whereClause.dta_devolucao_real = null;
    whereClause.dta_devolucao = { gte: new Date(hoje) };
  } else if (status === "Atrasado") {
    whereClause.inativo_emprestimo = false;
    whereClause.dta_devolucao_real = null;
    whereClause.dta_devolucao = { lt: new Date(hoje) };
  } else if (
    status === "Devolvido no prazo" ||
    status === "Devolvido com atraso"
  ) {
    whereClause.dta_devolucao_real = { not: null };
  }

  // Filtro por data de início ou devolução.
  if (dataFiltro) {
    const [ano, mes, dia] = dataFiltro.split("-").map(Number);

    const inicioDia = Date.UTC(ano, mes - 1, dia);
    const inicioProximoDia =
      inicioDia + 24 * 60 * 60 * 1000;

    whereClause.OR = [
      {
        dta_emprestimo: {
          gte: new Date(inicioDia),
          lt: new Date(inicioProximoDia),
        },
      },
      {
        dta_devolucao: {
          gte: new Date(inicioDia),
          lt: new Date(inicioProximoDia),
        },
      },
      {
        dta_devolucao_real: {
          gte: new Date(inicioDia),
          lt: new Date(inicioProximoDia),
        },
      },
    ];
  }

  // Filtro pelo título do livro.
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

  const [emprestimosFiltrados, todosEmprestimosAtivos] =
    await Promise.all([
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
        orderBy: {
          dta_emprestimo: "desc",
        },
      }),

      db.emprestimo.findMany({
        where: {
          inativo_emprestimo: false,
        },
        select: {
          dta_devolucao_real: true,
          dta_devolucao: true,
        },
      }),
    ]);

  // Os status de devolução são filtrados pelo dia, não pelo horário.
  let emprestimosProcessados = emprestimosFiltrados;

  if (status === "Devolvido no prazo") {
    emprestimosProcessados = emprestimosFiltrados.filter((emp) => {
      if (!emp.dta_devolucao_real) return false;

      return (
        inicioDoDiaUTC(emp.dta_devolucao_real) <=
        inicioDoDiaUTC(emp.dta_devolucao)
      );
    });
  } else if (status === "Devolvido com atraso") {
    emprestimosProcessados = emprestimosFiltrados.filter((emp) => {
      if (!emp.dta_devolucao_real) return false;

      return (
        inicioDoDiaUTC(emp.dta_devolucao_real) >
        inicioDoDiaUTC(emp.dta_devolucao)
      );
    });
  }

  const loans: LoanView[] = emprestimosProcessados.map((emprestimo) => {
    let statusCalculado = "Em andamento";
    let daysOverdue = 0;

    const vencimento = inicioDoDiaUTC(
      emprestimo.dta_devolucao,
    );

    if (emprestimo.dta_devolucao_real) {
      const devolucaoReal = inicioDoDiaUTC(
        emprestimo.dta_devolucao_real,
      );

      statusCalculado =
        devolucaoReal <= vencimento
          ? "Devolvido no prazo"
          : "Devolvido com atraso";
    } else if (vencimento < hoje) {
      statusCalculado = "Atrasado";

      daysOverdue = Math.floor(
        (hoje - vencimento) / (24 * 60 * 60 * 1000),
      );
    }

    return {
      id: emprestimo.id_emprestimo,
      title: emprestimo.exemplar.livro.titulo_livro,
      author: emprestimo.exemplar.livro.autor_livro,
      userName: emprestimo.frequentador.nome_freq,
      status: statusCalculado,
      daysOverdue,
      expiration: formatarData(emprestimo.dta_devolucao),
      loanDate: formatarData(emprestimo.dta_emprestimo),
    };
  });

  const quantidadeEmAndamento = todosEmprestimosAtivos.filter(
    (emp) => !emp.dta_devolucao_real,
  ).length;

  const quantidadeExpirandoHoje = todosEmprestimosAtivos.filter((emp) => {
    if (emp.dta_devolucao_real) return false;

    return (
      inicioDoDiaUTC(emp.dta_devolucao) === hoje
    );
  }).length;

  return (
    <main className="min-w-0 flex-1 overflow-x-clip bg-[var(--app-background)] px-3 py-5 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 sm:space-y-8">
        <header>
          <h1 className="break-words text-2xl font-bold leading-tight min-[375px]:text-3xl sm:text-4xl">
            Gerenciamento de empréstimos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Consulte os empréstimos, acompanhe os prazos e gerencie as
            devoluções.
          </p>
        </header>

        <section
          aria-label="Resumo dos empréstimos"
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <DashboardCard
            title="Empréstimos em andamento"
            value={quantidadeEmAndamento}
            icon={Clock3}
            tone="info"
          />

          <DashboardCard
            title="Devoluções previstas para hoje"
            value={quantidadeExpirandoHoje}
            icon={CalendarClock}
            tone="warning"
          />
        </section>

        <section
          aria-labelledby="titulo-pesquisa-emprestimos"
          className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <div className="mb-5">
            <h2
              id="titulo-pesquisa-emprestimos"
              className="text-lg font-bold sm:text-xl"
            >
              Pesquisar empréstimos
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              Filtre por frequentador, livro, data ou status.
            </p>
          </div>

          <SearchFilters />
        </section>

        <LoansSection
          key={JSON.stringify([nome, status, nomeLivro, dataFiltro])}
          loans={loans}
        />
      </div>
    </main>
  );
}