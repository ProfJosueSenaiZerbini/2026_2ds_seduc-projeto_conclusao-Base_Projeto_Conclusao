# Escopo consolidado de melhorias — Cypher

**Data:** 13 de novembro de 2026  
**Base:** levantamento fornecido, respostas de esclarecimento e conversas anteriores acessíveis sobre o projeto Cypher.  
**Repositório:** [projeto-conclusao-grupo-6](https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-grupo-6)

Este documento consolida requisitos e direções de produto. Ele não classifica cada item como implementado ou pendente no código; essa comparação deve ser feita separadamente no repositório.

## 1. Contexto e diretrizes gerais

A Cypher é uma plataforma de conexão profissional, portfólio, obras, beats, eventos e oportunidades voltada à cultura hip-hop e underground. A experiência deve atender profissionais musicais, visuais, técnicos, culturais e de outras áreas contempladas pelo catálogo aprovado.

Conversas anteriores acrescentam estas diretrizes:

- Um usuário pode selecionar mais de uma profissão. As permissões correspondentes se somam, sem transformar uma profissão em requisito para exercer outra.
- Rapper e MC devem permanecer como categorias distintas; Compositor e Letrista também.
- Beats e obras musicais são registros relacionados, mas diferentes. Um beatmaker também pode cadastrar obras e participar de músicas sem precisar selecionar Rapper ou MC.
- A página inicial planejada é a área de Descoberta, que substitui a atual Visão Geral.
- A conta administrativa é separada da identidade profissional pública.
- A regra de atualização de profissões a cada 60 dias já foi discutida e deve continuar persistida.

### 1.1. Regras para todas as mudanças

- Quando **ELIMINAR** estiver destacado, remover completamente a funcionalidade indicada e seus elementos dependentes: interface, componentes, regras, validações, rotas, controladores, modelos, referências e registros, conforme aplicável.
- O Cypher ainda está em desenvolvimento. Reestruturar ou remover implementações antigas sem manter compatibilidade desnecessária, preservando apenas dados e comportamentos que continuem tendo finalidade.
- Não manter componentes, rótulos ou lógica obsoletos depois de uma remoção.
- Preservar a identidade urbana, underground e ligada à cultura hip-hop.
- O escopo da remoção de um sistema deve ser aplicado àquele sistema. Por exemplo, a remoção do status profissional e dos status de obras não redefine estados independentes de eventos, notificações, beats ou solicitações administrativas.
- Não criar campos livres de “Outro” para profissão, vertente, gênero musical ou tipo de obra. Quando faltar uma opção adequada, encaminhar uma solicitação à equipe Cypher.

## 2. Página inicial — Descoberta e navegação

### 2.1. Substituição da Visão Geral

Eliminar completamente a atual página **Visão Geral**, incluindo informações e indicadores sem função relevante para a navegação. Em seu lugar, usar **Descoberta** como principal ambiente para explorar o ecossistema Cypher.

A Descoberta deve priorizar:

- Obras, músicas, beats, trabalhos visuais e publicações relevantes.
- Profissionais e possíveis conexões ou colaborações.
- Oportunidades e eventos próximos.
- Conteúdo relacionado às profissões, estilos, interesses e região do usuário, quando esses dados estiverem disponíveis e puderem ser usados.
- Sugestões coerentes com a atuação profissional. Por exemplo, recomendações de rappers para um beatmaker quando houver contexto para uma possível colaboração.

A tela deve funcionar como uma experiência contínua de descoberta, adaptada à Cypher, sem reproduzir um feed genérico de rede social.

### 2.2. Sidebar

A sidebar deve iniciar recolhida, mostrando ícones intuitivos. Ao passar o mouse sobre ela, deve se expandir e revelar os nomes e detalhes da navegação. A navegação principal deve conter ferramentas de uso cotidiano; recursos mais técnicos podem ficar agrupados em uma área secundária, como “Mais”.

Em dispositivos sem interação por mouse, definir uma forma equivalente de abrir e recolher a navegação. Como uma barra de navegação inferior com um botão que esconde e faz aparecer.

### 2.3. Mensagens

Manter um acesso flutuante a mensagens no canto inferior direito. Ao ser aberto, ele deve exibir um painel de conversas persistentes; fechar o painel não deve apagar mensagens nem o estado das conversas.

- Mensagens e conversas devem permanecer disponíveis depois de sair e voltar à plataforma.
- O usuário deve poder apagar mensagens conforme as regras de comunicação do Cypher.
- Usar um ícone intuitivo de expansão para abrir a experiência completa de mensagens.
- A tela completa de mensagens e o painel flutuante devem refletir o mesmo histórico persistido.

