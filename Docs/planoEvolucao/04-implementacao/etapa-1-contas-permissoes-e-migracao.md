# Etapa 1 — Contas, permissões e catálogo profissional

Data: 16/11/2026. Estado: **implementada e validada** para a fundação dos módulos atuais.

## 1. Definições recebidas do usuário

- A base é de desenvolvimento e pode ser refeita: não há público nem dados de produção a migrar.
- Permissões precisam corresponder à atuação da profissão; pertencer à área Música não autoriza publicar obras. Letrista foi o exemplo explícito de profissão sem essa permissão.
- Administração é identidade interna, sem perfil público.
- O acesso inicial do Super Admin deve ficar configurado internamente no projeto, sem comando específico de criação.
- Lacunas de expressão profissional devem ser identificadas e informadas, sem substituir o suporte ausente por permissões incoerentes.

A [proposta inicial](../05-fontes-e-trabalho/etapa-1-proposta-inicial.md) foi preservada como histórico. Suas sugestões de ampliar publicação às oito profissões e provisionar o primeiro administrador por comando foram descartadas.

## 2. O que foi implementado

### Catálogo canônico

- 26 profissões, em sete áreas com distribuição 8/3/3/3/3/3/3.
- Listas de categorias derivadas de uma única fonte no model, sem manter uma segunda lista com profissões retiradas ou aliases.
- Freestyleiro em rótulo, ID e questionário; Freestyler não é uma opção aceita.
- Dez profissões retiradas não podem ser selecionadas nem enviadas por POST manual ou gravação no model.
- Vertentes profissionais de rap somente para Rapper; MC e Freestyleiro não recebem associação ativa própria de vertentes.
- Sugestões de profissão continuam registráveis para triagem, mas aprovação isolada não insere opção sem suporte em questionários e permissões. Catálogo global dinâmico será uma evolução específica, não uma 27ª opção acidental.

### Matriz de publicação por contexto

| Profissão | Publicação atual autorizada |
|---|---|
| Rapper | Obra, Música, Single, EP, Álbum, Mixtape e projeto musical Outro já existente |
| Compositor(a) | Obra, para composição autoral |
| Beatmaker | Instrumental; beat pelo módulo Banco de Beats |
| Produtor(a) | Obras/lançamentos musicais e Instrumental; beat requer também Beatmaker |
| Freestyleiro | Música e Single de freestyle próprio |
| Organizador(a) de eventos | Evento |
| Letrista, MC, DJ e demais profissões | Sem publicação musical genérica; perfil/créditos e futuras modalidades próprias |

As capacidades acumulam por profissão e são verificadas em interface, rota/controller e model. Um consumidor ou administrador não pode publicar mesmo com categorias forjadas. Alterações de perfil não mudam a natureza da conta com base no valor enviado pelo cliente.

Gerenciar registros próprios é diferente de criá-los. O profissional pode gerenciar um registro legítimo mesmo após retirar uma profissão; não pode trocar o tipo do registro para um novo tipo que sua atuação atual não autoriza. Propriedade continua obrigatória.

### Identidades e administração

- Banco com naturezas Consumidor, Profissional e Administrativo. Organizador passou a ser somente profissão.
- Administração em `/admin/login` e `/admin`, com cookie de sessão próprio e login separado.
- Primeiro Super Admin configurado em `Cypher/.env.local`, fora da pasta pública e ignorado pelo Git. Se o arquivo não existir na primeira execução, é gerado acesso local com senha aleatória forte.
- A configuração é usada somente no provisionamento inicial. Reiniciar não troca a senha, não duplica a conta e não recria acesso revogado.
- Senha armazenada com `scrypt` no banco; nenhuma credencial é impressa nos logs ou incluída neste relatório.
- Administradores não têm linha em `perfis`; há proteção no banco contra criação de perfil artístico para conta administrativa.
- A allowlist `CYPHER_ADMIN_EMAILS` foi retirada como fonte de autorização.
- Painel e navegação internos não exibem perfil artístico, disponibilidade profissional ou reputação.

| Papel | Competência funcional nesta entrega |
|---|---|
| Super Admin | Criar equipe, alterar papéis/revogar acesso, consultar auditoria, analisar taxonomia suportada e gerir exceções |
| Moderador | Analisar exceções profissionais e solicitar esclarecimentos; sem poder de aprovar taxonomia global ou gerir equipe |
| Editor | Acesso interno isolado; sem poderes de equipe ou moderação. O editor de artigos pertence à evolução da Central |

