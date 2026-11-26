# Guia para conhecer o iBico

Gerado por `scripts/preparar-demo.js` (não edite à mão: rode o script de novo para regenerar). Todos os dados são fictícios.

## 1. Preparar

1. `npm run demo:preparar`: recria o banco `db_bico_demo` com este cenário (o `db_bico` não é tocado). Pede confirmação se o banco já existir; use `npm run demo:preparar -- --sim` para pular a pergunta.
2. `npm run demo`: sobe o iBico em http://localhost:3000 apontando para o `db_bico_demo`, com a consulta real de CEP.
3. Sem internet: `npm run demo:offline`. O CEP passa a ser consultado num provedor falso e só aceita `01310-100` (Avenida Paulista, São Paulo) e `13690-000` (CEP geral de Descalvado, sem rua).

**Senha de todas as contas:** `ibico123`. Na tela de login, escolha o perfil (Contratar ou Trabalhar) antes de entrar.

## 2. Suas contas, professor

| Conta | E-mail | Perfil |
| --- | --- | --- |
| **Professor Contratante** | **`professor.contratante@demo.com`** | Contratante |
| **Professor Trabalhador** | **`professor.trabalhador@demo.com`** | Trabalhador |

**Professor Contratante** já tem:

- carteira com saldo, extrato (adição, pagamento e reserva) e foto de perfil;
- um bico concluído e avaliado dos dois lados ("Organização do almoxarifado");
- um bico Em andamento com chat ("Pintura da sala de aula");
- um bico aberto com 2 candidatos Pendentes ("Manutenção do portão da escola");
- um bico cancelado ("Limpeza do laboratório").

O que fazer: aceitar um candidato do portão (o outro é recusado automaticamente) ou recusar os dois; conversar no chat e finalizar a "Pintura da sala de aula" e avaliar o trabalhador; publicar um bico digitando um CEP (offline, `01310-100`).

**Professor Trabalhador** já tem:

- foto de perfil, notificações no sino e histórico com bicos Em andamento, concluído (com notas), Pendente e cancelado pelo contratante.

O que fazer: ver o feed, candidatar-se a um bico aberto e acompanhar a resposta pelo sino; abrir o chat da pintura e avaliar quando o bico for finalizado.

**Os dois lados do mesmo bico:** o contratante e o trabalhador do professor trabalham juntos em "Pintura da sala de aula". Abra uma conta numa janela comum e a outra numa janela anônima para ver cada lado (mensagens do chat, aviso no sino ao aceitar ou finalizar).

## 3. As outras contas

| Conta | E-mail | Perfil | Como está |
| --- | --- | --- | --- |
| Carla Mendes | `contratante@demo.com` | Contratante | Contratante principal, com bicos em todos os estados e carteira movimentada. |
| Beatriz Nogueira | `contratante.semsaldo@demo.com` | Contratante | Saldo zerado; o bico de R$ 200,00 não pode ser aceito. |
| Marcos Oliveira | `contratante.outro@demo.com` | Contratante | Quem mais contratou, com histórico, bicos em andamento e vagas abertas. |
| Rafael Souza | `trabalhador.experiente@demo.com` | Trabalhador | Experiente, com várias avaliações, foto e sino sem avisos novos. |
| Juliana Lima | `trabalhador.novo@demo.com` | Trabalhador | Iniciante, com o primeiro bico concluído, uma avaliação e candidaturas pendentes. |
| Diego Santos | `trabalhador.aceito@demo.com` | Trabalhador | Bico em andamento com chat e várias notificações não lidas. |

## 4. Passeio como contratante (Carla)

Entre com `contratante@demo.com` escolhendo Contratar.

1. **Início:** confira os números do painel.
2. **Bicos:** percorra as abas Ativos, Concluídos e Cancelados.
3. **Gerenciar "Montagem de guarda-roupa":** veja os candidatos com nota e acesse o perfil de cada um.
4. **Chat do "Ajudante para evento":** abra a conversa com o trabalhador aceito.
5. **Carteira:** o extrato mostra adição, reserva e estorno.
6. **Meu Perfil** e "Ver como os outros veem meu perfil".
7. **Publicar Bico** digitando um CEP.

