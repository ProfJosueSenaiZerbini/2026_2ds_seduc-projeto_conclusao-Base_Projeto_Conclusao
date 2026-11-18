# Modelo de casos de uso da Cypher

Escopo: produto Cypher, versão atualmente analisada e evolução definida para contas Públicas, contas Profissionais e perfis Administrativos. Data de revisão: 15 de novembro de 2026 Idioma: português do Brasil

## 1. Finalidade

Este documento descreve como diferentes atores utilizam a Cypher para alcançar objetivos observáveis. Ele serve como especificação funcional de produto, base para validação com usuários, planejamento de telas, testes de aceitação e evolução da implementação.

A estrutura segue boas práticas de modelagem de casos de uso: cada caso tem um objetivo de usuário, um ator principal, pré-condições, gatilho, cenário principal de sucesso, extensões ou exceções, pós-condições e regras relevantes. Um caso de uso reúne caminhos de sucesso, caminhos alternativos e falhas que pertencem ao mesmo objetivo; não é apenas uma lista de telas ou de endpoints.

A documentação separa três situações:

- Implementado: o fluxo foi identificado na aplicação atual por rota, interface, validação, persistência ou teste existente.

- Especificado: o fluxo foi definido no material de produto fornecido, mas ainda não está completamente implementado.

- Deduzido: o fluxo é uma proposta de navegação ou regra necessária para tornar a experiência coerente, inferida a partir do projeto atual e de padrões de produto. Deve ser validado antes da implementação.

Quando uma informação não foi confirmada, ela aparece como decisão pendente. Uma dedução não deve ser tratada como requisito aprovado.

## 2. Limites do sistema

O sistema de interesse é a plataforma web Cypher, que conecta artistas, produtores, profissionais da música e demais participantes do setor. Seu escopo abrange os recursos disponíveis aos usuários e os mecanismos administrativos necessários para manter a plataforma organizada e segura. A plataforma contempla:

- Autenticação e gestão de sessão: criação e acesso a contas, recuperação de credenciais, encerramento de sessão e controle de acesso às funcionalidades.

- Cadastro e gestão de contas: inclusão, edição e manutenção dos dados de usuários, considerando diferentes tipos de perfil e suas permissões.

- Perfis, privacidade e visibilidade: apresentação das informações profissionais, configuração de dados públicos ou restritos e definição de como cada perfil aparece para outros usuários.

- Descoberta de profissionais: busca e navegação por artistas, produtores e outros profissionais, com recursos para localizar perfis relevantes.

- Obras, créditos e colaborações: registro e consulta de obras musicais, créditos dos participantes e relações profissionais associadas a cada projeto.

- Banco de Beats: publicação, organização e descoberta de beats, incluindo informações sobre seus criadores e condições de uso ou negociação, quando disponíveis.

- Eventos e oportunidades: divulgação e consulta de eventos, chamadas, vagas e outras oportunidades relevantes para a comunidade musical.

- Notificações: comunicação de atividades, atualizações e interações relacionadas à conta e aos recursos utilizados na plataforma.

- Cypher Central: espaço de conteúdo e interação voltado à comunidade, conforme as funcionalidades disponibilizadas pela plataforma.

- Governança de categorias e gêneros: manutenção das categorias, gêneros e demais classificações usadas para organizar perfis, obras, beats e oportunidades.

- Revisão e administração: análise de conteúdos e cadastros, moderação de atividades e gerenciamento de parâmetros necessários ao funcionamento da plataforma.

A Cypher não deve ser documentada como substituta de um serviço de streaming nem como uma rede social generalista. Seu foco é a profissionalização, a descoberta, a organização de obras e oportunidades e a conexão da cena underground.

## 3. Atores

### 3.1 Visitante
Pessoa não autenticada que acessa a Cypher. Seu objetivo principal é entrar em uma conta existente ou iniciar o cadastro.

### 3.2 Usuário autenticado
Conta real que concluiu o cadastro e possui uma sessão válida. É uma generalização para os tipos Público e Profissional.

### 3.3 Usuário Público
Pessoa que utiliza a Cypher como consumidor e participante da cena. O contexto define que pode descobrir eventos, acompanhar profissionais, conhecer novas experiências, interagir e se comunicar, mas não criar conteúdo profissional.

### 3.4 Usuário Profissional
Pessoa ou agente que utiliza a Cypher para apresentar sua atuação, divulgar trabalho e estabelecer conexões. O cadastro profissional deve utilizar o catálogo de 26 profissões definido neste documento.

### 3.5 Organizador de eventos
Usuário Profissional que possui a profissão Organizador(a) de eventos ou capacidade equivalente. Na implementação atual, essa categoria habilita criação e administração de eventos.

### 3.6 Beatmaker
Usuário Profissional que possui a profissão Beatmaker. Na implementação atual, essa categoria habilita o cadastro de Beats.

### 3.7 Administrador Geral
Perfil administrativo de maior autoridade. É responsável por administrações críticas, cargos administrativos, taxonomia global e auditoria. Esse perfil não é uma opção de cadastro público.

### 3.8 Moderador

Perfil administrativo operacional responsável por exceções, denúncias, spam, perfis falsos e solicitações internas. Esse perfil não é uma opção de cadastro público.

### 3.9 Editor

Perfil administrativo responsável pela Cypher Central e pela qualidade dos conteúdos educativos. Esse perfil não é uma opção de cadastro público.

### 3.10 Serviço de persistência da Cypher

