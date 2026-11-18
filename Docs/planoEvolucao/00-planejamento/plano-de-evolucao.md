> **LEITURA OBRIGATÓRIA — ASSUNTOS COMPLEXOS NÃO DETALHADOS NESTE ARQUIVO**
> 
> Este documento consolida **todos os temas localizados nas dez fontes do ZIP e os acréscimos da solicitação atual**, mas **não transforma projetos complexos em instruções de implementação imediata**. Os assuntos abaixo estão **registrados no escopo**, com objetivo, limites e dependências; sua arquitetura, modelos de dados, fluxos de exceção, segurança, testes e critérios de aceite completos deverão ser produzidos em **documentos Markdown independentes, somente quando solicitados**. **Nenhuma funcionalidade foi implementada no código durante esta consolidação.**
> 
> **D-01 — Identidades, categorias, permissões e migração Público ↔ Profissional.**  
> **D-02 — Selos pessoais e associação a créditos/organização de conteúdos.**  
> **D-03 — Créditos, reconhecimento e contestação de colaborações.**  
> **D-04 — Portfólio Manual/Inteligente, moldes e visibilidade.**  
> **D-05 — Descoberta contextualizada, recomendações e sinais de interesse.**  
> **D-06 — Publicações, comentários, curtidas, seguidores e moderação.**  
> **D-07 — Mensagens persistentes, notificações e lembretes programados.**  
> **D-08 — Administração: provisionamento, hierarquia, permissões, solicitações e auditoria.**  
> **D-09 — Cypher Central: editor de conteúdos e Centro de Análise de Qualidade.**  
> **D-10 — Obras musicais: composições, fonogramas, ISRC/ISWC e créditos.**  
> **D-11 — Eventos: fluxos de interesse/participação, mapa e alertas.**  
> **D-12 — Publicação multimídia, galerias e infraestrutura de arquivos.**
> 
> **Regra de leitura:** “consolidado” significa que a intenção está clara nos materiais; **não significa que o recurso esteja pronto no sistema**. Decisões ainda abertas estão assinaladas como **[A DEFINIR]**. Recomendações novas desta análise estão assinaladas como **[RECOMENDAÇÃO]**; não substituem a deliberação do grupo.

---
## 0. Como interpretar este documento

### 0.1. Escala de influência transversal

A quantidade de asteriscos mede **quantas áreas do sistema precisam ser revistas e a gravidade dos efeitos de integração**, não a dificuldade isolada, o custo, a urgência ou a preferência estética.

|Classificação|Interpretação|Exemplo|
|---|---|---|
|*|Mudança local, majoritariamente visual; quase sem dependências|Animação do controle de tema|
|**|Uma tela ou componente reutilizável, com impacto restrito|Refinamento de card específico|
|***|Mais de uma tela e/ou dados de um mesmo domínio|Capa de evento e apresentação na descoberta|
|****|Fluxo completo compartilhado, banco e múltiplas interfaces|Comentários em diferentes tipos de publicação|
|*****|Alteração estrutural/transversal de identidade, autorização ou vários domínios|Modalidades de conta, categorias e permissões|

**Identificadores:** cada solicitação possui um código estável (CAD-01, OBR-02 etc.). Dependências referenciam esses códigos. O campo **Impacto** é obrigatório em cada solicitação, inclusive nas decisões de nomenclatura. Um item ***** não deve necessariamente ser implementado primeiro: pode depender de requisitos menores e estar aguardando especificação isolada.

### 0.2. Fontes efetivamente cruzadas

|Código|Documento do ZIP|Conteúdo aproveitado|
|---|---|---|
|F01|!!Central-de-Conhecimento.md|Central educativa, relações profissionais, gestão de artigos, análises e artigos recentes|
|F02|EscopoConsolidadoMelhorias.md|Escopo geral de telas, remoções, mensagens, criação, eventos, alertas e pendências|
|F03|identificador-publico-cypher.md|@, unicidade, alterações, histórico, links e créditos|
|F04|idMusicais-Admin-Ouvinte.md|ISRC/ISWC, público, conversão de conta e separação administrativa|
|F05|Levantamento-melhorias-cypher.md|Demanda inicial de UX, filtros, status, indicadores e configurações|
|F06|Perfis-Cypher.md|Lista mais recente de profissões, removidos e três funções administrativas|
|F07|Portfólio.md|Moldes, modos Manual/Inteligente, persistência, créditos e privacidade|
|F08|Reestruturação-categorias-profissionais.md|Organização por áreas, questionários e requisitos técnicos anteriores|
|F09|Relacoes-Perfis--Cypher.md|Finalidade e interações específicas das 26 profissões e dos administradores|
|F10|telaDescoberta-sidebarHover-mensagensPopup.docx|Substituição da Visão Geral, hover, navegação móvel, sugestões e mensagens; cinco imagens de referência examinadas|
|F11|Solicitação atual (15/11/2026)|Cadastro de duas faces, vulgo, nascimento, seletores visuais, selos, comentários, mídias, seguir/curtir, taxonomia e auditoria dos nomes|

**Limite de verificação:** o ZIP contém documentação e referências, **não o repositório executável completo**. Portanto, as rotas indicadas são as mencionadas nos arquivos, e não um inventário de rotas comprovado por inspeção do código. A separação definitiva IMPLEMENTADO / STAND-BY exige auditoria futura do repositório. Não foram acessadas páginas externas nem presumida a situação atual da implementação.

### 0.3. Resolução das sobreposições e divergências

|Tema|Versão conflitante/antiga|Regra consolidada ou encaminhamento|
|---|---|---|
|Profissões|Referência a “pelo menos 36”; lista antiga mais extensa|**26 profissões ativas**, distribuídas em sete áreas, conforme F06. Removidas não devem reaparecer; auditar referências legadas|
|Nome da função|Freestyler|**Freestyleiro** em cadastro, busca, perfil e conteúdos; migração dos registros antigos|
|Vertentes por função|Rapper + MC + Freestyler|**Apenas Rapper recebe a seleção específica de vertentes de rap** nesta versão. MC é mestre de cerimônias; Freestyleiro não recebe subgêneros próprios|
|Sidebar|Botão para minimizar/expandir|**Hover em desktop**, recolhida por padrão e **toque em dispositivos sem hover**; sem botão permanente de minimizar no desktop|
|Cadastro profissional|Questionários de quatro perguntas ou telas extensas|**Uma pergunta obrigatória por profissão: tempo de atuação**. Outras informações migram para editar perfil|
|Perfil/nome|Nome de perfil, vulgo e @ tratados como equivalentes em algumas telas|**Três conceitos separados:** nome informado, vulgo opcional/identidade pública e identificador único @|
|“Outro”|Remover opção livre de profissões, gêneros e tipos|**Remover “Outro” livre apenas das taxonomias profissionais/musicais/tipos de obra**. Não confundir com opção de gênero/tratamento ou motivo de feedback|
|“Status”|Remoção de status profissional e de obra|Eliminar **esses dois sistemas e seus resíduos**; manter **estados de evento, solicitações, artigos, mensagens e moderação**, que têm funções diferentes|
|Nome “Oportunidades”|Página descrita essencialmente por eventos e mapa|**Eventos** é nome principal recomendado **se seu conteúdo for apenas eventos**. Chamadas profissionais não equivalentes a eventos precisam de área própria, não devem desaparecer|
|Atualização do @ e profissões|Intervalos potencialmente confundidos|@: **30 dias (proposta de F03)**; profissões: **60 dias, com primeira alteração livre**. Regras distintas|
|Privilégios|Documento antigo desaconselha permissões automáticas|A profissão deve informar **elegibilidade**, mas ações precisam de **permissão explícita e verificada no servidor**; não dar acesso só por rótulo visual|
|Privacidade|Profissional público por padrão versus ouvinte sem nível definido|Perfil **profissional** público por padrão (com controles claros). **Exposição do consumidor** e política para menores ainda precisam de decisão|
|Portfólio|Crédito citado por terceiro aparece automaticamente|Não apresentar como colaboração **confirmada** até validação da pessoa citada; preservar o registro original|

**Critério de precedência adotado:** decisão explícita mais recente do usuário (F11) > catálogo mais recente e retiradas explícitas (F06) > escopo consolidado (F02) > versões de levantamento anteriores (F05/F08). Nos pontos não resolvidos por essa ordem, não foi inventada uma decisão: aparecem em **Pendências**.

---

## 1. Diretrizes estruturais válidas em toda a Cypher

### 1.1. [GER-01] Identidades e autorizações — Impacto: ***** · D-01

- Manter três naturezas de acesso: **Consumidor (público/ouvinte/fã)**, **Profissional** e **Administrativo**.
- O consumidor pode descobrir, acompanhar, curtir, comentar, compartilhar, salvar itens, interagir e comunicar-se dentro das permissões gerais; **não pode publicar trabalhos ou realizar ações profissionais restritas** somente por ter conta.
- Uma conta de consumidor pode tornar-se profissional **sem criar outro usuário**, preservando usuario_id, @, histórico, conexões e interações. A transição precisa de autorização e seleção das categorias pertinentes.
- O profissional pode exercer múltiplas funções; a associação de funções habilita apenas as capacidades efetivamente previstas pela matriz de permissões. Uma função não deve ser usada artificialmente como pré-requisito para outra atuação.
- Conta administrativa é criada por processo interno controlado, não possui perfil profissional público, não aparece como artista e não pode ser criada pelo cadastro comum.
- **Aceite mínimo:** ações proibidas são recusadas no servidor, mesmo por requisição manual; perfis públicos e administrativos não são confundidos.

### 1.2. [GER-02] Persistência e dados reais — Impacto: *****

- Cadastro, categorias, curtidas, seguidores, comentários, mensagens, notificações, eventos, créditos, selos e portfólios devem ter **estado persistido de verdade**; fechar um modal, atualizar a página ou entrar em outro dispositivo não perde os registros.
- Indicadores derivam de operações persistidas, com definição clara da métrica; eliminar a aparência de números reais onde existam apenas dados demonstrativos.
- Distinguir **registro**, **publicação**, **exibição em vitrines**, **participação validada** e **estado de moderação**. Não reintroduzir o status de obra eliminado por outro nome.
- As alterações devem respeitar o MVC simples e a stack documentada (**Node.js, TypeScript, Express, EJS, SQLite e JavaScript vanilla**), após conferência no repositório.

### 1.3. [GER-03] Remoção integral de funcionalidades abolidas — Impacto: ****

- “ELIMINAR” implica revisar elementos visuais, rotas, componentes, modelos, controladores, validações, dados exclusivos, textos, filtros, relatórios, eventos de interface e fluxos dependentes.
- Alvos expressos: **Visão Geral antiga**, **status profissional da sidebar**, **status de obras** (Em produção, Lançado, Rascunho, card Em andamento), profissões retiradas e campos livres “Outro” nas taxonomias correspondentes.
- **Preservar dados que tenham outros usos**, aplicando migração segura; não apagar indistintamente registros de obras, eventos, usuários e créditos.
- **Aceite mínimo:** busca global por rótulos, rotas, filtros e referências obsoletas + testes de regressão.

### 1.4. [GER-04] Identidade visual e comportamento transversal — Impacto: ***

- Aplicar linguagem **hip-hop, street/underground e cores inspiradas na Jamaica**, preservando legibilidade e coesão em tema claro e escuro.
- Componentes não devem parecer formulários administrativos genéricos. Responsividade para desktop, tablet e celular; foco de teclado, rótulos claros, contraste legível e alternativa a hover/animações.
- Reaproveitar padrão de cards, chips, menus, filtros, estados vazios, imagens, modais e mensagens de confirmação sem apagar particularidades de cada tipo de conteúdo.

### 1.5. [GER-05] Apresentação visual de conteúdos e imagens — Impacto: **** · D-12