Alterar papel/revogar acesso invalida as sessões do alvo. O administrador não muda o próprio papel/estado; a regra protege o último Super Admin ativo. Criação e gestão de equipe, decisões de taxonomia e exceções deixam histórico administrativo.

### Segurança dos fluxos

- Token CSRF em todos os formulários POST e na pré-validação JavaScript do cadastro.
- Verificação de origem e recusa de requisição cross-site ou token inválido, inclusive entrada malformada.
- Limite local de 30 tentativas de login por IP/rota em 15 minutos, com HTTP 429 e Retry-After.
- Cookies de administração separados, `HttpOnly`, SameSite=Strict e Secure quando HTTPS é reconhecido.
- Proxy confiável somente quando habilitado explicitamente por `CYPHER_TRUST_PROXY=1`.
- Models de publicação e administração também verificam capacidades, não apenas os botões ou controllers.

## 3. Banco de desenvolvimento

Schema atual: **21**. A base v20 de teste foi movida para `_seguranca/etapa-1-2026-11-16/cypher-desenvolvimento-anterior.sqlite` e foi criada uma base nova, conforme autorização do usuário.

Estado após a entrega:

- Uma conta administrativa: Super Admin inicial.
- Zero perfis públicos/artísticos, obras, créditos, beats, ofertas ou eventos.
- Zero sessões deixadas pela validação do acesso local.
- Integridade e chaves estrangeiras verificadas.

Não foi implementada conversão de dados legados: não é requisito desta base de desenvolvimento. O bootstrap recusa schemas antigos ou futuros sem tentar apagá-los ou convertê-los automaticamente. Os testes antigos de migração v5–v20 foram substituídos por verificações de schema 21, integridade, unicidade, idempotência e recusa de base incompatível sem mutação.

## 4. Verificações realizadas

Os onze comandos passaram: check, build, test:db, test:admin-ui, test:catalog, test:questionnaires, test:persistence, test:relations, test:profile-relations, test:foundation e test:security-http.

Evidências em `_seguranca/etapa-1-2026-11-16/logs/`. Os testes cobrem:

- Catálogo com 26 profissões e rejeição dos nomes retirados.
- Quatro eixos atuais por profissão; isolamento e validação das respostas.
- 16 vertentes e elegibilidade somente de Rapper.
- Negativas de publicação por profissão, tipo e natureza de conta.
- Conta Consumidor fora da busca/perfil público profissional, mesmo com flag pública forçada no banco de teste.
- Administração sem perfil, sessões separadas, recusa da allowlist antiga, gestão de papéis, revogação e auditoria.
- Tentativa de criar administrador no cadastro público, CSRF inválido, origem externa e limite de tentativas.
- Regressões HTTP existentes de cadastro, perfil, obras, eventos, busca, solicitações e exceções, usando uma sessão artística e outra administrativa efetivamente distintas.

O acesso local do Super Admin também foi conferido na versão compilada usando a configuração privada, sem imprimir credenciais; a sessão e o processo de verificação foram encerrados. Resultado em `_seguranca/etapa-1-2026-11-16/acesso-local-verificado.json`.

**Limites da validação:** testes HTTP/HTML/CSS e de models; não foi feita inspeção visual interativa nem teste de carga. O rate limiter é local ao processo, adequado à base de desenvolvimento atual, e não substitui infraestrutura distribuída futura. Permanecem os `@ts-nocheck` anteriores em arquivos grandes; os novos módulos de permissões/administração/segurança são tipados.

## 5. Lacunas e limites do pacote

O [levantamento de expressão profissional](../02-dominios/lacunas-de-expressao-profissional.md) identifica **20 profissões sem modalidade própria** e os limites das seis que possuem algum registro contextual.

Esta entrega não cria galerias, letras, sets, podcasts, portfólio ou publicações técnicas para essas profissões. Também não antecipa a redução do questionário, nova sidebar, remoção dos status de obras, confirmação de créditos ou editor de artigos.

A fundação do Consumidor está no banco/models e nas barreiras de autorização. O cadastro visual em duas modalidades, a ativação profissional e a experiência de perfil/configurações para Consumidor pertencem à fase 2.

## 6. Próxima fase

Fase 2: cadastro, identidade pública, questionário mínimo, perfil e privacidade. Resolver as decisões realmente necessárias a essa fase, como política etária, antes de implementar os campos e comportamentos dependentes. A base de desenvolvimento não exige preservar as antigas contas de teste.
