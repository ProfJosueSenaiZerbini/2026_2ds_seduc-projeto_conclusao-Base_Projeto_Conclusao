# Casos de teste do iBico

Todos os valores financeiros são **simulados** (não existe pagamento real).

**Execução de referência:** 17/11/2026, Firefox (Playwright) + `node --test`, banco local `db_bico` (MariaDB 10.11).
- Testes unitários (`npm run test:unit`): 78 de 78 aprovados (15 de idade/cadastro/perfil + 17 do cancelamento de bico + 25 da avaliação + 5 do selo de avaliação + 13 da reputação + 3 do "Membro recente"), em `tests/unit/`.
- Testes E2E (`npm test`): 88 de 88 aprovados, em `tests/e2e/` (inclui 5 da avaliação bidirecional, 7 do fluxo por cliques, 9 dos mascotes e 11 da reputação e dos textos fictícios).
- A suíte completa (`npm run test:unit` e `npm test`) foi executada em 17/11/2026 às 14:00, 14:01, 14:11, 15:37, 15:40, 16:00, 16:02, 17:56, 17:58, 18:07, 18:20, 19:08, 19:11 e 19:16. A execução de referência é a de **19:16** (unitários 78/78 e E2E 88/88); as de 19:11 e 19:16 passaram inteiras e a de 19:08 teve 87/88, com uma falha intermitente do Firefox (timeout no teste de idades do cadastro, que passou 3 de 3 ao repetir). Desde as 18:20 a suíte E2E roda contra a porta 3001, porque a 3000 fica ocupada por outro servidor. Em execuções intermediárias anteriores houve falhas já corrigidas (ajuste pendente nos testes depois da remoção de e-mail e idade da lista de candidatos, mais travamentos gráficos do Firefox, e testes ainda procurando o balão antigo dos avisos de erro). O Playwright usa 2 workers.
- Cada teste cria as próprias contas e bicos (e-mails e títulos únicos) pelas rotas reais da aplicação e não depende de dados prévios. Os helpers ficam em `tests/e2e/support/cenario.js`. Só o CT10 consulta o banco (somente leitura), para conferir o evento de finalização, que nenhuma tela exibe.

**Legenda de status**
- **Aprovado:** coberto por teste automatizado que passou, conferindo o resultado esperado.

