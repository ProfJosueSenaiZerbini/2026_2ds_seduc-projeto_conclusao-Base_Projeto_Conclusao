"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { saveSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [codigoIdentificacao, setCodigoIdentificacao] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoIdentificacao,
          senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível fazer login.");
        return;
      }

      saveSession(data.usuario);

      if (data.usuario?.role === "bibliotecario") {
        router.push("/bibliotecario/home");
        return;
      }

      router.push("/frequentador/home");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[url('/images/backgroundBiblioteca.jpg')] bg-no-repeat bg-center bg-cover">
      <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl bg-[var(--color-background)] p-8 shadow-lg">
        <Image
          src="/images/logo_corujateca.png"
          alt="Corujateca: Logo do projeto."
          className="mb-8"
          width={170}
          height={170}
        />

        <form onSubmit={handleSubmit} className="flex w-full flex-col">
          <div className="mb-4 flex w-full flex-col gap-2">
            <label htmlFor="codigoIdentificacao" className="text-md font-medium text-gray-700">
              Código de Identificação:
            </label>

            <input
              id="codigoIdentificacao"
              name="codigoIdentificacao"
              type="number"
              value={codigoIdentificacao}
              onChange={(event) => setCodigoIdentificacao(event.target.value)}
              placeholder="Digite seu Código de Identificação"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
            />
          </div>

          <div className="mb-6 flex w-full flex-col gap-2">
            <label htmlFor="senha" className="text-md font-medium text-gray-700">
              Senha:
            </label>

            <input
              id="senha"
              name="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Digite sua Senha"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
            />
          </div>

          {erro && <p className="mb-4 text-center text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mb-6 w-full rounded-lg bg-[var(--color-brand-800)] px-4 py-3 font-medium text-white transition hover:bg-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-800)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <Link
          href="/cadastro"
          className="rounded px-4 py-2 text-[var(--color-brand-800)] underline transition duration-300 hover:text-[var(--brand-700)]"
        >
          Ainda não tem conta bibliotecário?
        </Link>

        <Link
          href="/cadastro/esqueceu-senha"
          className="rounded px-4 py-2 text-[var(--color-brand-800)] underline transition duration-300 hover:text-[var(--brand-700)]"
        >
          Esqueceu a senha?
        </Link>
      </div>
    </div>
  );
}
