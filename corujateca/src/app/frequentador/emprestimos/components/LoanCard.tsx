type Loan = {
  title: string;
  author: string;
  status: string;
  expiration: string;
  loanDate: string;
};

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export default function LoanCard({ loan }: { loan: Loan }) {
  return (
    <div className="rounded-2xl bg-brand-400 p-4 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

        <div>
          <h3 className="text-2xl font-bold text-text-inverse">
            {loan.title}
          </h3>

          <p className="text-sm text-text-inverse mb-4">
            {loan.author}
          </p>

          <span className="inline-flex rounded-full bg-brand-700 px-4 py-1 text-sm font-semibold text-text-inverse">
            {loan.status}
          </span>
        </div>

        <div className="min-w-0 space-y-2 text-sm text-text-inverse sm:text-base">
          <div className="flex items-start gap-2 sm:items-center sm:gap-4">
            <CalendarIcon className="w-5 h-5 shrink-0 text-text-inverse" />
            <p className="min-w-0">
              <strong>Data de Expiração</strong> {loan.expiration}
            </p>
          </div>

          <div className="flex items-start gap-2 sm:items-center sm:gap-4">
            <CalendarIcon className="w-5 h-5 shrink-0 text-text-inverse" />
            <p className="min-w-0">
              <strong>Data do Empréstimo:</strong> {loan.loanDate}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}