import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import ejs from "ejs";
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-oportunidades-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
const banco = await import("../dist/src/app/models/bancoDados.js");
const m = await import("../dist/src/app/models/oportunidades.js");
const contato = await import("../dist/src/app/models/contatosOportunidades.js");
const v = await import("../dist/src/app/validators/validarOportunidade.js");
const iconesSvg = await import("lucide-static");
const { iniciarSessao } =
  await import("../dist/src/app/models/autenticacaoCypher.js");
let server;
let checks = 0;
const ok = fn => {
  fn();
  checks++;
};
function seed(id, tipo = "profissional", categoria = "Rapper") {
  banco.criarContaCypher({
    id,
    email: `${id}@example.test`,
    senhaHash: "teste",
    tipoConta: tipo,
    nome: id,
    funcao: categoria,
    identificador: "@" + id,
    iniciais: "TT",
    categorias: tipo === "profissional" ? [categoria] : [],
    outraCategoria: "",
  });
  const db = banco.conexaoInternaCypher();
  db.prepare(
    "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
  ).run(id);
  db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
}
const dados = (vagas = 2) => ({
  titulo: "Produção de um lançamento",
  tipo: "servico",
  descricao: "Procuro profissional para um projeto autoral.",
  contexto: "Projeto real da equipe",
  modalidade: "remoto",
  remuneracao: "remunerada",
  valor: "1500",
  unidade: "projeto",
  condicoes: "Entrega em duas etapas",
  funcoes: [
    {
      profissao_id: "rapper",
      vagas,
      responsabilidades: "Gravar versos",
      requisitos: "Gravação própria",
      desejaveis: "Experiência em estúdio",
    },
  ],
});
try {
  banco.inicializarBancoCypher();
  let db = banco.conexaoInternaCypher();
  for (const id of ["autor", "candidato", "terceiro", "extra"]) seed(id);
  seed("ouvinte", "consumidor");
  seed("incompativel", "profissional", "Fotógrafo(a)");
  seed("legado", "profissional", "Rapper");
  db.prepare("UPDATE profissoes_usuario SET profissao_id='podcaster',valor_original='Podcaster' WHERE usuario_id='legado'").run();
  for (const [id, papel] of [
    ["admin", "moderador"],
    ["editor", "editor"],
  ]) {
    db.prepare(
      "INSERT INTO usuarios(id,tipo_conta) VALUES(?,'administrativo')"
    ).run(id);
    db.prepare(
      "INSERT INTO administradores(usuario_id,nome,papel) VALUES(?,?,?)"
    ).run(id, id, papel);
  }
  ok(() => assert.equal(v.profissoesOportunidade.length, 25));
  for (const campo of ["tipo", "modalidade", "remuneracao"])
    ok(() => assert.throws(() => m.salvarChamada("autor", { ...dados(), [campo]: "constructor" }), e => e.status === 400));
  ok(() => assert.throws(() => m.salvarChamada("ouvinte", dados())));
  ok(() => assert.throws(() => m.salvarChamada("legado", dados())));
  for (const p of v.profissoesOportunidade) {
    seed("p-" + p.id, "profissional", p.rotulo);
    ok(() =>
      assert.ok(m.salvarChamada("p-" + p.id, { ...dados(), acao: "rascunho" }))
    );
  }
  ok(() =>
    assert.throws(() => m.salvarChamada("autor", { ...dados(), titulo: "" }))
  );
  ok(() =>
    assert.throws(() => m.salvarChamada("autor", { ...dados(), valor: "-1" }))
  );
  const envio={...dados(),submissao:'teste-idempotencia-12345',acao:'rascunho'};
  ok(()=>assert.equal(m.salvarChamada('autor',envio),m.salvarChamada('autor',envio)));
  const envioPedido={...dados(),submissao:'teste-pedido-idempotente'};
  ok(()=>assert.equal(contato.solicitarPedido('ouvinte',envioPedido),contato.solicitarPedido('ouvinte',envioPedido)));
  const draft = m.salvarChamada("autor", { ...dados(), acao: "rascunho" });
  ok(() => assert.equal(m.ficha(draft, "autor").estado, "rascunho"));
  ok(() => assert.throws(() => m.ficha(draft, "terceiro")));
  m.mudarEstado("autor", draft, "aberta");
  const id = draft;
  ok(() =>
    assert.throws(() =>
      m.salvarChamada("terceiro", { ...dados(), revisao: 2 }, id)
    )
  );
  const o = m.ficha(id, "autor");
  m.salvarChamada(
    "autor",
    { ...dados(), titulo: "Chamada revisada", revisao: o.revisao },
    id
  );
  ok(() =>
    assert.throws(() =>
      m.salvarChamada("autor", { ...dados(), revisao: o.revisao }, id)
    )
  );
  const body = {
    funcao_id: m.ficha(id, "autor").funcoes[0].id,
    requisitos: "sim",
    apresentacao: "Quero participar.",
  };
  ok(() => assert.throws(() => m.candidatar("autor", id, body)));
  ok(() => assert.throws(() => m.candidatar("ouvinte", id, body)));
  ok(() => assert.throws(() => m.candidatar("incompativel", id, body)));
  m.mudarEstado("autor", id, "pausada");
  ok(() => assert.throws(() => m.candidatar("candidato", id, body)));
  m.mudarEstado("autor", id, "aberta");
  const c = m.candidatar("candidato", id, body);
  ok(() => assert.equal(m.candidatar("candidato", id, body), c));
  ok(() => assert.throws(() => m.candidatura(c, "terceiro")));
  m.decidirCandidatura("autor", c, "analise");
  m.decidirCandidatura("autor", c, "selecionada");
  const termos = {
    responsabilidades: "Gravar versos",
    entregas: "Duas faixas",
    prazos: "Trinta dias",
    remuneracao: "R$ 1.500 pelo projeto",
    condicoes: "Revisão incluída",
    versao_base: 0,
  };
  const p1 = m.propor("autor", c, termos);
  m.responderProposta("autor", c, p1, "aceitar");
  ok(() => assert.equal(m.candidatura(c, "autor").acordo, undefined));
  const p2 = m.propor("candidato", c, {
    ...termos,
    versao_base: 1,
    entregas: "Uma faixa",
  });
  ok(() => assert.throws(() => m.responderProposta("autor", c, p1, "aceitar")));
  ok(() =>
    assert.equal(m.candidatura(c, "autor").propostas[0].aceites.length, 0)
  );
  m.responderProposta("candidato", c, p2, "aceitar");
  const a = m.responderProposta("autor", c, p2, "aceitar");
  ok(() => assert.ok(a));
  ok(() => assert.equal(m.responderProposta("autor", c, p2, "aceitar"), a));
  ok(() => assert.equal(m.ficha(id, "autor").ocupadas, 1));
  const c2 = m.candidatar("terceiro", id, body),
    c3 = m.candidatar("extra", id, body);
  for (const cid of [c2, c3]) m.decidirCandidatura("autor", cid, "selecionada");
  const p3 = m.propor("autor", c2, termos),
    p4 = m.propor("autor", c3, termos);
  m.responderProposta("autor", c2, p3, "aceitar");
  m.responderProposta("autor", c3, p4, "aceitar");
  m.responderProposta("terceiro", c2, p3, "aceitar");
  ok(() => assert.equal(m.ficha(id, "autor").estado, "encerrada"));
  ok(() =>
    assert.throws(() => m.responderProposta("extra", c3, p4, "aceitar"))
  );
  ok(() => assert.equal(m.ficha(id, "autor").ocupadas, 2));
  m.desistirAcordo("candidato", c, "Disponibilidade mudou");
  ok(() => assert.equal(m.ficha(id, "autor").ocupadas, 2));
  m.desistirAcordo("autor", c, "De acordo");
  ok(() => assert.equal(m.ficha(id, "autor").ocupadas, 1));
  m.mudarEstado("autor", id, "aberta");
  const conv = m.candidatura(c, "autor").conversa.id;
  contato.enviarMensagem(
    "autor",
    conv,
    "Histórico privado",
    "mensagem-test-123456"
  );
  contato.enviarMensagem(
    "autor",
    conv,
    "Histórico privado",
    "mensagem-test-123456"
  );
  ok(() =>
    assert.equal(contato.conversa(conv, "candidato").mensagens.length, 1)
  );
  ok(() => assert.throws(() => contato.conversa(conv, "admin")));
  contato.bloquear("candidato", "autor", true);
  ok(() =>
    assert.throws(() =>
      contato.enviarMensagem("autor", conv, "Bloqueada", "mensagem-test-987654")
    )
  );
  ok(() =>
    assert.equal(contato.conversa(conv, "candidato").mensagens.length, 1)
  );
  contato.bloquear("candidato", "autor", false);
  ok(() =>
    assert.throws(() =>
      contato.pedirMediacao("ouvinte", "autor", "Olá", "mediacao-test-12345")
    )
  );
  contato.preferenciasContato("autor", {
    profissionais: "sim",
    consumidores: "sim",
  });
  ok(() =>
    assert.ok(
      contato.pedirMediacao(
        "ouvinte",
        "autor",
        "Preciso de mediação",
        "mediacao-test-12345"
      )
    )
  );
  const ped = contato.solicitarPedido("ouvinte", dados(1));
  ok(() =>
    assert.throws(() =>
      contato.revisarPedido("editor", ped, "aprovado", "Relevante")
    )
  );
  contato.revisarPedido("admin", ped, "esclarecimento", "Explique o escopo");
  contato.responderPedido("ouvinte", ped, "Gravação para campanha");
  const ep = contato.revisarPedido(
    "admin",
    ped,
    "aprovado",
    "Pedido pertinente"
  );
  ok(() => assert.equal(m.conta("ouvinte").tipo_conta, "consumidor"));
  ok(() => assert.throws(() => m.mudarEstado("ouvinte", ep, "pausada")));
  ok(() => assert.ok(contato.pedido(ped, "ouvinte").publicacao));
  ok(() =>
    assert.throws(() =>
      contato.revisarPedido("admin", ped, "aprovado", "Repetição")
    )
  );
  const ped2 = contato.solicitarPedido("ouvinte", dados());
  contato.revisarPedido(
    "admin",
    ped2,
    "recusado",
    "Faltam condições pertinentes"
  );
  ok(() => assert.equal(contato.pedido(ped2, "ouvinte").publicacao, undefined));
  const exp = m.salvarChamada("autor", dados());
  db.prepare(
    "UPDATE oportunidades_profissionais SET prazo='2000-01-01' WHERE id=?"
  ).run(exp);
  ok(() => assert.equal(m.ficha(exp, "autor").estado, "expirada"));
  const retir = m.salvarChamada("autor", dados()),
    rc = m.candidatar("candidato", retir, {
      ...body,
      funcao_id: m.ficha(retir, "autor").funcoes[0].id,
    });
  m.decidirCandidatura("candidato", rc, "retirada");
  ok(() =>
    assert.throws(() => m.decidirCandidatura("autor", rc, "selecionada"))
  );
  const projeto = contato.criarProjeto("autor", {
    titulo: "Projeto teste",
    descricao: "Contexto",
    publico: "sim",
  });
  ok(() =>
    assert.ok(m.salvarChamada("autor", { ...dados(), projeto_id: projeto }))
  );
  ok(() =>
    assert.throws(() =>
      m.salvarChamada("terceiro", { ...dados(), projeto_id: projeto })
    )
  );
  const evento = "evento-teste";
  db.prepare(
    "INSERT INTO eventos(id,proprietario_id,titulo,categoria,data_texto,local) VALUES(?,?,'Evento teste','Show','2030-01-01','Local')"
  ).run(evento, "autor");
  ok(() =>
    assert.ok(m.salvarChamada("autor", { ...dados(), evento_id: evento }))
  );
  ok(() =>
    assert.throws(() =>
      m.salvarChamada("terceiro", { ...dados(), evento_id: evento })
    )
  );
  ok(() =>
    assert.equal(m.listar("ouvinte", { q: "inexistente-absoluto" }).total, 0)
  );
  ok(() =>
    assert.ok(
      m.listar("ouvinte", {
        modalidade: "remoto",
        profissao: "rapper",
        unidade: "projeto",
        min: "1000",
        max: "2000",
      }).total > 0
    )
  );
  db.prepare(
    "INSERT INTO restricoes_contas(usuario_id,motivo,administrador_id) VALUES('extra','Teste','admin')"
  ).run();
  ok(() => assert.throws(() => m.listar("extra", {})));
  db.prepare("DELETE FROM restricoes_contas WHERE usuario_id='extra'").run();
  db.prepare(
    "UPDATE usuarios SET email_confirmado_em=NULL WHERE id='extra'"
  ).run();
  ok(() => assert.throws(() => m.listar("extra", {})));
  db.prepare(
    "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id='extra'"
  ).run();
  m.mudarEstado("autor", id, "cancelada");
  ok(() =>
    assert.equal(m.candidatura(c2, "autor").acordo.estado, "confirmado")
  );
  // Direitos anteriores permanecem acessíveis às partes quando a exposição/contato muda.
  db.prepare("UPDATE perfis SET perfil_publico=0 WHERE usuario_id='autor'").run();
  contato.bloquear("autor", "terceiro", true);
  ok(() => assert.equal(m.candidatura(c2, "terceiro").acordo.estado, "confirmado"));
  ok(() => assert.ok(m.listar("terceiro", {}, "candidaturas").itens.some(o => o.id === id)));
  ok(() => assert.throws(() => m.ficha(id, "incompativel"), e => e.status === 404));
  contato.bloquear("autor", "terceiro", false);
  db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id='autor'").run();
  // RN-034: retirar a última profissão não deve impedir a gestão histórica.
  seed("gestor-antigo");
  const antiga = m.salvarChamada("gestor-antigo", dados());
  db.prepare("UPDATE profissoes_usuario SET estado='inativa' WHERE usuario_id='gestor-antigo'").run();
  ok(() => assert.equal(m.listar("gestor-antigo", {}, "minhas").total, 1));
  const antes = m.ficha(antiga, "gestor-antigo");
  ok(() => assert.equal(m.salvarChamada("gestor-antigo", { ...dados(), revisao: antes.revisao, titulo: "Condições históricas atualizadas" }, antiga), antiga));
  m.mudarEstado("gestor-antigo", antiga, "encerrada");
  ok(() => assert.equal(m.ficha(antiga, "gestor-antigo").estado, "encerrada"));
  ok(() => assert.throws(() => m.salvarChamada("gestor-antigo", dados()), e => e.status === 403));
  ok(() => assert.throws(() => m.candidatar("gestor-antigo", retir, { ...body, funcao_id: m.ficha(retir, "autor").funcoes[0].id }), e => e.status === 403));
  // Uma medida de contato também deve impedir seleção e aceite, sem destruir as versões anteriores.
  const restrita = m.salvarChamada("autor", dados());
  const restritaC = m.candidatar("candidato", restrita, { ...body, funcao_id: m.ficha(restrita, "autor").funcoes[0].id });
  db.prepare("INSERT INTO suporte_casos(id,solicitante_id,tipo,assunto,descricao,criada_em,atualizada_em,chave_envio,hash_payload) VALUES('caso-oportunidade','candidato','denuncia','Contato indevido','Relato para verificar medida.',?,?, 'oportunidade-medida','teste')").run(Date.now(),Date.now());
  const medida = (mid, acao, tipo, alvo) => db.prepare("INSERT INTO suporte_medidas(id,caso_id,autor_id,acao,alvo_tipo,alvo_id,motivo,criada_em) VALUES(?,'caso-oportunidade','admin',?,?,?,'Medida de revisão de segurança',?)").run(mid,acao,tipo,alvo,Date.now());
  medida("contato-autor", "restringir_contato", "perfil", "autor");
  ok(() => assert.throws(() => m.decidirCandidatura("autor", restritaC, "selecionada"), e => e.status === 403));
  db.prepare("UPDATE suporte_medidas SET revogada_em=? WHERE id='contato-autor'").run(Date.now());
  m.decidirCandidatura("autor", restritaC, "selecionada");
  const restritaP = m.propor("autor", restritaC, termos);
  m.responderProposta("autor", restritaC, restritaP, "aceitar");
  medida("contato-candidato", "restringir_contato", "perfil", "candidato");
  ok(() => assert.throws(() => m.responderProposta("candidato", restritaC, restritaP, "aceitar"), e => e.status === 403));
  ok(() => assert.equal(m.candidatura(restritaC, "candidato").propostas[0].aceites.length, 1));
  ok(() => assert.equal(contato.conversa(m.candidatura(restritaC,"candidato").conversa.id,"candidato").envioPermitido, false));
  m.mudarEstado("autor", restrita, "cancelada");
  m.responderProposta("candidato", restritaC, restritaP, "recusar");
  ok(() => assert.equal(m.candidatura(restritaC, "candidato").estado, "recusada"));
  db.prepare("UPDATE suporte_medidas SET revogada_em=? WHERE id='contato-candidato'").run(Date.now());
  medida("projeto-oculto", "ocultar", "projeto", projeto);
  const vinculada = m.salvarChamada("autor", { ...dados(), evento_id: evento });
  medida("evento-oculto", "ocultar", "evento", evento);
  ok(() => assert.equal(m.ficha(vinculada, "candidato").evento, null));
  ok(() => assert.throws(() => m.salvarChamada("autor", { ...dados(), projeto_id: projeto })));
  ok(() => assert.throws(() => m.salvarChamada("autor", { ...dados(), evento_id: evento })));
  db.prepare("UPDATE suporte_medidas SET revogada_em=? WHERE id IN('evento-oculto','projeto-oculto')").run(Date.now());
  medida("chamada-oculta", "ocultar", "oportunidade", restrita);
  ok(() => assert.throws(() => m.candidatura(restritaC, "candidato"), e => e.status === 404));
  seed("menor-a"); seed("menor-b");
  const nascimentoMenor = new Date(); nascimentoMenor.setUTCFullYear(nascimentoMenor.getUTCFullYear()-17);
  db.prepare("UPDATE perfis SET nascimento=? WHERE usuario_id IN('menor-a','menor-b')").run(nascimentoMenor.toISOString().slice(0,10));
  for (const [cid,a,b] of [["conversa-etaria-adulto","menor-a","autor"],["conversa-etaria-pares","menor-a","menor-b"]])
    db.prepare("INSERT INTO conversas(id,participante_a,participante_b,contexto) VALUES(?,?,?,'Contato de teste')").run(cid,a,b);
  ok(() => assert.throws(() => contato.enviarMensagem("menor-a", "conversa-etaria-adulto", "Olá", "contato-menor-adulto-123"), e => e.status === 403));
  ok(() => assert.equal(contato.conversa("conversa-etaria-adulto","menor-a").envioPermitido,false));
  contato.enviarMensagem("menor-a", "conversa-etaria-pares", "Conversa entre pares", "contato-menores-pares-123");
  ok(() => assert.equal(contato.conversa("conversa-etaria-pares","menor-b").mensagens.length,1));
  banco.fecharBancoCypher();
  banco.inicializarBancoCypher();
  db = banco.conexaoInternaCypher();
  ok(() => assert.equal(contato.conversa(conv, "autor").mensagens.length, 1));
  ok(() =>
    assert.equal(m.candidatura(c2, "autor").acordo.estado, "confirmado")
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  const { default: routes } =
    await import("../dist/src/app/routes/rotasCypher.js");
  const { protegerEscrita } =
    await import("../dist/src/app/middlewares/seguranca.js");
  const app = express();
  app.use("/css", express.static("public/css"));
  app.use("/js", express.static("public/js"));
  app.use("/img", express.static("public/img"));
  app.use("/qa", express.static("artifacts/opportunities-qa"));
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  app.locals.icones = new Proxy(
    {},
    {
      get: (_, k) =>
        iconesSvg[
          {
            briefcase: "BriefcaseBusiness",
            menu: "Menu",
            check: "Check",
            plus: "Plus",
            search: "Search",
            sliders: "SlidersHorizontal",
            crown: "Crown",
            house: "House",
            music: "Music",
            headphones: "Headphones",
            calendarDays: "CalendarDays",
            bell: "Bell",
            sun: "Sun",
            moon: "Moon",
            users: "UsersRound",
            user: "UserRound",
            x: "X",
            settings: "Settings",
            circleHelp: "CircleHelp",
            chevronDown: "ChevronDown",
            lightbulb: "Lightbulb",
            shieldCheck: "ShieldCheck",
          }[k]
        ] || iconesSvg.Circle,
    }
  );
  app.locals.rotuloProfissional = x => x;
  const identidade =
    await import("../dist/src/app/models/identidadeUsuario.js");
  Object.assign(app.locals, identidade);
  app.use(
    express.urlencoded({ extended: true }),
    express.json(),
    protegerEscrita,
    routes
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise(r => server.once("listening", r));
  const host = `http://127.0.0.1:${server.address().port}`,
    csrf = "a".repeat(64);
  const cookies = Object.fromEntries(
    ["autor", "ouvinte", "candidato", "terceiro", "admin", "editor", "menor-a"].map(u => [
      u,
      `cypher_csrf=${csrf}; ${u === "admin" || u === "editor" ? "cypher_admin_session" : "cypher_session"}=${iniciarSessao(u)}`,
    ])
  );
  for (const [u, url] of [
    ["autor", "/opportunities"],
    ["autor", "/opportunities/new"],
    ["autor", "/my-opportunities"],
    ["autor", "/my-applications"],
    ["autor", `/opportunities/${retir}`],
    ["autor", `/opportunities/${retir}/edit`],
    ["candidato", `/opportunities/applications/${c}`],
    ["autor", "/messages"],
    ["autor", `/messages/${conv}`],
    ["menor-a", "/messages/conversa-etaria-adulto"],
    ["ouvinte", "/service-requests"],
    ["ouvinte", "/service-requests/new"],
    ["ouvinte", `/service-requests/${ped}`],
    ["ouvinte", "/service-mediation"],
    ["admin", "/admin/oportunidades"],
    ["admin", `/admin/oportunidades/pedidos/${ped}`],
    ["admin", `/admin/oportunidades/${ep}`],
    ["autor", "/work-projects"],
    ["autor", `/work-projects/${projeto}`],
  ]) {
    const r = await fetch(host + url, {
      headers: { cookie: cookies[u] },
      redirect: "manual",
    });
    const html = await r.text();
    assert.equal(r.status, 200, `${url}: ${html.slice(0, 1500)}`);
    checks++;
    assert.ok(!html.includes("[object Object]"), url);
    const qa = {
      "/opportunities": "lista",
      "/opportunities/new": "formulario",
      [`/opportunities/${retir}`]: "ficha",
      [`/opportunities/applications/${c}`]: "negociacao",
      "/messages/conversa-etaria-adulto": "mensagem-bloqueada",
    }[url];
    if (qa) {
      fs.mkdirSync("artifacts/opportunities-qa", { recursive: true });
      fs.writeFileSync(
        "artifacts/opportunities-qa/" + qa + ".html",
        html.replace(
          "const temaConta =",
          'localStorage.setItem("cypher-tema","dark"); const temaConta ='
        )
      );
    }
  }
  ok(() =>
    assert.ok(db.prepare("SELECT COUNT(*) n FROM notificacoes").get().n > 0)
  );
  const anon = await fetch(host + "/opportunities", { redirect: "manual" });
  ok(() => assert.equal(anon.status, 302));
  const csrfFail = await fetch(host + "/opportunities", {
    method: "POST",
    headers: { cookie: cookies.autor, "Content-Type": "application/json" },
    body: JSON.stringify(dados()),
    redirect: "manual",
  });
  ok(() => assert.equal(csrfFail.status, 403));
  const denied = await fetch(host + "/opportunities", {
    method: "POST",
    headers: {
      cookie: cookies.ouvinte,
      "Content-Type": "application/json",
      "x-csrf-token": csrf,
    },
    body: JSON.stringify(dados()),
    redirect: "manual",
  });
  ok(() => assert.equal(denied.status, 403));
  const invalid = await fetch(host + "/opportunities", {
    method: "POST",
    headers: {
      cookie: cookies.autor,
      "Content-Type": "application/json",
      "x-csrf-token": csrf,
    },
    body: JSON.stringify({ ...dados(), titulo: "" }),
    redirect: "manual",
  });
  ok(() => assert.equal(invalid.status, 400));
  assert.ok((await invalid.text()).includes("Procuro profissional"));
  const msgBloqueada = fs.readFileSync("artifacts/opportunities-qa/mensagem-bloqueada.html", "utf8");
  ok(() => assert.match(msgBloqueada, /proteções etárias/));
  ok(() => assert.ok(!msgBloqueada.includes('name="texto"')));
  const htmlForm=fs.readFileSync('artifacts/opportunities-qa/formulario.html','utf8');
  ok(()=>assert.match(htmlForm, /name="descricao"[^>]*aria-invalid="false">/));
  ok(()=>assert.match(htmlForm, /name="contexto"[^>]*aria-invalid="false">/));
  ok(()=>assert.match(htmlForm, /name="condicoes"[^>]*aria-invalid="false">/));
  const ec=m.candidatar('candidato',ep,{funcao_id:m.ficha(ep,'candidato').funcoes[0].id,requisitos:'sim'});
  m.decidirCandidatura('admin',ec,'selecionada');const ev=m.propor('admin',ec,termos);
  m.responderProposta('admin',ec,ev,'aceitar');ok(()=>assert.ok(m.responderProposta('candidato',ec,ev,'aceitar')));
  const recusavel=m.salvarChamada('autor',dados());const recusada=m.candidatar('candidato',recusavel,{funcao_id:m.ficha(recusavel,'autor').funcoes[0].id,requisitos:'sim'});
  m.decidirCandidatura('autor',recusada,'selecionada');const pr=m.propor('autor',recusada,termos);m.responderProposta('candidato',recusada,pr,'recusar');
  ok(()=>assert.equal(m.candidatura(recusada,'autor').estado,'recusada'));
  ok(()=>assert.equal(m.ficha(recusavel,'autor').ocupadas,0));
  if (process.argv.includes("--preview")) {
    console.log("Prévia isolada: " + host + "/qa/lista.html");
    fs.writeFileSync(
      "artifacts/opportunities-qa/mobile.html",
      '<!doctype html><title>Revisão mobile</title><body style="margin:0;background:#333;display:grid;place-items:center"><iframe title="Cypher mobile" src="/qa/lista.html" style="width:390px;height:844px;border:0"></iframe>'
    );
    await new Promise(resolve => process.once("SIGINT", resolve));
  }
  console.log(
    `Oportunidades: ${checks} verificações passaram; banco isolado, regras, acordos, pedidos, mensagens, persistência, rotas e EJS.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  banco.fecharBancoCypher(); /* Base temporária mantida para inspeção em caso de falha. */
}
