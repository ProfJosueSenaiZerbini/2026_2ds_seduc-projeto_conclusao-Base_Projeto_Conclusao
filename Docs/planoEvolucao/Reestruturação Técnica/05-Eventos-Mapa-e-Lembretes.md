# Eventos, participação, mapa e lembretes

## 1. Eventos x oportunidades
1.1. Evento tem **organizador, natureza, data/hora e local**; chamada profissional pode ser vaga, briefing, seleção ou demanda **sem data/local de evento**. Não fundir esses conceitos sem auditar entidades existentes.
1.2. **Eventos** é nome recomendado para a atual página Oportunidades **caso ela tenha somente eventos**; preservar chamadas que constituam domínio independente.
1.3. Atualizar navegação e links antigos quando a nomenclatura/rota mudar, sem quebrar compartilhamentos.

## 2. Criação e administração
2.1. Um profissional com capacidade de organizar pode cadastrar, editar e administrar **seus** eventos, incluindo tipo, cartaz, descrição, data/hora, local e regras de participação.
2.2. A autorização deve distinguir criação, alteração de evento próprio e gestão de participantes; Consumidor não organiza nem aprova inscrições.
2.3. Validar datas, local e transições no servidor. Expor apenas endereço de evento que possa ser publicamente divulgado.

## 3. Interesse, inscrição e confirmação
3.1. **Tenho interesse** gera vínculo persistido e reversível; não equivale a inscrição, presença confirmada, curtida ou conteúdo salvo.
3.2. A inscrição representa pedido/registro de participação; confirmação representa aceitação ou presença conforme a regra específica do evento.
3.3. Estados mencionados na documentação: `interessado`, `inscrito`, `confirmado`, `rejeitado`, `cancelado`. Eles são **estados de participação**, não o sistema abolido de status artístico da obra.
3.4. Diferenciar eventos de adesão **aberta** e eventos sujeitos a **aprovação** (proposta ainda a validar tecnicamente). Organizador só altera inscrições do próprio evento.
3.5. Consumidor pode se inscrever quando o evento admitir público, mas não como artista/profissional em chamada restrita. Regras de capacidade, prazo e cancelamento permanecem a definir.

## 4. Lista e mapa
4.1. Disponibilizar **Lista | Mapa** na mesma área com filtros integrados. Pinos tipificados por natureza de evento, resumo e acesso à ficha.
4.2. Usar localização persistida e coordenadas verificadas; evento sem posição confiável continua na lista, sem marcador inventado.
4.3. Selecionar provedor considerando gratuidade, licença, atribuição, cobertura, acessibilidade e limite de uso. Provedor **não foi escolhido** nos materiais.
4.4. Filtros de tipo, região e data precisam produzir os mesmos resultados em ambas as representações.

## 5. Salvos, alertas e e-mails
5.1. Salvar evento, ter interesse e estar inscrito são associações **distintas**. Todas devem ser persistidas e consultáveis pela conta.
5.2. Requisito de aviso: **notificações no site no intervalo de até 30 dias antes e no dia do evento**; quando houver intenção efetiva de participação, está previsto aviso por **e-mail** além do site, observando consentimento/preferência.
5.3. **Não está definida a frequência exata** dos avisos no período, o agendador, política de fuso horário, opt-in e cancelamento. Resolver antes de programar disparos.
5.4. Se horário/local/status do evento mudar ou ele for cancelado, atualizar/cancelar lembretes pendentes e informar a pessoa quando pertinente.
5.5. Uma notificação deve abrir a ficha correta, com dados atuais. Não usar histórico desatualizado como se fosse próximo evento.

## 6. Indicadores
6.1. Auditar **Seu rastro na cena** e métricas equivalentes. **Interesse, inscrição, confirmação e presença real** não podem usar o mesmo contador.
6.2. Não afirmar presença em evento por mero clique em Tenho interesse. Exibir números somente de operações rastreáveis.

## 7. Verificação
7.1. Testar evento próprio versus de terceiro, inscrição pública versus profissional, reenvio e duplicidade, alteração e cancelamento de evento, lembrete atualizado e evento sem geolocalização.
7.2. Cards e mapa: [05-Publicar-Obras-Eventos-e-Galerias](../Reestrutura%C3%A7%C3%A3o%20Visual/05-Publicar-Obras-Eventos-e-Galerias.md). Central de notificações: `07-Mensagens-e-Notificacoes.md`.
