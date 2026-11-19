"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  UserRound,
  BrickWallShield,
} from "lucide-react";

import type { UserRole } from "@/lib/auth";
import ModalSenhaRedefinida from "@/components/auth_components/ModalSenhaRedefinida";

type EsqueceuSenhaFormProps = {
  perfil: UserRole;
};

export default function EsqueceuSenhaForm({ perfil }: EsqueceuSenhaFormProps) {
  const router = useRouter();

  const [senhaUsuarioMaster, setSenhaUsuarioMaster] = useState("");
  const [codigoIdentificacaoUsuario, setCodigoIdentificacaoUsuario] =
    useState("");
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState("");
  const [mostrarSenhaMaster, setMostrarSenhaMaster] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const ehBibliotecario = perfil === "bibliotecario";

  const descricao = ehBibliotecario
    ? "Redefinição da senha de usuários bibliotecários."
    : "Redefinição da senha de usuários frequentadores.";

  const caminhoLogin = ehBibliotecario
    ? "/login/bibliotecario"
    : "/login/frequentador";

  const classeCampo =
    "min-h-12 w-full min-w-0 rounded-[var(--radius-input)] " +
    "border border-[var(--border-default)] bg-[var(--surface)] " +
    "px-3 py-3 text-base text-[var(--text-primary)] " +
    "outline-none placeholder:text-[var(--text-muted)] " +
    "transition focus:border-[var(--focus-ring)] " +
    "focus:ring-2 focus:ring-[var(--focus-ring)]/20 sm:text-sm";

  const classeFoco =
    "focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-[var(--focus-ring)]";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    setErro("");

    if (
      !Number.isSafeInteger(Number(codigoIdentificacaoUsuario)) ||
      Number(codigoIdentificacaoUsuario) <= 0
    ) {
      setErro("Informe um código de identificação válido.");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/esqueci-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senhaMaster: senhaUsuarioMaster,
          codigoIdentificacaoUsuario,
          novaSenhaUsuario,
          tipoUsuario: perfil,
        }),
      });

      const text = await response.text();

      let data: { erro?: string } = {};

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Não foi possível interpretar a resposta do servidor (${response.status}).`,
        );
      }

      if (!response.ok) {
        setErro(data.erro || "Não foi possível redefinir a senha.");
        return;
      }

      setSenhaUsuarioMaster("");
      setCodigoIdentificacaoUsuario("");
      setNovaSenhaUsuario("");
      setModalAberto(true);
    } catch (error: unknown) {
      console.error("Erro ao redefinir senha:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main
      className="
        flex min-h-screen items-center justify-center
        bg-[url('/images/backgroundLoginSignup.png')]
        bg-cover bg-center bg-no-repeat
        px-4 py-6 sm:px-6 sm:py-10
      "
    >
      <div className="w-full max-w-5xl">
        <div
          className="
            grid min-w-0 overflow-hidden
            rounded-[var(--radius-card)]
            bg-[var(--app-background)]
            shadow-[var(--shadow-card)]
            md:min-h-[470px] md:grid-cols-2
          "
        >
          <section
            aria-label="Apresentação da Corujateca"
            className="
              flex min-w-0 flex-col items-center justify-center
              px-5 py-6 text-center sm:px-10 sm:py-8
              md:px-8 md:py-12
            "
          >
            <Image
              src="/images/esqueceu-senha_icon.png"
              alt="Corujateca"
              width={360}
              height={300}
              priority
              sizes="(max-width: 639px) 150px, (max-width: 767px) 220px, 260px"
              className="h-auto w-full max-w-[150px] object-contain sm:max-w-[220px] md:max-w-[260px]"
            />

            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-primary)] sm:text-base">
              {descricao}
            </p>
          </section>

          <section
            aria-labelledby="titulo-recuperacao"
            className="
              flex min-w-0 items-center justify-center
              bg-[var(--surface)] px-5 py-7
              sm:px-10 sm:py-10 md:px-8 md:py-12
            "
          >
            <div className="w-full max-w-sm">
              <h1
                id="titulo-recuperacao"
                className="text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl"
              >
                Esqueceu sua senha?
              </h1>

              <p className="mb-6 mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                Com o aval do usuário master, insira o seu
                código de identificação seguido da nova senha, que deverá ser
                guardada com maior afinco. Dessa forma, após a confirmação da
                mudança, a senha será modificada.
              </p>

              <form
                onSubmit={handleSubmit}
                aria-busy={carregando}
                aria-describedby={erro ? "erro-recuperacao" : undefined}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="senhaUsuarioMaster"
                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                  >
                    Senha do usuário master
                  </label>

                  <div className="relative">
                    <BrickWallShield
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />

                    <input
                      id="senhaUsuarioMaster"
                      name="senhaUsuarioMaster"
                      type={mostrarSenhaMaster ? "text" : "password"}
                      autoComplete="current-password"
                      value={senhaUsuarioMaster}
                      onChange={(event) => {
                        setSenhaUsuarioMaster(event.target.value);
                        if (erro) setErro("");
                      }}
                      placeholder="Digite a senha do usuário master"
                      required
                      className={`${classeCampo} pr-14 pl-10`}
                    />

                    <button
                      type="button"
                      aria-label={
                        mostrarSenhaMaster
                          ? "Ocultar senha do usuário master"
                          : "Mostrar senha do usuário master"
                      }
                      aria-pressed={mostrarSenhaMaster}
                      onClick={() => setMostrarSenhaMaster((valor) => !valor)}
                      className={`
                        absolute right-1 top-1/2 flex min-h-11 min-w-11
                        -translate-y-1/2 items-center justify-center
                        rounded-md text-[var(--text-secondary)]
                        hover:bg-[var(--surface-hover)]
                        ${classeFoco}
                      `}
                    >
                      {mostrarSenhaMaster ? (
                        <EyeOff size={20} aria-hidden="true" />
                      ) : (
                        <Eye size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="codigoIdentificacaoUsuario"
                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                  >
                    Código de identificação
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />

                    <input
                      id="codigoIdentificacaoUsuario"
                      name="codigoIdentificacaoUsuario"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      autoComplete="username"
                      value={codigoIdentificacaoUsuario}
                      onChange={(event) => {
                        setCodigoIdentificacaoUsuario(event.target.value);
                        if (erro) setErro("");
                      }}
                      placeholder="Digite seu código de identificação"
                      required
                      className={`${classeCampo} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="novaSenhaUsuario"
                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                  >
                    Nova senha
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />

                    <input
                      id="novaSenhaUsuario"
                      name="novaSenhaUsuario"
                      type={mostrarNovaSenha ? "text" : "password"}
                      autoComplete="new-password"
                      value={novaSenhaUsuario}
                      onChange={(event) => {
                        setNovaSenhaUsuario(event.target.value);
                        if (erro) setErro("");
                      }}
                      placeholder="Digite sua nova senha"
                      required
                      className={`${classeCampo} pr-14 pl-10`}
                    />

                    <button
                      type="button"
                      aria-label={
                        mostrarNovaSenha
                          ? "Ocultar nova senha"
                          : "Mostrar nova senha"
                      }
                      aria-pressed={mostrarNovaSenha}
                      onClick={() => setMostrarNovaSenha((valor) => !valor)}
                      className={`
                        absolute right-1 top-1/2 flex min-h-11 min-w-11
                        -translate-y-1/2 items-center justify-center
                        rounded-md text-[var(--text-secondary)]
                        hover:bg-[var(--surface-hover)]
                        ${classeFoco}
                      `}
                    >
                      {mostrarNovaSenha ? (
                        <EyeOff size={20} aria-hidden="true" />
                      ) : (
                        <Eye size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {erro && (
                  <p
                    id="erro-recuperacao"
                    role="alert"
                    className="
                      rounded-[var(--radius-input)]
                      border border-[var(--status-danger)]/30
                      bg-[var(--surface-hover)] px-3 py-3
                      text-sm leading-relaxed text-[var(--status-danger)]
                    "
                  >
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  className={`
                    flex min-h-12 w-full items-center justify-center
                    rounded-[var(--radius-button)]
                    bg-[var(--button-primary)] px-4 py-3
                    font-semibold text-[var(--text-inverse)]
                    shadow-sm transition
                    hover:bg-[var(--button-primary-hover)]
                    disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer
                    ${classeFoco}
                  `}
                >
                  {carregando ? "Redefinindo senha..." : "Redefinir senha"}
                </button>

                {carregando && (
                  <p
                    role="status"
                    className="text-center text-sm text-[var(--text-muted)]"
                  >
                    Validando os dados...
                  </p>
                )}
              </form>

              <div className="mt-5 border-t border-[var(--border-default)] pt-4 text-center">
                <Link
                  href={caminhoLogin}
                  className={`
                    inline-flex min-h-11 items-center justify-center
                    rounded-md px-3 py-2 text-sm font-medium
                    text-[var(--button-primary)] hover:underline
                    ${classeFoco}
                  `}
                >
                  Voltar para o login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ModalSenhaRedefinida
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={() => router.replace(caminhoLogin)}
      />
    </main>
  );
}