## 5. Passeio como trabalhador (Rafael)

Entre com `trabalhador.experiente@demo.com` escolhendo Trabalhar.

1. **Feed:** use os filtros e os bairros.
2. **Detalhe de um bico:** o endereço aparece só com a região até a candidatura ser aceita.
3. **Sino:** abra as notificações.
4. **Histórico:** Em andamento, Concluídos (com as notas) e Recusados.
5. **Carteira:** créditos recebidos e gráfico mensal.
6. **Perfil público:** média e reputação.

## 6. O que cada outra conta mostra

- **Beatriz:** saldo zerado e alerta de "Saldo insuficiente" ao tentar aceitar o bico de R$ 200,00.
- **Marcos:** quem mais contratou; perfil público com as avaliações do Rafael.
- **Juliana:** iniciante com o primeiro bico concluído e uma única avaliação.
- **Diego:** bico em andamento com chat e várias notificações não lidas.

## 7. Faça você mesmo

Em **Cadastrar**, crie uma conta nova escolhendo o perfil. Veja o perfil novo: sem avaliações e sem números inventados, carteira e telas vazias com orientação para o primeiro passo.

## 8. Ações que mudam o banco

Aceitar, cancelar, finalizar, avaliar e trocar foto alteram o banco de demonstração. Cada ação tem o caso de teste correspondente na tabela do apêndice (CT08 aceitar, CT14 e CT15 cancelar, CT12 finalizar, CT13 avaliar, CT27 foto).

**Para voltar ao cenário inicial:** pare o `npm run demo` (Ctrl+C) e rode `npm run demo:preparar -- --sim`. Todas as contas e bicos são recriados do zero.

