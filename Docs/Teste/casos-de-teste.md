# Casos de teste do iBico

Todos os valores financeiros são **simulados** (não existe pagamento real).

**Execução de referência:** 15/11/2026, Firefox (Playwright) + `node --test`, banco MariaDB 10.11 recriado a partir do `schema.sql`.
- Testes unitários (`npm run test:unit`): 32 de 32 aprovados (15 de idade/cadastro/perfil + 17 do cancelamento de bico), em `tests/unit/`.
- Testes E2E (`npm test`): 28 de 28 aprovados na execução final, em `tests/e2e/` (22 anteriores + 6 do cancelamento de bico). Em execuções anteriores do mesmo dia houve falhas intermitentes isoladas (testes de navegação e de login/cadastro) que passaram ao repetir, sem alteração de código.

**Legenda de status**
- **Aprovado:** coberto por teste automatizado que passou.
- **Parcial:** parte do caso é coberta por teste automatizado; o restante não foi executado.
- **Não executado:** não existe teste automatizado e não foi feita verificação manual nesta rodada. O resultado esperado vem das regras do código.

| Caso | Cobertura | Status |
|---|---|---|
| CT01 | E2E | Aprovado |
| CT02 | E2E (vazio, e-mail) + unitário (idade) | Parcial |
| CT03 | E2E (login válido) | Parcial |
| CT04 | – | Não executado |
| CT05 | E2E (publicação válida, sem checar o resultado) | Parcial |
| CT06 | E2E (clique no botão, sem checar o saldo) | Parcial |
| CT07 a CT13 | – | Não executado |
| CT14 | E2E + unitário | Aprovado |
| CT15 | E2E + unitário | Aprovado |
| CT16 | E2E + unitário | Aprovado |

---

## CT01 – Cadastro válido (contratante e trabalhador)
**Procedimento:** abrir `/cadastrar`, escolher o perfil, preencher nome, e-mail, CPF, idade (18 a 90), senha e confirmação, marcar os termos e a confirmação de maioridade, enviar.
**Resultado esperado:** redireciona para `/login`; o login com a conta nova leva a `/homeContratante` (contratante) ou `/hometrabalhador` (trabalhador).
**Status:** Aprovado. Testes E2E "cadastro e o login com sucesso como Contratante" e "como Trabalhador".

## CT02 – Cadastro inválido
**Procedimento:** enviar `/cadastrar` com (a) campos vazios; (b) e-mail inválido; (c) CPF inválido; (d) sem marcar "Confirmo que possuo 18 anos ou mais"; (e) idade 17 ou 91.
**Resultado esperado:** o cadastro não é feito. O navegador bloqueia campos vazios e e-mail malformado (a página continua em `/cadastrar`). O servidor responde 400 com mensagem: "Digite um CPF válido.", "É necessário confirmar que possui 18 anos ou mais." ou "Informe uma idade válida, entre 18 e 90 anos."
**Status:** Parcial.
- Aprovado: (a) e (b), nos testes E2E "campos vazios" e "e-mail inválido"; (e) nos testes unitários e no E2E "somente idades entre 18 e 90".
- Não executado: (c) CPF inválido e (d) sem maioridade no navegador ou por HTTP.

## CT03 – Login válido/inválido e rota interna sem login
**Procedimento:** (a) entrar com e-mail e senha corretos; (b) entrar com e-mail não cadastrado, senha incorreta ou perfil trocado; (c) acessar `/homeContratante` sem estar logado.
**Resultado esperado:** (a) vai para a home do perfil; (b) permanece em `/login` com mensagem ("E-mail não cadastrado!", "Senha incorreta!" ou "Sua conta está cadastrada como …"); (c) redireciona para `/login`.
**Status:** Parcial. (a) aprovado nos E2E de cadastro e login e no fluxo do contratante; (b) e (c) não executados.

## CT04 – Acesso a rota de outro perfil
**Procedimento:** logado como trabalhador, abrir `/homeContratante`, `/bicos/novo` e `/carteira/contratante`; logado como contratante, abrir `/hometrabalhador` e `/carteira/trabalhador`.
**Resultado esperado:** HTTP 403 com o texto "Acesso negado para o perfil desta conta." (middleware `requireRole`).
**Status:** Não executado.