Ator secundário interno que armazena contas, sessões, perfis, obras, créditos, Beats, ofertas, eventos, interesses, notificações e registros administrativos. Ele representa o comportamento observável de persistência, não uma interface independente.

## 4. Modelo de navegação estimado

A navegação abaixo é uma proposta deduzida para conectar os fluxos do projeto sem criar uma arquitetura paralela:
O diagrama é um mapa de contexto, não substitui os fluxos detalhados. Os recursos efetivamente disponíveis devem continuar sujeitos às permissões do servidor e às regras de propriedade.

## 5. Catálogo de casos de uso

|       |                                              |                                  |                             |                     |
| ----- | -------------------------------------------- | -------------------------------- | --------------------------- | ------------------- |
| ID    | Caso de uso                                  | Ator principal                   | Status                      | Nível               |
| UC-01 | Entrar na Cypher                             | Visitante                        | Implementado                | Objetivo do usuário |
| UC-02 | Criar uma conta                              | Visitante                        | Parcial / especificado      | Objetivo do usuário |
| UC-03 | Escolher o tipo de cadastro                  | Visitante                        | Especificado                | Objetivo do usuário |
| UC-04 | Profissionalizar uma conta Pública           | Usuário Público                  | Deducido / futuro           | Objetivo do usuário |
| UC-05 | Gerenciar perfil e privacidade               | Usuário autenticado              | Implementado                | Objetivo do usuário |
| UC-06 | Encontrar e consultar um perfil profissional | Usuário autenticado ou visitante | Implementado                | Objetivo do usuário |
| UC-07 | Gerenciar obras e créditos                   | Usuário Profissional             | Implementado                | Objetivo do usuário |
| UC-08 | Publicar e administrar um Beat               | Beatmaker                        | Implementado parcialmente   | Objetivo do usuário |
| UC-09 | Descobrir oportunidades e eventos            | Usuário autenticado              | Implementado parcialmente   | Objetivo do usuário |
| UC-10 | Administrar um evento e participantes        | Organizador de eventos           | Implementado parcialmente   | Objetivo do usuário |
| UC-11 | Consultar e tratar notificações              | Usuário autenticado              | Implementado                | Objetivo do usuário |
| UC-12 | Consultar a Cypher Central                   | Visitante ou usuário autenticado | Implementado parcialmente   | Objetivo do usuário |
| UC-13 | Propor categoria ou gênero                   | Usuário Profissional             | Implementado                | Objetivo do usuário |
| UC-14 | Revisar propostas e exceções                 | Equipe administrativa            | Implementado parcialmente   | Objetivo do usuário |
| UC-15 | Moderar denúncias e solicitações             | Moderador                        | Especificado / futuro       | Objetivo do usuário |
| UC-16 | Gerenciar conteúdos da Cypher Central        | Editor                           | Especificado / futuro       | Objetivo do usuário |
| UC-17 | Administrar cargos e taxonomia global        | Administrador Geral              | Especificado / futuro       | Objetivo do usuário |
| UC-18 | Encerrar a própria conta                     | Usuário autenticado              | Implementado com restrições | Objetivo do usuário |

## 6. Casos de uso detalhados

### UC-01 — Entrar na Cypher

Status: Implementado. Ator principal: Visitante. Atores secundários: Serviço de persistência da Cypher. Objetivo: Acessar uma conta real e iniciar uma sessão autenticada.

Pré-condições:

•A pessoa possui uma conta cadastrada.

•A tela de login está disponível.

Gatilho: A pessoa envia seus dados de acesso.

Cenário principal de sucesso:

1.O visitante acessa /login.

2.A Cypher apresenta a tela de login.

3.O visitante informa e-mail e senha.

4.O sistema normaliza o e-mail para comparação.

5.O sistema verifica as credenciais.

6.O sistema cria uma sessão com token aleatório.

7.O sistema armazena apenas o hash do token no SQLite.

8.O sistema envia o cookie de sessão protegido ao navegador.

9.O sistema direciona o usuário autenticado para a visão geral ou dashboard.

Extensões:

•4a — E-mail não encontrado: o sistema rejeita a tentativa e informa que os dados não são válidos. O caso termina sem criar sessão.

•5a — Senha incorreta: o sistema rejeita a tentativa e informa falha de autenticação. O caso termina sem criar sessão.

•5b — Sessão anterior no mesmo navegador: o sistema revoga a sessão anterior antes de concluir a nova sessão.

•8a — Sessão expirada posteriormente: uma rota privada identifica a sessão inválida e redireciona a pessoa para /login.

Pós-condições de sucesso:

•Existe uma sessão válida associada à conta.

•O usuário pode acessar rotas privadas autorizadas.

Regras de negócio:

•Não existe acesso convidado ou conta técnica.

•Senhas usam scrypt com salt aleatório.

•A sessão possui duração definida pelo sistema e o token completo não é armazenado no banco.

Decisões pendentes: recuperação de senha, verificação de e-mail, limitação progressiva de tentativas e proteção CSRF ainda não foram confirmadas na implementação atual.

Evidência local: src/app/routes/rotasCypher.ts, src/app/controllers/controladorAutenticacao.ts, src/app/models/autenticacaoCypher.ts.

### UC-02 — Criar uma conta

Status: Parcial / especificado. Ator principal: Visitante. Atores secundários: Serviço de persistência da Cypher. Objetivo: Criar uma conta real como Público ou Profissional.

Pré-condições:

•O visitante está na tela de login ou na rota de cadastro.

•O e-mail escolhido ainda não está associado a uma conta real.

