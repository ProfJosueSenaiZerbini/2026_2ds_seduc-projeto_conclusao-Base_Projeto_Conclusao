# Cypher — Sistema de Colaborações e Reputação Profissional

> **Especificação de implementação.** Este documento define o comportamento esperado do início ao fim. Não afirma que a funcionalidade já exista no código. Antes de desenvolver, conferir a arquitetura e adaptar os nomes propostos às tabelas, rotas, controladores e convenções efetivamente existentes, sem duplicar funcionalidades.

## 1. Objetivo e regras inegociáveis

1. Permitir que **Profissionais avaliem outros Profissionais somente após uma colaboração formalizada, aceita e concluída** na Cypher.
2. Usar **avaliação recíproca duplo-cega (*double-blind review*)**, com prazo de **14 dias corridos**, contado da conclusão confirmada da colaboração.
3. **Não confundir** conexão social, seguidor, conversa, proposta, crédito em obra e colaboração concluída. Nenhum desses elementos, isoladamente, autoriza avaliações.
4. **Não confundir** avaliação da experiência de trabalhar com alguém com julgamento de talento artístico. O sistema mede conduta colaborativa, não qualidade musical, popularidade ou direitos autorais.
5. **Nunca atribuir nota 0** a quem ainda não recebeu avaliações. Também não classificar automaticamente esse profissional como “Independente”.
6. Exibir **“Ainda sem avaliações”** quando não existir avaliação válida; **“Reputação em formação”** quando existirem avaliações válidas de 1 ou 2 avaliadores distintos; exibir **média pública em estrelas apenas a partir de 3 avaliadores distintos**.
7. Guardar todos os dados relevantes em **SQLite**, com regras e autorizações no **servidor**, transações, histórico e testes HTTP. Não criar botões demonstrativos nem estados que existam apenas no front-end.
8. A reputação deve sobreviver a logout/login, alteração do `@`, atualização de perfil e mudança de profissões; vínculos devem usar o **ID interno imutável do usuário**.
9. Profissionais não podem apagar nem alterar avaliações recebidas. Podem **denunciar e solicitar revisão**; somente moderação autorizada pode restringir ou invalidar uma avaliação, mediante decisão auditável.

## 2. Conceitos que precisam permanecer separados

| Conceito | Significado | Libera avaliação? |
|---|---|---|
| Conexão / seguir / mensagem | Contato ou interesse social | **Não** |
| Crédito proposto | Participação declarada por terceiro, ainda não aceita | **Não** |
| Crédito confirmado | Pessoa aceita a função atribuída em obra, beat, clipe etc. | **Não, isoladamente** |
| Proposta de colaboração | Convite para trabalhar em conjunto | **Não** |
| Colaboração aceita | Ambas as pessoas reconhecem que vão trabalhar juntas | **Não** |
| Colaboração concluída | Trabalho encerrado mediante dupla confirmação válida ou decisão fundamentada da moderação | **Sim**, dentro do prazo de avaliação |
| Reputação | Resultado das avaliações elegíveis já liberadas | Não é certificado de competência |

**Integração obrigatória:** aproveitar, quando pertinente, registros existentes de obras, beats, eventos, créditos e portfólio. Não recriar esses registros para viabilizar o sistema de reputação. Uma colaboração pode referenciar um item existente, mas continua sendo um vínculo próprio, com seu estado próprio. **Nunca reintroduzir estados de obra musical** para representar o andamento da colaboração.

## 3. Quem pode participar

3.1. Somente contas do tipo **Profissional**, ativas e habilitadas, podem propor, aceitar, concluir ou avaliar uma colaboração. A escolha de uma profissão específica não é requisito: Rapper, Beatmaker, Graffiteiro, Fotógrafo, Coreógrafo etc. seguem as mesmas regras básicas.

3.2. Contas **Consumidor** podem visualizar avaliações públicas, mas **não** colaborar formalmente como profissional nem atribuir notas. Contas **Administrativas** não possuem reputação pública e **não** avaliam usuários; atuam somente na moderação, segundo permissões específicas.

3.3. É proibido registrar colaboração consigo mesmo, entre IDs iguais, com conta desativada, com conta que não seja Profissional ou em nome de terceiros sem participação deles.

3.4. Um bloqueio vigente entre as partes impede novos convites. Se o bloqueio ocorrer **depois de uma colaboração validamente concluída**, ele não apaga o registro nem cria avaliação automaticamente; a possibilidade de avaliar segue o prazo original, salvo restrição administrativa fundamentada. A interface não deve permitir contato direto indevido por causa disso.

3.5. A remoção posterior de uma profissão do perfil não apaga participação histórica. Se uma conta perder a condição de Profissional, **novas ações de colaboração/avaliação ficam bloqueadas**; registros anteriores seguem a política de integridade, moderação e privacidade.

## 4. Unidade básica: vínculo entre dois profissionais

4.1. Para a primeira implementação, **cada colaboração avaliável envolve exatamente dois usuários** e um contexto de trabalho. Essa escolha elimina a ambiguidade de um grupo com vários participantes: participar do mesmo projeto não significa necessariamente ter trabalhado diretamente com todos.

4.2. Um projeto de quatro pessoas pode conter diversos vínculos de colaboração **somente entre duplas que efetivamente trabalharam juntas**. A presença de A–B e A–C não cria B–C automaticamente.

4.3. Cada vínculo pode apontar para uma obra, beat, evento ou projeto existente, **sem copiar nem assumir a titularidade** do item. Para trabalhos que ainda não possuem publicação na Cypher (fotografia, identidade visual, clipe, dança, grafite, projeto externo etc.), permitir um contexto descritivo próprio.

4.4. A proposta deve conter: dois participantes; **título/contexto do trabalho**; tipo de projeto; função de cada participante; breve descrição do que fizeram/farão; vínculo opcional com item da Cypher; data ou período aproximado (quando conhecido); visibilidade da associação. O servidor define o proponente pela sessão, nunca por um campo editável do formulário.

