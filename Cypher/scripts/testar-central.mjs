import { configurarNavegacaoTeste } from "./locais-navegacao-teste.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";

// Todos os registros e as sessões desta suíte pertencem a uma base temporária.
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-central-"));
process.env.NODE_ENV = "test";
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
const b = await import("../dist/src/app/models/bancoDados.js");
const m = await import("../dist/src/app/models/central.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
const identidade = await import("../dist/src/app/models/identidadeUsuario.js");
let server;
let checks = 0;
const ok = fn => {
  fn();
  checks++;
};
const aguardar = ms => new Promise(r => setTimeout(r, ms));
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
      iniciais: "TT",
      categorias: tipo === "profissional" ? ["Rapper"] : [],
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
  }
  seed("leitor");
  seed("outro");
  seed("consumidor", "consumidor");
  seed("pendente");
  db.prepare(
    "UPDATE usuarios SET email_confirmado_em=NULL WHERE id='pendente'"
  ).run();
  for (const [id, papel] of [
    ["admin", "super_admin"],
    ["editor", "editor"],
    ["editor2", "editor"],
    ["moderador", "moderador"],
  ]) {
    db.prepare(
      "INSERT INTO usuarios(id,email,tipo_conta) VALUES(?,?,'administrativo')"
    ).run(id, id + "@admin.example.test");
    db.prepare(
      "INSERT INTO administradores(usuario_id,nome,papel) VALUES(?,?,?)"
    ).run(id, id, papel);
  }
  const editorial = id => m.artigoEditorial("editor", id);
  const dados = extras => ({
    titulo: "Publicar um trabalho sem perder o contexto",
    resumo:
      "Um caminho curto para apresentar a função de cada pessoa e preservar o registro original.",
    categoria: "publicacoes",
    intencao: "publicar",
    profissoes: ["rapper", "fotografo"],
    passos: JSON.stringify([
      {
        titulo: "Escolha o formato",
        conteudo:
          "Abra o Espaço de Trabalho e escolha o formato compatível com sua atuação.",
        dica: "Um trabalho visual não precisa ser cadastrado como música.",
      },
      {
        titulo: "Apresente sua função",
        conteudo:
          "Descreva a função exercida, os materiais e as contribuições autorizadas.",
        dica: "Crédito mencionado não equivale a participação confirmada.",
      },
    ]),
    exemplo:
      "Exemplo ilustrativo: uma fotógrafa registra um ensaio e um artista apresenta sua contribuição no lançamento.",
    acao_url: "/espaco-de-trabalho",
    acao_label: "Abrir Espaço de Trabalho",
    ...extras,
  });
  const estado = id => editorial(id).estado;
  const transicao = (id, acao, ator = "editor", extra = {}) =>
    m.transicionarArtigo(ator, id, {
      acao,
      versao: editorial(id).versao,
      motivo: "Decisão editorial fundamentada nesta suíte.",
      ...extra,
    });
  const publicar = id => {
    transicao(id, "revisar");
    transicao(id, "publicar");
  };
  const buscar = (query = {}, id = "leitor") => m.pesquisarCentral(id, query);
  const qualidade = (filtros = {}, id = "editor") =>
    m.qualidadeCentral(id, { dias: "30", ...filtros });

  // Ausência de artigos não deve ser disfarçada por exemplos fixos de conteúdo.
  const vazia = buscar();
  ok(() => assert.equal(vazia.artigos.length, 0));
  ok(() => assert.equal(vazia.recentes.length, 0));
  ok(() => assert.equal(vazia.quantidade, 0));
  ok(() => assert.equal(vazia.registrarPesquisas, false));
  ok(() => assert.ok(m.categoriasCentral.some(c => c.id === "seguranca")));
  ok(() => assert.ok(m.motivosCentral.some(c => c.id === "outro")));
  ok(() => assert.throws(() => m.salvarArtigo("leitor", dados())));
  ok(() => assert.throws(() => m.salvarArtigo("consumidor", dados())));
  ok(() => assert.throws(() => m.salvarArtigo("moderador", dados())));
  ok(() => assert.throws(() => qualidade({}, "moderador")));
  ok(() => assert.throws(() => qualidade({}, "leitor")));
  ok(() => assert.throws(() => m.artigosEditoriais("leitor")));
  ok(() => assert.throws(() => m.pesquisarCentral("pendente", {})));
  ok(() =>
    assert.throws(() =>
      m.salvarArtigo("editor", dados({ categoria: "categoria_inexistente" }))
    )
  );
  ok(() =>
    assert.throws(() =>
      m.salvarArtigo("editor", dados({ intencao: "desconhecida" }))
    )
  );
  ok(() =>
    assert.throws(() =>
      m.salvarArtigo("editor", dados({ profissoes: ["podcaster"] }))
    )
  );
  ok(() =>
    assert.throws(() =>
      m.salvarArtigo("editor", dados({ passos: "isso não é JSON" }))
    )
  );
  ok(() =>
    assert.throws(() => m.salvarArtigo("editor", dados({ titulo: "" })))
  );
  ok(() =>
    assert.throws(() =>
      m.salvarArtigo("editor", dados({ acao_url: "javascript:alert(1)" }))
    )
  );

  const id = m.salvarArtigo(
    "editor",
    dados({ estado: "publicado", autor_id: "moderador" })
  );
  ok(() => assert.notEqual(estado(id), "publicado"));
  ok(() => assert.equal(editorial(id).autor, "editor"));
  ok(() => assert.equal(buscar().artigos.length, 0));
  const slug = editorial(id).slug;
  ok(() => assert.throws(() => m.lerArtigo("leitor", slug, false)));
  ok(() => assert.throws(() => transicao(id, "publicar")));
  transicao(id, "revisar");
  ok(() => assert.equal(estado(id), "em_revisao"));
  const versaoRevisao = editorial(id).versao;
  ok(() =>
    assert.throws(() =>
      m.transicionarArtigo("moderador", id, {
        acao: "publicar",
        versao: versaoRevisao,
        motivo: "O cargo moderador não possui competência editorial.",
      })
    )
  );
  transicao(id, "publicar");
  ok(() => assert.equal(estado(id), "publicado"));
  const artigo = m.lerArtigo("leitor", slug, false);
  ok(() => assert.equal(artigo.id, id));
  ok(() => assert.equal(artigo.titulo, dados().titulo));
  ok(() => assert.equal(artigo.passos.length, 2));
  ok(() => assert.ok(artigo.minutos >= 1));
  ok(() => assert.ok(Number.isFinite(artigo.publicado_em)));
  ok(() =>
    assert.ok(
      buscar({ q: "formato compatível" }).artigos.some(a => a.id === id)
    )
  );
  ok(() => assert.ok(buscar({ q: "FUNÇÃO" }).artigos.some(a => a.id === id)));
  ok(() =>
    assert.ok(
      buscar({
        categoria: "publicacoes",
        intencao: "publicar",
        profissao: "fotografo",
      }).artigos.some(a => a.id === id)
    )
  );
  ok(() =>
    assert.ok(
      !buscar({ categoria: "seguranca" }).artigos.some(a => a.id === id)
    )
  );
  ok(() =>
    assert.ok(!buscar({ profissao: "dj" }).artigos.some(a => a.id === id))
  );
  ok(() => assert.ok(buscar({}, "consumidor").artigos.some(a => a.id === id)));
  ok(() =>
    assert.ok(!buscar({ q: "sem-correspondencia-central" }).artigos.length)
  );

  // Nova edição não altera o snapshot vigente até nova revisão/publicação.
  const publicadaAntes = m.lerArtigo("leitor", slug, false);
  const versaoAntes = editorial(id).versao;
  m.salvarArtigo(
    "editor2",
    dados({
      titulo: "Publicar uma galeria e apresentar a equipe",
      versao: versaoAntes,
    }),
    id
  );
  ok(() =>
    assert.equal(
      m.lerArtigo("leitor", slug, false).titulo,
      publicadaAntes.titulo
    )
  );
  ok(() =>
    assert.throws(() =>
      m.salvarArtigo("editor", dados({ versao: versaoAntes }), id)
    )
  );
  ok(() => assert.throws(() => transicao(id, "publicar")));
  publicar(id);
  const atual = m.lerArtigo("leitor", editorial(id).slug, false);
  ok(() => assert.equal(atual.id, id));
  ok(() =>
    assert.equal(atual.titulo, "Publicar uma galeria e apresentar a equipe")
  );
  ok(() => assert.equal(atual.passos.length, 2));
  ok(() => assert.equal(editorial(id).autor, "editor"));
  ok(() => assert.ok(buscar({ q: "galeria" }).artigos.some(a => a.id === id)));
  ok(() =>
    assert.throws(() =>
      m.transicionarArtigo("editor", id, {
        acao: "arquivar",
        versao: editorial(id).versao,
        motivo: "",
      })
    )
  );

  await aguardar(5);
  const segundo = m.salvarArtigo(
    "admin",
    dados({
      titulo: "Proteja sua conta e seus arquivos",
      categoria: "seguranca",
      intencao: "resolver",
      profissoes: [],
    })
  );
  transicao(segundo, "revisar", "admin");
  transicao(segundo, "publicar", "admin");
  ok(() => assert.equal(buscar().recentes[0].id, segundo));
  const arquivoSlug = editorial(segundo).slug;
  transicao(segundo, "arquivar", "admin");
  ok(() => assert.ok(!buscar().artigos.some(a => a.id === segundo)));
  ok(() => assert.ok(!buscar().recentes.some(a => a.id === segundo)));
  ok(() => assert.throws(() => m.lerArtigo("leitor", arquivoSlug, false)));
  transicao(segundo, "reabrir", "admin");
  ok(() => assert.notEqual(estado(segundo), "publicado"));
  ok(() => assert.ok(!buscar().artigos.some(a => a.id === segundo)));

  // Acesso, pessoas distintas e avaliação são métricas diferentes.
  const slugAtual = editorial(id).slug;
  const inicial = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(inicial.acessos, 0));
  ok(() => assert.equal(inicial.usuarios, 0));
  ok(() => assert.equal(inicial.avaliacoes, 0));
  ok(() => assert.ok(inicial.aprovacao === null || inicial.aprovacao === 0));
  ok(() => assert.ok(inicial.taxa === null || inicial.taxa === 0));
  m.lerArtigo("leitor", slugAtual);
  m.lerArtigo("leitor", slugAtual);
  const umaPessoa = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(umaPessoa.acessos, 1));
  ok(() => assert.equal(umaPessoa.usuarios, 1));
  m.lerArtigo("consumidor", slugAtual);
  const duasPessoas = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(duasPessoas.acessos, 2));
  ok(() => assert.equal(duasPessoas.usuarios, 2));
  db.prepare(
    "UPDATE central_visitas SET ultimo_em=? WHERE artigo_id=? AND usuario_id='leitor'"
  ).run(Date.now() - 31 * 60000, id);
  m.lerArtigo("leitor", slugAtual);
  const retorno = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(retorno.acessos, 3));
  ok(() => assert.equal(retorno.usuarios, 2));
  ok(() =>
    assert.throws(() => m.feedbackArtigo("leitor", slugAtual, { util: "nao" }))
  );
  ok(() =>
    assert.throws(() =>
      m.feedbackArtigo("leitor", slugAtual, {
        util: "nao",
        motivo: "inexistente",
      })
    )
  );
  ok(() =>
    assert.throws(() =>
      m.feedbackArtigo("leitor", slugAtual, {
        util: "nao",
        motivo: "outro",
        comentario: "curto",
      })
    )
  );
  m.feedbackArtigo("leitor", slugAtual, { util: "sim" });
  m.feedbackArtigo("leitor", slugAtual, { util: "sim" });
  let metricas = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(metricas.avaliacoes, 1));
  ok(() => assert.equal(metricas.uteis, 1));
  ok(() => assert.equal(metricas.negativas, 0));
  m.feedbackArtigo("consumidor", slugAtual, {
    util: "nao",
    motivo: "confusa",
    comentario: "O segundo passo poderia trazer um exemplo mais direto.",
  });
  metricas = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(metricas.avaliacoes, 2));
  ok(() => assert.equal(metricas.negativas, 1));
  ok(() => assert.equal(metricas.uteis, 1));
  ok(() => assert.equal(metricas.aprovacao, 50));
  ok(() => assert.ok(Number.isFinite(metricas.taxa)));
  m.feedbackArtigo("leitor", slugAtual, { util: "nao", motivo: "incompleta" });
  metricas = qualidade({ artigo: id }).totais;
  ok(() => assert.equal(metricas.avaliacoes, 2));
  ok(() => assert.equal(metricas.negativas, 2));
  ok(() => assert.equal(metricas.uteis, 0));
  m.feedbackArtigo("leitor", slugAtual, { util: "sim" });
  ok(() =>
    assert.ok(qualidade({ artigo: id }).evolucao.some(x => x.acessos > 0))
  );
  ok(() => assert.ok(qualidade({ artigo: id }).historico.length >= 3));
  ok(() =>
    assert.ok(
      qualidade({ categoria: "seguranca" }).artigos.every(
        a => a.categoria === "seguranca"
      )
    )
  );
  ok(() => assert.ok(qualidade({}, "admin").artigos.length >= 1));

  // Busca sem resultado só gera lacuna com autorização e não conserva identidade pessoal.
  const termoPrivado = "duvida reservada privada";
  const antesLacunas = qualidade().lacunas.length;
  buscar({ q: termoPrivado });
  ok(() => assert.equal(qualidade().lacunas.length, antesLacunas));
  m.preferenciaCentral("leitor", true);
  ok(() => assert.equal(buscar().registrarPesquisas, true));
  buscar({ q: "freestyle sem palco" });
  const lacunas = qualidade().lacunas;
  ok(() => assert.ok(lacunas.some(l => l.termo === "freestyle sem palco")));
  const repetidaAntes = lacunas.find(
    l => l.termo === "freestyle sem palco"
  ).total;
  buscar({ q: "freestyle sem palco" });
  ok(() =>
    assert.equal(
      qualidade().lacunas.find(l => l.termo === "freestyle sem palco").total,
      repetidaAntes
    )
  );
  const dadosLacuna = JSON.stringify(lacunas);
  ok(() => assert.ok(!dadosLacuna.includes("leitor@test.example")));
  ok(() => assert.ok(!dadosLacuna.includes('"usuario_id"')));
  buscar({ q: "email leitor@test.example identificador 123456789" });
  const sensiveis = JSON.stringify(qualidade().lacunas);
  ok(() => assert.ok(!sensiveis.includes("leitor@test.example")));
  ok(() => assert.ok(!sensiveis.includes("123456789")));
  m.preferenciaCentral("leitor", false);
  ok(() => assert.equal(buscar().registrarPesquisas, false));
  buscar({ q: "nova duvida depois de retirar consentimento" });
  ok(() =>
    assert.ok(
      !qualidade().lacunas.some(
        l => l.termo === "nova duvida depois de retirar consentimento"
      )
    )
  );

  // Conteúdo editorial continua texto: um exemplo não pode executar HTML do autor.
  const xss = m.salvarArtigo(
    "editor",
    dados({
      titulo: "Exemplo de texto com caracteres especiais",
      exemplo:
        "Exemplo ilustrativo: <script>window.TESTE_CENTRAL_XSS=1</script>",
    })
  );
  publicar(xss);
  const xssSlug = editorial(xss).slug;

  // Renderização e proteção HTTP reais, incluindo cookies administrativos separados.
  const app = express();
  await configurarNavegacaoTeste(app);
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  app.locals.icones = new Proxy({}, { get: () => "<svg></svg>" });
  app.locals.rotuloProfissional = x => x;
  Object.assign(
    app.locals,
    identidade,
    await import("../dist/src/app/models/catalogoDemonstrativo.js")
  );
  const { protegerEscrita } =
    await import("../dist/src/app/middlewares/seguranca.js");
  const { default: routes } =
    await import("../dist/src/app/routes/rotasCypher.js");
  app.use(
    express.urlencoded({ extended: true, limit: "512kb" }),
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
    csrf = "c".repeat(64);
  const users = [
    "leitor",
    "outro",
    "consumidor",
    "admin",
    "editor",
    "moderador",
  ];
  const cookies = Object.fromEntries(
    users.map(id => [
      id,
      "cypher_csrf=" +
        csrf +
        "; " +
        (["admin", "editor", "moderador"].includes(id)
          ? "cypher_admin_session"
          : "cypher_session") +
        "=" +
        auth.iniciarSessao(id),
    ])
  );
  const request = (url, id = "leitor", options = {}) =>
    fetch(host + url, {
      redirect: "manual",
      ...options,
      headers: { cookie: cookies[id], ...(options.headers || {}) },
    });
  const post = (url, body, id = "leitor") =>
    request(url, id, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify(body),
    });
  for (const [url, ator] of [
    ["/central", "leitor"],
    ["/central?q=galeria", "consumidor"],
    ["/central/" + slugAtual, "leitor"],
    ["/admin/central", "editor"],
    ["/admin/central/new", "editor"],
    ["/admin/central/" + id + "/edit", "editor"],
    ["/admin/central/quality", "editor"],
    ["/admin/central/searches", "editor"],
    ["/admin/central/reviews", "admin"],
  ]) {
    const r = await request(url, ator),
      html = await r.text();
    ok(() => assert.equal(r.status, 200, url + ": " + html.slice(0, 1200)));
    ok(() => assert.ok(!html.includes("[object Object]")));
    if (url.startsWith("/central")) {
      ok(() => assert.ok(!html.includes("editor@admin.example.test")));
      ok(() => assert.ok(!html.includes("data-central-search")));
    }
  }
  const xssHtml = await (await request("/central/" + xssSlug)).text();
  ok(() => assert.ok(!xssHtml.includes("<script>window.TESTE_CENTRAL_XSS")));
  ok(() =>
    assert.ok(xssHtml.includes("&lt;script&gt;window.TESTE_CENTRAL_XSS"))
  );
  const centralHtml = await (await request("/central")).text();
  ok(() => assert.ok(centralHtml.includes("/central/" + slugAtual)));
  const anon = await fetch(host + "/central", { redirect: "manual" });
  ok(() => assert.equal(anon.status, 302));
  const anonArticle = await fetch(host + "/central/" + slugAtual, {
    redirect: "manual",
  });
  ok(() => assert.equal(anonArticle.status, 302));
  const semPapel = await request("/admin/central", "moderador"),
    convencional = await request("/admin/central", "leitor");
  ok(() => assert.equal(semPapel.status, 403));
  ok(() => assert.equal(convencional.status, 403));
  const fakeCookie =
    "cypher_csrf=" + csrf + "; cypher_session=" + auth.iniciarSessao("editor");
  const editorForjado = await request("/central", "editor", {
      headers: { cookie: fakeCookie },
    }),
    arquivadoHttp = await request("/central/" + arquivoSlug);
  ok(() => assert.equal(editorForjado.status, 403));
  ok(() => assert.equal(arquivadoHttp.status, 404));
  const noCsrf = await request(
    "/central/" + slugAtual + "/feedback",
    "leitor",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ util: "sim" }),
    }
  );
  ok(() => assert.equal(noCsrf.status, 403));
  const feedbackErrado = await post("/central/" + slugAtual + "/feedback", {
    util: "nao",
  });
  ok(() => assert.equal(feedbackErrado.status, 400));
  const feedbackCerto = await post("/central/" + slugAtual + "/feedback", {
    util: "nao",
    motivo: "desatualizada",
  });
  ok(() => assert.equal(feedbackCerto.status, 303));
  const permissaoEditorial = await post(
    "/admin/central",
    dados({ titulo: "Tentativa indevida de editar" }),
    "moderador"
  );
  ok(() => assert.equal(permissaoEditorial.status, 403));
  const novaHttp = await post(
    "/admin/central",
    dados({ titulo: "Artigo criado pelo editor via HTTP" }),
    "editor"
  );
  ok(() => assert.equal(novaHttp.status, 303));
  const ver = editorial(id).versao;
  const concorrentes = await Promise.all([
    post(
      "/admin/central/" + id,
      dados({ versao: ver, titulo: "Uma edição concorrente" }),
      "editor"
    ),
    post(
      "/admin/central/" + id,
      dados({ versao: ver, titulo: "Outra edição concorrente" }),
      "editor"
    ),
  ]);
  ok(() =>
    assert.deepEqual(concorrentes.map(r => r.status).sort(), [303, 409])
  );

  // Seeding explícito idempotente e reinicialização preservam conteúdo/editoria existentes.
  m.prepararCentralInicial("admin");
  const quantidadeSeed = m.artigosEditoriais("admin").length;
  m.prepararCentralInicial("admin");
  ok(() => assert.equal(m.artigosEditoriais("admin").length, quantidadeSeed));
  ok(() => assert.ok(quantidadeSeed >= 2));
  const historicoAntes = qualidade({ artigo: id }).historico.length;
  const totalAntes = m.artigosEditoriais("admin").length;
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  ok(() => assert.equal(m.artigosEditoriais("admin").length, totalAntes));
  ok(() =>
    assert.equal(qualidade({ artigo: id }).historico.length, historicoAntes)
  );
  ok(() =>
    assert.equal(m.pesquisarCentral("leitor", {}).registrarPesquisas, false)
  );
  const aposRetencao = m.qualidadeCentral(
    "editor",
    { dias: "90", artigo: id },
    Date.now() + 91 * 86400000
  );
  ok(() => assert.equal(aposRetencao.totais.acessos, 0));
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM central_visitas").get().n,
      0
    )
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM central_lacunas").get().n,
      0
    )
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM central_buscas_dedupe").get().n,
      0
    )
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  console.log(
    `Cypher Central: ${checks} verificações passaram; ciclo editorial, snapshots, busca, feedback, métricas, privacidade, permissões, persistência e HTTP.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
