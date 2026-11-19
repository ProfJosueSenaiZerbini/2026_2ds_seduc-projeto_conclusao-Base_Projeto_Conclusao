"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, UserRound } from "lucide-react";

import { saveSession, type UserRole } from "@/lib/auth";

type LoginFormProps = {
  perfil: UserRole;
};

export default function LoginForm({ perfil }: LoginFormProps) {
  const router = useRouter();

  const [codigoIdentificacao, setCodigoIdentificacao] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  const dialogCadastroRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogCadastroRef.current;

    if (!dialog) return;

    if (modalCadastroAberto && !dialog.open) {
      dialog.showModal();
    } else if (!modalCadastroAberto && dialog.open) {
      dialog.close();
    }
  }, [modalCadastroAberto]);

  const ehBibliotecario = perfil === "bibliotecario";

  const descricao = ehBibliotecario
    ? "Acesso para usuários administradores do sistema bibliotecário"
    : "Acesso para usuários frequentadores da biblioteca";

  const imagem = ehBibliotecario
    ? "/images/logo_signUp-bibliotecario.png"
    : "/images/logo_signUp-frequentador.png";

  const esqueceuSenha = ehBibliotecario
    ? "/login/bibliotecario/esqueceu-senha"
    : "/login/frequentador/esqueceu-senha";

  const cadastrarConta = "/cadastro";

  const usuario = ehBibliotecario ? "bibliotecário" : "frequentador";

  const classeFoco =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

  const classeLink = `
    inline-flex min-h-11 max-w-full items-center justify-center
    rounded-md px-2 py-2 text-center text-sm font-medium
    ${classeFoco}
  `;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    setErro("");
    setCarregando(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoIdentificacao: Number(codigoIdentificacao),
          senha,
          perfil,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível fazer login.");
        return;
      }

      if (data.usuario?.role !== perfil) {
        setErro(
          "Este usuário não pertence ao perfil selecionado. Confira seus dados ou escolha o outro perfil.",
        );
        return;
      }

      saveSession(data.usuario);

      router.replace(
        ehBibliotecario ? "/bibliotecario/home" : "/frequentador/home",
      );
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
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
        px-4 py-6
        sm:px-6 sm:py-10
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
              px-5 py-6 text-center
              sm:px-10 sm:py-8
              md:px-8 md:py-12
            "
          >
            <Image
              src={imagem}
              alt="Corujateca"
              width={360}
              height={300}
              priority
              sizes="(max-width: 639px) 180px, (max-width: 767px) 230px, 280px"
              className="h-auto w-full max-w-[180px] object-contain sm:max-w-[230px] md:max-w-[280px]"
            />

            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-primary)] sm:text-base">
              {descricao}
            </p>
          </section>

          <section
            aria-labelledby="titulo-login"
            className="
              flex min-w-0 items-center justify-center
              bg-[var(--surface)]
              px-5 py-7
              sm:px-10 sm:py-10
              md:px-8 md:py-12
            "
          >
            <div className="w-full max-w-sm">
              <h1
                id="titulo-login"
                className="mb-2 text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl"
              >
                Entre na sua conta
              </h1>

              <p
                id="descricao-login"
                className="mb-7 text-sm leading-relaxed text-[var(--text-muted)]"
              >
                Informe seus dados para continuar.
              </p>

              <form
                onSubmit={handleSubmit}
                aria-describedby={erro ? "erro-login" : "descricao-login"}
                aria-busy={carregando}
                className="space-y-5"
              >
                <div className="min-w-0">
                  <label
                    htmlFor="codigoIdentificacao"
                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                  >
                    Código de identificação
                  </label>

                  <div
                    className="
                      flex min-h-12 min-w-0 items-center
                      rounded-[var(--radius-input)]
                      border border-[var(--border-default)]
                      bg-[var(--surface)]
                      transition
                      focus-within:border-[var(--focus-ring)]
                      focus-within:ring-2
                      focus-within:ring-[var(--focus-ring)]/20
                    "
                  >
                    <UserRound
                      size={18}
                      className="ml-3 shrink-0 text-[var(--text-muted)]"
                      aria-hidden="true"
                    />

                    <input
                      id="codigoIdentificacao"
                      name="codigoIdentificacao"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={codigoIdentificacao}
                      onChange={(event) => {
                        setCodigoIdentificacao(event.target.value);
                        if (erro) setErro("");
                      }}
                      placeholder="Digite seu código"
                      autoComplete="username"
                      required
                      className="
                        min-w-0 flex-1 bg-transparent px-3 py-3
                        text-base text-[var(--text-primary)]
                        outline-none placeholder:text-[var(--text-muted)]
                        sm:text-sm
                      "
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="senha"
                    className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                  >
                    Senha
                  </label>

                  <div
                    className="
                      flex min-h-12 min-w-0 items-center
                      rounded-[var(--radius-input)]
                      border border-[var(--border-default)]
                      bg-[var(--surface)]
                      transition
                      focus-within:border-[var(--focus-ring)]
                      focus-within:ring-2
                      focus-within:ring-[var(--focus-ring)]/20
                    "
                  >
                    <KeyRound
                      size={18}
                      className="ml-3 shrink-0 text-[var(--text-muted)]"
                      aria-hidden="true"
                    />

                    <input
                      id="senha"
                      name="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(event) => {
                        setSenha(event.target.value);
                        if (erro) setErro("");
                      }}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      required
                      className="
                        min-w-0 flex-1 bg-transparent px-3 py-3
                        text-base text-[var(--text-primary)]
                        outline-none placeholder:text-[var(--text-muted)]
                        sm:text-sm
                      "
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenha((valor) => !valor)}
                      aria-label={
                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                      aria-pressed={mostrarSenha}
                      className={`
                        mr-1 flex min-h-11 min-w-11 shrink-0
                        items-center justify-center rounded-md
                        text-[var(--text-secondary)]
                        transition hover:bg-[var(--surface-hover)]
                        ${classeFoco}
                      `}
                    >
                      {mostrarSenha ? (
                        <EyeOff size={20} aria-hidden="true" />
                      ) : (
                        <Eye size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {erro && (
                  <p
                    id="erro-login"
                    role="alert"
                    className="
                      rounded-[var(--radius-input)]
                      border border-[var(--status-danger)]/30
                      bg-[var(--surface-hover)]
                      px-3 py-3 text-sm leading-relaxed
                      text-[var(--status-danger)]
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
                    bg-[var(--button-primary)]
                    px-4 py-3 font-semibold
                    text-[var(--text-inverse)]
                    shadow-sm transition
                    hover:bg-[var(--button-primary-hover)] hover:cursor-pointer
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${classeFoco}
                  `}
                >
                  {carregando ? "Entrando..." : "Entrar"}
                </button>

                {carregando && (
                  <p
                    role="status"
                    className="text-center text-sm text-[var(--text-muted)]"
                  >
                    Verificando seus dados...
                  </p>
                )}
              </form>

              <nav
                aria-label="Opções da conta"
                className="mt-6 flex flex-col items-center gap-1.5 text-center"
              >
                <Link
                  href={esqueceuSenha}
                  className={`${classeLink} text-[var(--button-primary)] hover:underline`}
                >
                  Esqueceu sua senha?
                </Link>

                {ehBibliotecario ? (
                  <Link
                    href={cadastrarConta}
                    className={`${classeLink} break-words text-[var(--button-primary)] hover:underline`}
                  >
                    Ainda não possui uma conta, {usuario}?
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalCadastroAberto(true)}
                    className={`
                      ${classeLink}
                      cursor-pointer break-words
                      text-[var(--button-primary)]
                      hover:underline
                    `}
                  >
                    Ainda não possui uma conta, {usuario}?
                  </button>
                )}

                <div className="mt-2 w-full border-t border-[var(--border-default)] pt-2">
                  <Link
                    href="/"
                    className={`${classeLink} text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline`}
                  >
                    Voltar à seleção de perfil
                  </Link>
                </div>
              </nav>
            </div>
          </section>
        </div>
      </div>

      <dialog
        ref={dialogCadastroRef}
        aria-labelledby="titulo-modal-cadastro"
        aria-describedby="mensagem-modal-cadastro"
        onClose={() => setModalCadastroAberto(false)}
        onClick={(event) => {
          if (event.target === dialogCadastroRef.current) {
            setModalCadastroAberto(false);
          }
        }}
        className="
          m-auto w-[calc(100%-2rem)] max-w-[400px]
          max-h-[calc(100dvh-2rem)] overflow-y-auto
          rounded-[var(--radius-modal)]
          border-none bg-[var(--surface)] p-0
          text-[var(--text-primary)]
          shadow-[var(--shadow-modal)]
          outline-none
          backdrop:bg-black/30 backdrop:backdrop-blur-sm
        "
      >
        <div className="relative p-5 sm:p-6">
          <div className="mt-2">
            <h2
              id="titulo-modal-cadastro"
              className="pr-8 text-lg font-bold leading-tight"
            >
              Cadastro de frequentadores
            </h2>

            <p
              id="mensagem-modal-cadastro"
              className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
            >
              Para criar sua conta como usuário da Corujateca, entre em contato com o
              bibliotecário do estabelecimento que você frequenta. Ele poderá realizar seu cadastro e fornecer seu
              código de identificação para acessar o sistema.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setModalCadastroAberto(false)}
              className={`
                inline-flex min-h-11 w-full items-center justify-center
                rounded-[var(--radius-button)]
                bg-[var(--button-primary)] px-4 py-2
                text-sm font-semibold text-[var(--text-inverse)]
                shadow-sm transition-colors hover:cursor-pointer
                hover:bg-[var(--button-primary-hover)]
                ${classeFoco}
                sm:w-auto sm:min-w-[120px]
              `}
            >
              Ok
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
