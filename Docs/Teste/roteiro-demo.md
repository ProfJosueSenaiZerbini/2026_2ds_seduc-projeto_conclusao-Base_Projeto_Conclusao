# Roteiro de demonstração do iBico

Gerado por `scripts/preparar-demo.js` (não edite à mão: rode o script de novo para regenerar). Todos os dados são fictícios.

## Como usar

1. `npm run demo:preparar`: recria o banco `db_bico_demo` com este cenário (o `db_bico` não é tocado). Pede confirmação se o banco já existir; use `npm run demo:preparar -- --sim` para pular a pergunta.
2. `npm run demo`: sobe o iBico em http://localhost:3000 apontando para o `db_bico_demo`, com a consulta real de CEP.
3. Sem internet: `npm run demo:offline` (plano B). O CEP passa a ser consultado num provedor falso e só aceita `01310-100` (Avenida Paulista, São Paulo) e `13690-000` (CEP geral de Descalvado, sem rua).

**Senha de todas as contas:** `ibico123`. Na tela de login, escolha o perfil (Contratar ou Trabalhar) antes de entrar.

## Contas e o que testar

| Conta | E-mail | Senha | O que testar | Caso de teste |
| --- | --- | --- | --- | --- |
| Contratante principal (Carla Mendes) | `contratante@demo.com` | `ibico123` | Início > Bicos > "Montagem de guarda-roupa": 2 candidatos Pendentes. Aceitar um: o valor (R$ 120,00) é reservado no saldo e no extrato e o outro candidato fica Recusado. | CT08, CT19, CT21 |
|  |  |  | Bicos > "Pintura de muro externo" (sem candidatos): Cancelar bico, sem estorno no extrato. | CT14 |
|  |  |  | Bicos > "Ajudante para evento" (Em andamento): abrir o chat com o trabalhador, Finalizar (R$ 100,00 creditados ao trabalhador) e avaliar. | CT12, CT10, CT13 |
|  |  |  | Bicos > aba Concluídos > "Troca de resistência do chuveiro" (finalizado ontem, selo "Avaliar"): avaliar o trabalhador e editar a nota dentro do prazo de 7 dias. | CT13, CT18 |
|  |  |  | Bicos > aba Concluídos > "Conserto de torneira" (finalizado há 8 dias): selo "Prazo encerrado", sem avaliar. | CT18 |
|  |  |  | Aba Cancelados > "Instalação de prateleiras" (cancelado em andamento): estorno da reserva no extrato da carteira. | CT15 |
|  |  |  | Detalhe de qualquer bico dela: endereço completo (rua, número, complemento, CEP) para a dona. | CT25, CT26 |
| Contratante sem saldo (Beatriz Nogueira) | `contratante.semsaldo@demo.com` | `ibico123` | Bicos > "Reforma de bancada da cozinha" (R$ 200,00, 1 candidato): Aceitar mostra o alerta "Saldo insuficiente" com o mascote triste e nada muda. | CT09, CT21, CT22 |
| Outro contratante (Marcos Oliveira) | `contratante.outro@demo.com` | `ibico123` | Perfil público dele: avaliações recebidas do trabalhador experiente. Tem 2 vagas abertas que aparecem no feed dos trabalhadores. | CT17, CT19, CT23 |
| Trabalhador com bom histórico (Rafael Souza) | `trabalhador.experiente@demo.com` | `ibico123` | Perfil público: média 4,8 e reputação (4 avaliações recebidas, de bicos concluídos). Candidato Pendente em "Montagem de guarda-roupa". | CT19, CT23, CT24 |
|  |  |  | Histórico: bicos finalizados com a nota que ele deu aos contratantes. | CT17 |
| Trabalhador novo, sem avaliações (Juliana Lima) | `trabalhador.novo@demo.com` | `ibico123` | Perfil público sem avaliações (sem indicadores fictícios). Candidata a bicos pelo feed (ex.: "Poda de cerca viva") e vê o endereço completo só depois de aceita. | CT07, CT24, CT26 |
| Trabalhador aceito no bico em andamento (Diego Santos) | `trabalhador.aceito@demo.com` | `ibico123` | Bico "Ajudante para evento": chat com a contratante, endereço completo liberado (aceito) e, depois da finalização, avaliar a contratante. | CT12, CT17, CT26 |
|  |  |  | No detalhe de bicos em que ele não foi aceito (ex.: "Montagem de guarda-roupa"), o endereço aparece só com a região (bairro/cidade). | CT26 |

## Ordem sugerida (cerca de 10 minutos)

1. Contratante principal: abra "Montagem de guarda-roupa" e aceite um dos 2 candidatos (saldo e extrato, recusa automática do outro). ~2 min
2. Mesma conta: cancele "Pintura de muro externo" (sem estorno) e olhe a aba Cancelados (a "Instalação de prateleiras" mostra o estorno). ~2 min
3. Mesma conta: abra "Ajudante para evento", converse no chat, Finalize e avalie o trabalhador. ~2 min
4. Mesma conta: em "Troca de resistência do chuveiro" avalie e edite a nota; em "Conserto de torneira" veja o selo "Prazo encerrado". ~1 min
5. Contratante sem saldo: tente aceitar o candidato de R$ 200,00 e veja o alerta "Saldo insuficiente". ~1 min
6. Trabalhador novo: veja o feed, candidate-se a "Poda de cerca viva" e confira o perfil público do Rafael (média e reputação). ~1 min
7. Trabalhador aceito: veja o chat do evento e o endereço completo liberado. ~1 min

## Estado inicial dos saldos

- Carla Mendes: R$ 500,00 disponíveis e R$ 100,00 reservados no evento em andamento.
- Beatriz Nogueira: R$ 0,00 (por isso o alerta de saldo insuficiente).
- Marcos Oliveira: R$ 180,00 disponíveis (o resto pagou os 4 bicos do histórico do Rafael).

## Como resetar

Cada teste muda o banco de demonstração. Para voltar ao cenário inicial, pare o `npm run demo` (Ctrl+C) e rode `npm run demo:preparar -- --sim` outra vez. Todas as contas e bicos são recriados do zero.
