import { configurarNavegacaoTeste } from "./locais-navegacao-teste.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { pathToFileURL } from "node:url";
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-eventos-"));
process.env.NODE_ENV = "test";
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
const b = await import("../dist/src/app/models/bancoDados.js"),
  m = await import("../dist/src/app/models/eventos.js"),
  auth = await import("../dist/src/app/models/autenticacaoCypher.js");
let server,
  checks = 0;
const ok = fn => {
  fn();
  checks++;
};
try {
  b.inicializarBancoCypher();
  let db = b.conexaoInternaCypher();
  const criar = (id, tipo = "consumidor", categorias = []) => {
    b.criarContaCypher({
      id,
      email: id + "@example.test",
      senhaHash: "teste",
      tipoConta: tipo,
      nome: id,
      funcao: categorias[0] ?? "",
      identificador: "@" + id,
      iniciais: "EV",
      categorias,
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
  };
  criar("organizador", "profissional", ["Organizador(a) de eventos"]);
  criar("outro-organizador", "profissional", ["Organizador(a) de eventos"]);
  for (const id of ["alice", "bruno", "carol", "visitante"]) criar(id);
  criar("rapper", "profissional", ["Rapper"]);
  db.prepare(
    "INSERT INTO usuarios(id,tipo_conta) VALUES('moderador','administrativo')"
  ).run();
  db.prepare(
    "INSERT INTO administradores(usuario_id,nome,papel) VALUES('moderador','Moderador','moderador')"
  ).run();
  const base = {
    title: "Encontro da cena",
    category: "Cypher",
    categoryDetail: "",
    workshopTypes: [],
    date: "2030-06-15",
    time: "19:00",
    location: "Praça da cena · São Paulo",
    org: "Coletivo responsável",
    status: "Inscrições abertas",
    color: "yellow",
    temaCartao: "classico",
    description: "Encontro independente para aprender e criar.",
    format: "Presencial",
    registration: "Gratuita",
    prize: "",
    tags: [],
    participationType: "aprovacao",
  };
  const cfg = {
    data: "2030-06-15",
    horario: "19:00",
    fimData: "2030-06-15",
    fimHorario: "22:00",
    fuso: "America/Sao_Paulo",
    capacidade: "1",
    criterios:
      "Entrada gratuita. A inscrição depende da avaliação da organização.",
    localConfirmado: "sim",
    latitude: "-23.55",
    longitude: "-46.63",
  };
  const novo = (dados = {}, config = {}) => {
    const id = b.criarEventoCypher("organizador", { ...base, ...dados });
    m.salvarConfiguracaoEvento("organizador", id, { ...cfg, ...config });
    return id;
  };
  const e = novo(),
    raw = id =>
      db
        .prepare("SELECT * FROM eventos_configuracoes WHERE evento_id=?")
        .get(id),
    i = (id, u) =>
      db
        .prepare(
          "SELECT * FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=?"
        )
        .get(id, u),
    inicio = raw(e).inicio_em,
    fim = raw(e).fim_em,
    antes = inicio - 3 * 86400000;
  ok(() =>
    assert.equal(new Date(inicio).toISOString(), "2030-06-15T22:00:00.000Z")
  );
  ok(() => assert.throws(() => m.instanteLocal("2030-02-31", "19:00", "UTC")));
  ok(() => assert.throws(() => m.instanteLocal("2030-01-01", "25:00", "UTC")));
  ok(() =>
    assert.throws(() =>
      m.validarConfiguracaoEvento({ ...cfg, fimHorario: "18:00" })
    )
  );
  ok(() =>
    assert.throws(() =>
      m.validarConfiguracaoEvento({ ...cfg, capacidade: "1.5" })
    )
  );
  ok(() =>
    assert.throws(() =>
      m.validarConfiguracaoEvento({
        ...cfg,
        localConfirmado: "sim",
        latitude: "",
      })
    )
  );
  ok(() =>
    assert.throws(() =>
      m.validarConfiguracaoEvento({ ...cfg, fuso: "Fuso/Inventado" })
    )
  );
  ok(() => assert.throws(() => m.fichaEvento("moderador", e)));
  ok(() => assert.throws(() => b.criarEventoCypher("rapper", base)));
  ok(() => assert.throws(() => b.criarEventoCypher("alice", base)));
  m.seguirEvento("alice", e, { acao: "interesse", ativo: "sim" }, antes);
  m.seguirEvento("alice", e, { acao: "salvar", ativo: "sim" }, antes);
  ok(() =>
    assert.equal(m.fichaEvento("alice", e, antes).totais.interessados, 1)
  );
  ok(() => assert.equal(m.fichaEvento("alice", e, antes).totais.inscritos, 0));
  ok(() => assert.equal(m.fichaEvento("alice", e, antes).totais.presentes, 0));
  ok(() =>
    assert.throws(() => m.inscreverEvento("alice", e, { aceite: "nao" }, antes))
  );
  m.inscreverEvento(
    "alice",
    e,
    { aceite: "sim", justificativa: "Gostaria de aprender com a cena." },
    antes
  );
  m.inscreverEvento("alice", e, { aceite: "sim" }, antes);
  ok(() => assert.equal(m.fichaEvento("alice", e, antes).totais.inscritos, 1));
  ok(() =>
    assert.equal(m.fichaEvento("alice", e, antes).totais.confirmados, 0)
  );
  ok(() => assert.equal(i(e, "alice").estado, "pendente"));
  ok(() => assert.equal(m.fichaEvento("bruno", e).inscricoes.length, 0));
  ok(() =>
    assert.throws(() =>
      m.decidirInscricaoEvento(
        "outro-organizador",
        e,
        "alice",
        { versao: 1, estado: "confirmada", resposta: "Critérios atendidos." },
        antes
      )
    )
  );
  ok(() =>
    assert.throws(() =>
      m.decidirInscricaoEvento(
        "organizador",
        e,
        "alice",
        { versao: 99, estado: "confirmada", resposta: "Critérios atendidos." },
        antes
      )
    )
  );
  m.decidirInscricaoEvento(
    "organizador",
    e,
    "alice",
    { versao: 1, estado: "confirmada", resposta: "Critérios atendidos." },
    antes
  );
  m.inscreverEvento("bruno", e, { aceite: "sim" }, antes);
  ok(() =>
    assert.throws(
      () =>
        m.decidirInscricaoEvento(
          "organizador",
          e,
          "bruno",
          { versao: 1, estado: "confirmada", resposta: "Critérios atendidos." },
          antes
        ),
      /vagas/
    )
  );
  ok(() => assert.equal(i(e, "bruno").estado, "pendente"));
  ok(() =>
    assert.throws(() =>
      m.registrarPresencaEvento(
        "organizador",
        e,
        "alice",
        { evidencia: "Conferência de entrada." },
        antes
      )
    )
  );
  ok(() =>
    assert.throws(() =>
      m.avaliarEvento("alice", e, { positiva: "sim" }, fim + 1)
    )
  );
  m.cancelarInscricaoEvento("alice", e, antes);
  ok(() => assert.equal(m.fichaEvento("alice", e).vagas, 1));
  m.decidirInscricaoEvento(
    "organizador",
    e,
    "bruno",
    { versao: 1, estado: "confirmada", resposta: "Critérios atendidos." },
    antes
  );
  m.registrarPresencaEvento(
    "organizador",
    e,
    "bruno",
    { evidencia: "Nome conferido na lista de entrada." },
    inicio + 1
  );
  ok(() =>
    assert.equal(m.fichaEvento("bruno", e, fim + 1).totais.presentes, 1)
  );
  ok(() =>
    assert.throws(() => m.cancelarInscricaoEvento("bruno", e, inicio + 1))
  );
  ok(() =>
    assert.throws(() =>
      m.avaliarEvento("bruno", e, { positiva: "sim" }, inicio + 1)
    )
  );
  ok(() =>
    assert.throws(() =>
      m.avaliarEvento(
        "bruno",
        e,
        { positiva: "nao", justificativa: "ruim" },
        fim + 1
      )
    )
  );
  m.avaliarEvento(
    "bruno",
    e,
    {
      positiva: "nao",
      justificativa:
        "O evento atrasou e a organização não comunicou o horário.",
    },
    fim + 1
  );
  ok(() => assert.equal(m.fichaEvento("bruno", e, fim + 1).feedback.total, 1));
  ok(() =>
    assert.throws(() =>
      m.avaliarEvento("bruno", e, { positiva: "sim" }, fim + 1)
    )
  );
  ok(() =>
    assert.throws(() =>
      m.avaliarEvento("visitante", e, { positiva: "sim" }, fim + 1)
    )
  );
  const rid = m.reclamarEvento(
    "bruno",
    e,
    {
      descricao:
        "A programação foi alterada na entrada sem qualquer orientação.",
      evidencias: "Referência privada do participante.",
    },
    fim + 1
  );
  ok(() =>
    assert.equal(m.fichaEvento("alice", e, fim + 1).reclamacoes.length, 0)
  );
  ok(() =>
    assert.equal(
      m.fichaEvento("organizador", e, fim + 1).reclamacoes[0].evidencias,
      "Referência privada do participante."
    )
  );
  ok(() =>
    assert.throws(() => m.encaminharReclamacaoEvento("bruno", e, rid, fim + 1))
  );
  m.responderReclamacaoEvento(
    "organizador",
    e,
    rid,
    {
      estado: "contestada",
      resposta: "A programação estava informada na entrada do espaço.",
    },
    fim + 1
  );
  const protocolo = m.encaminharReclamacaoEvento("bruno", e, rid, fim + 1);
  ok(() =>
    assert.equal(
      m.encaminharReclamacaoEvento("bruno", e, rid, fim + 1),
      protocolo
    )
  );
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT COUNT(*) AS n FROM suporte_casos WHERE id=?")
        .get(protocolo).n,
      1
    )
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM suporte_medidas").get().n,
      0
    )
  );
  m.registrarPresencaEvento(
    "organizador",
    e,
    "bruno",
    {
      acao: "revogar",
      evidencia: "Duplicidade identificada na conferência do acesso.",
    },
    fim + 2
  );
  ok(() => assert.equal(m.fichaEvento("bruno", e, fim + 2).feedback.total, 0));
  ok(() =>
    assert.ok(
      db
        .prepare(
          "SELECT invalidada_em FROM eventos_avaliacoes WHERE evento_id=?"
        )
        .get(e).invalidada_em
    )
  );
  const aberto = novo({ participationType: "aberta" }, { capacidade: "1" });
  m.inscreverEvento("alice", aberto, { aceite: "sim" }, antes);
  ok(() => assert.equal(i(aberto, "alice").estado, "confirmada"));
  ok(() =>
    assert.throws(
      () => m.inscreverEvento("bruno", aberto, { aceite: "sim" }, antes),
      /vagas/
    )
  );
  ok(() =>
    assert.throws(() =>
      m.inscreverEvento("organizador", aberto, { aceite: "sim" }, antes)
    )
  );
  ok(() =>
    assert.throws(() =>
      m.inscreverEvento("bruno", aberto, { aceite: "sim" }, inicio)
    )
  );
  const ref = raw(aberto),
    old = m.eventoAntesDeEditar("organizador", aberto);
  db.prepare(
    "UPDATE eventos SET local='Local atualizado e confirmado' WHERE id=?"
  ).run(aberto);
  m.salvarConfiguracaoEvento(
    "organizador",
    aberto,
    { ...cfg, versao: ref.versao },
    old,
    antes
  );
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT COUNT(*) AS n FROM notificacoes WHERE usuario_destino_id='alice' AND chave_origem LIKE ?"
        )
        .get("eventos:" + aberto + ":alteracao:%").n,
      1
    )
  );
  ok(() =>
    assert.throws(() =>
      m.salvarConfiguracaoEvento(
        "organizador",
        aberto,
        { ...cfg, capacidade: "0", versao: raw(aberto).versao },
        old
      )
    )
  );
  const edicao = novo({}, { serieId: e });
  ok(() => assert.equal(m.fichaEvento("alice", edicao).edicoes.length, 2));
  ok(() => assert.equal(m.fichaEvento("alice", edicao).totais.presentes, 0));
  ok(() => assert.throws(() => novo({}, { serieId: edicao })));
  const semLocal = novo(
    {},
    { localConfirmado: "", latitude: "", longitude: "" }
  );
  ok(() =>
    assert.ok(!m.pontosMapaEventos("alice").some(p => p.id === semLocal))
  );
  ok(() => assert.ok(m.pontosMapaEventos("alice").some(p => p.id === e)));
  const lembrete = novo();
  m.seguirEvento("carol", lembrete, { acao: "salvar", ativo: "sim" }, antes);
  m.seguirEvento(
    "carol",
    lembrete,
    {
      acao: "preferencias",
      lembrar24: "sim",
      lembrarDia: "sim",
      fuso: "America/Sao_Paulo",
    },
    antes
  );
  const chaves = () =>
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM notificacoes WHERE entidade_id=? AND tipo='evento_lembrete'"
      )
      .get(lembrete).n;
  m.processarLembretesEventos(inicio - 86400001);
  ok(() => assert.equal(chaves(), 0));
  m.processarLembretesEventos(inicio - 86400000);
  ok(() => assert.equal(chaves(), 1));
  m.processarLembretesEventos(inicio - 86400000);
  ok(() => assert.equal(chaves(), 1));
  m.processarLembretesEventos(inicio - 3600000);
  ok(() => assert.equal(chaves(), 2));
  m.seguirEvento("carol", semLocal, { acao: "salvar", ativo: "sim" }, antes);
  m.seguirEvento(
    "carol",
    semLocal,
    { acao: "preferencias", fuso: "America/Sao_Paulo" },
    antes
  );
  m.processarLembretesEventos(inicio - 3600000);
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT COUNT(*) n FROM notificacoes WHERE entidade_id=? AND tipo='evento_lembrete'"
        )
        .get(semLocal).n,
      0
    )
  );
  const cancelado = novo();
  m.inscreverEvento("carol", cancelado, { aceite: "sim" }, antes);
  m.cancelarEvento(
    "organizador",
    cancelado,
    {
      versao: raw(cancelado).versao,
      motivo: "O espaço não poderá receber o público nesta data.",
    },
    antes
  );
  ok(() => assert.equal(raw(cancelado).estado, "cancelado"));
  ok(() => assert.equal(i(cancelado, "carol").estado, "cancelada"));
  ok(() =>
    assert.ok(db.prepare("SELECT id FROM eventos WHERE id=?").get(cancelado))
  );
  ok(() =>
    assert.throws(() =>
      m.inscreverEvento("alice", cancelado, { aceite: "sim" }, antes)
    )
  );
  ok(() =>
    assert.ok(!m.pontosMapaEventos("alice").some(p => p.id === cancelado))
  );
  const totalNot = db.prepare("SELECT COUNT(*) n FROM notificacoes").get().n;
  m.cancelarEvento(
    "organizador",
    cancelado,
    { versao: 1, motivo: "O espaço não poderá receber o público nesta data." },
    antes
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT COUNT(*) n FROM notificacoes").get().n,
      totalNot
    )
  );
  const leg = novo();
  b.demonstrarInteresseEventoCypher(leg, "alice");
  ok(() => assert.equal(m.fichaEvento("alice", leg).totais.inscritos, 0));
  ok(() => assert.equal(m.fichaEvento("alice", leg).totais.interessados, 1));
  ok(() => assert.equal(b.excluirEventoCypher(leg, "organizador"), false));
  // HTTP com sessões e proteção CSRF reais.
  const app = express();
  await configurarNavegacaoTeste(app);
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  app.locals.icones = new Proxy({}, { get: () => "<svg></svg>" });
  app.locals.rotuloProfissional = x => x;
  Object.assign(
    app.locals,
    await import("../dist/src/app/models/identidadeUsuario.js"),
    await import("../dist/src/app/models/catalogoDemonstrativo.js")
  );
  const col = await import("../dist/src/app/models/colaboracoes.js");
  app.locals.resumoReputacao = col.resumoReputacao;
  app.locals.reputacaoParaPerfil = () => null;
  const { protegerEscrita } =
      await import("../dist/src/app/middlewares/seguranca.js"),
    { default: routes } = await import("../dist/src/app/routes/rotasCypher.js");
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
  const host = "http://127.0.0.1:" + server.address().port,
    csrf = "e".repeat(64),
    cookies = Object.fromEntries(
      ["alice", "organizador", "outro-organizador"].map(u => [
        u,
        "cypher_csrf=" + csrf + "; cypher_session=" + auth.iniciarSessao(u),
      ])
    );
  const req = (url, u = "alice", extra = {}) =>
      fetch(host + url, {
        redirect: "manual",
        ...extra,
        headers: { cookie: cookies[u], ...(extra.headers ?? {}) },
      }),
    post = (url, body, u = "alice") =>
      req(url, u, {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(body),
      });
  const ficha = await req("/events/" + aberto);
  const html = await ficha.text();
  ok(() => assert.equal(ficha.status, 200, html));
  ok(() => assert.match(html, /Sua participação/));
  ok(() => assert.ok(!html.includes("Nome conferido na lista de entrada.")));
  const mapa = await req("/events/map");
  const mapaHtml = await mapa.text();
  ok(() => assert.equal(mapa.status, 200, mapaHtml));
  ok(() => assert.match(mapaHtml, /openstreetmap.org\/export\/embed/));
  const edit = await req("/events/new", "organizador");
  ok(() => assert.equal(edit.status, 200));
  const editHtml = await edit.text();
  ok(() => assert.match(editHtml, /Critérios e regras de participação/));
  const indevido = await post(
    "/events/" + e + "/registrations/bruno/attendance",
    { evidencia: "Conferência indevida da entrada." },
    "outro-organizador"
  );
  ok(() => assert.equal(indevido.status, 403));
  const noc = await req("/events/" + e + "/register", "alice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"aceite":"sim"}',
  });
  ok(() => assert.equal(noc.status, 403));
  const anon = await fetch(host + "/events/" + e, { redirect: "manual" });
  ok(() => assert.equal(anon.status, 302));
  const create = await post(
    "/events/new",
    {
      titulo: "Evento HTTP seguro",
      categoria: "Cypher",
      categoriaDetalhe: "",
      data: "2031-01-20",
      horario: "19:00",
      local: "Praça oficial da cidade",
      organizador: "Coletivo responsável",
      situacao: "Inscrições abertas",
      cor: "yellow",
      temaCartao: "classico",
      descricao: "Encontro profissional aberto e gratuito.",
      formato: "Presencial",
      inscricao: "Gratuita",
      premio: "",
      etiquetas: "",
      tipoParticipacao: "aberta",
      fimData: "2031-01-20",
      fimHorario: "21:00",
      fuso: "America/Sao_Paulo",
      capacidade: "20",
      criterios: "Entrada por inscrição confirmada, com respeito ao público.",
    },
    "organizador"
  );
  ok(() => assert.equal(create.status, 302));
  const novoHttp = db
    .prepare("SELECT id FROM eventos WHERE titulo='Evento HTTP seguro'")
    .get();
  ok(() => assert.ok(raw(novoHttp.id).fim_em));
  const bad = await post(
    "/events/new",
    {
      titulo: "Evento sem fim",
      categoria: "Cypher",
      data: "2031-01-20",
      horario: "19:00",
      local: "Praça oficial",
      organizador: "Coletivo",
      situacao: "Inscrições abertas",
      cor: "yellow",
      temaCartao: "classico",
      formato: "Presencial",
      tipoParticipacao: "aberta",
    },
    "organizador"
  );
  ok(() => assert.equal(bad.status, 400));
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT COUNT(*) n FROM eventos WHERE titulo='Evento sem fim'")
        .get().n,
      0
    )
  );
  if (process.env.CYPHER_QA_OUTPUT) {
    const out = path.resolve(process.env.CYPHER_QA_OUTPUT);
    fs.mkdirSync(out, { recursive: true });
    for (const [nome, url, u] of [
      ["ficha", "/events/" + aberto, "alice"],
      ["gestao", "/events/" + e, "organizador"],
      ["formulario", "/events/new", "organizador"],
      ["mapa", "/events/map", "alice"],
    ]) {
      const response = await req(url, u);
      const content = (await response.text())
        .replace('name="cypher-theme" content="light"','name="cypher-theme" content="dark"')
        .replace('<link rel="stylesheet" href="/css/estilos.css">',['base','estrutura','componentes','estilos'].map(s=>'<link rel="stylesheet" href="/css/'+s+'.css">').join(''))
        .replaceAll(
          'href="/css/',
          'href="' + pathToFileURL(path.resolve("public/css")).href + "/"
        )
        .replaceAll(
          'src="/js/',
          'src="' + pathToFileURL(path.resolve("public/js")).href + "/"
        );
      fs.writeFileSync(path.join(out, nome + ".html"), content);
    }
  }
  const n = db.prepare("SELECT COUNT(*) n FROM eventos_inscricoes").get().n;
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  ok(() =>
    assert.equal(
      db.prepare("SELECT COUNT(*) n FROM eventos_inscricoes").get().n,
      n
    )
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  console.log(
    `Eventos: ${checks} verificações passaram; inscrição, vagas, aprovação, presença, comunicação, mapas, lembretes, reclamações, privacidade, persistência e HTTP.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