## 3. Cadastro e login
### 3.1. Questionário profissional

Reduzir o questionário do cadastro. Deve haver somente uma pergunta obrigatória para cada profissão selecionada: **há quanto tempo a pessoa exerce aquela atividade?**

As demais informações profissionais ficam para a edição de perfil após a criação da conta. Se houver etapas diferentes para selecionar profissões e preencher essa informação, a interface deve indicar o progresso e deixar claro a qual profissão cada resposta pertence.

Depois da criação da conta, apresentar um aviso de perfil incompleto com acesso direto à edição das informações pendentes.

### 3.2. Vertentes profissionais

Para a profissão de Rapper, permitir a seleção das opções pertinentes no fluxo posterior à seleção profissional. Não exibir essa pergunta para as demais profissões.

Atualizar as opções para:
- Boom bap
- Jazz rap
- G-Funk
- Gangsta rap
- R&B
- Gospel
- Trap
- Trap soul
- Grime
- Drill
- Detroit rap
- Jersey Club Rap
- Plug
- PluggnB
- Melodic rap
- Rage

A mesma taxonomia atualizada deve ser aplicada aos campos de gênero e vertente de obras nos contextos em que cada opção fizer sentido. Não usar a classificação antiga nem oferecer “Outro”. Se uma opção estiver faltando, o usuário deve poder reportar a necessidade à equipe Cypher.

### 3.3. Gênero e concordância

Disponibilizar as opções **Masculino**, **Feminino** e **Outro** para que o sistema use a forma de tratamento e a concordância apropriadas, inclusive em nomes profissionais com flexão de gênero, como B-Boy e B-Girl.

Para a opção “Outro”, preferir termos neutros sempre que possível e evitar flexões que atribuam ao usuário uma forma que ele não selecionou. A seleção deve ser persistida e usada de maneira consistente nas telas e nos perfis.

### 3.4. Campos de senha

- Na tela de login, iniciar o campo de senha oculto e oferecer um botão no próprio campo para mostrar ou ocultar a senha.
- No cadastro, incluir senha principal e confirmação de senha.
- A senha principal deve iniciar oculta e oferecer o mesmo botão para mostrar ou ocultar.
- O campo de confirmação deve permanecer oculto e não deve oferecer a opção de revelar o conteúdo.

## 4. Perfil do usuário e edição de perfil

### 4.1. Estrutura da edição

Reformular a edição do perfil para separar informações comuns, dados da conta, atuação profissional, portfólio e privacidade. Manter a biografia e outras informações comuns em um único lugar; não duplicá-las para cada profissão.

A estrutura deve estar preparada para foto de perfil, imagem de capa e uma galeria no perfil dele onde ele pode formar um mural de fotos. As informações profissionais que deixarem de ser obrigatórias no cadastro devem poder ser completadas na edição.

Campos específicos devem aparecer apenas quando fizerem sentido para as profissões selecionadas. Equipamentos e setup, por exemplo, podem ser pertinentes a produtores e profissionais de áudio; não devem ser obrigatórios para profissões como educador cultural.

Portanto analise cada profissão das 26 (sim, 10 foram removidas e deve continuar assim! Expurgue qualquer vestígio dessas antigas.) e tenha um perfil dedicado para cada um deles e se mais de um for escolhido, mescla os campos sem repetir.

### 4.2. Profissões e atualização a cada 60 dias

Persistir a seleção profissional, o histórico de alterações e a regra de intervalo:

1. A pessoa escolhe suas profissões no cadastro.
2. Depois de criar a conta, pode fazer livremente a primeira atualização das profissões.
3. A atualização confirmada é salva e inicia o intervalo de 60 dias.
4. Durante o intervalo, novas alterações ficam bloqueadas e a plataforma informa a data em que poderão ser feitas.
5. Uma alteração antes do prazo deve ser solicitada à administração e só ser aplicada após autorização registrada.

A regra deve ser aplicada no sistema, não apenas ocultando controles na interface. A seleção de várias profissões, por si só, não deve ser tratada como fraude; uma análise requer indícios e contexto.

### 4.3. Apresentação dos perfis profissionais

Os detalhes de cada categoria profissional devem ser organizados visualmente em seções próprias, sem parecerem informações soltas no perfil.

### 4.4. Fotos, galerias e compartilhamento

Permitir foto de perfil e imagem de capa. Preparar galerias para perfis, eventos, obras, músicas, beats e trabalhos visuais, respeitando o tipo de conteúdo.