- Obras, beats, eventos, publicações, trabalhos visuais e portfólios precisam de **cards com mídia e hierarquia informativa**, não de uma simples lista textual: capa/foto, título, autoria/organização, tipo, informações contextuais, interações e chamada para detalhes.
- **Não impor um único formato:** obra musical destaca capa e participantes; evento destaca cartaz, data e local; arte visual dá protagonismo à imagem; vídeo apresenta miniatura; beat destaca produtor e informação musical.
- Prever imagens ausentes com placeholder visual deliberado, carregamento responsivo, texto alternativo e proporção adequada; **não inventar capas para registros antigos**.
- A ficha do item deve concentrar detalhes; cards não devem virar fichas técnicas em miniatura. Galerias e mídia precisam de permissões, limites, armazenamento e remoção coerentes.

### 1.6. [GER-06] Interações sociais padronizadas — Impacto: ***** · D-06

- Todos os usuários autenticados, inclusive consumidores, devem poder **seguir perfis profissionais**, **curtir perfis profissionais** e **comentar conteúdos que aceitem comentários**, respeitando bloqueios, visibilidade e moderação.
- **Seguir:** expressa interesse contínuo em acompanhar a conta e pode orientar notificações e Descoberta; **Curtir perfil:** expressão pontual de apreço, independente do seguimento. **Curtir item** é ação separada vinculada à obra/publicação/evento, quando habilitada.
- Persistir a relação única por usuário-alvo e impedir contagens duplicadas, autocurtidas/autoseguimentos indevidos, alterações não autorizadas e vazamento de interações com objetos privados.
- **[RECOMENDAÇÃO]** Validar em teste de UX se “curtir perfil” agrega valor distinto de “seguir”; manter o requisito no escopo até essa decisão, sem trocá-lo silenciosamente por reputação ou avaliações.

### 1.7. [GER-07] Comentários como recurso comum, não exclusivo do consumidor — Impacto: ***** · D-06

- Permitir que **profissionais e consumidores** comentem **obras, eventos, beats, galerias e publicações** que tenham comentários habilitados.
- Um comentário possui autor, conteúdo, data/hora, vínculo com o item e estado de moderação persistidos. A interface exibe comentários existentes, contador verdadeiro, paginação/carregamento apropriado e erros compreensíveis.
- Prever edição ou remoção pelo autor e remoção pela moderação, denúncias, proteção contra spam, conteúdo impróprio, menções abusivas, links maliciosos e abuso de requisições.
- O autor do conteúdo não deve poder apagar silenciosamente registros de terceiros sem regra explícita de moderação. Decidir se pode **desativar comentários** por item; a desativação não deve apagar os registros.
- **[A DEFINIR]** Políticas de respostas encadeadas, menções, edição, bloqueios, ordem e retenção.

### 1.8. [GER-08] Links compartilháveis e identificadores estáveis — Impacto: ****

- Criar links para perfis, obras, eventos, beats, galerias e demais objetos publicáveis, com destino correto e respeito à visibilidade.
- URLs públicas de perfis utilizam o @ legível; registros internos e créditos devem apontar ao **ID imutável do usuário**, não depender do texto atual do @.
- Mudanças de @ preservam redirecionamento de endereços anteriores e impedem que um terceiro assuma indevidamente identificadores antigos, conforme F03.
- “Compartilhar” não deve tornar público um item privado nem contornar regras de acesso.

### 1.9. [GER-09] Privacidade, segurança e menores — Impacto: ***** · D-01/D-06

- Dado de nascimento, nome informado e preferências privadas não são automaticamente públicos porque um perfil profissional é público.
- Campos de dados pessoais, localização, respostas por categoria e portfólio devem ter regras explícitas de visibilidade e de quem pode acessá-los.
- A validação deve ocorrer no servidor, incluindo identidade, autorização, referências a usuários e conteúdo, permissões de mídia e operações administrativas.
- **[A DEFINIR]** Idade mínima, tratamento de menores, consentimentos e exposição da conta de consumidor. Não fixar arbitrariamente “18 anos” ou outro limiar sem decisão e verificação jurídica aplicável.

### 1.10. [GER-10] Critério único de conclusão — Impacto: ****

Todo item aprovado exige rastreamento de dependências e, conforme aplicável: **view + CSS/JS + rotas + controlador + modelo + migração + validação de servidor + autorização + persistência + testes HTTP/fluxo + tema claro/escuro + responsividade**. Não considerar implementado um botão cuja ação não tenha persistência ou retorno funcional.

---

## 2. Revisão dos nomes, da arquitetura de informação e da navegação

**Critério:** o nome deve antecipar a ação ou o conteúdo. Evitar termos vagos, duplicados e nomes técnicos visíveis ao usuário. As sugestões abaixo são **proposta de nomenclatura**, não confirmação de rotas implementadas.

|Área referida nos arquivos|Nome exibido recomendado|Justificativa e decisão|Impacto|
|---|---|---|---|
|Visão Geral|**Descoberta**|Substituição **integral**: ambiente de explorar pessoas, conteúdos e eventos, não dashboard de números|*****|
|Oportunidades / /opportunities|**Eventos**|Trocar se a área reúne agenda, inscrições, interesse e mapa de eventos; reservar oportunidades não-evento para categoria distinta|****|
|Página de criação ainda sem nome|**Publicar**|Verbo claro para entrar na central de publicação; dentro da tela, “Criar obra”, “Cadastrar beat”, “Criar evento” etc.|****|
|/works|**Obras**|Nome direto para catálogo de obras musicais/participações; diferenciar de trabalhos visuais quando houver galerias próprias|***|
|Banco de Beats|**Banco de Beats**|Mantém vocabulário específico e reconhecível na cena; “Beats” pode ser rótulo compacto na navegação|**|
|Busca / pesquisa geral|**Buscar** ou **Busca**|**Busca** favorece seção de navegação; usar “Buscar” no campo/ação e resultados agrupados por tipo|***|
|Perfis públicos|**Perfil**|Nome convencional, separado de editar conta e do painel administrativo|**|
|Edição do perfil|**Editar perfil**|Limitar ao conteúdo e apresentação pública; segurança e senha pertencem a Configurações|***|
|Portfólio|**Portfólio**|Módulo do perfil; só virar página independente se a experiência crescer de fato|***|
|Galerias e trabalhos visuais|**Galerias**|Exibição apropriada a trabalhos fotográficos, artísticos e audiovisuais|***|
|Mensagens|**Mensagens**|Mesmo nome no popup e na tela dedicada; o popup é um atalho, não produto separado|****|
|Notificações|**Notificações**|Um só conceito para popup e histórico persistente|***|
|Configurações|**Configurações**|Seções internas: Conta, Privacidade, Descoberta e Aparência|***|
|Ajuda e Sobre|**Cypher Central**|Marca já definida; não manter card “Ajuda e Sobre” como área principal concorrente|**|
|Área educativa|**Cypher Central**|Página de guias, relações e busca de conhecimento, sem confundi-la com feed/Descoberta|***|
|Painel administrativo|**Administração**|Identifica área restrita com navegação própria|*****|
|Gestão de artigos|**Conteúdos da Central**|Nome claro no painel para editor com permissão|***|
|Centro de Análise|**Qualidade da Central**|Nome compacto no menu; título completo “Centro de Análise de Qualidade”|****|
|Fila administrativa|**Solicitações**|Inclui inclusão de categorias, exceções e atendimento; não confundir com inbox de mensagens privadas|****|
|Contato do usuário|**Falar com a Cypher**|Ação compreensível para sugerir opção, pedir exceção ou solicitar ajuda|***|
|Menu secundário|**Mais**|Agrupa configurações e recursos de menor frequência; nunca esconder ações fundamentais|**|
|Créditos / participações|**Créditos** e **Participações**|“Créditos” descreve funções numa obra; “Participações” descreve vínculo do usuário com registros|****|
|Seguidores / seguidos|**Seguidores** / **Seguindo**|Vistas de relação social, sem elevar “curtir perfil” a medida de reputação|***|
|Chamadas profissionais (se forem distintas de eventos)|**Chamadas** ou **Oportunidades**|**[A DEFINIR]** Só criar como área separada se houver oferta, vaga, briefing ou convocação não representável como evento|****|

### 2.1. [NAV-01] Menus por tipo de conta — Impacto: ***** · D-01

- **Todos:** Descoberta, Busca, Eventos, Banco de Beats (consulta), Mensagens, Notificações, Perfil, Cypher Central e Mais, conforme políticas de acesso.
- **Profissional:** acrescentar **Publicar**, gerenciamento das próprias obras/beats/eventos quando autorizado e área de portfólio/galerias pertinente.
- **Consumidor:** não exibir ações de publicação não permitidas; permitir ativar perfil profissional por fluxo claro na própria conta.
- **Administrador:** navegação própria, sem simular “um profissional com poderes extras”.
- Não converter esta lista em permissão técnica automática: ela é a **arquitetura de navegação pretendida**.

### 2.2. [NAV-02] Sidebar recolhida por padrão — Impacto: ****

- No desktop, ícones visíveis em estado recolhido, expansão suave ao hover, rótulos ao expandir e **sem botão fixo de abrir/fechar**.
- A opção **Mais** permanece na parte inferior; destacar a rota ativa. Evitar que a expansão empurre/desloque a área principal ou cubra indevidamente popups.
- Em telas touch, oferecer ação por toque, navegação inferior ou menu acessível. O mecanismo móvel substitui hover, não o imita de maneira impossível.
- Validar coexistência de sidebar, painel de mensagens, notificações e menus flutuantes nas duas cores do tema. As cinco imagens do F10 são **referências de interação e proporção**, não uma obrigação de copiar a estética do Instagram.

### 2.3. [NAV-03] Exclusão de status profissional da sidebar — Impacto: ***

- Remover o sistema de status no topo da sidebar, incluindo cards, filtros, rótulos, regras e dependências exclusivas. **Não substituir por outro status equivalente.**

---

## 3. Cadastro, login e definição da identidade

### 3.1. [CAD-01] Cadastro interativo com duas faces — Impacto: **** · D-01

- A parte superior do cadastro oferece a escolha **Profissional | Consumidor**, visualmente integrada ao mesmo componente.
- Ao alternar, uma **animação de carta virando** (flip) comunica que são duas modalidades da **mesma plataforma e do mesmo processo de criação de conta**, não dois sites distintos.
- **[RECOMENDAÇÃO]** Estrutura visual: cartão com duas faces, alternância controlada por abas acessíveis e transição breve. Não fazer o conteúdo ficar invertido, prender foco ou apagar dados já digitados. Respeitar preferência de movimento reduzido; em dispositivos modestos, usar transição simples.
- **Face Consumidor:** dados comuns de acesso e identidade, sem área profissional e sem imposição de escolher profissão. Explicação concisa sobre acompanhar, curtir, comentar, salvar conteúdos e interagir.
- **Face Profissional:** mesmos dados de conta, seguidos de escolha de profissões e respectivas informações pertinentes. Explicação concisa sobre apresentar trabalhos, atuar na cena e receber recursos profissionais autorizados.
- As duas faces compartilham validações comuns. Alternar antes de concluir o cadastro **não deve criar duas contas, perder os campos compartilhados nem gerar registros parciais inconsistentes**.
- **[A DEFINIR]** Se o usuário mudar para Consumidor após preencher categorias, decidir se as respostas profissionais temporárias serão mantidas apenas na sessão de cadastro ou descartadas mediante aviso.

### 3.2. [CAD-02] Dados obrigatórios e progressão do cadastro — Impacto: ***** · D-01

- Primeira etapa visualmente compacta: **nome informado, e-mail, data de nascimento, senha, confirmação de senha e @**. Vulgo, quando desejado, é opcional e contextual (CAD-03). Evitar exigir biografia, setup, portfólio e histórico profissional no primeiro contato.
- **Profissional:** etapa posterior com seleção de área/profissões, vertentes quando aplicável e pergunta breve de tempo de atuação para cada profissão. **Consumidor:** encerrar sem questionário profissional.
- Botão **Próximo** antes de confirmar criação da conta; indicador de progresso com total de passos e a profissão a que cada pergunta pertence. Validações devem preservar os dados corretos ao retornar etapas.
- Após criar perfil profissional, mostrar aviso **“Complete seu perfil”**, com acesso à edição para informações adicionais; não bloquear inutilmente o uso básico por campos não essenciais.
- **[RECOMENDAÇÃO]** Evitar exigir campos excessivos em uma única face; dividir os dados comuns em passos curtos se o teste visual mostrar sobrecarga.