Gatilho: O visitante seleciona Cadastrar-se.

Cenário principal de sucesso estimado:

1.O visitante seleciona Cadastrar-se na tela de login.

2.A Cypher apresenta a escolha entre Público e Profissional.

3.O visitante seleciona um tipo de cadastro.

4.A Cypher apresenta o formulário correspondente.

5.O visitante preenche os dados solicitados para o tipo escolhido.

6.O visitante envia o cadastro.

7.O servidor valida os dados do formulário.

8.O servidor verifica a unicidade do e-mail.

9.O servidor cria a conta e o perfil dentro de uma transação.

10.A Cypher cria uma sessão ou direciona o usuário para a tela de entrada, conforme decisão de produto.

11.A Cypher apresenta o próximo passo da experiência correspondente ao tipo de conta.

Extensões:

•7a — Dados inválidos: o servidor rejeita o envio, preserva os dados permitidos para reapresentação e informa os campos que precisam de correção.

•8a — E-mail já utilizado: o sistema não cria uma segunda conta e informa que o e-mail já está cadastrado.

•9a — Falha de persistência: a transação é desfeita e o sistema informa que a conta não foi criada.

•5a — Visitante retorna à escolha: o fluxo segue para UC-03 e não conclui o cadastro.

Pós-condições de sucesso:

•Uma conta real existe.

•O tipo Público ou Profissional está registrado.

•O perfil inicial segue as regras de privacidade definidas pelo produto.

Regras de negócio:

•Administrador Geral, Moderador e Editor não são tipos de cadastro público.

•O catálogo profissional vigente possui 26 profissões.

•Os cargos removidos não podem aparecer como opções de profissão.

Decisões pendentes: campos exatos do formulário Público; campos exatos do formulário Profissional; confirmação de e-mail; login automático; recuperação de cadastro; política de idade; aceite de termos; preservação de dados quando o tipo muda.

Evidência local: o código atual possui GET /register, POST /register/validate e POST /register, mas o fluxo Público/Profissional ainda precisa ser incorporado ao cadastro existente.

### UC-03 — Escolher o tipo de cadastro

Status: Especificado. Ator principal: Visitante. Objetivo: Escolher entre uma participação Pública e uma participação Profissional.

Pré-condição: O visitante iniciou o cadastro.

Gatilho: A tela de seleção de tipo é exibida.

Cenário principal de sucesso:

1.A Cypher apresenta dois stickers sobrepostos, inspirados em tags e adesivos da cultura hip-hop.

2.Os stickers representam Público e Profissional.

3.O visitante seleciona um sticker.

4.O sticker selecionado ganha destaque.

5.O sticker se desloca para a área superior da tela.

6.O formulário correspondente é exibido abaixo dele.

7.O sticker permanece visível e interativo durante o preenchimento.

Extensões:

•3a — Visitante escolhe Público: o sistema abre o formulário do cadastro Público.

•3b — Visitante escolhe Profissional: o sistema abre o formulário do cadastro Profissional.

•7a — Visitante seleciona o sticker ativo novamente: o formulário recua e os dois stickers voltam a ser apresentados.

•7b — Existem dados preenchidos: o sistema deve aplicar a política definida para preservar, converter ou descartar os dados. Essa decisão ainda está pendente.

Pós-condição de sucesso: Um único formulário correspondente ao tipo escolhido está visível.

Regras de negócio:

•Público e Profissional são os únicos tipos de cadastro público.

•Cargos administrativos não aparecem nessa escolha.

•A escolha visual representa o tipo ativo, mas não deve substituir a validação do servidor.

Decisões pendentes: animações exatas, acessibilidade do sticker, navegação por teclado, comportamento em telas pequenas, texto de ajuda e persistência temporária da escolha.

### UC-04 — Profissionalizar uma conta Pública

Status: Deducido / futuro. Ator principal: Usuário Público. Atores secundários: Administrador ou Moderador, quando houver categoria pendente. Objetivo: Transformar a mesma conta Pública em uma conta Profissional sem perder seu histórico.

Motivação da dedução: O contexto afirma que a pessoa Pública poderá profissionalizar-se na mesma conta. O fluxo detalhado não foi fornecido. A proposta abaixo usa a estrutura de cadastro profissional, categorias e questionários já existente na Cypher.

Pré-condições propostas:

•O usuário está autenticado em uma conta Pública.

•A conta não está bloqueada ou em processo de exclusão.

Gatilho proposto: O usuário escolhe Profissionalizar minha conta nas configurações ou no perfil.

Cenário principal estimado:

1.A Cypher explica o que muda ao assumir uma conta Profissional.

2.O usuário confirma que deseja iniciar a profissionalização.

3.O sistema apresenta as áreas e profissões vigentes.

4.O usuário seleciona uma ou mais profissões.

5.O sistema apresenta os questionários ou campos correspondentes.

6.O usuário preenche as informações profissionais.

7.O servidor valida as profissões e as respostas.

8.O sistema altera o tipo da conta preservando o identificador interno, histórico, favoritos e notificações, conforme regra aprovada.

9.A Cypher apresenta o perfil profissional e suas configurações de privacidade.

Extensões propostas:

•4a — Profissão removida ou inválida: o servidor rejeita a opção e não altera a conta.

•7a — Categoria sujeita a análise: a conta permanece válida, mas a categoria fica pendente de revisão.

•8a — Usuário cancela: a conta continua Pública sem alteração.

Pós-condições propostas:

•A mesma conta passa a ter experiência Profissional.