Criar links compartilháveis para perfis, obras, eventos e outros itens que façam sentido compartilhar. O link deve abrir a página correspondente e respeitar as permissões de visibilidade definidas pelo autor.

### 4.5. Catálogo de obras no perfil

Nos perfis que exibem catálogo, transformar o card de catálogo em um botão. Ao clicar, abrir um popup com a lista de obras organizada, evitando ocupar o perfil inteiro com uma lista extensa.

## 5. Obras — cadastro, listagem e ficha

### 5.1. Cadastro de obras

Atualizar gêneros e vertentes do cadastro conforme a taxonomia aprovada. Remover completamente campos de “Outro” para gêneros e tipos de trabalho. Manter somente as opções padrões e indicar ao usuário solicitar a administração novas opções.

A permissão para cadastrar obras deve considerar a contribuição profissional e o modelo de permissões acumuladas. O cadastro de beats permanece conceitualmente separado do cadastro de obras, mesmo quando os dois fluxos compartilham elementos.

### 5.2. Remoção do sistema de status de obras

**ELIMINAR POR COMPLETO** o sistema de status de obra, incluindo:

- “Em produção”, “Lançado” e “Rascunho”.
- O card “Em andamento” em **/works**.
- Regras, validações, componentes, referências, estruturas e registros que existam exclusivamente para esses status.

Não substituir o sistema por outra lógica de status de obra e não deixar referências residuais.

### 5.3. Página /works e cards

Reestruturar a página de obras para oferecer navegação fluida, hierarquia clara e uma identidade visual urbana e ligada ao rap. Reformular os cards de Obras e Participações para apresentar os dados com mais personalidade e integração visual ao Cypher.

Remover da página os elementos que dependam exclusivamente do status de obra eliminado.

### 5.4. Ficha da obra

Tornar a ficha mais completa e organizada. Mostrar os dados essenciais de forma clara e reservar as informações técnicas para uma área recolhida ou uma ação específica, como **Informações técnicas**.

A ficha deve comportar, conforme o tipo de obra:

- Data e horário de lançamento.
- Créditos, participantes e papel de cada pessoa.
- BPM.
- ISRC e ISWC.
- Outros dados técnicos necessários
A área técnica deve permanecer acessível sem ocupar o primeiro plano da ficha. Obras, músicas, beats e trabalhos visuais devem poder receber imagens ou galerias apropriadas.

## 6. Criação e publicação de conteúdo

Criar uma página independente, com item próprio na sidebar, para centralizar a criação e publicação de conteúdos autorizados pelas profissões e permissões do usuário.

A central deve contemplar obras e músicas, beats, oportunidades, eventos, galerias, trabalhos visuais e outras modalidades pertinentes ao ecossistema. Deve atender profissionais visuais e culturais, não somente artistas musicais, e permitir futuras galerias nos perfis.

O nome definitivo da página continua pendente e deve ser debatido antes de ser escolhido.

Em conversas anteriores foi discutida uma experiência de cadastro compartilhada para obras e beats, podendo abrir já no tipo solicitado e permitir trocar para outra modalidade. Considerar essa possibilidade ao desenhar o fluxo, mantendo a distinção dos dados e das regras próprias de cada conteúdo.

## 7. Oportunidades e eventos

### 7.1. Mapa na aba de Oportunidades

Disponibilizar uma visualização em mapa usando um serviço gratuito de mapas, com eventos posicionados conforme a localização cadastrada.

- Ao selecionar um marcador, exibir as principais informações do evento e acesso aos detalhes.
- Diferenciar visualmente os tipos de evento com marcadores próprios.
- Permitir filtrar o que aparece no mapa pelos filtros pertinentes da página de Oportunidades.
- Manter coerência entre filtros da lista e filtros do mapa.
- Considerar os limites, termos e atribuição do provedor escolhido.

A integração e a forma de encaixar o mapa na aba de Oportunidades ainda são tema de debate. A recomendação inicial deste documento está na seção 14.

### 7.2. Eventos na Descoberta e recursos do evento

Exibir na Descoberta eventos que sejam pertinentes ao usuário, considerando profissão, região e demais critérios disponíveis. Eventos devem poder ter imagem de capa, galeria e link compartilhável.

A localização cadastrada no evento deve servir à exibição do mapa e à descoberta geográfica. A apresentação pública da localização deve seguir as escolhas de privacidade aplicáveis.

## 8. Notificações e compartilhamento

### 8.1. Persistência das notificações