### 3.3. [CAD-03] Nome, vulgo e identidade pública — Impacto: ***** · D-01

- Ao lado do campo **Nome**, incluir controle acionável **“Possui vulgo?”** em **ambos os cadastros**.
- Quando ativado, revelar imediatamente o campo **Vulgo/nome artístico** abaixo do nome e um controle independente **“Mostrar meu vulgo como nome público”**.
- Se escolhido, o perfil, cards, comentários, créditos visíveis e demais componentes que exibem o **nome público da conta** passam a apresentar o vulgo; o nome informado fica oculto aos demais usuários, salvo regras específicas de necessidade e autorização.
- Se não escolhido, apresentar o nome público conforme a configuração normal. Alterar depois em **Editar perfil**, sem alterar usuario_id nem perder vínculos.
- O vulgo **não é exclusivo**, nem substitui o @. A ocultação deve valer também para busca, compartilhamento, notificações de terceiros, mensagens e metadados expostos; **não basta mudar o título do perfil**.
- **[A DEFINIR]** Estabelecer quais dados de identidade são efetivamente necessários para a operação; não pressupor verificação de identidade civil sem necessidade. Em caso de nome informado sensível, restringir acesso conforme a política de privacidade.
- **Aceite mínimo:** ao ativar a opção, outro usuário encontra apenas o nome público permitido em todos os pontos de apresentação, sem revelar o nome informado por via alternativa.

### 3.4. [CAD-04] Identificador único @ — Impacto: *****

- Solicitar identificador público no cadastro para evitar @ aparentemente aleatórios; explicar a diferença entre **Nome**, **Vulgo** e **@**.
- Regras propostas por F03: **3–30 caracteres**, letras latinas minúsculas, dígitos, hífen e sublinhado; sem espaços; único sem diferenciação de caixa; bloquear palavras reservadas como admin, login, register, profile, settings, api, support e cypher.
- Verificar disponibilidade na interface para orientar e **novamente no servidor/banco para garantir unicidade**, inclusive em cadastros simultâneos.
- Alterações do @: **intervalo sugerido de 30 dias**, exibir próxima data disponível, registrar histórico, considerar exceções administrativas justificadas e proteger contra captura de endereços antigos.
- Manter redirecionamento de URLs antigas para o novo perfil; créditos, seguidores, selos e conteúdo vinculam-se ao **ID interno**, não ao texto mutável do @.
- **[A DEFINIR]** Confirmar o intervalo de 30 dias como regra final. Preservar dados legados e corrigir relações que ainda dependam textualmente do @.

### 3.5. [CAD-05] Data de nascimento e validação de idade — Impacto: ***** · D-01

- Solicitar **data de nascimento nos cadastros de Consumidor e Profissional**; não aceitar data futura ou impossível. Calcular a idade corretamente por data completa, inclusive antes/depois do aniversário do ano corrente.
- A validação de idade, eventuais barreiras de cadastro e o tratamento de menores precisam existir **no servidor**, não apenas no input type=date ou em JavaScript.
- O dado **não deve ser exibido publicamente por padrão**; determinar política de acesso, segurança, correção de erro e retenção. Mostrar aviso claro sobre a finalidade da coleta.
- **[A DEFINIR — DECISÃO BLOQUEANTE]** Idade mínima e eventuais condições de consentimento/responsabilidade aplicáveis ao serviço. Não criar restrição automática baseada em um valor que os documentos não definem.

### 3.6. [CAD-06] Seleção visual de áreas, profissões e vertentes — Impacto: ****

- Em vez de opções apenas textuais, usar **cards visuais selecionáveis**, com imagem/ilustração ou iconografia representativa, título e breve explicação, inspirados na dinâmica de seleção do Pinterest **sem copiar sua interface**.
- Fluxo sugerido: **área → profissão → vertentes apenas se for Rapper**. Permitir múltiplas áreas e profissões, mostrando escolhas ativas em chips/resumo visível e removível.
- Imagens representam a atividade sem estereotipar pessoas ou exigir carregamentos pesados. As escolhas precisam permanecer utilizáveis com teclado, leitor de tela e rede lenta.
- Na edição de perfil, reutilizar a lógica visual preservando a seleção existente e regras de alteração profissional.

### 3.7. [CAD-07] Questionário profissional mínimo — Impacto: ****

- Cada profissão escolhida exige **somente uma pergunta no cadastro:** “Há quanto tempo você atua como [profissão]?”; adaptar a flexão de modo correto e evitar duplicidade para múltiplas profissões.
- Apresentar **uma profissão por vez**, com progresso e possibilidade de revisão. As demais perguntas sobre experiências, projetos, participação e equipamentos ficam na edição de perfil, com campos realmente pertinentes à profissão.
- Ao retirar uma profissão antes de concluir o cadastro, não manter respostas órfãs. Se a profissão for novamente selecionada no mesmo fluxo, recuperar a resposta provisória quando apropriado.

### 3.8. [CAD-08] Catálogo profissional fechado e atualizado — Impacto: ***** · D-01

- Usar **exclusivamente as 26 profissões ativas** de F06, detalhadas em 4.3; impedir reintrodução das profissões expressamente removidas de F06.
- Separar **Rapper ≠ MC**, **Compositor ≠ Letrista**, **Produtor(a) musical ≠ Produtor(a) cultural**. A nomenclatura “Produtor(a) musical” é **[RECOMENDAÇÃO]** para desambiguar a opção “Produtor(a)” de F06, mantendo mapeamento interno explícito.
- Substituir Freestyler por **Freestyleiro** em toda interface, taxonomia, documentação e dados persistidos mediante migração.
- Não apresentar campos livres “Outro” para nova profissão; oferecer **“Não encontrou sua profissão? Sugerir à Cypher”**, com solicitação persistida para triagem administrativa.

### 3.9. [CAD-09] Vertentes do Rapper — Impacto: ****

- Perguntar vertentes **somente quando a função Rapper estiver selecionada**. **MC** é a função de condução/apresentação e domínio do microfone, não um perfil que exija escolher estilos de rap. **Freestyleiro** é função própria e **não recebe subgêneros exclusivos**.
- As 16 vertentes aceitas no conjunto atual: **Boom bap, Jazz rap, G-Funk, Gangsta rap, R&B, Gospel, Trap, Trap soul, Grime, Drill, Detroit rap, Jersey Club Rap, Plug, PluggnB, Melodic rap e Rage**.
- Seleção **múltipla e não exclusiva** representa identificação artística predominante, **não habilitação nem proibição** de outros estilos.
- Se Rapper deixar de ser categoria ativa, ocultar suas vertentes do perfil; tratar valores anteriormente escolhidos sem apagá-los inadvertidamente ou exibi-los como válidos para outra função.
- Não criar campo aberto “Outro”: disponibilizar solicitação de nova vertente à equipe.

### 3.10. [CAD-10] Gênero pessoal, tratamento e concordância — Impacto: ***

- F02 define **Masculino, Feminino e Outro** para adequação de tratamento e flexões de nomes como B-boy/B-girl. Essa escolha **não é gênero musical nem orientação sexual**.
- **[RECOMENDAÇÃO]** Explicitar na interface “Como prefere ser tratado(a)?”/“Forma de tratamento” para evitar misturar dados pessoais a gêneros de obras; usar linguagem neutra quando o usuário escolher Outro e não fornecer preferência mais específica.
- Persistir e aplicar coerentemente onde o tratamento for necessário, sem usar esse campo para atribuir profissões, capacidade ou visibilidade de dados pessoais.

### 3.11. [CAD-11] Login e segurança da senha — Impacto: **

- Login: senha **oculta ao carregar**, botão próprio para mostrar/ocultar.
- Cadastro: senha e confirmação; **senha principal** pode ser revelada por controle; **confirmação permanece oculta sem botão de revelar**, como solicitado em F02.
- Validar correspondência e regras de senha no servidor, sem expor senhas em logs ou resposta de erro.

### 3.12. [CAD-12] Transição de Consumidor para Profissional — Impacto: ***** · D-01

- Disponibilizar fluxo claro para **“Ativar perfil profissional”** na mesma conta, sem recriar histórico ou substituir identificador.
- Ao ativar, apresentar seleção de profissões, tempo de atuação e eventual vertente de Rapper; aplicar permissões profissionais somente após confirmação e persistência.
- **[A DEFINIR]** Como converter de volta para consumidor, se uma conta profissional puder desativar suas capacidades e o destino de conteúdos já publicados; não presumir exclusão automática de trabalhos.

---

## 4. Perfil, edição, categorias, portfólio resumido e conexões

### 4.1. [PER-01] Perfil público estruturado — Impacto: ****

- Cabeçalho com **foto, capa, nome público (vulgo quando escolhido), @, identificador público do Cypher, biografia, profissões, contato permitido, localização pública quando autorizada e tempo na plataforma**, conforme relevância.
- Mostrar ações **Seguir, Curtir perfil, Enviar mensagem, Compartilhar** respeitando visibilidade, bloqueios e permissões. Em perfil próprio, destacar **Editar perfil**.
- Organizar profissões em **módulos/containers acessáveis**, permitindo conhecer atuação, respostas compartilháveis e trabalhos de cada área sem repetir nome, foto e biografia.
- Perfis de consumidor não devem fingir possuir profissão ou portfólio profissional; o alcance público desses perfis depende de política específica (GER-09).

### 4.2. [PER-02] Editor de perfil distribuído por seções — Impacto: ****

- Separar **Informações gerais**, **Identidade pública**, **Atuação profissional**, **Portfólio/galerias** e **Privacidade**; manter configurações de acesso/segurança em Configurações.
- Editar biografia, nome público/vulgo, fotos, contatos e localização **uma vez por usuário**, mesmo quando houver múltiplas profissões.
- Dados próprios de uma profissão ficam no módulo correspondente, sem duplicar perguntas comuns. O formulário deve carregar os registros existentes e salvar mudanças sem substituir silenciosamente campos não enviados.
- Equipamentos e setup são opcionais quando pertinentes a música/áudio ou produção técnica; não forçar para categorias que não os utilizam.

### 4.3. [PER-03] Taxonomia canônica — 26 profissões — Impacto: ***** · D-01

Este é o **catálogo ativo** a ser refletido em cadastro, edição, perfis, Busca, filtros, Publicar, créditos, selos e Cypher Central. As relações abaixo são exemplos de aplicação da F09, **não autorizações automáticas**.

|Área|Profissão|Tipo de apresentação/relacionamento relevante|
|---|---|---|
|Música|Rapper|Obras, faixas, performances; feats, beatmakers, produção, clipes|
|Música|MC|Apresentações, condução de eventos, participações; organizadores e DJs|
|Música|Compositor(a)|Composições e créditos; colaboração com intérpretes e letristas|
|Música|Letrista|Letras, escrita e créditos; parcerias com artistas e compositores|
|Música|Beatmaker|Instrumentais, Banco de Beats, créditos por produção de beat|
|Música|Produtor(a)|Produções e créditos; coordenação de gravação e profissionais técnicos|
|Música|DJ|Sets e performances; eventos, shows e artistas|
|Música|Freestyleiro|Batalhas, apresentações e vídeos de freestyle; eventos e DJs|
|Dança|B-boy / B-girl|Fotos e vídeos de batalhas e performances; shows, clipes e eventos|
|Dança|Dançarino(a)|Vídeos, apresentações; clipes, coreografia e eventos|
|Dança|Coreógrafo(a)|Projetos e vídeos coreográficos; artistas, dançarinos e videomakers|
|Artes visuais|Grafiteiro(a)|Galerias de intervenções e trabalhos; clipes, capas, eventos e espaços|
|Artes visuais|Ilustrador(a)|Ilustrações autorais, capas e materiais; artistas, podcasts e publicações|
|Artes visuais|Designer gráfico|Capas, cartazes, identidades visuais; artistas, produtores e eventos|
|Audiovisual|Fotógrafo(a)|Ensaios, registros de eventos e galerias; artistas e organizadores|
|Audiovisual|Videomaker|Clipes e cobertura audiovisual; coreógrafos, artistas, editores|
|Audiovisual|Editor(a) de vídeo|Edição/pós-produção; videomakers, artistas e criadores|
|Produção técnica|Engenheiro(a) de áudio|Gravação, captação e trabalho sonoro; artistas, técnicos e eventos|
|Produção técnica|Mixador(a)|Portfólio de mixagens e créditos por faixa; artistas e produtores|
|Produção técnica|Masterizador(a)|Trabalhos e créditos de masterização; artistas e mixadores|
|Gestão e produção|Empresário(a)|Gestão de carreiras, representação e redes de contato|
|Gestão e produção|Produtor(a) cultural|Projetos, ações culturais e parcerias; coletivos e artistas|
|Gestão e produção|Organizador(a) de eventos|Agenda, eventos, chamadas, convites e equipes técnicas|
|Comunicação e cultura|Criador(a) de conteúdo|Conteúdos, canais e colaboração editorial/audiovisual|
|Comunicação e cultura|Jornalista cultural|Matérias, entrevistas e coberturas; artistas e organizadores|
|Comunicação e cultura|Podcaster|Episódios, entrevistas, convidados e produções culturais|

