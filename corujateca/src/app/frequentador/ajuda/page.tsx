"use client";

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ArrowRight } from 'lucide-react';
import { getSession } from "@/lib/auth";


const perguntasFrequentes = [
    {
        pergunta: 'Por que um livro que eu procuro não aparece no acervo?',
        resposta: 'Provavelmente ele não foi cadastrado ou ele foi desativado. Para verificar se o livro está desativado, abra a ala acervo, clique em “Reativar Livro” e pesquise pelo livro, caso não encontre, ele possivelmente não existe.'
    },
    {
        pergunta: 'Como sei quando preciso devolver um livro?',
        resposta: 'Na aba “Empréstimos”, você pode consultar empréstimos em andamento e verificar a data de devolução de cada livro. A página também informa o título, autor, status e a data de início do empréstimo. Use os filtros para localizar empréstimos por datas específicas caso esse seja o seu desejo.'
    },
    {
        pergunta: 'O que acontece se eu não devolver um livro dentro do prazo?',
        resposta: 'A devolução após o prazo gera uma multa a partir do primeiro dia de atraso. O período da penalidade corresponde ao dobro dos dias em atraso, durante o qual não será possível realizar novos empréstimos.'
  },
  {
        pergunta: 'Posso consultar as informações de um livro mesmo quando não há exemplares disponíveis?',
        resposta: 'Sim! Basta escolher um livro na aba acervo e clicar. Após isso, as informações básicas, como título, autor, editora, gênero, sinopse e número de páginas estarão disponíveis, inclusive se há exemplares a disposição.'
    },
  {
        pergunta: 'Por que estou impedido de realizar um empréstimo?',
        resposta: 'Provavelmente você está com uma multa ativa. Uma multa ativa te penaliza proibindo de realizar um empréstimo. Para maiores consultas, verifique sua aba de multas e filtre pelas multas ativas.'
    },
  {
        pergunta: 'Como eu posso encontrar as informações da minha conta?',
        resposta: 'Você pode acessar as informações da sua conta pelas Configurações, disponíveis ao clicar na sua foto de perfil, no canto superior direito da tela. Nessa página, é possível consultar seus dados e alterar algumas informações pessoais.'
    },
  {
        pergunta: 'Posso devolver um livro antes da data prevista?',
        resposta: 'Sim! Você pode devolver o livro antes da data prevista. Assim, ele fica disponível para outros leitores mais rapidamente e você evita possíveis multas por atraso.'
    },
  {
        pergunta: 'O que são os livros destacados na seção "Gênero da semana"?',
        resposta: 'A seção “Gênero da semana” destaca os livros mais emprestados de um gênero sorteado aleatoriamente. O gênero é definido a cada domingo, e tem como objetivo apresentar aos usuários novas opções de leitura e incentivar a descoberta de diferentes tipos de literatura na biblioteca.'
    },
  {
        pergunta: 'Por quantos dias eu posso pegar um livro emprestado?',
        resposta: 'Um empréstimo tem três opções de prazo: 7 dias, 15 dias e 30 dias.'
    },
  {
        pergunta: 'Como posso aumentar o meu tempo de empréstimo?',
        resposta: 'Entre em contato com o bibliotecário e peça a ele um novo empréstimo.'
    },
];

export default function AjudaFreq() {
    const [nomeUsuario, setNomeUsuario] = useState("Visitante");
    const [indexAberto, setIndexAberto] = useState<number | null>(null);

    useEffect(() => {
        const session = getSession();
        if (session?.nome) {
            setNomeUsuario(session.nome);
        }
    }, []);

    const alternarPergunta = (id: number) => {
        if (indexAberto === id) {
            setIndexAberto(null);
        } else {
            setIndexAberto(id);
        }
    };
    /*Parte da Maria */
    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Header />

                <div className="flex flex-1">
                  <Nav />

                    <main className="
                        flex-1
                        min-w-0
                        p-6
                    ">


                        {/* 🖥️ Mudamos de min-h-screen comum para uma estrutura flexível que joga o footer para baixo */}
                        <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-brand-800)] antialiased font-sans">


                            {/* Seção de Categorias - Adicionado flex-grow para empurrar o rodapé */}
                            <div className="flex-grow max-w-5xl w-full mx-auto px-4 py-12">
                                <section className="mb-6">
                                    <p className="text-base sm:text-lg text-[var(--color-text-primary)]">
                                    Olá,{" "}
                                    <strong className="font-bold">
                                        {nomeUsuario}
                                    </strong>
                                    </p>
                                </section>
                                
                                <h3 className="text-xl md:text-2xl font-bold mb-6 text-[var(--color-text-primary)]">
                                    Perguntas Frequentes
                                </h3>

                               
                             
                {/* 🛠️ AQUI: O flex-col junta a lista inteira, e o index funciona sem BO dentro do .map */}
               <div className="flex flex-col gap-4">
                  {perguntasFrequentes.map((item, index)  => {
                    const estaAberto = indexAberto === index;
                    
                    return (
                      <div 
                        key={index}
                        className="bg-[var(--color-brand-300)] border border-[var(--color-brand-400)] rounded-xl overflow-hidden shadow-sm transition-all duration-300 w-full"
                      >
                        {/* Botão com a Pergunta */}
                        <button
                          onClick={() => alternarPergunta(index)}
                          className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-brand-400)] text-left transition-all group"
                        >
                          <span className="text-[var(--color-brand-600)] group-hover:text-[var(--color-brand-800)] font-medium text-sm md:text-base pr-4">
                            {item.pergunta}
                          </span>
                          <ArrowRight 
                            className={`h-4 w-4 text-[var(--color-brand-500)] group-hover:text-[var(--color-brand-700)] transition-transform duration-300 flex-shrink-0 ${
                              estaAberto ? 'rotate-90 text-[var(--color-brand-700)]' : ''
                            }`} 
                          />
                        </button>

                        {/* Resposta curta que aparece ao clicar */}
                        {estaAberto && (
                          <div className="px-4 pt-3 pb-4 pt-1 text-sm md:text-base text-[var(--color-brand-800)] border-t border-[var(--color-brand-400)] bg-[var(--color-background)]">
                            <p className="leading-relaxed font-normal">
                              {item.resposta}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
              </div>
            </div>
          </main>
        </div>
    
        <Footer />
      </div>
    </>
  );
}
