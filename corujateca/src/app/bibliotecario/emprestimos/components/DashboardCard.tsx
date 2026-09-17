type Props = {
  title: string;
  value: number;
};

export default function DashboardCard({ title, value }: Props) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center rounded-xl bg-brand-500 p-3 text-center text-text-inverse shadow-md sm:min-h-32 sm:p-4">
      <h3 className="max-w-xs text-sm font-semibold leading-snug sm:text-base lg:text-lg">
        {title}
      </h3>

      <span className="mt-1 text-3xl font-bold sm:text-4xl">
        {value}
      </span>
    </div>
  );
}