**Excluídos do catálogo (F06):** Muralista, Artista digital, Manager, Produtor(a) executivo(a), Crítico(a) musical, Social media, Educador(a), Pesquisador(a) cultural e Articulador(a) cultural. **Diretor(a) audiovisual** também consta em F08, mas não na lista aprovada de F06; não reintroduzir. A migração deve identificar registros legados antes de retirar valores ou permitir edição.

### 4.4. [PER-04] Múltiplas profissões e limites de alteração — Impacto: ***** · D-01

- Uma conta profissional pode reunir várias profissões e, após cadastrar-se, realizar **uma primeira mudança livre** no catálogo pessoal.
- Depois da primeira mudança, alterações confirmadas das profissões somente após **60 dias**, computados e fiscalizados no servidor; informar data de liberação.
- Exceções antecipadas dependem de solicitação e aprovação administrativa **registradas**, não de ajuste informal no banco.
- Ter várias profissões não constitui fraude; denúncias ou sinais de uso enganoso podem gerar análise, com justificativa e direito de revisão segundo política futura.
- Preservar histórico da categoria e dependências quando uma função deixa de estar ativa; não apagar créditos ou obras legítimas por isso.

### 4.5. [PER-05] Seguidores e curtidas do perfil — Impacto: **** · D-06

- Exibir botões **Seguir/Seguindo** e **Curtir/Curtiu**, com estado real da relação, reversibilidade e contadores verificados.
- Seguidores podem acessar lista pertinente, com controles de privacidade e bloqueio. Uma conta deve poder deixar de seguir; não criar relações duplicadas ao clicar repetidamente.
- Curtir perfil não significa avaliar competência, confirmar contratação, verificar currículo ou conceder reputação; essas estruturas permanecem separadas.
- **[A DEFINIR]** Se curtidas em perfis terão contagem pública e se o consumidor poderá ser seguido; o requisito explícito, no momento, é seguir e curtir **contas profissionais**.

### 4.6. [PER-06] Catálogo compacto com acesso rápido — Impacto: ***

- No perfil, apresentar uma **prévia visual enxuta** dos trabalhos recentes e um controle **Ver catálogo**.
- Conforme F02, o card de catálogo pode funcionar como botão que abre um **popup organizado**; para acessibilidade e bibliotecas extensas, **[RECOMENDAÇÃO]** permitir também uma visualização completa por rota própria, se necessária.
- Distinguir **Obras próprias** de **Participações**; usar imagens, créditos e contexto, e não simplesmente linhas de títulos.

### 4.7. [PER-07] Fotos, capa, contatos e localização — Impacto: **** · D-12

- Suportar upload de **foto de perfil e imagem de capa**, com recorte/prévia, limites, persistência e exibição responsiva.
- Exibir contatos e região **apenas conforme a visibilidade escolhida**; o dado utilizado em filtros geográficos não obriga a mostrar localização precisa no perfil público.
- Fotografias e mídias de portfólio não devem substituir imagens técnicas/capas de registros externos sem autorização.

### 4.8. [PER-08] Dados profissionais adicionais após o cadastro — Impacto: ****

- A edição pode contemplar experiência, etapa dos projetos atuais, atuação/participação e trabalhos documentados, **conforme o contexto da profissão**; nenhum desses campos deve voltar a ser obrigatório na criação inicial, contrariando CAD-07.
- Respostas organizadas por profissão; permitir níveis de exibição **público**, **somente colaboradores autorizados** e **privado**, após definição explícita do significado de “colaborador” para controle de acesso.
- As respostas podem alimentar o portfólio e a Cypher Central, mas não comprovar automaticamente qualificação ou conceder privilégios.

---

## 5. Descoberta, busca e filtros

### 5.1. [DES-01] Página inicial Descoberta — Impacto: ***** · D-05

- Eliminar completamente **Visão Geral** e substituir pela **Descoberta**, com navegação contínua por **obras, beats, trabalhos visuais, artistas/profissionais, lançamentos, projetos, publicações, eventos e potenciais colaboradores**.
- O conteúdo deve ter imagem, autoria, tipo, contexto e ações compatíveis, não parecer um painel de métricas desconexas nem uma cópia literal de feed de rede social.
- Relevância pode considerar região, gêneros, profissões, interesses declarados, seguidores e interações **somente com dados disponíveis e regras transparentes**.
- **[RECOMENDAÇÃO]** Iniciar com ordenação simples, recência, compatibilidade de área/região e filtros explícitos antes de qualquer algoritmo sofisticado de recomendação.
- **Aceite mínimo:** usuário recém-cadastrado encontra conteúdo inteligível; ausência de preferências não resulta em página vazia e as recomendações não expõem informações privadas.

### 5.2. [DES-02] Sugestões contextuais laterais — Impacto: **** · D-05

- Área complementar para **profissionais recomendados, possíveis conexões e eventos próximos**, inspirada estruturalmente pelas imagens do F10, sem reproduzir a identidade do Instagram.
- Exemplo: beatmaker pode encontrar artistas cujas obras e interesses convergem; organizador pode encontrar DJs, MCs e técnicos pertinentes aos seus eventos.
- Em dispositivos pequenos, essa área não deve disputar espaço com o conteúdo principal; realocar ou tornar dispensável.
- **[A DEFINIR]** Sinais mínimos e critérios para “recomendado”, forma de contestar dados irrelevantes e prevenção de recomendações repetitivas.

### 5.3. [BUS-01] Busca transversal — Impacto: ****

- Busca por pessoas, profissões, @, obras, beats, eventos e conteúdos visuais, com distinção do tipo de resultado e respeito ao estado público de cada item.
- Resultados exibidos em cards, com fotografia/capa e contexto (ex.: profissão ou papel, localidade permitida, tipo de obra); conteúdos sem imagem devem ter fallback coerente.
- Buscar profissionais **pela função efetivamente cadastrada**, por exemplo encontrar coreógrafos para um videoclipe, sem exigir conhecer antecipadamente nomes específicos.

### 5.4. [BUS-02] Filtros reutilizáveis, não formulários estáticos — Impacto: ****

- Substituir, quando adequado, blocos extensos de select por chips, seleções múltiplas, menus visuais, grupos de categoria e filtros rápidos.
- Filtros aplicáveis a Descoberta, Busca, Obras, Banco de Beats, Eventos, galerias e portfólios devem manter padrões coerentes, mas **não compartilhar opções irrelevantes**.
- Oferecer estado vazio com opção **Limpar filtros**, preservar filtros coerentes durante alternância lista/mapa e evitar mudanças que aparentem sucesso sem alterar resultados.

### 5.5. [BUS-03] Identificação regional cuidadosa — Impacto: ****

- Descoberta e Busca podem usar **região principal informada** e proximidade aproximada para priorizar eventos e profissionais locais.
- Permitir explorar outras regiões; localização nunca deve ser prisão geográfica.
- Separar **localização para correspondência** de **localização tornada pública**; não deduzir nem exibir endereço residencial do usuário.

---

## 6. Obras, Banco de Beats e fichas de conteúdos

### 6.1. [OBR-01] Eliminar status das obras — Impacto: *****

- Remover por completo **Em produção**, **Lançado** e **Rascunho** como sistema de status de obra, inclusive card **Em andamento**, filtros, indicadores, campos, validações, fluxos e dependências sem outra finalidade.
- **Não introduzir status substituto de obra** (publicado, finalizado, em desenvolvimento etc.) disfarçando a mesma lógica. Dados factuais como **data de lançamento** e estados técnicos de moderação não são um novo status artístico.
- A remoção não interfere em **status de evento, revisão de crédito, notificações, artigos ou solicitações**.
- Migrar com cuidado os dados que precisem ser preservados; verificar rotas, templates, filtros, importações e relatórios.

### 6.2. [OBR-02] Gêneros e vertentes no cadastro de obras — Impacto: ****

- Disponibilizar **todos os gêneros/vertentes nativos reconhecidos pela taxonomia musical**, incluindo as 16 vertentes de rap citadas em CAD-09, independentemente das escolhas de vertente **no perfil**.
- **Regra fundamental:** um Rapper que se identifica publicamente com Trap e Drill **pode cadastrar uma obra Boom bap ou Jazz rap sem atualizar o perfil**. Perfil = predominância/identificação; obra = classificação **do conteúdo específico**.
- A mesma regra alcança participantes e profissionais que contribuam na obra conforme suas permissões; não bloquear o catálogo de gêneros usando os estilos preferidos do autor.
- Não oferecer campo livre “Outro” para gênero, vertente ou tipo de trabalho; usar catálogo e caminho de solicitação à administração.
- **[A DEFINIR]** Distinguir, em uma taxonomia definitiva, o que é gênero amplo, subgênero, vertente ou influência; o conjunto de 16 foi preservado como lista atual aprovada de opções, sem afirmar que todos pertencem necessariamente ao mesmo nível musicológico.

### 6.3. [OBR-03] Cards visuais de obras e participações — Impacto: ****

- Reestilizar /works com **capas**, nome da obra, tipo, autoria exibida, principais participantes, gêneros pertinentes, data factual quando disponível e ações de acesso/interação.
- Distinguir visualmente **obras cadastradas pelo usuário** e **participações em obras de terceiros** sem duplicar o registro nem sugerir propriedade exclusiva do participante.
- Incluir estados vazios, filtros relevantes, compartilhamento e comportamento responsivo. O card deve abrir uma ficha completa, não despejar todos os dados técnicos.

### 6.4. [OBR-04] Ficha rica e informações técnicas recolhíveis — Impacto: **** · D-10

- Exibir capa/galeria, título, artistas, papel de cada colaborador, tipo de obra, informações de lançamento, gêneros e interações relevantes.
- Abrir **Informações técnicas** por expansão/aba própria com **BPM, data e horário de lançamento, ISRC, ISWC e outros campos pertinentes**, sem ocupar o topo com dados técnicos.
- Os dados só aparecem se aplicáveis e conhecidos; não inventar códigos, créditos, datas ou métricas.
- A ficha pode apresentar **selos pessoais associados a créditos confirmados** (SEL-03), respeitando limites visuais e clareza de papéis.

### 6.5. [OBR-05] ISRC, ISWC e relação composição–fonograma — Impacto: ***** · D-10

- **ISRC:** código opcional da **gravação/fonograma**; permitir informação de código atribuído externamente, validar formato e detectar conflitos internos. **Não gerar** nem afirmar validação oficial por formato.
- **ISWC:** código opcional da **composição musical**; permitir registrar identificador já concedido por autoridade/organização competente; **não emitir** códigos pela Cypher.
- Uma composição pode ter **várias gravações**, cada uma com seu ISRC próprio, enquanto o ISWC pertence à composição associada.
- **Produtor fonográfico** é responsabilidade referente ao fonograma, não uma profissão adicional obrigatória no cadastro.
- Orientar o usuário a obter identificadores por canais competentes; preservar referências de consulta de F04: IFPI/ISRC, Abramus e CISAC/ISWC.
- **[A DEFINIR]** Fluxo de inclusão e vínculo entre composição, gravação, direitos, responsáveis e códigos no modelo atual.

