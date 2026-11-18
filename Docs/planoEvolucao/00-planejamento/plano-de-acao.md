# Cypher — Plano de ação para evolução

Data: 16/11/2026. Estado: proposta de execução; nenhuma etapa autoriza por si só uma alteração na aplicação.

**Atualização de execução:** etapas 0, 1 e 2 concluídas. Ver [resultado da etapa 2](../04-implementacao/etapa-2-cadastro-identidade-e-privacidade.md). O usuário esclareceu que esta é uma base de desenvolvimento sem público; autorizou refazê-la e determinou que o acesso inicial do Super Admin seja configurado internamente, sem comando de criação. A etapa 1 aplicou permissões por contexto profissional, recriou a base no schema 21 e registrou [lacunas de expressão profissional](../02-dominios/lacunas-de-expressao-profissional.md). Ver [resultado da etapa 1](../04-implementacao/etapa-1-contas-permissoes-e-migracao.md).

## 1. Objetivo e referências

Evoluir a Cypher em entregas pequenas e verificáveis, preservando a identidade da plataforma, os registros legítimos e os fluxos que já funcionam.

- **Aplicação atual:** `../../Cypher/`.
- **Requisitos futuros:** esta pasta `planoEvolucao`.
- **Escopo consolidado:** [plano-de-evolucao.md](plano-de-evolucao.md).
- **Catálogo pretendido:** [profissoes-e-relacoes.md](../02-dominios/profissoes-e-relacoes.md).
- **Decisões do usuário durante a execução:** prevalecem sobre propostas anteriores; registrar mudanças de escopo no pacote correspondente.

Este documento organiza a execução. Não substitui as especificações dos domínios nem transforma sugestões ou pontos “A DEFINIR” em decisões aprovadas. Havendo dúvida sobre o pedido, solicitar especificação antes da alteração dependente; continuar apenas o trabalho independente da resposta.

## 2. Ponto de partida observado no código

| Área | Situação observada | Tratamento na evolução |
|---|---|---|
| Stack | Node.js, TypeScript, Express, EJS, SQLite e JavaScript vanilla | Manter; introduzir dependências somente com necessidade concreta |
| Contas | Cadastro profissional/organizador, autenticação e sessões | Adaptar para Consumidor, Profissional e Administrativo |
| Administração | Acesso por allowlist de e-mails, revisões e exceções | Migrar com cuidado para identidade administrativa e papéis próprios |
| Profissões | 36 profissões; quatro perguntas por profissão | Migrar para 26; uma pergunta obrigatória no cadastro |
| Perfil | Edição por seções, privacidade, busca e página pública | Adaptar identidade, módulos profissionais e políticas de visibilidade |
| Navegação | Sidebar expandida no desktop, status profissional, Visão Geral | Adaptar para sidebar recolhida, remover status e substituir a página inicial |
| Obras | CRUD, créditos e publicação associada ao status “Lançado” | Desacoplar visibilidade antes de retirar os status antigos |
| Beats | Catálogo, licenças e ofertas persistidas | Evoluir apresentação e integração; não presumir checkout existente |
| Eventos | CRUD, interesse e atualização de participantes | Aproveitar a base; evoluir agenda, links, mapa e lembretes |
| Notificações | Persistência, leitura individual e em lote | Ampliar os eventos geradores e as preferências |
| Central | FAQ estática fornecida pelo model | Evoluir para artigos, gestão editorial e qualidade |
| Relações e mídia | Créditos existentes; demais módulos exigem implementação ou auditoria específica | Não apresentar mensagens, seguidores, galerias ou reputação calculada como concluídos |

**Atualização da etapa 0 (16/11/2026):** dependências instaladas; compilação, nove comandos de verificação e execução HTTP validados. Banco auditado em modo somente leitura, com uma conta a preservar; recuperação testada em cópia. Não foi encontrado Git na raiz nem em `Cypher`. Existem pontos com `@ts-nocheck`, inclusive na persistência; `strict` no tsconfig não garante cobertura integral desses arquivos. Evidências e limites: [diagnóstico da etapa 0](etapa-0-diagnostico.md).

## 3. Regras de execução