4.5. A informação fornecida pelos dois participantes é uma **declaração bilateral**, não prova externa absoluta de que o trabalho aconteceu. A Cypher deve chamar o vínculo de **“colaboração confirmada”**, não “trabalho comprovado por auditoria”. Registrar denúncias e indícios de fraude.

4.6. **Não importar automaticamente créditos ou colaborações antigas como concluídas.** Créditos preexistentes podem servir como sugestão de preenchimento, mas ambos precisam aderir ao fluxo correspondente e a conclusão precisa ser reconhecida. Assim não surgem notas retroativas sem consentimento.

## 5. Estados e transições da colaboração

| Estado | Significado | Próximas ações válidas |
|---|---|---|
| `pendente_aceite` | Convite criado; destinatário ainda não respondeu | Aceitar, recusar, proponente cancelar, expirar |
| `em_andamento` | Convite aceito; colaboração reconhecida | Solicitar conclusão, cancelar por acordo, contestar |
| `conclusao_pendente` | Um participante informou que o trabalho terminou | Outro confirma, informa “ainda não”, contesta ou prazo da solicitação termina |
| `contestada` | Há divergência sobre vínculo ou conclusão | Moderação fundamenta decisão; sem avaliação enquanto pendente |
| `concluida` | Encerramento reconhecido ou excepcionalmente validado | Avaliar até o prazo; denunciar/contestar depois |
| `recusada` | Destinatário rejeitou proposta | Terminal; sem avaliação |
| `cancelada` | Encerrada sem conclusão válida | Terminal; sem avaliação |
| `expirada` | Proposta não respondida no prazo | Terminal; sem avaliação |
| `invalidada` | Moderação comprovou fraude/erro após conclusão | Terminal; avaliações vinculadas deixam de valer |

### 5.1. Criar e aceitar

1. Profissional A escolhe **“Propor colaboração”** e informa B e os dados exigidos. O serviço verifica elegibilidade, bloqueio, contexto e possíveis duplicidades.
2. Ao salvar em transação, cria-se um registro `pendente_aceite`: A já manifesta aceite como proponente; B fica pendente. B recebe notificação persistente com **Aceitar** / **Recusar**.
3. B pode visualizar os detalhes, aceitar ou recusar. A aceitação muda o estado para `em_andamento` e registra data e autor.
4. Convite ainda pendente expira **30 dias corridos** após a criação. O silêncio **nunca** equivale a aceite. Convite vencido não pode ser aceito por link antigo.
5. A pode cancelar convite pendente. Recusa e cancelamento são registrados; **não geram nota negativa** nem avaliação.
6. Impedir duplicidade da **mesma dupla no mesmo item/contexto identificável**. Duas participações reais em projetos diferentes podem gerar vínculos distintos. Se o item e a dupla já possuírem vínculo ativo, mostrar o existente em vez de abrir outro.

### 5.2. Solicitar e confirmar conclusão

1. Qualquer um dos dois participantes de uma colaboração `em_andamento` pode escolher **“Solicitar conclusão”**; o estado passa a `conclusao_pendente`, com data e solicitante.
2. O outro participante recebe notificação e pode escolher:
   - **Confirmar conclusão:** passa para `concluida`; grava o instante real de conclusão confirmada e a data-limite de avaliação (**+14 dias corridos**).
   - **Ainda não concluímos:** volta para `em_andamento`, com registro da resposta; não libera avaliação.
   - **Não reconheço/contesto:** passa para `contestada` e abre solicitação para moderação; não libera avaliação.
3. O autor do pedido **não** pode confirmar o próprio pedido em nome do outro.
4. Uma solicitação de conclusão sem resposta após **30 dias corridos** volta a `em_andamento`, sinalizada no histórico; **não** conclui automaticamente. Evitar reenvio abusivo: no máximo **2 solicitações de conclusão para a mesma colaboração em 30 dias**, contando pedidos recusados ou expirados; novas tentativas nesse período podem ser tratadas pela moderação.
5. Depois da confirmação, o vínculo `concluida` é **imutável para edição comum**. Corrigir fraude, erro de identidade ou dados críticos exige moderação e auditoria, não editar silenciosamente a dupla.
6. Cancelamento de vínculo já aceito requer **consentimento de ambos** ou decisão administrativa motivada. O solicitante registra **“Pedir cancelamento”**; o outro recebe **“Confirmar cancelamento”** / **“Manter colaboração”**. Se confirmar, o estado vira `cancelada`, sem avaliação. Se recusar ou não responder em **14 dias**, a colaboração continua `em_andamento`; a parte que discorda pode contestar. Somente **um pedido de cancelamento por vez**. Não abrir cancelamento enquanto uma conclusão estiver pendente: resolver ou contestar a conclusão primeiro. Não remover a participação unilateralmente para fugir de avaliação.
7. Se a colaboração estiver `concluida`, usuários comuns não podem cancelá-la. Fraude ou erro posterior exigem procedimento de invalidação administrativa; notas já existentes deixam de contar somente após decisão apropriada.

### 5.3. Contestação e decisão administrativa

1. A parte pode contestar convite, autoria do vínculo, conclusão ou participação por um motivo concreto. Registrar tipo, justificativa, evidências opcionais, data e estado da análise.
2. Apenas **Moderador** ou papel explicitamente autorizado pode decidir. Administrador que seja parte interessada não pode revisar seu próprio caso.
3. Resultados permitidos: `em_andamento` (trabalho ainda aberto), `cancelada` (sem prova de conclusão), `concluida` por decisão excepcional fundamentada, ou `invalidada` (fraude/erro comprovado em vínculo anteriormente concluído).
4. **Conclusão excepcional não é automática:** exige registro de evidências suficientes, oportunidade de manifestação da outra parte, decisão identificada e justificativa. Se as evidências forem insuficientes, não liberar avaliações; encerrar sem validação ou devolver ao fluxo normal.
5. Caso haja conclusão excepcional válida, o prazo de 14 dias **começa na decisão**, jamais retroativamente. Notificar as duas partes.
6. Decisões administrativas devem registrar autor, momento, fundamento, alteração e eventual recurso; recurso é analisado por outro responsável autorizado, sempre que possível. Recurso não cria nota nem aumenta poderes de quem o solicitou.

