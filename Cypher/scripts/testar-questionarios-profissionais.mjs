import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-questionarios-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "cypher.sqlite");
const { listarProfissoesCatalogo } =
  await import("../dist/src/app/models/modeloPerfil.js");
const questionarios =
  await import("../dist/src/app/models/questionarioAtuacao.js");
const banco = await import("../dist/src/app/models/bancoDados.js");

banco.inicializarBancoCypher();
const db = new Database(process.env.CYPHER_DB_PATH);
const usuarioId = "teste-questionarios-profissionais";
db.prepare(
  `INSERT INTO usuarios (id, email, senha_hash)
  VALUES (?, ?, ?)`
).run(usuarioId, "questionarios@teste.local", "hash");

db.prepare(
  `INSERT INTO perfis (usuario_id, nome, funcao, identificador)
  VALUES (?, ?, ?, ?)`
).run(usuarioId, "Teste", "Rapper", "teste");

const profissoes = listarProfissoesCatalogo();
assert.equal(profissoes.length, 25);
for (const profissao of profissoes) {
  const perguntas = questionarios.catalogoPerguntasPorProfissao(profissao.id);
  assert.equal(
    perguntas.length,
    4,
    `${profissao.id} deve ter quatro perguntas`
  );
  assert.deepEqual(
    perguntas.map(pergunta => pergunta.eixo),
    [
      "tempoAtuacao",
      "etapaProjetos",
      "participacaoColetiva",
      "atividadePratica",
    ]
  );
  assert.equal(new Set(perguntas.map(pergunta => pergunta.campo)).size, 4);
  assert.ok(perguntas.every(pergunta => pergunta.profissaoId === profissao.id));
  assert.ok(perguntas.every(pergunta => pergunta.opcoes.length >= 4));
}

const rapper = {
  tempoAtuacao: "1-3a",
  etapaProjetos: "em-desenvolvimento",
  participacaoColetiva: "em-colaboracao",
  atividadePratica: "pratica-recorrente",
};
const mc = {
  tempoAtuacao: "<6m",
  etapaProjetos: "sem-projeto",
  participacaoColetiva: "nunca",
  atividadePratica: "aprendizado",
};
assert.deepEqual(
  questionarios.validarRespostasAtuacao("rapper", rapper, true),
  { valido: true, erros: [] }
);
assert.deepEqual(questionarios.validarRespostasAtuacao("mc", mc, true), {
  valido: true,
  erros: [],
});
assert.equal(
  questionarios.validarRespostasAtuacao(
    "rapper",
    { ...rapper, campoExtra: "x" },
    true
  ).valido,
  false
);
assert.equal(
  questionarios.validarRespostasAtuacao(
    "rapper",
    { ...rapper, etapaProjetos: "publicado-falso" },
    true
  ).valido,
  false
);

banco.salvarRespostasAtuacaoProfissaoCypher(usuarioId, "rapper", rapper, {
  tempoAtuacao: "privado",
});
banco.salvarRespostasAtuacaoProfissaoCypher(usuarioId, "mc", mc, {
  tempoAtuacao: "publico",
});
const respostas = banco.listarRespostasAtuacaoProfissaoCypher(usuarioId);
assert.deepEqual(
  respostas.map(item => item.profissaoId),
  ["mc", "rapper"]
);
assert.deepEqual(
  respostas.find(item => item.profissaoId === "rapper").respostas,
  rapper
);
assert.deepEqual(
  respostas.find(item => item.profissaoId === "mc").respostas,
  mc
);
assert.throws(
  () =>
    banco.salvarRespostasAtuacaoProfissaoCypher(usuarioId, "rapper", {
      ...rapper,
      perguntaEspecificaDeOutraProfissao: "x",
    }),
  /RESPOSTAS_ATUACAO_INVALIDAS/
);
assert.throws(
  () =>
    banco.salvarRespostasAtuacaoProfissaoCypher(
      "usuario-que-nao-existe",
      "rapper",
      rapper
    ),
  /USUARIO_NAO_ENCONTRADO/
);
assert.throws(
  () => banco.listarRespostasAtuacaoProfissaoCypher("usuario-que-nao-existe"),
  /USUARIO_NAO_ENCONTRADO/
);
assert.equal(db.pragma("user_version", { simple: true }), banco.versaoEsquema);
console.log(
  "OK: 25 profissões têm exatamente quatro eixos; respostas são validadas e isoladas por ID profissional."
);
