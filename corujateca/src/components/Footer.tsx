export default function Footer() {
    const anoAtual = new Date().getFullYear();

    return (
        <footer className="
            w-full
            bg-[var(--brand-700)]
            text-gray-300
            py-4
        ">

            <div className="
                container
                mx-auto
                px-8
                flex
                flex-row
                justify-between
                items-start
                gap-8
                mb-6
            ">

                <div className="max-w-xs">
                    <h3 className="
                        text-[var(--brand-400)]
                        font-bold
                        text-lg
                        mb-3
                    ">
                        Corujateca
                    </h3>

                    <p className="
                        text-[var(--brand-200)]
                        font-medium
                        text-sm
                        leading-relaxed
                    ">
                        Tecnologia que apoia, simplifica
                        e valoriza as bibliotecas.
                    </p>
                </div>

                <div className="text-left">
                    <h3 className="
                        text-[var(--brand-400)]
                        font-bold
                        text-lg
                        mb-3
                    ">
                        Membros
                    </h3>

                    <div className="
                        grid
                        grid-cols-2
                        gap-x-12
                        gap-y-1
                        text-[var(--brand-200)]
                        text-sm
                    ">

                        <div className="flex flex-col gap-1">
                            <p>Maria Luiza</p>
                            <p>Stephanny Borrozzino</p>
                            <p>Rogério Malto</p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <p>Enzo Barbino</p>
                            <p>Alexandra Pereira</p>
                        </div>

                    </div>
                </div>

            </div>

            <div className="
                container
                mx-auto
                px-8
                text-sm
                text-[var(--brand-400)]
                mt-3
            ">
                &copy; {anoAtual} Corujateca.
                Todos os direitos reservados.
            </div>

        </footer>
    );
}
