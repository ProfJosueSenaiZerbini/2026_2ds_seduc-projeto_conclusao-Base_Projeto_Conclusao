# Casos de teste do iBico

Todos os valores financeiros são **simulados** (não existe pagamento real).

**Execução de referência:** 17/11/2026, Firefox (Playwright) + `node --test`, banco MariaDB 10.11 recriado a partir do `schema.sql`.
- Testes unitários (`npm run test:unit`): 32 de 32 aprovados (15 de idade/cadastro/perfil + 17 do cancelamento de bico), em `tests/unit/`.
- Testes E2E (`npm test`): 56 de 56 aprovados (28 anteriores + 28 do roteiro CT02–CT13), em `tests/e2e/`.
- A suíte completa (`npm run test:unit` e `npm test`) foi executada duas vezes seguidas em 17/11/2026 (11:33 e 11:34) e passou inteira nas duas, sem falhas intermitentes. O Playwright usa 2 workers.
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
| CT13 | `roteiro/finalizacao-chat-avaliacao.spec.js` › CT13 (média no perfil público; avaliações recusadas) | Aprovado |
| CT14 | `contratante/cancelamento-bico.spec.js` + `tests/unit/cancelamento.unit.js` | Aprovado |
| CT15 | `contratante/cancelamento-bico.spec.js` + `tests/unit/cancelamento.unit.js` | Aprovado |
| CT16 | `contratante/cancelamento-bico.spec.js` + `tests/unit/cancelamento.unit.js` | Aprovado |

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

## CT13 – Avaliação de bico finalizado
**Procedimento:** como contratante, `POST /bicos/:id/avaliacao` com nota de 1 a 5 em um bico Finalizado; repetir com bico não finalizado e com nota fora do intervalo.
**Resultado esperado:** bico finalizado com nota válida salva a avaliação; bico não finalizado responde 409 "Somente bicos finalizados podem ser avaliados."; nota fora de 1 a 5 responde 400 "A nota deve ser um número inteiro de 1 a 5."
**Status:** Aprovado. E2E em `roteiro/finalizacao-chat-avaliacao.spec.js`: com notas 5 (pela tela) e 4, o perfil público do trabalhador mostra média 4,5, "2 avaliações", notas, comentários e o nome do contratante; reavaliar o mesmo bico atualiza a nota (média 3,0); bico Em andamento ou Aberto responde 409; notas 0, 6, -1, "abc", 4.5 e vazia respondem 400; outro contratante e trabalhador recebem 403; nada é gravado nas recusas.

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

---

## Observações
- Todos os 16 casos têm teste automatizado aprovado. Os E2E antigos são, em sua maioria, de navegação e de interface; os do roteiro (CT02–CT13) conferem o resultado de cada operação.
- O servidor precisa estar rodando em `http://localhost:3000` (`npm start`) com o banco ligado antes de `npm test`, e `NODE_ENV=development` (o cadastro dos testes usa CPFs fictícios de 1 a 9).
- O E2E do cancelamento exige o banco com o tipo `ESTORNO` (schema atual ou `migrations/001_estorno.sql`).
- A planilha antiga `Docs/Teste/Casos de Teste (1).xlsx` (citava `walletService.js`, JWT e filtro por categoria, que não existem neste projeto) foi removida do repositório.
