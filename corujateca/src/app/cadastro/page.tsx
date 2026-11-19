"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Phone, UserRound } from "lucide-react";

import ModalResultadoCadastro, {
  type DadosBibliotecario,
} from "@/components/auth_components/ModalResultadoCadastro";

type ResultadoCadastro = {
  aberto: boolean;
  tipo: "sucesso" | "erro";
  mensagem: string;
};

export default function Cadastro() {
  const [senhaUsuarioMaster, setSenhaUsuarioMaster] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [senhaUsuario, setSenhaUsuario] = useState("");
  const [novoDdd, setNovoDdd] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");

  const [bibliotecarioCriado, setBibliotecarioCriado] =
    useState<DadosBibliotecario | null>(null);

  const [mostrarSenhaMaster, setMostrarSenhaMaster] = useState(false);
  const [mostrarSenhaUsuario, setMostrarSenhaUsuario] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [modal, setModal] = useState<ResultadoCadastro>({
    aberto: false,
    tipo: "sucesso",
    mensagem: "",
  });

  const classeFoco =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

  const classeCampo =
    "min-h-12 min-w-0 w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-base text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] focus:ring-2 focus:ring-[var(--focus-ring)]/20 sm:text-sm";

  const classeLabel =
    "mb-2 block text-sm font-semibold text-[var(--text-primary)]";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    setCarregando(true);

    try {
      const response = await fetch("/api/bibliotecario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senhaMaster: senhaUsuarioMaster,
          nome: nomeUsuario.trim(),
          senha: senhaUsuario,
          ddd: novoDdd,
          telefone: novoTelefone,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setModal({
          aberto: true,
          tipo: "erro",
          mensagem:
            data.erro ||
            "O cadastro não pôde ser realizado. Confira os dados e tente novamente.",
        });

        return;
      }

      const idCriado =
        data.id_bibliotecario ??
        data.bibliotecario?.id_bibliotecario ??
        data.usuario?.id_bibliotecario ??
        data.id;

      if (idCriado === undefined || idCriado === null) {
        setModal({
          aberto: true,
          tipo: "erro",
          mensagem:
            "O cadastro foi processado, mas a resposta não trouxe o código de identificação. Verifique a API antes de tentar cadastrar novamente.",
        });
        return;
      }

      setBibliotecarioCriado({
        id: idCriado,
        nome: nomeUsuario.trim(),
        ddd: novoDdd,
        telefone: novoTelefone,
      });

      setSenhaUsuarioMaster("");
      setNomeUsuario("");
      setSenhaUsuario("");
      setNovoDdd("");
      setNovoTelefone("");

      setMostrarSenhaMaster(false);
      setMostrarSenhaUsuario(false);

      setModal({
        aberto: true,
        tipo: "sucesso",
        mensagem: "O bibliotecário foi cadastrado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao cadastrar bibliotecário:", error);

      setModal({
        aberto: true,
        tipo: "erro",
        mensagem:
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    setModal((atual) => ({
      ...atual,
      aberto: false,
    }));
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
            md:grid-cols-2
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
              src="/images/cadastro-bibliotecario_icon.png"
              alt="Corujateca"
              width={360}
              height={300}
              priority
              sizes="(max-width: 639px) 180px, (max-width: 767px) 230px, 280px"
              className="
                h-auto w-full max-w-[180px] object-contain
                sm:max-w-[230px] md:max-w-[280px]
              "
            />

            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              Cadastre um novo bibliotecário no sistema utilizando a autorização
              do usuário master.
            </p>
          </section>

          <section
            aria-labelledby="titulo-formulario-cadastro"
            className="
              flex min-w-0 items-center justify-center
              bg-[var(--surface)]
              px-5 py-7
              sm:px-10 sm:py-10
              md:px-8 md:py-12
            "
          >
            <div className="w-full max-w-sm">
              <h2
                id="titulo-formulario-cadastro"
                className="text-2xl font-bold leading-tight text-[var(--text-primary)]"
              >
                Preencha os dados
              </h2>

              <p className="mb-6 mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                Com o aval do usuário master, insira seu nome completo, crie uma
                senha e insira um número de telefone, no qual poderá ser
                conferido e editado posteriormente. Dessa forma, após a
                confirmação da catalogação, o usuário será criado.
              </p>

              <form
                onSubmit={handleSubmit}
                aria-busy={carregando}
                className="space-y-5"
              >
                {/* Senha master */}
                <div className="min-w-0">
                  <label htmlFor="senhaUsuarioMaster" className={classeLabel}>
                    Senha do usuário master
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      aria-hidden="true"
                      className="
                        pointer-events-none absolute left-3 top-1/2
                        -translate-y-1/2 text-[var(--text-muted)]
                      "
                    />

                    <input
                      id="senhaUsuarioMaster"
                      name="senhaUsuarioMaster"
                      type={mostrarSenhaMaster ? "text" : "password"}
                      value={senhaUsuarioMaster}
                      onChange={(event) =>
                        setSenhaUsuarioMaster(event.target.value)
                      }
                      placeholder="Digite a senha master"
                      autoComplete="current-password"
                      required
                      className={`${classeCampo} pl-10 pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenhaMaster((valor) => !valor)}
                      aria-label={
                        mostrarSenhaMaster
                          ? "Ocultar senha master"
                          : "Mostrar senha master"
                      }
                      aria-pressed={mostrarSenhaMaster}
                      className={`
                        absolute right-1 top-1/2
                        flex min-h-11 min-w-11 -translate-y-1/2
                        items-center justify-center rounded-md
                        text-[var(--text-secondary)]
                        hover:bg-[var(--surface-hover)] 
                        ${classeFoco}
                      `}
                    >
                      {mostrarSenhaMaster ? (
                        <EyeOff size={19} aria-hidden="true" />
                      ) : (
                        <Eye size={19} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nome */}
                <div className="min-w-0">
                  <label htmlFor="nomeUsuario" className={classeLabel}>
                    Nome do bibliotecário
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      aria-hidden="true"
                      className="
                        pointer-events-none absolute left-3 top-1/2
                        -translate-y-1/2 text-[var(--text-muted)]
                      "
                    />

                    <input
                      id="nomeUsuario"
                      name="nomeUsuario"
                      type="text"
                      value={nomeUsuario}
                      onChange={(event) => setNomeUsuario(event.target.value)}
                      placeholder="Digite o nome completo"
                      autoComplete="name"
                      maxLength={150}
                      required
                      className={`${classeCampo} pl-10`}
                    />
                  </div>
                </div>

                {/* Senha do novo bibliotecário */}
                <div className="min-w-0">
                  <label htmlFor="senhaUsuario" className={classeLabel}>
                    Senha do novo bibliotecário
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      aria-hidden="true"
                      className="
                        pointer-events-none absolute left-3 top-1/2
                        -translate-y-1/2 text-[var(--text-muted)]
                      "
                    />

                    <input
                      id="senhaUsuario"
                      name="senhaUsuario"
                      type={mostrarSenhaUsuario ? "text" : "password"}
                      value={senhaUsuario}
                      onChange={(event) => setSenhaUsuario(event.target.value)}
                      placeholder="Crie uma senha"
                      autoComplete="new-password"
                      required
                      className={`${classeCampo} pl-10 pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenhaUsuario((valor) => !valor)}
                      aria-label={
                        mostrarSenhaUsuario
                          ? "Ocultar senha do bibliotecário"
                          : "Mostrar senha do bibliotecário"
                      }
                      aria-pressed={mostrarSenhaUsuario}
                      className={`
                        absolute right-1 top-1/2
                        flex min-h-11 min-w-11 -translate-y-1/2
                        items-center justify-center rounded-md
                        text-[var(--text-secondary)]
                        hover:bg-[var(--surface-hover)]
                        ${classeFoco}
                      `}
                    >
                      {mostrarSenhaUsuario ? (
                        <EyeOff size={19} aria-hidden="true" />
                      ) : (
                        <Eye size={19} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Telefone */}
                <fieldset className="min-w-0">
                  <legend className={classeLabel}>Telefone (opcional)</legend>

                  <div className="flex min-w-0 gap-3">
                    <div className="w-24 shrink-0">
                      <label
                        htmlFor="novoDdd"
                        className="mb-1 block text-xs text-[var(--text-muted)]"
                      >
                        DDD
                      </label>

                      <input
                        id="novoDdd"
                        name="ddd"
                        type="text"
                        inputMode="numeric"
                        autoComplete="tel-area-code"
                        value={novoDdd}
                        onChange={(event) =>
                          setNovoDdd(
                            event.target.value.replace(/\D/g, "").slice(0, 2),
                          )
                        }
                        placeholder="11"
                        maxLength={2}
                        className={classeCampo}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor="novoTelefone"
                        className="mb-1 block text-xs text-[var(--text-muted)]"
                      >
                        Número
                      </label>

                      <div className="relative">
                        <Phone
                          size={17}
                          aria-hidden="true"
                          className="
                            pointer-events-none absolute left-3 top-1/2
                            -translate-y-1/2 text-[var(--text-muted)]
                          "
                        />

                        <input
                          id="novoTelefone"
                          name="telefone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          value={novoTelefone}
                          onChange={(event) =>
                            setNovoTelefone(
                              event.target.value.replace(/\D/g, "").slice(0, 9),
                            )
                          }
                          placeholder="999999999"
                          maxLength={9}
                          className={`${classeCampo} pl-9`}
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={carregando}
                  className={`
                    flex min-h-12 w-full items-center justify-center
                    rounded-[var(--radius-button)]
                    bg-[var(--button-primary)] px-4 py-3
                    font-semibold text-[var(--text-inverse)]
                    shadow-sm transition-colors
                    hover:bg-[var(--button-primary-hover)]
                    disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer
                    ${classeFoco}
                  `}
                >
                  {carregando ? "Cadastrando..." : "Cadastrar bibliotecário"}
                </button>

                {carregando && (
                  <p
                    role="status"
                    className="text-center text-sm text-[var(--text-muted)]"
                  >
                    Verificando autorização e cadastrando...
                  </p>
                )}

                <div className="border-t border-[var(--border-default)] pt-3 text-center">
                  <Link
                    href="/login/bibliotecario"
                    className={`
                      inline-flex min-h-11 items-center justify-center
                      rounded-md px-3 py-2 text-sm font-medium
                      text-[var(--text-secondary)]
                      hover:text-[var(--text-primary)] hover:underline
                      ${classeFoco}
                    `}
                  >
                    Voltar ao login
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>

      <ModalResultadoCadastro
        aberto={modal.aberto}
        tipo={modal.tipo}
        mensagem={modal.mensagem}
        dados={bibliotecarioCriado}
        onFechar={fecharModal}
      />
    </main>
  );
}
