"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function EsqueceuSenha() {
  const [senhaUsuarioMaster, setSenhaUsuarioMaster] = useState("");
  const [codigoIdentificacaoUsuario, setCodigoIdentificacaoUsuario] = useState("");
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      // APONTANDO PARA /api/esqueci-senha
      const response = await fetch("/api/esqueci-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senhaMaster: senhaUsuarioMaster,
          codigoIdentificacaoUsuario: codigoIdentificacaoUsuario,
          novaSenhaUsuario: novaSenhaUsuario,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Servidor respondeu com erro (${response.status})`);
      }

      if (!response.ok) {
        setErro(data.erro || "Erro ao redefinir a senha.");
        return;
      }

      setSucesso("Senha redefinida com sucesso!");
      setSenhaUsuarioMaster("");
      setCodigoIdentificacaoUsuario("");
      setNovaSenhaUsuario("");
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[url("/images/backgroundBiblioteca.jpg")] bg-no-repeat bg-center bg-cover'>
      <div className="flex flex-col w-full max-w-md rounded-2xl p-8 shadow-lg items-center justify-center bg-[var(--color-background)]">
        <Image
          src="/images/logo_corujateca.png"
          alt="Corujateca: Logo do projeto."
          className="mb-8"
          width={170}
          height={170}
        />

        <form onSubmit={handleSubmit} className="flex w-full flex-col">
          <div className="flex w-full flex-col gap-2 mb-4">
            <label
              htmlFor="senhaUsuarioMaster"
              className="text-md font-medium text-gray-700"
            >
              Senha do Usuário Master:
            </label>

            <input
              id="senhaUsuarioMaster"
              name="senhaUsuarioMaster"
              type="password"
              value={senhaUsuarioMaster}
              onChange={(e) => setSenhaUsuarioMaster(e.target.value)}
              placeholder="Digite a senha do usuário master"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
            />
          </div>

          <div className="flex w-full flex-col gap-2 mb-4">
            <label
              htmlFor="codigoIdentificacaoUsuario"
              className="text-md font-medium text-gray-700"
            >
              Código de Identificação do Usuário:
            </label>

            <input
              id="codigoIdentificacaoUsuario"
              name="codigoIdentificacaoUsuario"
              type="number"
              value={codigoIdentificacaoUsuario}
              onChange={(e) => setCodigoIdentificacaoUsuario(e.target.value)}
              placeholder="Digite o código de identificação do usuário"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
            />
          </div>

          <div className="flex w-full flex-col gap-2 mb-6">
            <label
              htmlFor="novaSenhaUsuario"
              className="text-md font-medium text-gray-700"
            >
              Nova Senha do Usuário:
            </label>

            <input
              id="novaSenhaUsuario"
              name="novaSenhaUsuario"
              type="password"
              value={novaSenhaUsuario}
              onChange={(e) => setNovaSenhaUsuario(e.target.value)}
              placeholder="Digite a nova senha do usuário"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
            />
          </div>

          {erro && (
            <p className="mb-4 text-center text-red-600 text-sm font-medium">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="mb-4 text-center text-green-600 text-sm font-medium">
              {sucesso}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full mb-3 rounded-lg bg-[var(--color-brand-800)] px-4 py-3 font-medium text-white transition cursor-pointer hover:bg-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-800)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? "Processando..." : "Recuperar Conta"}
          </button>

          <Link
            href="/login"
            className="rounded px-4 py-2 text-center underline text-[var(--color-brand-800)] hover:text-[var(--brand-700)] transition duration-300"
          >
            Voltar
          </Link>
        </form>
      </div>
    </div>
  );
}