•O histórico anterior não é apagado.

•O usuário pode completar ou editar seu perfil profissional.

Decisões pendentes: se a transformação é irreversível; se o Público pode criar favoritos, mensagens e denúncias; quais dados são preservados; se a profissionalização exige confirmação administrativa; como o tipo aparece para outros usuários.

### UC-05 — Gerenciar perfil e privacidade

Status: Implementado. Ator principal: Usuário autenticado. Objetivo: Atualizar informações do próprio perfil e decidir o que pode ser exibido publicamente.

Pré-condições: O usuário possui sessão válida.

Gatilho: O usuário acessa /profile ou /settings.

Cenário principal de sucesso:

1.O usuário acessa seu perfil ou configurações.

2.A Cypher apresenta seções de perfil, atuação, portfólio, privacidade e conta.

3.O usuário altera uma seção.

4.O servidor valida os dados e as categorias atuais.

5.O sistema persiste a alteração correspondente.

6.A Cypher informa o resultado e reapresenta o perfil atualizado.

Extensões:

•4a — Dados inválidos: o sistema rejeita a alteração e informa a correção necessária.

•3a — Usuário altera categorias antes do prazo: o sistema exige solicitação de exceção, justificativa e posterior decisão administrativa.

•3b — Usuário sugere nova categoria: a categoria é encaminhada para revisão e não se torna ativa automaticamente.

•3c — Usuário altera privacidade: o sistema atualiza a visibilidade do perfil, localização, contato e respostas de atuação conforme as opções disponíveis.

•5a — Falha de persistência: a seção não é confirmada como salva.

Pós-condições: Os dados válidos da seção são persistidos; o perfil público respeita as preferências de privacidade.

Regras de negócio:

•Contas novas começam com perfil, localização e contato ocultos.

•O e-mail de login não é publicado como contato.

•Alterações de categoria respeitam cooldown e fluxo de exceção.

•Respostas de atuação são autodeclarações e não certificam experiência.

Evidência local: /profile, /profile/secoes/:secao, /profile/categorias/sugerir, /profile/categorias/solicitar-excecao, /settings/privacy.

### UC-06 — Encontrar e consultar um perfil profissional

Status: Implementado. Ator principal: Usuário autenticado ou visitante, conforme política da rota. Objetivo: Localizar profissionais e visualizar um perfil público autorizado.

Pré-condições:

•A busca está disponível.

•O perfil consultado está publicado ou o usuário possui autorização para vê-lo.

Gatilho: A pessoa acessa a busca ou abre um perfil.

Cenário principal de sucesso:

1.A pessoa acessa /search.

2.A pessoa informa texto ou seleciona filtros de categoria, gênero ou localização.

3.A Cypher consulta perfis públicos compatíveis.

4.O sistema exclui a própria conta da lista quando aplicável.

5.A pessoa seleciona um resultado.

6.A Cypher abre /p/:identificador.

7.O sistema exibe somente informações permitidas pelas configurações do titular.

Extensões:

•3a — Nenhum resultado: o sistema exibe estado vazio e permite ajustar os filtros.

•7a — Perfil privado: o sistema não expõe o perfil e informa que ele não está disponível.

•7b — Identificador inválido: o sistema retorna perfil não encontrado.

Pós-condições: Nenhuma informação privada é exposta; a pessoa pode retornar à busca.

Decisões pendentes: seguir ou acompanhar profissional, favoritos, mensagens, recomendações e relacionamento persistente ainda não foram confirmados.

### UC-07 — Gerenciar obras e créditos

Status: Implementado. Ator principal: Usuário Profissional. Atores secundários: Profissional creditado, quando houver uma conta associada. Objetivo: Cadastrar, consultar, editar e excluir obras próprias, registrando créditos e participações.

Pré-condições:

•O usuário está autenticado.

•O usuário possui capacidade de criar obras conforme suas categorias.

Gatilho: O usuário acessa /works/new ou o catálogo de obras.

Cenário principal de sucesso:

1.O usuário abre o cadastro de obra.

2.O sistema apresenta a seleção contextual de tipo de obra.

3.O usuário informa os dados da obra e seus créditos.

4.O servidor valida título, tipo, gênero, situação, dados de registro, data, link e limites de créditos.

5.O sistema cria a obra e seus créditos em uma transação.

6.A obra aparece no catálogo do proprietário conforme seu estado.

7.Quando aplicável, o perfil público exibe somente dados de uma obra publicada.

Extensões:

•3a — Crédito associado a perfil: o sistema valida o identificador e a visibilidade do perfil associado.

•3b — Colaborador sem conta: o sistema preserva a menção textual sem atribuir automaticamente a uma conta.

•4a — Validação falha: o sistema rejeita o envio e indica os campos inválidos.

•5a — Falha transacional: obra e créditos não são parcialmente confirmados.

•6a — Usuário tenta editar obra de outra pessoa: o sistema recusa a operação e não altera o registro.

•7a — Crédito ainda não verificado: o crédito aparece como não confirmado; não deve ser apresentado como prova de trajetória validada.

Pós-condições: A obra própria e seus créditos válidos ficam persistidos; exclusão de obra remove seus créditos conforme as regras de integridade.

Regras de negócio:

•A operação de edição e exclusão pertence ao proprietário.

•A menção textual não prova consentimento ou confirmação do profissional citado.

•ISRC e ISWC podem ser armazenados quando fornecidos, mas a Cypher não emite esses códigos.

•O portfólio inteligente e a confirmação colaborativa de créditos ainda não estão implementados.

