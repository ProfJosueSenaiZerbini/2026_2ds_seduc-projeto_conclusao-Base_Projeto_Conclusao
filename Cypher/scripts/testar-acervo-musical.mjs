import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";

const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-acervo-"));
const copia = path.join(raiz, "legado.sqlite");
const tabelas = [
  "obras",
  "creditos",
  "curtidas_obras",
  "atuacoes_obra",
  "itens_projeto",
  "portfolio_itens",
  "notificacoes",
];
const assinatura = db =>
  Object.fromEntries(
    tabelas
      .filter(tabela =>
        db
          .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
          .get(tabela)
      )
      .map(tabela => [
        tabela,
        createHash("sha256")
          .update(
            JSON.stringify(
              db.prepare(`SELECT * FROM ${tabela} ORDER BY rowid`).all()
            )
          )
          .digest("hex"),
      ])
  );
const banco = await import("../dist/src/app/models/bancoDados.js");
const acervo = await import("../dist/src/app/models/acervoMusical.js");

try {
  if (process.argv[2]) {
    const original = new Database(process.argv[2], {
      readonly: true,
      fileMustExist: true,
    });
    try {
      const antes = assinatura(original);
      await original.backup(copia);
      process.env.CYPHER_DB_PATH = copia;
      banco.inicializarBancoCypher();
      const db = banco.conexaoInternaCypher();
      assert.deepEqual(assinatura(db), antes);
      assert.deepEqual(db.pragma("foreign_key_check"), []);
      const contagens = Object.fromEntries(
        [
          "obras",
          "creditos",
          "composicoes",
          "fonogramas",
          "lancamentos",
          "faixas_lancamento",
          "evidencias_lancamento",
          "historico_lancamentos",
        ].map(tabela => [
          tabela,
          db.prepare(`SELECT count(*) FROM ${tabela}`).pluck().get(),
        ])
      );
      const faixas = db
        .prepare(
          "SELECT id,fonograma_id,lancamento_id,ordem FROM faixas_lancamento ORDER BY id"
        )
        .all();
      banco.fecharBancoCypher();
      banco.inicializarBancoCypher();
      assert.deepEqual(
        banco
          .conexaoInternaCypher()
          .prepare(
            "SELECT id,fonograma_id,lancamento_id,ordem FROM faixas_lancamento ORDER BY id"
          )
          .all(),
        faixas
      );
      banco.fecharBancoCypher();
      console.log(
        JSON.stringify({
          migracaoAcervo: contagens,
          colunasOriginaisPreservadas: Object.keys(antes),
        })
      );
    } finally {
      original.close();
    }
  }

  process.env.CYPHER_DB_PATH = path.join(raiz, "fluxos.sqlite");
  banco.inicializarBancoCypher();
  const db = banco.conexaoInternaCypher();
  for (const id of ["artista", "outro", "moderador"]) {
    banco.criarContaCypher({
      id,
      email: id + "@example.test",
      senhaHash: "fixture",
      tipoConta: "profissional",
      nome: id,
      funcao: "Rapper",
      identificador: "@" + id,
      iniciais: "AR",
      categorias: ["Rapper"],
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
  }
  const dados = (type, title, adicional = {}) => ({
    type,
    title,
    genre: "Rap",
    genreDetail: "",
    typeDetail: "",
    status: "",
    published: true,
    role: "Artista principal",
    roleDetail: "",
    description: "",
    lyrics: "",
    bpm: null,
    isrc: "",
    iswc: "",
    releaseDate: "",
    listenLink: "",
    acervo: { composicoes: [], faixas: [] },
    ...adicional,
  });
  const criar = (type, title, campos, autor = "artista") =>
    banco.criarObraCypher(autor, dados(type, title, campos), []);
  const composicao = criar("Composição", "Composição A", {
    iswc: "T0345246801",
    published: false,
  });
  const gravacao = criar("Fonograma", "Primeira gravação", {
    isrc: "BRABC2600001",
    acervo: { composicoes: [composicao], faixas: [] },
  });
  const segunda = criar("Fonograma", "Segunda gravação", {
    isrc: "BRABC2600002",
    acervo: { composicoes: [composicao], faixas: [] },
  });
  const [a, b] = [gravacao, segunda].map(id =>
    db.prepare("SELECT id FROM fonogramas WHERE obra_id=?").pluck().get(id)
  );
  const single = criar("Single", "Meu single", {
    acervo: { faixas: [a], composicoes: [] },
  });
  const album = criar("Álbum", "Meu álbum", {
    acervo: { faixas: [b, a], composicoes: [] },
  });
  assert.deepEqual(
    acervo.faixasDoLancamento(db, album).map(f => f.obraId),
    [segunda, gravacao]
  );
  assert.equal(acervo.faixasDoLancamento(db, single)[0].fonogramaId, a);
  assert.equal(
    acervo.fichaAcervo(db, raiz, gravacao, "outro").isrc,
    "BRABC2600001"
  );
  assert.deepEqual(
    acervo.fichaAcervo(db, raiz, gravacao, "outro").composicoes,
    []
  );
  assert.equal(
    acervo.fichaAcervo(db, raiz, composicao, "artista").iswc,
    "T0345246801"
  );
  assert.equal(banco.excluirObraCypher(gravacao, "artista"), false);
  assert.equal(banco.excluirObraCypher(composicao, "artista"), false);
  const gravacaoAlheia = criar("Fonograma", "Gravação alheia", {}, "outro");
  const alheio = db
    .prepare("SELECT id FROM fonogramas WHERE obra_id=?")
    .pluck()
    .get(gravacaoAlheia);
  assert.throws(
    () =>
      criar("EP", "Inválido", {
        acervo: { faixas: [alheio], composicoes: [] },
      }),
    acervo.ErroAcervo
  );
  assert.throws(
    () =>
      criar("EP", "Duplicado", { acervo: { faixas: [a, a], composicoes: [] } }),
    acervo.ErroAcervo
  );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) FROM obras WHERE titulo IN('Inválido','Duplicado')"
      )
      .pluck()
      .get(),
    0
  );
  const data = "2025-05-13";
  assert.equal(acervo.fichaAcervo(db, raiz, album, "outro").data, "");
  assert.throws(
    () =>
      acervo.enviarEvidencia(
        db,
        raiz,
        album,
        "artista",
        "audio",
        data,
        "",
        true
      ),
    acervo.ErroAcervo
  );
  assert.throws(
    () =>
      acervo.enviarEvidencia(
        db,
        raiz,
        album,
        "outro",
        "externa",
        data,
        "https://example.test/album",
        true
      ),
    acervo.ErroAcervo
  );
  acervo.enviarEvidencia(
    db,
    raiz,
    album,
    "artista",
    "externa",
    data,
    "https://example.test/album",
    true
  );
  assert.equal(acervo.fichaAcervo(db, raiz, album, "outro").data, "");
  const [registro] = acervo.filaEvidencias(db);
  assert.equal(
    acervo.revisarEvidencia(db, registro.id, "moderador", "confirmada"),
    true
  );
  assert.equal(
    acervo.revisarEvidencia(db, registro.id, "moderador", "recusada"),
    false
  );
  assert.equal(acervo.fichaAcervo(db, raiz, album, "outro").data, data);
  const faixas = acervo.faixasDoLancamento(db, album).map(f => f.id);
  banco.atualizarObraCypher(
    album,
    "artista",
    dados("Álbum", "Meu álbum", {
      acervo: { faixas: [a, b], composicoes: [] },
    }),
    []
  );
  assert.deepEqual(
    acervo.faixasDoLancamento(db, album).map(f => f.id),
    faixas.reverse()
  );
  assert.equal(acervo.fichaAcervo(db, raiz, album, "outro").data, "");
  assert.ok(
    acervo
      .historicoLancamento(db, album)
      .some(h => h.acao === "evidencia_revisada")
  );
  const midias = path.join(raiz, "midias-publicacoes");
  fs.mkdirSync(midias);
  fs.writeFileSync(path.join(midias, "audio-autorizado"), "media");
  db.prepare(
    `INSERT INTO midias_publicacoes(id,autor_id,objeto_tipo,objeto_id,finalidade,nome,mime,bytes,criado_em)
    VALUES('audio-autorizado','artista','obra',?,'audio','faixa.mp3','audio/mpeg',5,0)`
  ).run(gravacao);
  acervo.enviarEvidencia(db, raiz, single, "artista", "audio", data, "", true);
  assert.equal(acervo.fichaAcervo(db, raiz, single, "outro").data, data);
  db.prepare(
    "UPDATE midias_publicacoes SET retirada_em=1 WHERE id='audio-autorizado'"
  ).run();
  assert.equal(
    acervo.fichaAcervo(db, raiz, single, "outro").estado,
    "indisponivel"
  );
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  console.log(
    "Vínculos, reutilização, códigos, autorização, integridade, evidências e histórico verificados."
  );
} finally {
  banco.fecharBancoCypher();
  fs.rmSync(raiz, { recursive: true, force: true });
}
