import { configurarNavegacaoTeste } from "./locais-navegacao-teste.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-trabalhos-"));
process.env.NODE_ENV = "test";
process.env.CYPHER_DB_PATH = path.join(dir, "teste.sqlite");
process.env.CYPHER_MEDIA_DIR = path.join(dir, "midias");
const b = await import("../dist/src/app/models/bancoDados.js");
const m = await import("../dist/src/app/models/projetosTrabalho.js");
const espaco = await import("../dist/src/app/models/espacoTrabalho.js");
const perfil = await import("../dist/src/app/models/modeloPerfil.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
let server;
try {
  b.inicializarBancoCypher();
  let db = b.conexaoInternaCypher();
  function seed(id, tipo = "profissional", categoria = "Fotógrafo(a)") {
    b.criarContaCypher({
      id,
      email: id + "@test.example",
      senhaHash: "teste",
      tipoConta: tipo,
      nome: id,
      funcao: categoria,
      identificador: "@" + id,
      iniciais: "TT",
      categorias: tipo === "profissional" ? [categoria] : [],
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
  }
  seed("foto");
  seed("outro");
  seed("ouvinte", "consumidor");
  const dados = (extra = {}) => ({
    titulo: "Ensaio da cena",
    descricao: "Ensaio fotográfico independente.",
    modalidade: "visual",
    profissoes: ["fotografo"],
    papel: "Fotografia",
    direitos: "sim",
    publico: "sim",
    itens: "[]",
    ...extra,
  });
  for (const p of perfil.profissoesCatalogo.filter(p => p.id !== "podcaster")) {
    seed("prof-" + p.id, "profissional", p.rotulo);
    assert.ok(
      m.salvarProjetoTrabalho(
        "prof-" + p.id,
        dados({ modalidade: "projeto", profissoes: [p.id] })
      )
    );
  }
  assert.throws(
    () => m.salvarProjetoTrabalho("ouvinte", dados()),
    /profissional/
  );
  assert.throws(
    () => m.salvarProjetoTrabalho("foto", dados({ modalidade: "danca" })),
    /compatível/
  );
  assert.throws(
    () => m.salvarProjetoTrabalho("foto", dados({ direitos: "" })),
    /autorização/
  );
  assert.throws(
    () => m.salvarProjetoTrabalho("foto", dados({ inicio: "2026-02-30" })),
    /datas/
  );
  const p = m.salvarProjetoTrabalho("foto", dados({ publico: "" }));
  assert.equal(m.podeVerProjeto("outro", p), false);
  assert.throws(
    () => m.salvarProjetoTrabalho("outro", dados(), p),
    /indisponível/
  );
  // Arquivo real: validação pelo conteúdo, não pela extensão recebida.
  const png = fs.readFileSync("public/img/descoberta/workshop-beatbox.png");
  const media = m.salvarMidia("foto", "ensaio.png", png);
  assert.throws(
    () =>
      m.salvarMidia(
        "foto",
        "falsa.png",
        Buffer.from('<svg onload="alert(1)"></svg>')
      ),
    /Formato/
  );
  assert.throws(
    () => m.salvarMidia("foto", "grande.png", Buffer.alloc(26 * 1024 * 1024)),
    /25 MB/
  );
  m.salvarProjetoTrabalho(
    "foto",
    dados({
      itens: JSON.stringify([
        { tipo: "midia", origem_id: media.id, legenda: "Ensaio" },
      ]),
    }),
    p
  );
  assert.equal(m.podeVerProjeto("outro", p), true);
  assert.throws(() => m.midiaAutorizada("outro", media.id), /indisponível/);
  m.salvarProjetoTrabalho(
    "foto",
    dados({
      itens: JSON.stringify([
        {
          tipo: "midia",
          origem_id: media.id,
          legenda: "Ensaio",
          publico: "sim",
        },
      ]),
    }),
    p
  );
  assert.equal(m.midiaAutorizada("outro", media.id).id, media.id);
  assert.throws(() => m.alterarVisibilidadeMidia("outro", media.id, false));
  assert.throws(
    () =>
      m.salvarProjetoTrabalho(
        "outro",
        dados({
          itens: JSON.stringify([{ tipo: "midia", origem_id: media.id }]),
        })
      ),
    /indisponível/
  );
  const colecao = m.salvarProjetoTrabalho(
    "foto",
    dados({
      itens: JSON.stringify([
        { tipo: "projeto", origem_id: p },
        { tipo: "midia", origem_id: media.id },
      ]),
    })
  );
  assert.throws(
    () =>
      m.salvarProjetoTrabalho(
        "foto",
        dados({
          itens: JSON.stringify([{ tipo: "projeto", origem_id: colecao }]),
        }),
        p
      ),
    /indiretamente/
  );
  assert.throws(() => m.excluirMidia("foto", media.id), /coleções/);
  assert.throws(
    () =>
      m.salvarProjetoTrabalho(
        "foto",
        dados({
          itens: JSON.stringify([
            { tipo: "link", origem_id: "javascript:alert(1)" },
          ]),
        })
      ),
    /HTTPS/
  );
  db.prepare(
    "INSERT INTO bloqueios_usuarios(autor_id,alvo_id) VALUES(?,?)"
  ).run("foto", "outro");
  assert.equal(m.podeVerProjeto("outro", p), false);
  assert.throws(() => m.midiaAutorizada("outro", media.id));
  db.prepare("DELETE FROM bloqueios_usuarios").run();
  // Mudança de visibilidade da origem é propagada a coleções e à URL do arquivo.
  m.salvarProjetoTrabalho(
    "foto",
    dados({
      publico: "",
      itens: JSON.stringify([{ tipo: "midia", origem_id: media.id }]),
    }),
    p
  );
  assert.equal(
    m.projetoTrabalho("outro", colecao).itens.some(i => i.tipo === "projeto"),
    false
  );
  // Coleção pública que referencia diretamente arquivo compartilhável ainda o autoriza.
  assert.equal(m.midiaAutorizada("outro", media.id).id, media.id);
  m.alterarVisibilidadeMidia("foto", media.id, false);
  assert.throws(() => m.midiaAutorizada("outro", media.id));
  db.prepare(
    "UPDATE profissoes_usuario SET estado='inativa' WHERE usuario_id='foto'"
  ).run();
  m.salvarProjetoTrabalho("foto", dados(), p); // Manutenção da atuação histórica.
  assert.throws(() => m.salvarProjetoTrabalho("foto", dados()), /compatível/);
  const token = auth.iniciarSessao("foto"),
    u = auth.usuarioDaSessao(token);
  assert.ok(espaco.trabalhosDaConta(u).some(t => t.id === p));
  // Reabertura verifica persistência e inicialização idempotente sobre base existente.
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  assert.equal(m.projetoTrabalho("foto", p).titulo, "Ensaio da cena");
  db.prepare("UPDATE profissoes_usuario SET estado='ativa' WHERE usuario_id='foto'").run();
  const app = express();
  await configurarNavegacaoTeste(app);
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  app.locals.icones = new Proxy({}, { get: () => "<svg></svg>" });
  app.locals.rotuloProfissional = x => x;
  Object.assign(
    app.locals,
    await import("../dist/src/app/models/identidadeUsuario.js")
  );
  const { protegerEscrita } =
    await import("../dist/src/app/middlewares/seguranca.js");
  const { default: routes } =
    await import("../dist/src/app/routes/rotasCypher.js");
  app.use(
    express.urlencoded({ extended: true }),
    express.json(),
    protegerEscrita,
    routes
  );
  app.use((err, req, res, next) =>
    res.status(err.status || 500).send(err.message)
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise(r => server.once("listening", r));
  const host = "http://127.0.0.1:" + server.address().port;
  const csrf = "a".repeat(64);
  const cookies = id =>
    "cypher_csrf=" + csrf + "; cypher_session=" + auth.iniciarSessao(id);
  const foto = cookies("foto"),
    outro = cookies("outro"),
    ouvinte = cookies("ouvinte");
  for (const url of [
    "/work-projects",
    "/work-projects/new",
    "/work-projects/" + p,
    "/work-projects/" + p + "/edit",
    "/espaco-de-trabalho?modalidade=projeto",
  ]) {
    const r = await fetch(host + url, {
      headers: { cookie: foto },
      redirect: "manual",
    });
    const html = await r.text();
    assert.equal(r.status, 200, url + ": " + html.slice(0, 400));
    assert.ok(!html.includes("[object Object]"));
    if (process.env.CYPHER_QA_OUTPUT) {
      const dir = path.resolve(process.env.CYPHER_QA_OUTPUT);
      fs.mkdirSync(dir, { recursive: true });
      const { pathToFileURL } = await import("node:url");
      const raiz = pathToFileURL(path.resolve("public")).href + "/";
      const nome = url.endsWith("/new")
        ? "formulario"
        : url.includes("/edit")
          ? "edicao"
          : url.includes("espaco-de-trabalho")
            ? "espaco"
            : url === "/work-projects"
              ? "lista"
              : "ficha";
      fs.writeFileSync(
        path.join(dir, nome + ".html"),
        html
          .replaceAll('href="/css/', 'href="' + raiz + "css/")
          .replaceAll('src="/js/', 'src="' + raiz + "js/")
          .replace(
            "const temaConta =",
            'localStorage.setItem("cypher-tema","dark"); const temaConta ='
          )
      );
    }
  }
  assert.equal(
    (await fetch(host + "/work-projects/new", { headers: { cookie: ouvinte } }))
      .status,
    403
  );
  assert.equal(
    (
      await fetch(host + "/work-projects/" + p + "/edit", {
        headers: { cookie: outro },
      })
    ).status,
    404
  );
  assert.equal(
    (
      await fetch(host + "/work-media/" + media.id, {
        headers: { cookie: outro },
      })
    ).status,
    404
  );
  assert.equal(
    (await fetch(host + "/work-media/" + media.id, { redirect: "manual" }))
      .status,
    302
  );
  assert.equal(
    (
      await fetch(host + "/work-media/" + media.id, {
        headers: { cookie: foto },
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(host + "/work-projects", {
        method: "POST",
        headers: { cookie: foto, "content-type": "application/json" },
        body: JSON.stringify(dados()),
      })
    ).status,
    403
  );
  const upload = await fetch(host + "/work-media", {
    method: "POST",
    headers: {
      cookie: outro,
      "content-type": "application/octet-stream",
      "x-csrf-token": csrf,
      "x-file-name": "teste.png",
    },
    body: png,
  });
  assert.equal(upload.status, 201);
  assert.ok((await upload.json()).id);
  const invalido = await fetch(host + "/work-projects/" + p + "/edit", {
    method: "POST",
    headers: {
      cookie: foto,
      "content-type": "application/x-www-form-urlencoded",
      "x-csrf-token": csrf,
    },
    body: new URLSearchParams({ ...dados(), titulo: "" }),
  });
  assert.equal(invalido.status, 400);
  assert.match(await invalido.text(), /Apresente seu trabalho/);
  m.retirarProjeto("foto", p);
  assert.equal(m.podeVerProjeto("foto", p), false);
  assert.ok(fs.existsSync(path.join(m.pastaMidias(), media.id)));
  m.salvarProjetoTrabalho("foto", dados({ itens: "[]" }), colecao);
  m.excluirMidia("foto", media.id);
  assert.equal(fs.existsSync(path.join(m.pastaMidias(), media.id)), false);
  // Exclusão após remoção de vínculos; histórico do projeto preservado.
  assert.ok(
    db.prepare("SELECT count(*) n FROM historico_projetos").get().n > 0
  );
  console.log(
    "OK: 25 profissões, projetos/galerias, persistência, ciclos, acervo, permissões, privacidade, CSRF e renderização HTTP."
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
