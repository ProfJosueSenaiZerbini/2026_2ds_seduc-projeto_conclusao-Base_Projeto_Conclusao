"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type FeedbackType = "success" | "error" | "info";

type ModalFeedbackProps = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  tipo: FeedbackType;
  onFechar: () => void;
};

const estilos = {
  success: {
    icone: CheckCircle2,
    cor: "text-[var(--status-success,var(--button-primary))]",
    fundo: "bg-[var(--status-success,var(--button-primary))]/10",
  },
  error: {
    icone: AlertCircle,
    cor: "text-[var(--status-danger)]",
    fundo: "bg-[var(--status-danger)]/10",
  },
  info: {
    icone: Info,
    cor: "text-[var(--text-secondary)]",
    fundo: "bg-[var(--surface-hover)]",
  },
};

export default function ModalFeedback({
  aberto,
  titulo,
  mensagem,
  tipo,
  onFechar,
}: ModalFeedbackProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { icone: Icone, cor, fundo } = estilos[tipo];

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (aberto && !dialog.open) {
      dialog.showModal();
    } else if (!aberto && dialog.open) {
      dialog.close();
    }
  }, [aberto]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onFechar();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-feedback-titulo"
      aria-describedby="modal-feedback-mensagem"
      onClose={onFechar}
      onClick={handleBackdropClick}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[var(--radius-modal)] border border-[var(--border-default)] bg-[var(--surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-modal)] outline-none backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-5 sm:p-6">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar mensagem"
          className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center pt-2 text-center">
          <div
            className={`mb-4 flex size-14 items-center justify-center rounded-full ${fundo} ${cor}`}
            aria-hidden="true"
          >
            <Icone size={30} />
          </div>

          <h2
            id="modal-feedback-titulo"
            className="px-6 text-lg font-bold leading-tight sm:text-xl"
          >
            {titulo}
          </h2>
          <p
            id="modal-feedback-mensagem"
            className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
          >
            {mensagem}
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] shadow-sm transition-colors hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:w-auto sm:min-w-32"
          >
            Entendi
          </button>
        </div>
      </div>
    </dialog>
  );
}
