# Banco de dados do iBico

O script oficial de criação é o [`schema.sql`](../../schema.sql), na raiz do projeto. Esta pasta documenta a estrutura; em caso de divergência, vale o `schema.sql`.

- SGBD: MariaDB 10.11 (XAMPP). Banco `db_bico`, motor InnoDB, `utf8mb4` / `utf8mb4_general_ci` no banco e em todas as tabelas.
- **Todos os valores financeiros são simulados**: não existe pagamento real.
- Importe o script somente em um banco **novo e vazio**. Como o script usa `CREATE TABLE IF NOT EXISTS`, ele não altera tabelas que já existam.

## Como criar o banco (phpMyAdmin)

1. Inicie o MySQL no painel do XAMPP e abra `http://localhost/phpmyadmin`.
2. Em **Bancos de dados**, crie `db_bico` com agrupamento `utf8mb4_general_ci`.
3. Selecione `db_bico` → **Importar** → escolha `schema.sql` (UTF-8, formato SQL) → **Executar**.
4. Confira: 8 tabelas, todas InnoDB.

## Como criar o banco (MySQL Workbench)

1. Inicie o MySQL no painel do XAMPP.
2. No MySQL Workbench, conecte em `localhost:3306` com o usuário do `.env`.
3. **File** → **Open SQL Script** → escolha `schema.sql`.
4. Execute o script inteiro (ícone do raio, `Ctrl+Shift+Enter`).
5. Em **Schemas**, clique em atualizar (refresh) e confira: 8 tabelas no `db_bico`.

## Migrações

A pasta [`migrations/`](../../migrations) tem scripts para bancos que já foram criados com um `schema.sql` anterior. Quem cria o banco do zero com o `schema.sql` atual não precisa deles.

- `001_estorno.sql`: adiciona `ESTORNO` ao ENUM `movimentacoes_carteira.tipo_movimentacao` (cancelamento de bico com estorno simulado). Execute uma única vez no `db_bico` (phpMyAdmin → SQL, ou MySQL Workbench). Não altera linhas existentes.
- `002_avaliacao_bidirecional.sql`: troca a restrição única de `avaliacoes` de `(bico_id)` para `(bico_id, avaliador_id)`, adiciona a coluna `criado_em` e o `CHECK (avaliador_id <> avaliado_id)` (contratante e trabalhador avaliam um ao outro). Execute uma única vez no `db_bico` (phpMyAdmin → SQL, ou MySQL Workbench). As avaliações existentes continuam válidas e recebem `criado_em` igual a `data_atualizacao`.
- `003_endereco_bico.sql`: adiciona a `bicos` as colunas `cep`, `logradouro`, `numero`, `complemento`, `cidade` e `uf` (endereço do bico verificado pelo CEP). Execute uma única vez no `db_bico` (phpMyAdmin → SQL, ou MySQL Workbench). As colunas novas aceitam NULL: os bicos já publicados continuam válidos e exibem apenas o bairro.
- `004_foto_perfil.sql`: cria a tabela `fotos_perfil` (foto de perfil de contratante e trabalhador). Execute uma única vez no `db_bico` (phpMyAdmin → SQL, ou MySQL Workbench). A tabela `usuarios` não muda; quem não tem foto aparece com as iniciais do nome.

## Tabelas

Ordem de criação (cada tabela só referencia tabelas anteriores):
`usuarios` → `bicos` → `avaliacoes` → `historico_eventos_bicos` → `candidaturas` → `mensagens_chat` → `historico_candidaturas` → `movimentacoes_carteira` → `fotos_perfil`.

