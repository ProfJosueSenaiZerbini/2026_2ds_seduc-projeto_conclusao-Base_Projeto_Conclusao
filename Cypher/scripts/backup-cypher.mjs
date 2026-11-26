import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import Database from "better-sqlite3";

const pastas = ["arquivos-beats", "midias", "midias-publicacoes"];

async function arquivos(pasta, prefixo = "") {
  const lista = [];
  const diretorio = path.join(pasta, prefixo);
  for (const item of await fs.readdir(diretorio, { withFileTypes: true })) {
    const relativo = path.join(prefixo, item.name);
    if (item.isDirectory()) lista.push(...(await arquivos(pasta, relativo)));
    else if (item.isFile()) lista.push(relativo);
    else throw new Error("Tipo de arquivo não suportado no backup.");
  }
  return lista;
}

async function manifesto(pasta) {
  const nomes = ["cypher.sqlite"];
  for (const nome of pastas) {
    const existe = await fs.stat(path.join(pasta, nome)).catch(erro => {
      if (erro.code !== "ENOENT") throw erro;
      return null;
    });
    if (existe) nomes.push(...(await arquivos(pasta, nome)));
  }
  return Promise.all(
    nomes.sort().map(async nome => {
      const sha = createHash("sha256");
      for await (const bloco of createReadStream(path.join(pasta, nome)))
        sha.update(bloco);
      return {
        nome: nome.split(path.sep).join("/"),
        sha256: sha.digest("hex"),
      };
    })
  );
}

async function conferirBanco(arquivo) {
  const banco = new Database(arquivo, { readonly: true, fileMustExist: true });
  try {
    if (
      banco.pragma("integrity_check", { simple: true }) !== "ok" ||
      banco.pragma("foreign_key_check").length
    )
      throw new Error(
        "O banco da cópia falhou nas verificações de integridade."
      );
    let conferidos = 0;
    for (const [tabela, pasta, filtro] of [
      ["beat_arquivos", "arquivos-beats", ""],
      ["midias_trabalho", "midias", ""],
      ["midias_publicacoes", "midias-publicacoes", "WHERE retirada_em IS NULL"],
    ]) {
      if (
        !banco
          .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
          .get(tabela)
      )
        continue;
      for (const linha of banco
        .prepare(`SELECT id,bytes FROM ${tabela} ${filtro}`)
        .all()) {
        if (
          path.basename(linha.id) !== linha.id ||
          linha.id === "." ||
          linha.id === ".."
        )
          throw new Error("Identificador de arquivo inválido no banco.");
        const arquivoMidia = path.join(path.dirname(arquivo), pasta, linha.id);
        const info = await fs.lstat(arquivoMidia).catch(erro => {
          if (erro.code !== "ENOENT") throw erro;
          return null;
        });
        if (!info?.isFile() || info.size !== linha.bytes)
          throw new Error(
            `Uma referência em ${tabela} aponta para um arquivo ausente ou com tamanho divergente.`
          );
        conferidos++;
      }
    }
    return conferidos;
  } finally {
    banco.close();
  }
}

async function copiarPastas(origem, destino) {
  for (const nome of pastas) {
    const fonte = path.join(origem, nome);
    const pasta = await fs.lstat(fonte).catch(erro => {
      if (erro.code !== "ENOENT") throw erro;
      return null;
    });
    if (!pasta) continue;
    if (!pasta.isDirectory())
      throw new Error("A pasta de arquivos deve ser um diretório local.");
    await arquivos(origem, nome);
    await fs.cp(fonte, path.join(destino, nome), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  }
}

async function main() {
  const [acao, fonte, alvo] = process.argv.slice(2);
  if (!["criar", "restaurar"].includes(acao) || !fonte || !alvo)
    throw new Error(
      "Uso: node scripts/backup-cypher.mjs criar <sqlite> <nova-pasta> | restaurar <backup> <nova-pasta>"
    );
  const origem = path.resolve(fonte);
  const destino = path.resolve(alvo);
  if (acao === "restaurar") {
    const esperado = JSON.parse(
      await fs.readFile(path.join(origem, "manifesto.json"), "utf8")
    );
    if (JSON.stringify(esperado) !== JSON.stringify(await manifesto(origem)))
      throw new Error("Hashes do backup inválidos.");
    await conferirBanco(path.join(origem, "cypher.sqlite"));
    await fs.mkdir(destino);
    await fs.copyFile(
      path.join(origem, "cypher.sqlite"),
      path.join(destino, "cypher.sqlite")
    );
    await copiarPastas(origem, destino);
    const restaurado = await manifesto(destino);
    if (JSON.stringify(esperado) !== JSON.stringify(restaurado))
      throw new Error("Hashes da restauração inválidos.");
    const referencias = await conferirBanco(
      path.join(destino, "cypher.sqlite")
    );
    console.log(
      JSON.stringify({
        acao,
        arquivos: restaurado.length - 1,
        referencias,
        integridade: "ok",
      })
    );
    return;
  }
  const db = new Database(origem, { readonly: true, fileMustExist: true });
  try {
    await fs.mkdir(destino);
    await db.backup(path.join(destino, "cypher.sqlite"));
    await copiarPastas(path.dirname(origem), destino);
    const referencias = await conferirBanco(
      path.join(destino, "cypher.sqlite")
    );
    const arquivoManifesto = await manifesto(destino);
    await fs.writeFile(
      path.join(destino, "manifesto.json"),
      JSON.stringify(arquivoManifesto, null, 2)
    );
    console.log(
      JSON.stringify({
        acao,
        arquivos: arquivoManifesto.length - 1,
        referencias,
        integridade: "ok",
      })
    );
  } finally {
    db.close();
  }
}

await main();
