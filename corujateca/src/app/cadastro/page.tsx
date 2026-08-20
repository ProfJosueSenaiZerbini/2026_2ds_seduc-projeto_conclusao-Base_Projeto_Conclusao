import Image from 'next/image';
import Link from "next/link";

export default function Cadastro() {
    return (
         <>
            <div className='flex min-h-screen items-center justify-center bg-[url("/images/backgroundBiblioteca.jpg")] bg-no-repeat bg-center bg-cover'>
                <div className='flex flex-col w-full max-w-md rounded-2xl p-8 shadow-lg items-center justify-center bg-[var(--color-background)]'>
                    <Image
                        src="/images/logo_corujateca.png"
                        alt="Corujateca:Logo do projeto."
                        className='mb-8'
                        width={170}
                        height={170}
                    />

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
                            placeholder="Digite a senha do usuário master"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-2 mb-4">
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
                            placeholder="Digite o nome do usuário"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                     <div className="flex w-full flex-col gap-2 mb-6">
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
                            placeholder="Digite a senha do usuário"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                    <button
                    type="submit"
                    className="w-full mb-3 rounded-lg bg-[var(--color-brand-800)] px-4 py-3 font-medium text-white transition cursor-pointer hover:bg-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-800)] focus:ring-offset-2"
                    >
                    Cadastrar
                    </button>

                    <Link
                        href="/login"
                        className="rounded px-4 py-2 underline text-[var(--color-brand-800)] hover:text-[var(--brand-700)] transition duration-300"
                    >
                        Voltar
                    </Link>
                </div>
            </div>
        </>
    );
}