import { configurarNavegacaoTeste } from "./locais-navegacao-teste.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID, createHmac } from "node:crypto";
import express from "express";
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-beats-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
process.env.CYPHER_MP_ENV = "test";
process.env.CYPHER_PUBLIC_URL = "https://cypher.example.test";
const b = await import("../dist/src/app/models/bancoDados.js");
const m = await import("../dist/src/app/models/licenciamentoBeats.js");
const pg = await import("../dist/src/app/models/mercadoPagoTeste.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
let db,
  server,
  checks = 0;
const ok = f => {
    f();
    checks++;
  },
  recusar = (f, status) =>
    ok(() => assert.throws(f, e => !status || e.status === status));
const okAsync = async f => {
  await f();
  checks++;
};
const falhar = async (f, status) => {
  await assert.rejects(f, e => !status || e.status === status);
  checks++;
};
try {
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  for (const [id, tipo, categorias] of [
    ["produtor", "profissional", ["Beatmaker"]],
    ["produtormusical", "profissional", ["Produtor(a)"]],
    ["comprador", "consumidor", []],
    ["outro", "profissional", ["Rapper"]],
    ["segundo", "consumidor", []],
  ]) {
    b.criarContaCypher({
      id,
      email: id + "@example.test",
      senhaHash: "teste",
      tipoConta: tipo,
      nome: id,
      funcao: categorias.join(""),
      identificador: "@" + id,
      iniciais: "TT",
      categorias,
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
  }
  const criar = (autor="produtor") =>
    b.criarBeatCypher(autor, {
      title: "Batida da cena",
      bpm: "92",
      key: "Dm",
      genre: "Boom bap",
      license: "Free Use",
      duration: "2:30",
      description: "Instrumental original de teste.",
      usage: "Consulte cada oferta.",
      vendaExclusiva: false,
      ofertas: [],
    });
  const beat = criar();
  const beatDoProdutor=criar("produtormusical");
  ok(()=>assert.equal(m.gestaoBeat("produtormusical",beatDoProdutor).produtor_id,"produtormusical"));
  recusar(() => m.gestaoBeat("outro", beat), 404);
  recusar(
    () =>
      m.uploadArquivoBeat(
        "comprador",
        beat,
        "som.mp3",
        "entrega",
        Buffer.from("ID3audio")
      ),
    404
  );
  recusar(
    () =>
      m.uploadArquivoBeat(
        "produtor",
        beat,
        "malicioso.mp3",
        "entrega",
        Buffer.from("<script>")
      ),
    400
  );
  recusar(
    () =>
      m.uploadArquivoBeat(
        "produtor",
        beat,
        "grande.mp3",
        "previa",
        Buffer.alloc(12 * 1024 * 1024 + 1)
      ),
    400
  );
  const entrega = m.uploadArquivoBeat(
    "produtor",
    beat,
    "master.wav",
    "entrega",
    Buffer.from("RIFF1234WAVEdata000000000000000000000000")
  );
  const stems = m.uploadArquivoBeat(
    "produtor",
    beat,
    "versao-ogg.ogg",
    "entrega",
    Buffer.from("OggSaudio1234567890")
  );
  const previa = m.uploadArquivoBeat(
    "produtor",
    beat,
    "previa.mp3",
    "previa",
    Buffer.from("ID3audio1234567890")
  );
  ok(() => assert.equal(m.previaBeat("comprador", beat).id, previa.id));
  ok(() => assert.equal(m.arquivosBeat("produtor", beat).length, 3));
  ok(() =>
    assert.ok(fs.existsSync(path.join(m.pastaArquivosBeat(), entrega.id)))
  );
  recusar(() => m.arquivoDoProdutor("comprador", beat, entrega.id), 404);
  const termos = {
    titulo: "Licença da cena",
    modalidade: "free",
    versao: "0",
    preco: "",
    usos: "Permitido usar em demonstrações pessoais.",
    restricoes: "Não permite revenda nem sublicenciamento.",
    creditos: "Crédito obrigatório ao produtor.",
    limites: "Uma faixa por autorização.",
    entregaveis: "Arquivo de áudio da versão escolhida.",
    arquivos: [entrega.id],
  };
  recusar(
    () =>
      m.salvarOfertaBeat("produtor", beat, {
        ...termos,
        arquivos: [previa.id],
      }),
    400
  );
  recusar(
    () =>
      m.salvarOfertaBeat("produtor", beat, {
        ...termos,
        modalidade: "__proto__",
      }),
    400
  );
  recusar(
    () =>
      m.salvarOfertaBeat("produtor", beat, {
        ...termos,
        modalidade: "premium",
        preco: "0,01",
      }),
    400
  );
  const free = m.salvarOfertaBeat("produtor", beat, termos);
  const premium = m.salvarOfertaBeat("produtor", beat, {
    ...termos,
    modalidade: "premium",
    preco: "149,90",
    arquivos: [entrega.id, stems.id],
  });
  const exclusiva = m.salvarOfertaBeat("produtor", beat, {
    ...termos,
    modalidade: "exclusiva",
  });
  const oferta = id =>
    m.fichaBeat("comprador", beat).ofertas.find(o => o.id === id);
  ok(() => assert.equal(oferta(premium).preco_centavos, 14990));
  ok(() => assert.equal(oferta(free).numero, 1));
  const corpo = (id, extra = {}) => ({
    aceite: "sim",
    versao: oferta(id).versao_id,
    chave_envio: randomUUID(),
    ...extra,
  });
  recusar(
    () => m.criarPedidoBeat("comprador", beat, exclusiva, corpo(exclusiva)),
    400
  );
  recusar(() => m.criarPedidoBeat("produtor", beat, free, corpo(free)), 400);
  recusar(
    () =>
      m.criarPedidoBeat("comprador", beat, free, corpo(free, { aceite: "" })),
    400
  );
  recusar(
    () =>
      m.criarPedidoBeat(
        "comprador",
        beat,
        free,
        corpo(free, { versao: randomUUID() })
      ),
    409
  );
  const envio = corpo(free),
    gratuito = m.criarPedidoBeat("comprador", beat, free, envio);
  ok(() =>
    assert.equal(m.criarPedidoBeat("comprador", beat, free, envio), gratuito)
  );
  ok(() =>
    assert.equal(
      m.criarPedidoBeat("comprador", beat, free, corpo(free)),
      gratuito
    )
  );
  ok(() =>
    assert.equal(m.pedidoBeat("comprador", gratuito).estado, "aprovado")
  );
  ok(() =>
    assert.equal(
      m.downloadBeat("comprador", gratuito, entrega.id).nome,
      "master.wav"
    )
  );
  recusar(() => m.downloadBeat("comprador", gratuito, stems.id), 404);
  recusar(() => m.downloadBeat("outro", gratuito, entrega.id), 404);
  recusar(() => m.pedidoBeat("outro", gratuito), 404);
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT count(*) n FROM beat_licencas WHERE pedido_id=?")
        .get(gratuito).n,
      1
    )
  );
  const snapshot = m.pedidoBeat("comprador", gratuito).snapshot_json;
  m.salvarOfertaBeat(
    "produtor",
    beat,
    {
      ...termos,
      versao: "1",
      usos: "Novas condições de utilização da demonstração.",
      arquivos: [stems.id],
    },
    free
  );
  ok(() =>
    assert.equal(m.pedidoBeat("comprador", gratuito).snapshot_json, snapshot)
  );
  ok(() =>
    assert.equal(
      m.downloadBeat("comprador", gratuito, entrega.id).id,
      entrega.id
    )
  );
  recusar(
    () =>
      m.salvarOfertaBeat("produtor", beat, { ...termos, versao: "1" }, free),
    409
  );
  ok(() =>
    assert.throws(
      () => db.prepare("UPDATE beat_oferta_versoes SET preco_centavos=1").run(),
      /imutáveis/
    )
  );
  ok(() =>
    assert.throws(
      () =>
        db
          .prepare("UPDATE beat_pedidos SET snapshot_json='{}' WHERE id=?")
          .run(gratuito),
      /imutável/
    )
  );
  const pago = m.criarPedidoBeat("comprador", beat, premium, corpo(premium));
  recusar(() => m.downloadBeat("comprador", pago, entrega.id), 403);
  const prefs = new Map(),
    payments = new Map();
  let creates = 0,
    requests = 0,
    perderResposta = false;
  const transporte = async (url, options = {}) => {
    requests++;
    ok(() => assert.match(String(url), /^https:\/\/api\.mercadopago\.com\//));
    const u = new URL(url);
    let body;
    if (u.pathname === "/users/me") body = { id: 777, tags: ["test_user"] };
    else if (u.pathname === "/checkout/preferences/search")
      body = {
        elements: [...prefs.values()]
          .filter(
            p =>
              p.external_reference === u.searchParams.get("external_reference")
          )
          .map(({ id, external_reference, collector_id }) => ({
            id,
            external_reference,
            collector_id,
          })),
      };
    else if (
      u.pathname === "/checkout/preferences" &&
      options.method === "POST"
    ) {
      creates++;
      const dados = JSON.parse(options.body);
      ok(() => assert.equal(dados.items.length, 1));
      ok(() => assert.equal(dados.items[0].quantity, 1));
      ok(() => assert.equal(dados.items[0].currency_id, "BRL"));
      ok(() => assert.equal(dados.items[0].unit_price, 149.9));
      body = {
        ...dados,
        id: "pref-" + creates,
        collector_id: 777,
        init_point:
          "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-" +
          creates,
      };
      prefs.set(body.id, body);
      if (perderResposta) {
        perderResposta = false;
        throw Error("Conexão interrompida depois de persistir preferência.");
      }
    } else if (u.pathname.startsWith("/checkout/preferences/"))
      body = prefs.get(u.pathname.split("/").at(-1));
    else if (u.pathname === "/v1/payments/search")
      body = {
        results: [...payments.values()].filter(
          p => p.external_reference === u.searchParams.get("external_reference")
        ),
      };
    else if (u.pathname.startsWith("/v1/payments/"))
      body = payments.get(u.pathname.split("/").at(-1));
    else throw Error("Endpoint inesperado");
    return new Response(JSON.stringify(body || {}), {
      status: body ? 200 : 404,
      headers: { "content-type": "application/json" },
    });
  };
  const config = {
    ambiente: "test",
    token: "APP_USR-token-ficticio",
    segredo: "segredo-ficticio",
    base: "https://cypher.example.test",
  };
  const mp = pg.clienteMercadoPago(config, transporte);
  const url = await m.iniciarCheckoutBeat("comprador", pago, mp);
  ok(() => assert.match(url, /^https:\/\/www\.mercadopago\.com\.br\//));
  ok(() => assert.equal(creates, 1));
  await m.iniciarCheckoutBeat("comprador", pago, mp);
  ok(() => assert.equal(creates, 1));
  ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "pendente"));
  const pagamento = (id, order, status = "approved", extra = {}) => {
    const p = m.pedidoBeat("comprador", order);
    return {
      id: Number(id),
      external_reference: order,
      collector_id: 777,
      live_mode: false,
      currency_id: "BRL",
      transaction_amount: 149.9,
      metadata: {
        cypher_order_id: order,
        cypher_offer_version: p.versao_oferta_id,
      },
      status,
      date_last_updated: "2026-11-24T12:00:00Z",
      ...extra,
    };
  };
  for (const [campo, valor] of [
    ["live_mode", true],
    ["collector_id", 999],
    ["currency_id", "USD"],
    ["transaction_amount", 1],
    ["metadata", { cypher_order_id: pago, cypher_offer_version: "outra" }],
  ]) {
    payments.set("100", pagamento("100", pago, "approved", { [campo]: valor }));
    await falhar(() => m.conferirPagamentoBeat("100", mp), 409);
    ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "pendente"));
  }
  payments.set("101", pagamento("101", pago, "rejected"));
  await m.conferirPagamentoBeat("101", mp);
  ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "rejeitado"));
  payments.set(
    "102",
    pagamento("102", pago, "approved", {
      date_last_updated: "2026-11-24T12:02:00Z",
    })
  );
  await m.conferirPagamentoBeat("102", mp);
  ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "aprovado"));
  ok(() =>
    assert.equal(m.downloadBeat("comprador", pago, stems.id).id, stems.id)
  );
  await m.conferirPagamentoBeat("102", mp);
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT count(*) n FROM beat_licencas WHERE pedido_id=?")
        .get(pago).n,
      1
    )
  );
  payments.set(
    "101",
    pagamento("101", pago, "refunded", {
      date_last_updated: "2026-11-24T12:05:00Z",
    })
  );
  await m.conferirPagamentoBeat("101", mp);
  ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "aprovado"));
  payments.set(
    "102",
    pagamento("102", pago, "pending", {
      date_last_updated: "2026-11-24T12:01:00Z",
    })
  );
  await m.conferirPagamentoBeat("102", mp);
  ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "aprovado"));
  payments.set(
    "102",
    pagamento("102", pago, "refunded", {
      date_last_updated: "2026-11-24T12:04:00Z",
    })
  );
  await m.conferirPagamentoBeat("102", mp);
  recusar(() => m.downloadBeat("comprador", pago, stems.id), 403);
  payments.set(
    "102",
    pagamento("102", pago, "approved", {
      date_last_updated: "2026-11-24T12:05:00Z",
    })
  );
  await m.conferirPagamentoBeat("102", mp);
  ok(() => assert.equal(m.pedidoBeat("comprador", pago).estado, "reembolsado"));
  const retry = m.criarPedidoBeat("comprador", beat, premium, corpo(premium));
  perderResposta = true;
  await falhar(() => m.iniciarCheckoutBeat("comprador", retry, mp), 503);
  const chamadas = creates;
  await m.iniciarCheckoutBeat("comprador", retry, mp);
  ok(() => assert.equal(creates, chamadas));
  ok(() => assert.ok(m.pedidoBeat("comprador", retry).preferencia_id));
  const real = pg.clienteMercadoPago(
    config,
    async () => new Response(JSON.stringify({ id: 888, tags: [] }))
  );
  await falhar(() => real.vendedorTeste(), 503);
  await falhar(
    () =>
      m.iniciarCheckoutBeat("comprador", retry, {
        ...mp,
        vendedorTeste: async () => "888",
      }),
    409
  );
  await falhar(
    () =>
      pg
        .clienteMercadoPago({ ...config, ambiente: "production" }, transporte)
        .vendedorTeste(),
    503
  );
  await falhar(
    () =>
      pg
        .clienteMercadoPago(
          { ...config, base: "http://localhost:3000" },
          transporte
        )
        .vendedorTeste(),
    503
  );
  const assinar = (id, ts = "1795521600") =>
    "ts=" +
    ts +
    ",v1=" +
    createHmac("sha256", config.segredo)
      .update(`id:${id};request-id:req-123;ts:${ts};`)
      .digest("hex");
  ok(() =>
    assert.equal(
      pg.validarWebhookMP("102", assinar("102"), "req-123", config.segredo),
      true
    )
  );
  ok(() =>
    assert.equal(
      pg.validarWebhookMP("101", assinar("102"), "req-123", config.segredo),
      false
    )
  );
  ok(() =>
    assert.equal(
      pg.validarWebhookMP("102", "ts=1,v1=abc", "req-123", config.segredo),
      false
    )
  );
  ok(() =>
    assert.equal(
      pg.validarWebhookMP("102", assinar("102"), "req-errado", config.segredo),
      false
    )
  );
  const versao = m.gestaoBeat("produtor", beat).versao;
  m.disponibilidadeBeat("produtor", beat, false, versao);
  recusar(() => m.criarPedidoBeat("segundo", beat, free, corpo(free)), 409);
  ok(() =>
    assert.equal(
      m.downloadBeat("comprador", gratuito, entrega.id).id,
      entrega.id
    )
  );
  m.disponibilidadeBeat(
    "produtor",
    beat,
    true,
    m.gestaoBeat("produtor", beat).versao
  );
  const legado = criar();
  m.disponibilidadeBeat(
    "produtor",
    legado,
    false,
    m.gestaoBeat("produtor", legado).versao
  );
  ok(() => assert.equal(m.gestaoBeat("produtor", legado).disponivel, 0));
  // HTTP real: autenticação, CSRF, arquivos privados, EJS e ausência de atalhos de aprovação.
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
  app.locals.resumoReputacao = (
    await import("../dist/src/app/models/colaboracoes.js")
  ).resumoReputacao;
  app.locals.reputacaoParaPerfil = () => null;
  const { protegerEscrita } =
    await import("../dist/src/app/middlewares/seguranca.js");
  const { webhook } =
    await import("../dist/src/app/controllers/controladorLicenciamentoBeats.js");
  const { default: routes } =
    await import("../dist/src/app/routes/rotasCypher.js");
  app.post(
    "/payments/mercadopago/webhook",
    express.json({ limit: "8kb" }),
    webhook
  );
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
    csrf = "d".repeat(64),
    cookies = Object.fromEntries(
      ["produtor", "comprador", "outro"].map(id => [
        id,
        "cypher_csrf=" + csrf + "; cypher_session=" + auth.iniciarSessao(id),
      ])
    );
  const request = (url, id = "comprador", options = {}) =>
    fetch(host + url, {
      redirect: "manual",
      ...options,
      headers: { cookie: cookies[id], ...options.headers },
    });
  for (const [nome, url, id] of [
    ["catalogo", "/beats?modalidade=premium&arquivo=audio%2Fwav", "comprador"],
    ["novo", "/beats/new", "produtor"],
    ["gestao", "/beats/" + beat + "/manage", "produtor"],
    ["ficha", "/beats/" + beat, "comprador"],
    ["compras", "/purchases", "comprador"],
    ["pedido", "/purchases/" + gratuito, "comprador"],
    ["premium", "/purchases/" + retry, "comprador"],
  ]) {
    const response = await request(url, id),
      html = await response.text();
    ok(() => assert.equal(response.status, 200, html));
    ok(() => assert.ok(html.includes("dc-shell")));
    if (process.env.CYPHER_QA_OUTPUT) {
      const output = path.resolve(process.env.CYPHER_QA_OUTPUT);
      fs.mkdirSync(output, { recursive: true });
      const publicRoot = path.resolve("public").replaceAll("\\", "/");
      fs.writeFileSync(
        path.join(output, nome + ".html"),
        html
          .replaceAll('href="/css/', 'href="file:///' + publicRoot + "/css/")
          .replaceAll('src="/js/', 'src="file:///' + publicRoot + "/js/")
          .replaceAll('src="/img/', 'src="file:///' + publicRoot + "/img/")
      );
    }
  }
  const cards = async (query) => {
    const resposta = await request("/beats?" + query);
    assert.equal(resposta.status, 200);
    return Array.from((await resposta.text()).matchAll(/data-beat-id="([^"]+)"/g), v => v[1]);
  };
  const importarFavoritos = await request("/colecoes/importar-beats", "comprador", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ ids:[beat, beat, "registro-ausente"] }),
  });
  ok(() => assert.equal(importarFavoritos.status, 200));
  const importados = await importarFavoritos.json();
  ok(() => assert.equal(importados.total, 1));
  ok(() => assert.equal(db.prepare("SELECT count(*) n FROM interacoes_conteudo WHERE usuario_id='comprador' AND acao='salvar' AND objeto_tipo='beat'").get().n, 1));
  const conjunto = new URLSearchParams({
    q: "batida @produtor", genero: "Boom bap", bpmMin: "92", bpmMax: "92",
    tonalidade: "Dm", duracaoMin: "2:30", duracaoMax: "2:30", modalidade: "premium",
    precoMin: "149,90", precoMax: "149,90", arquivo: "audio/wav", disponibilidade: "disponivel",
  });
  await okAsync(async () => assert.deepEqual(await cards(conjunto), [beat]));
  // O WAV está no Premium. A versão vigente de Free Use só entrega OGG.
  await okAsync(async () => assert.deepEqual(await cards("modalidade=free&arquivo=audio%2Fwav"), []));
  await okAsync(async () => assert.deepEqual(await cards("modalidade=free&arquivo=audio%2Fogg&precoMax=0"), [beat]));
  await okAsync(async () => assert.deepEqual(await cards("arquivo=audio%2Fmpeg"), []));
  await okAsync(async () => assert.deepEqual(await cards("modalidade=exclusiva&precoMax=0"), []));
  await okAsync(async () => assert.deepEqual(await cards("bpmMax=91"), []));
  await okAsync(async () => assert.deepEqual(await cards("duracaoMin=2%3A31"), []));
  await okAsync(async () => assert.deepEqual(await cards("disponibilidade=pausado"), [legado]));
  const before = m.pedidoBeat("comprador", retry).estado;
  await okAsync(async () =>
    assert.equal(
      (await request("/purchases/" + retry + "?status=approved&payment_id=123"))
        .status,
      200
    )
  );
  ok(() => assert.equal(m.pedidoBeat("comprador", retry).estado, before));
  await okAsync(async () =>
    assert.equal((await request("/purchases/" + gratuito, "outro")).status, 404)
  );
  await okAsync(async () =>
    assert.equal(
      (await request("/purchases/" + gratuito + "/files/" + stems.id)).status,
      404
    )
  );
  await okAsync(async () =>
    assert.equal(
      (
        await request(
          "/purchases/" + gratuito + "/files/" + entrega.id,
          "outro"
        )
      ).status,
      404
    )
  );
  const arquivo = await request(
    "/purchases/" + gratuito + "/files/" + entrega.id
  );
  ok(() => assert.equal(arquivo.status, 200));
  ok(() =>
    assert.equal(arquivo.headers.get("cache-control"), "private, no-store")
  );
  ok(() =>
    assert.match(arquivo.headers.get("content-disposition"), /attachment/)
  );
  await okAsync(async () =>
    assert.equal(
      (await request("/purchases/" + gratuito + "/license")).status,
      200
    )
  );
  await okAsync(async () =>
    assert.equal(
      (
        await request("/beats/" + beat + "/availability", "produtor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ versao: 1 }),
        })
      ).status,
      403
    )
  );
  await okAsync(async () =>
    assert.equal(
      (
        await request(
          "/beats/" + beat + "/files?finalidade=previa",
          "produtor",
          {
            method: "POST",
            headers: {
              "content-type": "application/octet-stream",
              "x-file-name": "%ZZ",
              "x-csrf-token": csrf,
            },
            body: Buffer.from("ID3x"),
          }
        )
      ).status,
      400
    )
  );
  await okAsync(async () =>
    assert.equal(
      (
        await fetch(host + "/payments/mercadopago/webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: '{"type":"payment","live_mode":false,"data":{"id":102}}',
        })
      ).status,
      401
    )
  );
  const anon = await fetch(host + "/purchases", { redirect: "manual" });
  ok(() => assert.equal(anon.status, 302));
  m.retirarOfertaBeat("produtor", beat, free, 2);
  await okAsync(async () => assert.deepEqual(await cards("modalidade=free"), []));
  ok(() =>
    assert.equal(
      m.downloadBeat("comprador", gratuito, entrega.id).id,
      entrega.id
    )
  );
  ok(() => assert.equal(b.excluirBeatCypher(beat, "produtor"), true));
  ok(() =>
    assert.equal(
      b.listarBeatsCypher("comprador").some(x => x.id === beat),
      false
    )
  );
  ok(() =>
    assert.equal(
      m.downloadBeat("comprador", gratuito, entrega.id).id,
      entrega.id
    )
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM beats WHERE id=?").get(beat).n,
      1
    )
  );
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  ok(() =>
    assert.equal(m.pedidoBeat("comprador", gratuito).snapshot_json, snapshot)
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  console.log(
    `Beats: ${checks} verificações passaram; termos imutáveis, Free Use, arquivos privados, checkout de teste, múltiplas tentativas, confirmação confiável, assinatura, reembolso, histórico, privacidade e HTTP.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
