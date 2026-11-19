"use client";

import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

import { getSession, clearSession, UserSession } from "@/lib/auth";

import {
  AlertCircle,
  IdCard,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  UserRound,
  Phone,
  X,
} from "lucide-react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfiguracoesFrequent() {
  const router = useRouter();

  const [session, setSession] = useState<UserSession | null>(null);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  useEffect(() => {
    const currentSession = getSession();

    if (!currentSession) {
      router.replace("/login");
      return;
    }

    if (currentSession.role !== "frequentador") {
      router.replace("/login?error=acesso-negado");
      return;
    }

    setSession(currentSession);
  }, [router]);

  const abrirModalExclusao = () => {
    setErroExclusao("");
    setModalExcluirAberto(true);
  };

  const fecharModalExclusao = () => {
    if (excluindoConta) return;

    setErroExclusao("");
    setModalExcluirAberto(false);
  };

  const excluirConta = async () => {
    if (excluindoConta) return;

    setExcluindoConta(true);
    setErroExclusao("");

    try {
      const resposta = await fetch("/api/conta", {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.erro || "Não foi possível excluir a conta.");
      }

      clearSession();
      router.replace("/login");
    } catch (erro) {
      console.error("Erro ao excluir conta:", erro);

      setErroExclusao(
        erro instanceof Error
          ? erro.message
          : "Não foi possível excluir a conta. Tente novamente.",
      );

      setExcluindoConta(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--app-background)]">
      <div className="flex flex-1 items-stretch">
        <Nav />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="min-w-0 flex-1 px-3 py-6 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
            <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
              {/* Cabeçalho */}
              <header className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Configurações da conta
                </h1>

                <p className="text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
                  Consulte seus dados pessoais e gerencie sua conta na Corujateca.
                </p>
              </header>

              {/* Perfil */}
              <section
                aria-labelledby="perfil-titulo"
                className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
              >
                <div className="border-b border-[var(--border-default)] bg-[var(--surface-warm)]/50 px-4 py-4 sm:px-6">
                  <h2 id="perfil-titulo" className="text-lg font-bold sm:text-xl">
                    Meu perfil
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Informações associadas à sua conta de frequentador.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-5 p-4 sm:p-6 md:flex-row md:items-start md:gap-8">
                  {/* Imagem e tipo de conta */}
                  <div className="flex shrink-0 flex-col items-center gap-3">
                    <div className="overflow-hidden rounded-full border-4 border-[var(--border-strong)] bg-[var(--surface-warm)]">
                      <Image
                        src="/images/pfp.png"
                        alt="Imagem de perfil da Corujateca"
                        width={140}
                        height={140}
                        priority
                        className="size-28 object-cover sm:size-36"
                      />
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-warm)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      <ShieldCheck size={14} aria-hidden="true" />
                      Frequentador
                    </span>
                  </div>

                  {/* Dados da conta */}
                  <div className="w-full min-w-0 flex-1">
                    <h3 className="break-words text-center text-xl font-bold sm:text-2xl md:text-left">
                      {session.nome}
                    </h3>

                    <p className="mt-1 text-center text-sm text-[var(--text-muted)] md:text-left">
                      Confira os dados cadastrados na sua conta.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border-default)] p-3 sm:p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)]">
                          <IdCard size={20} aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-muted)]">
                            Código de identificação
                          </p>

                          <p className="mt-1 break-words font-semibold">
                            {session.id}
                          </p>
                        </div>
                      </div>

                      {/* Telefone */}
                      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border-default)] p-3 sm:p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)]">
                          <Phone size={20} aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-muted)]">
                            Telefone
                          </p>

                          <p className="mt-1 break-words font-semibold">
                            ({session.ddd}) {session.telefone}
                          </p>
                        </div>
                      </div>

                      {/* Nome completo */}
                      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border-default)] p-3 sm:col-span-2 sm:p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)]">
                          <UserRound size={20} aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-muted)]">
                            Nome completo
                          </p>

                          <p className="mt-1 break-words font-semibold">
                            {session.nome}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ação de exclusão */}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={abrirModalExclusao}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--status-danger)]/40 bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger)]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                        Excluir conta
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                      A exclusão da conta pode ser permanente. Confira se
                      realmente deseja realizar essa ação antes de continuar.
                    </p>
                  </div>
                </div>
              </section>

              {/* Aviso informativo */}
              <div className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                  aria-hidden="true"
                />

                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  Mantenha seus dados de contato atualizados. Eles ajudam a
                  biblioteca a identificar sua conta e entrar em contato quando
                  necessário.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />

      {/* Modal de confirmação de exclusão */}
      {modalExcluirAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-6 sm:px-5"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharModalExclusao();
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
            {/* Cabeçalho do modal */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--status-danger)]/10 text-[var(--status-danger)]">
                  <Trash2 size={22} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="excluir-conta-titulo"
                    className="text-lg font-bold text-[var(--text-primary)] sm:text-xl"
                  >
                    Excluir conta?
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Confirme se deseja continuar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModalExclusao}
                disabled={excluindoConta}
                aria-label="Fechar janela de confirmação"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <p
                id="excluir-conta-descricao"
                className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base"
              >
                Tem certeza de que deseja excluir sua conta? Essa ação poderá
                ser permanente e você precisará entrar novamente para usar a
                Corujateca, caso volte a se cadastrar.
              </p>

              <div className="flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/20 bg-[var(--status-danger)]/5 p-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--status-danger)]"
                  aria-hidden="true"
                />

                <p className="text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                  Antes de excluir, verifique se existem empréstimos ou multas
              pendentes vinculados à sua conta.
                </p>
              </div>

              {erroExclusao && (
                <div
                  role="alert"
                  className="rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/5 p-3 text-sm leading-relaxed text-[var(--status-danger)]"
                >
                  {erroExclusao}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-default)] bg-[var(--surface-warm)]/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={fecharModalExclusao}
                disabled={excluindoConta}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirConta}
                disabled={excluindoConta}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--status-danger)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {excluindoConta ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} aria-hidden="true" />
                    Excluir conta
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