As notificações devem ser persistidas no sistema Cypher e permanecer na caixa de entrada até que o usuário apague uma notificação específica ou limpe a caixa. Fechar o popup ou sair da plataforma não deve removê-las.

A interface deve permitir consultar as notificações no popup e na página dedicada, com o mesmo conteúdo e estado persistido.

### 8.2. Lembretes de eventos

Quando o usuário salvar ou demonstrar interesse em um evento, registrar essa relação no sistema para permitir lembretes funcionais.

- Enviar notificações dentro do site no período de até 30 dias antes do evento e também no dia do evento.
- Exibir na Descoberta eventos que sejam relevantes para aquele usuário, mesmo que ele ainda não tenha confirmado participação.
- Se o usuário indicar que quer participar, enviar alertas por e-mail além das notificações do site.
- Usar a data, o horário e a localização persistidos do evento para programar os avisos.
- Se o evento for alterado ou cancelado, atualizar os lembretes correspondentes para não enviar informações desatualizadas.

A frequência exata dos avisos entre o limite de 30 dias e o dia do evento ainda deve ser definida.

### 8.3. Outros alertas

Aplicar o mesmo princípio a outras situações que realmente exijam aviso: cada notificação deve corresponder a uma ação ou mudança persistida e verificável, com destino e momento de envio coerentes.

## 9. Configurações

### 9.1. Organização geral

Reformular a página de configurações, que hoje concentra muitas opções em uma tela extensa. Organizar as áreas em seções navegáveis, com hierarquia e distribuição mais claras, preservando a identidade visual da Cypher.

### 9.2. Privacidade

Para novas contas, a direção solicitada é criar perfis públicos por padrão. A experiência de privacidade deve ser redesenhada para que o usuário entenda e controle claramente a visibilidade do perfil e dos dados.

Ajustar a interface para permitir decisões claras sobre visibilidade pública, restrita a colaboradores ou privada, conforme o tipo de informação. A localização usada para descoberta deve ser tratada com atenção especial, sem tornar públicos dados mais precisos do que o usuário escolheu compartilhar.

A forma final de comunicar o padrão público e organizar esses controles permanece pendente de consenso.

### 9.3. Descoberta

Dar mais autonomia à seção Descoberta. Ela deve reunir as informações usadas para encontrar profissionais e conteúdos, incluindo região principal, gêneros, estilos e preferências pertinentes.

A localização é central para encontrar profissionais próximos, eventos locais e oportunidades geograficamente relevantes.

### 9.4. Aparência

Reformular a alternância entre temas claro e escuro para tornar a interação mais dinâmica e coerente com a identidade visual do Cypher. Usar JavaScript e animações; incluir biblioteca auxiliar somente se ela melhorar efetivamente o resultado.

### 9.5. Cypher Central

Remover o card convencional de Ajuda e Sobre da estrutura principal. Manter o acesso à Cypher Central — onde ficam guias e respostas — como elemento flutuante ou posicionado de forma estratégica, usando o símbolo visual da própria Central e sem ocupar espaço desnecessário.

## 10. Status profissional na sidebar

**ELIMINAR POR COMPLETO** o sistema de status profissional que aparece no topo da sidebar. Remover sua apresentação, regras, referências e dependências sem deixar vestígios. Ele não deve ser substituído por outra lógica de status profissional.

## 11. Filtros globais

Reformular a experiência de filtros em todo o Cypher. Os filtros devem ser mais visuais, ágeis e consistentes, evitando a aparência de formulários administrativos estáticos.

- Explorar alternativas visuais aos selects convencionais quando melhorarem a navegação.
- Facilitar a aplicação e a remoção dos filtros.
- Manter a clareza das opções e respeitar as particularidades de cada página.
- Reutilizar padrões de interação entre páginas.
- Incluir a reformulação dos filtros de **/opportunities** e refletir os mesmos critérios na visualização em mapa.

## 12. Estatísticas e indicadores

Auditar todos os indicadores, números e painéis do Cypher, tanto os gerais quanto os de perfis e páginas individuais.

- Mostrar somente estatísticas baseadas em dados reais e persistidos.
- Atualizar os indicadores conforme as atividades efetivamente registradas.
- Remover números demonstrativos, valores estáticos ou métricas sem fonte verificável.
- Se um indicador não puder ser calculado com dados reais, não o apresentar como se fosse uma estatística real.

O card **Seu rastro na cena**, em Oportunidades, é um exemplo de indicador sujeito à auditoria, não o único item abrangido.

## 13. Administração e contato com a equipe

### 13.1. Identidade e navegação administrativa

