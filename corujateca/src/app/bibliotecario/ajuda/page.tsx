"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Info } from "lucide-react";
import { getSession } from "@/lib/auth";

const perguntasFrequentes = [
  {
    pergunta:
      "O que fazer quando o ISBN não encontra o livro ao tentar cadastrá-lo?",
    resposta:
      "O livro provavelmente não está disponível na ISBN inserida ou ocorreu um erro de digitação no momento da inserção dos números desse código. Tente inserir o ISBN novamente com cuidado, ou digite manualmente as informações do livro para catalogá-lo no Acervo.",
  },
  {
    pergunta:
      "Como posso adicionar um novo exemplar de um livro que já foi cadastrado?",
    resposta:
      "Para adicionar novos exemplares a um livro que já foi cadastrado no Acervo, siga os passos: Abra a aba Acervo, pesquise pelo livro que desejar adicionar um exemplar e acesse a obra clicando em sua capa. Com a página das informações específicas da obra aberta, procure pelo botão 'Cadastrar Nova Cópia'. A partir dai, uma nova tela será aberta com as informações necessárias para registrar um novo exemplar. Então, com isso em mente, preencha os dados de acordo com a sua necessidade e clique em 'Cadastrar Cópias' para efetuar a catalogação.",
  },
  {
    pergunta:
      "Qual é a diferença entre 'cadastrar um livro' e 'cadastrar um exemplar'?",
    resposta:
      "'Cadastrar um livro' significa adicionar uma nova obra ao sistema, enquanto 'cadastrar um exemplar' significa adicionar uma nova cópia física de uma obra que já está catalogada na biblioteca. Assim, se a biblioteca possui vários exemplares de um mesmo livro, cada um pode ser emprestado individualmente.",
  },
  {
    pergunta: "Como altero as informações de um livro já cadastrado?",
    resposta:
      "Para alterar as informações de um livro que já foi cadastrado, siga os passos: Abra a aba Acervo, pesquise pelo livro que desejar editar e acesse a obra clicando em sua capa. Na página de informações específicas do livro, procure pelo botão 'Atualizar Livro'. Uma janela irá se abrir contendo informações como título, nome do autor, gênero, editora, ano de publicação da edição, localização nas prateleiras da biblioteca, a imagem da capa e a sinopse da obra. Quando terminar as edições nos campos desejados, clique em 'Salvar Alterações'.",
  },
  {
    pergunta: "O que acontece com os exemplares quando um livro é desativado?",
    resposta:
      "Ao interagir com a disponibilidade de um livro, os exemplares dessa obra apresentarão um comportamento similar. Portanto, se você desativar um livro com exemplares catalogados, esses exemplares também serão desativados. Igualmente, se um livro com status de desativado for reativado, as suas cópias serão reativadas em conjunto.",
  },
  {
    pergunta:
      "O que devo fazer quando a capa ou outras informações preenchidas estão incorretas?",
    resposta:
      "Quando a catalogação de um livro a partir da ISBN apresenta informações incorretas, você pode atualizar os dados problemáticos ao clicar no botão “Atualizar Livro” presente na página das informações específicas de uma obra (que é aberta ao clicar em sua capa na aba Acervo). Seguidos os passos, localize o campo incorreto e o corrija antes de apertar em 'Salvar Alterações'.",
  },
  {
    pergunta: "Como reativo um livro que foi desativado?",
    resposta:
      "Para reativar/desativar uma obra, siga os passos: Abra a aba Acervo, encontre o botão 'Reativar livro' e espere as informações da nova tela carregarem. Nessa tela, encontre o livro desativado, selecione essa obra e aperte em 'Reativar livro'. Igualmente, para desativar um livro, volte para a aba Acervo, encontre a obra que deseja desativar e clique em sua capa, abrindo a tela de informações específicas do mesmo. Com a tela aberta, encontre o botão 'Excluir livro' e confirme a ação.",
  },
  {
    pergunta: "Como bibliotecário, posso cancelar uma multa?",
    resposta:
      "Sim. Abra a aba Multas, procure a multa que deseja fazer tal ação e clique no botão 'Cancelar'. Tenha em mente que isso deve ser feito apenas em situações de extrema necessidade ou uso incorreto da aplicação das multas, fornecendo uma explicação clara e sensata do motivo do cancelamento.",
  },
  {
    pergunta:
      "Por que um livro pode estar cadastrado sem nenhum exemplar disponível?",
    resposta:
      "O cadastro de um livro representa a obra, independentemente de haver exemplares disponíveis para empréstimo. A biblioteca pode cadastrar uma obra antes que suas cópias estejam disponíveis para circulação, como no caso de livros recém-chegados ao acervo. Assim, o livro pode permanecer cadastrado mesmo quando não há nenhum exemplar disponível.",
  },
  {
    pergunta: "O que faço quando um livro emprestado foi extraviado?",
    resposta:
      "Em caso de perda de livros, você precisa aplicar uma multa de extravio no sistema, na qual possui uma penalidade mínima de 30 dias em que o frequentador não poderá realizar novos empréstimos. Para aplicar essa multa, siga os passos: Abra a aba Multas, localize e aperte o botão 'Cadastrar Nova Multa', insira as informações necessárias para a catalogação da multa no sistema e aperte no botão 'Cadastrar multa'. Com o registro da situação na aplicação, o histórico é salvo. Dessa forma, o bibliotecário deve comunicar a gerência ou a coordenação do estabelecimento para avaliar as medidas cabíveis no cenário, assim como uma possível compensação pela perda do patrimônio.",
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
    setIndexAberto((atual) => (atual === id ? null : id));
  };

  const classeCartao =
    "w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors";

  return (
    <main className="min-w-0 flex-1 bg-[var(--app-background)] px-3 py-5 text-[var(--text-primary)] min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-5xl">

        <section aria-labelledby="titulo-perguntas" className="min-w-0">
          <div className="mb-5 sm:mb-6">
            <h1
              id="titulo-perguntas"
              className="text-xl font-bold leading-tight min-[375px]:text-2xl sm:text-2xl md:text-3xl"
            >
              Perguntas frequentes
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Selecione uma pergunta para consultar a resposta.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            {perguntasFrequentes.map((item, index) => {
              const estaAberto = indexAberto === index;
              const idPergunta = `pergunta-ajuda-${index}`;
              const idResposta = `resposta-ajuda-${index}`;

              return (
                <article key={index} className={classeCartao}>
                  <h2 className="min-w-0">
                    <button
                      id={idPergunta}
                      type="button"
                      aria-expanded={estaAberto}
                      aria-controls={idResposta}
                      onClick={() => alternarPergunta(index)}
                      className="
                        hover:cursor-pointer group flex min-h-14 w-full min-w-0 items-center
                        gap-2.5 px-3 py-3.5 text-left transition-colors
                        hover:bg-[var(--surface-hover)]
                        focus-visible:outline-2 focus-visible:outline-offset-[-3px]
                        focus-visible:outline-[var(--focus-ring)]
                        min-[375px]:gap-3 min-[375px]:px-4
                        sm:min-h-16 sm:gap-3 sm:px-5 sm:py-4
                      "
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-[var(--text-primary)] min-[375px]:h-8 min-[375px]:w-8 min-[375px]:text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-relaxed text-[var(--text-primary)] min-[375px]:text-sm sm:text-base">
                        {item.pergunta}
                      </span>

                      <ArrowDown
                        size={18}
                        aria-hidden="true"
                        className={`
                          shrink-0 text-[var(--text-muted)]
                          transition-transform duration-200
                          group-hover:text-[var(--text-primary)]
                          sm:h-5 sm:w-5
                          ${estaAberto ? "rotate-180" : ""}
                        `}
                      />
                    </button>
                  </h2>

                  {estaAberto && (
                    <div
                      id={idResposta}
                      role="region"
                      aria-labelledby={idPergunta}
                      className="min-w-0 border-t border-[var(--border-default)] px-3 py-4 min-[375px]:px-4 sm:px-5 sm:py-5"
                    >
                      <p className="break-words text-sm leading-6 text-[var(--text-secondary)] min-[375px]:leading-7 sm:pl-11 sm:text-base">
                        {item.resposta}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--brand-400)] p-4 min-[375px]:p-5 sm:mt-8 sm:p-6">
          <div className="flex min-w-0 items-start gap-2.5 min-[375px]:gap-3 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center min-[375px]:h-10 min-[375px]:w-10">
              <Info
                size={21}
                className="text-[var(--text-inverse)]"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-sm font-bold text-[var(--text-inverse)] min-[375px]:text-base">
                Ainda precisa de ajuda?
              </h2>

              <p className="mt-1 break-words text-sm leading-relaxed text-[var(--text-inverse)]">
                Se sua dúvida não estiver entre as perguntas acima, entre em
                contato com a gerência ou a coordenação da biblioteca.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
