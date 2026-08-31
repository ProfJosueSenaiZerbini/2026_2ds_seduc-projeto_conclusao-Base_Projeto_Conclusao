"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function Cadastro() {
    const [senhaUsuarioMaster, setSenhaUsuarioMaster] = useState("");
    const [nomeUsuario, setNomeUsuario] = useState("");
    const [senhaUsuario, setSenhaUsuario] = useState("");
    const [novoDdd, setNovoDdd] = useState("");
    const [novoTelefone, setNovoTelefone] = useState("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setErro("");
        setSucesso("");
        setCarregando(true);

        try {
            const response = await fetch("/api/bibliotecario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    senhaMaster: senhaUsuarioMaster,
                    nome: nomeUsuario,
                    senha: senhaUsuario,
                    ddd: novoDdd,
                    telefone: novoTelefone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErro(data.erro || "Erro ao cadastrar usuário.");
                return;
            }

            setSucesso("Usuário cadastrado com sucesso!");

            setSenhaUsuarioMaster("");
            setNomeUsuario("");
            setSenhaUsuario("");
            setNovoDdd("");
            setNovoTelefone("");
        } catch (error) {
            console.error(error);
            setErro("Não foi possível conectar ao servidor.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className='flex min-h-screen items-center justify-center bg-[url("/images/backgroundBiblioteca.jpg")] bg-no-repeat bg-center bg-cover'>
            <div className="flex flex-col w-full max-w-md rounded-2xl p-8 py-3 shadow-lg items-center justify-center bg-[var(--color-background)]">

                <Image
                    src="/images/logo_corujateca.png"
                    alt="Corujateca: Logo do projeto."
                    className="mb-4"
                    width={170}
                    height={170}
                />

                <form
                    onSubmit={handleSubmit}
                    className="flex w-full flex-col"
                >
                    <div className="flex w-full flex-col gap-1 mb-4">
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

                    <div className="flex w-full flex-col gap-1 mb-4">
                        <label
                            htmlFor="nomeUsuario"
                            className="text-md font-medium text-gray-700"
                        >
                            Nome do Usuário:
                        </label>

                        <input
                            id="nomeUsuario"
                            name="nomeUsuario"
                            type="text"
                            value={nomeUsuario}
                            onChange={(e) => setNomeUsuario(e.target.value)}
                            placeholder="Digite o nome do usuário"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1 mb-4">
                        <label
                            htmlFor="senhaUsuario"
                            className="text-md font-medium text-gray-700"
                        >
                            Senha do Usuário:
                        </label>

                        <input
                            id="senhaUsuario"
                            name="senhaUsuario"
                            type="password"
                            value={senhaUsuario}
                            onChange={(e) => setSenhaUsuario(e.target.value)}
                            placeholder="Digite a senha do usuário"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                    <div className="flex w-full gap-2 mb-6 justify-center items-center">

                        <label
                            className="text-md font-medium text-gray-700"
                        >
                            Telefone:
                        </label>
                        {/* DDD */}
                        <input
                            type="text"
                            value={novoDdd}
                            onChange={(e) =>
                                setNovoDdd(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 2)
                                )
                            }
                            placeholder="DDD"
                            maxLength={2}
                            className="w-20 bg-white border border-brand-400 rounded-xl p-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-button-primary"
                        />

                        {/* Número */}
                        <input
                            type="text"
                            value={novoTelefone}
                            onChange={(e) =>
                                setNovoTelefone(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 9)
                                )
                            }
                            placeholder="999999999"
                            maxLength={9}
                            className="flex-1 bg-white border border-brand-400 rounded-xl p-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-button-primary"
                        />
                    </div>

                    {erro && (
                        <p className="mb-4 text-center text-red-600">
                            {erro}
                        </p>
                    )}

                    {sucesso && (
                        <p className="mb-4 text-center text-green-600">
                            {sucesso}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={carregando}
                        className="w-full mb-3 rounded-lg bg-[var(--color-brand-800)] px-4 py-3 font-medium text-white transition cursor-pointer hover:bg-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-800)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {carregando ? "Cadastrando..." : "Cadastrar"}
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