Evidência local: /works, /works/new, /works/:id/edit, /works/:id/delete e src/app/controllers/controladorObras.ts.

### UC-08 — Publicar e administrar um Beat

Status: Implementado parcialmente. Ator principal: Beatmaker. Objetivo: Cadastrar e disponibilizar um Beat com metadados e ofertas de licença.

Pré-condições:

•O usuário está autenticado.

•O usuário possui a categoria Beatmaker.

Gatilho: O usuário acessa /beats/new.

Cenário principal de sucesso:

1.O Beatmaker abre o formulário de Beat.

2.Informa título, BPM, tom, gênero, duração, descrição e condições de uso.

3.Informa uma ou mais ofertas de licença quando aplicável.

4.O servidor valida os metadados e as ofertas.

5.O sistema persiste o Beat e as ofertas.

6.O Beat aparece no Banco de Beats.

7.O proprietário pode editar ou excluir o próprio Beat.

Extensões:

•4a — Usuário sem categoria Beatmaker: o servidor recusa a criação.

•4b — Dados ou oferta inválidos: o sistema rejeita o cadastro.

•3a — Oferta exclusiva: o sistema valida a marcação de exclusividade conforme as regras vigentes.

•7a — Outra pessoa tenta editar ou excluir: o sistema recusa a operação.

Pós-condições: O Beat e suas ofertas válidas ficam persistidos.

Limitações explícitas: upload de áudio, player, prévia protegida, compra, checkout, pagamento, entrega de arquivo, transição automática para Vendido e bloqueio após aquisição ainda não foram confirmados.

Decisões pendentes: direitos sobre o arquivo, marca d’água, estados comerciais, negociação e comunicação entre comprador e Beatmaker.

### UC-09 — Descobrir oportunidades e eventos

Status: Implementado parcialmente. Ator principal: Usuário autenticado. Objetivo: Encontrar eventos e oportunidades adequados à atuação ou ao interesse do usuário.

Pré-condições: A rota de eventos está disponível.

Gatilho: O usuário acessa /events.

Cenário principal de sucesso:

1.O usuário acessa a página de oportunidades.

2.A Cypher apresenta eventos reais disponíveis.

3.O usuário filtra por categoria, localização, formato ou período.

4.O sistema recalcula a lista com os filtros informados.

5.O usuário ordena ou abre os detalhes de um evento.

6.O sistema apresenta as informações do evento e ações permitidas.

7.O usuário demonstra interesse quando o evento aceita essa ação.

Extensões:

•3a — Nenhum evento compatível: o sistema apresenta estado vazio e permite alterar os filtros.

•7a — Interesse já existente: o sistema mantém a relação única em vez de criar duplicata.

•7b — Evento encerrado ou inelegível: o sistema não aceita novo interesse.

•7c — Usuário cancela interesse: a relação é atualizada conforme estado permitido.

Pós-condições: O interesse, quando enviado, fica persistido e pode ser acompanhado conforme seu status.

Limitações: Interesse não comprova presença física; agenda cultural regional, reputação e histórico completo de participação ainda não estão completos.

### UC-10 — Administrar um evento e participantes

Status: Implementado parcialmente. Ator principal: Organizador de eventos. Objetivo: Criar, editar, excluir e administrar participantes de um evento próprio.

Pré-condições:

•O usuário está autenticado.

•Possui a categoria Organizador(a) de eventos para criar novos eventos.

Gatilho: O usuário acessa /events/new ou uma ação de edição de evento próprio.

Cenário principal de sucesso:

1.O organizador abre o cadastro de evento.

2.Informa os dados disponíveis do evento.

3.O servidor valida categoria, data, local, formato, inscrição e demais campos.

4.O sistema persiste o evento.

5.O evento aparece nas oportunidades.

6.O organizador consulta interessados.

7.O organizador atualiza o status de uma participação para estado permitido.

Extensões:

•3a — Usuário sem capacidade de organizar: a criação é recusada.

•3b — Data ou campos inválidos: o sistema reapresenta o formulário com erro.

•6a — Evento demonstrativo ou encerrado: ações de interesse e administração ficam limitadas conforme regra.

•7a — Organizador não é proprietário: a alteração é recusada.

•7b — Participante inexistente: o sistema não altera o status.

Pós-condições: O evento próprio e as transições válidas de participantes ficam persistidos.

Decisões pendentes: presença confirmada, venda de ingressos, comunicação entre organizador e participante e integração com portfólio.

### UC-11 — Consultar e tratar notificações

Status: Implementado. Ator principal: Usuário autenticado. Objetivo: Consultar avisos persistentes e controlar seu estado de leitura.

Pré-condição: O usuário possui sessão válida.

Gatilho: O usuário abre o sino, acessa /notificacoes ou recebe uma atividade registrada.

Cenário principal de sucesso:

1.O sistema consulta notificações destinadas ao usuário.

2.A barra superior exibe o indicador de não lidas quando aplicável.

3.O usuário abre o resumo ou o histórico completo.

4.A Cypher exibe notificações lidas e não lidas.

5.O usuário marca uma notificação como lida ou marca todas como lidas.

6.O sistema atualiza o estado persistido.

Extensões:

•2a — Não há notificações: o sistema exibe estado vazio.

•5a — Notificação inexistente ou de outro usuário: o sistema não altera o registro.

•6a — Repetição da mesma atividade: a chave de origem idempotente evita duplicação quando aplicável.

Pós-condições: O estado de leitura fica persistido para o usuário correto.

