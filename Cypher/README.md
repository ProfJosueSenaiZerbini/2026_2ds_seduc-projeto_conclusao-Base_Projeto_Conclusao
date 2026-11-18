# Cypher

Plataforma para profissionalização, conexão e valorização da cena underground do rap e da cultura hip-hop. Stack: Node.js, TypeScript, Express, EJS, SQLite e JavaScript vanilla.

## Executar

Ambiente verificado: Node.js 24.22.1 e npm 12.2.1 no Windows x64.

```sh
npm ci
npm run dev
```

Aplicação: `http://localhost:3000/login`. Administração: `http://localhost:3000/admin/login`. `PORT` altera a porta.

```sh
npm run build
npm start
```

Os comandos devem ser executados nesta pasta. `CYPHER_DB_PATH` pode selecionar um banco separado; por padrão, usa `data/cypher.sqlite`.

## Acesso administrativo interno

O primeiro Administrador Geral é provisionado automaticamente na inicialização, por configuração local em **`.env.local`**. Não existe comando de criação de Super Admin, conta administrativa no cadastro público ou senha padrão distribuída no código.

- Na primeira execução, se o arquivo não existir, o projeto gera um acesso local com senha aleatória forte e grava os campos `CYPHER_SUPER_ADMIN_EMAIL` e `CYPHER_SUPER_ADMIN_PASSWORD` no arquivo privado.
- O acesso desta cópia já está configurado em `.env.local`. Consultar esse arquivo local para entrar; as credenciais não são impressas no terminal.
- O arquivo fica fora de `public` e é ignorado pelo `.gitignore`. O banco guarda apenas o hash `scrypt` da senha.
- O provisionamento ocorre somente quando ainda não existe administrador. Reiniciar ou editar a configuração inicial não redefine uma senha existente nem recria acesso revogado.
- Demais integrantes são criados e gerenciados pelo Administrador Geral no painel interno, com histórico. A conta não possui perfil artístico, `@` público ou reputação.
- `CYPHER_ADMIN_EMAILS` não concede mais privilégios.

Papéis implementados:

| Papel | Ações disponíveis nesta etapa |
|---|---|
| Administrador Geral | Equipe, papéis, revogação de acessos, auditoria, análises e exceções profissionais |
| Moderador | Fila de exceções de categorias e esclarecimentos |
| Editor | Identidade e painel interno próprios; gestão editorial será adicionada com a evolução da Central |

Administração e contas públicas usam cookies/sessões separados. Um login público não autoriza a área administrativa; a identidade administrativa não pode ser usada para publicar como artista.

## Catálogo e permissões profissionais

O catálogo canônico tem **26 profissões em sete áreas**, distribuídas em 8/3/3/3/3/3/3. Freestyleiro é o rótulo e identificador atuais; as dez profissões retiradas não são aceitas por cadastro, edição ou gravação no model. Somente Rapper pode selecionar vertentes profissionais de rap.

As permissões seguem o contexto da atuação, não apenas a área:

- Rapper: obras e lançamentos musicais próprios.
- Compositor(a): tipo Obra, para composição; não libera formatos de lançamento ou beats.
- Beatmaker: Instrumental e Banco de Beats.
- Produtor(a): produções musicais e instrumentais; beat exige também Beatmaker.
- Freestyleiro: Música/Single para gravação própria de freestyle.
- Organizador(a) de eventos: criação de eventos.
- Letrista, MC, DJ e demais profissões não recebem publicação musical genérica. Suas modalidades próprias ainda precisam de implementação.

Capacidades são cumulativas quando há múltiplas profissões. Gerenciar conteúdo próprio é diferente de criar: retirar uma profissão não transfere a propriedade; mudar o registro para um tipo diferente exige permissão para esse tipo. Rotas, formulários e models verificam as regras.

Nesta versão, sugestões de novas profissões podem ser registradas e triadas, mas não expandem automaticamente o catálogo. Uma inclusão precisa de integração de atuação, questionário e permissões, evitando opções sem suporte funcional.

O questionário ainda tem **quatro eixos por profissão**. A redução para tempo de atuação obrigatório no cadastro pertence à fase 2. A primeira alteração de profissões após o cadastro é livre; as seguintes respeitam o intervalo de 60 dias, com exceções administrativas registradas.

## Banco e contas

Schema atual: **21**. A base de desenvolvimento foi recriada por orientação do usuário; não há público nem exigência de migração das contas de teste. O bootstrap recusa versões anteriores e futuras sem tentar converter silenciosamente seus dados. A cópia anterior ficou em `_seguranca/etapa-1-2026-11-16`, na pasta superior.

O banco suporta as naturezas Consumidor, Profissional e Administrativo. Organizador é uma profissão, não uma natureza de conta. A base estrutural e as restrições do Consumidor estão implementadas; a seleção de modalidade no cadastro e a experiência específica do público serão entregues na fase 2. O cadastro atual continua profissional e recusa criação administrativa por POST.

## Funcionalidades existentes e limites

- Cadastro/login, sessões, perfil, privacidade, busca e edição por seções.
- Obras, metadados musicais, links, créditos e participações. Os status atuais de obras ainda serão removidos na fase correspondente.
- Banco de Beats com licenças/ofertas persistidas; não há upload, player real, compra ou checkout.
- Eventos e interesses persistidos, com gestão pelo responsável.
- Notificações persistidas e operações de leitura.
- Central baseada em FAQ; artigos e ferramentas editoriais ainda serão implementados.
- Créditos ainda não possuem fluxo de confirmação pelo creditado.
- Mensagens, seguidores, curtidas, comentários, galerias, portfólio Manual/Inteligente, selos e mapa/lembretes permanecem em evolução. Reputação calculada está em stand-by.

Levantamento por profissão: [lacunas de expressão profissional](../planoEvolucao/02-dominios/lacunas-de-expressao-profissional.md).

## Segurança e verificação

Senhas usam `scrypt` e sal aleatório; sessões armazenam hash do token. Escritas exigem token CSRF, com verificação de origem; logins têm limite local de tentativas por IP e rota. Cookies administrativos usam `HttpOnly` e `SameSite=Strict`. HTTPS ativa `Secure`. Atrás de proxy, habilitar `CYPHER_TRUST_PROXY=1` somente se o acesso realmente passar pelo proxy confiável.

```sh
npm run check
npm run build
npm run test:db
npm run test:admin-ui
npm run test:catalog
npm run test:questionnaires
npm run test:persistence
npm run test:relations
npm run test:profile-relations
npm run test:foundation
npm run test:security-http
```

Os testes usam bancos temporários. As verificações HTTP precisam de acesso local ao servidor. Existem arquivos antigos com `@ts-nocheck`; o check de TypeScript não equivale a cobertura integral da aplicação.

Plano e resultados: [plano de ação](../planoEvolucao/00-planejamento/plano-de-acao.md) e [etapa 1](../planoEvolucao/04-implementacao/etapa-1-contas-permissoes-e-migracao.md).