1. Antes de cada pacote, rastrear tela → script/CSS → rota → controller → validação → model → banco → consumidores dos dados.
2. Descrever o comportamento atual e o resultado desejado antes de editar.
3. Preservar dados reais quando houver. Nesta base de desenvolvimento, o usuário autorizou recriação dos dados de teste; a etapa 1 usou essa autorização. Não presumir que a mesma política valerá quando existir público ou ambiente de produção.
4. Separar conta, profissão, permissão, publicação, visibilidade, crédito e moderação. Uma alteração em um conceito não altera os demais implicitamente.
5. Entregar incrementos funcionais completos, sem botões que apenas simulam operações persistentes.
6. Refatorar apenas o necessário para o pacote: não exigir reescrita geral do MVC como pré-requisito.
7. Manter o histórico documental. Backlogs antigos, inclusive pedidos de visitante ou status, não prevalecem automaticamente sobre o escopo consolidado.
8. Executar a próxima etapa quando solicitada; este plano não inicia implementação, publicação, instalação ou exclusão.

## 4. Sequência de entregas

As fases abaixo indicam dependências, não sprints com duração estimada. A duração depende das decisões de produto, da validação inicial e do tamanho efetivo de cada pacote.

### Fase 0 — Base verificável e proteção dos dados

**Entregas:**

- 0.1 Confirmar se `data/cypher.sqlite` contém registros que precisam ser preservados; preparar cópia de segurança antes de qualquer migração e verificar restauração em cópia isolada.
- 0.2 Preparar as dependências e executar os comandos existentes de verificação e testes. Registrar falhas anteriores às mudanças.
- 0.3 Inventariar rotas, tabelas, versões de schema, permissões, indicadores e operações que hoje apenas exibem avisos.
- 0.4 Definir um mecanismo de recuperação dos arquivos, considerando a ausência de Git nesta cópia. Não incluir banco ou segredos no versionamento.
- 0.5 Registrar a linha de base: implementado, parcial, ausente, decisão pendente ou stand-by.

**Aceite:** aplicação executável em ambiente conhecido, resultado dos testes registrado, banco original preservado e caminho de recuperação verificado. **Concluída em 16/11/2026**, conforme [diagnóstico e evidências](etapa-0-diagnostico.md).

### Fase 1 — Identidades, autorização e catálogo profissional

**Dependência:** fase 0 e decisões aplicáveis sobre permissões, contas e migração.

- 1.1 Definir a matriz Consumidor × Profissional × Administrativo, incluindo permissões por ação e recurso. Separar criação de item do gerenciamento de itens já pertencentes à conta.
- 1.2 Implementar acesso administrativo interno com três papéis; primeiro Super Admin configurado em `.env.local` e provisionado automaticamente, sem comando de criação nem privilégio por allowlist.
- 1.3 Atualizar o catálogo para 26 profissões em sete áreas; renomear Freestyler para Freestyleiro; retirar as dez opções excluídas da nova seleção.
- 1.4 Recriar a base de desenvolvimento, conforme esclarecimento do usuário, sem conversão de contas de teste ou manutenção de compatibilidade legada. Rever a política quando houver dados reais.
- 1.5 Restringir vertentes profissionais específicas ao Rapper; manter a taxonomia das obras independente das escolhas do perfil.
- 1.6 Estruturar naturezas de conta e relações com IDs estáveis, distinguindo o ID Cypher público do identificador `@`; conta administrativa não possui identidade artística pública.
- 1.7 Definir e implementar proteção das ações de escrita, limitação das tentativas de autenticação e autorização administrativa compatíveis com os novos fluxos.

**Código principal:** `modeloPerfil.ts`, `modeloProfissionalPersistido.ts`, `bancoDados.ts`, `autenticacaoCypher.ts`, controllers de autenticação/administração e middleware compartilhado.

**Aceite:** permissões verificadas no servidor; novas seleções contêm somente o catálogo vigente; dados históricos preservados; consumidor não publica nem recebe privilégios por manipulação do formulário.

**Referências:** GER-01/09, CAD-08/09, PER-03/04, ADM-01/02/05; D-01 e D-08.

### Fase 2 — Cadastro, identidade pública, perfil e privacidade

**Dependência:** contratos de conta e autorização da fase 1. Cadastro com idade depende da política etária definida.

