"use client";

import { useEffect, useRef } from "react";
import { SaveCheck, X } from "lucide-react";

type ModalSenhaRedefinidaProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ModalSenhaRedefinida({
  isOpen,
  onClose,
  onConfirm,
}: ModalSenhaRedefinidaProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="titulo-senha-redefinida"
      aria-describedby="mensagem-senha-redefinida"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="
        m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)]
        max-w-[400px] overflow-y-auto rounded-[var(--radius-modal)]
        border-none bg-[var(--surface)] p-0
        text-[var(--text-primary)] shadow-[var(--shadow-modal)]
        outline-none
        backdrop:bg-black/40 backdrop:backdrop-blur-sm
      "
    >
      <div className="relative p-5 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="
            absolute right-4 top-4 flex min-h-11 min-w-11
            items-center justify-center rounded-full
            text-[var(--text-muted)] transition-colors
            hover:bg-[var(--surface-hover)]
            hover:text-[var(--text-primary)]
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[var(--focus-ring)]
          "
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center pt-3 text-center">
          <div
            className="
              mb-4 flex h-14 w-14 items-center justify-center
              rounded-full bg-[var(--surface-hover)]
              text-[var(--status-success,var(--button-primary))]
            "
            aria-hidden="true"
          >
            <SaveCheck size={32} />
          </div>

          <h2
            id="titulo-senha-redefinida"
            className="pr-5 text-lg font-bold leading-tight sm:text-xl"
          >
            Senha alterada com sucesso.
          </h2>

          <p
            id="mensagem-senha-redefinida"
            className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
          >
            A nova senha foi cadastrada. <br/> Acesse o sistema utilizando suas novas credenciais.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex min-h-11 items-center justify-center
              rounded-[var(--radius-button)]
              border-2 border-[var(--border-default)] px-4 py-2
              text-sm font-medium text-[var(--text-secondary)]
              transition-colors hover:bg-[var(--surface-hover)]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[var(--focus-ring)]
              sm:flex-1
            "
          >
            Continuar aqui
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="
              inline-flex min-h-11 items-center justify-center
              rounded-[var(--radius-button)]
              bg-[var(--button-primary)] px-4 py-2
              text-sm font-semibold text-[var(--text-inverse)]
              shadow-sm transition-colors
              hover:bg-[var(--button-primary-hover)]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[var(--focus-ring)]
              sm:flex-1
            "
          >
            Ir para o login
          </button>
        </div>
      </div>
    </dialog>
  );
}