| Caso | Cobertura (arquivo › teste) | Status |
|---|---|---|
| CT01 | `auth/fluxo-login-cadastro.spec.js` › cadastro e login como Contratante / como Trabalhador | Aprovado |
| CT02 | `auth/roteiro-cadastro-login.spec.js` › CT02 (CPF inválido pela tela; sem maioridade no navegador; servidor recusa CPF, idade 17/91 e sem maioridade; limites 18 e 90); `auth/fluxo-login-cadastro.spec.js` › campos vazios, e-mail inválido, idades; `tests/unit/idade.unit.js` | Aprovado |
| CT03 | `auth/roteiro-cadastro-login.spec.js` › CT03 (senha errada; e-mail inexistente e perfil trocado; rotas internas sem login; logout); login válido em `auth/fluxo-login-cadastro.spec.js` | Aprovado |
| CT04 | `roteiro/permissoes-perfil.spec.js` › CT04 (4 testes) | Aprovado |
| CT05 | `roteiro/bicos-e-carteira.spec.js` › CT05 (bico válido pela tela; 7 casos inválidos; erro na tela) | Aprovado |
| CT06 | `roteiro/bicos-e-carteira.spec.js` › CT06 (saldo e extrato; valores inválidos) | Aprovado |
| CT07 | `roteiro/candidaturas.spec.js` › CT07 (candidatura Pendente e duplicada; contratante não se candidata) | Aprovado |
| CT08 | `roteiro/candidaturas.spec.js` › CT08 (reserva, extrato, Em andamento, demais Recusadas) | Aprovado |
| CT09 | `roteiro/candidaturas.spec.js` › CT09 (saldo insuficiente, nada muda) | Aprovado |
| CT10 | `roteiro/finalizacao-chat-avaliacao.spec.js` › CT10 (finalização e pagamento; bloqueios) | Aprovado |
| CT11 | `roteiro/candidaturas.spec.js` › CT11 (cancelar Pendente pela tela; Aceita recusada) | Aprovado |
| CT12 | `roteiro/finalizacao-chat-avaliacao.spec.js` › CT12 (troca de mensagens e bloqueio de terceiros) | Aprovado |
| CT13 – Avaliação pelo contratante | `roteiro/finalizacao-chat-avaliacao.spec.js` › CT13 (média no perfil público; avaliações recusadas); `tests/unit/avaliacao.unit.js` | Aprovado |
| CT14 | `contratante/cancelamento-bico.spec.js` + `tests/unit/cancelamento.unit.js` | Aprovado |
| CT15 | `contratante/cancelamento-bico.spec.js` + `tests/unit/cancelamento.unit.js` | Aprovado |
| CT16 | `contratante/cancelamento-bico.spec.js` + `tests/unit/cancelamento.unit.js` | Aprovado |
| CT17 – Avaliação pelo trabalhador | `roteiro/avaliacao-bidirecional.spec.js` › "o trabalhador avalia o contratante e o contratante vê a nota no perfil público"; `roteiro/finalizacao-chat-avaliacao.spec.js` › CT13 recusada (usuário de fora, 403); `tests/unit/avaliacao.unit.js` | Aprovado |
| CT18 – Prazo e edição da avaliação | `roteiro/avaliacao-bidirecional.spec.js` › "formulário volta preenchido…" e "depois de 7 dias da finalização…"; `tests/unit/avaliacao.unit.js` › "avaliação: edição e prazo de 7 dias" | Aprovado |
| CT19 – Reputação e privacidade | `roteiro/avaliacao-bidirecional.spec.js` › "candidato mostra média e link do perfil; feed e detalhes…", "o trabalhador avalia o contratante…" (perfis públicos sem e-mail, CPF, idade e saldo) e "Aguardando sua avaliação…" | Aprovado |
| CT20 – Caminho até a avaliação | `roteiro/fluxo-por-cliques.spec.js` › "publicar → candidatar → aceitar → finalizar → avaliar (os dois lados), só clicando", "o histórico do trabalhador mostra o selo e abre a aba pela URL", "Ativos, Concluídos e Cancelados mostram os bicos certos" e "Selo "Prazo encerrado""; `tests/unit/selo-avaliacao.unit.js` | Aprovado |
| CT21 – Saldo e alertas | `roteiro/fluxo-por-cliques.spec.js` › "Saldo do menu lateral" (adicionar, reservar, estornar), "Aceitar sem saldo: alerta estilizado" (2 testes); `roteiro/candidaturas.spec.js` › CT09 | Aprovado |
| CT22 – Mascotes e movimento reduzido | `home/mascotes.spec.js` (9 testes: imagens, seletor de perfil na landing, login e cadastro, alertas, dica, movimento reduzido); alerta triste em `roteiro/fluxo-por-cliques.spec.js` | Aprovado |
| CT23 – Reputação no perfil público | `roteiro/perfil-reputacao.spec.js` › "Perfil público: reputação" (5 testes), "Onde a decisão acontece" e "Identidade visual do perfil público"; `tests/unit/reputacao.unit.js` (13 testes); `tests/unit/perfil.unit.js` (3 testes) | Aprovado |
| CT24 – Sem indicadores fictícios | `roteiro/perfil-reputacao.spec.js` › "Sem indicadores fictícios" (2 testes) e "Textos fictícios removidos" (2 testes); `tests/unit/perfil.unit.js` (Membro recente calculado) | Aprovado |

---

## CT01 – Cadastro válido (contratante e trabalhador)
**Procedimento:** abrir `/cadastrar`, escolher o perfil, preencher nome, e-mail, CPF, idade (18 a 90), senha e confirmação, marcar os termos e a confirmação de maioridade, enviar.
**Resultado esperado:** redireciona para `/login`; o login com a conta nova leva a `/homeContratante` (contratante) ou `/hometrabalhador` (trabalhador).
**Status:** Aprovado. Testes E2E "cadastro e o login com sucesso como Contratante" e "como Trabalhador".

## CT02 – Cadastro inválido
**Procedimento:** enviar `/cadastrar` com (a) campos vazios; (b) e-mail inválido; (c) CPF inválido; (d) sem marcar "Confirmo que possuo 18 anos ou mais"; (e) idade 17 ou 91.
**Resultado esperado:** o cadastro não é feito. O navegador bloqueia campos vazios e e-mail malformado (a página continua em `/cadastrar`). O servidor responde 400 com mensagem: "Digite um CPF válido.", "É necessário confirmar que possui 18 anos ou mais." ou "Informe uma idade válida, entre 18 e 90 anos."
**Status:** Aprovado. E2E em `auth/roteiro-cadastro-login.spec.js`: "CPF inválido é recusado com mensagem, pela tela" (mensagem "Digite um CPF válido." e conta não criada); "o navegador impede o envio sem marcar a confirmação de maioridade"; "o servidor recusa (400, com mensagem) CPF inválido, idade fora de 18–90 e sem maioridade" (idades 17 e 91); "idades 18 e 90 (limites) são aceitas". Campos vazios e e-mail inválido em `auth/fluxo-login-cadastro.spec.js`; idade também nos testes unitários.