- 2.1 Adaptar o cadastro para Consumidor e Profissional; consumidor conclui sem questionário profissional.
- 2.2 Separar nome informado, vulgo opcional, nome público e `@`; implementar unicidade e regras de alteração aprovadas.
- 2.3 Reduzir o cadastro a tempo de atuação por profissão. Manter informações adicionais na edição, preservando respostas existentes.
- 2.4 Adaptar validação e persistência: não basta esconder as três perguntas adicionais no navegador.
- 2.5 Evoluir edição por seções e módulos por profissão; preservar a possibilidade de editar dados pessoais sem alterar categorias.
- 2.6 Implementar ativação profissional na mesma conta e a regra da primeira alteração livre seguida pelo intervalo de 60 dias, conforme escopo; manter exceções auditadas.
- 2.7 Definir visibilidade para novas contas e tratamento das existentes, sem tornar perfis privados públicos automaticamente. Ajustar busca, HTML, JSON e conteúdos vinculados.
- 2.8 Reorganizar configurações em Conta e segurança, Identidade pública, Privacidade, Descoberta e Aparência, ativando preferências apenas quando tiverem efeito real.

**Código principal:** `questionarioAtuacao.ts`, `validarPerfil.ts`, `controladorCompatibilidade.ts`, `bancoDados.ts`, páginas de cadastro/perfil/configurações, `questionario-atuacoes.js` e `perfil-edicao.js`.

**Aceite:** cadastro completo nas duas modalidades; respostas antigas preservadas; apenas tempo obrigatório no cadastro; privacidade aplicada em todas as saídas; categorias e datas não podem ser burladas por POST manual.

**Referências:** CAD-01–07/10–12, PER-01/02/04/07/08, CFG-01/02/04/05; D-01.

### Fase 3 — Sidebar, navegação e transição da página inicial

**Dependência:** fase 1 para menus por identidade; dados e regras de visibilidade da fase 2 para Descoberta.

- 3.1 Sidebar recolhida com ícones no desktop, expansão ao hover e acesso equivalente por teclado; sem botão fixo desktop e sem deslocar o conteúdo principal.
- 3.2 Navegação por toque no celular, indicação de rota ativa e opção Mais na parte inferior.
- 3.3 Remover o sistema de status profissional e suas dependências exclusivas, incluindo campos e filtros; preservar dados com outra finalidade.
- 3.4 Preparar Descoberta básica com dados reais já disponíveis e estados vazios. Substituir a Visão Geral somente quando o novo destino estiver funcional.
- 3.5 Definir tratamento de `/dashboard` e demais links antigos; renomear Oportunidades para Eventos após confirmar o alcance do domínio.
- 3.6 Auditar reputação e indicadores visíveis: não exibir pontuação sem cálculo válido nem introduzir o módulo de avaliações nesta fase.

**Código principal:** `barra-lateral.ejs`, `barra-superior.ejs`, `estrutura.css`, `responsivo.css`, `tema.css`, `interacoes.js`, dashboard, rotas e campos de disponibilidade.

**Aceite:** navegação utilizável em desktop, teclado e celular; temas claro/escuro; nenhum status profissional residual; links antigos tratados; página inicial funcional sem números fictícios.

**Referências:** NAV-01–03, DES-01 básico, GER-03/04, IND-01.

### Fase 4 — Obras, taxonomia musical e visibilidade independente

**Dependência:** fases 1–2 e definição de como exibir/publicar conteúdo sem os status antigos.

- 4.1 Rastrear usos de `situacao`, `publicada`, “Lançado”, “Rascunho” e “Em produção” em filtros, perfis, participações, estatísticas e permissões de colaboradores.
- 4.2 Definir e migrar critérios de publicação/visibilidade sem criar outro status artístico equivalente. Preservar a privacidade dos itens existentes.
- 4.3 Retirar status de obras, card Em andamento e dependências exclusivas após adaptar todos os consumidores.
- 4.4 Consolidar gêneros, tipos e vertentes; retirar campos livres Outro nas taxonomias previstas e tratar os valores históricos sem perda de informação legítima.
- 4.5 Criar fichas e URLs estáveis para obras/beats, com compartilhamento que respeita a visibilidade e metadados técnicos recolhíveis.
- 4.6 Especificar composição versus fonograma e vínculos ISRC/ISWC antes de ampliar o modelo. Preservar os campos existentes durante a transição.

**Aceite:** nenhuma exposição causada pela remoção de status; CRUD e participações preservados; links abrem o item correto; códigos musicais não são confundidos ou gerados artificialmente.

