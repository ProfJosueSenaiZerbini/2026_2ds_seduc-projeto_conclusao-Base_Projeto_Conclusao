# Etapa 0 — Diagnóstico e base verificada

Data: 16/11/2026. Estado: **concluída**, com limites de cobertura registrados abaixo.

Referência: [plano de ação](plano-de-acao.md). Nenhuma evolução funcional foi implementada nesta etapa.

## 1. Resultado

- Dependências instaladas a partir do lockfile existente.
- Verificação TypeScript e compilação concluídas.
- Os nove comandos existentes de verificação passaram; o teste administrativo exigiu repetição fora do sandbox.
- Versão compilada iniciada e validada por HTTP com uma cópia isolada do banco existente.
- Banco original íntegro, com dados de uma conta, preservado sem alterações.
- Recuperação do banco e das fontes verificada em diretórios separados.
- Inventário inicial dos domínios, dependências e diferenças para o planejamento documentado.

## 2. Ambiente e preparação

| Item | Resultado |
|---|---|
| Sistema | Windows x64 |
| Node.js | v24.22.1 |
| npm | 12.2.1 |
| Instalação | `npm ci --no-audit --no-fund` |
| Componentes nativos | `better-sqlite3@12.11.1` e `esbuild@0.28.2` preparados |
| Git | Executável disponível; nenhuma pasta Git encontrada nesta cópia do projeto |
| Dependências e versões | `package-lock.json` preservado |

Ocorrências do ambiente:

1. A primeira instalação falhou com EPERM no sandbox. A repetição autorizada fora dele instalou 131 pacotes.
2. O npm 12 bloqueou os scripts dos dois componentes nativos. Foram aprovados exclusivamente `better-sqlite3@12.11.1` e `esbuild@0.28.2`, registrando `allowScripts` no `package.json`.
3. A primeira preparação dos binários falhou por resolução de rede no sandbox. `npm rebuild better-sqlite3 esbuild` passou fora dele.
4. O npm informou descontinuação de `prebuild-install@7.1.3`, dependência transitiva. Nenhuma atualização de versão foi feita.

**Alteração no projeto:** somente a configuração `allowScripts` no `package.json`, necessária à instalação neste npm. Não houve alteração em lógica, páginas, estilos, scripts funcionais, schema ou lockfile. Foram geradas as pastas locais `node_modules` e `dist`.

## 3. Banco atual e preservação

O banco foi aberto em modo somente leitura, sem chamar o bootstrap da aplicação sobre o original. Nenhum nome, e-mail, senha ou token foi exportado no diagnóstico.

| Verificação | Resultado |
|---|---|
| Arquivo | `Cypher/data/cypher.sqlite` |
| Tamanho inicial | 360.448 bytes |
| Schema | 20 |
| Tabelas de aplicação | 22 |
| `PRAGMA integrity_check` | `ok` |
| `PRAGMA foreign_key_check` | Nenhuma violação |
| Usuários / perfis | 1 / 1 |
| Profissões associadas | 1 |
| Respostas por categoria / por profissão | 1 / 1 |
| Sessões | 1 |
| Obras, créditos, beats, ofertas, eventos e interesses | 0 |
| Notificações e registros de solicitações/revisões/auditoria | 0 |
| Registros marcados como demonstração nas tabelas verificadas | 0 |

Tratar a conta existente como dado a preservar. Ausência de obras/eventos não autoriza recriar o banco nas próximas etapas.

SHA-256 do banco original, igual antes e após as verificações:

```text
e798567f4f325086e283768580a2ac63f5ba2772cdbf1293f978c3b3ad173f3e
```

## 4. Backups e recuperação verificada

Local: [`_seguranca/etapa-0-2026-11-16`](../../_seguranca/etapa-0-2026-11-16/).

| Artefato | Finalidade |
|---|---|
| `cypher.sqlite` | Cópia inicial byte a byte, com hash igual ao original |
| `cypher-consistente.sqlite` | Backup pela API SQLite, verificado por integridade e contagens |
| `restauracao-teste.sqlite` | Restauração isolada do backup consistente, comparada ao inventário original |
| `execucao-isolada.sqlite` | Cópia usada para iniciar e validar a aplicação compilada |
| `cypher-fontes.zip` | 135 arquivos das fontes antes da preparação, incluindo package e arquivos de configuração |
| `fontes-restauradas/` | Extração verificada; conteúdo igual ao atual, exceto a alteração intencional do package |
| `manifesto-fontes-original.json` | Hash por arquivo original |
| `manifesto-backups.json` | Hash e tamanho dos arquivos de backup |
| `inventario-banco.json` | Contagens e resultados das verificações, sem linhas de dados pessoais |
| `resultado-http.json` | Resultados da verificação HTTP da versão compilada |
| `logs/` | Saídas dos comandos e resumo de execução |