## CT03 – Login válido/inválido e rota interna sem login
**Procedimento:** (a) entrar com e-mail e senha corretos; (b) entrar com e-mail não cadastrado, senha incorreta ou perfil trocado; (c) acessar `/homeContratante` sem estar logado.
**Resultado esperado:** (a) vai para a home do perfil; (b) permanece em `/login` com mensagem ("E-mail não cadastrado!", "Senha incorreta!" ou "Sua conta está cadastrada como …"); (c) redireciona para `/login`.
**Status:** Aprovado. E2E em `auth/roteiro-cadastro-login.spec.js`: senha errada ("Senha incorreta!", permanece em `/login`); e-mail não cadastrado e perfil trocado; rotas internas sem login redirecionam (302) para `/login`; após o logout a rota interna volta a redirecionar. Login válido nos E2E de cadastro e login.

## CT04 – Acesso a rota de outro perfil
**Procedimento:** logado como trabalhador, abrir `/homeContratante`, `/bicos/novo` e `/carteira/contratante`; logado como contratante, abrir `/hometrabalhador` e `/carteira/trabalhador`.
**Resultado esperado:** HTTP 403 com o texto "Acesso negado para o perfil desta conta." (middleware `requireRole`).
**Status:** Aprovado. E2E em `roteiro/permissoes-perfil.spec.js`: trabalhador recebe 403 em `/homeContratante`, `/bicos/novo`, `/bicos/ativos` e `/carteira/contratante`; contratante recebe 403 em `/hometrabalhador`, `/historico` e `/carteira/trabalhador`; cada perfil acessa as próprias rotas.

## CT05 – Publicar bico válido e inválido
**Procedimento:** como contratante, abrir `/bicos/novo` e enviar (a) todos os campos válidos; (b) título com menos de 3 caracteres, descrição com menos de 10, bairro com menos de 2, sem data, sem horário ou valor ≤ 0.
**Resultado esperado:** (a) redireciona para `/homeContratante` e o bico aparece como Aberto; (b) HTTP 400 com a mensagem do campo (ex.: "O título deve ter entre 3 e 100 caracteres.").
**Status:** Aprovado. E2E em `roteiro/bicos-e-carteira.spec.js`: o bico publicado pela tela aparece em Bicos ativos como Aberto com bairro, data, horário e valor corretos; título curto, descrição curta, bairro curto, sem data, horário inválido, valor 0 e valor negativo respondem 400 com a mensagem do campo e nenhum bico é criado.

## CT06 – Adicionar saldo simulado
**Procedimento:** como contratante, em `/carteira/contratante`, informar um valor (ex.: 150,00) e clicar em "Adicionar Saldo".
**Resultado esperado:** redireciona para `/carteira/contratante`; o saldo aumenta no valor informado e surge uma movimentação `ADICAO`. Valor vazio, inválido ou ≤ 0 responde 400.
**Status:** Aprovado. E2E em `roteiro/bicos-e-carteira.spec.js`: o saldo exibido sobe exatamente o valor adicionado (0 → R$ 150,00; depois soma 49,90) e o extrato mostra "Adição de saldo simulado" como Entrada; valor vazio, texto, zero, negativo e com 3 casas decimais respondem 400 sem alterar o saldo.

## CT07 – Candidatura e candidatura duplicada
**Procedimento:** como trabalhador, candidatar-se a um bico Aberto (`POST /bicos/candidatar`); repetir a candidatura ao mesmo bico.
**Resultado esperado:** a primeira cria a candidatura Pendente e redireciona para `/hometrabalhador`; a segunda responde 400 "Você já se candidatou a este bico!" (restrição única `bico_id` + `trabalhador_id`).
**Status:** Aprovado. E2E em `roteiro/candidaturas.spec.js`: a candidatura aparece como Pendente para o trabalhador (página do bico e aba Pendentes) e para o contratante (lista de candidatos); a segunda responde 400 "Você já se candidatou a este bico!" e continua havendo uma só candidatura; contratante não consegue se candidatar (403).

## CT08 – Aceitar candidato com saldo suficiente
**Procedimento:** como contratante, com saldo ≥ valor do bico, aceitar uma candidatura em `/bicos/:id/gerenciar`.
**Resultado esperado:** o valor é descontado do saldo; é registrada uma movimentação `RESERVA`; o bico passa a "Em andamento" com o trabalhador vinculado; a candidatura vira "Aceito" e as demais candidaturas do bico viram "Recusado".
**Status:** Aprovado. E2E em `roteiro/candidaturas.spec.js`: com 2 candidatos e saldo suficiente, o saldo cai exatamente R$ 150,00, o extrato mostra "Reserva – <título>" (Saída, "- R$ 150,00"), o bico fica Em andamento, o candidato aceito fica Aceito e o outro, Recusado.