**Referências:** OBR-01–05, BEA-01, GER-08; D-10.

### Fase 5 — Mídia, galerias e central de publicação

**Dependência:** fases 1, 2 e 4; política de armazenamento, formatos, limites e moderação definida.

- 5.1 Definir armazenamento e ciclo de vida de arquivos; validar tipo, tamanho, acesso e referências de mídia.
- 5.2 Implementar foto/capa e imagens dos itens, com fallback, sem depender de mídia fictícia.
- 5.3 Entregar galerias e os primeiros tipos de trabalhos não musicais com permissões e persistência completas.
- 5.4 Criar a central de publicação, com nome a confirmar, reutilizando obras, beats e eventos existentes. Não duplicar registros para cada vitrine.
- 5.5 Evoluir modalidades de áudio/vídeo conforme infraestrutura aprovada; compra e checkout não entram por associação ao Banco de Beats.

**Aceite:** upload ou vínculo externo funciona conforme a política; itens continuam acessíveis após recarga; publicação não duplica conteúdo; remover arquivo não quebra registros ainda dependentes dele.

**Referências:** GER-05, MID-01, PUB-01–04, PER-07; D-12.

### Fase 6 — Créditos confirmáveis e relações profissionais

**Dependência:** identidades estáveis, autorização e registros de conteúdo definidos.

- 6.1 Especificar proposta, aceite, rejeição, correção, contestação e histórico de créditos.
- 6.2 Implementar notificações necessárias aproveitando a base existente; garantir operações repetidas sem duplicação.
- 6.3 Separar menção sem conta, crédito pendente, crédito confirmado e colaboração formal.
- 6.4 Atualizar participações e a definição de colaborador autorizado conforme regra aprovada, sem expor respostas privadas apenas por citação unilateral.

**Aceite:** terceiros não confirmam em nome da pessoa creditada; vínculos sobrevivem à mudança de `@`; participações não confirmadas são identificadas corretamente; nenhuma reputação é concedida automaticamente.

**Referências:** OBR-06, POR-05, P-07/P-14; D-03.

### Fase 7 — Interações sociais, busca e moderação

**Dependência:** fases 1–2 e identidade estável dos alvos; regras de bloqueio, denúncia e comentários definidas antes da exposição pública.

- 7.1 Seguir/deixar de seguir profissionais e curtir/descurtir perfil como ações distintas; depois aplicar curtidas e salvos aos itens previstos.
- 7.2 Comentários persistidos, com regras aprovadas de edição, exclusão, respostas e moderação.
- 7.3 Ampliar Busca para os domínios previstos, com filtros reais, paginação e privacidade.
- 7.4 Implementar denúncias, bloqueios e ações administrativas necessárias a cada interação, com histórico.

**Aceite:** contadores derivam do banco; duplo clique não duplica vínculo; acesso direto a rota proibida é recusado; exclusões e bloqueios têm efeito consistente em busca, perfil e itens.

**Referências:** GER-06/07, PER-05, BUS-01–03, ADM-03/04; D-06 e D-08.

### Fase 8 — Portfólio profissional

**Dependência:** fases 5–6 e regras de visibilidade.

- 8.1 Modo Manual: selecionar, ordenar e ocultar itens existentes, sem duplicá-los.
- 8.2 Moldes de apresentação apropriados às áreas; separar escolha visual da seleção de conteúdo.
- 8.3 Modo Inteligente: incorporar itens elegíveis e créditos confirmados, preservando ocultações do titular.
- 8.4 Exibir resumo no perfil e acesso ao catálogo completo, distinguindo autoria de participação.

**Aceite:** modo, molde e ordenação persistem; crédito pendente não vira colaboração confirmada; item privado não aparece na vitrine; uma conta pode apresentar múltiplas profissões sem múltiplos perfis.

**Referências:** POR-01–06, PER-06; D-04.

### Fase 9 — Comunicação e evolução de eventos

**Dependência:** identidades, autorização, privacidade e base de notificações; cada subpacote possui suas decisões próprias e pode avançar independentemente do portfólio.