## 6. Envio das avaliações — duplo-cego

6.1. Ao concluir a colaboração, abrir **uma janela de 14 dias corridos** para os dois participantes, com data-limite calculada em UTC (`concluida_em + 14 × 24 horas`). Cada participante pode enviar **uma avaliação dirigida ao outro**.

6.2. Avaliar é **facultativo**. Não avaliar não reduz a nota, não gera penalidade e não impede publicar obras ou utilizar a plataforma.

6.3. As avaliações são **independentes**. Nenhum participante precisa avaliar para permitir que o outro avalie. Não exigir troca de notas como condição.

6.4. A avaliação consiste em **três notas inteiras de 1 a 5**, todas obrigatórias, e **um comentário textual opcional**:

| Critério | O que mede | O que não mede |
|---|---|---|
| Comunicação | Clareza, respeito e disponibilidade durante o trabalho | Carisma, popularidade |
| Cumprimento de combinados | Entregas, prazos acordados e responsabilidades assumidas | Gostos pessoais ou sucesso comercial |
| Trabalho em equipe | Cooperação, disposição para resolver problemas e respeito às contribuições | Talento artístico ou fama |

6.5. Nota individual da avaliação = **média aritmética simples** dos três critérios, com precisão preservada no cálculo (não arredondar antes da média geral). Na interface, quando liberada, apresentar a nota com **1 casa decimal**.

6.6. O formulário deve informar: qual colaboração está sendo avaliada; quem receberá a avaliação; critérios; caráter opcional do comentário; **regra de sigilo até a liberação**; prazo final; impossibilidade de alterar a avaliação após envio. O envio exige confirmação explícita.

6.7. **Depois do envio, não permitir edição, reenvio nem exclusão pelo avaliador.** Isso simplifica a integridade da fase duplo-cega. Erro material ou conteúdo indevido somente por solicitação de revisão administrativa auditável.

6.8. O prazo é **inclusivo até o instante exato do limite** (`agora <= limite`), e expirado apenas quando `agora > limite`. Usar horário confiável do servidor; navegador não decide elegibilidade.

### 6.1. Quando o sigilo termina

- **Ambos enviaram:** as duas avaliações se tornam acessíveis **simultaneamente**, no instante do segundo envio confirmado.
- **Somente um enviou:** aquela avaliação fica sigilosa até completar os 14 dias e então é liberada. A pessoa que não avaliou perde a janela; não pode revidar com nota posterior.
- **Nenhum enviou:** ao fim dos 14 dias, o prazo acaba sem avaliação e sem penalidade.
- **Enquanto estiver lacrada:** nenhum dos dois pode ver nota, comentário, critério, prévia da avaliação do outro ou mudança na média causada por ela. A interface pode indicar apenas **“Avaliação enviada”** para o próprio autor e **“Prazo para avaliar”** para cada elegível, sem revelar se o outro já enviou.
- **Moderação:** acesso excepcional a conteúdo ainda lacrado somente quando tecnicamente necessário para investigar abuso grave, com permissão e trilha de auditoria; esse acesso não muda a data de liberação nem revela conteúdo às partes.

**Dois controles diferentes:** (1) o *duplo-cego* define **quando o conteúdo pode ser revelado às partes**; (2) o mínimo de **3 avaliadores distintos** define **quando a nota média e a lista de avaliações podem aparecer publicamente no perfil**. Um controle não substitui o outro.

### 6.2. Regras após a liberação

1. Cada profissional pode consultar, em área privada, avaliações **recebidas e liberadas**, mesmo que ainda não tenha reputação pública estabelecida.
2. A publicação no perfil segue o mínimo de 3 avaliadores distintos e as regras de privacidade do vínculo (seção 8).
3. Enviar resposta pública à avaliação **não faz parte desta primeira implementação**. Não acrescentar réplicas sem fluxo de moderação próprio.
4. A recusa em avaliar ou a ausência de resposta jamais é mostrada como avaliação negativa.

## 7. Cálculo e estados da reputação

### 7.1. Quais avaliações entram na conta

Contabilizar apenas avaliações que simultaneamente:

- pertençam a colaboração `concluida`;
- tenham sido enviadas por participante habilitado ao outro participante da mesma dupla;
- estejam **liberadas** pela regra duplo-cega;
- estejam ativas (não ocultadas cautelarmente nem anuladas pela moderação);
- não pertençam a vínculo invalidado;
- sejam de autores únicos por direção e colaboração (uma linha por avaliador por colaboração).

**Não usar** notas pendentes/ocultas para computar qualquer média, contador público ou ordenação. Uma avaliação recém-enviada na fase cega não altera o perfil do avaliado.

### 7.2. Como impedir que a mesma pessoa infle a média

Uma dupla pode realizar vários projetos legítimos. Para não permitir que um único colega domine a reputação de alguém:

1. Calcular a nota de **cada avaliação** como média dos três critérios.
2. Para cada **avaliador distinto**, calcular a média de todas as avaliações válidas que ele fez sobre aquele profissional.
3. Calcular a **nota pública do profissional** como a média das médias desses avaliadores distintos.
4. Exibir **1 casa decimal**; armazenar notas originais inteiras, não apenas o resultado arredondado.

