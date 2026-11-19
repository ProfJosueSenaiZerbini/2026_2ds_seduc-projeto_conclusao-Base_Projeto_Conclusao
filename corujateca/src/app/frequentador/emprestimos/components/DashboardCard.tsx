import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: number;
  icon?: LucideIcon;
  tone?: "info" | "warning";
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  tone = "info",
}: Props) {
  const estiloIcone =
    tone === "warning"
      ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
      : "bg-[var(--status-info)]/10 text-[var(--status-info)]";

  return (
    <article className="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--border-strong)] sm:gap-4 sm:p-5">
      {Icon && (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${estiloIcone}`}
        >
          <Icon size={23} aria-hidden="true" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="break-words text-xs font-medium leading-relaxed text-[var(--text-secondary)] min-[375px]:text-sm sm:text-base">
          {title}
        </h3>

        <p className="mt-1 break-words text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl">
          {value}
        </p>
      </div>
    </article>
  );
}
