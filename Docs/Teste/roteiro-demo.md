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
| Contratante principal (Carla Mendes) | `contratante@demo.com` | `ibico123` | Publicar Bico: digite um CEP (com internet, qualquer CEP real; offline, 01310-100) e veja rua, bairro, cidade e UF preenchidos sozinhos. Informe o número, publique e abra o detalhe: o endereço completo aparece para a dona. | CT05, CT25 |
|  |  |  | Início > Bicos > "Montagem de guarda-roupa": 2 candidatos Pendentes. Aceitar um: o valor (R$ 120,00) é reservado no saldo e no extrato e o outro candidato fica Recusado. | CT08, CT19, CT21 |
|  |  |  | Bicos > "Pintura de muro externo" (sem candidatos): Cancelar bico, sem estorno no extrato. | CT14 |
|  |  |  | Bicos > "Ajudante para evento" (Em andamento): abrir o chat com o trabalhador, Finalizar (R$ 100,00 creditados ao trabalhador) e avaliar. | CT12, CT10, CT13 |
|  |  |  | Bicos > aba Concluídos > "Troca de resistência do chuveiro" (finalizado ontem, selo "Avaliar"): avaliar o trabalhador e editar a nota dentro do prazo de 7 dias. | CT13, CT18 |
|  |  |  | Bicos > aba Concluídos > "Conserto de torneira" (finalizado há 8 dias): selo "Prazo encerrado", sem avaliar. | CT18 |
|  |  |  | Aba Cancelados > "Instalação de prateleiras" (cancelado em andamento): estorno da reserva no extrato da carteira. | CT15 |
|  |  |  | Detalhe de qualquer bico dela: endereço completo (rua, número, complemento, CEP) para a dona. | CT25, CT26 |
|  |  |  | Meu Perfil > "Ver como os outros veem meu perfil": depois de o Diego avaliar, a nota dele aparece (avaliação mútua completa). | CT17, CT19 |
|  |  |  | Já tem foto de perfil (avatar verde), que aparece no Meu Perfil e na barra lateral. Em Meu Perfil: Trocar foto (JPG, PNG ou WebP, até 2 MB) ou Remover foto, que volta às iniciais "CM". | CT27 |
| Contratante sem saldo (Beatriz Nogueira) | `contratante.semsaldo@demo.com` | `ibico123` | Bicos > "Reforma de bancada da cozinha" (R$ 200,00, 1 candidato): Aceitar mostra o alerta "Saldo insuficiente" com o mascote triste e nada muda. | CT09, CT21, CT22 |
| Outro contratante (Marcos Oliveira) | `contratante.outro@demo.com` | `ibico123` | Perfil público dele: avaliações recebidas do trabalhador experiente. Tem 2 vagas abertas que aparecem no feed dos trabalhadores. | CT17, CT19, CT23 |
| Trabalhador com bom histórico (Rafael Souza) | `trabalhador.experiente@demo.com` | `ibico123` | Perfil público: média 4,8 e reputação (4 avaliações recebidas, de bicos concluídos). Candidato Pendente em "Montagem de guarda-roupa". | CT19, CT23, CT24 |
|  |  |  | Histórico: bicos finalizados com a nota que ele deu aos contratantes. | CT17 |
|  |  |  | Tem foto de perfil (avatar vinho): aparece no Meu Perfil dele e no perfil público (a Carla abre pelo nome dele na lista de candidatos). | CT27 |
|  |  |  | Sino sem notificações novas (os aceites antigos já foram lidos). Deixe esta conta aberta noutra janela (anônima) e clique uma vez na página: quando a Carla aceitar ou recusar em "Montagem de guarda-roupa", em até 20 s chega o aviso com som e o contador do sino. | CT28 |
| Trabalhador novo, sem avaliações (Juliana Lima) | `trabalhador.novo@demo.com` | `ibico123` | Perfil público sem avaliações (sem indicadores fictícios). Candidata a bicos pelo feed (ex.: "Poda de cerca viva") e vê o endereço completo só depois de aceita. | CT07, CT24, CT26 |
|  |  |  | Sem foto: o perfil mostra as iniciais "JL". Também está Pendente em "Montagem de guarda-roupa": se a Carla aceitar o Rafael, ela recebe "Vaga preenchida". | CT27, CT28 |
| Trabalhador aceito no bico em andamento (Diego Santos) | `trabalhador.aceito@demo.com` | `ibico123` | Depois de a Carla finalizar "Ajudante para evento": Histórico > aba Concluídos > Abrir conversa (o chat continua liberado, com envio de mensagens) e Ver detalhes (endereço completo liberado). Avaliar a contratante; a nota aparece no perfil público da Carla. | CT12, CT17, CT26 |
|  |  |  | No detalhe de bicos em que ele não foi aceito (ex.: "Montagem de guarda-roupa"), o endereço aparece só com a região (bairro/cidade). | CT26 |
|  |  |  | Sino com 5 notificações não lidas: os 4 aceites da Carla e "Bico cancelado" (Instalação de prateleiras). Abrir o painel marca como lidas; cada uma leva ao bico. | CT28 |

