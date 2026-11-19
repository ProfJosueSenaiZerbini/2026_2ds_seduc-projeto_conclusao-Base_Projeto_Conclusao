"use client";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CircleHelp,
  LibraryBig,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession, UserSession } from "@/lib/auth";

type EmprestimoHoje = {
  id: number;
  titulo: string;
  autor: string;
  dataEmprestimo: string;
  dataDevolucao: string;
};

export default function HomeFreq() {
  const router = useRouter();

  const [session, setSession] = useState<UserSession | null>(null);

  const [emprestimosEmAndamento, setEmprestimosEmAndamento] = useState(0);
  const [multasPendentes, setMultasPendentes] = useState(0);
  const [emprestimosHoje, setEmprestimosHoje] = useState<EmprestimoHoje[]>([]);

  const [erroResumo, setErroResumo] = useState(false);
  const [erroEmprestimos, setErroEmprestimos] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [carregandoEmprestimos, setCarregandoEmprestimos] = useState(true);

  useEffect(() => {
    const currentSession = getSession();

    if (!currentSession) {
      router.replace("/login");
      return;
    }

    if (currentSession.role !== "frequentador") {
      router.replace("/login?error=acesso-negado");
      return;
    }

    setSession(currentSession);
  }, [router]);

  useEffect(() => {
    async function carregarResumo() {
      try {
        const resposta = await fetch("/api/frequentador/resumo");

        if (!resposta.ok) {
          throw new Error("Erro ao buscar resumo do frequentador.");
        }

        const dados = await resposta.json();

        setEmprestimosEmAndamento(dados.emprestimosEmAndamento ?? 0);
        setMultasPendentes(dados.multasPendentes ?? 0);
      } catch (error) {
        console.error("Erro ao buscar resumo do frequentador:", error);
        setErroResumo(true);
      } finally {
        setCarregandoResumo(false);
      }
    }

    carregarResumo();
  }, []);

  useEffect(() => {
    async function carregarEmprestimosHoje() {
      try {
        const resposta = await fetch("/api/frequentador/emprestimos-hoje");

        if (!resposta.ok) {
          throw new Error("Erro ao buscar empréstimos que vencem hoje.");
        }

        const dados = await resposta.json();

        setEmprestimosHoje(
          Array.isArray(dados.emprestimos) ? dados.emprestimos : [],
        );
      } catch (error) {
        console.error("Erro ao buscar empréstimos que vencem hoje:", error);
        setErroEmprestimos(true);
        setEmprestimosHoje([]);
      } finally {
        setCarregandoEmprestimos(false);
      }
    }

    carregarEmprestimosHoje();
  }, []);

  if (!session) {
    return null;
  }

  const atalhos = [
    {
      titulo: "Acervo",
      descricao: "Explore os livros disponíveis na biblioteca.",
      href: "/frequentador/acervo",
      icon: LibraryBig,
    },
    {
      titulo: "Multas",
      descricao: "Consulte suas multas e os respectivos períodos.",
      href: "/frequentador/multas",
      icon: ReceiptText,
    },
    {
      titulo: "Ajuda",
      descricao: "Encontre orientações para utilizar o sistema.",
      href: "/frequentador/ajuda",
      icon: CircleHelp,
    },
  ];

  return (
    <main className="min-w-0 flex-1 overflow-x-clip bg-[var(--app-background)] px-3 py-5 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
        {/* Cabeçalho */}
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Página inicial
          </h1>

          <p className="text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Bem-vindo(a),{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {session.nome}
            </span>
            ! Confira seus empréstimos e acompanhe suas pendências.
          </p>
        </header>

        {/* Indicadores */}
        <section aria-label="Resumo da conta" className="space-y-3">
          <h2 className="text-lg font-bold sm:text-xl">Meu resumo</h2>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
            <article className="flex min-h-32 min-w-0 items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:min-h-36 sm:p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)] sm:size-14">
                <BookOpen size={26} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[var(--text-secondary)] sm:text-base">
                  Empréstimos em andamento
                </p>

                {carregandoResumo ? (
                  <div className="mt-2 h-9 w-16 animate-pulse rounded-md bg-[var(--surface-warm)]" />
                ) : (
                  <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                    {emprestimosEmAndamento}
                  </p>
                )}

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Seus empréstimos ativos
                </p>
              </div>
            </article>

            <article className="flex min-h-32 min-w-0 items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:min-h-36 sm:p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[var(--status-info)]/10 text-[var(--status-info)] sm:size-14">
                <ReceiptText size={26} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[var(--text-secondary)] sm:text-base">
                  Multas pendentes
                </p>

                {carregandoResumo ? (
                  <div className="mt-2 h-9 w-16 animate-pulse rounded-md bg-[var(--surface-warm)]" />
                ) : (
                  <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                    {multasPendentes}
                  </p>
                )}

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Suas multas registradas como pendentes
                </p>
              </div>
            </article>
          </div>

          {erroResumo && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-3 text-sm text-[var(--status-danger)]"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>
                Não foi possível carregar seu resumo. Os valores exibidos podem
                estar desatualizados.
              </p>
            </div>
          )}
        </section>

        {/* Empréstimos com vencimento hoje */}
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-[var(--border-default)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--status-warning)]/10 text-[var(--status-warning)]">
                <CalendarClock size={22} aria-hidden="true" />
              </div>

              <div>
                <h2 className="text-base font-bold sm:text-lg">
                  Empréstimos que vencem hoje
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Confira se algum livro precisa ser devolvido hoje.
                </p>
              </div>
            </div>

            <Link
              href="/frequentador/emprestimos"
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-[var(--radius-button)] px-3 py-2 text-sm font-semibold text-[var(--brand-700)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:self-auto"
            >
              Ver empréstimos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto p-3 sm:p-5">
            {carregandoEmprestimos ? (
              <div className="space-y-3" aria-live="polite">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl bg-[var(--surface-warm)]"
                  />
                ))}
              </div>
            ) : erroEmprestimos ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-warm)] p-4"
              >
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-[var(--status-danger)]"
                />
                <div>
                  <p className="font-semibold">
                    Não foi possível carregar seus empréstimos.
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Acesse a página de empréstimos para tentar consultar
                    novamente.
                  </p>
                </div>
              </div>
            ) : emprestimosHoje.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-hover)] px-4 py-8 text-center">
                <CalendarClock
                  size={30}
                  className="mb-3 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <p className="font-semibold">Nenhum empréstimo vence hoje.</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Você não tem devoluções previstas para hoje.
                </p>
              </div>
            ) : (
              emprestimosHoje.map((emprestimo) => (
                <article
                  key={emprestimo.id}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-3 transition-colors hover:bg-[var(--surface-hover)] sm:p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-400)] text-[var(--text-inverse)]">
                        <BookOpen size={20} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words font-bold leading-snug">
                          {emprestimo.titulo}
                        </h3>
                        <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">
                          {emprestimo.autor}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--status-warning)]/10 px-2 py-1 text-xs font-semibold text-[var(--status-warning)]">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--brand-400)] text-[var(--text-inverse)]">
                        <CalendarClock size={14} aria-hidden="true" />
                      </span>
                      Vence hoje
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--border-default)] pt-3 min-[480px]:grid-cols-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Data do empréstimo
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {emprestimo.dataEmprestimo}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Data de devolução
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {emprestimo.dataDevolucao}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Atalhos */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Acesso rápido</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Explore o acervo e acompanhe sua conta.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {atalhos.map(({ titulo, descricao, href, icon: Icon }) => {
              const posicao =
                href === "/frequentador/ajuda"
                  ? "sm:col-start-2 sm:row-span-2 sm:row-start-1"
                  : href === "/frequentador/acervo"
                    ? "sm:col-start-1 sm:row-start-1"
                    : "sm:col-start-1 sm:row-start-2";

              return (
                <Link
                  key={titulo}
                  href={href}
                  className={`flex min-h-28 min-w-0 items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:p-5 ${posicao}`}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[var(--brand-400)] text-[var(--text-inverse)]">
                    <Icon size={24} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                      {descricao}
                    </p>
                  </div>

                  <ArrowRight
                    size={18}
                    className="shrink-0 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