Todas as tabelas têm `id INT AUTO_INCREMENT` como chave primária, exceto `fotos_perfil`, cuja chave é o próprio `usuario_id`. Colunas de data com padrão usam `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.

### usuarios

| Coluna | Tipo | Observações |
| --- | --- | --- |
| id | INT, PK, auto incremento | |
| nome | VARCHAR(100) | obrigatório |
| email | VARCHAR(100) | obrigatório, único |
| cpf | VARCHAR(14) | obrigatório, único |
| idade | INT | obrigatório; CHECK entre 18 e 90 (mesmo intervalo de `validarIdade`, usada no cadastro e na edição de perfil) |
| senha | VARCHAR(255) | obrigatório; hash bcrypt |
| tipo_perfil | VARCHAR(50) | obrigatório; `contratante` ou `trabalhador` |
| saldo_simulado | DECIMAL(10,2) | obrigatório, padrão 0.00; CHECK `>= 0` |
| criado_em | TIMESTAMP | padrão: data/hora atual |

### bicos

| Coluna | Tipo | Observações |
| --- | --- | --- |
| id | INT, PK, auto incremento | |
| contratante_id | INT | obrigatório; FK → usuarios(id) |
| trabalhador_id | INT, nulo | FK → usuarios(id); preenchido ao aceitar um candidato |
| titulo | VARCHAR(100) | obrigatório |
| descricao | TEXT | obrigatório |
| valor | DECIMAL(10,2) | obrigatório; valor simulado; CHECK `> 0` |
| data_servico | DATE | obrigatório; data do serviço |
| horario | VARCHAR(20) | obrigatório |
| bairro | VARCHAR(100) | obrigatório |
| cep | CHAR(8), nulo | só os 8 dígitos |
| logradouro | VARCHAR(150), nulo | vem da consulta do CEP |
| numero | VARCHAR(10), nulo | |
| complemento | VARCHAR(60), nulo | |
| cidade | VARCHAR(100), nulo | vem da consulta do CEP |
| uf | CHAR(2), nulo | vem da consulta do CEP |
| status | ENUM | `Aberto` (padrão), `Em andamento`, `Finalizado`, `Cancelado` |
| criado_em | TIMESTAMP | data/hora da publicação (padrão: atual) |

As colunas de endereço ficam nulas nos bicos publicados antes da verificação pelo CEP. Nos bicos verificados, o `bairro` também vem da consulta do CEP.

### avaliacoes

Até duas avaliações por bico: uma de cada participante (`UNIQUE (bico_id, avaliador_id)`), o contratante avaliando o trabalhador e o trabalhador avaliando o contratante; `CHECK (avaliador_id <> avaliado_id)`. `bico_id`, `avaliador_id` e `avaliado_id` são FKs (bicos / usuarios / usuarios). `nota` TINYINT com CHECK entre 1 e 5; `comentario` VARCHAR(500) opcional; `criado_em` TIMESTAMP da primeira avaliação; `data_atualizacao` TIMESTAMP atualizado automaticamente a cada alteração.

### historico_eventos_bicos

Eventos de status do bico (hoje, a finalização e o cancelamento). `bico_id` (FK, `ON DELETE RESTRICT`), `usuario_id` (FK), `tipo_evento` VARCHAR(50), `status_anterior` e `status_novo` (ENUM igual ao de `bicos`, opcionais), `observacao` VARCHAR(255) opcional, `data_evento` TIMESTAMP.

### candidaturas

Liga o trabalhador ao bico. `bico_id` (FK, `ON DELETE CASCADE`), `trabalhador_id` (FK, `ON DELETE CASCADE`), `status` ENUM `Pendente` (padrão), `Aceito`, `Recusado`, `Cancelado`; `mensagem` TEXT opcional; `criado_em`; `atualizado_em` (atualiza automaticamente). Restrição única `(bico_id, trabalhador_id)`: o mesmo trabalhador não se candidata duas vezes ao mesmo bico.

### mensagens_chat

Mensagens da conversa de uma candidatura aceita. `candidatura_id` (FK, `ON DELETE CASCADE`), `remetente_id` (FK → usuarios), `texto` TEXT, `criado_em`.

### historico_candidaturas

Histórico de mudanças de status das candidaturas. `candidatura_id` (FK, `ON DELETE CASCADE`), `status_anterior` (opcional) e `status_novo` (ENUM igual ao de `candidaturas`), `alterado_por` (FK → usuarios), `observacao` VARCHAR(255) opcional, `data_alteracao`.

### movimentacoes_carteira

Extrato da carteira simulada. `usuario_id` (FK), `bico_id` (FK, nulo para adição de saldo), `tipo_movimentacao` ENUM `ADICAO`, `RESERVA`, `CREDITO`, `ESTORNO`; `valor` DECIMAL(10,2) com CHECK `> 0`; `descricao` VARCHAR(255) opcional; `criado_em`. Restrição única `(bico_id, tipo_movimentacao)`: cada bico gera no máximo uma reserva, um crédito e um estorno (o estorno devolve ao contratante a reserva de um bico cancelado; várias adições de saldo são permitidas, pois `bico_id` é nulo nelas).

### fotos_perfil

Foto de perfil, no máximo uma por usuário. `usuario_id` (PK e FK → usuarios, `ON DELETE CASCADE`), `tipo` VARCHAR(20) (`image/jpeg`, `image/png` ou `image/webp`, detectado pelos bytes do arquivo), `dados` MEDIUMBLOB (até 2 MB, limite da aplicação), `atualizado_em` TIMESTAMP(3), que muda a cada troca e entra na URL da foto (`/perfil/:id/foto?v=...`) para o navegador não mostrar a antiga do cache. Fica separada de `usuarios` para a imagem nunca vir junto nas consultas da conta.

## Relacionamentos

- `usuarios` 1—N `bicos` (como contratante e, opcionalmente, como trabalhador contratado).
- `bicos` 1—N `candidaturas`; `usuarios` 1—N `candidaturas` (como trabalhador).
- `candidaturas` 1—N `historico_candidaturas` e 1—N `mensagens_chat`.
- `bicos` 1—0..2 `avaliacoes`; `bicos` 1—N `historico_eventos_bicos` e `movimentacoes_carteira`.
- `usuarios` também é referenciado por `avaliacoes` (avaliador e avaliado), `historico_eventos_bicos` (autor), `mensagens_chat` (remetente), `historico_candidaturas` (quem alterou) e `movimentacoes_carteira` (dono da carteira).
- `usuarios` 1—0..1 `fotos_perfil`.

## Regras garantidas pelo banco

- E-mail e CPF únicos; saldo nunca negativo; idade entre 18 e 90; valor do bico e das movimentações maior que zero; nota de 1 a 5.
- Uma candidatura por trabalhador em cada bico; uma avaliação de cada participante por bico, e ninguém avalia a si mesmo; uma reserva, um crédito e um estorno por bico.

## Exclusões (chaves estrangeiras)

A aplicação não exclui registros; o comportamento abaixo é o definido no banco. Quando a chave estrangeira não declara `ON DELETE`, o InnoDB usa `RESTRICT`: a exclusão do registro referenciado é recusada enquanto houver linhas apontando para ele.

| Tabela.coluna | Referencia | Ao excluir o registro referenciado |
| --- | --- | --- |
| candidaturas.bico_id | bicos | `CASCADE`: apaga as candidaturas do bico |
| candidaturas.trabalhador_id | usuarios | `CASCADE`: apaga as candidaturas do trabalhador |
| mensagens_chat.candidatura_id | candidaturas | `CASCADE`: apaga as mensagens da candidatura |
| historico_candidaturas.candidatura_id | candidaturas | `CASCADE`: apaga o histórico da candidatura |
| historico_eventos_bicos.bico_id | bicos | `RESTRICT` (declarado) |
| avaliacoes.bico_id, movimentacoes_carteira.bico_id | bicos | `RESTRICT` (padrão) |
| bicos.contratante_id, bicos.trabalhador_id | usuarios | `RESTRICT` (padrão) |
| avaliacoes.avaliador_id, avaliacoes.avaliado_id | usuarios | `RESTRICT` (padrão) |
| historico_eventos_bicos.usuario_id | usuarios | `RESTRICT` (padrão) |
| mensagens_chat.remetente_id | usuarios | `RESTRICT` (padrão) |
| historico_candidaturas.alterado_por | usuarios | `RESTRICT` (padrão) |
| movimentacoes_carteira.usuario_id | usuarios | `RESTRICT` (padrão) |
| fotos_perfil.usuario_id | usuarios | `CASCADE`: apaga a foto do usuário |

Efeito prático:

- **Candidatura:** excluí-la apaga junto o histórico e as mensagens dela.
- **Bico:** excluí-lo apaga em cascata as candidaturas (e, por consequência, o histórico e as mensagens delas). A exclusão inteira é recusada se o bico tiver avaliação, evento em `historico_eventos_bicos` ou movimentação na carteira, o que ocorre a partir do aceite de um candidato ou do cancelamento do bico, mesmo quando ele ainda está `Aberto`, pois o cancelamento sempre grava um evento em `historico_eventos_bicos`.
- **Usuário:** a exclusão é recusada enquanto ele for contratante ou trabalhador de algum bico, avaliador ou avaliado, autor de evento, remetente de mensagem, autor de alteração no histórico de candidaturas ou dono de movimentação na carteira. Na prática, um usuário com atividade no sistema não pode ser excluído.

## Observações

- O `sql_mode` padrão do XAMPP não é estrito: um texto longo demais seria cortado e um valor de ENUM inválido seria gravado como texto vazio, ambos apenas com aviso. A aplicação valida os dados antes de gravar. Os CHECKs são aplicados mesmo sem modo estrito.
- O contratante pode cancelar um bico `Aberto` ou `Em andamento` (`POST /bicos/:id/cancelar`). No segundo caso, a reserva volta ao saldo dele e é registrada como `ESTORNO` em `movimentacoes_carteira`. Bico finalizado não pode ser cancelado. Todos os valores permanecem simulados.
- Para quem já tem um banco antigo: este script não migra dados existentes. As diferenças para o schema antigo são os CHECKs de `usuarios` e `bicos`, a coluna `bicos.criado_em`, o charset/motor explícitos e as mudanças das migrações `001` (`ESTORNO`), `002` (avaliação bidirecional), `003` (colunas de endereço em `bicos`) e `004` (tabela `fotos_perfil`), descritas na seção [Migrações](#migrações).