## CT09 – Aceitar candidato sem saldo
**Procedimento:** como contratante com saldo menor que o valor do bico, tentar aceitar uma candidatura.
**Resultado esperado:** HTTP 400 "Saldo insuficiente. Adicione saldo à sua carteira para aceitar este trabalhador."; nada é alterado (transação desfeita).
**Status:** Aprovado. E2E em `roteiro/candidaturas.spec.js`: com saldo R$ 100,00 e bico de R$ 150,00 a resposta é 400 com a mensagem de saldo insuficiente; saldo, status do bico (Aberto), candidaturas (Pendente) e extrato (sem reserva) não mudam.

## CT10 – Finalizar bico
**Procedimento:** como contratante dono de um bico "Em andamento", `POST /bicos/:id/finalizar`.
**Resultado esperado:** o bico passa a "Finalizado"; é registrado um `CREDITO` e o saldo do trabalhador aumenta no valor do bico. Falhas previstas: bico inexistente 404 ("Bico não encontrado."), de outro contratante 403, fora de "Em andamento" 409, crédito já registrado 409.
**Status:** Aprovado. E2E em `roteiro/finalizacao-chat-avaliacao.spec.js`: o bico passa a Finalizado e sai de Bicos ativos; o saldo do trabalhador sobe de R$ 0 para R$ 150,00; o extrato mostra "Pagamento recebido – <título>" (Entrada, Creditado); o bico aparece em Concluídos; o banco tem 1 evento `Finalizacao` (Em andamento → Finalizado) e 1 `CREDITO`. Também cobre 409 ao finalizar de novo ou bico Aberto, 403 para outro contratante e para trabalhador, e 404 para bico inexistente.

## CT11 – Cancelar candidatura pendente
**Procedimento:** como trabalhador, cancelar uma candidatura Pendente (`POST /bicos/candidaturas/cancelar`).
**Resultado esperado:** a candidatura passa a "Cancelado", é registrada no histórico e o usuário volta para `/bicos/:id`. Candidatura que não está Pendente responde 400.
**Status:** Aprovado. E2E em `roteiro/candidaturas.spec.js`: o trabalhador cancela a candidatura Pendente pelo modal e ela fica Cancelado (para ele, para o contratante e na aba Cancelados), sem poder cancelar de novo nem se candidatar outra vez; cancelar uma candidatura Aceita responde 400 e ela continua Aceito (bico Em andamento).

## CT12 – Chat entre participantes e bloqueio para terceiros
**Procedimento:** com uma candidatura aceita, o contratante e o trabalhador abrem `/bicos/candidaturas/:id/chat` e enviam mensagens; um terceiro tenta abrir a conversa e enviar mensagem.
**Resultado esperado:** os participantes veem e enviam mensagens (envio responde 201); o terceiro recebe 404 "Conversa não encontrada." (a consulta só encontra a conversa para os dois participantes; 403 "Acesso não autorizado." fica para perfis que não são contratante nem trabalhador); mensagem vazia responde 400.
**Status:** Aprovado. E2E em `roteiro/finalizacao-chat-avaliacao.spec.js`: contratante e trabalhador enviam (201) e veem as mensagens um do outro; mensagem vazia responde 400; um terceiro (outro trabalhador e outro contratante) não abre, não lê e não envia (resposta 404 "Conversa não encontrada.", sem vazar o conteúdo, e a mensagem do intruso não é gravada); sem login redireciona para `/login`.

## CT13 – Avaliação pelo contratante
**Procedimento:** como contratante, `POST /bicos/:id/avaliacao` com nota de 1 a 5 em um bico Finalizado; repetir com bico não finalizado e com nota fora do intervalo.
**Resultado esperado:** bico finalizado com nota válida salva a avaliação; bico não finalizado responde 409 "Somente bicos finalizados podem ser avaliados."; nota fora de 1 a 5 responde 400 "A nota deve ser um número inteiro de 1 a 5."
**Status:** Aprovado. E2E em `roteiro/finalizacao-chat-avaliacao.spec.js`: com notas 5 (pela tela) e 4, o perfil público do trabalhador mostra média 4,5, "2 avaliações", notas, comentários e o nome do contratante; reavaliar o mesmo bico atualiza a nota (média 3,0); bico Em andamento ou Aberto responde 409; notas 0, 6, -1, "abc", 4.5 e vazia respondem 400; outro contratante e um trabalhador que não é do bico recebem 403; nada é gravado nas recusas. Os unitários de `tests/unit/avaliacao.unit.js` repetem as regras de nota, estado do bico e comentário com banco falso.