Fórmula: `nota_publica = média( média(notas_das_avaliacoes_de_cada_avaliador) )`.

Exemplo: um avaliador que realizou cinco colaborações e outro que realizou apenas uma **têm o mesmo peso final** na média pública. Continuam existindo seis avaliações históricas, mas apenas dois avaliadores distintos; portanto, **a nota pública ainda fica em formação**.

### 7.3. Estados exibidos

| Avaliações válidas liberadas | Avaliadores distintos | Exibição pública |
|---|---:|---|
| 0 | 0 | **Ainda sem avaliações**; usar `—`, nunca `0,0` ou estrelas vazias que sugiram nota zero |
| 1 ou mais | 1–2 | **Reputação em formação**; informar número de avaliações, sem média ou estrelas |
| 3 ou mais | 3+ | **Nota média pública** (1,0 a 5,0), número total de avaliações e número de avaliadores distintos |

A média só aparece se houver **ao menos 3 avaliadores distintos**. Três avaliações da mesma pessoa **não** cumprem o mínimo. Se uma contestação, anulação ou exclusão reduzir o número de avaliadores válidos para menos de três, **retirar imediatamente a média pública** e voltar para “Reputação em formação” ou “Ainda sem avaliações”.

**Não criar:** rótulo “Independente” como resultado da reputação, nota 0 para ausência de dados, classificação “não confiável” para perfis novos, selo automático de profissional verificado ou ranqueamento de talento artístico.

## 8. Perfil público, privacidade e apresentação

8.1. Exibir a seção **“Reputação profissional”** no perfil público de Profissionais, próxima da trajetória/portfólio, sem substituir os dados sobre experiência. Consumidor e Administrador **não** têm reputação profissional.

8.2. Sem avaliações: usar `—` e texto **“Ainda sem avaliações”**. Com 1–2 avaliadores: **“Reputação em formação”**. Com 3+: `4,7 / 5`, estrelas, **N avaliações** e **M profissionais diferentes**. Nunca inventar depoimentos, contagem ou nota.

8.3. Avaliações detalhadas e comentários ficam públicos **somente quando o perfil já atende o mínimo de 3 avaliadores distintos**, e apenas na extensão autorizada pelas regras de visibilidade abaixo. Antes disso, o titular consegue ver privadamente as avaliações liberadas, mas visitantes não recebem seus detalhes.

8.4. Ao criar o vínculo, definir a visibilidade da **associação entre os profissionais**:
- **Pública:** ambos concordam em exibir o vínculo. O proponente faz a solicitação de publicidade e o convidado a confirma no aceite, ou ambos concordam posteriormente; até lá, o padrão é **privado**. A interface pode mostrar trabalho, função e identificação do colega **somente se o próprio item de origem também for público**.
- **Privada:** o vínculo e dados contextuais são acessíveis apenas aos participantes e à moderação autorizada. A avaliação válida pode **contribuir para a média global**, mas **não mostrar publicamente** nome do avaliador, texto, projeto, datas ou outros elementos que revelem o vínculo. No perfil público só aparece seu efeito agregado, quando houver mínimo de três avaliadores. A regra deve ser apresentada e aceita por ambos antes de confirmar a colaboração.

8.5. Uma associação só pode passar de **privada para pública mediante consentimento dos dois participantes**, por pedido e confirmação persistidos. Qualquer participante pode torná-la **privada imediatamente**, sem autorização do outro; uma nova publicação exige ambos consentirem outra vez. Alterar visibilidade **não invalida nota**, apenas altera o que é exposto. A preferência pública no convite não publica o vínculo antes do aceite explícito de B.

8.6. O comentário livre pode citar detalhes sensíveis. Exibir publicamente somente comentários de vínculos públicos, e nunca dados que a obra, o perfil ou o moderador tenham tornado privados. A renderização deve escapar HTML e impedir scripts e links perigosos. Não expor detalhes de avaliações privadas por API, atributo HTML, busca, notificações, card, SEO ou resposta JSON.

8.7. Se uma obra for excluída ou tornada privada, o vínculo pode permanecer para fins históricos, mas **o nome/link e os detalhes derivados dela deixam de aparecer publicamente**. Não criar links quebrados ou atalhos para conteúdo restrito.

8.8. O usuário pode consultar seu histórico privado e acessar **“Denunciar avaliação”** / **“Contestar colaboração”**, mas não alterar avaliações recebidas, ordenar usuários por popularidade de forma artificial ou esconder apenas críticas por preferência.

## 9. Antifraude, moderação e recursos

### 9.1. Prevenção mínima obrigatória

1. **Acordo bilateral:** uma pessoa não cria colaboração reconhecida e não conclui trabalho em nome de outra.
2. **Vínculo contextualizado:** exigir título, natureza do projeto, funções e descrição mínima; bloquear registros vazios e contextos inválidos.
3. **Identidade e elegibilidade:** validar profissional, sessão, participante, estado, titularidade, bloqueios e IDs no back-end a cada operação.
4. **Duplicações:** aplicar unicidade real no banco, transações e revalidação antes de inserir; duplo clique ou reenvio não cria outra colaboração/avaliação.
5. **Limite antispam inicial:** no máximo **20 novos convites por profissional em 24 horas** e no máximo **5 convites para o mesmo destinatário em 30 dias**, incluindo recusados; tentativas repetidas geram erro controlado e registro. A equipe pode revisar limites sem alterar registros históricos.
6. **Análise de padrões suspeitos:** disponibilizar na moderação agrupamento por pares repetidos, conta recém-criada com volume atípico de avaliações e múltiplas conclusões em curto período. Inicialmente **sinalizar para revisão humana**, nunca aplicar punição automática baseada só no padrão.
7. **Sem influência comercial:** compras, seguidores, curtidas, inscrição em evento, contato privado, oferta de beat ou dinheiro **não** concedem avaliações nem aumentam peso da nota.

