import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function ConfiguracoesFrequent() {
    return(
        <>
             <div className="min-h-screen flex flex-col">
                <Header />

                <div className="flex flex-1">
                  <Nav />
            
                      <main className="
                        flex-1
                        min-w-0
                        p-6
                        flex flex-col items-center justify-center
                      ">
                        
                        <Image
                            src="/images/pfp.png"
                            alt="Coruja de perfil"
                            className='mb-8 rounded-full mt-8'
                            width={170}
                            height={170}
                        />
                        <p className="text-3xl mb-3">Luisa Castro</p>{/* trocar pelo nome do usuário*/}
                        <p className="text-2xl mb-8">Código de identificação: 123456457855</p>{/* trocar pelo código de identificação do usuário (id) */}

                      

                        <button className="cursor-pointer w-64 bg-button-secondary text-text-inverse font-medium py-3 mb-8 rounded-2xl hover:brightness-110 transition shadow-sm">
                        Excluir Conta
                        </button>

                      </main>
            
                    </div>
            
                  <Footer />
                </div>
        </>
    );
}