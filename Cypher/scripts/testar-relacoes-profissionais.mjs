import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const diretorio = fs.mkdtempSync(
  path.join(os.tmpdir(), "cypher-profissoes-test-")
);
const arquivoBanco = path.join(diretorio, "cypher.sqlite");
const codigo = `
  import assert from "node:assert/strict";
  import { inicializarAplicacaoCypher } from "./src/app/models/modeloCypher.ts";
  import {
    listarProfissoesUsuarioCypher,
    listarVertentesProfissionaisUsuarioCypher,
    salvarProfissoesUsuarioCypher,
    salvarVertentesProfissionaisUsuarioCypher,
    sincronizarVertentesProfissionaisUsuarioCypher,
    criarContaCypher,
  } from "./src/app/models/bancoDados.ts";

  inicializarAplicacaoCypher();
  const usuarioId = "teste-relacoes-profissionais";
  criarContaCypher({
    id: usuarioId,
    email: "teste-relacoes-profissionais@cypher.local",
    senhaHash: "hash-de-teste",
    tipoConta: "profissional",
    nome: "Usuário de teste",
    funcao: "Rapper",
    identificador: "@teste-relacoes",
    iniciais: "TR",
    cTag: "#TR0001",
    categorias: ["Rapper"],
    outraCategoria: "",
  });

  salvarProfissoesUsuarioCypher(usuarioId, [
    { profissaoId: "rapper", valorOriginal: "Rapper", origem: "catalogo" },
    { profissaoId: "mc", valorOriginal: "MC", origem: "catalogo" },
    { profissaoId: "beatmaker", valorOriginal: "Beatmaker", origem: "catalogo" },
  ]);
  salvarVertentesProfissionaisUsuarioCypher(usuarioId, ["Trap", "Drill"]);

  assert.deepEqual(
    listarProfissoesUsuarioCypher(usuarioId)
      .map(item => item.profissaoId)
      .sort(),
    ["beatmaker", "mc", "rapper"]
  );
  assert.deepEqual(
    listarVertentesProfissionaisUsuarioCypher(usuarioId).map(item => item.vertenteId),
    ["Drill", "Trap"]
  );

  salvarProfissoesUsuarioCypher(usuarioId, [
    { profissaoId: "mc", valorOriginal: "MC", origem: "catalogo" },
    { profissaoId: "beatmaker", valorOriginal: "Beatmaker", origem: "catalogo" },
  ]);
  assert.equal(sincronizarVertentesProfissionaisUsuarioCypher(usuarioId), false);
  assert.equal(listarVertentesProfissionaisUsuarioCypher(usuarioId).length, 0);

  salvarProfissoesUsuarioCypher(usuarioId, [
    { profissaoId: "beatmaker", valorOriginal: "Beatmaker", origem: "catalogo" },
  ]);
  assert.equal(sincronizarVertentesProfissionaisUsuarioCypher(usuarioId), false);
  const preservadas = listarVertentesProfissionaisUsuarioCypher(usuarioId, {
    incluirInativas: true,
  });
  assert.equal(preservadas.length, 2);
  assert.ok(preservadas.every(item => item.ativa));
  assert.ok(preservadas.every(item => !item.associacaoAtiva));
  assert.throws(
    () => salvarVertentesProfissionaisUsuarioCypher(usuarioId, ["Trap"]),
    /Somente Rapper/
  );

  salvarProfissoesUsuarioCypher(usuarioId, [
    { profissaoId: "rapper", valorOriginal: "Rapper", origem: "catalogo" },
  ]);
  assert.equal(sincronizarVertentesProfissionaisUsuarioCypher(usuarioId), true);
  const reativadas = listarVertentesProfissionaisUsuarioCypher(usuarioId);
  assert.deepEqual(
    reativadas.map(item => item.vertenteId),
    ["Drill", "Trap"]
  );

  const historico = listarProfissoesUsuarioCypher(usuarioId, {
    incluirInativas: true,
  });
  assert.ok(historico.some(item => item.profissaoId === "mc" && item.estado === "inativa"));
  assert.ok(historico.some(item => item.profissaoId === "beatmaker" && item.estado === "inativa"));
  assert.equal(historico.filter(item => item.profissaoId === "rapper").length, 1);
  console.log("OK: operações de profissões e vertentes preservam seleção, inativação e reativação.");
`;

const resultado = spawnSync(
  process.execPath,
  ["--import", "tsx", "--input-type=module", "-e", codigo],
  {
    cwd: process.cwd(),
    env: { ...process.env, CYPHER_DB_PATH: arquivoBanco, NODE_ENV: "test" },
    encoding: "utf8",
  }
);
assert.equal(resultado.status, 0, `${resultado.stdout}\n${resultado.stderr}`);
process.stdout.write(resultado.stdout);