### 9.2. Denúncias de avaliações

Permitir ao avaliado denunciar uma avaliação liberada por: **ofensa/assédio**, **discriminação**, **exposição de dados privados**, **fraude/colaboração fictícia**, **conteúdo alheio à experiência de trabalho** ou **outro (justificativa obrigatória)**. Esses motivos são uma taxonomia local desta funcionalidade; integrar à política global de denúncias quando esta estiver finalizada, sem substituir decisões gerais pendentes.

A denúncia recebe protocolo, autor, avaliação/vínculo, motivo, texto, anexos ou referências permitidas, momento e estado (`aberta`, `em_analise`, `decidida`, `recorrida`, `encerrada`). Não permitir que qualquer pessoa reporte avaliações privadas de terceiros às quais não possua acesso.

### 9.3. Possíveis decisões

- **Manter:** nenhuma violação confirmada; avaliação continua válida.
- **Ocultar cautelarmente:** indício concreto de risco grave; retirar temporariamente conteúdo e efeito da média, registrar motivo e revisão posterior. **Uma denúncia comum, sozinha, não oculta automaticamente a avaliação.**
- **Ocultar apenas comentário:** conteúdo textual viola regras, mas notas e vínculo seguem válidos; manter pontuação e registrar supressão do texto.
- **Invalidar avaliação:** fraude ou problema substancial confirmado; excluir pontuação do agregado, manter registro interno auditável conforme política de retenção.
- **Invalidar colaboração:** fraude/erro no vínculo reconhecido; invalidar **as duas possíveis avaliações** derivadas dele e recomputar reputação dos dois envolvidos.

O moderador **não substitui a nota original por uma nota de sua preferência**, não cria avaliações em nome de usuários e não pode decidir conflito de interesse próprio. Todas as mudanças devem refletir imediatamente nos agregados e nas telas.

### 9.4. Recurso e integridade

O afetado pode solicitar revisão fundamentada da decisão. Uma revisão por outro responsável autorizado deve consultar histórico e registrar nova decisão, sem apagar a anterior. Reabertura não altera o prazo original de avaliação. O caso `contestada` não libera automaticamente notas antes da decisão.

## 10. Persistência em SQLite — modelo mínimo

**Antes de criar tabelas:** conferir migrações atuais, entidades de créditos, conexões/colaborações, contas, notificações e moderação. Integrar às tabelas existentes quando representam a mesma entidade; não criar uma segunda fonte de verdade.

### 10.1. `colaboracoes`

Campos mínimos propostos:

- `id` (PK), `criada_por_usuario_id` (FK), `estado` (enum validado), `contexto_tipo` (obra/beat/evento/projeto_externo/outro), `contexto_id` (FK opcional para item existente, conforme tipo), `chave_contexto` (identificador estável não nulo), `titulo`, `descricao`, `visibilidade` (publica/privada), `criada_em`, `atualizada_em`.
- `aceita_em`, `solicitacao_conclusao_por_usuario_id`, `solicitacao_conclusao_em`, `concluida_em`, `prazo_avaliacao_em`, `cancelada_em`, `cancelamento_solicitado_por_usuario_id`, `cancelamento_solicitado_em`, `invalidada_em`, `versao` (controle de concorrência).
- Identificadores de participantes preservados no vínculo (tabela abaixo); nada depende do `@` atual.

### 10.2. `colaboracao_participantes`

- `colaboracao_id` (FK), `usuario_id` (FK), `funcao_no_projeto`, `aceite_em`, `visibilidade_aceita_em`, com **UNIQUE (`colaboracao_id`, `usuario_id`)**.
- Exatamente **duas linhas distintas por colaboração**; criar as duas na mesma transação. Somente proponente inicia aceito; convidado confirma depois. Bloquear terceiro participante em vínculos avaliáveis.
- Para colaboração pública, os dois precisam consentir; se não houver dois consentimentos explícitos, manter privada. Uma revogação de visibilidade pública transforma em privada sem apagar notas.

### 10.3. `avaliacoes_colaboracao`

- `id` (PK), `colaboracao_id` (FK), `avaliador_usuario_id` (FK), `avaliado_usuario_id` (FK), `comunicacao` (INTEGER CHECK 1..5), `combinados` (INTEGER CHECK 1..5), `equipe` (INTEGER CHECK 1..5), `comentario` (TEXT opcional; máximo **1.000 caracteres** validado no servidor), `enviada_em`, `estado_moderacao` (`ativa`, `oculta`, `invalidada`), `comentario_oculto` (BOOLEAN), `revisada_em`.
- **UNIQUE (`colaboracao_id`, `avaliador_usuario_id`)**; CHECK `avaliador_usuario_id != avaliado_usuario_id`. Os dois IDs devem coincidir com os participantes do vínculo, validado em transação.
- Guardar notas originais, não só média. A avaliação é **escrita uma vez pelo usuário**, sem UPDATE público após envio.

### 10.4. `contestacoes_colaboracao` e `historico_colaboracao`

- Contestação/denúncia: `id`, `tipo_objeto`, `objeto_id`, `autor_usuario_id`, `motivo`, `detalhes`, `estado`, `revisor_admin_id`, `decisao`, `justificativa_decisao`, `criada_em`, `decidida_em`, `recurso_de_id` (opcional).
- Histórico: `id`, `colaboracao_id`, `autor_id` (ou identificador de sistema), `acao`, `estado_anterior`, `estado_novo`, `justificativa`, `ocorrida_em`, `dados_minimos_json` (sem segredos nem informações privadas desnecessárias).
- Reutilizar módulo administrativo de denúncias, se já houver tabelas que representem esses registros; evitar redundância.

### 10.5. Restrições e consistência

