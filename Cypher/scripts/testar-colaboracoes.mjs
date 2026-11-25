import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-collabs-"));
process.env.NODE_ENV = "test";
process.env.CYPHER_DB_PATH = path.join(dir, "teste.sqlite");
const b = await import("../dist/src/app/models/bancoDados.js"),
  m = await import("../dist/src/app/models/colaboracoes.js"),
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
  function seed(id, tipo = "profissional") {
    b.criarContaCypher({
      id,
      email: id + "@example.test",
      senhaHash: "teste",
      tipoConta: tipo,
      nome: id,
      funcao: "Rapper",
      identificador: "@" + id,
      iniciais: "TT",
      categorias: tipo === "profissional" ? ["Rapper"] : [],
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
  }
  for (const id of [
    "artista",
    "colega",
    "terceiro",
    "fotografo",
    "parceiro",
    "spam",
  ])
    seed(id);
  seed("ouvinte", "consumidor");
  for (const [id, papel] of [
    ["admin", "super_admin"],
    ["mod", "moderador"],
    ["outromod", "moderador"],
    ["editor", "editor"],
  ]) {
    db.prepare(
      "INSERT INTO usuarios(id,tipo_conta) VALUES(?,'administrativo')"
    ).run(id);
    db.prepare(
      "INSERT INTO administradores(usuario_id,nome,papel) VALUES(?,?,?)"
    ).run(id, id, papel);
  }
  const convite = (
    destinatario = "colega",
    titulo = "Projeto independente",
    extras = {}
  ) => ({
    destinatario,
    titulo,
    natureza: "Produção musical",
    descricao: "Gravação e produção de uma faixa autoral.",
    funcao_proponente: "Voz",
    funcao_convidado: "Produção",
    consentimento: "sim",
    ...extras,
  });
  const raw = id => db.prepare("SELECT * FROM colaboracoes WHERE id=?").get(id);
  const acao = (ator, id, a, extras = {}, now) =>
    m.agirColaboracao(ator, id, a, { versao: raw(id).versao, ...extras }, now);
  const avaliar = (ator, id, n = 5, extra = {}, now) =>
    m.avaliarColaboracao(
      ator,
      id,
      {
        comunicacao: String(n),
        combinados: String(n),
        equipe: String(n),
        comentario: "Experiência profissional respeitosa.",
        confirmacao: "sim",
        ...extra,
      },
      now
    );
  const concluir = (a, z, t, now = Date.now()) => {
    const id = m.criarColaboracao(a, convite(z, t), now);
    acao(z, id, "aceitar", { consentimento: "sim" }, now);
    acao(a, id, "pedir_conclusao", {}, now);
    acao(z, id, "confirmar_conclusao", { confirmacao: "sim" }, now);
    return id;
  };
  ok(() => assert.throws(() => m.criarColaboracao("ouvinte", convite())));
  ok(() => assert.throws(() => m.criarColaboracao("admin", convite())));
  ok(() =>
    assert.throws(() => m.criarColaboracao("artista", convite("artista")))
  );
  const id = m.criarColaboracao("artista", convite());
  ok(() => assert.equal(m.criarColaboracao("artista", convite()), id));
  ok(() =>
    assert.equal(db.prepare("SELECT count(*) n FROM colaboracoes").get().n, 1)
  );
  ok(() => assert.throws(() => m.colaboracaoPrivada("terceiro", id)));
  ok(() => assert.throws(() => avaliar("artista", id)));
  ok(() =>
    assert.throws(() =>
      acao("artista", id, "aceitar", { consentimento: "sim" })
    )
  );
  acao("colega", id, "aceitar", { consentimento: "sim" });
  ok(() => assert.equal(raw(id).estado, "em_andamento"));
  acao("artista", id, "pedir_conclusao");
  ok(() =>
    assert.throws(() =>
      acao("artista", id, "confirmar_conclusao", { confirmacao: "sim" })
    )
  );
  acao("colega", id, "ainda_nao");
  ok(() => assert.equal(raw(id).estado, "em_andamento"));
  acao("colega", id, "pedir_cancelamento");
  ok(() => assert.throws(() => acao("colega", id, "confirmar_cancelamento")));
  acao("artista", id, "manter_colaboracao");
  ok(() => assert.equal(raw(id).estado, "em_andamento"));
  acao("artista", id, "pedir_conclusao");
  acao("colega", id, "confirmar_conclusao", { confirmacao: "sim" });
  ok(() => assert.throws(() => acao("artista", id, "pedir_cancelamento")));
  const sealed = avaliar("colega", id, 4, {
    comentario: "NOTA_LACRADA_NAO_VAZAR",
  });
  const priv = m.colaboracaoPrivada("artista", id);
  ok(() => assert.deepEqual(priv.avaliacoes, []));
  ok(() => assert.equal(priv.enviou, false));
  ok(() => assert.equal(m.resumoReputacao("artista").avaliacoes, 0));
  ok(() => assert.ok(!JSON.stringify(priv).includes("NOTA_LACRADA")));
  ok(() => assert.throws(() => avaliar("colega", id)));
  ok(() => assert.throws(() => avaliar("artista", id, 0)));
  ok(() => assert.throws(() => avaliar("artista", id, 6)));
  ok(() => assert.throws(() => avaliar("artista", id, 2.5)));
  ok(() =>
    assert.throws(() =>
      avaliar("artista", id, 5, { comentario: "x".repeat(1001) })
    )
  );
  avaliar("artista", id, 5);
  ok(() =>
    assert.equal(m.colaboracaoPrivada("artista", id).avaliacoes.length, 2)
  );
  ok(() => assert.equal(m.resumoReputacao("artista").media, null));
  ok(() =>
    assert.equal(m.resumoReputacao("artista").estado, "Reputação em formação")
  );
  ok(() =>
    assert.equal(
      m.reputacaoPublica("artista", "terceiro").avaliacoesPublicas.length,
      0
    )
  );
  // Mesmo colega, nova experiência: o peso final por avaliador permanece igual.
  const c2 = concluir("artista", "colega", "Outra experiência");
  avaliar("colega", c2, 2);
  avaliar("artista", c2, 5);
  const c3 = concluir("artista", "fotografo", "Ensaio de capa");
  avaliar("fotografo", c3, 5);
  avaliar("artista", c3, 5);
  const c4 = concluir("artista", "parceiro", "Clipe autoral");
  avaliar("parceiro", c4, 4);
  avaliar("artista", c4, 5);
  const rep = m.resumoReputacao("artista");
  ok(() => assert.equal(rep.avaliadores, 3));
  ok(() => assert.equal(rep.avaliacoes, 4));
  ok(() => assert.equal(rep.media, 4)); // médias: colega3, fotografo5, parceiro4
  ok(() =>
    assert.equal(
      m.reputacaoPublica("artista", "terceiro").avaliacoesPublicas.length,
      0
    )
  ); // todos privados
  acao("artista", id, "visibilidade", { publico: "sim" });
  ok(() =>
    assert.equal(
      m.reputacaoPublica("artista", "terceiro").avaliacoesPublicas.length,
      0
    )
  );
  acao("colega", id, "visibilidade", { publico: "sim" });
  ok(() =>
    assert.equal(
      m.reputacaoPublica("artista", "terceiro").avaliacoesPublicas.length,
      1
    )
  );
  acao("artista", id, "visibilidade");
  ok(() =>
    assert.equal(
      m.reputacaoPublica("artista", "terceiro").avaliacoesPublicas.length,
      0
    )
  );
  ok(() => assert.equal(raw(id).publico_b, 0));
  const notifsAntes = db.prepare("SELECT count(*) n FROM notificacoes").get().n;
  m.processarPrazos();
  m.processarPrazos();
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM notificacoes").get().n,
      notifsAntes
    )
  );
  // Contestação bloqueia o cômputo; denúncia de avaliação não o bloqueia sem decisão.
  const caseReview = m.abrirCaso("artista", id, {
    avaliacao_id: sealed,
    motivo: "outro",
    detalhes: "Solicito revisão do conteúdo divulgado.",
  });
  ok(() => assert.equal(m.resumoReputacao("artista").media, 4));
  ok(() =>
    assert.throws(() =>
      m.decidirCaso("editor", caseReview, {
        decisao: "invalidar_avaliacao",
        justificativa: "Decisão fundamentada do teste.",
      })
    )
  );
  m.decidirCaso("mod", caseReview, {
    decisao: "ocultar_comentario",
    justificativa: "Comentário expõe dados pessoais de terceiros.",
  });
  ok(() => assert.equal(m.resumoReputacao("artista").media, 4));
  ok(() =>
    assert.equal(
      m.colaboracaoPrivada("artista", id).avaliacoes.find(a => a.id === sealed)
        .comentario,
      ""
    )
  );
  const appeal = m.abrirCaso("artista", id, {
    avaliacao_id: sealed,
    recurso_de: caseReview,
    motivo: "outro",
    detalhes: "Peço nova revisão da decisão tomada.",
  });
  ok(() =>
    assert.throws(() =>
      m.decidirCaso("mod", appeal, {
        decisao: "invalidar_avaliacao",
        justificativa: "Decisão fundamentada do teste.",
      })
    )
  );
  m.decidirCaso("outromod", appeal, {
    decisao: "invalidar_avaliacao",
    justificativa: "Foi constatado problema substancial nesta avaliação.",
  });
  ok(() => assert.equal(m.resumoReputacao("artista").media, (2 + 5 + 4) / 3));
  const contested = m.abrirCaso("artista", c3, {
    motivo: "entrega_divergente",
    detalhes: "Há divergência concreta sobre a conclusão.",
    evidencias: "Referências da entrega original.",
  });
  ok(() => assert.equal(raw(c3).estado, "contestada"));
  ok(() => assert.equal(m.resumoReputacao("artista").media, null));
  ok(() =>
    assert.throws(() =>
      m.decidirCaso("mod", contested, {
        decisao: "concluir",
        justificativa: "Conclusão excepcional com evidências verificadas.",
        evidencias_suficientes: "sim",
      })
    )
  );
  m.manifestarCaso(
    "fotografo",
    contested,
    "Confirmo a entrega e apresento meu esclarecimento."
  );
  const deadline = raw(c3).prazo_avaliacao_em;
  m.decidirCaso("mod", contested, {
    decisao: "concluir",
    justificativa: "Evidências e manifestação confirmam a conclusão anterior.",
    evidencias_suficientes: "sim",
  });
  ok(() => assert.equal(raw(c3).prazo_avaliacao_em, deadline));
  ok(() => assert.equal(m.resumoReputacao("artista").avaliadores, 3));
  const inv = m.abrirCaso("artista", c4, {
    motivo: "vinculo_irregular",
    detalhes: "Peço revisão de um vínculo irregular.",
  });
  m.decidirCaso("mod", inv, {
    decisao: "invalidar_vinculo",
    justificativa: "A revisão comprovou irregularidade no vínculo.",
  });
  ok(() => assert.equal(raw(c4).estado, "invalidada"));
  ok(() => assert.equal(m.resumoReputacao("artista").media, null));
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM avaliacoes_colaboracao WHERE colaboracao_id=? AND estado='invalidada'"
        )
        .get(c4).n,
      2
    )
  );
  const limiteAnterior = raw(c4).prazo_avaliacao_em;
  const reverter = m.abrirCaso("artista", c4, {
    recurso_de: inv,
    motivo: "recurso",
    detalhes: "Peço revisão fundamentada da invalidação do vínculo.",
    evidencias: "Apresento registros adicionais da conclusão.",
  });
  m.manifestarCaso(
    "parceiro",
    reverter,
    "Reconheço a colaboração e apresento minha manifestação."
  );
  m.decidirCaso("outromod", reverter, {
    decisao: "restaurar_vinculo",
    justificativa: "Os novos elementos justificam reverter a invalidação.",
    evidencias_suficientes: "sim",
  });
  ok(() => assert.equal(raw(c4).estado, "concluida"));
  ok(() => assert.equal(raw(c4).prazo_avaliacao_em, limiteAnterior));
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM avaliacoes_colaboracao WHERE colaboracao_id=? AND estado='ativa'"
        )
        .get(c4).n,
      2
    )
  );

  // Bloqueio depois da conclusão não impede avaliação legítima dentro do prazo.
  const blocked = concluir("artista", "terceiro", "Trabalho antes do bloqueio");
  db.prepare(
    "INSERT INTO bloqueios_usuarios(autor_id,alvo_id) VALUES('artista','terceiro')"
  ).run();
  avaliar("terceiro", blocked, 5);
  ok(() =>
    assert.throws(() =>
      m.criarColaboracao("artista", convite("terceiro", "Novo contato"))
    )
  );
  db.prepare("DELETE FROM bloqueios_usuarios").run();
  // Relógio do servidor: inclusivo no limite; nota isolada só sai depois do limite.
  const instante = Date.now(),
    janela = concluir("spam", "parceiro", "Entrega com prazo", instante);
  const limite = raw(janela).prazo_avaliacao_em;
  avaliar("parceiro", janela, 3, {}, limite);
  ok(() => assert.equal(m.resumoReputacao("spam", limite).avaliacoes, 0));
  ok(() => assert.equal(m.resumoReputacao("spam", limite + 1).avaliacoes, 1));
  ok(() => assert.throws(() => avaliar("spam", janela, 5, {}, limite + 1)));
  // Expirações e limite de reenvio; silêncio nunca conclui nem cancela.
  const exp = m.criarColaboracao(
    "spam",
    convite("terceiro", "Convite antigo"),
    instante - 31 * m.DIA
  );
  m.processarPrazos(instante);
  ok(() => assert.equal(raw(exp).estado, "expirada"));
  ok(() =>
    assert.throws(() =>
      acao("terceiro", exp, "aceitar", { consentimento: "sim" })
    )
  );
  const semResposta = m.criarColaboracao(
    "spam",
    convite("fotografo", "Sem resposta à conclusão"),
    instante - 62 * m.DIA
  );
  acao(
    "fotografo",
    semResposta,
    "aceitar",
    { consentimento: "sim" },
    instante - 62 * m.DIA
  );
  acao("spam", semResposta, "pedir_conclusao", {}, instante - 31 * m.DIA);
  m.processarPrazos(instante);
  ok(() => assert.equal(raw(semResposta).estado, "em_andamento"));
  ok(() => assert.equal(raw(semResposta).concluida_em, null));
  acao("spam", semResposta, "pedir_cancelamento", {}, instante - 15 * m.DIA);
  m.processarPrazos(instante);
  ok(() => assert.equal(raw(semResposta).estado, "em_andamento"));
  ok(() => assert.equal(raw(semResposta).cancelamento_por, null));
  const rate = m.criarColaboracao(
    "spam",
    convite("fotografo", "Pedidos repetidos")
  );
  acao("fotografo", rate, "aceitar", { consentimento: "sim" });
  acao("spam", rate, "pedir_conclusao");
  acao("fotografo", rate, "ainda_nao");
  acao("spam", rate, "pedir_conclusao");
  acao("fotografo", rate, "ainda_nao");
  ok(() => assert.throws(() => acao("spam", rate, "pedir_conclusao")));
  // Evidência explícita: mera criação da obra não é lançamento.
  const ev = m.criarColaboracao(
    "spam",
    convite("colega", "Lançamento com evidência", { exige_lancamento: "sim" })
  );
  acao("colega", ev, "aceitar", { consentimento: "sim" });
  ok(() => assert.throws(() => acao("spam", ev, "pedir_conclusao")));
  acao("spam", ev, "pedir_conclusao", {
    evidencia_url: "https://example.com/lancamento",
    evidencia_descricao: "Publicação da faixa com participantes identificados.",
    evidencia_confirmada: "sim",
  });
  ok(() =>
    assert.throws(() =>
      acao("colega", ev, "confirmar_conclusao", { confirmacao: "sim" })
    )
  );
  acao("colega", ev, "confirmar_conclusao", {
    confirmacao: "sim",
    evidencia_confirmada: "sim",
  });
  ok(() =>
    assert.throws(
      () =>
        db
          .prepare("UPDATE avaliacoes_colaboracao SET comunicacao=1 WHERE id=?")
          .run(sealed),
      /IMUTAVEL/
    )
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  // Recursos também pertencem ao autor da nota afetada, sem ampliar direitos de avaliação.
  const recursoAutor = m.abrirCaso("colega", id, {
    avaliacao_id: sealed,
    recurso_de: appeal,
    motivo: "outro",
    detalhes: "Sou autor da nota e peço revisão fundamentada.",
  });
  ok(() => assert.ok(recursoAutor));
  m.decidirCaso("mod", recursoAutor, {
    decisao: "manter",
    justificativa: "A revisão mantém a decisão sobre a avaliação.",
  });
  // Nenhuma avaliação nem identidade contextual escapa por vínculo cuja origem é privada.
  const projetos = await import("../dist/src/app/models/projetosTrabalho.js");
  const proj = projetos.salvarProjetoTrabalho("artista", {
    titulo: "MATERIAL_RESERVADO",
    descricao: "Projeto profissional com material reservado.",
    modalidade: "projeto",
    profissoes: ["rapper"],
    papel: "Produção",
    direitos: "sim",
    publico: "",
    itens: "[]",
  });
  const privado = m.criarColaboracao(
    "artista",
    convite("terceiro", "Contexto reservado", {
      origem_tipo: "projeto",
      origem_id: proj,
      publico: "sim",
    })
  );
  acao("terceiro", privado, "aceitar", {
    consentimento: "sim",
    publico: "sim",
  });
  acao("artista", privado, "pedir_conclusao");
  acao("terceiro", privado, "confirmar_conclusao", { confirmacao: "sim" });
  avaliar("artista", privado);
  avaliar("terceiro", privado);
  ok(() =>
    assert.ok(
      !m
        .reputacaoPublica("artista", "colega")
        .avaliacoesPublicas.some(a => a.titulo === "Contexto reservado")
    )
  );
  const wav = Buffer.alloc(44);
  wav.write("RIFF");
  wav.writeUInt32LE(36, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  const audio = projetos.salvarMidia("artista", "audio-autorizado.wav", wav);
  const pa = projetos.salvarProjetoTrabalho("artista", {
    titulo: "Registro sonoro autorizado",
    descricao: "Registro de áudio para comprovar disponibilidade.",
    modalidade: "projeto",
    profissoes: ["rapper"],
    papel: "Voz",
    direitos: "sim",
    publico: "sim",
    itens: JSON.stringify([
      { tipo: "midia", origem_id: audio.id, publico: "sim" },
    ]),
  });
  const audioC = m.criarColaboracao(
    "artista",
    convite("colega", "Entrega sonora acessível", {
      origem_tipo: "projeto",
      origem_id: pa,
      exige_lancamento: "sim",
    })
  );
  acao("colega", audioC, "aceitar", { consentimento: "sim" });
  acao("artista", audioC, "pedir_conclusao", {
    evidencia_url: "/work-media/" + audio.id,
    evidencia_descricao: "Áudio autorizado acessível a ambas as contas.",
    evidencia_confirmada: "sim",
  });
  projetos.alterarVisibilidadeMidia("artista", audio.id, false);
  ok(() =>
    assert.throws(() =>
      acao("colega", audioC, "confirmar_conclusao", {
        confirmacao: "sim",
        evidencia_confirmada: "sim",
      })
    )
  );
  projetos.alterarVisibilidadeMidia("artista", audio.id, true);
  acao("colega", audioC, "confirmar_conclusao", {
    confirmacao: "sim",
    evidencia_confirmada: "sim",
  });
  ok(() => assert.equal(raw(audioC).estado, "concluida"));

  // Recusa e cancelamento nunca abrem avaliação.
  const recusado = m.criarColaboracao(
    "spam",
    convite("artista", "Convite a recusar")
  );
  acao("artista", recusado, "recusar");
  ok(() => assert.throws(() => avaliar("artista", recusado)));
  const cancelado = m.criarColaboracao(
    "colega",
    convite("parceiro", "Encerramento por acordo")
  );
  acao("parceiro", cancelado, "aceitar", { consentimento: "sim" });
  acao("colega", cancelado, "pedir_cancelamento");
  acao("parceiro", cancelado, "confirmar_cancelamento");
  ok(() => assert.equal(raw(cancelado).estado, "cancelada"));
  ok(() => assert.throws(() => avaliar("colega", cancelado)));
  // Estados de versão protegem duas respostas concorrentes ao mesmo formulário.
  const antiga = raw(ev).versao;
  acao("colega", ev, "visibilidade", { publico: "sim" });
  ok(() =>
    assert.throws(() =>
      m.agirColaboracao("colega", ev, "visibilidade", {
        versao: antiga,
        publico: "",
      })
    )
  );
  // A quinta proposta ao mesmo destinatário ainda é válida; a sexta é bloqueada.
  seed("limites");
  seed("alvo");
  for (let n = 0; n < 5; n++)
    m.criarColaboracao("limites", convite("alvo", "Trabalho de limite " + n));
  ok(() =>
    assert.throws(
      () => m.criarColaboracao("limites", convite("alvo", "Sexto convite")),
      /5 convites/
    )
  );
  for (let n = 0; n < 15; n++) {
    seed("dest" + n);
    m.criarColaboracao("limites", convite("dest" + n, "Trabalho diário " + n));
  }
  seed("excesso");
  ok(() =>
    assert.throws(
      () => m.criarColaboracao("limites", convite("excesso", "Excesso diário")),
      /20 novos|20 convites/
    )
  );

  const qtd = db.prepare("SELECT count(*) n FROM colaboracoes").get().n;
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  ok(() =>
    assert.equal(db.prepare("SELECT count(*) n FROM colaboracoes").get().n, qtd)
  );
  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  app.locals.icones = new Proxy({}, { get: () => "<svg></svg>" });
  app.locals.rotuloProfissional = x => x;
  Object.assign(
    app.locals,
    await import("../dist/src/app/models/identidadeUsuario.js"),
    await import("../dist/src/app/models/catalogoDemonstrativo.js")
  );
  app.locals.resumoReputacao = m.resumoReputacao;
  app.locals.reputacaoParaPerfil = (id, visitante) => {
    try {
      return m.reputacaoPublica(id, visitante);
    } catch {
      return null;
    }
  };
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
  app.use((e, req, res, next) => res.status(e.status || 500).send(e.message));
  server = app.listen(0, "127.0.0.1");
  await new Promise(r => server.once("listening", r));
  const host = "http://127.0.0.1:" + server.address().port,
    csrf = "a".repeat(64);
  const cookies = Object.fromEntries(
    ["artista", "colega", "terceiro", "ouvinte", "admin", "mod", "editor"].map(
      id => [
        id,
        "cypher_csrf=" +
          csrf +
          "; " +
          (["admin", "mod", "editor"].includes(id)
            ? "cypher_admin_session"
            : "cypher_session") +
          "=" +
          auth.iniciarSessao(id),
      ]
    )
  );
  const get = (url, user = "artista") =>
    fetch(host + url, {
      headers: { cookie: cookies[user] },
      redirect: "manual",
    });
  for (const [url, user] of [
    ["/colaboracoes", "artista"],
    ["/colaboracoes/new", "artista"],
    ["/colaboracoes/" + id, "artista"],
    ["/admin/reputacao", "mod"],
    ["/admin/reputacao/" + contested, "mod"],
    ["/reputacao/artista", "ouvinte"],
    ["/profile", "artista"],
    ["/p/artista", "ouvinte"],
  ]) {
    const r = await get(url, user),
      html = await r.text();
    ok(() => assert.equal(r.status, 200, url + ": " + html.slice(0, 800)));
    ok(() => assert.ok(!html.includes("[object Object]")));
    if (
      process.env.CYPHER_QA_OUTPUT &&
      [
        "/colaboracoes",
        "/colaboracoes/new",
        "/colaboracoes/" + id,
        "/admin/reputacao/" + contested,
      ].includes(url)
    ) {
      const { pathToFileURL } = await import("node:url");
      const pasta = path.resolve(process.env.CYPHER_QA_OUTPUT);
      fs.mkdirSync(pasta, { recursive: true });
      const raiz = pathToFileURL(path.resolve("public")).href + "/";
      const nome =
        url === "/colaboracoes"
          ? "lista"
          : url.endsWith("/new")
            ? "convite"
            : url.startsWith("/admin/")
              ? "moderacao"
              : "detalhe";
      const bases = ["base", "estrutura", "componentes"]
        .map(
          n => '<link rel="stylesheet" href="' + raiz + "css/" + n + '.css">'
        )
        .join("");
      fs.writeFileSync(
        path.join(pasta, nome + ".html"),
        html
          .replaceAll('href="/css/', 'href="' + raiz + "css/")
          .replaceAll('src="/js/', 'src="' + raiz + "js/")
          .replace(
            '<link rel="stylesheet" href="file:',
            bases + '<link rel="stylesheet" href="file:'
          )
          .replace(
            "const temaConta =",
            'localStorage.setItem("cypher-tema","dark"); const temaConta ='
          )
      );
    }
  }
  for (const [url, user, expected] of [
    ["/colaboracoes/" + id, "terceiro", 404],
    ["/colaboracoes/new", "ouvinte", 403],
    ["/admin/reputacao", "editor", 403],
  ]) {
    const r = await get(url, user);
    ok(() => assert.equal(r.status, expected));
  }
  const anon = await fetch(host + "/colaboracoes", { redirect: "manual" });
  ok(() => assert.equal(anon.status, 302));
  const noCsrf = await fetch(host + "/colaboracoes", {
    method: "POST",
    headers: { cookie: cookies.artista, "content-type": "application/json" },
    body: JSON.stringify(convite()),
  });
  ok(() => assert.equal(noCsrf.status, 403));
  const post = (url, user, body) =>
    fetch(host + url, {
      method: "POST",
      headers: {
        cookie: cookies[user],
        "content-type": "application/x-www-form-urlencoded",
        "x-csrf-token": csrf,
      },
      body: new URLSearchParams(body),
      redirect: "manual",
    });
  const novo = await post(
    "/colaboracoes",
    "artista",
    convite("terceiro", "Convite por HTTP")
  );
  ok(() => assert.equal(novo.status, 303));
  const nid = novo.headers.get("location").split("/").pop();
  const negada = await post(
    "/colaboracoes/" + nid + "/acoes/aceitar",
    "artista",
    { versao: raw(nid).versao, consentimento: "sim" }
  );
  ok(() => assert.equal(negada.status, 409));
  const duplicados = await Promise.all([
    post(
      "/colaboracoes",
      "artista",
      convite("terceiro", "Mesmo convite simultâneo")
    ),
    post(
      "/colaboracoes",
      "artista",
      convite("terceiro", "Mesmo convite simultâneo")
    ),
  ]);
  ok(() =>
    assert.equal(
      duplicados[0].headers.get("location"),
      duplicados[1].headers.get("location")
    )
  );
  const concorrente = concluir("colega", "fotografo", "Avaliação simultânea");
  const concorrentes = await Promise.all([
    post("/colaboracoes/" + concorrente + "/avaliacoes", "colega", {
      comunicacao: "4",
      combinados: "4",
      equipe: "4",
      confirmacao: "sim",
    }),
    post("/colaboracoes/" + concorrente + "/avaliacoes", "colega", {
      comunicacao: "5",
      combinados: "5",
      equipe: "5",
      confirmacao: "sim",
    }),
  ]);
  ok(() =>
    assert.deepEqual(concorrentes.map(r => r.status).sort(), [303, 409])
  );
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM avaliacoes_colaboracao WHERE colaboracao_id=?"
        )
        .get(concorrente).n,
      1
    )
  );
  const blind = concluir("artista", "parceiro", "Sigilo HTML");
  avaliar("parceiro", blind, 1, { comentario: "SEGREDO_HTML_NAO_EXIBIR" });
  const html = await (await get("/colaboracoes/" + blind)).text();
  ok(() => assert.ok(!html.includes("SEGREDO_HTML_NAO_EXIBIR")));
  ok(() => assert.ok(!html.includes("avaliador_id")));
  console.log(
    `Colaborações: ${checks} verificações passaram; estados, prazos, duplo-cego, reputação ponderada, moderação, privacidade, migração e HTTP.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
