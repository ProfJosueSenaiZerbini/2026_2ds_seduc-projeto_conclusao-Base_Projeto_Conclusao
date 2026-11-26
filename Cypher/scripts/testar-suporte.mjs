import { configurarNavegacaoTeste } from "./locais-navegacao-teste.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-suporte-"));
process.env.NODE_ENV = "test";
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
process.env.CYPHER_MEDIA_DIR = path.join(pasta, "midias");
const b = await import("../dist/src/app/models/bancoDados.js");
const m = await import("../dist/src/app/models/suporte.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
const identidade = await import("../dist/src/app/models/identidadeUsuario.js");
const projetos = await import("../dist/src/app/models/projetosTrabalho.js");
const portfolio = await import("../dist/src/app/models/portfolio.js");
const oportunidades = await import("../dist/src/app/models/oportunidades.js");
const contatos =
  await import("../dist/src/app/models/contatosOportunidades.js");
const espaco = await import("../dist/src/app/models/espacoTrabalho.js");
let server;
let checks = 0;
const ok = fn => {
  fn();
  checks++;
};
try {
  b.inicializarBancoCypher();
  let db = b.conexaoInternaCypher();
  function seed(id, tipo = "profissional", nascimento = "1990-01-01") {
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
    db.prepare(
      "UPDATE perfis SET perfil_publico=1,nascimento=? WHERE usuario_id=?"
    ).run(nascimento, id);
  }
  for (const id of ["solicitante", "criador", "terceiro", "suspenso"]) seed(id);
  seed("menor", "profissional", "2010-01-01");
  seed("consumidor", "consumidor");
  for (const [id, papel] of [
    ["admin", "super_admin"],
    ["moderador", "moderador"],
    ["outromod", "moderador"],
    ["editor", "editor"],
  ]) {
    db.prepare(
      "INSERT INTO usuarios(id,email,tipo_conta) VALUES(?,?,'administrativo')"
    ).run(id, id + "@admin.example.test");
    db.prepare(
      "INSERT INTO administradores(usuario_id,nome,papel) VALUES(?,?,?)"
    ).run(id, id, papel);
  }
  const descricaoPrivada =
    "DETALHE_PRIVADO_DO_SOLICITANTE para fundamentar a análise de uma ocorrência.";
  const evidenciaPrivada =
    "EVIDENCIA_RESERVADA_AO_CASO e referência pertinente ao responsável.";
  const denuncia = (
    objeto_tipo = "perfil",
    objeto_id = "criador",
    extra = {}
  ) => ({
    tipo: "denuncia",
    assunto: "Revisar uma ocorrência na plataforma",
    descricao: descricaoPrivada,
    motivo: "fraude",
    objeto_tipo,
    objeto_id,
    evidencias: evidenciaPrivada,
    chave_envio:
      "envio-suporte-" + Math.random().toString(36).slice(2) + Date.now(),
    ...extra,
  });
  const ajuda = extra => ({
    tipo: "ajuda",
    assunto: "Preciso entender uma função",
    descricao:
      "Não consegui encontrar a organização dos trabalhos no meu perfil.",
    chave_envio: "ajuda-" + Math.random().toString(36).slice(2) + Date.now(),
    ...extra,
  });
  const proprio = (id, ator = "solicitante") =>
    m.solicitacaoDoUsuario(ator, id);
  const atribuir = (id, ator = "moderador", extra = {}) =>
    m.assumirSolicitacao(ator, id, { versao: proprio(id).versao, ...extra });
  const decidir = (id, decisao, ator = "moderador", extra = {}) =>
    m.decidirSolicitacao(ator, id, {
      versao: m.casoModeracao(ator, id).versao,
      estado: "resolvida",
      decisao,
      resposta:
        "Analisamos a ocorrência e registramos a decisão pertinente às evidências recebidas.",
      motivo:
        "Decisão fundamentada após análise do caso e dos elementos apresentados.",
      ...extra,
    });
  const medidaAtiva = id =>
    db
      .prepare(
        "SELECT * FROM suporte_medidas WHERE caso_id=? AND revogada_em IS NULL ORDER BY criada_em DESC"
      )
      .all(id)
      .at(0);
  const recorrer = (id, ator = "criador", extra = {}) =>
    m.recorrerSolicitacao(ator, id, {
      versao: proprio(id, ator).versao,
      descricao:
        "Peço nova análise fundamentada da medida aplicada ao meu registro.",
      evidencias:
        "Referências adicionais para que outro responsável revise a decisão.",
      chave_envio:
        "recurso-" + Math.random().toString(36).slice(2) + Date.now(),
      ...extra,
    });
  function restaurar(id, ator = "outromod") {
    const medida = medidaAtiva(id);
    assert.ok(medida, "Medida aplicada ausente");
    const recurso = recorrer(id);
    m.assumirSolicitacao(ator, recurso, {
      versao: proprio(recurso, "criador").versao,
    });
    m.decidirSolicitacao(ator, recurso, {
      versao: m.casoModeracao(ator, recurso).versao,
      estado: "resolvida",
      decisao: "restaurar",
      medida_id: medida.id,
      resposta:
        "O recurso foi analisado e a medida foi revertida com preservação do histórico.",
      motivo: "As evidências adicionais justificam reverter a medida anterior.",
    });
    return recurso;
  }

  ok(() => assert.ok(m.tiposSuporte.some(t => t.id === "denuncia")));
  ok(() => assert.ok(m.motivosSuporte.some(t => t.id === "menores")));
  ok(() => assert.ok(m.acoesModeracao.some(t => t.id === "restaurar")));
  ok(() =>
    assert.throws(() =>
      m.criarSolicitacao("solicitante", denuncia("obra", "inexistente"))
    )
  );
  ok(() =>
    assert.throws(() =>
      m.criarSolicitacao("solicitante", denuncia("selo", "inexistente"))
    )
  );
  ok(() =>
    assert.throws(() =>
      m.criarSolicitacao(
        "solicitante",
        denuncia("perfil", "criador", { motivo: "categoria_inexistente" })
      )
    )
  );
  ok(() => assert.throws(() => m.filaModeracao("editor")));
  ok(() => assert.throws(() => m.filaModeracao("solicitante")));
  ok(() => assert.throws(() => m.criarSolicitacao("admin", ajuda())));

  const enviavel = ajuda();
  const pedido = m.criarSolicitacao("solicitante", enviavel);
  ok(() => assert.equal(m.criarSolicitacao("solicitante", enviavel), pedido));
  ok(() =>
    assert.ok(m.listarSolicitacoes("solicitante").some(x => x.id === pedido))
  );
  ok(() => assert.throws(() => proprio(pedido, "terceiro")));
  ok(() => assert.throws(() => proprio(pedido, "criador")));
  ok(() =>
    assert.throws(() =>
      m.recorrerSolicitacao("solicitante", pedido, {
        versao: proprio(pedido).versao,
        descricao: "Ainda não houve decisão para fundamentar um recurso.",
        chave_envio: "recurso-inexistente-inicio",
      })
    )
  );
  const antiga = proprio(pedido).versao;
  m.responderSolicitacao("solicitante", pedido, {
    versao: antiga,
    texto: "Complemento os detalhes da dúvida para facilitar a análise.",
  });
  ok(() =>
    assert.throws(() =>
      m.responderSolicitacao("solicitante", pedido, {
        versao: antiga,
        texto:
          "Resposta de formulário antigo que não pode sobrescrever histórico.",
      })
    )
  );
  atribuir(pedido);
  ok(() =>
    assert.equal(m.casoModeracao("moderador", pedido).revisor_id, "moderador")
  );
  ok(() =>
    assert.throws(() =>
      m.assumirSolicitacao("outromod", pedido, {
        versao: proprio(pedido).versao,
      })
    )
  );
  decidir(pedido, "responder");
  ok(() => assert.equal(proprio(pedido).estado, "resolvida"));
  ok(() => assert.throws(() => decidir(pedido, "responder")));

  // Receber uma denúncia não altera automaticamente o registro ou o acesso do acusado.
  const perfilCaso = m.criarSolicitacao("solicitante", denuncia());
  ok(() => assert.doesNotThrow(() => oportunidades.conta("criador")));
  const semAtribuir = JSON.stringify(m.casoModeracao("outromod", perfilCaso));
  ok(() => assert.ok(!semAtribuir.includes(descricaoPrivada)));
  ok(() => assert.ok(!semAtribuir.includes(evidenciaPrivada)));
  atribuir(perfilCaso);
  ok(() =>
    assert.ok(
      JSON.stringify(m.casoModeracao("moderador", perfilCaso)).includes(
        descricaoPrivada
      )
    )
  );
  ok(() =>
    assert.throws(() =>
      m.decidirSolicitacao("outromod", perfilCaso, {
        versao: proprio(perfilCaso).versao,
        estado: "resolvida",
        decisao: "advertir",
        resposta:
          "Tentativa indevida de decisão por responsável não atribuído.",
        motivo: "Não pode decidir fora de sua atribuição.",
      })
    )
  );
  decidir(perfilCaso, "advertir");
  ok(() => assert.doesNotThrow(() => oportunidades.conta("criador")));
  const afetado = JSON.stringify(proprio(perfilCaso, "criador"));
  ok(() => assert.ok(!afetado.includes(descricaoPrivada)));
  ok(() => assert.ok(!afetado.includes(evidenciaPrivada)));
  ok(() =>
    assert.ok(m.listarSolicitacoes("criador").some(x => x.id === perfilCaso))
  );
  const recursoPerfil = recorrer(perfilCaso);
  ok(() =>
    assert.throws(() =>
      m.assumirSolicitacao("moderador", recursoPerfil, {
        versao: proprio(recursoPerfil, "criador").versao,
      })
    )
  );
  m.assumirSolicitacao("outromod", recursoPerfil, {
    versao: proprio(recursoPerfil, "criador").versao,
  });
  m.decidirSolicitacao("outromod", recursoPerfil, {
    versao: m.casoModeracao("outromod", recursoPerfil).versao,
    estado: "resolvida",
    decisao: "responder",
    resposta: "Recurso analisado por outro responsável competente.",
    motivo: "A nova análise preserva a advertência fundamentada anterior.",
  });

  const risco = m.criarSolicitacao(
    "menor",
    denuncia("perfil", "menor", {
      motivo: "menores",
      assunto: "Analisar proteção de uma conta de menor",
      descricao: "Peço análise da proteção e privacidade desta conta jovem.",
    })
  );
  ok(() => assert.equal(proprio(risco, "menor").prioridade, "alta"));
  ok(() =>
    assert.throws(
      () => m.criarSolicitacao("solicitante", denuncia("perfil", "menor")),
      e => e.status === 404
    )
  );
  const riscoJson = JSON.stringify(m.filaModeracao("moderador"));
  ok(() => assert.ok(!riscoJson.includes("2010-01-01")));

  // Evidência de mensagem requer participação legítima, caso atribuído e justificativa.
  db.prepare(
    "INSERT INTO conversas(id,participante_a,participante_b,contexto) VALUES('conv-reportada','solicitante','criador','Contexto da conversa')"
  ).run();
  db.prepare(
    "INSERT INTO conversas(id,participante_a,participante_b,contexto) VALUES('conv-alheia','terceiro','criador','Outra conversa privada')"
  ).run();
  db.prepare(
    "INSERT INTO mensagens(id,conversa_id,autor_id,texto,chave) VALUES('msg-reportada','conv-reportada','criador','TRECHO_REPORTADO_PARA_ANALISE','chave-msg-reportada')"
  ).run();
  db.prepare(
    "INSERT INTO mensagens(id,conversa_id,autor_id,texto,chave) VALUES('msg-vizinha','conv-reportada','solicitante','TRECHO_NAO_REPORTADO_NAO_REVELAR','chave-msg-vizinha')"
  ).run();
  db.prepare(
    "INSERT INTO mensagens(id,conversa_id,autor_id,texto,chave) VALUES('msg-alheia','conv-alheia','criador','SEGREDO_DE_OUTRA_CONVERSA','chave-msg-alheia')"
  ).run();
  ok(() =>
    assert.throws(() =>
      m.criarSolicitacao("solicitante", denuncia("mensagem", "msg-alheia"))
    )
  );
  const mensagemCaso = m.criarSolicitacao(
    "solicitante",
    denuncia("mensagem", "msg-reportada", { motivo: "assedio" })
  );
  ok(() =>
    assert.throws(() =>
      m.consultarEvidencia("moderador", mensagemCaso, {
        motivo: "A consulta é necessária para analisar a mensagem denunciada.",
      })
    )
  );
  atribuir(mensagemCaso);
  ok(() =>
    assert.throws(() =>
      m.consultarEvidencia("outromod", mensagemCaso, {
        motivo: "Ainda não possuo a atribuição necessária para ver evidências.",
      })
    )
  );
  ok(() =>
    assert.throws(() =>
      m.consultarEvidencia("moderador", mensagemCaso, { motivo: "curto" })
    )
  );
  const evidencia = m.consultarEvidencia("moderador", mensagemCaso, {
    motivo:
      "Este trecho é necessário à análise contextual da denúncia recebida.",
  });
  const evidenciaJson = JSON.stringify(evidencia);
  ok(() => assert.ok(evidenciaJson.includes("TRECHO_REPORTADO_PARA_ANALISE")));
  ok(() =>
    assert.ok(!evidenciaJson.includes("TRECHO_NAO_REPORTADO_NAO_REVELAR"))
  );
  ok(() => assert.ok(!evidenciaJson.includes("SEGREDO_DE_OUTRA_CONVERSA")));
  ok(() =>
    assert.ok(
      !JSON.stringify(m.casoModeracao("moderador", mensagemCaso)).includes(
        "TRECHO_REPORTADO_PARA_ANALISE"
      )
    )
  );
  ok(() =>
    assert.ok(
      db
        .prepare("SELECT count(*) n FROM suporte_acessos WHERE caso_id=?")
        .get(mensagemCaso).n >= 1
    )
  );

  // Origens canônicas: uma medida de vitrine não destrói dados nem se perde em uma edição.
  db.prepare(
    "INSERT INTO obras(id,proprietario_id,titulo,tipo,situacao,descricao,publicada,funcao_principal) VALUES('obra-moderada','criador','OBRA_SOB_ANALISE','Música','','Descrição da obra.',1,'Voz')"
  ).run();
  db.prepare(
    "INSERT INTO beats(id,produtor_id,titulo,descricao) VALUES('beat-moderado','criador','BEAT_SOB_ANALISE','Instrumental de demonstração da suíte.')"
  ).run();
  db.prepare(
    "INSERT INTO eventos(id,proprietario_id,titulo,categoria,descricao,data_texto) VALUES('evento-moderado','criador','EVENTO_SOB_ANALISE','Show','Encontro cultural da suíte.','2026-12-10')"
  ).run();
  const arquivo = projetos.salvarMidia(
    "criador",
    "ensaio.png",
    fs.readFileSync("public/img/descoberta/workshop-beatbox.png")
  );
  const dadosProjeto = {
    titulo: "PROJETO_SOB_ANALISE",
    descricao: "Registro de atuação que precisa preservar a origem.",
    modalidade: "projeto",
    profissoes: ["rapper"],
    papel: "Produção",
    direitos: "sim",
    publico: "sim",
    itens: JSON.stringify([
      {
        tipo: "midia",
        origem_id: arquivo.id,
        publico: "sim",
        legenda: "Material autorizado",
      },
    ]),
  };
  const projeto = projetos.salvarProjetoTrabalho("criador", dadosProjeto);
  portfolio.salvarPortfolio("criador", {
    modo: "inteligente",
    molde: "grade",
    visivel: "sim",
    itens: "[]",
  });
  const verPortfolio = () =>
    portfolio.montarPortfolio("criador", "terceiro").itens;
  ok(() => assert.ok(verPortfolio().some(i => i.id === projeto)));
  ok(() => assert.ok(verPortfolio().some(i => i.id === "obra-moderada")));
  ok(() => assert.ok(verPortfolio().some(i => i.id === "beat-moderado")));
  ok(() => assert.ok(verPortfolio().some(i => i.id === "evento-moderado")));
  const casosMedidas = [];
  for (const [tipo, origem, tabela] of [
    ["obra", "obra-moderada", "obras"],
    ["beat", "beat-moderado", "beats"],
    ["evento", "evento-moderado", "eventos"],
    ["projeto", projeto, "projetos_trabalho"],
  ]) {
    const caso = m.criarSolicitacao("solicitante", denuncia(tipo, origem));
    casosMedidas.push(caso);
    atribuir(caso);
    decidir(caso, "ocultar");
    ok(() =>
      assert.ok(db.prepare(`SELECT id FROM ${tabela} WHERE id=?`).get(origem))
    );
    ok(() =>
      assert.ok(!verPortfolio().some(i => i.tipo === tipo && i.id === origem))
    );
    const token = auth.iniciarSessao("criador"),
      titular = auth.usuarioDaSessao(token);
    ok(() =>
      assert.ok(
        !espaco
          .trabalhosDaConta(titular)
          .some(i => i.modalidade === tipo && i.id === origem)
      )
    );
    if (tipo === "obra") {
      db.prepare(
        "UPDATE obras SET publicada=1,titulo='OBRA_REPUBLICADA' WHERE id=?"
      ).run(origem);
      ok(() => assert.ok(!verPortfolio().some(i => i.id === origem)));
    }
    if (tipo === "projeto")
      ok(() =>
        assert.throws(() =>
          projetos.salvarProjetoTrabalho("criador", dadosProjeto, origem)
        )
      );
    if (tipo === "obra")
      ok(() =>
        assert.ok(
          !b
            .listarObrasPublicasPerfilCypher("@criador")
            .some(o => o.id === origem)
        )
      );
    if (tipo === "beat")
      ok(() =>
        assert.ok(!b.listarBeatsCypher("terceiro").some(o => o.id === origem))
      );
    if (tipo === "evento")
      ok(() =>
        assert.ok(
          !b
            .listarEventosCypher({ ordem: "recentes" }, "terceiro")
            .some(o => o.id === origem)
        )
      );
    const descoberta =
      await import("../dist/src/app/models/modeloDescoberta.js");
    if (tipo !== "projeto")
      ok(() =>
        assert.ok(
          !descoberta
            .publicacoesDescoberta("", "", false, "terceiro")
            .some(o => o.id === origem)
        )
      );
    restaurar(caso);
    ok(() => assert.ok(verPortfolio().some(i => i.id === origem)));
  }
  const midiaCaso = m.criarSolicitacao(
    "solicitante",
    denuncia("midia", arquivo.id)
  );
  atribuir(midiaCaso);
  decidir(midiaCaso, "remover");
  ok(() =>
    assert.ok(fs.existsSync(path.join(projetos.pastaMidias(), arquivo.id)))
  );
  ok(() =>
    assert.throws(() => projetos.midiaAutorizada("criador", arquivo.id))
  );
  ok(() =>
    assert.throws(() => projetos.midiaAutorizada("terceiro", arquivo.id))
  );
  restaurar(midiaCaso);
  ok(() =>
    assert.doesNotThrow(() => projetos.midiaAutorizada("terceiro", arquivo.id))
  );

  const contatoCaso = m.criarSolicitacao(
    "solicitante",
    denuncia("perfil", "criador")
  );
  atribuir(contatoCaso);
  decidir(contatoCaso, "restringir_contato");
  ok(() => assert.doesNotThrow(() => oportunidades.conta("criador")));
  ok(() =>
    assert.doesNotThrow(() => contatos.conversa("conv-reportada", "criador"))
  );
  ok(() =>
    assert.throws(() =>
      contatos.enviarMensagem(
        "criador",
        "conv-reportada",
        "Tentativa de nova mensagem durante restrição.",
        "tentativa-mensagem-restrita"
      )
    )
  );
  restaurar(contatoCaso);

  // Servidor e sessões reais: suporte continua disponível após suspensão da própria conta.
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
  const colaboracoes = await import("../dist/src/app/models/colaboracoes.js");
  app.locals.resumoReputacao = colaboracoes.resumoReputacao;
  app.locals.reputacaoParaPerfil = (id, visitante) => {
    try {
      return colaboracoes.reputacaoPublica(id, visitante);
    } catch {
      return null;
    }
  };
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
    csrf = "d".repeat(64);
  const cookies = Object.fromEntries(
    [
      "solicitante",
      "criador",
      "terceiro",
      "suspenso",
      "consumidor",
      "admin",
      "moderador",
      "outromod",
      "editor",
    ].map(id => [
      id,
      "cypher_csrf=" +
        csrf +
        "; " +
        (["admin", "moderador", "outromod", "editor"].includes(id)
          ? "cypher_admin_session"
          : "cypher_session") +
        "=" +
        auth.iniciarSessao(id),
    ])
  );
  const request = (url, id = "solicitante", op = {}) =>
    fetch(host + url, {
      redirect: "manual",
      ...op,
      headers: { cookie: cookies[id], ...(op.headers || {}) },
    });
  const post = (url, body, id = "solicitante") =>
    request(url, id, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify(body),
    });
  const perfilInteracao = "/interacoes/perfil/criador";
  const pngMidia = Buffer.alloc(32);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(pngMidia);
  pngMidia.writeUInt32BE(64, 16);
  pngMidia.writeUInt32BE(64, 20);
  const enviarMidia = (
    tipo,
    id,
    finalidade,
    arquivo,
    nome,
    autor = "criador"
  ) =>
    request(
      "/publicacoes/" + tipo + "/" + id + "/midias?finalidade=" + finalidade,
      autor,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-File-Name": encodeURIComponent(nome),
          "X-CSRF-Token": csrf,
          "X-Midia-Autorizada": "sim",
        },
        body: arquivo,
      }
    );
  const envioMidia = await enviarMidia(
    "projeto",
    projeto,
    "imagem",
    pngMidia,
    "capa.png"
  );
  ok(() => assert.equal(envioMidia.status, 201));
  const semAutorizacao = await request(
    "/publicacoes/projeto/" + projeto + "/midias?finalidade=imagem",
    "criador",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Name": "capa.png",
        "X-CSRF-Token": csrf,
      },
      body: pngMidia,
    }
  );
  ok(() => assert.equal(semAutorizacao.status, 400));
  const semCsrfMidia = await request(
    "/publicacoes/projeto/" + projeto + "/midias?finalidade=imagem",
    "criador",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Name": "capa.png",
        "X-Midia-Autorizada": "sim",
      },
      body: pngMidia,
    }
  );
  ok(() => assert.equal(semCsrfMidia.status, 403));
  for (const [tipo, id] of [
    ["obra", "obra-moderada"],
    ["beat", "beat-moderado"],
    ["evento", "evento-moderado"],
    ["perfil", "criador"],
  ]) {
    const envio = await enviarMidia(
      tipo,
      id,
      "imagem",
      pngMidia,
      "minha-imagem.png"
    );
    ok(() => assert.equal(envio.status, 201));
    const mid = (await envio.json()).id;
    ok(() =>
      assert.ok(
        db
          .prepare(
            "SELECT 1 FROM midias_publicacoes WHERE id=? AND autor_id='criador'"
          )
          .get(mid)
      )
    );
    const vitrine =
      tipo === "perfil"
        ? "/p/criador"
        : tipo === "obra"
          ? "/works"
          : tipo === "beat"
            ? "/beats/" + id
            : "/events/" + id;
    const paginaMidia = await request(vitrine),
      htmlMidia = await paginaMidia.text();
    ok(() => assert.equal(paginaMidia.status, 200, htmlMidia.slice(0, 300)));
    ok(() =>
      assert.ok(
        htmlMidia.includes("/publication-media/" + mid),
        "A mídia enviada precisa aparecer na publicação: " + vitrine
      )
    );
  }
  const wav = Buffer.alloc(44);
  wav.write("RIFF");
  wav.write("WAVE", 8);
  const audioObra = await enviarMidia(
    "obra",
    "obra-moderada",
    "audio",
    wav,
    "minha-faixa.wav"
  );
  ok(() => assert.equal(audioObra.status, 201));
  const video = Buffer.alloc(32);
  video.write("ftyp", 4);
  video.write("mp42", 8);
  const videoObra = await enviarMidia(
    "obra",
    "obra-moderada",
    "video",
    video,
    "meu-video.mp4"
  );
  ok(() => assert.equal(videoObra.status, 201));
  const idMidia = (await envioMidia.json()).id;
  const anonMidia = await fetch(host + "/publication-media/" + idMidia, {
    redirect: "manual",
  });
  ok(() => assert.ok([302, 303].includes(anonMidia.status)));
  await (async () => {
    assert.equal((await request("/publication-media/" + idMidia)).status, 200);
    checks++;
  })();
  const estranho = await enviarMidia(
    "projeto",
    projeto,
    "imagem",
    pngMidia,
    "capa.png",
    "terceiro"
  );
  ok(() => assert.equal(estranho.status, 403));
  const formatoErrado = await enviarMidia(
    "projeto",
    projeto,
    "imagem",
    Buffer.from("conteudo-invalido"),
    "capa.png"
  );
  ok(() => assert.equal(formatoErrado.status, 400));
  const textoEnviado = await enviarMidia(
    "projeto",
    projeto,
    "texto",
    Buffer.from("Letra enviada pelo próprio usuário."),
    "letra.txt"
  );
  ok(() => assert.equal(textoEnviado.status, 201));
  const idTexto = (await textoEnviado.json()).id;
  db.prepare("UPDATE projetos_trabalho SET publico=0 WHERE id=?").run(projeto);
  const privadoMidia = await request("/publication-media/" + idTexto);
  ok(() => assert.equal(privadoMidia.status, 404));
  const proprioPrivado = await request(
    "/publication-media/" + idTexto,
    "criador"
  );
  ok(() => assert.equal(proprioPrivado.status, 200));
  db.prepare("UPDATE projetos_trabalho SET publico=1 WHERE id=?").run(projeto);
  const textoBaixado = await request("/publication-media/" + idTexto);
  ok(() =>
    assert.match(textoBaixado.headers.get("content-disposition"), /attachment/)
  );
  const textoRecebido = await textoBaixado.text();
  ok(() => assert.equal(textoRecebido, "Letra enviada pelo próprio usuário."));
  const substituicao = await enviarMidia(
    "projeto",
    projeto,
    "imagem",
    pngMidia,
    "capa-nova.png"
  );
  ok(() => assert.equal(substituicao.status, 201));
  await (async () => {
    assert.equal((await request("/publication-media/" + idMidia)).status, 404);
    checks++;
  })();
  const fotoConsumidor = await enviarMidia(
    "perfil",
    "consumidor",
    "imagem",
    pngMidia,
    "minha-foto.png",
    "consumidor"
  );
  ok(() => assert.equal(fotoConsumidor.status, 201));
  const idFoto = (await fotoConsumidor.json()).id;
  await (async () => {
    assert.equal(
      (await request("/publication-media/" + idFoto, "consumidor")).status,
      200
    );
    checks++;
  })();
  await (async () => {
    assert.equal(
      (await request("/publication-media/" + idFoto, "terceiro")).status,
      404
    );
    checks++;
  })();
  const convite = await post("/representacoes", {
    destinatario: "@criador",
    papel: "representar",
    escopo: "Representação para negociação de apresentações.",
  });
  ok(() => assert.equal(convite.status, 303));
  const vinculoRep = db
    .prepare(
      "SELECT * FROM representacoes_profissionais WHERE proponente_id='solicitante'"
    )
    .get();
  const autoAceite = await post("/representacoes/" + vinculoRep.id, {
    acao: "aceitar",
    versao: 1,
  });
  ok(() => assert.equal(autoAceite.status, 409));
  const aceiteOutro = await post(
    "/representacoes/" + vinculoRep.id,
    { acao: "aceitar", versao: 1 },
    "terceiro"
  );
  ok(() => assert.equal(aceiteOutro.status, 404));
  const aceiteRep = await post(
    "/representacoes/" + vinculoRep.id,
    { acao: "aceitar", versao: 1 },
    "criador"
  );
  ok(() => assert.equal(aceiteRep.status, 303));
  const duplicadoRep = await post("/representacoes", {
    destinatario: "@criador",
    papel: "representar",
    escopo: "Outro convite para a mesma representação.",
  });
  ok(() => assert.equal(duplicadoRep.status, 409));
  const consumidorRep = await post(
    "/representacoes",
    {
      destinatario: "@criador",
      papel: "representar",
      escopo: "Não deve autorizar conta Consumidor.",
    },
    "consumidor"
  );
  ok(() => assert.equal(consumidorRep.status, 403));
  const selfRep = await post("/representacoes", {
    destinatario: "@solicitante",
    papel: "representar",
    escopo: "Não deve autorizar autorrepresentação.",
  });
  ok(() => assert.equal(selfRep.status, 403));
  const fotoSemPermissao = await enviarMidia(
    "perfil",
    "criador",
    "imagem",
    pngMidia,
    "foto.png",
    "solicitante"
  );
  ok(() => assert.equal(fotoSemPermissao.status, 403));
  const encerrarRep = await post("/representacoes/" + vinculoRep.id, {
    acao: "encerrar",
    versao: 2,
    motivo: "As partes encerraram o trabalho de representação.",
  });
  ok(() => assert.equal(encerrarRep.status, 303));
  ok(() =>
    assert.equal(
      db
        .prepare("SELECT estado FROM representacoes_profissionais WHERE id=?")
        .get(vinculoRep.id).estado,
      "encerrada"
    )
  );
  const novaProposta = {
    destinatario: "@criador",
    papel: "representar",
    escopo: "Proposta para representação em novos eventos.",
  };
  const repRecusa = await post("/representacoes", novaProposta);
  ok(() => assert.equal(repRecusa.status, 303));
  const pendenteRecusa = db
    .prepare(
      "SELECT id FROM representacoes_profissionais WHERE proponente_id='solicitante' AND estado='pendente'"
    )
    .get().id;
  const recusa = await post(
    "/representacoes/" + pendenteRecusa,
    { acao: "recusar", versao: 1 },
    "criador"
  );
  ok(() => assert.equal(recusa.status, 303));
  const aceitarRecusado = await post(
    "/representacoes/" + pendenteRecusa,
    { acao: "aceitar", versao: 1 },
    "criador"
  );
  ok(() => assert.equal(aceitarRecusado.status, 409));
  const repCancelamento = await post("/representacoes", novaProposta);
  ok(() => assert.equal(repCancelamento.status, 303));
  const pendenteCancelar = db
    .prepare(
      "SELECT id FROM representacoes_profissionais WHERE proponente_id='solicitante' AND estado='pendente'"
    )
    .get().id;
  const cancelamento = await post("/representacoes/" + pendenteCancelar, {
    acao: "cancelar",
    versao: 1,
  });
  ok(() => assert.equal(cancelamento.status, 303));
  contatos.bloquear("criador", "solicitante", true);
  const conviteBloqueado = await post("/representacoes", novaProposta);
  ok(() => assert.equal(conviteBloqueado.status, 403));
  const midiaBloqueada = await request("/publication-media/" + idTexto);
  ok(() => assert.equal(midiaBloqueada.status, 404));
  contatos.bloquear("criador", "solicitante", false);
  for (const [nome, rota, autor] of [
    ["midias", "/publicacoes/projeto/" + projeto + "/midias", "criador"],
    ["representacoes", "/representacoes", "solicitante"],
  ]) {
    const resp = await request(rota, autor),
      html = await resp.text();
    ok(() => assert.equal(resp.status, 200, html.slice(0, 300)));
    if (process.env.CYPHER_INTERACOES_QA) {
      fs.mkdirSync(path.resolve(process.env.CYPHER_INTERACOES_QA), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(process.env.CYPHER_INTERACOES_QA, nome + ".html"),
        html
      );
    }
  }
  const fichaInteracao = "/interacoes/projeto/" + projeto;
  const postagem = {
    texto: "Comentário com <script>texto literal</script>.",
    envio: "teste-comentario-unico-0001",
  };
  const salvo = await post(
    fichaInteracao + "/salvar",
    { ativo: "sim" },
    "consumidor"
  );
  ok(() => assert.equal(salvo.status, 200));
  for (let i = 0; i < 2; i++) {
    const curtida = await (
      await post(fichaInteracao + "/curtir", { ativo: "sim" }, "consumidor")
    ).json();
    ok(() => assert.equal(curtida.curtidas, 1));
  }
  const salvosHtml = await (await request("/colecoes", "consumidor")).text();
  ok(() => assert.match(salvosHtml, /Remover dos salvos/));
  const privadoHtml = await (await request("/colecoes", "terceiro")).text();
  ok(() => assert.doesNotMatch(privadoHtml, /Remover dos salvos/));
  const seguir = await post(
    perfilInteracao + "/seguir",
    { ativo: "sim" },
    "consumidor"
  );
  ok(() => assert.equal(seguir.status, 200));
  const seguindoHtml = await (
    await request("/colecoes?aba=seguindo", "consumidor")
  ).text();
  ok(() => assert.match(seguindoHtml, /Deixar de seguir/));
  contatos.bloquear("criador", "consumidor", true);
  const bloqueado = await post(
    perfilInteracao + "/seguir",
    { ativo: "sim" },
    "consumidor"
  );
  ok(() => assert.equal(bloqueado.status, 404));
  const bloqueadosHtml = await (
    await request("/colecoes", "consumidor")
  ).text();
  ok(() => assert.doesNotMatch(bloqueadosHtml, /Remover dos salvos/));
  contatos.bloquear("criador", "consumidor", false);
  ok(() =>
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM profissionais_seguidos WHERE seguidor_id='consumidor'"
        )
        .get().n,
      0
    )
  );
  const publicado = await post(
    fichaInteracao + "/comentarios",
    postagem,
    "terceiro"
  );
  ok(() => assert.equal(publicado.status, 200));
  const cid = db
    .prepare(
      "SELECT id FROM comentarios_conteudo WHERE autor_id=? AND chave_envio=?"
    )
    .get("terceiro", postagem.envio).id;
  const repeticaoComentario = await post(
    fichaInteracao + "/comentarios",
    postagem,
    "terceiro"
  );
  ok(() => assert.equal(repeticaoComentario.status, 200));
  const htmlComComentario = await (await request(fichaInteracao)).text();
  ok(() =>
    assert.match(
      htmlComComentario,
      /&lt;script&gt;texto literal&lt;\/script&gt;/
    )
  );
  ok(() => assert.match(htmlComComentario, /objeto_tipo=comentario/));
  if (process.env.CYPHER_INTERACOES_QA) {
    const pastaQa = path.resolve(process.env.CYPHER_INTERACOES_QA);
    fs.mkdirSync(pastaQa, { recursive: true });
    fs.writeFileSync(path.join(pastaQa, "comentarios.html"), htmlComComentario);
    fs.writeFileSync(path.join(pastaQa, "colecoes.html"), salvosHtml);
  }
  const semPermissao = await post(
    fichaInteracao + "/comentarios/" + cid + "/excluir",
    { versao: "1" },
    "criador"
  );
  ok(() => assert.equal(semPermissao.status, 404));
  const editado = await post(
    fichaInteracao + "/comentarios/" + cid + "/editar",
    { versao: "1", texto: "Comentário revisado para moderação." },
    "terceiro"
  );
  ok(() => assert.equal(editado.status, 200));
  const edicaoVencida = await post(
    fichaInteracao + "/comentarios/" + cid + "/editar",
    { versao: "1", texto: "Edição concorrente." },
    "terceiro"
  );
  ok(() => assert.equal(edicaoVencida.status, 409));
  const reclamacao = await post(
    "/suporte",
    denuncia("comentario", cid, { motivo: "assedio" })
  );
  ok(() => assert.equal(reclamacao.status, 303));
  const casoComentario = reclamacao.headers.get("location").split("/").at(-1);
  atribuir(casoComentario);
  const evidenciaComentario = m.consultarEvidencia(
    "moderador",
    casoComentario,
    { motivo: "Registro de evidência para analisar o comentário denunciado." }
  );
  ok(() =>
    assert.equal(
      evidenciaComentario.objeto.texto,
      "Comentário revisado para moderação."
    )
  );
  decidir(casoComentario, "ocultar");
  ok(() => assert.equal(medidaAtiva(casoComentario).alvo_tipo, "comentario"));
  const moderado = await (await request(fichaInteracao)).text();
  ok(() =>
    assert.doesNotMatch(moderado, /Comentário revisado para moderação\./)
  );
  const removido = await post(
    fichaInteracao + "/comentarios/" + cid + "/excluir",
    { versao: "2" },
    "terceiro"
  );
  ok(() => assert.equal(removido.status, 200));
  ok(() =>
    assert.equal(
      db.prepare("SELECT texto FROM comentarios_conteudo WHERE id=?").get(cid)
        .texto,
      ""
    )
  );

  const suspenderCaso = m.criarSolicitacao(
    "solicitante",
    denuncia("perfil", "suspenso")
  );
  atribuir(suspenderCaso);
  decidir(suspenderCaso, "suspender");
  ok(() => assert.throws(() => oportunidades.conta("suspenso")));
  const ajudaSuspenso = m.criarSolicitacao(
    "suspenso",
    ajuda({ assunto: "Quero entender minha suspensão" })
  );
  ok(() =>
    assert.ok(
      m.listarSolicitacoes("suspenso").some(x => x.id === ajudaSuspenso)
    )
  );
  ok(() => assert.ok(proprio(ajudaSuspenso, "suspenso")));
  m.responderSolicitacao("suspenso", ajudaSuspenso, {
    versao: proprio(ajudaSuspenso, "suspenso").versao,
    texto: "Acrescento uma informação relevante ao meu atendimento.",
  });
  for (const [url, ator] of [
    ["/suporte", "solicitante"],
    ["/suporte/new", "consumidor"],
    ["/suporte/" + pedido, "solicitante"],
    ["/suporte/" + perfilCaso, "criador"],
    ["/suporte", "suspenso"],
    ["/admin/moderacao", "moderador"],
    ["/admin/moderacao/" + mensagemCaso, "moderador"],
  ]) {
    const r = await request(url, ator),
      html = await r.text();
    ok(() => assert.equal(r.status, 200, url + ": " + html.slice(0, 1000)));
    ok(() => assert.ok(!html.includes("[object Object]")));
    if (process.env.CYPHER_QA_OUTPUT) {
      const { pathToFileURL } = await import("node:url");
      const pasta = path.resolve(process.env.CYPHER_QA_OUTPUT);
      fs.mkdirSync(pasta, { recursive: true });
      const raiz = pathToFileURL(path.resolve("public")).href + "/";
      const nome =
        url === "/suporte"
          ? ator === "suspenso"
            ? "restricao"
            : "lista"
          : url === "/suporte/new"
            ? "novo"
            : url === "/admin/moderacao"
              ? "fila"
              : url.startsWith("/admin/")
                ? "caso"
                : url.includes(perfilCaso)
                  ? "afetado"
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
    ["/suporte/" + pedido, "terceiro", 404],
    ["/admin/moderacao", "editor", 403],
    ["/admin/moderacao", "solicitante", 403],
  ]) {
    const r = await request(url, user);
    ok(() => assert.equal(r.status, expected));
  }
  const anon = await fetch(host + "/suporte", { redirect: "manual" });
  ok(() => assert.equal(anon.status, 302));
  const afetadoHtml = await (
    await request("/suporte/" + perfilCaso, "criador")
  ).text();
  ok(() => assert.ok(!afetadoHtml.includes(descricaoPrivada)));
  ok(() => assert.ok(!afetadoHtml.includes(evidenciaPrivada)));
  const noCsrf = await request("/suporte", "solicitante", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(ajuda()),
  });
  ok(() => assert.equal(noCsrf.status, 403));
  const negadoGet = await request("/dashboard", "suspenso");
  ok(() => assert.ok([302, 303].includes(negadoGet.status)));
  ok(() => assert.match(negadoGet.headers.get("location"), /^\/suporte/));
  const negadoPost = await post(
    "/works/new",
    { titulo: "Não pode publicar durante suspensão" },
    "suspenso"
  );
  ok(() => assert.equal(negadoPost.status, 403));
  const suspensoHttp = await post(
    "/suporte",
    ajuda({ assunto: "Atendimento durante restrição de conta" }),
    "suspenso"
  );
  ok(() => assert.equal(suspensoHttp.status, 303));
  const evidenciaSemJustificativa = await post(
    "/admin/moderacao/" + mensagemCaso + "/evidence",
    { motivo: "curto" },
    "moderador"
  );
  ok(() => assert.equal(evidenciaSemJustificativa.status, 400));

  const contagemAntes = db
    .prepare("SELECT count(*) n FROM suporte_casos")
    .get().n;
  const simultaneo = ajuda({ chave_envio: "suporte-concorrente-duplicado" });
  const duplicadas = await Promise.all([
    post("/suporte", simultaneo),
    post("/suporte", simultaneo),
  ]);
  ok(() =>
    assert.deepEqual(
      duplicadas.map(r => r.status),
      [303, 303]
    )
  );
  ok(() =>
    assert.equal(
      duplicadas[0].headers.get("location"),
      duplicadas[1].headers.get("location")
    )
  );
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM suporte_casos").get().n,
      contagemAntes + 1
    )
  );
  const notificacoes = db
    .prepare("SELECT titulo,mensagem FROM notificacoes WHERE tipo='suporte'")
    .all();
  ok(() => assert.ok(!JSON.stringify(notificacoes).includes(descricaoPrivada)));
  ok(() => assert.ok(!JSON.stringify(notificacoes).includes(evidenciaPrivada)));
  ok(() =>
    assert.ok(
      !JSON.stringify(notificacoes).includes("TRECHO_REPORTADO_PARA_ANALISE")
    )
  );
  const antes = db.prepare("SELECT count(*) n FROM suporte_casos").get().n;
  b.fecharBancoCypher();
  b.inicializarBancoCypher();
  db = b.conexaoInternaCypher();
  ok(() =>
    assert.equal(
      db.prepare("SELECT count(*) n FROM suporte_casos").get().n,
      antes
    )
  );
  ok(() =>
    assert.ok(
      db
        .prepare(
          "SELECT count(*) n FROM auditoria_administrativa WHERE acao LIKE 'suporte_%'"
        )
        .get().n > 0
    )
  );
  ok(() => assert.deepEqual(db.pragma("foreign_key_check"), []));
  console.log(
    `Suporte e moderação: ${checks} verificações passaram; protocolos, atribuição, evidências restritas, medidas, recursos, privacidade, acesso suspenso, persistência e HTTP.`
  );
} finally {
  if (server) await new Promise(r => server.close(r));
  b.fecharBancoCypher();
}