## Apêndice: contas x casos de teste

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
|  |  |  | Meu Perfil > "Ver como os outros veem meu perfil": já mostra a nota que o Diego deu no conserto de torneira; depois de ele avaliar o evento, aparece mais uma (avaliação mútua completa). | CT17, CT19 |
|  |  |  | Já tem foto de perfil (avatar verde), que aparece no Meu Perfil e na barra lateral. Em Meu Perfil: Trocar foto (JPG, PNG ou WebP, até 2 MB) ou Remover foto, que volta às iniciais "CM". | CT27 |
| Contratante sem saldo (Beatriz Nogueira) | `contratante.semsaldo@demo.com` | `ibico123` | Bicos > "Reforma de bancada da cozinha" (R$ 200,00, 1 candidato): Aceitar mostra o alerta "Saldo insuficiente" com o mascote triste e nada muda. | CT09, CT21, CT22 |
|  |  |  | Bicos > aba Concluídos > "Limpeza de caixa d'água" (avaliada dos dois lados) e aba Cancelados > "Troca de lâmpadas da garagem" (cancelado aberto, sem estorno). A carteira tem o extrato de adição e pagamento, com saldo R$ 0,00. | CT13, CT14, CT17 |
| Outro contratante (Marcos Oliveira) | `contratante.outro@demo.com` | `ibico123` | Perfil público dele: avaliações recebidas do trabalhador experiente. Quem mais contratou, com vagas abertas no feed dos trabalhadores. | CT17, CT19, CT23 |
|  |  |  | Bicos: "Montagem de rack na sala" e "Lavagem de calçada e quintal" Em andamento (valores reservados), "Poda de cerca viva" aberto e "Limpeza de calha" na aba Cancelados. | CT08, CT14, CT15 |
| Trabalhador com bom histórico (Rafael Souza) | `trabalhador.experiente@demo.com` | `ibico123` | Perfil público: média 4,8 e reputação (4 avaliações recebidas, de bicos concluídos). Candidato Pendente em "Montagem de guarda-roupa". | CT19, CT23, CT24 |
|  |  |  | Histórico: bicos finalizados com a nota que ele deu aos contratantes. | CT17 |
|  |  |  | Tem foto de perfil (avatar vinho): aparece no Meu Perfil dele e no perfil público (a Carla abre pelo nome dele na lista de candidatos). | CT27 |
|  |  |  | Sino sem notificações novas (os aceites antigos já foram lidos). Deixe esta conta aberta noutra janela (anônima) e clique uma vez na página: quando a Carla aceitar ou recusar em "Montagem de guarda-roupa", em até 20 s chega o aviso com som e o contador do sino. | CT28 |
| Trabalhador novo, sem avaliações (Juliana Lima) | `trabalhador.novo@demo.com` | `ibico123` | Perfil público com uma única avaliação (a da Beatriz na caixa d’água), sem indicadores fictícios. Candidata a bicos pelo feed (ex.: "Poda de cerca viva") e vê o endereço completo só depois de aceita. | CT07, CT24, CT26 |
|  |  |  | Sem foto: o perfil mostra as iniciais "JL". Também está Pendente em "Montagem de guarda-roupa": se a Carla aceitar o Rafael, ela recebe "Vaga preenchida". | CT27, CT28 |
| Trabalhador aceito no bico em andamento (Diego Santos) | `trabalhador.aceito@demo.com` | `ibico123` | Depois de a Carla finalizar "Ajudante para evento": Histórico > aba Concluídos > Abrir conversa (o chat continua liberado, com envio de mensagens) e Ver detalhes (endereço completo liberado). Avaliar a contratante; a nota aparece no perfil público da Carla. | CT12, CT17, CT26 |
|  |  |  | No detalhe de bicos em que ele não foi aceito (ex.: "Montagem de guarda-roupa"), o endereço aparece só com a região (bairro/cidade). | CT26 |
|  |  |  | Sino com várias notificações não lidas (aceites da Carla, "Bico cancelado" da Instalação de prateleiras e vagas preenchidas). Abrir o painel marca como lidas; cada uma leva ao bico. | CT28 |
|  |  |  | Histórico: "Ajudante para evento" Em andamento (com chat), concluídos e recusados (ex.: "Montagem de rack na sala"). Candidato Pendente em "Manutenção do portão da escola". | CT12, CT17 |
| Professor Contratante | `professor.contratante@demo.com` | `ibico123` | Bicos > "Manutenção do portão da escola" (Aberto, 2 candidatos Pendentes: Rafael e Diego, com mensagem e nota): aceitar um (reserva de R$ 120,00 e recusa automática do outro) ou recusar. | CT08, CT19, CT21 |
|  |  |  | Bicos > "Pintura da sala de aula" (Em andamento com o Professor Trabalhador): conversar no chat e Finalizar (R$ 150,00 creditados) e avaliar. | CT12, CT10, CT13 |
|  |  |  | Aba Concluídos > "Organização do almoxarifado" (avaliado dos dois lados) e aba Cancelados > "Limpeza do laboratório" (cancelado aberto). Carteira com adição de R$ 1.000,00, pagamento e reserva; foto de perfil azul. | CT14, CT17, CT27 |
|  |  |  | Publicar Bico com CEP (offline, 01310-100): rua, bairro, cidade e UF preenchidos sozinhos. | CT05, CT25 |
| Professor Trabalhador | `professor.trabalhador@demo.com` | `ibico123` | Histórico: "Pintura da sala de aula" Em andamento (chat com 3 mensagens), "Organização do almoxarifado" Concluído com notas, "Poda de cerca viva" Pendente e "Limpeza de calha" cancelado pelo contratante. | CT12, CT17, CT28 |
|  |  |  | Feed: candidatar-se a um bico aberto (ex.: "Pintura de muro externo"). Sino com avisos de aceite e cancelamento. Foto de perfil laranja. | CT07, CT24, CT27, CT28 |