Limitações: As notificações genéricas atuais não equivalem ao sistema futuro de sugestões de atualização de portfólio.

### UC-12 — Consultar a Cypher Central

Status: Implementado parcialmente. Ator principal: Visitante ou usuário autenticado. Objetivo: Encontrar orientação sobre temas profissionais e musicais.

Gatilho: A pessoa acessa /central.

Cenário principal de sucesso:

1.A Cypher apresenta perguntas e conteúdos da Central.

2.A pessoa pesquisa ou navega pelos conteúdos disponíveis.

3.O sistema filtra localmente os resultados.

4.A pessoa abre o conteúdo relevante.

Extensões:

•3a — Nenhum resultado: o sistema apresenta estado sem resultado.

•4a — Conteúdo ainda não disponível: o sistema mantém a pessoa na Central ou informa que o material não foi localizado.

Pós-condições: A pessoa obtém orientação ou identifica que precisa de outro conteúdo.

Limitações: A Central atual é FAQ/conteúdo básico. CMS editorial, avaliações de artigos, buscas sem resultado analíticas e Centro de Análise de Qualidade ainda não foram confirmados.

### UC-13 — Propor categoria ou gênero

Status: Implementado. Ator principal: Usuário Profissional. Objetivo: Sugerir uma categoria profissional ou gênero que não está no catálogo global.

Pré-condições:

•O usuário está autenticado.

•O valor sugerido não deve ser tratado como categoria global ativa antes da decisão administrativa.

Gatilho: O usuário seleciona a opção de sugerir valor não catalogado.

Cenário principal de sucesso:

1.O usuário informa a proposta e sua justificativa, quando solicitada.

2.O servidor valida o contexto e o conteúdo.

3.O sistema cria uma proposta pendente.

4.A proposta fica disponível para revisão administrativa.

5.O usuário recebe o estado da proposta conforme os recursos atuais.

Extensões:

•2a — Valor vazio, inválido ou duplicado: o sistema recusa a proposta.

•3a — Proposta rejeitada: o revisor registra a decisão e justificativa.

•3b — Proposta aprovada: o valor entra no catálogo global conforme regra de publicação.

Pós-condições: A proposta fica registrada com estado, decisão e justificativa; a aprovação não altera automaticamente categorias ativas do solicitante.

### UC-14 — Revisar propostas e exceções

Status: Implementado parcialmente. Ator principal: Equipe administrativa autorizada. Objetivo: Analisar propostas de categorias/gêneros e pedidos de exceção de alteração de categoria.

Pré-condições:

•O administrador está autorizado pela configuração administrativa atual.

•Existe uma proposta ou solicitação pendente.

Gatilho: O administrador acessa /admin/revisao.

Cenário principal de sucesso:

1.O administrador acessa a fila administrativa.

2.O sistema apresenta propostas e solicitações pendentes.

3.O administrador consulta detalhes e justificativas.

4.O administrador aprova, rejeita ou solicita esclarecimento quando a operação permitir.

5.O administrador informa a justificativa da decisão.

6.O sistema persiste a decisão, o revisor e os dados de auditoria.

7.O sistema atualiza o estado da solicitação.

Extensões:

•2a — Fila vazia: o sistema exibe estado vazio.

•3a — Solicitação inexistente: o sistema não permite decisão.

•4a — Falta justificativa: o servidor rejeita a decisão até que a justificativa seja preenchida.

•4b — Administrador sem autorização: o acesso é recusado.

Pós-condições: A decisão é persistida; quando aplicável, uma autorização de uso único é emitida; a mudança de categoria não ocorre automaticamente sem as regras correspondentes.

Limitações: O código atual concentra autorização em allowlist e não materializa integralmente os três cargos separados. A divisão entre Administrador Geral, Moderador e Editor permanece uma evolução de governança.

### UC-15 — Moderar denúncias e solicitações

Status: Especificado / futuro. Ator principal: Moderador. Objetivo: Analisar denúncias, spam, perfis falsos e solicitações internas preservando a integridade da comunidade.

Pré-condições propostas:

•O Moderador está autenticado com permissão específica.

•Existe uma denúncia ou solicitação na fila.

Fluxo de sucesso proposto:

1.O Moderador acessa a fila correspondente.

2.O sistema apresenta o objeto denunciado, motivo, autor e histórico relevante.

3.O Moderador analisa as evidências disponíveis.

4.O Moderador decide pela manutenção, ocultação, correção, advertência ou escalonamento conforme políticas aprovadas.

5.O Moderador registra justificativa.

6.O sistema persiste a decisão e atualiza o estado da fila.

7.O sistema notifica as partes quando a política permitir.

Lacunas: categorias de denúncia, níveis de ação, prazo de resposta, direito de recurso, retenção de evidências, anonimato, comunicação e relação com o Administrador Geral não foram especificados.

### UC-16 — Gerenciar conteúdos da Cypher Central

Status: Especificado / futuro. Ator principal: Editor. Objetivo: Manter artigos e guias educativos da Cypher Central.

Pré-condições propostas:

•O Editor possui permissão de conteúdo.

•A área editorial está disponível.

Fluxo de sucesso proposto:

1.O Editor cria ou abre um artigo.

2.Escreve ou revisa o conteúdo.

3.Organiza o conteúdo em uma categoria.

4.Salva como rascunho ou envia para publicação.

5.O sistema valida os campos editoriais.

6.O Editor publica ou arquiva o material.

7.O conteúdo publicado aparece na Central.

