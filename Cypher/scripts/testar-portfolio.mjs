import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-portfolio-"));
process.env.NODE_ENV = "test";
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
process.env.CYPHER_MEDIA_DIR = path.join(pasta, "midias");
const b = await import("../dist/src/app/models/bancoDados.js");
const m = await import("../dist/src/app/models/portfolio.js");
const projetos = await import("../dist/src/app/models/projetosTrabalho.js");
const identidade = await import("../dist/src/app/models/identidadeUsuario.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
let server;
let checks = 0;
const verificar = fn => {
  fn();
  checks++;
};
try {
  b.inicializarBancoCypher();
  let db = b.conexaoInternaCypher();
  function seed(id, tipo = "profissional") {
    b.criarContaCypher({
      id,
      email: id + "@test.example",
      senhaHash: "teste",
      tipoConta: tipo,
      nome: id,
      funcao: "Rapper",
      identificador: "@" + id,
      iniciais: "PP",
      categorias: tipo === "profissional" ? ["Rapper"] : [],
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
  }
  for (const id of ["autor", "fonte", "visitante"]) seed(id);
  seed("consumidor", "consumidor");
  db.prepare(
    "INSERT INTO usuarios(id,email,tipo_conta) VALUES('admin','admin@test.example','administrativo')"
  ).run();
  db.prepare(
    "INSERT INTO administradores(usuario_id,nome,papel) VALUES('admin','Admin','super_admin')"
  ).run();
  const obra = (id, owner = "autor", publicada = 1) =>
    db
      .prepare(
        "INSERT INTO obras(id,proprietario_id,titulo,tipo,situacao,funcao_principal,descricao,publicada) VALUES(?,?,?,'Música','','Voz','Descrição autorizada',?)"
      )
      .run(id, owner, "Título " + id, publicada);
  obra("propria");
  obra("reservada", "autor", 0);
  obra("participacao", "fonte");
  obra("mencao", "fonte");
  obra("alheia", "fonte");
  db.prepare(
    "INSERT INTO creditos(id,obra_id,usuario_creditado_id,nome_creditado,funcao,participacao,verificado) VALUES('credito','participacao','autor','autor','Mixagem','Mixagem final',1)"
  ).run();
  db.prepare(
    "INSERT INTO creditos(id,obra_id,usuario_creditado_id,nome_creditado,funcao,verificado) VALUES('mencao','mencao','autor','autor','Voz',0)"
  ).run();
  db.prepare(
    "INSERT INTO beats(id,produtor_id,titulo) VALUES('beat','autor','Beat do portfólio')"
  ).run();
  for (const [id, owner] of [
    ["evento", "autor"],
    ["convidado", "fonte"],
    ["interesse", "fonte"],
  ])
    db.prepare(
      "INSERT INTO eventos(id,proprietario_id,titulo,categoria) VALUES(?,?,?,'Show')"
    ).run(id, owner, "Evento " + id);
  db.prepare(
    "INSERT INTO interesses_eventos(id,evento_id,usuario_id,status) VALUES('convite','convidado','autor','confirmado')"
  ).run();
  db.prepare(
    "INSERT INTO interesses_eventos(id,evento_id,usuario_id,status) VALUES('interesse','interesse','autor','interessado')"
  ).run();
  const dadosProjeto = {
    titulo: "Projeto de trajetória",
    descricao: "Experiência profissional documentada.",
    modalidade: "projeto",
    profissoes: ["rapper"],
    papel: "Direção do projeto",
    direitos: "sim",
    publico: "sim",
    itens: "[]",
  };
  const projeto = projetos.salvarProjetoTrabalho("autor", dadosProjeto);
  const projetoPrivado = projetos.salvarProjetoTrabalho("autor", {
    ...dadosProjeto,
    titulo: "Projeto reservado",
    publico: "",
  });
  const candidatos = () => m.candidatosPortfolio("autor");
  verificar(() =>
    assert.equal(m.configuracaoPortfolio("autor").modo, "manual")
  );
  verificar(() =>
    assert.equal(Boolean(m.configuracaoPortfolio("autor").visivel), false)
  );
  verificar(() =>
    assert.equal(
      candidatos().find(i => i.chave === "obra:reservada")?.publicavel,
      false
    )
  );
  verificar(() =>
    assert.ok(
      candidatos().some(
        i =>
          i.chave === "obra:participacao" &&
          !i.proprio &&
          i.papel.includes("Mixagem")
      )
    )
  );
  verificar(() =>
    assert.ok(!candidatos().some(i => i.chave === "obra:mencao"))
  );
  verificar(() =>
    assert.ok(!candidatos().some(i => i.chave === "evento:interesse"))
  );
  verificar(() =>
    assert.ok(
      candidatos().some(i => i.chave === "evento:convidado" && !i.proprio)
    )
  );
  verificar(() =>
    assert.ok(candidatos().some(i => i.chave === "projeto:" + projeto))
  );
  verificar(() =>
    assert.equal(
      candidatos().find(i => i.chave === "projeto:" + projetoPrivado)
        ?.publicavel,
      false
    )
  );
  const escolhas = (config = {}) =>
    candidatos().map((i, n) => ({
      chave: i.chave,
      selecionado: false,
      oculto: false,
      destaque: false,
      ordem: n,
      secao: "",
      ...(config[i.chave] || {}),
    }));
  const dados = (itens, extras = {}) => ({
    modo: "manual",
    molde: "grade",
    visivel: "sim",
    itens: JSON.stringify(itens),
    ...extras,
  });
  const save = (itens, extras = {}) =>
    m.salvarPortfolio("autor", dados(itens, extras));
  const publica = () => m.montarPortfolio("autor", "visitante");
  const tem = chave => publica().itens.some(i => i.chave === chave);
  save(
    escolhas({
      "obra:propria": {
        selecionado: true,
        destaque: true,
        ordem: 0,
        secao: "Música autoral",
      },
      ["projeto:" + projeto]: {
        selecionado: true,
        ordem: 1,
        secao: "Experiências",
      },
      "obra:reservada": { selecionado: true },
      ["projeto:" + projetoPrivado]: { selecionado: true },
    })
  );
  verificar(() => assert.equal(publica().itens.length, 2));
  verificar(() => assert.ok(tem("obra:propria") && !tem("obra:reservada")));
  verificar(() => assert.ok(!tem("projeto:" + projetoPrivado)));
  verificar(() =>
    assert.ok(publica().grupos.some(g => g.nome === "Música autoral"))
  );
  verificar(() =>
    assert.equal(
      publica().itens.find(i => i.chave === "obra:propria").destaque,
      true
    )
  );
  verificar(() =>
    assert.equal(
      db.prepare("SELECT titulo FROM obras WHERE id='propria'").get().titulo,
      "Título propria"
    )
  );
  // Chaves de outros usuários não recebem edição nem entram na vitrine pelo payload.
  verificar(() =>
    assert.throws(() =>
      save([
        {
          chave: "obra:alheia",
          selecionado: true,
          oculto: false,
          destaque: false,
          ordem: 0,
          secao: "",
        },
      ])
    )
  );
  verificar(() =>
    assert.throws(() => m.salvarPortfolio("consumidor", dados([])))
  );
  verificar(() => assert.throws(() => m.salvarPortfolio("admin", dados([]))));
  verificar(() =>
    assert.throws(() => save([], { modo: "automatico-invalido" }))
  );
  verificar(() =>
    assert.throws(() => save([], { molde: "molde-inexistente" }))
  );
  // Prévia usa o rascunho sem alterar as preferências persistidas.
  const antes = JSON.stringify(m.configuracaoPortfolio("autor"));
  const preview = m.montarPortfolio(
    "autor",
    "autor",
    dados(escolhas({ "beat:beat": { selecionado: true } }), { molde: "lista" })
  );
  verificar(() => assert.ok(preview.itens.some(i => i.chave === "beat:beat")));
  verificar(() =>
    assert.ok(!preview.itens.some(i => i.chave === "obra:reservada"))
  );
  verificar(() =>
    assert.equal(JSON.stringify(m.configuracaoPortfolio("autor")), antes)
  );
  verificar(() => assert.ok(tem("obra:propria") && !tem("beat:beat")));
  // Os moldes trocam a apresentação, preservando origem e seleção.
  verificar(() => assert.ok(candidatos().findIndex(i=>i.chave==="obra:propria") < candidatos().findIndex(i=>i.chave==="projeto:"+projeto)));
  const manual = escolhas({
    "obra:propria": { selecionado: true },
    "obra:participacao": { selecionado: true },
  });
  for (const molde of ["grade", "editorial", "lista"]) {
    save(manual, { molde });
    verificar(() =>
      assert.deepEqual(
        publica()
          .itens.map(i => i.chave)
          .sort(),
        ["obra:participacao", "obra:propria"]
      )
    );
  }
  save(
    escolhas({
      "obra:propria": { oculto: true },
      "obra:participacao": { selecionado: true },
    }),
    { modo: "inteligente" }
  );
  verificar(() => assert.ok(!tem("obra:propria")));
  verificar(() =>
    assert.ok(
      tem("obra:participacao") && tem("beat:beat") && tem("projeto:" + projeto)
    )
  );
  verificar(() =>
    assert.ok(!tem("obra:reservada") && !tem("projeto:" + projetoPrivado))
  );
  obra("nova");
  verificar(() => assert.ok(tem("obra:nova")));
  db.prepare(
    "UPDATE obras SET titulo='Nova apresentação' WHERE id='nova'"
  ).run();
  verificar(() =>
    assert.equal(
      publica().itens.find(i => i.chave === "obra:nova").titulo,
      "Nova apresentação"
    )
  );
  const retirado = projetos.salvarProjetoTrabalho("autor", {
    ...dadosProjeto,
    titulo: "Projeto a retirar",
  });
  verificar(() => assert.ok(tem("projeto:" + retirado)));
  projetos.retirarProjeto("autor", retirado);
  verificar(() => assert.ok(!tem("projeto:" + retirado)));
  // Alternar modo e molde não deve reintroduzir ocultações já registradas.
  save([], { modo: "manual", molde: "editorial" });
  save([], { modo: "inteligente", molde: "lista" });
  verificar(() => assert.ok(!tem("obra:propria")));
  // Ocultação deve sobreviver mesmo quando o crédito some da lista por um período.
  save(
    [
      {
        chave: "obra:participacao",
        selecionado: true,
        oculto: true,
        destaque: false,
        ordem: 0,
        secao: "",
      },
    ],
    { modo: "inteligente" }
  );
  db.prepare("UPDATE creditos SET verificado=0 WHERE id='credito'").run();
  save([], { modo: "inteligente" });
  verificar(() => assert.ok(!tem("obra:participacao")));
  db.prepare("UPDATE creditos SET verificado=1 WHERE id='credito'").run();
  verificar(() => assert.ok(!tem("obra:participacao")));
  save(
    [
      {
        chave: "obra:participacao",
        selecionado: true,
        oculto: false,
        destaque: false,
        ordem: 0,
        secao: "Mixagens",
      },
    ],
    { modo: "inteligente" }
  );
  verificar(() => assert.ok(tem("obra:participacao")));
  db.prepare("UPDATE obras SET publicada=0 WHERE id='participacao'").run();
  verificar(() => assert.ok(!tem("obra:participacao")));
  db.prepare("UPDATE obras SET publicada=1 WHERE id='participacao'").run();
  db.prepare(
    "UPDATE perfis SET perfil_publico=0 WHERE usuario_id='fonte'"
  ).run();
  verificar(() => assert.ok(!tem("obra:participacao")));
  db.prepare(
    "UPDATE perfis SET perfil_publico=1 WHERE usuario_id='fonte'"
  ).run();
  db.prepare(
    "INSERT INTO bloqueios_usuarios(autor_id,alvo_id) VALUES('fonte','visitante')"
  ).run();
  verificar(() => assert.ok(!tem("obra:participacao")));
  db.prepare("DELETE FROM bloqueios_usuarios").run();
  db.prepare(
    "INSERT INTO restricoes_contas(usuario_id,motivo,administrador_id) VALUES('fonte','Teste de restrição','admin')"
  ).run();
  verificar(() => assert.ok(!tem("obra:participacao")));
  db.prepare("DELETE FROM restricoes_contas").run();
  db.prepare(
    "UPDATE interesses_eventos SET status='cancelado' WHERE id='convite'"
  ).run();
  verificar(() => assert.ok(!tem("evento:convidado")));
  db.prepare(
    "UPDATE interesses_eventos SET status='confirmado' WHERE id='convite'"
  ).run();
  db.prepare("UPDATE projetos_trabalho SET publico=0 WHERE id=?").run(projeto);
  verificar(() => assert.ok(!tem("projeto:" + projeto)));
  db.prepare("UPDATE projetos_trabalho SET publico=1 WHERE id=?").run(projeto);
  // Perfil e privacidade da vitrine não podem ser contornados pela URL.
  db.prepare(
    "UPDATE perfis SET perfil_publico=0 WHERE usuario_id='autor'"
  ).run();
  verificar(() => assert.throws(publica));
  db.prepare(
    "UPDATE perfis SET perfil_publico=1 WHERE usuario_id='autor'"
  ).run();
  db.prepare(
    "INSERT INTO bloqueios_usuarios(autor_id,alvo_id) VALUES('autor','visitante')"
  ).run();
  verificar(() => assert.throws(publica));
  db.prepare("DELETE FROM bloqueios_usuarios").run();
  db.prepare(
    "INSERT INTO restricoes_contas(usuario_id,motivo,administrador_id) VALUES('autor','Teste titular','admin')"
  ).run();
  verificar(() => assert.throws(publica));
  db.prepare("DELETE FROM restricoes_contas").run();
  save([], { modo: "inteligente", visivel: "" });
  verificar(() => assert.throws(publica));
  save([], { modo: "inteligente" });
  db.prepare(
    "UPDATE perfis SET identificador_alterado_em=datetime('now','-31 days') WHERE usuario_id='autor'"
  ).run();
  identidade.alterarIdentificadorUsuario("autor", "autor_novo", 30);
  verificar(() =>
    assert.equal(m.lerPortfolioPorHandle("autor", "visitante").id, "autor")
  );
  verificar(() =>
    assert.equal(
      m.lerPortfolioPorHandle("autor", "visitante").redirecionar,
      true
    )
  );
  verificar(() => assert.ok(!tem("obra:propria")));
  const cfg = JSON.stringify(m.configuracaoPortfolio("autor"));
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  verificar(() =>
    assert.equal(JSON.stringify(m.configuracaoPortfolio("autor")), cfg)
  );
  verificar(() => assert.ok(!tem("obra:propria")));
  // Servidor isolado com o router real, sessão, CSRF e views reais.
  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  app.locals.icones = new Proxy({}, { get: () => "<svg></svg>" });
  app.locals.rotuloProfissional = x => x;
  Object.assign(app.locals, identidade, await import("../dist/src/app/models/catalogoDemonstrativo.js"));
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
  const csrf = "b".repeat(64);
  const cookie = id =>
    "cypher_csrf=" +
    csrf +
    "; " +
    (id === "admin" ? "cypher_admin_session" : "cypher_session") +
    "=" +
    auth.iniciarSessao(id);
  const cookies = Object.fromEntries(
    ["autor", "visitante", "consumidor", "admin"].map(id => [id, cookie(id)])
  );
  const request = (url, id = "autor", op = {}) =>
    fetch(host + url, {
      redirect: "manual",
      ...op,
      headers: { cookie: cookies[id], ...(op.headers || {}) },
    });
  const post = (url, body, id = "autor") =>
    request(url, id, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-csrf-token": csrf,
      },
      body: new URLSearchParams(body),
    });
  for (const [url, id] of [
    ["/portfolio/edit", "autor"],
    ["/p/autor_novo", "visitante"],
    ["/portfolio/autor_novo", "visitante"],
    ["/portfolio/autor_novo/item/obra/participacao", "visitante"],
  ]) {
    const r = await request(url, id),
      html = await r.text();
    verificar(() =>
      assert.equal(r.status, 200, url + ": " + html.slice(0, 500))
    );
    verificar(() => assert.ok(!html.includes("[object Object]")));
    if(url==="/p/autor_novo") verificar(()=>assert.ok(html.includes('href="/portfolio/autor_novo"')));
  }
  const anon = await fetch(host + "/portfolio/autor_novo", {
    redirect: "manual",
  });
  verificar(() => assert.equal(anon.status, 302));
  const anonEditor = await fetch(host + "/portfolio/edit", {
    redirect: "manual",
  });
  verificar(() => assert.equal(anonEditor.status, 302));
  const consumerPublic = await request("/portfolio/autor_novo", "consumidor");
  verificar(() => assert.equal(consumerPublic.status, 200));
  const consumerEditor = await request("/portfolio/edit", "consumidor");
  verificar(() => assert.equal(consumerEditor.status, 403));
  const adminInternal = await request("/portfolio/edit", "admin");
  verificar(() => assert.equal(adminInternal.status, 302));
  const adminEditor = await request("/portfolio/edit", "admin", {
    headers: {
      cookie:
        "cypher_csrf=" +
        csrf +
        "; cypher_session=" +
        auth.iniciarSessao("admin"),
    },
  });
  verificar(() => assert.equal(adminEditor.status, 403));
  const noCsrf = await request("/portfolio/edit", "autor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dados([])),
  });
  verificar(() => assert.equal(noCsrf.status, 403));
  const idor = await post(
    "/portfolio/edit",
    dados([
      {
        chave: "obra:alheia",
        selecionado: true,
        oculto: false,
        destaque: false,
        ordem: 0,
        secao: "",
      },
    ])
  );
  verificar(() => assert.equal(idor.status, 400));
  const privateItem = await request(
    "/portfolio/autor_novo/item/obra/reservada",
    "visitante"
  );
  verificar(() => assert.equal(privateItem.status, 404));
  const hiddenItem = await request(
    "/portfolio/autor_novo/item/obra/propria",
    "visitante"
  );
  verificar(() => assert.equal(hiddenItem.status, 404));
  const oldHandle = await request("/portfolio/autor", "visitante");
  verificar(() => assert.equal(oldHandle.status, 308));
  verificar(() =>
    assert.match(oldHandle.headers.get("location"), /autor_novo/)
  );
  const beforeHttpPreview = JSON.stringify(m.configuracaoPortfolio("autor"));
  const httpPreview = await post(
    "/portfolio/preview",
    dados(escolhas({ "obra:nova": { selecionado: true } }), {
      modo: "manual",
      molde: "editorial",
    })
  );
  verificar(() => assert.equal(httpPreview.status, 200));
  verificar(() =>
    assert.equal(
      JSON.stringify(m.configuracaoPortfolio("autor")),
      beforeHttpPreview
    )
  );
  const sucesso = await post(
    "/portfolio/edit",
    dados(
      escolhas({
        "obra:participacao": { selecionado: true },
        "obra:nova": { selecionado: true },
      }),
      { modo: "manual", molde: "grade" }
    )
  );
  verificar(() => assert.equal(sucesso.status, 303));
  verificar(() =>
    assert.equal(m.configuracaoPortfolio("autor").modo, "manual")
  );
  db.prepare("UPDATE creditos SET verificado=0 WHERE id='credito'").run();
  const revoked = await request(
    "/portfolio/autor_novo/item/obra/participacao",
    "visitante"
  );
  verificar(() => assert.equal(revoked.status, 404));
  const totalBefore = db.prepare("SELECT count(*) n FROM obras").get().n;
  save(
    [
      {
        chave: "obra:nova",
        selecionado: false,
        oculto: true,
        destaque: false,
        ordem: 0,
        secao: "",
      },
    ],
    { modo: "inteligente" }
  );
  verificar(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM obras").get().n,
      totalBefore
    )
  );
  verificar(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  console.log(
    `Portfólio: ${checks} verificações passaram; seleção, modos, moldes, prévia, ocultações persistentes, fontes, bloqueios, privacidade, créditos e HTTP.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
