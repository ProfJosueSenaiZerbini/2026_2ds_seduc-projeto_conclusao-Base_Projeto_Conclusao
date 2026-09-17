"use client";

import { useRouter } from "next/navigation";

import LoanCard from "./LoanCard";

export type LoanView = {
  id: number;
  title: string;
  author: string;
  userName: string;
  status: string;
  expiration: string;
  loanDate: string;
};

export default function LoansSection({ loans }: { loans: LoanView[] }) {
  const router = useRouter();

  async function concluirEmprestimo(formData: FormData) {
    const idEmprestimo = Number(formData.get("id_emprestimo"));

    if (!idEmprestimo) {
      return;
    }

    const response = await fetch(`/api/emprestimos/${idEmprestimo}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error ?? "Erro ao concluir empréstimo.");
      return;
    }

    router.refresh();
  }
 

  return (
    <div className="mt-8 space-y-5">
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} onConcluir={concluirEmprestimo} />
        
      ))}
    </div>
  );
}
