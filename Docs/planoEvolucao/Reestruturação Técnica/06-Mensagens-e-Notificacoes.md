# Mensagens, notificações e comunicação

## 1. Mensagens privadas
1.1. Persistir **conversa, participantes, mensagens, autoria, envio, leitura/não leitura e histórico**; popup e tela completa consultam os mesmos registros.
1.2. Permitir iniciar conversa apenas se destinatário e remetente tiverem autorização; o profissional pode restringir contato de Consumidores.
1.3. Bloqueios devem impedir novos contatos conforme política e não revelar dados privados. Não equiparar mensagem a contratação, proposta profissional ou crédito confirmado.
1.4. **Excluir mensagem exige regra própria:** apagar apenas para si versus apagar para todos, período, retenção e efeito nas demais pessoas. Não implementar exclusão destrutiva implícita.
1.5. O painel flutuante da interface fica no canto inferior direito e usa ícone de expansão; ver [02-Sidebar-Navegacao-e-Mensagens](../Reestrutura%C3%A7%C3%A3o%20Visual/02-Sidebar-Navegacao-e-Mensagens.md).

## 2. Caixa de notificações
2.1. Notificação gerada a partir de **evento real** permanece gravada até que o destinatário exclua a notificação específica ou limpe a caixa. **Ler, fechar popup e sair da sessão não apagam o registro**.
2.2. Manter **lida/não lida** separado de **excluída**; sincronizar popup, página e contador persistente.
2.3. Registrar destinatário, tipo, evento de origem, identificador do objeto, instante, destino e dados suficientes para renderizar mensagem segura.
2.4. Links de avisos devem respeitar permissão atual; conteúdo privado ou removido não pode vazar por notificação antiga.
2.5. Evitar avisos duplicados por reenvio, não notificar autor por sua própria ação sem motivo explícito e considerar agrupamento de baixa prioridade.

## 3. Eventos geradores
3.1. Candidatos: nova mensagem, seguidor, resposta/menção, comentário pertinente, interação, crédito enviado à revisão, alteração ou lembrete de evento, inscrição aceita/rejeitada e decisão de solicitação administrativa.
3.2. O conjunto final, prioridades, frequência, agrupar notificações e entrega por e-mail **não estão definidos**; explicitar preferência e consentimento quando necessários.
3.3. Avisos de evento seguem `05-Eventos-Mapa-e-Lembretes.md`; não presumir que abrir um evento constitui inscrição.

## 4. Contato com a equipe
4.1. **Falar com a Cypher** é fluxo de solicitação interna para ajuda, proposta de profissão/gênero/vertente/tipo, exceção dos 60 dias ou alteração excepcional do @.
4.2. Criar registro persistente com solicitante, assunto, descrição, data, estado, decisão e resposta; encaminhar à área administrativa apropriada.
4.3. Essa fila **não é conversa privada** entre usuários nem comentário público. Retorno administrativo pode gerar notificação real.

## 5. Verificações
5.1. Histórico após logout/login, abertura em outro dispositivo, controle de participantes, contadores e exclusão individual/coletiva.
5.2. Tentativa de ler mensagem/notificação de terceiro, link antigo para item privado, duplicação de evento e bloqueio.
