import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: "info" | "warning";
};

const toneClasses = {
  info: "bg-[var(--status-info)]/10 text-[var(--status-info)]",
  warning: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
};

export default function DashboardCard({ title, value, icon: Icon, tone }: Props) {
  return (
    <article className="flex min-w-0 items-center gap-4 rounded-[var(--radius-card)] border-2 border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md sm:h-14 sm:w-14 ${toneClasses[tone]}`}
      >
        <Icon size={25} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <h2 className="text-sm font-medium leading-snug text-[var(--text-secondary)]">
          {title}
        </h2>

        <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
          {value}
        </p>

        <p className="mt-1 text-xs text-[var(--text-muted)]">Em circulação</p>
      </div>
    </article>
  );
}