1. **Foreign keys ativas** em SQLite, índices em participantes, estado, prazo de convite/conclusão/avaliação, avaliado e avaliador. Toda mudança composta deve ocorrer em transação.
2. Criar **chave normalizada da dupla** (IDs ordenados) mais `chave_contexto` para impedir duplicidade de vínculo do mesmo trabalho. Para projeto externo sem ID, gerar contexto estável no ato da criação e impedir clonagem de convites para a mesma proposta; propostas independentes sobre supostos trabalhos diferentes continuam sujeitas à análise antifraude.
3. Estados e notas exigem validação de domínio e restrições de banco onde cabível. Não aceitar campos administrativos (`estado`, `concluida_em`, `avaliador_usuario_id`, `estado_moderacao`) arbitrariamente enviados pelo browser.
4. `agora` e datas persistidas em **UTC**. Exibição no fuso do usuário. Regras de prazo usam tempo do servidor, inclusive após reinicialização.
5. Proteger criação de colaborações e avaliações contra requisições simultâneas. `UNIQUE`, validação do estado **dentro** da transação e controle de versão evitam duplas inserções ou dupla confirmação divergente.
6. Em caso de erro de banco, não deixar vínculo parcialmente concluído, nota criada sem vínculo, notificação enviada sem fato correspondente ou índice de reputação divergente.
7. **Não armazenar nota zero como valor padrão.** Ausência de avaliação é ausência de registro; valor não calculável é `NULL`/não disponível.

## 11. Reputação calculada, prazos e notificações

11.1. A reputação deve ser **derivada das avaliações válidas**, e não atualizada por um contador manual desconectado. Pode usar consulta otimizada ou cache, desde que seja invalidado/recalculado na mesma mudança lógica e nunca se torne fonte primária.

11.2. A condição de visibilidade do *double-blind* deve ser verificada **pela consulta/serviço sempre que uma avaliação for lida**: `ambos_enviaram OU agora > prazo_avaliacao_em`. Assim o comportamento continua correto mesmo que nenhum processo agendado tenha rodado.

11.3. Implementar uma rotina interna **idempotente** para processar convites expirados, solicitações de conclusão vencidas, prazo encerrado e notificações de liberação; executá-la na inicialização e periodicamente enquanto o servidor estiver ligado. No acesso à página e em operações sensíveis, revalidar o prazo diretamente do banco como mecanismo de segurança. **Não exigir serviço externo ou dependência nova só para cron.**

11.4. Criar notificações **persistentes** apenas sobre fatos reais: convite recebido, aceite/recusa, conclusão solicitada, conclusão confirmada, janela de avaliação aberta, prazo próximo do fim (por exemplo, **48 horas antes**, se ainda pode avaliar), avaliação liberada e decisão de moderação. Notificações não somem ao serem lidas.

11.5. Cada evento deve ter **chave de deduplicação** (por destinatário + tipo + objeto + ocorrência) para impedir avisos duplicados após restart, reprocessamento ou clique duplo. A notificação durante a fase cega **não pode informar nota, comentário ou se o outro já enviou**.

11.6. Para avisos gerados depois do fim de um prazo, emitir notificação atrasada apenas quando ainda fizer sentido; jamais voltar a abrir uma janela de avaliação por atraso do processamento. Não prometer notificação externa por e-mail sem implementação e consentimento correspondentes.

## 12. Camadas de implementação — MVC existente

Aproveitar **Node.js + TypeScript + Express + EJS + SQLite + JavaScript puro**, mantendo a arquitetura MVC e as convenções reais da Cypher. Os nomes abaixo são **sugestões de responsabilidade**, não uma ordem para reorganizar toda a base:

- **Model:** acesso transacional a colaborações, participantes, avaliações, moderação e históricos; consultas de reputação.
- **Controller:** validar requisição, sessão, papéis, propriedade, estado e transições; decidir resposta; jamais confiar em restrições só da interface.
- **Routes:** endpoints próprios e claros, seguindo padrão e middleware já existente.
- **Views:** cards de perfil, lista de colaborações, convites, confirmação de conclusão, formulário de avaliação e áreas administrativas necessárias.
- **Frontend:** feedback e acessibilidade, sem usar JavaScript do navegador como autoridade para prazo, nota ou permissão.

### 12.1. Endpoints HTTP de referência

| Método e rota sugeridos | Ação | Autorização |
|---|---|---|
| `GET /colaboracoes` | Listar vínculos próprios e pendências | Profissional autenticado |
| `POST /colaboracoes` | Criar convite | Profissional elegível |
| `POST /colaboracoes/:id/aceitar` | Aceitar convite | Convidado |
| `POST /colaboracoes/:id/recusar` | Recusar convite | Convidado |
| `POST /colaboracoes/:id/cancelar` | Retirar convite **ainda pendente** | Proponente |
| `POST /colaboracoes/:id/solicitar-cancelamento` | Pedir cancelamento de vínculo aceito | Participante em `em_andamento` |
| `POST /colaboracoes/:id/confirmar-cancelamento` | Aceitar ou recusar o pedido | Outro participante |
| `POST /colaboracoes/:id/visibilidade` | Solicitar/confirmar publicidade ou restringir a privada | Participante com validação do acordo |
| `POST /colaboracoes/:id/solicitar-conclusao` | Abrir confirmação de término | Um dos dois participantes |
| `POST /colaboracoes/:id/confirmar-conclusao` | Confirmar término | **Outro** participante |
| `POST /colaboracoes/:id/ainda-em-andamento` | Recusar término sem negar vínculo | **Outro** participante |
| `POST /colaboracoes/:id/contestar` | Contestar vínculo/conclusão | Participante |
| `GET /colaboracoes/:id/avaliar` | Formulário próprio dentro da janela | Participante elegível |
| `POST /colaboracoes/:id/avaliacoes` | Enviar nota única | Participante elegível |
| `GET /perfil/:id/avaliacoes` | Consultar reputação pública | Visitante autorizado; dados filtrados |
| `POST /avaliacoes/:id/denunciar` | Reportar conteúdo liberado | Avaliado e outros autorizados conforme visibilidade |
| `GET /admin/reputacao` | Fila de moderação | Moderador autorizado |
| `POST /admin/reputacao/decisoes/:id` | Decidir denúncia/contestação | Moderador autorizado, sem conflito de interesse |