## CT14 – Cancelar bico Aberto (sem estorno)
**Procedimento:** como contratante, com um bico Aberto e uma candidatura Pendente, clicar em "Cancelar bico" em `/bicos/:id/gerenciar`, informar um motivo opcional e confirmar no modal (`POST /bicos/:id/cancelar`).
**Resultado esperado:** o bico passa a "Cancelado" e sai de "Bicos ativos"; o saldo do contratante não muda e nenhum `ESTORNO` é criado (não havia reserva); a candidatura Pendente passa a "Recusado" com o histórico "Bico cancelado pelo contratante" e aparece em "Recusados" do trabalhador; o evento `Cancelamento` é gravado em `historico_eventos_bicos` (com o motivo). O modal avisa que não há estorno.
**Status:** Aprovado. E2E "cancela bico Aberto: sem estorno e candidaturas pendentes recusadas" e "tela: o modal avisa do estorno e cancela o bico pelo botão"; unitários de "cancelamento de bico Aberto".

## CT15 – Cancelar bico Em andamento (com estorno)
**Procedimento:** como contratante, com saldo, aceitar um candidato (cria a `RESERVA`) e cancelar o bico.
**Resultado esperado:** o bico passa a "Cancelado"; o saldo volta ao valor anterior ao aceite (saldo + valor reservado); surge uma movimentação `ESTORNO` ("Estorno do bico: N") que aparece no extrato como **Entrada** ("Valor estornado", `+ R$ 150,00`); a candidatura aceita continua "Aceito" e ganha um registro no histórico; para o trabalhador, o bico **não** aparece em "Bicos Aceitos" e sim em "Cancelados" como "Cancelado pelo contratante" (com o motivo); o chat fica só para leitura (envio responde 409 e a caixa de texto fica desabilitada). O modal mostra o valor a estornar.
**Status:** Aprovado. E2E "cancela bico Em andamento: estorna a reserva e atualiza extrato, histórico e chat" e o teste de tela; unitários de "cancelamento de bico Em andamento".

## CT16 – Cancelamentos bloqueados
**Procedimento:** tentar cancelar (a) bico Finalizado; (b) bico de outro contratante e (c) como trabalhador; (d) o mesmo bico duas vezes.
**Resultado esperado:** (a) 409 "Bicos finalizados não podem ser cancelados." sem alterar saldo nem extrato; (b) e (c) 403 e o bico continua ativo; (d) a segunda tentativa responde 409 "Este bico já foi cancelado." e o estorno é feito uma única vez (também há bloqueio se já existir `CREDITO` ou `ESTORNO` para o bico).
**Status:** Aprovado. E2E "bico Finalizado não pode ser cancelado", "outro contratante e o trabalhador não conseguem cancelar o bico" e "cancelar duas vezes não estorna duas vezes"; unitários de "cancelamentos bloqueados".

## CT17 – Avaliação pelo trabalhador
**Procedimento:** (a) como trabalhador do bico, com o bico Finalizado, `POST /bicos/:id/avaliacao` (ou o formulário "Avaliar contratante" na página do bico) com nota de 1 a 5 e comentário; (b) como um usuário de fora do bico (outro trabalhador ou outro contratante), tentar o mesmo.
**Resultado esperado:** (a) responde 200 "Avaliação registrada." e a avaliação aparece no perfil público do contratante (`/perfil/publico/:id`) com nota, comentário e nome do trabalhador; a avaliação do contratante ao trabalhador é independente (duas avaliações no mesmo bico); (b) 403 e nada é gravado.
**Status:** Aprovado. E2E em `roteiro/avaliacao-bidirecional.spec.js`: o trabalhador avalia, o contratante avalia o trabalhador (2 avaliações no banco) e o perfil público do contratante mostra ★ 5,0, "1 avaliação", o comentário e o nome do trabalhador; em `roteiro/finalizacao-chat-avaliacao.spec.js` (CT13 recusada): outro contratante e outro trabalhador recebem 403. Unitários: "o trabalhador do bico avalia o contratante", "contratante e trabalhador avaliam o mesmo bico de forma independente" e "um terceiro recebe 403".

