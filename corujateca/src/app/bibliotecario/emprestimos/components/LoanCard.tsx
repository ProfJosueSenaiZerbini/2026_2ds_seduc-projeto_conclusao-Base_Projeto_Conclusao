type Loan = {
  id: number;
  title: string;
  author: string;
  userName: string;
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

export default function LoanCard({
  loan,
  onConcluir,
}: {
  loan: Loan;
  onConcluir?: (formData: FormData) => Promise<void> | void;
}) {

  async function cancelarEmprestimo() {
    const confirmar = window.confirm(
      "Tem certeza que deseja cancelar este empréstimo?",
    );

    if (!confirmar) return;

    try {
      const resposta = await fetch(`/api/emprestimos/${loan.id}/desativar`, {
        method: "PATCH",
      });

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        alert(resultado?.erro ?? "Erro ao cancelar o empréstimo.");
        return;
      }

      alert(resultado?.mensagem ?? "Empréstimo cancelado com sucesso.");

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Não foi possível cancelar o empréstimo.");
    }
  }

  return (
    <div className="rounded-2xl border border-brand-400 bg-brand-400 p-4 shadow-sm sm:p-6">
      <form action={onConcluir} className="grid grid-cols-1 gap-y-4 gap-x-6 md:grid-cols-2">
        <input type="hidden" name="id_emprestimo" value={loan.id} />

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

        <div className="flex flex-col justify-between text-left gap-1">
          <div className="text-sm md:text-base text-text-inverse space-y-2">
            <div className="flex items-start gap-2 sm:items-center sm:gap-4">
              <CalendarIcon className="w-5 h-5 shrink-0 text-text-inverse" />
              <p>
                <span className="font-bold">Data de Expiração</span>{" "}
                <span className="font-normal">{loan.expiration}</span>
              </p>
            </div>

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

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
          <button
            type="submit"
            className="w-full bg-[var(--color-button-primary)] hover:brightness-110 text-brand-200 font-semibold py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-sm cursor-pointer"
          >
            Concluir devolução do livro
          </button>

          <button
            type="button"
            onClick={cancelarEmprestimo}
            className="w-full bg-[var(--color-button-secondary)] hover:brightness-110 text-brand-200 font-semibold py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}