As rotas de consulta não podem retornar dados lacrados em HTML oculto, JSON, parâmetros ou links. POST deve ter validação de sessão, **proteção CSRF**, limites de frequência, autorização sobre o objeto e tratamento seguro de erros. Usar a solução de CSRF da base se existir; se não, implementar proteção compatível com sessões sem adicionar dependência desnecessária.

### 12.2. Telas e ações

1. **Perfil profissional:** estado da reputação; total de avaliações; quantidade de avaliadores distintos; avaliações publicáveis e ação de denúncia.
2. **Minhas colaborações:** abas/filtros **Convites**, **Em andamento**, **Aguardando conclusão**, **Concluídas**, **Contestadas/Encerradas**; cada item mostra contexto, outro profissional, estado e ações válidas.
3. **Propor colaboração:** seleção do profissional, tipo de contexto, papel de cada um, descrição, vínculo opcional e visibilidade; impedir submissão inválida.
4. **Conclusão:** confirmação explícita em duas etapas, sem conclusão por inatividade; permitir resposta “Ainda não concluímos” ou contestação.
5. **Avaliação:** três notas obrigatórias de 1 a 5, comentário opcional, prazo, confirmação final, estado **“Avaliação enviada”**. Nunca mostrar o conteúdo enviado pelo outro durante a fase cega.
6. **Detalhe privado:** participantes veem o histórico pertinente do vínculo e avaliações que já foram liberadas; a visibilidade pública continua obedecendo a seção 8.
7. **Moderação:** fila de casos, evidências, decisões, justificativa obrigatória, efeito na nota e auditoria; acesso restrito.
8. **Responsividade e temas:** funcionar no desktop e mobile, respeitando temas claro/escuro e identidade visual da Cypher, sem poluir o perfil com métricas vazias.

## 13. Regras de segurança e abuso

1. Ação de alteração depende de **sessão autenticada, tipo Profissional, titularidade, estado esperado e acesso ao vínculo**. Conhecer um ID ou uma URL não autoriza agir.
2. Aplicar **CSRF**, escapar saídas EJS, sanitizar entradas textuais, validar comprimento/enumeração e não interpolar SQL com parâmetros do usuário. Usar queries parametrizadas.
3. Não retornar notas, comentários, notificações ou identidades de vínculo privado para terceiros por rota alternativa, preload, log público ou contagem agregada antes da liberação.
4. Login como Administrador não transforma conta administrativa em avaliador. Ações administrativas exigem RBAC por permissão específica e auditoria; UI não é segurança.
5. Monitorar e limitar convites, tentativas de avaliação fora de prazo, denúncias repetidas e URLs enumeradas. Responder com códigos apropriados (`400`, `401`, `403`, `404`, `409`, `422`, `429`) conforme a causa, sem revelar dados privados.
6. Se uma conta for suspensa por fraude de reputação, aplicar decisão explícita sobre avaliações envolvidas e recomputar agregados; **não apagar por padrão todo o histórico lícito** de um usuário apenas por existir uma denúncia.
7. Exclusão/encerramento de conta deve respeitar a política geral de retenção e privacidade da Cypher. Até essa política estar fechada, **não desenvolver exclusão destrutiva automática de avaliações** nem conservar dados pessoais indefinidamente por suposição: integrar o caso a um fluxo controlado e documentado. Se uma avaliação for legalmente/administrativamente invalidada ou removida, tirá-la imediatamente da contagem pública.

## 14. Ordem obrigatória de desenvolvimento

1. **Levantamento do código real:** localizar autenticação, tipos de conta, permissões, créditos, notificações, perfis, migrations, telas e testes; registrar o que será reutilizado. Não substituir SQLite nem reestruturar todo o projeto.
2. **Migrações e modelos:** criar/adaptar tabelas, FKs, índices, invariantes, estados e histórico; testar migração com banco vazio **e banco já populado**, sem apagar dados reais.
3. **Fluxo de colaboração:** criação, aceite, recusa, expiração, conclusão, resposta “ainda não”, cancelamento por acordo e contestação. **Nenhuma avaliação antes dessa etapa funcionar integralmente.**
4. **Módulo de moderação mínimo funcional:** fila, justificativas, decisões, auditoria, suspensão/invalidação e permissões reais. Não liberar avaliações públicas sem capacidade de tratar abuso.
5. **Avaliação duplo-cega:** prazo de 14 dias, submissão única, sigilo, liberação conjunta ou por prazo, sem dependência de front-end.
6. **Reputação:** filtro de avaliações válidas, média por avaliador distinto, limite mínimo de 3, estados sem zero e atualização quando houver invalidação.
7. **Integração nas telas:** perfil, detalhe da colaboração, notificações persistentes e estado privado/público, incluindo privacidade de obras vinculadas.
8. **Testes automatizados HTTP + SQLite:** executar matriz abaixo e corrigir falhas antes de declarar implementado.
9. **Revisão final:** navegar pelos perfis/rotas/links para retirar referências obsoletas e eliminar simuladores anteriores, se houver; atualizar documentação e casos de uso.

## 15. Matriz mínima de testes de aceite

### Colaboração