### 6.6. [OBR-06] Créditos e colaborações — Impacto: ***** · D-03

- Registrar **profissional + obra/registro + papel exercido** (beat, produção musical, mixagem, masterização, composição, letra, vídeo, arte etc.), sem presumir que o criador do registro executou todas as funções.
- Um beatmaker pode cadastrar beats e participar de obras sem declarar-se Rapper/MC. Profissões selecionadas e créditos concretos são conceitos diferentes.
- Crédito indicado por terceiro **não equivale a colaboração confirmada**; permitir confirmação, rejeição ou contestação antes de apresentar selo, portfólio verificado ou indicadores de participação validada.
- **[A DEFINIR]** Quem propõe crédito, como avisar a pessoa citada, prazo, contestação, correção e histórico; não implementar reputação como atalho para resolver essas questões.

### 6.7. [BEA-01] Banco de Beats com identidade própria — Impacto: ****

- Manter **beat** conceitualmente distinto da obra musical final: beat é instrumental disponibilizado pelo produtor, enquanto uma música pode incorporar um beat e ter gravações/créditos próprios.
- Apresentar **imagem/capa**, nome, beatmaker, tags/estilos, informações apropriadas e ações realmente suportadas pelo sistema.
- Preservar a lógica de ofertas/licenças e exclusividade **somente conforme houver regras e persistência verificadas**; não anunciar compra ou transferência automática caso o fluxo transacional não exista.
- Permitir que a mesma identidade profissional divulgue beats, apareça em créditos musicais e mantenha um portfólio integrado.

### 6.8. [MID-01] Fichas e galerias multimídia — Impacto: **** · D-12

- Obras musicais podem usar capa; clipes e vídeos usam miniaturas e acesso apropriado; grafite, ilustração, design e fotografia utilizam **galerias de imagens**; eventos utilizam cartazes e registros autorizados.
- Mídias devem ter relações com autor, registro de origem, visibilidade e eventual crédito profissional; remover imagem da vitrine não deve apagar indevidamente uma obra ou outro vínculo existente.
- **[A DEFINIR]** Limites de quantidade/tamanho, formatos suportados, armazenamento, direitos de publicação, moderação e vídeos hospedados versus links externos.

---

## 7. Publicar — central de criação de conteúdo

### 7.1. [PUB-01] Página independente de publicação — Impacto: ***** · D-12

- Criar a seção **Publicar** (nome recomendado) acessível aos profissionais autorizados pela navegação principal.
- Reunir **Criar obra/música, Cadastrar beat, Criar evento, Publicar galeria/trabalho visual, Publicar material audiovisual** e modalidades futuras pertinentes, sem confundir conteúdos distintos num banco de dados genérico e sem controle de tipo.
- Apresentar **apenas ações para as quais a conta tem permissão**, explicando indisponibilidades em vez de abrir formulários que só falham no envio.
- Consumidores não recebem permissão de publicação por comentarem ou curtirem; direcionar à ativação profissional quando apropriado.

### 7.2. [PUB-02] Experiência de seleção da modalidade — Impacto: ***

- Tela de entrada com **cards visuais por tipo de conteúdo**, título e finalidade; ao selecionar, abrir o formulário pertinente e não exigir campos de música numa publicação de grafite, por exemplo.
- Obras e beats podem compartilhar elementos visuais do fluxo e iniciar com a modalidade pré-selecionada, desde que suas **entidades e validações continuem distintas**.
- A publicação só é considerada concluída após criação válida e persistida, com retorno para visualizar/gerenciar o registro.

### 7.3. [PUB-03] Inclusão real das profissões não musicais — Impacto: ***** · D-01/D-12

- Permitir que profissionais de dança, artes visuais, audiovisual, comunicação e cultura utilizem formatos pertinentes, especialmente **galerias, fotos, vídeos e materiais de portfólio**, sem obrigá-los a cadastrar uma “música” para aparecer na Cypher.
- As funções de F09 orientam o tipo de conteúdo e os campos sugeridos; **matriz de permissões explícita** é necessária para evitar liberar ações erradas apenas pelo agrupamento da profissão.

### 7.4. [PUB-04] Relação entre item criado, descoberta e portfólio — Impacto: ***** · D-04/D-05

- Um conteúdo criado precisa ter um **registro de origem único**, ficha compartilhável e relação com o autor/participantes.
- A partir desse registro, pode aparecer em Descoberta, resultado de Busca, perfil e portfólio **sem multiplicar a mesma obra no banco**.
- Remover da vitrine, privar ou moderar a publicação deve refletir em todos os locais onde ela aparece, segundo regras de visibilidade.

---

## 8. Eventos, agenda, participação e mapa

### 8.1. [EVE-01] Eventos como categoria principal reconhecível — Impacto: **** · D-11

- **Eventos** é a denominação preferencial da página hoje referida como Oportunidades se a funcionalidade concreta for agenda, interesse, inscrição e mapa de eventos.
- Distinguir **evento** (acontecimento com data/local/organização) de **chamada profissional** (briefing, vaga, seleção ou demanda que pode nem corresponder a um evento).
- Migrar menus, textos, links e filtros sem quebrar rotas existentes; verificar se a página /opportunities armazena outras entidades antes de renomeá-la conceitualmente.

### 8.2. [EVE-02] Cards e fichas de eventos — Impacto: ****

- Cards com **cartaz/capa**, nome, categoria, localidade adequada, data e hora, organizador público, ação de ver detalhes, salvar/interesse e compartilhar.
- Página do evento com descrição, agenda, participantes/organização conforme permissões, imagens e eventualmente galeria.
- O local deve servir ao mapa; a divulgação de endereço exato depende da natureza pública do evento e das regras de visibilidade.
- Comentários são acessíveis a consumidores e profissionais quando permitidos; vínculos de selos e organizadores seguem SEL-04.

### 8.3. [EVE-03] Mapa de eventos com filtros integrados — Impacto: **** · D-11

- Adicionar visualização **Lista | Mapa** compartilhando filtros. Cada marcador representa um evento com localização utilizável; ao selecionar, mostrar resumo e link à ficha.
- Diferenciar **tipos de evento** com ícones/marcadores; não usar a identidade da profissão do autor como único indicador do tipo de encontro.
- Escolher solução de mapas considerando gratuidade, limite de uso, atribuição, desempenho e qualidade de cobertura. **[A DEFINIR]** Provedor e granularidade.
- Se um evento não possuir coordenadas confiáveis, manter acesso pela lista; não inventar localização no mapa.

### 8.4. [EVE-04] Interesse, inscrição e confirmação — Impacto: ***** · D-11

- Preservar a lógica de **interesse persistente** e os possíveis estados mencionados em conversas/contexto: interessado, inscrito, confirmado, rejeitado e cancelado, sujeitos à inspeção do repositório e ao modelo definitivo.
- **[RECOMENDAÇÃO]** Diferenciar evento de **participação aberta** (adesão direta conforme regras) e **sujeita a aprovação** do organizador, evitando usar “interessado” e “confirmado” como sinônimos.
- Organizadores só podem decidir solicitações dos eventos que administram; cada transição deve ter validação e histórico. Um comentário ou curtida no evento **não constitui inscrição**.
- **[A DEFINIR]** Capacidade, prazos, cancelamentos, múltiplos papéis e fluxo de aprovação.

### 8.5. [EVE-05] Salvar evento e lembretes reais — Impacto: ***** · D-07/D-11

- Salvar o evento ou indicar interesse deve criar um vínculo persistido com o usuário, distinto de inscrição confirmada.
- O plano original prevê alertas **dentro do site no intervalo de até 30 dias antes do evento e no próprio dia**; quando a pessoa manifesta intenção efetiva de participar, também prevê **e-mail**.
- Atualização/cancelamento do evento deve corrigir ou cancelar alertas pendentes. A notificação apresenta o evento e direciona à ficha válida, sem usar dados de horário desatualizados.
- **[A DEFINIR]** Frequência exata no intervalo de 30 dias, opt-in/opt-out de e-mail, agendador, fuso horário e cancelamento dos lembretes.

### 8.6. [EVE-06] Indicadores de participação — Impacto: ****

- Auditar o card **“Seu rastro na cena”** e demais estatísticas relacionadas a eventos. Contagem de interesses, inscrições e participações confirmadas devem ser **métricas distintas**.
- Indicadores sem fonte persistida não devem aparentar histórico real; remover ou rotular contexto demonstrativo de modo inequívoco.

---

## 9. Mensagens, notificações e contato

### 9.1. [MSG-01] Atalho flutuante de mensagens — Impacto: **** · D-07

- Acesso compacto no **canto inferior direito**, independente da sidebar, com conversas recentes e contador verdadeiro de mensagens não lidas.
- Ao clicar, abrir painel com lista de conversas e acesso à conversa individual sem obrigar navegação integral.
- No cabeçalho, ícone intuitivo de **expandir para página completa** (setas diagonais), em substituição ao texto **“Ver mais”**.
- O popup é uma apresentação do mesmo sistema da tela de Mensagens; fechar o popup não exclui dados, nem encerra a conversa.

### 9.2. [MSG-02] Mensagens e histórico persistentes — Impacto: **** · D-07

- Persistir conversas, participantes, mensagens e estados necessários; histórico deve sobreviver a novo login, atualização de página e uso de outro dispositivo.
- Aplicar permissões de comunicação e bloqueio, controle de participantes, envio, recebimento, leitura/não lida e tratamento de falhas.
- **Apagar mensagem** precisa ter regra explícita: apagar só para si versus remoção para todos, prazo e efeitos sobre o histórico. **[A DEFINIR]** Sem essa definição, não implementar exclusão destrutiva implícita.
- Evitar colisões de camadas entre popup de mensagens, notificações, menu Mais e sidebar expandida.

### 9.3. [NOT-01] Caixa de notificações persistente — Impacto: ***** · D-07

- Uma notificação permanece registrada até o usuário **apagar aquela notificação** ou **limpar a caixa**. Fechar popup, ler ou sair da conta **não apaga** o registro.
- Popup e página dedicada exibem os mesmos itens e a mesma marcação de lido/não lido; contadores representam registros verdadeiros.
- Cada notificação possui destinatário, motivo, recurso de origem, momento e destino válidos; uma notificação de evento aponta para o evento, uma de mensagem aponta para a conversa etc.
- Bloqueios, privacidade e alterações em conteúdo de origem devem ser respeitados na exibição e nos links.

### 9.4. [NOT-02] Notificações acionadas por eventos reais — Impacto: ***** · D-07

- Prever, após especificação, alertas de **mensagem recebida, novo seguidor, interação relevante, comentário ou menção permitida, atualização de evento salvo, aprovação/rejeição de inscrição, crédito a revisar e decisão administrativa**.
- Não criar notificações fictícias para parecer que a plataforma está ativa; evitar repetição, duplicidade e notificações ao próprio autor por ações próprias.
- **[A DEFINIR]** Quais eventos geram aviso, agrupamento, frequência, preferências e entrega por e-mail.

### 9.5. [MSG-03] Entrada de contato com a equipe — Impacto: **** · D-08

- Disponibilizar **Falar com a Cypher** para sugerir profissão/vertente/gênero/tipo ausente, pedir exceção à regra de 60 dias, relatar problema ou solicitar orientação.
- Solicitações precisam de categoria, descrição, autor, data, estado de tramitação e resposta; encaminhar à fila administrativa autorizada.
- Não misturar essa fila interna com as mensagens privadas entre usuários ou comentários públicos.

---

## 10. Portfólio profissional: Manual, Inteligente e moldes

### 10.1. [POR-01] Portfólio multiformato sem duplicar dados — Impacto: ***** · D-04

- O portfólio pode reunir **obras musicais, beats, participações, fotos, ilustrações, grafites, clipes, dança, trabalhos audiovisuais e conteúdos das demais profissões**, conforme elegibilidade.
- Cada item referencia seu **registro original**: aparecer em duas seções do portfólio não deve criar duas obras distintas nem perder autoria/créditos.
- Um único perfil público contém seções/módulos por profissão ou área, reutilizando foto, biografia, identificador e contato compartilhados.

### 10.2. [POR-02] Moldes visuais por tipo de trabalho — Impacto: **** · D-04

