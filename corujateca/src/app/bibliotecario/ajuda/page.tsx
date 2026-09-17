"use client";

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ArrowRight } from 'lucide-react';
import { getSession } from "@/lib/auth";


const perguntasFrequentes = [
    {
        pergunta: 'O que faço quando o ISBN não encontra o livro?',
        resposta: 'Provavelmente o livro não está disponível na ISBN ou ocorreu um erro de digitação do título. Você pode digitar as informações do livro manualmente ao cadastrar um novo livro.'
    },
    {
        pergunta: 'Como adiciono um novo exemplar de um livro que já está cadastrado?',
        resposta: 'Abra a aba acervo, clique no botão “Novo Exemplar”, preencha com as informações e clique em salvar.'
    },
    {
        pergunta: 'Qual é a diferença entre cadastrar um livro e cadastrar um exemplar?',
        resposta: 'Cadastrar um livro significa adicionar uma nova obra ao sistema. Já cadastrar um exemplar significa adicionar uma nova cópia física de uma obra que já está cadastrada. Assim, se a biblioteca possui vários exemplares de um mesmo livro, cada um pode ser emprestado individualmente.'
  },
  {
        pergunta: 'Como altero as informações de um livro já cadastrado?',
        resposta: 'Abra a aba acervo, procure pelo livro desejado e clique nele. Em seguida, na página do livro, pressione o botão atualizar. Altere as informações desejadas e clique em salvar.'
    },
  {
        pergunta: 'O que acontece com os exemplares quando um livro é desativado?',
        resposta: 'Os exemplares de um livro desativado também ficam desativados. Além disso, ao reativar o livro os seus exemplares também serão reativados.'
    },
  {
        pergunta: 'O que devo fazer quando a capa ou outras informações preenchidas estão incorretas?',
        resposta: 'Você pode atualizar o livro. Entre na aba acervo e escolha o livro com as informações incorretas. Após isso, clique em “atualizar livro”, apague e reescreva as informações incorretas.'
    },
  {
        pergunta: 'Como reativo um livro que foi desativado?',
        resposta: 'Abra a aba acervo e clique no botão “Reativar Livro”, assim o livro e suas cópias serão reativadas.'
    },
  {
        pergunta: 'Como bibliotecário posso cancelar uma multa?',
        resposta: 'Sim! Abra a aba de multas, procure a multa desejada e clique em cancelar.'
    },
  {
        pergunta: 'Por que um livro pode estar cadastrado sem nenhum exemplar disponível?',
        resposta: 'O cadastro de um livro representa a obra, independentemente de haver exemplares disponíveis para empréstimo. A biblioteca pode cadastrar uma obra antes que suas cópias estejam disponíveis para circulação, como no caso de livros recém-chegados ao acervo. Assim, o livro pode permanecer cadastrado mesmo quando não há nenhum exemplar disponível.'
    },
  {
        pergunta: 'O que faço quando um livro emprestado foi extraviado?',
        resposta: 'Em caso de extravio, o sistema aplica uma penalidade mínima de 30 dias, durante a qual o frequentador não poderá realizar novos empréstimos. O bibliotecário deve comunicar a gerência ou coordenação do estabelecimento para avaliar as medidas cabíveis e uma possível compensação pela perda da obra.'
    },

];

export default function AjudaBibli() {
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