## CT18 – Prazo e edição da avaliação
**Procedimento:** (a) dentro de 7 dias após a finalização, abrir a tela do bico finalizado (contratante em `/bicos/:id/gerenciar`; trabalhador em `/bicos/:id`), avaliar e reabrir a página; editar a avaliação; (b) depois de 7 dias da finalização (data do evento de finalização em `historico_eventos_bicos`), tentar criar ou editar a avaliação e abrir a tela.
**Resultado esperado:** (a) antes de avaliar o formulário está vazio, com "Salvar avaliação" e "Você pode avaliar até DD/MM/AAAA"; depois, a estrela, o comentário e o botão "Atualizar avaliação" voltam preenchidos com "Você pode editar até DD/MM/AAAA"; a edição responde "Avaliação atualizada." e mantém uma só avaliação; comentário só com espaços é gravado como NULL; (b) 409 "O prazo de 7 dias para avaliar este bico terminou.", nada muda no banco e a tela mostra a avaliação só para leitura, sem formulário nem botão.
**Status:** Aprovado. E2E em `roteiro/avaliacao-bidirecional.spec.js`: "formulário volta preenchido (contratante e trabalhador)…" e "depois de 7 dias da finalização não cria nem edita; a tela fica só para leitura" (o teste envelhece a finalização por SQL nos dados que ele mesmo criou). Unitários em `tests/unit/avaliacao.unit.js`: edição dentro do prazo atualiza, exatamente no 7º dia ainda é permitido, depois de 7 dias não cria nem edita (409) e comentário só com espaços vira NULL.

## CT19 – Reputação e privacidade
**Procedimento:** como contratante, abrir a lista de candidatos de um bico; como trabalhador, abrir o feed (`/hometrabalhador`) e os detalhes do bico; abrir os perfis públicos de trabalhador e de contratante; abrir a home do contratante.
**Resultado esperado:** cada candidato mostra ★ média (n avaliações) ou "Sem avaliações" e o link "Ver perfil", sem e-mail nem idade; o feed, os detalhes do bico e o histórico mostram o contratante com nota e link para o perfil; o perfil público mostra apenas nome, tipo de perfil, "membro desde", média e quantidade de avaliações, bicos finalizados e as avaliações recebidas ("Ainda sem avaliações" quando não há), sem e-mail, CPF, idade ou saldo; o card "Bicos para avaliar" conta só bicos finalizados ainda não avaliados por este usuário e dentro do prazo.
**Status:** Aprovado. E2E em `roteiro/avaliacao-bidirecional.spec.js`: "candidato mostra média e link do perfil; feed e detalhes mostram a nota do contratante" (★ 4,0 com "1 avaliação", "Sem avaliações", link correto, lista sem e-mail, "E-mail:" nem "N anos"; feed ★ 5,0 (1) com link; detalhes e histórico com nota e link); "o trabalhador avalia o contratante…" (perfis públicos sem o e-mail e sem as palavras CPF, saldo e idade; "Ainda sem avaliações" e 404 para perfil inexistente); "Aguardando sua avaliação…" (contagem 0 → 1 → 0, prazo vencido não conta e a avaliação do trabalhador não consome a pendência).

## CT20 – Caminho até a avaliação
**Procedimento:** (a) como contratante, adicionar saldo, publicar um bico, aceitar o candidato e clicar em "Finalizar Serviço"; (b) chegar à avaliação pelo card "Bicos para avaliar" da home (leva a "Meus Bicos" > Concluídos) e pelo menu Bicos > aba Concluídos; (c) como trabalhador, chegar à avaliação pelo contador da home ou pelo Histórico > Concluídos; (d) conferir os selos nos dois painéis, inclusive com a finalização feita há mais de 7 dias.
**Resultado esperado:** depois de finalizar, sem recarregar a página à mão, o botão "Cancelar bico" some e o formulário "Avaliar trabalhador" aparece (a araponga comemora antes de a página recarregar); a aba Concluídos mostra o bico com data de finalização, trabalhador e o selo "Avaliar"; depois de avaliar o selo vira "Avaliado ★N"; sem avaliação e com o prazo vencido o selo é "Prazo encerrado" (e o card da home não conta o bico); o trabalhador vê "Avaliar contratante" / "Avaliado ★N" / "Prazo encerrado" no Histórico; o card lateral do bico finalizado se chama "Sua participação"; as abas Ativos, Concluídos e Cancelados (com data, motivo e estorno) mostram os bicos certos e aceitam `?aba=` na URL.
**Status:** Aprovado. E2E em `roteiro/fluxo-por-cliques.spec.js`: o fluxo completo só por cliques (sem `goto` para URLs internas depois do login); "Ativos, Concluídos e Cancelados mostram os bicos certos"; "o histórico do trabalhador mostra o selo e abre a aba pela URL" ("Avaliar contratante" e "Avaliado ★3"); e "Selo "Prazo encerrado"" (bico finalizado há 8 dias, nos dois painéis e com o contador da home em 0). Unitários em `tests/unit/selo-avaliacao.unit.js`: regras do selo ("Avaliado ★N", "Avaliar", "Prazo encerrado") e da contagem de bicos para avaliar.