- Disponibilizar **moldes predefinidos** pertinentes às áreas da conta, organizando automaticamente imagens e registros em seções visuais coerentes.
- **Molde** decide **como** apresentar o portfólio; **modo** decide **quais itens** entram e **como se atualizam**. São escolhas independentes.
- **[RECOMENDAÇÃO]** Permitir molde por área quando a pessoa exerce profissões muito distintas, mas manter identidade pública única.
- Trocar o molde não apaga trabalhos ou suas relações persistidas.

### 10.3. [POR-03] Modo Manual — Impacto: **** · D-04

- Profissional seleciona **itens, ordem, destaque, área e visibilidade** de sua vitrine; persistir escolhas para outros acessos/dispositivos.
- Retirar item do portfólio remove apenas da **vitrine**; não apaga obra, beat, galeria, crédito, publicação ou registro original.

### 10.4. [POR-04] Modo Inteligente — Impacto: ***** · D-04/D-03

- A vitrine acompanha alterações em registros elegíveis vinculados ao perfil e organiza cada item pelo tipo de conteúdo e pelo **papel efetivamente exercido**.
- Um beatmaker citado em crédito confirmado não deve virar automaticamente “intérprete da faixa”; um videomaker com crédito de clipe não deve ser apresentado como compositor.
- O usuário mantém capacidade de ocultar/excluir itens da vitrine e editar destaque/ordem conforme política de seu modo.
- Mudanças de registros e créditos não podem reinserir à força itens explicitamente ocultados.

### 10.5. [POR-05] Vínculos não confirmados — Impacto: ***** · D-03/D-04

- Uma menção de terceiro deve poder ser **revisada, confirmada, rejeitada ou contestada** pelo profissional mencionado; até confirmação, não apresentar como participação validada nem acionar seu selo.
- Uma obra no portfólio **não prova** titularidade autoral, direito comercial, licença, qualidade, contratação ou reputação.
- Não criar um novo **status de obra** para refletir a confirmação de crédito; trata-se do estado da **relação pessoa–item**.

### 10.6. [POR-06] Visibilidade e persistência do portfólio — Impacto: ****

- Persistir preferência de modo, molde, ordenação, itens incluídos/excluídos, destaques e permissões; respeitar visibilidade do perfil e do item individual.
- Ao ocultar obra ou conteúdo privado, remover apresentação em Busca/Descoberta/perfil não deve necessariamente excluir a origem do banco.

---

## 11. Selos pessoais de autoria, produção e colaboração

**Proposta conceitual — D-02.** Esta seção desenvolve a ideia sem fechar prematuramente regras de autoria, verificação, licença, armazenamento ou disputa, que devem constituir documentação isolada.

### 11.1. [SEL-01] Um selo pessoal por conta profissional — Impacto: ***** · D-02

- Cada **conta profissional** pode configurar **um único selo pessoal ativo**, a sua **marca visual de assinatura** dentro da Cypher.
- O selo pertence ao **usuário interno**, não ao @ atual e não a cada profissão. Um perfil que exerce Beatmaker, Mixador e DJ **não pode manter três selos simultâneos para simular três identidades**.
- **Personalização:** imagem/símbolo ou composição gráfica com identidade própria, cores e eventual texto curto; mostrar prévia em claro/escuro e tamanhos reais. Sujeito a limites técnicos, legibilidade, formatos seguros e política de conteúdo.
- O usuário pode **editar/substituir seu selo**, preservando a identidade da conta. **[A DEFINIR]** Se registros históricos exibem sempre o selo atual ou a versão que estava ativa na data da colaboração; é recomendável registrar versões para auditoria.
- O selo **não indica verificação oficial, titularidade legal, certificação de qualidade ou endosso da Cypher**. Não usar check de “verificado” ou símbolos oficiais da plataforma na sua aparência.

### 11.2. [SEL-02] Quem pode ter selo? Análise de alternativas — Impacto: ***** · D-02

|Modelo possível|Vantagem|Risco/limitação|Avaliação|
|---|---|---|---|
|Exclusivo a beatmakers e produtores técnicos|Destaca créditos técnicos de músicas|Exclui compositor, designer de capa, fotógrafo e outros autores com contribuição reconhecida|**Não recomendado** como regra geral|
|Exclusivo a quem colabora com obras/eventos|Usa apenas vínculo concreto|Dificulta assinatura de trabalho solo e de outras publicações autorais|Parcialmente adequado|
|Disponível a todos os profissionais, sempre estampado em tudo|Inclusivo e simples|Poluição visual e selo perde relação real com a contribuição|**Não recomendado**|
|**Um selo por profissional, exibido conforme papel e vínculo**|Inclusivo, específico e consistente|Requer modelo de créditos/organização e controles de veracidade|**Recomendação principal**|

**[RECOMENDAÇÃO]** Não restringir a titularidade do selo por cargo. **Todo profissional pode criar sua marca**, mas ela **só aparece vinculada a um item quando há autoria ou participação pertinente reconhecida**. Em trabalhos próprios, aparecer como assinatura do autor; em conteúdos de terceiros, depender de crédito/participação confirmados. Consumidor não precisa de selo antes de ativar perfil profissional.

### 11.3. [SEL-03] Selo em obra musical ou beat — Impacto: ***** · D-02/D-03

- Na ficha de uma obra, o selo de um Beatmaker aparece acompanhado de **“Beat por [nome público]”**; o de um Mixador com **“Mixagem por...”**; o de Masterizador com **“Masterização por...”** e assim por diante.
- Em uma mesma obra, vários profissionais podem ter selos **sem transformar os selos num mosaico ilegível**: destacar participantes principais e oferecer **“Ver todos os créditos”**.
- O selo abre o perfil do profissional ou a área de créditos; **nunca substitui o texto do papel exercido** nem a autoria de referência.
- Quando a pessoa é creditada por outro usuário, **selo só deve constar após o vínculo ser reconhecido segundo D-03**. Crédito contestado não pode manter uma marca que aparenta endosso da pessoa indevidamente associada.
- O mesmo beatmaker pode utilizar o **mesmo selo** em diferentes instrumentais e músicas — não um selo novo para cada produção.

### 11.4. [SEL-04] Selo em eventos e obras visuais — Impacto: ***** · D-02/D-11

- Em um evento, exibir **“Organização por...”**, **“Produção cultural por...”**, **“Colaboração de...”** ou equivalente **junto do selo correspondente**, segundo papel confirmado e exibível.
- Se várias pessoas organizaram/colaboraram, apresentar selos agrupados por função com abertura para participantes completos; não limitar falsamente o evento a uma marca só.
- Em capa/arte, videoclipe, fotografia, dança ou outros trabalhos, o profissional pode ter seu selo atribuído a **crédito concreto**, por exemplo “Arte de capa por...” ou “Vídeo por...”.
- **Selo nunca equivale a patrocínio, parceiro comercial, contratação ou apoio oficial**, a menos que essas relações sejam registradas e identificadas separadamente.

### 11.5. [SEL-05] Editor, segurança e política dos selos — Impacto: **** · D-02/D-12

- Área **Meu selo** dentro da edição profissional, com prévia, edição/substituição e instrução clara: “Sua assinatura visual aparece nos trabalhos e eventos em que sua participação é reconhecida”.
- Validar upload, dimensões, transparência, tipo e peso do arquivo. Prever apresentação acessível e alternativa textual (Selo de [nome público]).
- Bloquear tentativa de imitar a marca oficial da Cypher, se passar por outra pessoa, infringir direitos de terceiros ou exibir material inadequado; prever denúncia e revisão.
- Se um usuário perde acesso profissional ou é moderado, o destino do selo e dos usos históricos deve ter regra auditável; não apagar a existência dos créditos por simples troca da arte do selo.

### 11.6. [SEL-06] Questões para o documento próprio — Impacto: ***** · D-02

Resolver antes de codificar: **(1)** o selo exige profissão ativa ou basta um conteúdo autoral próprio? **(2)** selos de eventos exigem confirmação de cada organizador? **(3)** qual o estado inicial de um crédito de terceiro? **(4)** como tratar disputa, falsificação e remoção? **(5)** quais formatos/limites de imagem? **(6)** qual versão aparece em obras antigas? **(7)** quais metadados são públicos? **(8)** quais permissões um selo herdará da privacidade da conta? **(9)** como impedir excesso de marcas em cards? **(10)** como separar visualmente selo pessoal de eventual verificação oficial futura?

**Decisão orientadora:** priorizar **identidade + vínculo real + contexto do papel**. Isso valoriza quem fez o beat ou a produção técnica sem rebaixar os demais colaboradores que efetivamente contribuíram para a obra ou o evento.

---

## 12. Configurações e preferências

### 12.1. [CFG-01] Reorganização da página — Impacto: ***

- Sair do formato one-page excessivamente longo e dividir em **Conta, Identidade pública, Privacidade, Descoberta e Aparência** ou grupos equivalentes.
- Evitar repetir formulários de Editar perfil em Configurações; apresentar links de acesso contextual quando forem seções distintas.
- Manter navegação clara no desktop e no celular, com salvamento e feedback perceptíveis.

### 12.2. [CFG-02] Privacidade de perfil e conteúdo — Impacto: ***** · D-01/D-04

- Direção consolidada: **perfis profissionais públicos por padrão**, de forma transparente no cadastro. Permitir alterar a exposição conforme as regras ainda a definir.
- Dar controles compreensíveis para **perfil, localização, contato, respostas profissionais, portfólio e publicações individuais**. Diferenciar Público, Colaboradores autorizados e Privado quando a relação de colaborador for verificável.
- **[A DEFINIR]** UX final para explicar o padrão público, visibilidade inicial do consumidor e proteção adicional de menores.
- Fazer com que edição de visibilidade afete também busca, recomendações, links e arquivos, não somente o botão do perfil.

### 12.3. [CFG-03] Preferências da Descoberta — Impacto: **** · D-05

- Dar seção própria a **região principal, gêneros/estilos de interesse e preferências pertinentes à descoberta**; separar preferências de consumo de profissões declaradas.
- A região influencia sugestões de eventos e profissionais, mas não obriga a divulgar bairro ou endereço no perfil.
- Dados vazios devem ser explicados e editáveis; mudança de preferência deve refletir nos filtros/sugestões que realmente a utilizam.

### 12.4. [CFG-04] Alternância de tema com personalidade — Impacto: *

- Melhorar a experiência da troca **claro/escuro** com transição e feedback visual coerentes com a Cypher, em vez de apenas um switch estático.
- Persistir a preferência, não piscar tema incorreto ao recarregar, respeitar redução de movimento e **evitar dependência extra** por mera ornamentação.

### 12.5. [CFG-05] Acesso estratégico à Cypher Central — Impacto: **

- Retirar o **card tradicional “Ajuda e Sobre / Continue no caminho”** da composição principal das Configurações.
- Manter entrada reconhecível da **Cypher Central**, eventualmente flutuante ou em ponto secundário, com símbolo próprio e posição que não bloqueie formulários ou ações.

---

## 13. Cypher Central — orientação e qualidade educativa

### 13.1. [CEN-01] Central de conhecimento não limitada a FAQ — Impacto: **** · D-09

- Ser ambiente de **aprendizado de uso e de possibilidades profissionais**: não apenas “onde clico?”, mas “como posso divulgar uma obra, encontrar um parceiro e chegar a uma colaboração?”
- Guias objetivos por funcionalidade e profissão, demonstrações visuais, exemplos de perfis e publicações fictícias claramente identificados como exemplos, passos curtos e cenários interativos quando viáveis.
- Mostrar relações específicas de F09: rapper–beatmaker, rapper–produtor, artista–designer, artista–empresário, artista–organizador, rapper–DJ, coreógrafo–videomaker etc.
- Ilustrar oportunidades sem prometer resultado garantido ou projetar informações falsas de usuários reais.

### 13.2. [CEN-02] Guias por áreas e profissões — Impacto: ****

