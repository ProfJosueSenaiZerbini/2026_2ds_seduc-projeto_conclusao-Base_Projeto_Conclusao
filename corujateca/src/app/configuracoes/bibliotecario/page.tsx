"use client";

import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AtualizarContaModal from "@/app/configuracoes/bibliotecario/components/AtualizarContaModal";
import ExcluirContaModal from "@/app/configuracoes/bibliotecario/components/ExcluirContaModal";
import ModalFeedback, {
  type FeedbackType,
} from "@/components/ModalFeedback";

import {
  clearSession,
  getSession,
  saveSession,
  UserSession,
} from "@/lib/auth";
import {
  AlertCircle,
  IdCard,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfiguracoesBibli() {
  const router = useRouter();

  const [session, setSession] = useState<UserSession | null>(null);
  const [modalAtualizarConta, setModalAtualizarConta] = useState(false);
  const [modalExcluirConta, setModalExcluirConta] = useState(false);
  const [feedback, setFeedback] = useState<{
    titulo: string;
    mensagem: string;
    tipo: FeedbackType;
    aoFechar?: () => void;
  } | null>(null);

  const [ddd, setDdd] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    const currentSession = getSession();

    if (!currentSession) {
      router.replace("/login");
      return;
    }

    if (currentSession.role !== "bibliotecario") {
      router.replace("/login?error=acesso-negado");
      return;
    }

    setSession(currentSession);
    setDdd(currentSession.ddd);
    setTelefone(currentSession.telefone);
  }, [router]);

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
              {/* CabeÃ§alho */}
              <header className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Configurações da conta
                </h1>

                <p className="text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
                  Consulte seus dados pessoais e mantenha suas informações
                  atualizadas.
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
                    Informações associadas à sua conta de bibliotecário.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-5 p-4 sm:p-6 md:flex-row md:items-start md:gap-8">
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
                      Bibliotecário
                    </span>
                  </div>

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
                            Código de Identificação
                          </p>
                          <p className="mt-1 break-words font-semibold">
                            {session.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border-default)] p-3 sm:p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-warm)] text-[var(--text-primary)]">
                          <Phone size={20} aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-muted)]">
                            Telefone
                          </p>
                          <p className="mt-1 break-words font-semibold">
                            ({ddd}) {telefone}
                          </p>
                        </div>
                      </div>

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

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setModalAtualizarConta(true)}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
                      >
                        <Pencil size={18} aria-hidden="true" />
                        Atualizar conta
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalExcluirConta(true)}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--status-danger)]/40 bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger)]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                        Excluir conta
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                      Se seus dados estiverem incorretos, utilize a opção
                      "Atualizar conta" para editá-los.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  Mantenha seu telefone atualizado para que as informações de
                  contato da sua conta estejam corretas.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />

      <AtualizarContaModal
        aberto={modalAtualizarConta}
        idBibliotecario={session.id}
        nomeAtual={session.nome}
        dddAtual={ddd}
        telefoneAtual={telefone}
        onFechar={() => setModalAtualizarConta(false)}
        onSucesso={(dados) => {
          setSession((atual) => {
            if (!atual) {
              return atual;
            }

            const novaSession = {
              ...atual,
              nome: dados.nome,
              ddd: dados.ddd,
              telefone: dados.telefone,
            };

            saveSession(novaSession);

            return novaSession;
          });

          setDdd(dados.ddd);
          setTelefone(dados.telefone);
          setFeedback({
            titulo: "Conta atualizada",
            mensagem: "Seus dados foram atualizados com sucesso.",
            tipo: "success",
          });
        }}
      />

      <ExcluirContaModal
        aberto={modalExcluirConta}
        onFechar={() => setModalExcluirConta(false)}
        onSucesso={() => {
          setModalExcluirConta(false);
          clearSession();
          setFeedback({
            titulo: "Conta excluída",
            mensagem:
              "Sua conta foi desativada com sucesso. Você será redirecionado para o login.",
            tipo: "success",
            aoFechar: () => router.replace("/login"),
          });
        }}
      />

      {feedback && (
        <ModalFeedback
          aberto
          titulo={feedback.titulo}
          mensagem={feedback.mensagem}
          tipo={feedback.tipo}
          onFechar={() => {
            const acaoAoFechar = feedback.aoFechar;
            setFeedback(null);
            acaoAoFechar?.();
          }}
        />
      )}
    </div>
  );
}
