import assert from "node:assert/strict";

// A suíte HTTP fornece sessões reais e um banco temporário exclusivo.
export async function verificarEspacoTrabalho({
  request,
  banco,
  rapper,
  consumidor,
  letrista,
}) {
  const db = banco.conexaoInternaCypher();
  const pagina = "/espaco-de-trabalho";
  const get = async (url, cookie = rapper) => {
    const resposta = await request(url, { cookie });
    assert.equal(resposta.status, 200, url);
    return resposta.text();
  };
  const post = (url, cookie, body) =>
    request(url, { cookie, method: "POST", body });
  const formulario = {
    titulo: "Faixa em revisão",
    tipo: "Música",
    visibilidade: "privada",
    genero: "Rap",
    papel: "Artista principal",
  };
  assert.equal((await request(pagina)).status, 302);
  assert.equal((await request(pagina, { cookie: consumidor })).status, 403);
  assert.doesNotMatch(
    await get("/works", consumidor),
    /href="\/espaco-de-trabalho/
  );
  const vazio = await get(pagina);
  assert.match(vazio, /Você ainda não publicou trabalhos/);
  assert.match(vazio, /Nenhuma participação confirmada/);
  assert.doesNotMatch(vazio, /\/beats\/new\?origem/);
  assert.doesNotMatch(
    await get(pagina, letrista),
    /<details class="et-create"/
  );
  banco.salvarProfissoesUsuarioCypher("rapper", [
    { profissaoId: "rapper", valorOriginal: "Rapper", origem: "catalogo" },
    {
      profissaoId: "beatmaker",
      valorOriginal: "Beatmaker",
      origem: "catalogo",
    },
    {
      profissaoId: "organizador-eventos",
      valorOriginal: "Organizador(a) de eventos",
      origem: "catalogo",
    },
  ]);
  const tipo = await get("/works/new");
  assert.match(tipo, /Mixtape/);
  const dados = new URLSearchParams({
    ...formulario,
    selecionarAtuacoes: "1",
    perfilCreditoHandle: "@letrista",
    perfilCreditoPapel: "Letra",
    perfilCreditoParticipacao: "Escrita",
  });
  dados.append("atuacao", "rapper");
  dados.append("atuacao", "beatmaker");
  const criada = await post("/works/new", rapper, dados);
  assert.equal(criada.status, 303);
  assert.match(
    criada.headers.get("location"),
    /^\/espaco-de-trabalho\?resultado=criada/
  );
  const obra = db
    .prepare("SELECT id FROM obras WHERE proprietario_id=?")
    .get("rapper").id;
  const ficha = pagina + "/obra/" + obra;
  const titulo = /<h3>Faixa em revisão<\/h3>/g;
  assert.equal((await get(pagina)).match(titulo)?.length, 1);
  for (const profissao of ["rapper", "beatmaker"]) {
    const filtrado = await get(
      pagina + "?profissao=" + profissao + "&q=revisao"
    );
    assert.equal(filtrado.match(titulo)?.length, 1);
    assert.match(filtrado, /\/events\/new\?origem=espaco/);
  }
  assert.doesNotMatch(
    await get(pagina + "?profissao=organizador-eventos"),
    titulo
  );
  assert.match(
    await get(pagina + "?q=inexistente"),
    /Nenhum resultado para sua pesquisa/
  );
  assert.doesNotMatch(await get("/works", consumidor), titulo);
  assert.equal((await request(ficha, { cookie: letrista })).status, 404);
  db.prepare("UPDATE creditos SET verificado=1 WHERE obra_id=?").run(obra);
  assert.match(
    await get(pagina + "?profissao=letrista&secao=participacoes", letrista),
    titulo
  );
  const participacao = await get(ficha, letrista);
  assert.match(participacao, /Letra · Escrita/);
  assert.doesNotMatch(participacao, /Confirmar exclusão|\/edit\?origem=espaco/);
  assert.equal(
    (await request("/works/" + obra + "/edit", { cookie: letrista })).status,
    404
  );
  assert.equal(
    (await post("/works/" + obra + "/delete", letrista, {})).status,
    404
  );
  dados.set("visibilidade", "publica");
  assert.equal(
    (await post("/works/" + obra + "/edit", rapper, dados)).status,
    303
  );
  assert.equal(
    db.prepare("SELECT verificado FROM creditos WHERE obra_id=?").get(obra)
      .verificado,
    1
  );
  const publicada = db
    .prepare(
      "SELECT o.situacao,o.publicada,p.perfil_publico FROM obras o JOIN perfis p ON p.usuario_id=o.proprietario_id WHERE o.id=?"
    )
    .get(obra);
  assert.deepEqual(publicada, {
    situacao: "",
    publicada: 1,
    perfil_publico: 1,
  });
  const catalogo = await get("/works?q=revisao", consumidor);
  assert.ok(
    catalogo.includes("<h3>Faixa em revisão</h3>"),
    catalogo
      .slice(catalogo.indexOf('<section class="et-section"'))
      .replace(/<[^>]+>/g, " ")
      .slice(0, 700)
  );
  dados.set("perfilCreditoPapel", "Composição");
  assert.equal(
    (await post("/works/" + obra + "/edit", rapper, dados)).status,
    303
  );
  assert.equal((await request(ficha, { cookie: letrista })).status, 404);
  const beat = await post("/beats/new", rapper, {
    title: "Beat da suíte",
    license: "Uso gratuito",
    origem: "espaco",
  });
  assert.equal(
    beat.headers.get("location"),
    "/espaco-de-trabalho?resultado=beatCriado"
  );
  const beatId = db
    .prepare("SELECT id FROM beats WHERE produtor_id=?")
    .get("rapper").id;
  assert.match(
    await get(pagina + "/beat/" + beatId),
    /<h1>Beat da suíte<\/h1>/
  );
  assert.doesNotMatch(
    await get(pagina + "?profissao=rapper"),
    /<h3>Beat da suíte<\/h3>/
  );
  assert.match(
    await get(pagina + "?profissao=beatmaker"),
    /<h3>Beat da suíte<\/h3>/
  );
  const eventoDados = {
    title: "Encontro da suíte",
    category: "Outro",
    categoryDetail: "Encontro",
    date: "2026-12-01",
    time: "18:00",
    location: "Estúdio",
    org: "Organização",
    status: "Inscrições abertas",
    color: "yellow",
    description: "",
    format: "Presencial",
    registration: "",
    prize: "",
    tags: [],
    participationType: "aprovacao",
  };
  const evento = banco.criarEventoCypher("rapper", eventoDados);
  banco.demonstrarInteresseEventoCypher(evento, "letrista");
  assert.doesNotMatch(await get(pagina, letrista), /Encontro da suíte/);
  banco.atualizarStatusInteresseEventoCypher(
    evento,
    "rapper",
    "letrista",
    "confirmado"
  );
  assert.match(
    await get(pagina + "/evento/" + evento, letrista),
    /Participação confirmada/
  );
  assert.doesNotMatch(
    await get(pagina + "?profissao=letrista", letrista),
    /Encontro da suíte/
  );
  assert.match(
    await get(pagina + "?profissao=organizador-eventos"),
    /Encontro da suíte/
  );
  for (const [base, id] of [
    ["/beats", beatId],
    ["/events", evento],
    ["/works", obra],
  ]) {
    const excluida = await post(base + "/" + id + "/delete", rapper, {
      origem: "espaco",
    });
    assert.match(
      excluida.headers.get("location"),
      /^\/espaco-de-trabalho\?resultado=/
    );
  }
  assert.equal(
    db.prepare("SELECT count(*) AS total FROM atuacoes_obra").get().total,
    0
  );
  console.log(
    "OK: Espaço de Trabalho, filtros combinados, fichas, autoria, créditos, eventos e catálogo coletivo."
  );
}