- Organizar conteúdos pelos **26 cargos ativos e sete áreas**, explicando **o que cada profissional pode apresentar, com quem costuma colaborar e como encontrar essas pessoas na Cypher**.
- Exemplo de sequência educativa: “Rapper publica obra → encontra beatmaker → cria conversa → formaliza crédito → divulga portfólio”. Esse cenário é instrutivo e **não cria funcionalidades automáticas por si só**.
- Revisar materiais quando uma profissão ou um recurso for removido/renomeado, para não ensinar telas inexistentes.

### 13.3. [CEN-03] Editor de artigos e categorias — Impacto: **** · D-09/D-08

- Permitir aos administradores **com competência editorial** criar, editar, revisar, publicar, arquivar e organizar artigos/guias sem editar o código.
- Categorias sugeridas: **Primeiros passos; Funcionalidades; Profissões; Conexões; Publicações e portfólios; Eventos; Privacidade e segurança; Dúvidas frequentes**.
- Persistir autoria, data de publicação, última atualização, estado do material e histórico de revisão segundo política editorial.

### 13.4. [CEN-04] Artigos recentes funcionais — Impacto: ***

- **Manter o componente de artigos recentes**, apontado explicitamente como não funcional em F01, e torná-lo real: consultar artigos publicados por data definida, exibir resultado consistente e abrir o conteúdo correto.
- Não preencher com artigos fictícios. Se não houver artigos, mostrar estado vazio e orientação apropriada.

### 13.5. [CEN-05] Feedback de utilidade dos artigos — Impacto: **** · D-09

- Permitir que o leitor indique se o artigo foi útil. Para avaliações negativas, apresentar motivos **Informação incompleta; Explicação confusa; Instruções difíceis; Desatualizado; Não respondeu à dúvida; Outro motivo**.
- “Outro motivo” é **motivo de feedback**, não profissão/gênero livre; preservá-lo.
- Persistir respostas com medidas contra votos repetidos indevidos e dados necessários para análise, sem converter em **avaliação de reputação profissional**.

### 13.6. [CEN-06] Centro de Análise de Qualidade — Impacto: **** · D-09

- Área administrativa própria com **total de artigos publicados, visualizações, quantidade de avaliações, proporção positiva/negativa, taxa de avaliação por visualização, evolução temporal, melhores/piores artigos e necessidade de revisão**.
- Por artigo: **visualizações, avaliações absolutas e percentuais, evolução, motivos de insatisfação e histórico de desempenho**.
- Filtros por **período, artigo e categoria**, gráficos adequados e totais absolutos. **100% de aprovação com duas avaliações não pode ser tratado como superior sem contexto a 90% com centenas**.
- Distinguir eventos de visualização, usuários distintos e avaliações; impedir contagem duplicada e não apresentar estimativas como certeza.

### 13.7. [CEN-07] Busca interna e lacunas de conhecimento — Impacto: **** · D-09

- Registrar buscas por conteúdos educativos quando política de privacidade permitir e identificar **termos frequentes, pesquisas sem resultado e temas sem cobertura**.
- Painel administrativo de lacunas orienta criação de novos guias; não confundir busca na Central com **Busca geral de profissionais/obras**.

### 13.8. [CEN-08] Revisão e atualização dos materiais — Impacto: **** · D-09

- Disponibilizar fluxo administrativo de **conteúdos que precisam de revisão** e relatórios de feedback, para que artigos antigos ou mal avaliados sejam corrigidos.
- Fluxo editorial restrito ao cargo que o possui (Editor ou Super Admin, conforme matriz aprovada), com histórico e regras de publicação.

---

## 14. Administração, moderação e solicitações

### 14.1. [ADM-01] Conta e acesso administrativo separados — Impacto: ***** · D-08

- Conta administrativa não é profissão, não se inscreve no cadastro convencional e **não recebe perfil público profissional**, contador de seguidores ou vitrine artística por padrão.
- Acesso por rota protegida do tipo /admin/login ou /admin **a confirmar no repositório**, com autenticação e autorização no servidor, redirecionamento para navegação administrativa após entrar e rejeição de acesso não autorizado.
- Criar a **primeira conta** por instalação/provisionamento controlado pelo projeto e permitir novos administradores somente por autorização de responsável competente, sem cadastrar senhas em claro ou incentivar edição manual rotineira do banco.

### 14.2. [ADM-02] Três papéis administrativos do catálogo vigente — Impacto: ***** · D-08

|Papel|Finalidade e competências previstas em F06|
|---|---|
|**Administrador Geral (Super Admin)**|Administrar permissões e convites, aprovar inclusão definitiva de profissões/vertentes/gêneros, auditar decisões de outros administradores, gerir configurações essenciais|
|**Moderador**|Analisar exceções dos 60 dias e pedidos excepcionais de @, triagem de solicitações, denúncias, spam e perfis suspeitos, fundamentar decisões|
|**Editor (Gestor de Conteúdo)**|Criar, revisar, publicar e arquivar artigos/guias da Cypher Central, organizar categorias e consultar Centro de Análise de Qualidade|

- Cada painel deve exibir e permitir **somente ações autorizadas**. **[A DEFINIR]** Matriz precisa para gestão de eventos, remoção de conteúdo, revisão de selos, comentários e delegação de permissões.
- Permissão administrativa deve ser concedida/revogada por registro verificável, e não apenas por troca de menu.

### 14.3. [ADM-03] Solicitações e comunicação administrativa — Impacto: **** · D-08

- Centralizar solicitações de **categoria/gênero/vertente/tipo ausente, alteração antecipada de profissão, exceção de @, denúncia, ajuda e outras demandas**.
- Tramitar com **motivo, solicitante, responsável, evidências necessárias, data, estado e resposta**; informar resultado ao solicitante por notificação persistida.
- Aprovação de **nova opção do catálogo global** é ação de responsabilidade autorizada, distinta de aprovar uma **exceção individual**.

### 14.4. [ADM-04] Moderação cruzada — Impacto: ***** · D-06/D-08

- Comentários, perfis, obras, eventos, imagens, selos e mensagens denunciadas precisam de **regras de triagem e ação proporcional**, preservando histórico essencial para auditoria e respeitando privacidade.
- Separar **remover conteúdo da exibição pública**, **cancelar associação indevida**, **bloquear conta** e **apagar definitivamente registro**, pois têm efeitos diferentes.
- **[A DEFINIR]** Critérios, níveis de severidade, recursos e acesso a conteúdo de mensagens privadas em denúncias.

### 14.5. [ADM-05] Log de ações sensíveis — Impacto: **** · D-08

- Registrar criação/revogação de administradores, alterações de permissões, exceções dos 60 dias e 30 dias, mudanças no catálogo, decisões de moderação e correções de créditos conforme necessidade.
- Logs não são um feed público e não devem conter senha, token, informação médica ou dados pessoais desnecessários.

---

## 15. Indicadores e funcionalidades em observação

### 15.1. [IND-01] Auditoria global de estatísticas — Impacto: *****

- Identificar cada contador, gráfico, KPI, card e número que parece real em perfil, Obras, Eventos, Descoberta, Central e administração.
- Para cada indicador, documentar **fonte persistida, definição da métrica, período, regra de agregação, atualização e tratamento de ausência de dados**.
- Onde houver valor demonstrativo ou impossível de calcular, **retirar a aparência de estatística real**; não substituir ausência de registro por número inventado.
- Diferenciar **curtida, seguidor, comentário, visualização, participação, inscrição, crédito confirmado e avaliação**, sem misturá-los em “engajamento” sem definição.

### 15.2. [REP-01] Avaliação e reputação profissionais — Impacto: ***** · **STAND-BY**

- A ideia permanece registrada, mas **não deve ser implementada/reformulada por este documento**.
- Primeiro, especificar como **colaborações são iniciadas, aceitas, comprovadas, registradas e contestadas**. Só depois discutir quem pode avaliar, qual experiência autoriza avaliação, critérios de reputação, abuso e efeitos para perfis.
- **Curtida de perfil**, **selo pessoal**, **comentário público** e **crédito confirmado** não devem gerar automaticamente uma nota de reputação.
- Documento próprio futuro condicionado à conclusão de D-03.

---

## 16. Decisões pendentes e questões a levar ao grupo

As perguntas abaixo são **intencionais**; ignorá-las tornaria a especificação artificialmente definitiva. A coluna de caminho proposto é recomendação inicial, não decisão já aprovada.

|Código|Questão ainda não fechada|Caminho recomendado / consequência|Impacto|
|---|---|---|---|
|P-01|Idade mínima, tratamento de menores e consentimento|Definir antes de disponibilizar cadastro com validação de idade; data pessoal sempre protegida|*****|
|P-02|O consumidor possui perfil pesquisável, seguidores ou somente uso privado?|Definir visibilidade própria; não presumir paridade com perfil profissional|*****|
|P-03|Consumidor pode voltar de profissional a consumidor?|Desativar capacidades sem apagar automaticamente histórico nem trabalhos|*****|
|P-04|“Curtir perfil” tem valor UX próprio além de seguir?|Preservar requisito, mas testar redundância; não confundir com reputação|****|
|P-05|Profissões são suficientes para autorizar quais publicações?|Criar matriz profissão × ação revisada e checada no servidor|*****|
|P-06|O nome “Produtor(a)” deve aparecer como “Produtor(a) musical”?|Recomenda-se desambiguação, preservando código/registro interno|***|
|P-07|Deve haver etapa de confirmação formal de crédito?|**Sim, recomendada** antes de selo/participação validada; detalhar fluxos e contestação|*****|
|P-08|Todo profissional pode ter selo?|**Sim, recomendação**, um por conta, exibição só com papel/contexto válido|*****|
|P-09|Selo histórico usa versão da época ou a atual?|Registrar versões; escolher apresentação com critério explícito|****|
|P-10|O autor pode desligar comentários? E como respostas/moderação funcionam?|Definir regras comuns antes de ligar comentários em todos os itens|*****|
|P-11|Oportunidades guarda apenas eventos ou também chamadas não-evento?|Auditar modelos/rotas; **Eventos** se o domínio for realmente agenda de eventos|****|
|P-12|Qual é a recorrência dos avisos de eventos em até 30 dias?|Definir calendário, cancelamento, e-mail e preferências|****|
|P-13|Qual mapa gratuito e como exibir registros sem localização?|Escolher após validar limites, cobertura e termos; lista como fallback|****|
|P-14|O que significa “colaborador autorizado” na privacidade?|Definir relação verificável, não mera pessoa que curtiu/seguiu|*****|
|P-15|O @ muda a cada 30 dias?|Confirmar a sugestão de F03 e as exceções administrativas|****|
|P-16|Como lidar com profissões removidas já persistidas?|Auditoria/migração antes de eliminar opções legadas e permissões|*****|
|P-17|Como tratar “gênero musical”, “vertente” e influência?|Preservar as 16 opções e padronizar classificação antes da edição técnica|****|
|P-18|Mídia será armazenada no servidor ou por URLs externas?|Definir política por tipo, direitos, tamanho e segurança antes das galerias|*****|
|P-19|Quais notificações são necessárias e quais dependem de consentimento?|Taxonomia de eventos e preferências antes de programar avisos/e-mail|*****|
|P-20|Como provisionar Super Admin e convidar outros?|Processo inicial controlado, convites auditáveis e nenhuma criação via cadastro público|*****|
|P-21|Quais ações de moderação cada papel administrativo pode executar?|Fechar matriz específica de permissões e recurso/revisão|*****|
|P-22|Como expor portfólio Manual/Inteligente em várias profissões?|Um perfil; módulos por área; permitir ocultações persistentes|*****|
|P-23|Como renomear rotas antigas sem quebrar links?|Conferir código real; definir redirecionamento/migração por rota|****|
|P-24|Qual fluxo de exclusão de mensagens, comentários e contas?|Distinguir ocultação individual, remoção pública, moderação e exclusão definitiva|*****|

---

## 17. Plano de implementação orientado por dependência

**Não ordenar cegamente pelo número de estrelas.** Asteriscos indicam alcance da mudança; a execução deve seguir **pré-requisitos, validação de escopo e capacidade real do projeto de TCC**. O plano abaixo é um roteiro proposto e não confirma a situação atual do código.

