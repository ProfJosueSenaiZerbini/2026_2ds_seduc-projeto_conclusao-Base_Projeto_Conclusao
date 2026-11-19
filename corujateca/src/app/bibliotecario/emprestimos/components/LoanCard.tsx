"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Trash2,
  UserRound,
  AlertCircle,
} from "lucide-react";

type Loan = {
  id: number;
  title: string;
  author: string;
  userName: string;
  status: string;
  daysOverdue: number;
  expiration: string;
  loanDate: string;
};

type ModalInfo = {
  tipo: "confirmacao" | "erro";
  titulo: string;
  mensagem: string;
};

function obterStatusVisual(status: string) {
  switch (status) {
    case "Atrasado":
      return {
        classe: "bg-[var(--status-danger)]/10 text-[var(--status-danger)]",
        mensagem: "Atrasado",
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

    default:
      return {
        classe: "bg-[var(--status-info)]/10 text-[var(--status-info)]",
        mensagem: status,
      };
  }
}

const botaoPrimario =
  "inline-flex min-h-11 w-full hover:cursor-pointer min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

const botaoSecundario =
  "inline-flex min-h-11 w-full hover:cursor-pointer min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

export default function LoanCard({
  loan,
  onMutationSuccess,
}: {
  loan: Loan;
  onMutationSuccess: (message: string) => void;
}) {
  const router = useRouter();

  const [modal, setModal] = useState<ModalInfo | null>(null);
  const [processando, setProcessando] = useState(false);

  const statusVisual = obterStatusVisual(loan.status);

  function abrirConfirmacaoCancelamento() {
    setModal({
      tipo: "confirmacao",
      titulo: "Cancelar empréstimo",
      mensagem:
        "Tem certeza de que deseja cancelar este empréstimo? Essa ação removerá o empréstimo da listagem de ativos.",
    });
  }

  async function concluirDevolucao() {
    if (processando) return;

    setProcessando(true);

    try {
      // Endpoint utilizado para registrar a devolução do empréstimo.
      const resposta = await fetch(`/api/emprestimos/${loan.id}`, {
        method: "PATCH",
      });

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setModal({
          tipo: "erro",
          titulo: "Não foi possível concluir",
          mensagem:
            resultado?.erro ??
            resultado?.mensagem ??
            "Ocorreu um erro ao concluir a devolução. Tente novamente.",
        });
        return;
      }

      onMutationSuccess(
        resultado?.mensagem ??
          "A devolução do livro foi registrada com sucesso.",
      );
      router.refresh();
    } catch (error) {
      console.error("Erro ao concluir devolução:", error);

      setModal({
        tipo: "erro",
        titulo: "Erro de conexão",
        mensagem:
          "Não foi possível comunicar com o servidor. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarCancelamento() {
    if (processando) return;

    setProcessando(true);

    try {
      const resposta = await fetch(`/api/emprestimos/${loan.id}/desativar`, {
        method: "PATCH",
      });

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setModal({
          tipo: "erro",
          titulo: "Não foi possível cancelar",
          mensagem:
            resultado?.erro ??
            resultado?.mensagem ??
            "Ocorreu um erro ao cancelar o empréstimo. Tente novamente.",
        });
        return;
      }

      onMutationSuccess(
        resultado?.mensagem ?? "O empréstimo foi cancelado com sucesso.",
      );
      router.refresh();
    } catch (error) {
      console.error("Erro ao cancelar empréstimo:", error);

      setModal({
        tipo: "erro",
        titulo: "Erro de conexão",
        mensagem:
          "Não foi possível comunicar com o servidor. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setProcessando(false);
    }
  }

  function fecharModal() {
    if (processando) return;
    setModal(null);
  }

  return (
    <>
      <article className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition hover:border-[var(--border-strong)]">
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:p-6">
          <div className="flex min-w-0 flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)]">
                <BookOpen size={20} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <h3 className="break-words font-bold sm:text-lg">
                  {loan.title}
                </h3>

                <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">
                  {loan.author}
                </p>

                <p className="mt-2 flex min-w-0 items-start gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                  <UserRound
                    size={16}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="break-words">{loan.userName}</span>
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit max-w-full shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusVisual.classe}`}
            >
              {loan.status === "Atrasado" && (
                <Clock3 size={14} aria-hidden="true" />
              )}

              {loan.status === "Atrasado"
                ? `${statusVisual.mensagem} há ${loan.daysOverdue} ${
                    loan.daysOverdue === 1 ? "dia" : "dias"
                  }`
                : statusVisual.mensagem}
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
                <p className="mt-1 break-words text-sm font-semibold">
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
                <p className="mt-1 break-words text-sm font-semibold">
                  {loan.loanDate}
                </p>
              </div>
            </div>
          </div>

          {!loan.status.startsWith("Devolvido") &&
            loan.status !== "Cancelado" && (
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={concluirDevolucao}
                  disabled={processando}
                  className={botaoPrimario}
                >
                  {processando ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2 size={17} aria-hidden="true" />
                  )}

                  <span className="break-words">
                    Concluir devolução do livro
                  </span>
                </button>

                <button
                  type="button"
                  onClick={abrirConfirmacaoCancelamento}
                  disabled={processando}
                  className="inline-flex min-h-11 w-full hover:cursor-pointer min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--status-danger)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--status-danger)] transition hover:bg-[var(--status-danger)]/10 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={17} aria-hidden="true" />
                  <span>Cancelar empréstimo</span>
                </button>
              </div>
            )}
        </div>
      </article>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-emprestimo"
            aria-describedby="mensagem-modal-emprestimo"
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-md overflow-y-auto overscroll-contain rounded-[var(--radius-modal)] border border-[var(--border-default)] bg-[var(--surface)] p-5 shadow-[var(--shadow-modal)] sm:max-h-[calc(100dvh-2.5rem)] sm:p-6"
          >

            <div className="flex min-w-0 flex-col items-center pt-2 text-center">
              <div
                className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                  modal.tipo === "erro"
                    ? "bg-[var(--status-danger)]/10 text-[var(--status-danger)]"
                    : "bg-[var(--surface-warm)] text-[var(--text-primary)]"
                }`}
              >
                {modal.tipo === "erro" ? (
                  <AlertCircle size={28} aria-hidden="true" />
                ) : (
                  <Trash2 size={28} aria-hidden="true" />
                )}
              </div>

              <h2
                id="titulo-modal-emprestimo"
                className="max-w-full break-words pr-5 text-xl font-bold text-[var(--text-primary)] sm:text-2xl"
              >
                {modal.titulo}
              </h2>

              <p
                id="mensagem-modal-emprestimo"
                className="mt-3 break-words text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base"
              >
                {modal.mensagem}
              </p>

              {modal.tipo === "confirmacao" ? (
                <div className="mt-6 grid w-full min-w-0 grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                  <button
                    type="button"
                    onClick={fecharModal}
                    disabled={processando}
                    className={botaoSecundario}
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={confirmarCancelamento}
                    disabled={processando}
                    className="inline-flex hover:cursor-pointer min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--status-danger)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processando && (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    Confirmar cancelamento
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={fecharModal}
                  className={`${botaoPrimario} mt-6`}
                >
                  Entendi
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