Lacunas: workflow de revisão, versionamento, autoria, publicação agendada, comentários, avaliações, taxonomia editorial, busca sem resultado e métricas de qualidade não foram especificados.

### UC-17 — Administrar cargos e taxonomia global

Status: Especificado / futuro. Ator principal: Administrador Geral. Objetivo: Controlar administradores e aprovar alterações que afetam a taxonomia global da Cypher.

Pré-condições propostas:

•O Administrador Geral está autenticado.

•A ação está dentro do seu escopo de autoridade.

Fluxo de sucesso proposto:

1.O Administrador Geral acessa as configurações administrativas.

2.Seleciona uma ação de gestão de administrador ou taxonomia.

3.O sistema apresenta o registro afetado e o impacto previsto.

4.O Administrador Geral confirma a ação.

5.O sistema valida a segregação de funções e a unicidade das permissões.

6.O sistema persiste a alteração e registra auditoria.

7.A mudança passa a valer conforme sua data e estado de publicação.

Extensões:

•5a — Tentativa de autoelevação: o sistema bloqueia a alteração.

•5b — Ação sem justificativa: o sistema exige justificativa quando a política determinar.

•6a — Conflito com outra decisão: o sistema não substitui silenciosamente a decisão anterior.

Lacunas: modelo de permissões, segundo aprovador, cargos disponíveis, revogação de sessão, versionamento do catálogo, migração de valores antigos e recurso contra decisões ainda precisam ser definidos.

### UC-18 — Encerrar a própria conta

Status: Implementado com restrições. Ator principal: Usuário autenticado. Objetivo: Encerrar a própria conta de maneira confirmada e segura.

Pré-condições:

•O usuário possui sessão válida.

•O usuário sabe a senha atual.

•Obras, eventos ou Beats próprios não impedem a exclusão conforme as regras de integridade.

Gatilho: O usuário solicita encerramento em /settings.

Cenário principal de sucesso:

1.O usuário acessa as configurações da conta.

2.Solicita o encerramento.

3.Informa a senha atual.

4.Informa a confirmação literal exigida pelo sistema.

5.O servidor valida a autorização.

6.O sistema encerra a conta conforme as regras de integridade.

7.As sessões são revogadas.

8.O sistema direciona o usuário para a tela pública de entrada.

Extensões:

•5a — Senha incorreta: a conta permanece ativa.

•5b — Confirmação incorreta: a conta permanece ativa.

•6a — Existem registros próprios dependentes: o sistema impede a exclusão e orienta a remoção ou transferência permitida.

Pós-condições: A conta não pode iniciar nova sessão com as credenciais anteriores; registros preservados por integridade permanecem conforme política do sistema.

## 7. Catálogo profissional oficial

O catálogo definido para o cadastro Profissional contém 26 profissões em 7 áreas.

### Música

•Rapper

•MC

•Compositor(a)

•Letrista

•Beatmaker

•Produtor(a)

•DJ

•Freestyleiro

### Dança

•B-boy / girl

•Dançarino(a)

•Coreógrafo(a)

### Artes visuais

•Grafiteiro(a)

•Ilustrador(a)

•Designer gráfico

### Audiovisual

•Fotógrafo(a)

•Videomaker

•Editor(a) de vídeo

### Produção técnica

•Engenheiro(a) de áudio

•Mixador(a)

•Masterizador(a)

### Gestão e produção

•Empresário(a)

•Produtor(a) cultural

•Organizador(a) de eventos

### Comunicação e cultura

•Criador(a) de conteúdo

•Jornalista cultural

•Podcaster
## 8. Regras de negócio transversais

BR-01 — Tipos de cadastro: Público e Profissional são os tipos disponíveis para o público.

BR-02 — Perfis administrativos: Administrador Geral, Moderador e Editor são permissões internas, não categorias profissionais nem opções de cadastro.

BR-03 — Catálogo profissional: somente as 26 profissões desta documentação podem ser novas opções do catálogo vigente.

BR-04 — Propostas de taxonomia: sugerir uma profissão ou gênero não publica o valor imediatamente.

BR-05 — Propriedade: obras, Beats e eventos só podem ser editados ou excluídos por seus proprietários, salvo ação administrativa explicitamente autorizada.

BR-06 — Privacidade: publicação de perfil, localização, contato e respostas depende de configuração de privacidade.

BR-07 — Créditos: crédito não confirmado não deve ser apresentado como trajetória validada.

BR-08 — Conta real: não existe conta convidada ou acesso técnico de demonstração para o fluxo público.

BR-09 — Integridade: operações que criam ou alteram múltiplos registros devem ser confirmadas atomicamente quando o domínio exigir.

BR-10 — Auditoria: decisões administrativas sensíveis devem registrar autor, data, decisão, justificativa e registro afetado.

BR-11 — Separação de funções: nenhuma pessoa deve aprovar a própria solicitação ou alterar sua própria autoridade administrativa sem regra explícita de controle.

BR-12 — Identificador público: o identificador com @ deve ser único; o fluxo de alteração excepcional ainda precisa ser especificado e implementado.

## 9. Requisitos suplementares candidatos

Estes requisitos são recomendações deduzidas para tornar os casos implementáveis. Não são ainda compromissos de produto.

### Segurança

•As ações POST devem usar proteção contra CSRF.

•Login deve possuir limitação de tentativas ou atraso progressivo.

•Cookies e sessões devem permanecer protegidos em produção.

•Ações administrativas devem exigir autorização por função, não apenas acesso genérico.

