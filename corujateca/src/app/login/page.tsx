import Image from 'next/image';
import Link from "next/link";

export default function Login() {
    return(
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
                            htmlFor="codigoIdentificacao"
                            className="text-md font-medium text-gray-700"
                        >
                            Código de Identificação:
                        </label>

                        <input
                            id="codigoIdentificacao"
                            name="codigoIdentificacao"
                            type="number"
                            placeholder="Digite seu Código de Identificação"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                     <div className="flex w-full flex-col gap-2 mb-6">
                        <label
                            htmlFor="senha"
                            className="text-md font-medium text-gray-700"
                        >
                            Senha:
                        </label>

                        <input
                            id="senha"
                            name="senha"
                            type="password"
                            placeholder="Digite sua Senha"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-[var(--color-brand-800)] focus:ring-2"
                        />
                    </div>

                    <button
                    type="submit"
                    className="w-full mb-6 rounded-lg bg-[var(--color-brand-800)] px-4 py-3 font-medium text-white transition cursor-pointer hover:bg-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-800)] focus:ring-offset-2"
                    >
                    Entrar
                    </button>

                    <Link
                        href="/cadastro"
                        className="rounded px-4 py-2 underline text-[var(--color-brand-800)] hover:text-[var(--brand-700)] transition duration-300"
                    >
                        Ainda não tem conta bibliotecário?
                    </Link>

                    <Link
                        href="/cadastro/esqueceu-senha"
                        className="rounded px-4 py-2 underline text-[var(--color-brand-800)] hover:text-[var(--brand-700)] transition duration-300"
                    >
                        Esqueceu a senha?
                    </Link>
                </div>
            </div>
        </>
    );
}