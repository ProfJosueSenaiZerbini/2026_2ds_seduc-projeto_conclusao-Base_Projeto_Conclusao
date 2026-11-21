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
try {
  let r = bootstrap();
  assert.equal(r.status, 0, r.stderr);
  let db = new Database(arquivo);
  assert.equal(db.pragma("user_version", { simple: true }), 26);
  assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  const tabelas = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    .all();
  assert.equal(tabelas.length, 30);
  for (const { name } of tabelas)
    if (name !== "sequencias")
      assert.equal(
        db.prepare(`SELECT count(*) AS total FROM "${name}"`).get().total,
        0,
        name
      );
  assert.equal(
    db
      .prepare(
        "SELECT proximo_numero FROM sequencias WHERE nome='usuarios_reais'"
      )
      .get().proximo_numero,
    1
  );
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
    "INSERT INTO usuarios (id,email,tipo_conta,codigo_publico) VALUES ('interno','interno@example.test','administrativo','ADM-TESTE')"
  ).run();
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO perfis (usuario_id,c_tag,nome,funcao,identificador) VALUES ('interno','TAG','Equipe','Admin','@equipe')"
        )
        .run(),
    /ADMINISTRADOR_NAO_POSSUI_PERFIL/
  );
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO usuarios (id,email,tipo_conta,codigo_publico) VALUES ('outro','interno@example.test','profissional','CYP-OUTRO')"
        )
        .run(),
    /UNIQUE/
  );
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO usuarios (id,tipo_conta,codigo_publico) VALUES ('organizador','organizador','CYP-ORG')"
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
  db.exec("DROP TABLE atuacoes_obra; ALTER TABLE eventos DROP COLUMN tema_cartao");
  db.pragma("user_version = 24");
  db.close();
  r = bootstrap();
  assert.equal(r.status, 0, r.stderr);
  db = new Database(arquivo);
  assert.equal(db.pragma("user_version", { simple: true }), 26);
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
    "OK: schema 26, base sem demonstrações, identidades, integridade, unicidade, idempotência e recusa sem mutação de bases incompatíveis."
  );
} finally {
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}

