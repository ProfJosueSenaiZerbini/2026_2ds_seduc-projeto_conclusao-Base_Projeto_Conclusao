"use client";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  LoaderCircle,
  Pencil,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type AtualizarContaModalProps = {
  aberto: boolean;
  idBibliotecario: number;
  nomeAtual: string;
  dddAtual: string;
  telefoneAtual: string;
  onFechar: () => void;
  onSucesso: (dados: { nome: string; ddd: string; telefone: string }) => void;
};

export default function AtualizarContaModal({
  aberto,
  idBibliotecario,
  nomeAtual,
  dddAtual,
  telefoneAtual,
  onFechar,
  onSucesso,
}: AtualizarContaModalProps) {
  const [nome, setNome] = useState("");
  const [ddd, setDdd] = useState("");
  const [telefone, setTelefone] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setNome(nomeAtual);
      setDdd(dddAtual);
      setTelefone(telefoneAtual);
      setErro("");
      setConfirmando(false);
      setCarregando(false);
    }
  }, [aberto, nomeAtual, dddAtual, telefoneAtual]);

  if (!aberto) {
    return null;
  }

  function solicitarConfirmacao() {
    setErro("");

    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    if (!ddd.trim()) {
      setErro("O DDD é obrigatório.");
      return;
    }

    if (ddd.trim().length !== 2) {
      setErro("Informe um DDD com 2 dígitos.");
      return;
    }

    if (!telefone.trim()) {
      setErro("O telefone é obrigatório.");
      return;
    }

    if (telefone.trim().length < 8) {
      setErro("Informe um telefone válido.");
      return;
    }

    setConfirmando(true);
  }

  async function atualizarConta() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `/api/bibliotecario/${idBibliotecario}/atualizar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nome.trim(),
            ddd: ddd.trim(),
            telefone: telefone.trim(),
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.erro || "Não foi possível atualizar a conta.");
      }

      onSucesso({
        nome: dados.nome,
        ddd: dados.ddd,
        telefone: dados.telefone,
      });

      setConfirmando(false);
      onFechar();
    } catch (error) {
      console.error("Erro ao atualizar a conta:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a conta.",
      );
    } finally {
      setCarregando(false);
    }
  }

  const classeCampo =
    "w-full min-h-11 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 disabled:cursor-not-allowed disabled:opacity-60";

  const classeBotaoSecundario =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

  const classeBotaoPrimario =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="atualizar-conta-titulo"
        className="my-auto w-full max-w-lg overflow-hidden rounded-[var(--radius-modal)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-modal)]"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--surface-warm)]/50 p-4 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[var(--brand-400)] text-[var(--text-inverse)]">
              {confirmando ? (
                <Check size={22} aria-hidden="true" />
              ) : (
                <Pencil size={22} aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0">
              <h2
                id="atualizar-conta-titulo"
                className="text-lg font-bold text-[var(--text-primary)] sm:text-xl"
              >
                {confirmando ? "Confirmar alterações" : "Atualizar conta"}
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                {confirmando
                  ? "Confira os dados antes de confirmar."
                  : "Edite as informações que deseja atualizar."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={carregando}
            aria-label="Fechar modal"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Formulário ou confirmação */}
        <div className="max-h-[calc(100dvh-12rem)] space-y-5 overflow-y-auto p-4 sm:p-6">
          {!confirmando ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="bibliotecario-nome"
                  className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]"
                >
                  Nome completo
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />

                  <input
                    id="bibliotecario-nome"
                    type="text"
                    autoComplete="name"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    disabled={carregando}
                    className={`${classeCampo} pl-10`}
                    placeholder="Digite seu nome"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-[100px_minmax(0,1fr)]">
                <div>
                  <label
                    htmlFor="bibliotecario-ddd"
                    className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]"
                  >
                    DDD
                  </label>

                  <input
                    id="bibliotecario-ddd"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel-area-code"
                    maxLength={2}
                    value={ddd}
                    onChange={(evento) =>
                      setDdd(evento.target.value.replace(/\D/g, ""))
                    }
                    disabled={carregando}
                    className={classeCampo}
                    placeholder="11"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bibliotecario-telefone"
                    className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]"
                  >
                    Telefone
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />

                    <input
                      id="bibliotecario-telefone"
                      type="text"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={9}
                      value={telefone}
                      onChange={(evento) =>
                        setTelefone(evento.target.value.replace(/\D/g, ""))
                      }
                      disabled={carregando}
                      className={`${classeCampo} pl-10`}
                      placeholder="999999999"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Confira o DDD e o número de telefone antes de prosseguir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Deseja salvar as alterações abaixo na sua conta?
              </p>

              <div className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] p-4">
                <div className="flex items-start gap-3">
                  <UserRound
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-muted)]">Nome</p>
                    <p className="break-words text-sm font-semibold text-[var(--text-primary)]">
                      {nome.trim()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-muted)]">Telefone</p>
                    <p className="break-words text-sm font-semibold text-[var(--text-primary)]">
                      ({ddd}) {telefone}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                Confirme somente se os dados estiverem corretos.
              </p>
            </div>
          )}

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

          {/* Ações */}
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-default)] pt-4 min-[380px]:flex-row">
            {!confirmando ? (
              <>
                <button
                  type="button"
                  onClick={onFechar}
                  disabled={carregando}
                  className={classeBotaoSecundario}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={solicitarConfirmacao}
                  disabled={carregando}
                  className={classeBotaoPrimario}
                >
                  Continuar
                  <Check size={17} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setErro("");
                    setConfirmando(false);
                  }}
                  disabled={carregando}
                  className={classeBotaoSecundario}
                >
                  <ChevronLeft size={17} aria-hidden="true" />
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={atualizarConta}
                  disabled={carregando}
                  className={classeBotaoPrimario}
                >
                  {carregando ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={17} aria-hidden="true" />
                      Confirmar alterações
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