- 9.1 Mensagens persistidas: conversas, participantes, envio, histórico e leitura; definir bloqueios, acesso e exclusão.
- 9.2 Painel flutuante no canto inferior direito e página completa sobre as mesmas conversas; contagem real de não lidas.
- 9.3 Preferências e eventos geradores de notificações; contato persistente com a equipe e filas correspondentes.
- 9.4 Evoluir fichas de eventos, URLs próprias, agenda e regras de interesse/inscrição/confirmação já existentes.
- 9.5 Mapa com filtros integrados, localização autorizada e alternativa em lista. Escolher provedor após verificar condições vigentes.
- 9.6 Lembretes com calendário, fuso, cancelamento e mecanismo real de agendamento. Não usar timer apenas no navegador.

**Aceite:** histórico preservado após fechar painel/reiniciar servidor; terceiros não acessam conversas; lista e mapa mostram os mesmos eventos elegíveis; cancelamentos impedem lembretes indevidos; sobreposições funcionam nos dois temas.

**Referências:** MSG-01–03, NOT-01/02, EVE-01–06; D-07 e D-11.

### Fase 10 — Selos pessoais

**Dependência:** fases 5–6, regra de titularidade e política de versões aprovadas.

- 10.1 Especificar criação, edição, substituição e armazenamento do selo pessoal.
- 10.2 Associar selo a autoria ou participação reconhecida; não aceitar atribuição arbitrária em trabalho alheio.
- 10.3 Aplicar em obras, beats, eventos e trabalhos visuais conforme elegibilidade; implementar moderação e histórico.

**Aceite:** selo não concede verificação profissional nem reputação; vínculos respeitam autoria, confirmação e privacidade; atualização do selo segue política histórica explícita.

**Referências:** SEL-01–06; D-02.

### Fase 11 — Descoberta contextualizada e Cypher Central

**Dependências:** Descoberta depende de conteúdos, preferências e sinais reais; Central editorial depende de autorização administrativa. Os dois ramos podem evoluir separadamente após suas fundações.

- 11.1 Expandir Descoberta básica com região, interesses e filtros; depois incluir recomendações com critérios explícitos e dados suficientes.
- 11.2 Substituir FAQ como estrutura principal por artigos e guias de áreas/profissões; criar editor, categorias, publicação e arquivo.
- 11.3 Implementar busca, recentes, feedback de utilidade e qualidade educativa com métricas verificáveis.
- 11.4 Integrar preferências de Descoberta e manter consentimentos e visibilidade coerentes.

**Aceite:** não recomendar itens privados; não inventar afinidade ou métricas; somente papel autorizado publica artigos; feedback e buscas alimentam análises reais.

**Referências:** DES-01/02, CFG-03, CEN-01–08; D-05 e D-09.

### Fase futura — Colaborações formais, avaliações e reputação

**Estado:** STAND-BY, salvo pedido explícito para avançar e definição do pacote.

Consultar [colaboracoes-e-reputacao.md](../02-dominios/colaboracoes-e-reputacao.md). Não deduzir avaliação a partir de curtida, mensagem ou crédito. A especificação detalhada existente exige colaboração elegível, conclusão bilateral, sigilo das avaliações, moderação e cálculo verificável. Sua existência documental não significa implementação.

## 5. Decisões a resolver perto da execução

Não é necessário responder tudo agora. Resolver cada decisão antes do primeiro pacote que depende dela; manter as demais registradas.

| Decisão | Primeiro ponto dependente | Referência do escopo |
|---|---|---|
| Dados atuais a preservar e recuperação dos arquivos | Resolvida: base de desenvolvimento pode ser refeita; backups locais mantidos | GER-02, P-16 |
| Matriz profissão × ação; gestão de conteúdos após retirar profissão | Fase 1 | P-05/P-16 |
| Provisionamento de Super Admin, papéis e migração da allowlist | Resolvida na fase 1: configuração local interna e contas administrativas separadas | P-20/P-21 |
| Idade mínima, menores e dados pessoais necessários | Resolvida para desenvolvimento: 18 anos até as proteções necessárias para 16/17; nascimento privado | P-01 |
| Privacidade do consumidor e de contas profissionais existentes | Fase 2 | P-02, CFG-02 |
| Prazo de mudança de `@`, histórico e exceções | Resolvida: 30 dias, endereços anteriores reservados e exceções auditadas | P-15/P-23 |
| Desativação profissional e retorno a consumidor | Pacote de conversão reversa | P-03 |
| Nome Produtor(a) versus Produtor(a) musical | Exibição do catálogo da fase 1 | P-06 |
| Publicação/visibilidade sem status artístico; taxonomia definitiva | Fase 4 | OBR-01, P-17 |
| Armazenamento, formatos e limites de mídia; nome Publicar | Fase 5 | P-18, PUB-01 |
| Confirmação de créditos e significado de colaborador autorizado | Fase 6 | P-07/P-14 |
| Curtir perfil, comentários, bloqueios, exclusões e recursos | Fase 7 | P-04/P-10/P-21/P-24 |
| Portfólio por área e ocultações | Fase 8 | P-22 |
| Acesso/exclusão de mensagens e eventos geradores de aviso | Fase 9 | P-19/P-24 |
| Eventos versus chamadas; mapa; calendário dos lembretes | Pacotes de eventos da fase 9 | P-11/P-12/P-13 |
| Titularidade do selo e apresentação de versões históricas | Fase 10 | P-08/P-09 |
| Critérios de recomendação e dados mínimos | Fase 11 | DES-02 |