## CT21 – Saldo e alertas
**Procedimento:** (a) como contratante, adicionar saldo pela carteira, aceitar um candidato (reserva) e cancelar o bico em andamento (estorno), olhando o saldo do menu lateral a cada passo; (b) com saldo menor que o valor do bico, clicar em "Aceitar"; (c) aceitar de novo uma candidatura já processada.
**Resultado esperado:** o saldo do menu lateral muda na hora, sem novo login (adicionar +, reservar −, estornar +); sem saldo suficiente a tela de gerenciamento volta com um alerta vermelho-claro ("Saldo insuficiente. Adicione saldo à sua carteira para aceitar este trabalhador.") com o mascote da área triste e o botão "Adicionar saldo" (que leva à carteira), e nada é alterado: saldo, status do bico (Aberto), candidatura (Pendente) e extrato (sem reserva); o alerta aparece uma vez só; erros de regra como "Esta candidatura já foi processada." também voltam com alerta, sem o botão de saldo.
**Status:** Aprovado. E2E em `roteiro/fluxo-por-cliques.spec.js`: "Saldo do menu lateral › muda na hora ao adicionar saldo, aceitar candidato (reserva) e cancelar (estorno)"; "Aceitar sem saldo: alerta estilizado › mostra o alerta com o botão "Adicionar saldo" e não altera nada" (inclui ler o banco para confirmar que não há RESERVA) e "candidatura já processada também volta com alerta". O CT09 em `roteiro/candidaturas.spec.js` cobre a mesma recusa pelas rotas.

## CT22 – Mascotes e movimento reduzido
**Procedimento:** (a) na landing alternar o seletor Visão geral / Contratar / Trabalhar; (b) no login e no cadastro provocar um erro com cada perfil escolhido e trocar o seletor; (c) abrir a dica da página de publicar bico e a do histórico do trabalhador; (d) repetir com o sistema configurado para reduzir movimento.
**Resultado esperado:** só existem dois mascotes: Contratar mostra somente a araponga e Trabalhar somente o tiê-sangue, trocando junto com o seletor; só a Visão geral da landing mostra as duas aves lado a lado; os alertas de erro (login, cadastro, publicar bico, saldo insuficiente) trazem o mascote do perfil, na pose triste; a dica do publicar bico usa a araponga e a do histórico usa o tiê; nenhuma página referencia o passarinho e o balão antigos; as 8 imagens em camadas respondem 200; com movimento reduzido nenhum elemento do mascote tem animação ativa e as aves ficam paradas e visíveis.
**Status:** Aprovado. E2E em `home/mascotes.spec.js`: "as 8 imagens em camadas respondem 200 e as antigas não existem mais"; "nenhuma página referencia passarinho_transparente nem balao_transparente"; "landing: Contratar = só araponga, Trabalhar = só tiê, Visão geral = as duas"; "login: o erro mostra a ave do perfil escolhido e troca junto com o seletor"; "cadastro: …"; "publicar bico: dica com a araponga…"; "histórico do trabalhador: a dica usa o tiê-sangue…"; "com reducedMotion "reduce", nenhum elemento do mascote tem animação ativa"; e "na landing a ave pousa e, com o mouse em cima do cartão, bate asas". A pose triste do alerta de saldo está em `roteiro/fluxo-por-cliques.spec.js`. As animações em si (movimento e som) não são medidas pelos testes além das classes, do `animation-name` e da comemoração com botão de som: foram aprovadas visualmente com a demonstração em `Docs/mascotes/`.

