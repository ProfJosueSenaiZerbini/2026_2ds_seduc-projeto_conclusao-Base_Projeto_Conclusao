export default function Footer() {
    const anoAtual = new Date().getFullYear();
      {/* MARIA: Se voce nao conseguir ajustar o seus tenta diminuir o meu footer*/}
    return (
        <footer className="fixed bottom-0 left-0 w-full bg-[var(--brand-700)] text-gray-300 py-4 z-50">

            {/*Parte de cima*/}
            <div className="container mx-auto px-8 flex flex-row justify-between items-start gap-8 mb-6">

                {/*  Sobre /Corujateca */}
                <div className="max-w-xs">
                    <h3 className="text-[var(--brand-400)] font-bold text-lg mb-3">Corujateca</h3>
                    <p className="text-[var(--brand-200)] font-medium text-sm leading-relaxed">
                        Habilitando novos interesses pela literatura
                    </p>
                </div>

                {/*  Membros  */}
                <div className="text-left">
                    {/* Título da seção */}
                    <h3 className="text-[var(--brand-400)] font-bold text-lg mb-3">Membros</h3>

                    {/* Duas colunas internas de nomes */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-[var(--brand-200)] text-sm">
                        {/*membros */}
                        <div className="flex flex-col gap-1">
                            <p>Maria Luiza</p>
                            <p>Stephanny Borrozzino</p>
                            <p>Rogério Malto</p>
                        </div>
                        {/* membro*/}
                        <div className="flex flex-col gap-1">
                            <p>Enzo Barbino</p>
                            <p>Alexandra Pereira</p>
                        </div>
                    </div>
                </div>

            </div>
                
            {/*O final do footer*/}
            <div className="container mx-auto px-8 text-sm text-[var(--brand-400)] mt-3">
                &copy; {anoAtual} Corujateca. Todos os direitos reservados.
            </div>
        </footer>
    );
}