- [ ] Profissional A convida B, B recebe notificação persistente e aceita; estado muda para `em_andamento`.
- [ ] Consumidor, Administrador, usuário desativado ou usuário sem sessão não consegue propor/avaliar.
- [ ] A não cria colaboração consigo mesmo, nem em nome de B, nem usa ID arbitrário de terceiro.
- [ ] Proposta recusada, cancelada ou expirada após 30 dias não libera avaliação.
- [ ] Dois POSTs simultâneos/duplo clique não geram vínculo duplicado.
- [ ] Créditos confirmados, curtidas, conexão e mensagens **não** autorizam avaliação.
- [ ] Projeto com três pessoas não dá a cada uma o direito automático de avaliar todas as outras; somente duplas formalizadas.
- [ ] A pede conclusão; B responde “ainda não” e avaliação continua bloqueada.
- [ ] A pede conclusão; A tenta confirmar pelo endpoint de B e recebe acesso negado.
- [ ] A pede conclusão; B confirma e abre prazo de 14 dias para ambos.
- [ ] Cancelamento após aceite exige confirmação do outro; silêncio e recusa não cancelam trabalho.
- [ ] Tentativa de cancelamento de colaboração já concluída é bloqueada para usuários comuns.
- [ ] A mudança de privada para pública exige dois consentimentos; restringir para privada por um dos dois produz efeito imediato.
- [ ] Pedido sem resposta por 30 dias não conclui sozinho; limite de reenvio funciona.
- [ ] Contestação impede avaliação e só decisão administrativa elegível encerra o caso.
- [ ] Invalidação posterior desativa todas as avaliações daquele vínculo.

### Double-blind e prazos

- [ ] B envia nota primeiro; A não vê que B enviou nem o conteúdo, e sua reputação pública não muda.
- [ ] A e B enviam dentro do prazo: conteúdo é liberado simultaneamente, não antes.
- [ ] Só B envia: a nota é liberada após prazo de 14 dias, sem permitir avaliação tardia de A.
- [ ] Nenhum envia: não existe nota zero, perda de reputação ou punição.
- [ ] Terceiro, browser devtools e endpoint direto não conseguem ler nota lacrada.
- [ ] Nota inválida (`0`, `6`, decimal, campo ausente) e comentário acima do limite são rejeitados.
- [ ] Segunda avaliação da mesma direção é rejeitada inclusive com POST concorrente.
- [ ] No instante limite, a regra de inclusão/exclusão do prazo é coerente no backend.
- [ ] Reiniciar servidor, alterar fuso no navegador ou desativar JavaScript não altera prazos nem sigilo.

### Reputação e privacidade

- [ ] Zero avaliações válidas: `—` e **“Ainda sem avaliações”**, sem estrelas nem `0,0`.
- [ ] Uma avaliação válida ou duas de pessoas diferentes: **“Reputação em formação”**, sem média pública.
- [ ] Três avaliações de uma única pessoa: **não** liberam média pública.
- [ ] Três avaliadores distintos: média calculada com peso igual por avaliador; contadores corretos.
- [ ] Mesmo avaliador fez múltiplos trabalhos: influência total desse avaliador não cresce indevidamente.
- [ ] Avaliação ainda lacrada não entra em média, contador público nem resultado de busca.
- [ ] Titular vê privadamente suas avaliações já liberadas mesmo antes de três avaliadores; visitante não vê detalhes.
- [ ] Colaboração privada contribui para agregado quando válida, mas não revela nomes, comentário ou projeto a terceiros.
- [ ] Vincular item privado/excluído não expõe o título nem mídia desse item no perfil ou nas notificações.
- [ ] Dupla muda `@` ou profissão: vínculos permanecem com os IDs internos corretos.
- [ ] Anulação/ocultação de avaliação reduz média e, se cair abaixo de três avaliadores, devolve estado “em formação”.

### Moderação, segurança e consistência

- [ ] Usuário não consegue excluir crítica recebida nem editar nota já enviada.
- [ ] Denúncia normal não apaga automaticamente avaliação; moderação aplica apenas decisão permitida.
- [ ] Moderação de comentário pode ocultar somente texto sem zerar nota válida.
- [ ] Administrador não atua no próprio conflito; ações e recursos deixam histórico auditável.
- [ ] POST sem CSRF válido, sem sessão ou contra vínculo de terceiro é bloqueado.
- [ ] Convites em excesso respeitam limites e recebem erro controlado.
- [ ] Notificações são geradas uma vez, preservadas depois de lidas, sem revelar notas lacradas.
- [ ] Migração sobre banco existente preserva usuários, obras, créditos, sessões e notificações anteriores.
- [ ] Falha de transação não cria meia colaboração, meia avaliação ou contagem divergente.
- [ ] Telas desktop/mobile e claro/escuro funcionam sem mock de dados persistentes.

## 16. Critério para retirar do STAND-BY

A funcionalidade só passa para **IMPLEMENTADO** quando os seguintes pontos forem demonstráveis no código e nos testes:

1. Colaborações **reais e persistidas** com duas partes, aceite, encerramento bilateral e contestação.
2. Avaliações **somente de vínculos elegíveis**, dentro dos 14 dias, com três critérios, envio único e sigilo duplo-cego efetivo no **servidor**.
3. Exibição sem nota zero; reputação em formação para 1–2 avaliadores; média pública apenas com **3+ avaliadores distintos**, calculada sem inflar influência de uma mesma pessoa.
4. Respeito aos níveis de visibilidade e à integridade dos créditos, obras e portfólio.
5. Moderação de abusos, invalidação e recálculo reais; notificações persistentes; RBAC e testes de segurança.
6. Compatibilidade com a infraestrutura atual da Cypher, sem dados fictícios, sem duplicar entidades e sem regressões no restante da plataforma.

**Resultado esperado:** um profissional sem avaliações não recebe rótulo negativo; um profissional avaliado tem uma reputação baseada em experiências de colaboração confirmadas; e nenhuma pessoa consegue fabricar, retaliar, publicar antecipadamente, alterar ou remover notas sem passar pelas regras reais da Cypher.
