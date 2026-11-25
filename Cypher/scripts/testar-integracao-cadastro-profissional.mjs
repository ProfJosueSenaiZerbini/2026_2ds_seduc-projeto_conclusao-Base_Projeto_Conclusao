import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const diretorio = fs.mkdtempSync(
  path.join(os.tmpdir(), "cypher-cadastro-profissional-")
);
const arquivoBanco = path.join(diretorio, "cypher.sqlite");
const codigo = `
  import assert from "node:assert/strict";
  import { randomUUID } from "node:crypto";
  import { inicializarAplicacaoCypher } from "./src/app/models/modeloCypher.ts";
  import {
    criarContaCypher,
    atualizarPerfilCypher,
    listarProfissoesUsuarioCypher,
  } from "./src/app/models/bancoDados.ts";

  inicializarAplicacaoCypher();
  const id = randomUUID();
  criarContaCypher({
    id,
    email: "integracao-" + id + "@example.test",
    senhaHash: "hash-de-teste",
    tipoConta: "profissional",
    nome: "Conta Integração",
    funcao: "Rapper · Produtor(a)",
    identificador: "conta-integracao-" + id.slice(0, 8),
    iniciais: "CI",
    categorias: ["Rapper", "Produtor(a)"],
    outraCategoria: "Artista independente",
    atuacoes: [],
  });

  const criadas = listarProfissoesUsuarioCypher(id, { incluirInativas: true });
  assert.equal(criadas.length, 2);
  assert.equal(criadas.find(item => item.valorOriginal === "Rapper")?.profissaoId, "rapper");
  assert.equal(criadas.find(item => item.valorOriginal === "Produtor(a)")?.profissaoId, "produtor");

  assert.equal(
    atualizarPerfilCypher({
      id,
      name: "Conta Integração",
      role: "MC · Beatmaker",
      city: "São Paulo",
      biography: "",
      contact: "",
      availability: "",
      genres: [],
      categories: ["MC", "Beatmaker"],
      atuacoes: [],
      otherCategory: "",
      equipment: [],
      initials: "CI",
      tipoConta: "profissional",
    }),
    true
  );
  const editadas = listarProfissoesUsuarioCypher(id, { incluirInativas: true });
  assert.deepEqual(
    editadas
      .filter(item => item.estado === "ativa")
      .map(item => item.profissaoId)
      .sort(),
    ["beatmaker", "mc"]
  );
  assert.ok(editadas.some(item => item.valorOriginal === "Rapper" && item.estado === "inativa"));
  assert.ok(editadas.some(item => item.valorOriginal === "Produtor(a)" && item.estado === "inativa"));
  console.log("OK: cadastro e edição usam somente relações profissionais canônicas.");
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