## Ordem sugerida (cerca de 14 minutos)

1. Contratante principal: Publicar Bico digitando um CEP (com internet, qualquer CEP real; offline, 01310-100). Veja rua, bairro, cidade e UF preenchidos sozinhos, informe o número, publique e abra o detalhe com o endereço completo. [CT05, CT25] ~2 min
2. Antes do aceite, abra o Rafael numa janela anônima (Trabalhar) e clique uma vez na página para liberar o som. [CT28] ~1 min
3. Contratante principal: abra "Montagem de guarda-roupa" e aceite o Rafael (saldo e extrato, recusa automática da Juliana). Na janela do Rafael, em até 20 s, chegam o aviso "Candidatura aceita", o som e o contador do sino. [CT08, CT28] ~1 min
4. Mesma conta: cancele "Pintura de muro externo" (sem estorno) e olhe a aba Cancelados (a "Instalação de prateleiras" mostra o estorno). [CT14, CT15] ~1 min
5. Mesma conta: abra "Ajudante para evento", converse no chat e Finalize (R$ 100,00 creditados ao trabalhador). [CT12, CT10] ~2 min
6. Trabalhador aceito (Diego): em Histórico > aba Concluídos, abra a conversa do evento (o chat segue liberado depois de finalizado, dá para enviar mensagem) e o detalhe, com o endereço completo. Avalie a contratante. [CT17, CT12, CT26] ~2 min
7. Volte à contratante principal: Meu Perfil > "Ver como os outros veem meu perfil" e veja a nota recebida do Diego (avaliação mútua completa). [CT17, CT19] ~1 min
8. Mesma conta: em "Troca de resistência do chuveiro" (aba Concluídos) avalie e edite a nota; em "Conserto de torneira" veja o selo "Prazo encerrado". [CT13, CT18] ~1 min
9. Contratante principal: Meu Perfil > Trocar foto (qualquer JPG ou PNG) e veja a foto nova também na barra lateral; depois Remover foto volta às iniciais. [CT27] ~1 min
10. Contratante sem saldo: tente aceitar o candidato de R$ 200,00 e veja o alerta "Saldo insuficiente". [CT09, CT21] ~1 min
11. Trabalhador novo: veja o feed, candidate-se a "Poda de cerca viva" e confira o perfil público do Rafael (média e reputação). [CT07, CT23] ~1 min

## Estado inicial dos saldos

- Carla Mendes: R$ 500,00 disponíveis e R$ 100,00 reservados no evento em andamento.
- Beatriz Nogueira: R$ 0,00 (por isso o alerta de saldo insuficiente).
- Marcos Oliveira: R$ 180,00 disponíveis (o resto pagou os 4 bicos do histórico do Rafael).

## Como resetar

Cada teste muda o banco de demonstração. Para voltar ao cenário inicial, pare o `npm run demo` (Ctrl+C) e rode `npm run demo:preparar -- --sim` outra vez. Todas as contas e bicos são recriados do zero.
