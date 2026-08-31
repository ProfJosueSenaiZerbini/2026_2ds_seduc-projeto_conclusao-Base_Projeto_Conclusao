type Loan = {
  title: string;
  author: string;
  userName: string;
  status: string;
  expiration: string;
  loanDate: string;
};

// Ícone SVG do Calendário mantendo o padrão sem dependências externas
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
    <div className="rounded-2xl border border-brand-400 bg-brand-400 p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
        
        {/* Coluna Esquerda: Título, Autor e Usuário */}
        <div className="flex flex-col justify-between gap-1">
          <div>
            <h3 className="text-2xl font-bold text-text-inverse leading-tight">
              {loan.title}
            </h3>
            <p className="text-sm text-text-inverse font-medium">
              {loan.author}
            </p>
          </div>

          <p className="mt-3 text-base font-semibold text-text-inverse">
            {loan.userName}
          </p>
        </div>

        {/* Coluna Direita: Datas e Status */}
        <div className="flex flex-col justify-between text-left gap-1">
          <div className="text-sm md:text-base text-text-inverse space-y-2">
            
            {/* Data de Expiração */}
            <div className="flex items-start gap-2 sm:items-center sm:gap-4">
              <CalendarIcon className="w-5 h-5 shrink-0 text-text-inverse" />
              <p>
                <span className="font-bold">Data de Expiração</span>{" "}
                <span className="font-normal">{loan.expiration}</span>
              </p>
            </div>

            {/* Data do Empréstimo */}
            <div className="flex items-start gap-2 sm:items-center sm:gap-4">
              <CalendarIcon className="w-5 h-5 shrink-0 text-text-inverse" />
              <p>
                <span className="font-bold">Data do Empréstimo:</span>{" "}
                <span className="font-normal">{loan.loanDate}</span>
              </p>
            </div>

          </div>

          <p className="mt-3 text-base font-semibold text-text-inverse">
            {loan.status}
          </p>
        </div>

        {/* Linha Inferior: Botões de Ação */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <button
            type="button"
            className="w-full bg-[var(--color-button-primary)] hover:brightness-110 text-brand-200 font-semibold py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-sm cursor-pointer"
          >
            Concluir devolução do livro
          </button>

          <button
            type="button"
            className="w-full bg-[var(--color-button-secondary)] hover:brightness-110 text-brand-200 font-semibold py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}