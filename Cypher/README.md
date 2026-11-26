# Cypher
Plataforma web de descoberta, conexão e valorização de profissionais da cultura hip-hop, com foco na cena independente do rap.

## Tecnologias

- **Backend:** Node.js, TypeScript e Express
- **Interface:** EJS, CSS e JavaScript
- **Banco de dados:** SQLite
- **Arquitetura:** MVC

## Como executar

Requisitos: Node.js e npm. O ambiente de desenvolvimento foi verificado com Node.js 24.22.1 e npm 12.2.1 no Windows.

Na pasta `Cypher`, execute:

```sh
npm ci
npm run dev
```

- Aplicação: [localhost:3000/login](http://localhost:3000/login)
- Administração: [localhost:3000/admin/login](http://localhost:3000/admin/login)

Para compilar e executar a versão compilada:

```sh
npm run build
npm start
```

## Configuração local

- `PORT` altera a porta padrão, `3000`.
- `CYPHER_DB_PATH` altera o caminho do banco, que por padrão é `data/cypher.sqlite`.
- Na primeira inicialização, o acesso do Administrador Geral é configurado em `.env.local`, com senha aleatória. Consulte esse arquivo para entrar em `/admin/login`; mantenha-o privado. Alterar o arquivo posteriormente não redefine a senha de um administrador já criado.
- Por padrão, os e-mails são gravados localmente em `data/emails`. SMTP é opcional.

Para carregar ou atualizar o catálogo de apresentação, execute `npm run seed:catalog`. A carga cria um backup do banco antes da atualização e pode ser repetida. Inclui perfis das 25 profissões, obras, equipes, projetos, oportunidades e beats com diferentes ofertas.

## Estado do projeto

A aplicação possui fluxos de contas e perfis, descoberta e busca, obras, beats, eventos, projetos, galerias, oportunidades e administração. Esses módulos estão em diferentes estágios de implementação; consulte os requisitos para conhecer o comportamento previsto.

O catálogo segue as **25 profissões** oficiais. O intervalo entre alterações ordinárias posteriores à primeira mudança livre é de **30 dias**.

Obras, beats e eventos permitem atribuição de créditos. Selos externos passam por revisão. O checkout externo de beats aguarda credenciais de teste e homologação no Mercado Pago; sua ausência não libera arquivos Premium.

O acervo musical separa faixas reutilizáveis de lançamentos e oferece comprovação e revisão administrativa.

Contas incluem recuperação de senha, encerramento e proteção para usuários de 16 e 17 anos.

Beats possuem prévias, ofertas versionadas, aceite e entrega privada em `/purchases`.

Eventos possuem inscrições, vagas, presença, avisos, mapa e avaliação elegível.

Mensagens privadas aceitam imagens, áudio, vídeo e documentos com acesso restrito aos participantes. Consulte [formatos e limites dos anexos](docs/anexos-mensagens.md).

Projetos e galerias ficam em `/work-projects`, integrados ao Espaço de Trabalho.

O portfólio profissional pode ser organizado em `/portfolio/edit`, nos modos Manual e Inteligente.

Usuários enviam suas fotos, capas, cartazes e materiais de trabalhos. Vínculos profissionais ficam em `/representacoes`, com convite, aceite e encerramento.

Colaborações formais e avaliações ficam em `/colaboracoes`; a revisão administrativa está em `/admin/reputacao`.

A Central em `/central` reúne guias pesquisáveis e avaliação de utilidade, com edição e indicadores administrativos.

Ajuda, denúncias e recursos ficam em `/suporte`; a análise é feita em `/admin/moderacao`.

Oportunidades incluem publicação, candidaturas, propostas versionadas, negociação e pedidos excepcionais.

## Verificação

```sh
npm run check
npm run build
npm run test:db
npm run test:foundation
npm run test:security-http
npm run test:projects
npm run test:portfolio
npm run test:collaborations
npm run test:central
npm run test:support
npm run test:accounts
npm run test:events
npm run test:beats
npm run test:scene
npm run test:opportunities
npm run test:search
node scripts/testar-acervo-musical.mjs
node scripts/testar-fluxos-sociais.mjs
```

Outros testes por domínio estão disponíveis nos scripts do [package.json](package.json). Os testes usam bancos temporários; verificações HTTP precisam de acesso local ao servidor.

## Documentação

- [Escopo do projeto](../Docs/Nova%20Doc/01%20-%20Planejamento%20e%20Pesquisa/CYPHER%20-%20Escopo%20do%20Projeto.md)
- [Requisitos funcionais](../Docs/Nova%20Doc/02%20-%20Requisitos%20e%20Regras%20de%20Neg%C3%B3cios/RF-Cypher.md)
- [Regras de negócio](../Docs/Nova%20Doc/02%20-%20Requisitos%20e%20Regras%20de%20Neg%C3%B3cios/RN-Cypher.md)
- [Requisitos não funcionais](../Docs/Nova%20Doc/02%20-%20Requisitos%20e%20Regras%20de%20Neg%C3%B3cios/RNF-Cypher.md)
- [Arquitetura](../Docs/Nova%20Doc/04%20-%20Arquitetura%20e%20Tecnologias/ArquiteturaSistema/Arquitetura-do-Sistema-Cypher.md)
- [Banco, demonstração e diferenças entre versões](docs/entrega-e-validacao.md)
