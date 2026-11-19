"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type DadosBibliotecario = {
  id: string | number;
  nome: string;
  ddd: string;
  telefone: string;
};

type ModalResultadoCadastroProps = {
  aberto: boolean;
  tipo: "sucesso" | "erro";
  mensagem: string;
  dados?: DadosBibliotecario | null;
  onFechar: () => void;
};

export default function ModalResultadoCadastro({
  aberto,
  tipo,
  mensagem,
  dados,
  onFechar,
}: ModalResultadoCadastroProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sucesso = tipo === "sucesso";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (aberto && !dialog.open) {
      dialog.showModal();
    } else if (!aberto && dialog.open) {
      dialog.close();
    }
  }, [aberto]);

  const telefoneFormatado = dados?.telefone
    ? `(${dados.ddd || "—"}) ${dados.telefone}`
    : "Não informado";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="titulo-modal-cadastro"
      aria-describedby="mensagem-modal-cadastro"
      onClose={onFechar}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onFechar();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[400px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[var(--radius-modal)] border-none bg-[var(--surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-modal)] outline-none backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="relative flex flex-col items-center p-6 pt-8 text-center sm:p-8">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar modal"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-hover)]">
          {sucesso ? (
            <CheckCircle2
              size={34}
              strokeWidth={1.7}
              className="text-[var(--status-success)]"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              size={34}
              strokeWidth={1.7}
              className="text-[var(--status-danger)]"
              aria-hidden="true"
            />
          )}
        </div>

        <h2
          id="titulo-modal-cadastro"
          className="text-xl font-bold leading-tight"
        >
          {sucesso ? "Bibliotecário cadastrado!" : "Não foi possível cadastrar"}
        </h2>

        <p
          id="mensagem-modal-cadastro"
          role={sucesso ? "status" : "alert"}
          className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
        >
          {mensagem}
        </p>

        {sucesso && dados && (
          <div className="mt-5 w-full rounded-[var(--radius-card)] border-2 border-[var(--border-default)] p-4 text-left">
            <p className="mb-3 text-m font-semibold text-[var(--text-primary)]">
              Dados do bibliotecário:
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[var(--text-muted)]">
                  Código de identificação
                </p>
                <p className="break-words font-semibold text-[var(--text-primary)]">
                  {dados.id}
                </p>
              </div>

              <div>
                <p className="text-[var(--text-muted)]">Nome</p>
                <p className="break-words font-medium text-[var(--text-primary)]">
                  {dados.nome}
                </p>
              </div>

              <div>
                <p className="text-[var(--text-muted)]">Telefone</p>
                <p className="break-words font-medium text-[var(--text-primary)]">
                  {telefoneFormatado}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3 text-white">
          {sucesso ? (
            <>
              <button
                type="button"
                autoFocus
                onClick={onFechar}
                className="hover:cursor-pointer inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] border-2 hover:text-[var(--text-muted)] border-[var(--border-default)] px-5 py-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                Continuar aqui
              </button>

              <Link
                href="/login/bibliotecario"
                onClick={onFechar}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-3 shadow-sm transition-colors hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                Ir para o login
              </Link>
            </>
          ) : (
            <button
              type="button"
              autoFocus
              onClick={onFechar}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-3 text-sm shadow-sm transition-colors hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