O hash do backup consistente pode diferir do hash do original porque o SQLite pode reorganizar fisicamente suas páginas. A restauração foi comparada por schema, integridade, chaves estrangeiras e contagens.

**Procedimento para uma recuperação futura:** parar todos os processos que usem a aplicação, preservar o estado então existente em uma nova cópia, restaurar o banco consistente para um destino isolado, conferir integridade e inventário, e somente então substituir o banco de trabalho se a recuperação for solicitada. Nunca misturar o banco restaurado com arquivos WAL/SHM antigos. Para fontes, extrair o ZIP em diretório separado, conferir o manifesto e recuperar apenas os arquivos pertinentes; o ZIP não contém banco, dependências ou compilação.

As cópias são locais e contêm os dados privados do banco. Não foram enviadas a serviço externo. Um snapshot de fontes foi usado como mecanismo de recuperação nesta etapa; não foi criado repositório Git automaticamente.

## 5. Verificações executadas

| Comando | Resultado final | O que verifica nesta base |
|---|---|---|
| `npm run check` | Passou | Tipagem habilitada nos arquivos cobertos |
| `npm run build` | Passou | Geração da aplicação compilada |
| `npm run test:db` | Passou | Banco novo, migrações legadas, integridade, schema futuro, políticas e privacidade |
| `npm run test:admin-ui` | Passou fora do sandbox | Fluxos HTTP de cadastro, administração, busca, obras, eventos, propostas e exceções |
| `npm run test:catalog` | Passou | Catálogo profissional atual |
| `npm run test:questionnaires` | Passou | 36 profissões, quatro eixos, validação e isolamento por profissão |
| `npm run test:persistence` | Passou | Regras de vertentes profissionais verificadas pelo script existente |
| `npm run test:relations` | Passou | Seleção, inativação, reativação e associação de profissões/vertentes |
| `npm run test:profile-relations` | Passou | Integração das relações profissionais no cadastro e edição |

O primeiro `test:admin-ui` falhou no sandbox com “Servidor não iniciou”, embora o processo informasse que estava ouvindo. O mesmo teste, sem mudança de código, passou fora do sandbox. Os dois resultados foram preservados; o resumo registra a repetição, sem apagar a falha inicial.

Os scripts que gravam dados usam bancos isolados. A verificação adicional da versão compilada usou outra cópia do banco existente, com `CYPHER_DB_PATH` explícito, e confirmou:

- Login e cadastro: HTTP 200.
- Dashboard, perfil e administração sem sessão: HTTP 302 para `/login`.
- CSS e JavaScript estáticos: HTTP 200.
- Página inexistente: HTTP 404.
- Processo encerrado após a verificação; nenhum servidor desta etapa foi deixado ativo.

**Limites:** não foi realizada inspeção visual no navegador, auditoria de vulnerabilidades de dependências ou teste de carga. O teste chamado `admin-ui` faz verificações HTTP/HTML/CSS, não substitui validação visual interativa. `bancoDados.ts`, `controladorCompatibilidade.ts`, `controladorBeats.ts` e `controladorEventos.ts` usam `@ts-nocheck`; portanto, o check passar não significa tipagem integral dessas áreas.

## 6. Inventário funcional e pontos de alteração

As rotas abaixo resumem famílias e pontos de entrada; a lista completa permanece em `Cypher/src/app/routes/rotasCypher.ts`.

| Domínio | Rotas principais | Implementação e dependências |
|---|---|---|
| Autenticação | `/login`, `/register`, `/register/validate`, `/logout` | Controller de compatibilidade, validators, `autenticacaoCypher.ts`, usuários e sessões |
| Navegação/início | `/`, `/dashboard` | Sidebar/topbar compartilhadas, `visao-geral.ejs`, modelos de resumo |
| Busca/perfil | `/search`, `/profile`, `/profile/secoes/:secao`, `/p/:identificador` | Catálogo, questionários, respostas/visibilidades, cooldown e perfil público |
| Obras/créditos | `/works` e criação/edição/exclusão | Validação de obra/créditos, permissões profissionais e propriedade, publicação e participações |
| Beats | `/beats` e criação/edição/exclusão | Controller próprio, categoria Beatmaker, produtor proprietário, licenças/ofertas |
| Eventos | `/events` e operações de evento/interesse | Controller próprio, categoria de organizador, propriedade, interessados e situação do evento |
| Notificações | `/notificacoes` e operações de leitura | Controller próprio, destinatário, contagem de não lidas |
| Configurações | `/settings`, privacidade e exclusão | Mesmas regras de perfil; exclusão bloqueada enquanto houver obras/beats/eventos próprios |
| Administração | `/admin/revisao` e subrotas | Allowlist de e-mails, propostas, exceções, decisões e histórico |
| Conhecimento | `/central` | FAQ estática no model e filtragem no navegador |