•Dados privados não devem aparecer em buscas, perfis ou notificações destinadas a outros usuários.

### Acessibilidade

•A escolha dos stickers deve ser operável por teclado e leitor de tela.

•O estado selecionado deve ter nome acessível além de cor ou movimento.

•O retorno do formulário à escolha deve possuir foco previsível.

•Mensagens de erro devem estar vinculadas aos campos correspondentes.

•Animações devem respeitar prefers-reduced-motion.

### Consistência e confiabilidade

•Respostas de sucesso e falha devem ser observáveis pelo usuário.

•Falhas de persistência não podem produzir uma tela de sucesso enganosa.

•Decisões administrativas devem ser idempotentes quando uma mesma ação for reenviada.

•Estados vazios e estados de erro devem ter mensagens específicas.

### Testabilidade

Cada caso de uso deve gerar casos de teste para:

•cenário principal;

•cada extensão importante;

•usuário sem permissão;

•registro inexistente;

•duplicidade;

•falha de validação;

•falha de persistência;

•privacidade;

•concorrência ou reenvio quando aplicável.

## 10. Matriz de rastreabilidade

|   |   |   |
|---|---|---|
|Elemento|Fonte principal|Situação|
|Login, cadastro atual e sessão|Rotas e modelos de autenticação|Implementado parcialmente conforme o tipo de cadastro futuro|
|Escolha Público/Profissional por stickers|Contexto de produto fornecido|Especificado, ainda não implementado|
|Perfil Público|Contexto de produto fornecido|Especificado, fluxo técnico pendente|
|Perfil Profissional|Rotas, controllers, modelos e escopo atual|Implementado com limitações|
|Busca e perfil público|/search, /p/:identificador e escopo|Implementado|
|Obras e créditos|/works, controller de obras e escopo|Implementado com créditos não confirmados|
|Beats e ofertas|/beats, controller de Beats e escopo|Implementado parcialmente|
|Eventos e interesses|/events, controller de eventos e escopo|Implementado parcialmente|
|Notificações|/notificacoes, controller e escopo|Implementado|
|Propostas e exceções|/admin/revisao, controller e banco|Implementado parcialmente|
|Moderador com denúncias|Contexto de produto fornecido|Especificado, não confirmado no código|
|Editor da Central|Contexto de produto fornecido|Especificado, não confirmado no código|
|Administrador Geral com RBAC|Contexto de produto e dedução de governança|Futuro|
|26 profissões|Documento de casos de uso fornecido|Decisão de produto; código ainda precisa ser ajustado|

## 11. Pendências para validação antes da implementação

1.Confirmar os campos e validações do cadastro Público.

2.Confirmar os campos e validações do cadastro Profissional.

3.Definir se o cadastro cria a sessão automaticamente.

4.Definir preservação de dados ao trocar entre stickers.

5.Definir os recursos exatos permitidos ao Público.

6.Definir o processo de profissionalização da mesma conta.

7.Definir se a conversão Público → Profissional é reversível.

8.Definir o modelo técnico de cargos administrativos e permissões.

9.Definir fila, estados e recursos de denúncia e moderação.

10.Definir o fluxo editorial da Cypher Central.

11.Definir o segundo aprovador ou controles para ações do Administrador Geral.

12.Atualizar o catálogo do código para as 26 profissões aprovadas.

13.Atualizar questionários, status, validadores, testes e migrações relacionados ao catálogo.

14.Definir o identificador @, sua alteração excepcional, cooldown e auditoria.

15.Definir mensagens, notificações e recursos de recurso contra decisões administrativas.

## 12. Referências e evidências

### Referências externas sobre casos de uso

As recomendações estruturais deste documento foram baseadas em referências que tratam casos de uso como interações orientadas a um objetivo, com ator primário, cenários, extensões, condições e resultado observável.

[[1] Use-Case Foundation, Ivar Jacobson e Alistair Cockburn](https://alistaircockburn.com/Use%20Case%20Foundation.pdf)

[[2] Use Cases and Use Case Descriptions in UML Modeling, Visual Paradigm](https://www.visual-paradigm.com/guide/comprehensive-case-study-use-cases-and-use-case-descriptions-in-uml-modeling/)

[[3] Use Case Modeling Techniques, Rochester Institute of Technology](https://www.se.rit.edu/~swen-440/slides/instructor-specific/Kuehl/Lecture%2010%20Use%20Case%20Modeling%20Techniques.pdf)

[[4] Unified Modeling Language Specification 2.5.1, Object Management Group](https://www.omg.org/spec/UML/2.5.1/About-UML)

### Evidências locais do projeto

•src/app/routes/rotasCypher.ts

•src/app/controllers/controladorAutenticacao.ts

•src/app/controllers/controladorObras.ts

•src/app/controllers/controladorBeats.ts

•src/app/controllers/controladorEventos.ts

•src/app/controllers/controladorPerfis.ts

•src/app/controllers/controladorConfiguracoes.ts

•src/app/controllers/controladorNotificacoes.ts

•src/app/models/autenticacaoCypher.ts

•src/app/models/bancoDados.ts

•src/app/models/modeloPerfil.ts

•src/app/models/questionarioAtuacao.ts

•views/pages/cadastro.ejs

•views/pages/entrar.ejs

•views/pages/perfil.ejs

•views/pages/obras.ejs

•views/pages/banco-beats.ejs

•views/pages/oportunidades.ejs

•views/pages/central.ejs

•ESCOPO-ATUALIZADO-CYPHER.md