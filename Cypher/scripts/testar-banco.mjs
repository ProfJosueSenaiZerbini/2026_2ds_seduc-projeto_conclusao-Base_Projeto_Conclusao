import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-db-v21-"));
const arquivo = path.join(pasta, "cypher.sqlite");
const bootstrap = () =>
  spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      `import { inicializarBancoCypher } from './src/app/models/bancoDados.ts'; inicializarBancoCypher();`,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, CYPHER_DB_PATH: arquivo, NODE_ENV: "test" },
      encoding: "utf8",
    }
  );
let db;
try {
  let r = bootstrap();
  assert.equal(r.status, 0, r.stderr);
  db = new Database(arquivo);
  assert.equal(db.pragma("user_version", { simple: true }), 37);
  assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  const tabelas = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    .all();
  for (const nome of ["profissionais_seguidos", "interacoes_conteudo", "comentarios_conteudo", "midias_publicacoes", "representacoes_profissionais", "historico_representacao", "selos_perfil"])
    assert.ok(tabelas.some(t => t.name === nome), `Tabela de interações ausente: ${nome}`);
  for (const nome of ["detalhes_projetos", "midias_trabalho", "itens_projeto", "historico_projetos", "portfolio_config", "portfolio_itens", "colaboracoes", "avaliacoes_colaboracao", "casos_colaboracao", "manifestacoes_colaboracao", "historico_colaboracao"])
    assert.ok(tabelas.some(t => t.name === nome), `Tabela do acervo ausente: ${nome}`);
  for (const { name } of tabelas)
      assert.equal(
        db.prepare(`SELECT count(*) AS total FROM "${name}"`).get().total,
        0,
        name
      );
  assert.ok(!tabelas.some(({ name }) => name === "sequencias"));
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO sessoes (token_hash,usuario_id,expira_em,criada_em) VALUES ('x','inexistente',1,0)"
        )
        .run(),
    /FOREIGN KEY/
  );
  db.prepare(
    "INSERT INTO usuarios (id,email,tipo_conta) VALUES ('interno','interno@example.test','administrativo')"
  ).run();
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO perfis (usuario_id,nome,funcao,identificador) VALUES ('interno','Equipe','Admin','@equipe')"
        )
        .run(),
    /ADMINISTRADOR_NAO_POSSUI_PERFIL/
  );
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO usuarios (id,email,tipo_conta) VALUES ('outro','interno@example.test','profissional')"
        )
        .run(),
    /UNIQUE/
  );
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO usuarios (id,tipo_conta) VALUES ('organizador','organizador')"
        )
        .run(),
    /CHECK/
  );
  db.close();
  r = bootstrap();
  assert.equal(r.status, 0, r.stderr);
  db = new Database(arquivo);
  assert.equal(
    db.prepare("SELECT count(*) AS total FROM usuarios").get().total,
    1
  );
  const removerColunasPerfil = `
    ALTER TABLE perfis DROP COLUMN competencias_publicas;
    ALTER TABLE perfis DROP COLUMN competencias_json;
    ALTER TABLE perfis DROP COLUMN nome_publico;
  `;
  db.exec(removerColunasPerfil);
  db.exec(`
    INSERT INTO usuarios(id,email,tipo_conta) VALUES('legado','legado@example.test','profissional');
    INSERT INTO perfis(usuario_id,nome,nome_informado,vulgo,funcao,identificador)
      VALUES('legado','Nome Legado','Nome Legado','Vulgo Legado','Rapper','@legado');
    INSERT INTO respostas_atuacao_categoria(usuario_id,categoria,respostas_json,visibilidades_json)
      VALUES('legado','Rapper','{"tempoAtuacao":"iniciando","etapaProjetos":"sem-projeto"}','{"tempoAtuacao":"privado"}');
  `);
  db.pragma("user_version = 36");
  db.close();
  r = bootstrap();
  assert.equal(r.status,0,r.stderr);
  db = new Database(arquivo);
  assert.equal(db.pragma("user_version", { simple: true }),37);
  assert.deepEqual(
    db.prepare("SELECT nome,nome_informado,vulgo,nome_publico,competencias_json,competencias_publicas FROM perfis WHERE usuario_id='legado'").get(),
    {nome:"Nome Legado",nome_informado:"Nome Legado",vulgo:"Vulgo Legado",nome_publico:1,competencias_json:"[]",competencias_publicas:0}
  );
  assert.equal(
    db.prepare("SELECT respostas_json FROM respostas_atuacao_categoria WHERE usuario_id='legado'").get().respostas_json,
    '{"tempoAtuacao":"iniciando","etapaProjetos":"sem-projeto"}'
  );
  db.pragma("foreign_keys = ON");
  db.prepare("DELETE FROM usuarios WHERE id='legado'").run();
  db.exec(removerColunasPerfil);
  db.exec(`
    DROP INDEX midia_publicacao_posicao_ativa;
    ALTER TABLE midias_publicacoes DROP COLUMN posicao;
    CREATE UNIQUE INDEX midia_publicacao_ativa ON midias_publicacoes(objeto_tipo,objeto_id,finalidade) WHERE retirada_em IS NULL;
    INSERT INTO midias_publicacoes VALUES('foto-anterior','interno','perfil','interno','imagem','foto.png','image/png',20,1000,NULL);
    DROP TABLE atuacoes_obra;
    ALTER TABLE eventos DROP COLUMN tema_cartao;
    DROP TRIGGER aplicar_preferencias_notificacoes;
    ALTER TABLE notificacoes DROP COLUMN removida_em;
    ALTER TABLE preferencias_usuario DROP COLUMN avisos_desativados_json;
  `);
  db.pragma("user_version = 24");
  db.close();
  r = bootstrap();
  assert.equal(r.status, 0, r.stderr);
  db = new Database(arquivo);
  assert.equal(db.pragma("user_version", { simple: true }), 37);
  assert.ok(db.pragma("table_info(notificacoes)").some(coluna => coluna.name === "removida_em"));
  assert.equal(db.prepare("SELECT posicao FROM midias_publicacoes WHERE id='foto-anterior'").get().posicao, "principal");
  assert.ok(db.pragma("table_info(preferencias_usuario)").some(coluna => coluna.name === "avisos_desativados_json"));
  assert.equal(db.pragma("table_info(eventos)").find(coluna => coluna.name === "tema_cartao").dflt_value, "'classico'");
  assert.equal(db.prepare("SELECT count(*) AS n FROM atuacoes_obra").get().n, 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM usuarios").get().n, 1);
  db.pragma("user_version = 20");
  db.close();
  r = bootstrap();
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Recrie a base de desenvolvimento/);
  db = new Database(arquivo);
  assert.equal(db.pragma("user_version", { simple: true }), 20);
  assert.equal(
    db.prepare("SELECT count(*) AS total FROM usuarios").get().total,
    1
  );
  db.pragma("user_version = 999");
  db.close();
  r = bootstrap();
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /mais recente/);
  console.log(
    "OK: schema 37, base sem demonstrações, identidades, integridade, unicidade, idempotência e recusa sem mutação de bases incompatíveis."
  );
} finally {
  if (db?.open) db.close();
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}

