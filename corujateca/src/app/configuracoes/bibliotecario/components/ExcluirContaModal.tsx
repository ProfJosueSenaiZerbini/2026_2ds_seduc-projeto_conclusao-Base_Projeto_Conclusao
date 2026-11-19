"use client";

import { useState } from "react";
import { AlertCircle, LoaderCircle, Trash2, X } from "lucide-react";

type ExcluirContaModalProps = {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
};

export default function ExcluirContaModal({
  aberto,
  onFechar,
  onSucesso,
}: ExcluirContaModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  if (!aberto) return null;

  async function excluirConta() {
    if (carregando) return;

    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch("/api/conta", { method: "DELETE" });
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.erro || "Não foi possível excluir a conta.");
      }

      onSucesso();
    } catch (error) {
      console.error("Erro ao excluir a conta:", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !carregando) {
          onFechar();
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="excluir-conta-titulo"
        aria-describedby="excluir-conta-descricao"
        className="my-auto w-full max-w-md overflow-hidden rounded-[var(--radius-modal)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--surface-warm)]/50 p-4 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[var(--status-danger)]/10 text-[var(--status-danger)]">
              <Trash2 size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="excluir-conta-titulo"
                className="text-lg font-bold text-[var(--text-primary)] sm:text-xl"
              >
                Excluir conta
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                Esta ação desativará seu acesso ao sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={carregando}
            aria-label="Fechar confirmação"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <p
            id="excluir-conta-descricao"
            className="text-sm leading-relaxed text-[var(--text-secondary)]"
          >
            Seu perfil será desativado e você será desconectado. Os registros da
            biblioteca associados à sua conta serão preservados. Deseja
            continuar?
          </p>

          {erro && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/5 p-3 text-sm text-[var(--status-danger)]"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>{erro}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onFechar}
              disabled={carregando}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={excluirConta}
              disabled={carregando}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--status-danger)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={17} aria-hidden="true" />
                  Excluir minha conta
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