## CT05 – Publicar bico válido e inválido
**Procedimento:** como contratante, abrir `/bicos/novo` e enviar (a) todos os campos válidos; (b) título com menos de 3 caracteres, descrição com menos de 10, bairro com menos de 2, sem data, sem horário ou valor ≤ 0.
**Resultado esperado:** (a) redireciona para `/homeContratante` e o bico aparece como Aberto; (b) HTTP 400 com a mensagem do campo (ex.: "O título deve ter entre 3 e 100 caracteres.").
**Status:** Parcial. (a) é executado pelo E2E "preencher … e publicar a vaga", que só aguarda o carregamento da página e não confere o resultado; (b) não executado.

## CT06 – Adicionar saldo simulado
**Procedimento:** como contratante, em `/carteira/contratante`, informar um valor (ex.: 150,00) e clicar em "Adicionar Saldo".
**Resultado esperado:** redireciona para `/carteira/contratante`; o saldo aumenta no valor informado e surge uma movimentação `ADICAO`. Valor vazio, inválido ou ≤ 0 responde 400.
**Status:** Parcial. O E2E "inserir um valor e testar o botão Adicionar Saldo" preenche e clica, mas não confere o saldo nem o extrato. Valores inválidos não foram executados.

## CT07 – Candidatura e candidatura duplicada
**Procedimento:** como trabalhador, candidatar-se a um bico Aberto (`POST /bicos/candidatar`); repetir a candidatura ao mesmo bico.
**Resultado esperado:** a primeira cria a candidatura Pendente e redireciona para `/hometrabalhador`; a segunda responde 400 "Você já se candidatou a este bico!" (restrição única `bico_id` + `trabalhador_id`).
**Status:** Não executado.

## CT08 – Aceitar candidato com saldo suficiente
**Procedimento:** como contratante, com saldo ≥ valor do bico, aceitar uma candidatura em `/bicos/:id/gerenciar`.
**Resultado esperado:** o valor é descontado do saldo; é registrada uma movimentação `RESERVA`; o bico passa a "Em andamento" com o trabalhador vinculado; a candidatura vira "Aceito" e as demais candidaturas do bico viram "Recusado".
**Status:** Não executado.

## CT09 – Aceitar candidato sem saldo
**Procedimento:** como contratante com saldo menor que o valor do bico, tentar aceitar uma candidatura.
**Resultado esperado:** HTTP 400 "Saldo insuficiente. Adicione saldo à sua carteira para aceitar este trabalhador."; nada é alterado (transação desfeita).
**Status:** Não executado.

## CT10 – Finalizar bico
**Procedimento:** como contratante dono de um bico "Em andamento", `POST /bicos/:id/finalizar`.
**Resultado esperado:** o bico passa a "Finalizado"; é registrado um `CREDITO` e o saldo do trabalhador aumenta no valor do bico. Falhas previstas: bico inexistente 404 ("Bico não encontrado."), de outro contratante 403, fora de "Em andamento" 409, crédito já registrado 409.
**Status:** Não executado.

## CT11 – Cancelar candidatura pendente
**Procedimento:** como trabalhador, cancelar uma candidatura Pendente (`POST /bicos/candidaturas/cancelar`).
**Resultado esperado:** a candidatura passa a "Cancelado", é registrada no histórico e o usuário volta para `/bicos/:id`. Candidatura que não está Pendente responde 400.
**Status:** Não executado.

## CT12 – Chat entre participantes e bloqueio para terceiros
**Procedimento:** com uma candidatura aceita, o contratante e o trabalhador abrem `/bicos/candidaturas/:id/chat` e enviam mensagens; um terceiro tenta abrir a conversa e enviar mensagem.
**Resultado esperado:** os participantes veem e enviam mensagens (envio responde 201); o terceiro recebe 403 "Acesso não autorizado."; mensagem vazia responde 400.
**Status:** Não executado.

## CT13 – Avaliação de bico finalizado
**Procedimento:** como contratante, `POST /bicos/:id/avaliacao` com nota de 1 a 5 em um bico Finalizado; repetir com bico não finalizado e com nota fora do intervalo.
**Resultado esperado:** bico finalizado com nota válida salva a avaliação; bico não finalizado responde 409 "Somente bicos finalizados podem ser avaliados."; nota fora de 1 a 5 responde 400 "A nota deve ser um número inteiro de 1 a 5."
**Status:** Não executado.

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
- Os E2E antigos são, em sua maioria, de navegação e de interface. Os casos CT04 e CT07 a CT13 ainda não têm teste automatizado; transformá-los em testes é a próxima etapa natural.
- O E2E do cancelamento exige o banco com o tipo `ESTORNO` (schema atual ou `migrations/001_estorno.sql`).
- A planilha antiga `Docs/Teste/Casos de Teste (1).xlsx` (citava `walletService.js`, JWT e filtro por categoria, que não existem neste projeto) foi removida do repositório.
