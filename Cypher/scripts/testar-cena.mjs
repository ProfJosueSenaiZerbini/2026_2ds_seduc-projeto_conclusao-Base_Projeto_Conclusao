import { configurarNavegacaoTeste } from "./locais-navegacao-teste.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import express from "express";
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-cena-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "cena.sqlite");
const b = await import("../dist/src/app/models/bancoDados.js"),
  m = await import("../dist/src/app/models/catalogoCena.js"),
  conteudo = await import("../dist/src/app/models/cenaConteudo.js"),
  beat = await import("../dist/src/app/models/licenciamentoBeats.js"),
  auth = await import("../dist/src/app/models/autenticacaoCypher.js");
let server,
  checks = 0;
const ok = f => {
  f();
  checks++;
};
try {
  b.inicializarBancoCypher();
  const db = b.conexaoInternaCypher();
  b.criarContaCypher({
    id: "visitante",
    email: "visitante@example.test",
    senhaHash: "hash",
    tipoConta: "profissional",
    nome: "Pessoa existente",
    nomePublico: true,
    funcao: "Rapper",
    identificador: "@papatinho",
    iniciais: "PE",
    categorias: ["Rapper", "Beatmaker"],
    outraCategoria: "",
  });
  db.prepare(
    "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
  ).run("visitante");
  db.prepare(
    "INSERT INTO usuarios(id,tipo_conta,demonstracao) VALUES('organizacao-legada','profissional',1)"
  ).run();
  const eventosLegados = [
    "demo-evento-batalha",
    "demo-evento-cypher",
    "demo-evento-show",
    "demo-destaque-mulheres-no-mic",
    "demo-destaque-roda-da-madrugada",
    "demo-destaque-voz-da-praca",
    "demo-workshop-dj-producao",
    "demo-workshop-slam-poesia",
    "demo-workshop-beatbox",
  ];
  for (const id of eventosLegados)
    db.prepare(
      "INSERT INTO eventos(id,proprietario_id,titulo,categoria,data_texto,demonstracao) VALUES(?,'organizacao-legada',?,'Encontro','2026-12-20',1)"
    ).run(id, id);
  const r = m.semearCatalogoCena({ audioSintetico: true, gerarArte: false });
  const descoberta = await import("../dist/src/app/models/modeloDescoberta.js");
  ok(() =>
    assert.equal(
      b.listarEventosCypher({ ordem: "recentes" }, "visitante").length,
      eventosLegados.length
    )
  );
  ok(() =>
    assert.equal(
      descoberta.publicacoesDescoberta("eventos", "", false, "visitante")
        .length,
      eventosLegados.length
    )
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM eventos WHERE demonstracao=1").get().n,
      0
    )
  );
  ok(() => assert.equal(r.perfis, 40));
  ok(() =>
    assert.equal(
      db.prepare("SELECT nome FROM perfis WHERE usuario_id='visitante'").get()
        .nome,
      "Pessoa existente"
    )
  );
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT identificador FROM perfis WHERE usuario_id=?")
        .get(m.idPessoaCena("papatinho")).identificador,
      "@papatinho.cena"
    )
  );
  const profs = await import("../dist/src/app/models/modeloPerfil.js");
  for (const p of profs.profissoesCatalogo)
    ok(() =>
      assert.ok(
        db
          .prepare(
            "SELECT count(DISTINCT pu.usuario_id) n FROM profissoes_usuario pu JOIN catalogo_cena c ON c.tipo='perfil' AND c.id=pu.usuario_id WHERE pu.profissao_id=? AND pu.estado='ativa'"
          )
          .get(p.id).n >= 2,
        p.id
      )
    );
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM usuarios u JOIN catalogo_cena c ON c.tipo='perfil' AND c.id=u.id WHERE u.email IS NOT NULL OR u.senha_hash IS NOT NULL"
        )
        .get().n,
      0
    )
  );
  const tabelas = [
    "usuarios",
    "obras",
    "creditos",
    "projetos_trabalho",
    "colaboracoes",
    "oportunidades_profissionais",
    "candidaturas_oportunidade",
    "beats",
    "ofertas_beats",
    "beat_oferta_versoes",
    "beat_arquivos",
    "profissionais_seguidos",
    "comentarios_conteudo",
    "eventos",
    "eventos_configuracoes",
  ];
  const antes = Object.fromEntries(
    tabelas.map(t => [t, db.prepare("SELECT count(*) n FROM " + t).get().n])
  );
  m.semearCatalogoCena({ audioSintetico: true, gerarArte: false });
  for (const t of tabelas)
    ok(() =>
      assert.equal(
        db.prepare("SELECT count(*) n FROM " + t).get().n,
        antes[t],
        t
      )
    );
  for (const obra of conteudo.encontrosCena) {
    ok(() =>
      assert.ok(
        db
          .prepare(
            "SELECT 1 FROM obras WHERE id=? AND link_escuta='' AND demonstracao=0"
          )
          .get(obra.id)
      )
    );
    ok(() =>
      assert.ok(
        db
          .prepare(
            "SELECT count(*) n FROM creditos WHERE obra_id=? AND usuario_creditado_id IS NOT NULL AND verificado=1"
          )
          .get(obra.id).n >= 3
      )
    );
  }
  const pap = m.idPessoaCena("papatinho"),
    lez = m.idPessoaCena("lezin");
  const rede = m.conexoesCena("visitante", lez);
  ok(() => assert.ok(rede.conexoes.some(p => p.id === pap)));
  ok(() => assert.match(rede.nucleo, /Papatunes/));
  ok(() =>
    assert.ok(
      m
        .conexoesCena("visitante", pap)
        .destaques.some(v => v.url.startsWith("/p/"))
    )
  );
  for (const pessoa of conteudo.pessoasCena) {
    const redePessoa = m.conexoesCena("visitante", m.idPessoaCena(pessoa.slug));
    ok(() =>
      assert.ok(
        redePessoa.totalTrabalhos === 0 || redePessoa.destaques.length > 0,
        pessoa.slug
      )
    );
  }
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM comentarios_conteudo WHERE id LIKE 'cena-%'"
        )
        .get().n,
      conteudo.encontrosCena.reduce(
        (total, obra) => total + (conteudo.conversasCena[obra.id]?.length || 0), 0
      )
    )
  );
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM profissionais_seguidos WHERE seguidor_id='visitante' OR profissional_id='visitante'"
        )
        .get().n,
      0
    )
  );
  const p = await import("../dist/src/app/models/portfolio.js");
  ok(() => assert.ok(p.portfolioDisponivel(lez, "visitante")));
  const disponivel = beat.fichaBeat("visitante", "demo-beat-parece-sorte");
  const premium = disponivel.ofertas.find(o => o.modalidade === "premium");
  ok(() => assert.equal(premium.preco_centavos, 7990));
  const pedido = beat.criarPedidoBeat("visitante", disponivel.id, premium.id, {
    versao: premium.versao_id,
    aceite: "sim",
    chave_envio: randomUUID(),
  });
  ok(() =>
    assert.equal(beat.pedidoBeat("visitante", pedido).checkoutCatalogo, true)
  );
  ok(() =>
    assert.throws(
      () => beat.downloadBeat("visitante", pedido, premium.arquivos[0]),
      e => e.status === 403
    )
  );
  beat.confirmarLicencaCatalogo("visitante", pedido);
  beat.confirmarLicencaCatalogo("visitante", pedido);
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT count(*) n FROM beat_licencas WHERE pedido_id=?")
        .get(pedido).n,
      1
    )
  );
  ok(() =>
    assert.equal(beat.pedidoBeat("visitante", pedido).pagamento_id, null)
  );
  ok(() =>
    assert.ok(beat.downloadBeat("visitante", pedido, premium.arquivos[0]))
  );
  for (const id of ["demo-beat-visao-de-rua", "demo-beat-spider-man"]) {
    const vendido = beat.fichaBeat("visitante", id);
    ok(() => assert.equal(vendido.vendidoExclusivo, true));
    ok(() =>
      assert.throws(
        () =>
          beat.criarPedidoBeat("visitante", id, vendido.ofertas[0].id, {
            aceite: "sim",
            versao: vendido.ofertas[0].versao_id,
            chave_envio: randomUUID(),
          }),
        e => e.status === 409
      )
    );
  }
  const real = b.criarBeatCypher("visitante", {
    title: "Obra que não pertence ao catálogo",
    bpm: "90",
    key: "",
    genre: "Rap",
    license: "Não informada",
    duration: "",
    description: "",
    usage: "",
    vendaExclusiva: false,
    ofertas: [],
  });
  const arquivoReal = beat.uploadArquivoBeat(
    "visitante",
    real,
    "original.mp3",
    "entrega",
    Buffer.from("ID3arquivo-particular")
  );
  const ofertaReal = beat.salvarOfertaBeat("visitante", real, {
    modalidade: "premium",
    versao: 0,
    titulo: "Oferta particular",
    preco: "50",
    usos: "Gravação de uma faixa com voz.",
    restricoes: "Não autoriza revenda do instrumental.",
    creditos: "Crédito ao produtor",
    limites: "Uma faixa por licença",
    entregaveis: "Arquivo MP3 original",
    arquivos: [arquivoReal.id],
  });
  const versaoReal = beat
    .fichaBeat(pap, real)
    .ofertas.find(o => o.id === ofertaReal);
  const pedidoReal = beat.criarPedidoBeat(pap, real, ofertaReal, {
    aceite: "sim",
    versao: versaoReal.versao_id,
    chave_envio: randomUUID(),
  });
  ok(() =>
    assert.equal(beat.pedidoBeat(pap, pedidoReal).checkoutCatalogo, false)
  );
  ok(() =>
    assert.throws(
      () => beat.confirmarLicencaCatalogo(pap, pedidoReal),
      e => e.status === 403
    )
  );
  const app = express();
  await configurarNavegacaoTeste(app);
  app.set("view engine", "ejs");
  app.set("views", path.resolve("views"));
  const icons = await import("lucide-static");
  const source = fs
    .readFileSync("src/aplicacao.ts", "utf8")
    .split("const icones = {")[1]
    .split("\n};")[0];
  app.locals.icones = Object.fromEntries(
    [...source.matchAll(/(\w+):\s*(\w+)/g)].map(([, k, n]) => [k, icons[n]])
  );
  Object.assign(
    app.locals,
    await import("../dist/src/app/models/identidadeUsuario.js"),
    await import("../dist/src/app/models/catalogoDemonstrativo.js")
  );
  app.locals.rotuloProfissional = (
    await import("../dist/src/app/models/tratamentoProfissional.js")
  ).rotuloProfissional;
  app.locals.resumoReputacao = (
    await import("../dist/src/app/models/colaboracoes.js")
  ).resumoReputacao;
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
  app.use((e, req, res, next) => res.status(e.status || 500).send(e.message));
  server = app.listen(0, "127.0.0.1");
  await new Promise(r => server.once("listening", r));
  const host = "http://127.0.0.1:" + server.address().port,
    csrf = "c".repeat(64),
    cookie =
      "cypher_csrf=" +
      csrf +
      "; cypher_session=" +
      auth.iniciarSessao("visitante");
  const req = (url, options = {}) =>
    fetch(host + url, {
      redirect: "manual",
      ...options,
      headers: { cookie, ...options.headers },
    });
  const outro = beat
    .fichaBeat("visitante", "demo-beat-desde-ontem")
    .ofertas.find(o => o.modalidade === "premium");
  const novoPedido = beat.criarPedidoBeat(
    "visitante",
    "demo-beat-desde-ontem",
    outro.id,
    { versao: outro.versao_id, aceite: "sim", chave_envio: randomUUID() }
  );
  const pages = [
    ["descoberta", "/"],
    ["lancamentos", "/dashboard?tipo=musica&q=profetiza"],
    ["lancamento-beat", "/dashboard?tipo=musica&q=vice%20city"],
    ["beats", "/beats"],
    ["beat", "/beats/demo-beat-parece-sorte"],
    ["vendido", "/beats/demo-beat-visao-de-rua"],
    ["papatinho", "/p/papatinho.cena"],
    ["lezin", "/p/lezin"],
    ["perfil-proprio", "/profile"],
    ["perfil-atuacao", "/p/lezin?aba=atuacao&atuacao=Letrista"],
    ["perfil-creditos", "/p/papatinho.cena?aba=creditos&atuacao=Produtor%28a%29"],
    ["perfil-ficha", "/p/lezin?obra=cena-obra-sem-atalho"],
    ["perfil-album", "/p/lezin?obra=demo-album-profetiza"],
    ["obras", "/works"],
    ["eventos", "/events?localizacao="],
    ["conversa", "/interacoes/obra/cena-obra-sem-atalho"],
    ["projetos", "/work-projects"],
    ["oportunidades", "/opportunities"],
    ["portfolio", "/portfolio/lezin"],
    ["pedido", "/purchases/" + novoPedido],
    ["checkout", "/purchases/" + novoPedido + "/checkout"],
  ];
  ok(() => assert.equal(conteudo.projetosCena.length, 0));
  const projetoRetirado = await req("/work-projects/cena-projeto-corpo");
  ok(() => assert.equal(projetoRetirado.status, 404));
  for (const [nome, url] of pages) {
    const response = await req(url),
      html = await response.text();
    ok(() => assert.equal(response.status, 200, url + ": " + html.slice(0, 300)));
    const visivel = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, " ");
    const principal = html.match(/<main[^>]*>[\s\S]*?<\/main>/)?.[0] ?? "";
    if (nome === "perfil-proprio") {
      ok(() => assert.match(principal, /Editar perfil/));
      ok(() => assert.doesNotMatch(principal, /\/cena\/perfis\/papatinho\.jpg/));
    }
    if (nome === "lezin") {
      ok(() => assert.match(principal, /\/img\/Rappers\/LEZIN\.jpg/));
      ok(() => assert.doesNotMatch(principal, /Organizar portfólio|Alterar foto e capa/));
    }
    if (nome === "perfil-atuacao") {
      const experiencia = principal.split('class="pf-experience"')[1];
      ok(() => assert.match(experiencia, /<summary>Letrista\s*</));
      ok(() => assert.doesNotMatch(experiencia, /<summary>Rapper\s*</));
    }
    if (nome === "perfil-creditos") {
      ok(() => assert.match(principal, /<h3>Sem Atalho<\/h3>/));
      ok(() => assert.doesNotMatch(principal, /<h3>Predestinadão<\/h3>/));
    }
    if (nome === "perfil-ficha") {
      ok(() => assert.match(principal, /id="obra-cena-obra-sem-atalho"/));
      ok(() => assert.match(principal, /Créditos confirmados/));
    }
    if (nome === "perfil-album") {
      ok(() => assert.match(principal, /href="\/p\/lezin\?obra=demo-album-profetiza-faixa-1">Intro<\/a>/));
    }
    if (nome === "conversa")
      ok(() => assert.match(visivel, /Essa começou com uma guia de voz/));
    if (nome === "descoberta") {
      ok(() => assert.match(principal, /href="\/dashboard\?tipo=musica"[^>]*>Ver mais/));
      const formatos = [...principal.matchAll(/data-release-format="([^"]+)"/g)].map(m => m[1]).sort();
      ok(() => assert.deepEqual(formatos, ["album", "beat", "ep", "faixa"]));
      ok(() => assert.doesNotMatch(principal, /class="dc-release-action"/));
      const slides = [...html.matchAll(/class="dc-slide"[\s\S]*?<\/a>/g)].map(
        m => m[0]
      );
      ok(() => assert.equal(slides.length, 10));
      ok(() => assert.ok(slides.some(s => s.includes("Lezin"))));
      ok(() => assert.ok(slides.some(s => s.includes("Levinsk"))));
      ok(() => assert.ok(slides.some(s => s.includes("Parece Sorte"))));
      ok(() =>
        assert.ok(
          slides.some(s => s.includes("demo-destaque-roda-da-madrugada"))
        )
      );
      ok(() => assert.doesNotMatch(html, /\/img\/descoberta\/cena\//));
      for (const slide of slides) {
        const caminho = slide.match(/src="\/img\/([^\"]+)"/)?.[1];
        ok(() =>
          assert.ok(
            caminho && fs.existsSync(path.join("public/img", caminho)),
            caminho
          )
        );
      }
    }
    if (nome === "lancamentos") {
      ok(() => assert.match(principal, /data-release-format="album"[\s\S]*?14 faixas/));
      ok(() => assert.match(principal, /data-release-open aria-label="Abrir faixa Profetiza"/));
      ok(() => assert.match(principal, /data-release-track="\/audio\/Profetiza\/1\./));
      ok(() => assert.match(principal, /src="\/audio\/Profetiza_MP3_256kbps\.mp3"/));
    }
    if (nome === "lancamento-beat") {
      ok(() => assert.match(principal, /data-release-format="beat"/));
      ok(() => assert.match(principal, /src="\/audio\/beats\/[^"]*VICE_CITY/));
    }
    ok(() =>
      assert.doesNotMatch(
        visivel,
        /demonstração|demonstrativ[ao]|simulação|\bteste\b|fictício/i,
        nome
      )
    );
    if (process.env.CYPHER_QA_OUTPUT) {
      const out = path.resolve(process.env.CYPHER_QA_OUTPUT);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, nome + ".html"), html);
    }
  }
  db.prepare("UPDATE obras SET publicada=0 WHERE id=?").run("demo-album-profetiza-faixa-1");
  const semFaixa = await (await req("/dashboard?tipo=musica&q=profetiza")).text();
  ok(() => assert.match(semFaixa, /13 faixas/));
  ok(() => assert.doesNotMatch(semFaixa, /data-release-track="\/audio\/Profetiza\/1\./));
  db.prepare("UPDATE obras SET publicada=1 WHERE id=?").run("demo-album-profetiza-faixa-1");
  const credito = db.prepare("SELECT id FROM creditos WHERE obra_id='cena-obra-sem-atalho' AND usuario_creditado_id=? AND verificado=1").get(pap);
  db.prepare("UPDATE creditos SET verificado=0 WHERE id=?").run(credito.id);
  const semCredito = await (await req("/p/papatinho.cena?aba=creditos&atuacao=Produtor%28a%29")).text();
  ok(() => assert.doesNotMatch(semCredito, /<h3>Sem Atalho<\/h3>/));
  db.prepare("UPDATE creditos SET verificado=1 WHERE id=?").run(credito.id);
  const conversaUrl = "/interacoes/obra/cena-obra-sem-atalho";
  const conversaResponse = await req(conversaUrl, {
    headers: { Accept: "application/json" },
  });
  const conversaJson = await conversaResponse.json();
  ok(() => assert.equal(conversaResponse.status, 200));
  ok(() => assert.match(conversaJson.html, /class="ci-avatar"/));
  ok(() => assert.match(conversaJson.html, /\/img\//));
  if (process.env.CYPHER_QA_OUTPUT)
    fs.writeFileSync(
      path.join(path.resolve(process.env.CYPHER_QA_OUTPUT), "conversa.json"),
      JSON.stringify(conversaJson)
    );
  const postConversa = (url, body, token = csrf) =>
    req(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": token,
      },
      body: JSON.stringify(body),
    });
  const bodyComentario = {
    texto: "Troca pelo painel <script>alert(1)</script>",
    envio: randomUUID(),
  };
  const semToken = await postConversa(
    conversaUrl + "/comentarios",
    bodyComentario,
    ""
  );
  ok(() => assert.equal(semToken.status, 403));
  const publicado = await postConversa(
    conversaUrl + "/comentarios",
    bodyComentario
  );
  const publicadoJson = await publicado.json();
  ok(() => assert.equal(publicado.status, 200));
  ok(() =>
    assert.match(publicadoJson.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  );
  const meu = db
    .prepare("SELECT * FROM comentarios_conteudo WHERE chave_envio=?")
    .get(bodyComentario.envio);
  const repetido = await postConversa(
    conversaUrl + "/comentarios",
    bodyComentario
  );
  ok(() => assert.equal(repetido.status, 200));
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM comentarios_conteudo WHERE chave_envio=?"
        )
        .get(bodyComentario.envio).n,
      1
    )
  );
  const editado = await postConversa(
    conversaUrl + "/comentarios/" + meu.id + "/editar",
    { texto: "Comentário atualizado no painel", versao: String(meu.versao) }
  );
  const editadoJson = await editado.json();
  ok(() => assert.match(editadoJson.html, /Comentário atualizado no painel/));
  const terceiro = await postConversa(
    conversaUrl + "/comentarios/cena-obra-sem-atalho-conversa-0/excluir",
    { versao: "1" }
  );
  ok(() => assert.equal(terceiro.status, 404));
  const excluido = await postConversa(
    conversaUrl + "/comentarios/" + meu.id + "/excluir",
    { versao: String(meu.versao + 1) }
  );
  const excluidoJson = await excluido.json();
  ok(() => assert.equal(excluido.status, 200));
  ok(() =>
    assert.doesNotMatch(excluidoJson.html, /Comentário atualizado no painel/)
  );
  const revisaoLicenca = await req("/purchases/" + novoPedido + "/checkout");
  const htmlLicenca = await revisaoLicenca.text();
  ok(() => assert.equal(revisaoLicenca.status, 200));
  ok(() => assert.match(htmlLicenca, /Sem cobrança/));
  ok(() => assert.match(htmlLicenca, /Confirmar licença/));
  const semCsrf = await req("/purchases/" + novoPedido + "/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"confirmacao":"sim"}',
  });
  ok(() => assert.equal(semCsrf.status, 403));
  const semConfirm = await req("/purchases/" + novoPedido + "/confirm", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: "{}",
  });
  ok(() => assert.equal(semConfirm.status, 400));
  const confirmada = await req("/purchases/" + novoPedido + "/confirm", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: '{"confirmacao":"sim"}',
  });
  ok(() => assert.equal(confirmada.status, 303));
  ok(() =>
    assert.equal(beat.pedidoBeat("visitante", novoPedido).estado, "aprovado")
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  console.log(
    `Cena: ${checks} verificações passaram; 25 profissões, identidades preservadas, carga idempotente, créditos, conexões, ofertas, exclusividade, aquisição local restrita, CSRF, privacidade e páginas.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
