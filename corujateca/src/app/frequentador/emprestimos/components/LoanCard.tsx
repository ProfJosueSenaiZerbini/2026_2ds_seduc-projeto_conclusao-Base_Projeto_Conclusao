import { BookOpen, CalendarDays, Clock3 } from "lucide-react";

type Loan = {
  title: string;
  author: string;
  status: string;
  expiration: string;
  loanDate: string;
};

function obterStatusVisual(status: string) {
  switch (status) {
    case "Atrasado":
      return {
        classe: "bg-[var(--status-danger)]/10 text-[var(--status-danger)]",
        mensagem: status,
      };

    case "Devolvido no prazo":
      return {
        classe: "bg-[var(--status-success)]/10 text-[var(--status-success)]",
        mensagem: status,
      };

    case "Devolvido com atraso":
      return {
        classe: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
        mensagem: status,
      };

    case "Em andamento":
      return {
        classe: "bg-[var(--status-info)]/10 text-[var(--status-info)]",
        mensagem: status,
      };

    default:
      return {
        classe: "bg-[var(--surface-warm)] text-[var(--text-secondary)]",
        mensagem: status,
      };
  }
}

export default function LoanCard({ loan }: { loan: Loan }) {
  const statusVisual = obterStatusVisual(loan.status);

  return (
    <article className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition hover:border-[var(--border-strong)]">
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:p-6">
        <div className="flex min-w-0 flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)]">
              <BookOpen size={20} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h3 className="break-words font-bold text-[var(--text-primary)] sm:text-lg">
                {loan.title}
              </h3>

              <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">
                {loan.author}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit max-w-full shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusVisual.classe}`}
          >
            {loan.status === "Atrasado" && (
              <Clock3 size={14} aria-hidden="true" />
            )}
            {statusVisual.mensagem}
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          <div className="flex min-w-0 items-start gap-2">
            <CalendarDays
              size={17}
              className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
              aria-hidden="true"
            />

            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Data de devolução
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">
                {loan.expiration}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2">
            <CalendarDays
              size={17}
              className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
              aria-hidden="true"
            />

            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Data do empréstimo
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">
                {loan.loanDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