Há divergências entre documentos preservados. Exemplo: a interface do consumidor é descrita como privada em um arquivo, enquanto o consolidado ainda registra política pendente. Tratar a recomendação como proposta até a decisão do usuário, sem escolher silenciosamente a fonte mais conveniente.

## 6. Critério de conclusão de cada pacote

- Pedido e resultado esperado estão claros; ambiguidades relevantes foram resolvidas.
- Rotas, autorização, validação, persistência e interface estão integradas quando aplicáveis.
- Migrações foram verificadas em cópia de banco existente e banco novo, sem perda dos vínculos legítimos.
- Testes apropriados ao impacto passaram; problemas anteriores e limites da validação foram registrados.
- Para mudanças visuais, verificar desktop, celular, teclado, claro/escuro, estados vazios, erro e carregamento pertinentes.
- Dados privados não aparecem em saídas de terceiros; operações repetidas não geram registros indevidos.
- Remoções incluem busca por referências antigas e verificação dos usos restantes.
- Registrar o que mudou, arquivos afetados, como foi verificado, pendências e recuperação quando houver alteração de dados.

Comandos já disponíveis em `Cypher`: `npm run check`, `npm run build`, `npm run test:db`, `npm run test:admin-ui`, `npm run test:catalog`, `npm run test:questionnaires`, `npm run test:persistence`, `npm run test:relations` e `npm run test:profile-relations`. Selecionar os relevantes por pacote; atualizar expectativas antigas quando a regra mudar deliberadamente, sem mascarar regressões. Acrescentar testes de fluxo e autorização quando os existentes não cobrirem a mudança.

## 7. Controle das próximas entregas

Usar os estados **Não iniciado → Em análise → Aguardando definição / Em execução → Em validação → Concluído**. Uma fase não fica concluída só porque sua interface foi criada.

| Pacote inicial | Estado | Próxima evidência necessária |
|---|---|---|
| 0 — Base verificável | Concluído | Evidências no diagnóstico da etapa 0 |
| 1 — Contas, permissões e 26 profissões | Concluído | [Resultado, testes e limites](../04-implementacao/etapa-1-contas-permissoes-e-migracao.md) |
| 2 — Cadastro e perfil | Concluído no desenvolvimento | Schema 22; confirmação local de e-mail; ver relatório da etapa 2 |
| 3 — Sidebar e navegação | Não iniciado | Escopo do incremento visual e contratos de menus/dados |
| Demais fases | Não iniciado | Pré-requisitos descritos em cada fase |

**Próxima sequência recomendada:** fase 2 — adaptar questionário/cadastro/perfil → fase 3 — sidebar e Descoberta básica. O incremento estritamente visual de hover/teclado da sidebar pode ser antecipado se solicitado, sem fingir que mensagens ou Descoberta completa já existem.

## Atualização documental da etapa 2

Consultar [regras complementares](../Reestruturação%20Relacional%20e%20Informativa/regras-complementares.md) para chat persistente, denúncia, bloqueio, interações, interesse/inscrição em eventos, lembretes, retenção de notificações e recomendação. Essas regras detalham as fases 6–11; não significam funcionalidades entregues. Consultar [expressões profissionais](../expressoesProfissionais.md) antes de implementar mídia, créditos, portfólio e representação: o portfólio é unificado e multimodal, com contribuições específicas por contexto.

