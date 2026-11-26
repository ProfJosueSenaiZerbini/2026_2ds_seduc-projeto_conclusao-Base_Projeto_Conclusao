import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

if (process.argv.length !== 3) {
  throw new Error("Uso: node scripts/preparar-banco-entrega.mjs <pasta-nova>");
}
const pasta = path.resolve(process.argv[2]);
fs.mkdirSync(pasta); // Nunca sobrescreve nem importa um banco existente.
process.env.CYPHER_DB_PATH = path.join(pasta, "cypher.sqlite");

const banco = await import("../dist/src/app/models/bancoDados.js");
const { semearCatalogoCena } = await import("../dist/src/app/models/catalogoCena.js");

banco.inicializarBancoCypher();
try {
  semearCatalogoCena({ gerarArte: false });
  const db = banco.conexaoInternaCypher();
  const version = db.pragma("user_version", { simple: true });
  assert.equal(version, banco.versaoEsquema);
  assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  const contar = t => db.prepare(`SELECT count(*) FROM "${t}"`).pluck().get();
  for (const t of ["administradores", "sessoes", "mensagens"])
    assert.equal(contar(t), 0, t);
  const estranhos = db.prepare(`
    SELECT count(*) FROM usuarios u WHERE NOT EXISTS (
      SELECT 1 FROM catalogo_cena c WHERE c.id = u.id AND c.tipo = 'perfil'
    )
  `).pluck().get();
  assert.equal(estranhos, 0, "A base deve conter apenas perfis da curadoria.");
  assert.equal(contar("eventos"), 9);
  const arquivos = db.prepare("SELECT id, bytes FROM beat_arquivos").all();
  assert.ok(arquivos.length > 0);
  for (const item of arquivos)
    assert.equal(fs.statSync(path.join(pasta, "arquivos-beats", item.id)).size, item.bytes);
  const objetos = db.prepare(`
    SELECT type, name, sql FROM sqlite_schema
    WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
    ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 WHEN 'view' THEN 2 ELSE 3 END, name
  `).all();
  const tabelas = objetos.filter(o => o.type === "table");
  fs.writeFileSync(path.join(pasta, "schema.sql"),
    `-- Esquema físico do pacote Cypher, versão ${version}. Não inclui dados.\nPRAGMA foreign_keys = ON;\nBEGIN;\n\n` +
    objetos.map(o => o.sql + ";").join("\n\n") + `\n\nPRAGMA user_version = ${version};\nCOMMIT;\n`);
  const linhas = tabelas.flatMap(({ name }) => [
    `### ${name}`, "", "| Campo | Tipo | PK (ordem) | NOT NULL declarado | Padrão |",
    "| --- | --- | --- | --- | --- |",
    ...db.pragma(`table_info("${name}")`).map(c =>
      `| \`${c.name}\` | ${c.type || "sem tipo"} | ${c.pk || "-"} | ${c.notnull ? "sim" : "não"} | ${String(c.dflt_value ?? "-").replaceAll("|", "\\|")} |`),
    "",
    ...db.pragma(`foreign_key_list("${name}")`).map(f =>
      `- FK ${f.id}.${f.seq}: \`${f.from}\` → \`${f.table}.${f.to ?? "(PK)"}\` (DELETE ${f.on_delete}; UPDATE ${f.on_update}).`),
    ""
  ]);
  const qtdFk = tabelas.reduce((n, { name }) =>
    n + new Set(db.pragma(`foreign_key_list("${name}")`).map(f => f.id)).size, 0);
  fs.writeFileSync(path.join(pasta, "Dicionario-de-Dados-v" + version + ".md"),
    [`# Dicionário de dados Cypher v${version}`, "",
      `Extração do banco gerado: ${tabelas.length} tabelas e ${qtdFk} chaves estrangeiras declaradas. Consulte também o schema.sql para CHECK, índices, gatilhos e demais restrições.`,
      "", ...linhas].join("\n"));
  console.log(JSON.stringify({
    versao: version, tabelas: tabelas.length, chavesEstrangeiras: qtdFk,
    perfis: contar("perfis"), obras: contar("obras"), eventos: contar("eventos"),
    beats: contar("beats"), arquivos: arquivos.length
  }, null, 2));
} finally {
  banco.fecharBancoCypher();
}