A administração deve funcionar como uma experiência própria, com conta administrativa sem perfil profissional público. Administradores não devem aparecer em buscas, recomendações ou estatísticas de profissionais.

Conversas anteriores propuseram uma rota própria de acesso administrativo, como **/admin/login**, e navegação direcionada ao painel. A rota exata deve ser confirmada com a estrutura atual do projeto. O cadastro público não deve permitir selecionar ou conceder o papel de administrador.

A navegação do painel deve acompanhar as novas regras do Cypher e refletir as permissões administrativas disponíveis. A estrutura de cargos administrativos foi discutida como possibilidade — por exemplo, administração geral, moderação, análise de solicitações e gestão de eventos — mas a matriz final de cargos e permissões ainda precisa ser definida.

### 13.2. Solicitações e contato

Como os campos “Outro” deixarão de existir, o usuário deve poder contatar a equipe dentro da plataforma para:

- Sugerir profissão, vertente ou gênero musical ausente.
- Solicitar alteração profissional antes do fim do prazo de 60 dias.
- Pedir ajuda ou encaminhar uma questão pertinente ao Cypher.

Esses contatos devem chegar a uma área administrativa adequada, com informação suficiente para análise e resposta. O painel administrativo deve incluir a navegação necessária para acompanhar solicitações de categorias, exceções de prazo e demais demandas. O formato detalhado da caixa de entrada ou fila de atendimento ainda precisa ser definido.

### 13.3. Definições administrativas pendentes

Ainda precisam ser especificados o processo de criação da primeira conta administrativa, a inclusão de novos administradores, os cargos e suas permissões, e o procedimento para registrar decisões administrativas. Essas definições devem manter a separação entre contas profissionais e administrativas.

## 14. Temas para debate após os demais pontos

### 14.1. Arquitetura dos perfis profissionais — prioridade de debate

O sistema prevê pelo menos 36 profissões e permite que uma pessoa selecione várias. As opções discutidas foram criar uma experiência separada para cada profissão ou reunir tudo em uma única página.

**Recomendação inicial:** usar um único perfil público por pessoa, com informações compartilhadas — como biografia, foto, localização e catálogo — e módulos específicos para cada profissão selecionada. Na edição, o usuário poderia navegar entre as categorias que exerce; no perfil público, os módulos apareceriam em containers claros e organizados.

Essa solução evita fragmentar a identidade, obras e links da mesma pessoa em vários perfis, e reduz a sobrecarga de uma página que simplesmente acumule todos os campos. Cada profissão deve apresentar somente as personalizações pertinentes, com controles de visibilidade próprios quando necessário. A estrutura não está fechada; a escolha final deve ser discutida antes de detalhar os campos de cada profissão.

### 14.2. Encaixe do mapa em Oportunidades

**Recomendação inicial:** oferecer alternância entre visualização em lista e em mapa dentro da própria página de Oportunidades. Reutilizar os filtros e permitir abrir o resumo do evento pelo marcador. A decisão sobre o provedor gratuito e a apresentação inicial da página deve ser tomada após avaliar os requisitos de cobertura, uso e atribuição.

### 14.3. UX de privacidade

Confirmar como comunicar o perfil público padrão, que dados ficam visíveis e como o usuário controla cada área do perfil. As respostas profissionais e a localização merecem controles compreensíveis e granulares.

### 14.4. Nome da página de criação

A central de criação está confirmada como direção; seu nome continua sem decisão.

### 14.5. Sistema de avaliação e reputação — stand-by

Não implementar nem reformular as regras de avaliação e reputação agora. Primeiro, definir como a Cypher reconhece, registra e valida colaborações reais.

A discussão futura deve tratar de critérios, quem pode avaliar quem, quando uma participação é confirmada, como resolver créditos contestados e como evitar avaliações sem fundamento. Conversas anteriores também levantaram riscos de menções de crédito não confirmadas e de associações automáticas ao portfólio; esses temas devem fazer parte da definição da validação das colaborações.

### 14.6. Definições de precisão restantes

Antes de implementar, confirmar:

- A frequência exata dos lembretes entre 30 dias antes e o dia do evento.
- A lista canônica de profissões e a correspondência de vertentes por profissão.
- A forma final da fila de solicitações administrativas e a matriz de permissões dos administradores.
- O provedor de mapa gratuito e suas condições de uso.

## 15. Contexto técnico de conversas anteriores

Em conversas anteriores, a arquitetura do projeto foi descrita como Node.js, TypeScript, Express, EJS, SQLite, JavaScript sem framework e MVC simples. Confirmar essa descrição no repositório antes de usá-la como requisito técnico de implementação.


