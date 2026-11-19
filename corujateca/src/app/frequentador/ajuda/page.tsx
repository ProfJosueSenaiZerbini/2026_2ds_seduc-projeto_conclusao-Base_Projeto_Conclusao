"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Info } from "lucide-react";
import { getSession } from "@/lib/auth";

const perguntasFrequentes = [
  {
    pergunta: "Por que um livro que procuro não aparece no acervo?",
    resposta:
      "O livro provavelmente não foi cadastrado ou sofreu uma desativação por diferentes motivos. Para verificar se o livro realmente não consegue ser encontrado no Acervo, utilize o filtro presente na página e pesquise por ele. Caso realmente não o encontre, o livro possivelmente não existe ou está em manutenção. Para saber como lidar com isso, questione o seu bibliotecário.",
  },
  {
    pergunta: "Como sei quando preciso devolver um livro?",
    resposta:
      "Na aba “Empréstimos”, você pode consultar empréstimos em andamento e verificar a data de devolução de cada livro. A página também informa o título, autor, status e a data de início do empréstimo. Use os filtros para localizar empréstimos por datas específicas caso esse seja o seu desejo.",
  },
  {
    pergunta: "O que acontece caso eu não devolva um livro dentro do prazo?",
    resposta:
      "A devolução após o prazo gera uma multa que aumenta a partir do primeiro dia de atraso, correspondendo ao dobro de dias em que o livro permaneceu atrasado no sistema. Por exemplo, ao atrasar a devolução de um livro por uma semana (7 dias), quando devolvê-lo, sua multa resultará em uma penalidade de 14 dias, durante o qual não será possível realizar novos empréstimos. Se você acredita que recebeu uma multa injustamente, ou que ela foi aplicada indevidamente, contate o bibliotecário.",
  },
  {
    pergunta:
      "Posso consultar as informações de um livro mesmo quando ele não possui exemplares disponíveis?",
    resposta:
      "Sim! Basta escolher um livro na aba acervo e clicar. Após isso, as informações básicas, como título, autor, editora, gênero, sinopse e número de páginas estarão disponíveis, inclusive se há exemplares a disposição.",
  },
  {
    pergunta: "Por que estou impedido de realizar um empréstimo?",
    resposta:
      "Para um problema como esse, verifique qual situação você e sua conta se encaixam: Você provavelmente está com uma multa ativa, na qual te penaliza proibindo novos empréstimos por um certo período de tempo; ou você possui dois empréstimos em seu nome enquanto tenta realizar outro. No segundo caso, o próprio sistema barra o novo empréstimos por motivos de segurança. Para maiores consultas, verifique a aba Multas e filtre por 'Pendentes', ou verifique na aba Empréstimos quantos livros são exibidos no filtro 'Em andamento'. Caso nenhuma das situações listadas acima sane o seu problema, contate o bibliotecário.",
  },
  {
    pergunta: "Como posso encontrar informações básicas da minha conta?",
    resposta:
      "Você pode encontrar as informações da sua conta clicando na foto de perfil localizada no canto superior direito. Após isso, uma pequena janela com botões como 'Configurações Perfil' e 'Log out' aparecerão. Clique em 'Configurações Perfil' e cheque as suas informações! Caso deseje modificar seu nome ou telefone, peça para um bibliotecário efetuar as mudanças requeridas.",
  },
  {
    pergunta: "Posso devolver um livro antes da data de devolução prevista?",
    resposta:
      "Sim! Você pode devolver o livro antes da data prevista. Assim, ele fica disponível para outros leitores mais rapidamente e você evita possíveis multas por atraso.",
  },
  {
    pergunta: 'O que são os livros destacados na seção "Gênero da semana"?',
    resposta:
      "A seção “Gênero da semana” destaca os livros mais emprestados de um gênero sorteado aleatoriamente. O gênero é definido a cada domingo, e tem como objetivo apresentar aos usuários novas opções de leitura e incentivar a descoberta de diferentes tipos de literatura na biblioteca.",
  },
  {
    pergunta: "Por quantos dias eu posso pegar um livro emprestado?",
    resposta:
      "Um empréstimo tem três opções de prazo: 7 dias, 15 dias e 30 dias.",
  },
  {
    pergunta: "Como posso aumentar o meu tempo de empréstimo?",
    resposta:
      "Entre em contato com o bibliotecário e peça a ele um novo empréstimo.",
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
              className="text-2xl font-bold leading-tight min-[375px]:text-2xl sm:text-2xl md:text-3xl"
            >
              Perguntas frequentes
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] sm:mb-4 sm:text-base">
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
                        group flex min-h-14 w-full min-w-0 items-center
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
                contato com o bibliotecário da sua unidade.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