## CT23 – Reputação no perfil público
**Procedimento:** (a) com um cenário de histórico conhecido (bicos concluídos, em andamento e cancelados, e notas recebidas), abrir `/perfil/publico/:id` de um trabalhador e de um contratante; (b) abrir o perfil de um usuário sem nenhuma avaliação e sem bicos; (c) como contratante, abrir a lista de candidatos de um bico; (d) como trabalhador, abrir os detalhes de um bico aberto, antes de se candidatar; (e) verificar o conteúdo dos perfis públicos quanto a dados pessoais.
**Resultado esperado:** o perfil mostra nome, tipo, "membro desde" e a data do último serviço concluído (ou "Nenhum serviço concluído ainda"); a média (1 casa), a quantidade de avaliações e a distribuição das notas de 5★ a 1★; no trabalhador, bicos concluídos e em andamento (sem taxa de conclusão, pois só o contratante cancela); no contratante, bicos publicados, concluídos (todos pagos pela carteira simulada, valor simulado), cancelados depois do aceite (com estorno) e antes do aceite, e a taxa de conclusão = concluídos ÷ (concluídos + cancelados depois do aceite), ou "Sem histórico suficiente" quando não há bico nessas situações (por exemplo, só cancelados antes do aceite); as 5 avaliações mais recentes aparecem com nota, comentário, nome e perfil de quem avaliou e data, e "Ver todas (N)" expande as demais; usuário sem avaliações mostra "Ainda sem avaliações" e os demais números zerados normalmente; cada candidato mostra "N bicos concluídos"; os detalhes do bico mostram "Sobre o contratante" (média, bicos concluídos, cancelados depois de aceitar um trabalhador e link para o perfil), só para o trabalhador; o perfil público não traz e-mail, CPF, idade nem saldo; o tema visual acompanha o perfil exibido (verde-escuro/creme com a araponga para contratante; grafite/vinho/creme com o tiê-sangue para trabalhador), com o menu de quem está vendo.
**Status:** Aprovado. E2E em `roteiro/perfil-reputacao.spec.js`: "trabalhador: média, distribuição, bicos concluídos e em andamento, último serviço e avaliações" (4,5 com 2 avaliações, 2 concluídos, 1 em andamento, barras 1/1/0/0/0); "contratante: publicados, concluídos (valor simulado), cancelados depois/antes do aceite e taxa de conclusão" (6 publicados, 2 concluídos, 1 e 1 cancelados, 67%); "o perfil público nunca mostra e-mail, CPF, idade ou saldo"; "usuário sem nenhum histórico…" (inclui o contratante só com cancelado antes do aceite); ""Ver todas": mostra as 5 avaliações mais recentes e expande o restante"; "candidatos mostram "N bicos concluídos"; detalhes do bico mostram "Sobre o contratante""; e "tema e mascote acompanham o perfil exibido". Unitários: `tests/unit/reputacao.unit.js` (taxa de conclusão, distribuição, média, caso sem histórico, contratante e trabalhador, e as consultas feitas sem N+1) e `tests/unit/perfil.unit.js` (cadastro recente).

## CT24 – Sem indicadores fictícios
**Procedimento:** percorrer as telas do sistema (landing, login, cadastro, publicar bico, painéis, carteiras, detalhes e gerenciamento de bico, histórico, perfis privados e públicos) procurando selos de verificação, taxa de resposta, indicador "Online", login social e números inventados.
**Resultado esperado:** nenhuma tela mostra "Verificado", "validado" nem "Taxa de resposta"; o login não tem botões Google e LinkedIn; o cadastro não promete "milhares de profissionais" nem "mais confiável"; a tela de publicar bico não diz "Pagamento garantido" nem "Anúncio Verificado" nem "Média de 5 propostas/hora" e explica a reserva do valor na carteira simulada; os perfis privados não trazem a bolinha "Online"/"Conta ativa", a bio padrão nem itens fixos "Ativo", e mostram os números reais (bicos concluídos, avaliação média, membro desde, último serviço) com o link "Ver como os outros veem meu perfil"; "Membro recente" só aparece com cadastro de menos de 30 dias.
**Status:** Aprovado. E2E em `roteiro/perfil-reputacao.spec.js`: "nenhuma tela mostra "Verificado", "validado" ou "Taxa de resposta"" (16 páginas), "perfil privado do trabalhador mostra os números reais e o link…", "login sem Google/LinkedIn; cadastro e publicar bico com textos fiéis ao sistema" (inclui "Alcance Local" e "propostas/hora") e "perfis privados: sem bolinha online, bio padrão nem lista "Ativo"; "Membro recente" só com menos de 30 dias". Unitários em `tests/unit/perfil.unit.js`: regra dos 30 dias.

---

## Observações
- Todos os 24 casos têm teste automatizado aprovado. Os E2E antigos são, em sua maioria, de navegação e de interface; os do roteiro (CT02–CT24) conferem o resultado de cada operação.
- Os CT17 a CT19 exigem a tabela `avaliacoes` nova (schema atual ou `migrations/002_avaliacao_bidirecional.sql`).
- O servidor precisa estar rodando em `http://localhost:3000` (`npm start`) com o banco ligado antes de `npm test`, e `NODE_ENV=development` (o cadastro dos testes usa CPFs fictícios de 1 a 9).
- O E2E do cancelamento exige o banco com o tipo `ESTORNO` (schema atual ou `migrations/001_estorno.sql`).
- A planilha antiga `Docs/Teste/Casos de Teste (1).xlsx` (citava `walletService.js`, JWT e filtro por categoria, que não existem neste projeto) foi removida do repositório.