|Ordem sugerida|Pacote|Por que vem nesta etapa|Impacto predominante|
|---|---|---|---|
|**0**|**Auditoria do repositório e inventário de dependências**|Confirmar implementado versus pendente, modelos, rotas, páginas, dados legados e indicadores fictícios; congelar decisões aprovadas|*****|
|**1**|**Taxonomia, identidades, autorização, dados pessoais e nomenclatura**|Resolver D-01, 26 profissões, consumidor/profissional/admin, idade, @, vulgo e regras de permissão antes de expandir o produto|*****|
|**2**|**Cadastro progressivo, edição de perfil e privacidade**|Fluxos dependem da identidade definida; aplicar validação e persistência com UX visual, sem duplicar profissões|*****|
|**3**|**Remoções antigas e padronização da navegação**|Eliminar Visão Geral, status de obras/status lateral e referências; sidebar hover, nomes e reorganização de configurações|****–`*****`|
|**4**|**Taxonomia de obras, fichas, cards com mídia e galerias essenciais**|Criar apresentação de conteúdo coerente antes de expandir a distribuição; decidir infraestrutura de arquivos|****–`*****`|
|**5**|**Publicar, créditos e vínculos profissionais reais**|Consolidar registro único, tipos de mídia e associação de pessoas; fechar D-03|*****|
|**6**|**Seguir, curtir, comentar, Busca e moderação básica**|Interações dependem de perfis e itens identificáveis; estabelecer restrições, persistência e controle de abuso|*****|
|**7**|**Portfólio Manual → moldes → Inteligente**|Começar pelo controle explícito do usuário; só automatizar após créditos confirmáveis e visibilidade definida|*****|
|**8**|**Eventos, mapa e notificações/mensagens**|Evoluir relacionamentos, interesse e lembretes reais sobre registros estáveis; dividir em incrementos executáveis|*****|
|**9**|**Selos pessoais e aplicação contextual**|Necessita identidade estável, upload controlado e **créditos/organização confirmáveis**; nunca basear marca em atribuição arbitrária|*****|
|**10**|**Descoberta contextualizada e Cypher Central avançada**|Primeiro mostrar conteúdo real com filtros; depois personalizar recomendações e adicionar análises educativas com volume de dados significativo|****–`*****`|
|**Futuro**|**Avaliação e reputação**|Esperar comprovação de colaboração e política antifraude; **STAND-BY**|*****|

**Ajuste essencial:** a **fundação administrativa mínima** (autorização, Super Admin, moderação indispensável, filas relevantes) deve ser prevista já nos pacotes 1–2 e ampliada ao longo do plano, **não adiada inteiramente ao pacote 10**. Um cadastro com novas permissões e comentários públicos sem controle de acesso/moderação seria inconsistente.

**Incrementos pequenos com boa relação de resultado/risco**, após conferir as dependências: correção dos controles de senha, apresentação do card da Central, estados vazios, texto explicativo da distinção @/vulgo, indicador de progresso, controles de tema e refinamentos visuais dos filtros. Esses itens de menor impacto não substituem as decisões fundacionais.

---

## 18. Documentação isolada a produzir sob solicitação

Estes são **títulos propostos de arquivos futuros**, não arquivos criados nem especificações técnicas concluídas.

|Documento futuro|Requisitos que deve detalhar|Condições de entrada|
|---|---|---|
|D-01-identidades-perfis-categorias-permissoes.md|GER-01/09, CAD-01–10/12, PER-03/04, ADM-01|Política etária, catálogo, conversão e matriz de ações|
|D-02-selos-pessoais-e-aplicacao.md|SEL-01–06, OBR-04/06, EVE-02|Créditos e participações com regra de confirmação|
|D-03-creditos-colaboracoes-e-contestacoes.md|OBR-06, POR-04/05, SEL-03/04|Tipos de papel, estados da relação e regras de validação|
|D-04-portfolio-manual-inteligente-moldes.md|POR-01–06, PER-06|Mídia, créditos e visibilidade estabilizados|
|D-05-descoberta-recomendacoes-e-feed.md|DES-01/02, BUS-01–03, CFG-03|Conteúdos e sinais persistentes; privacidade definida|
|D-06-interacoes-comentarios-curtidas-seguidores.md|GER-06/07, PER-05, CEN-05, ADM-04|Matriz de permissão, moderação e notificações|
|D-07-mensagens-notificacoes-lembretes.md|MSG-01/02, NOT-01/02, EVE-05|Taxonomia de eventos, entrega e preferências|
|D-08-administracao-rbac-solicitacoes-auditoria.md|ADM-01–05, MSG-03|Provisionamento e competências por papel definidos|
|D-09-cypher-central-editor-e-qualidade.md|CEN-01–08|Modelos de artigos, eventos de leitura e métricas|
|D-10-obras-fonogramas-composicoes-isrc-iswc.md|OBR-04/05/06, OBR-02|Modelo de obra/gravação e direitos/responsabilidades|
|D-11-eventos-mapa-participacoes-alertas.md|EVE-01–06|Eventos versus chamadas; mapas e transições|
|D-12-multimidia-publicacoes-galerias.md|GER-05, MID-01, PUB-01–04|Storage, formatos, permissão, privacidade e moderação|

**Modelo mínimo para cada futuro D-xx:** objetivo e limite de escopo; atores e permissões; pré-condições; fluxo principal; alternativas/erros; dados e entidades; estados/transições; validação de segurança; dependências; impactos no código atual; requisitos de UI/UX, tema e responsividade; migração; testes; critérios de aceite. **A documentação isolada só deve ser redigida quando o tema for solicitado**, para não antecipar regras ainda não deliberadas.

---

## 19. Matriz de rastreabilidade das fontes

A matriz registra **onde as informações foram incorporadas** e as versões que não devem ser reintroduzidas. Ela não substitui o texto de cada requisito.

|Fonte|Requisitos/seções consolidados|Redundâncias ou divergências tratadas|
|---|---|---|
|**F01 — Cypher Central**|CEN-01–08, ADM-02, IND-01, REP-01|Conhecimento educativo ≠ ajuda genérica; análises reais; artigos recentes mantidos|
|**F02 — Escopo consolidado**|GER-01–10, NAV-01–03, CAD-07–11, PER-01–08, OBR-01–06, PUB-01–04, EVE-01–06, NOT-01/02, CFG-01–05, ADM-01–05|Remoções, prazos, privacidade, criação e notificações preservadas; redefinição de profissões segundo F06/F11|
|**F03 — Identificador público**|CAD-03/04, GER-08, ADM-03|Separados nome/vulgo/`@`, disponibilidade, palavras reservadas, limite de 30 dias, aliases e vínculos internos|
|**F04 — Identificadores/Admin/Ouvinte**|GER-01/09, CAD-01/05/12, OBR-05, ADM-01/02, NAV-01|Composição ≠ fonograma; consumidor sem publicação; administração sem perfil público|
|**F05 — Levantamento inicial**|GER-03/04/10, CAD-06/07/09/11, PER-02, OBR-01/03, PUB-01, BUS-02, CFG-01–05, NAV-02, IND-01, REP-01|Página extensa, status, filtros, stats e tema; sidebar de botão substituída por hover de F10|
|**F06 — Perfis**|PER-03/04, CAD-08/09, ADM-02, GER-01|26 ativos, removidos explicitados, Freestyleiro; substitui catálogo mais amplo de F08|
|**F07 — Portfólio**|POR-01–06, PER-06, OBR-06, GER-02|Manual/Inteligente separados de molde; crédito de terceiro não é confirmação|
|**F08 — Reestruturação de profissões**|CAD-06–09, PER-03/04, BUS-01/02, GER-10|Áreas e seleção múltipla retidas; profissão removida e vertentes MC/Freestyler substituídas|
|**F09 — Relações dos perfis**|PER-03, PUB-03, DES-02, CEN-01/02, SEL-04|Aplicações de cada profissão preservadas; exemplos não são permissões automaticamente concedidas|
|**F10 — DOCX navegação/mensagens**|NAV-01/02, DES-01/02, MSG-01/02, GER-04|Cinco referências visuais consideradas; hover/touch, painel inferior e persistência|
|**F11 — Novas solicitações**|CAD-01/03/05/06/09, GER-05–07, PER-05, OBR-02/03, EVE-02, SEL-01–06, seção 2|Cartão de duas faces, visual Pinterest, nome público por vulgo, idade, selos, comentários e nomenclatura|

### 19.1. Inventário dos temas deliberadamente não apagados

- **Profissões removidas:** documentadas como removidas, não como opções de cadastro.
- **Questionário de quatro perguntas:** não mantido como obrigatório no registro; possibilidade de detalhes profissionais foi deslocada para **Editar perfil**.
- **MC/Freestyler com vertentes:** registrado como variante antiga e substituído pela diretriz atual.
- **Status profissional e de obra:** removidos do escopo futuro, sem apagar outros estados legítimos.
- **Oportunidades não-evento:** não descartadas; aguardam apuração se já existem como domínio distinto.
- **Sistema de reputação:** preservado em **STAND-BY**, não confundido com interação ou selo.
- **Artigos recentes da Cypher Central:** mantidos com exigência explícita de funcionamento.
- **Mensagens privadas e notificações:** sistemas distintos, embora visualmente possam usar popups semelhantes.
- **ISRC/ISWC:** preservados e atribuídos a entidades distintas; nenhum código será emitido pela Cypher.
- **Portfólio Manual/Inteligente:** ambos preservados, com moldes independentes e exceções de créditos de terceiros.
- **Imagens do DOCX:** utilizadas apenas como referências de UX; cópia fiel do Instagram não é requisito.

---

## 20. Checklist transversal de aceite para a execução futura

Para cada pacote selecionado, a equipe deverá registrar e conferir:

- Existe decisão aprovada para todos os itens **[A DEFINIR]** que bloqueiam o pacote.
- A análise do **código atual** identifica rotas, modelos, views, controladores, dependências e registros que serão afetados.
- O desenvolvimento não recria profissão, campo livre “Outro”, status de obra ou Visão Geral anteriormente abolidos.
- A regra de negócio funciona no **servidor**, inclusive para requisições diretas, ações sem permissão e dados inválidos.
- Toda ação apresentada como funcional possui persistência e tratamento de erro verificáveis.
- Informações pessoais e conteúdos privados não vazam por busca, cards, recomendações, links ou respostas da API.
- Informações de crédito, selo e portfólio não apresentam participação de terceiros como **confirmada** sem mecanismo de validação.
- Cards com mídia têm fallback e são legíveis em temas claro/escuro e dispositivos móveis.
- Popups, sidebar, menús e painéis não se sobrepõem indevidamente; fluxos por teclado funcionam.
- Indicadores derivam de dados reais e têm semântica e contagem definidas.
- Migrações protegem registros relevantes e não criam compatibilidade residual sem finalidade.
- Testes de fluxos principais, exceções, autorização e regressões estão executados e documentados.
- Toda mudança de nome ou rota atualiza rótulos, links, notificações, compartilhamento e guias correspondentes.
- O registro final de entrega distingue **IMPLEMENTADO**, **PARCIAL**, **STAND-BY** e **NÃO INICIADO** com base em evidência do repositório, não em suposição.

---

## 21. Síntese de direção do produto

A Cypher deve evoluir como **ecossistema de descoberta e colaboração da cena underground**, capaz de atender tanto **quem acompanha** quanto **quem cria** a cultura. A identidade da conta, o tipo de conteúdo, a profissão declarada, o papel efetivamente desempenhado, a autoria e o reconhecimento de colaborações devem permanecer conceitos distintos.

O caminho mais consistente é começar pela base **identidade → permissões → dados e créditos → publicação e visibilidade**. Em seguida, estruturar **interações, portfólios, eventos, mensagens e descoberta**. Selos personalizados valorizam a assinatura de quem contribuiu, mas somente quando associados a um vínculo verdadeiro e contextualizado. A Cypher Central ensina os usuários a explorar esse conjunto; métricas e moderação ajudam a mantê-lo confiável.

**Este arquivo é a referência consolidada de planejamento.** Não foi usado como autorização para alterar o sistema. Requisitos complexos aguardam a solicitação expressa de seus **documentos D-01 a D-12**; a verificação de implementação e a matriz de permissões definitivas exigem auditoria do código real.