Persistência atual, agrupada pelas 22 tabelas encontradas:

- Conta: `usuarios`, `perfis`, `sessoes`, `sequencias`.
- Conteúdo: `obras`, `creditos`, `beats`, `ofertas_beats`, `eventos`, `interesses_eventos`.
- Comunicação: `notificacoes`.
- Catálogo e gestão: `propostas_generos`, `propostas_categorias`, `categorias_profissionais_aprovadas`, `excecoes_categorias`, `solicitacoes_excecao_categorias`, `historico_solicitacoes_categorias`, `auditoria_categorias`.
- Profissões: `profissoes_usuario`, `vertentes_profissionais_usuario`, `respostas_atuacao_categoria`, `respostas_atuacao_profissao`.

Dependências que exigem atenção nas primeiras entregas:

1. Profissões determinam questionários, vertentes, permissões de criação, apresentação e alguns status profissionais. Mudar só a lista visual deixa regras antigas ativas.
2. Edição por seção recompõe o perfil e reaproveita a atualização geral; alterações precisam preservar campos das outras seções.
3. O cadastro exige as quatro respostas atuais; simplificar a interface exige adaptar validação e persistência juntas.
4. `situacao = 'Lançado'` e `publicada = 1` também são usados na definição atual de colaborador para privacidade. Retirar status de obras interfere em acesso a respostas profissionais.
5. Crédito atual é salvo como não verificado; a definição atual de colaborador não consulta confirmação do crédito. A fase de relações precisa especificar esse acesso, sem pressupor vínculo confirmado.
6. A Visão Geral recebe listas vazias e estatísticas zero de métodos do model; não representa um motor de Descoberta nem recomendações reais.
7. Há reputação persistida com valor inicial zero e apresentação na sidebar, mas não foi identificado o fluxo de avaliações previsto no planejamento. Não tratar o número como reputação calculada.
8. O Banco de Beats contém botões com `data-toast` para player/prévia e contato demonstrativos. Esses controles exibem aviso; não reproduzem áudio nem registram contato.
9. A inicialização tem limpeza de registros marcados como demonstrativos. Na etapa 0, somente as cópias de teste passaram pelo bootstrap; o original foi inspecionado sem inicialização da aplicação.

## 7. Estado frente à evolução

| Classificação | Elementos |
|---|---|
| Existentes e exercitados pelos testes atuais | Cadastro/login, persistência de perfil/profissões, operações de obras/eventos e gestão administrativa cobertas pelos scripts |
| Existentes, a adaptar | 36 profissões, quatro perguntas, sidebar expandida, regras de publicação por status, allowlist administrativa, edição e privacidade |
| Parcial/base disponível | Notificações, créditos sem confirmação, catálogo de beats sem player/compra, Central em FAQ, início sem Descoberta real |
| Sem implementação correspondente encontrada na inspeção | Conta Consumidor dedicada, três papéis administrativos próprios, mensagens persistentes, seguidores/curtidas/comentários, portfólio Manual/Inteligente, uploads/galerias, selos e mapa/lembretes |
| Decisão pendente | Políticas etárias, matrizes de permissão, migração das profissões retiradas, regras de `@`, visibilidade, confirmação de créditos e demais pontos do plano |
| STAND-BY | Avaliações e reputação profissional calculada |

Essa classificação é a linha de base, não uma promessa de cobertura completa de cada funcionalidade. Antes de implementar um pacote, reler seu código e resolver as especificações aplicáveis.

## 8. Próxima etapa

Iniciar a fase 1 somente mediante solicitação: definir a matriz de contas/permissões e a estratégia de migração das profissões, usando o inventário e o backup desta etapa. As regras pendentes não foram escolhidas automaticamente. Nenhuma das mudanças de 26 profissões, questionário ou sidebar foi aplicada.
