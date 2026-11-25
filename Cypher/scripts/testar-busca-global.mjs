import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

// Fixtures exclusivas de um banco temporário; nunca alteram os dados da aplicação.
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-busca-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
process.env.NODE_ENV = "test";
const b = await import("../dist/src/app/models/bancoDados.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
const { pesquisarGlobal } =
  await import("../dist/src/app/models/buscaGlobal.js");
b.inicializarBancoCypher();
const db = b.conexaoInternaCypher();
const senhaFixture = "BuscaTeste2026!";
const hashFixture = await auth.gerarHashSenha(senhaFixture);
for (const [id, nome, categorias, publico, confirmado] of [
  ["visitante", "Visitante", [], 0, 1],
  [
    "artista",
    "Conexão Artista",
    ["Rapper", "Beatmaker", "Organizador(a) de eventos"],
    1,
    1,
  ],
  ["privado", "Segredo Privado", ["Rapper"], 0, 1],
  ["pendente", "Segredo Pendente", ["Rapper"], 1, 0],
  ["reservado", "Segredo Nome", ["DJ"], 1, 1],
]) {
  b.criarContaCypher({
    id,
    email: id + "@busca.test",
    senhaHash: hashFixture,
    tipoConta: categorias.length ? "profissional" : "consumidor",
    nome,
    nomePublico: id !== "reservado",
    funcao: categorias.join(" · "),
    identificador: "@" + id,
    iniciais: "CA",
    categorias,
    outraCategoria: "",
  });
  db.prepare("UPDATE usuarios SET email_confirmado_em=? WHERE id=?").run(
    confirmado ? new Date().toISOString() : null,
    id
  );
  db.prepare(
    "UPDATE perfis SET perfil_publico=?, cidade=?, localizacao_publica=?, generos_json=? WHERE usuario_id=?"
  ).run(
    publico,
    id === "artista" ? "Cidade Oculta" : "São Paulo",
    id === "artista" || id === "reservado" ? 0 : 1,
    '["Rap"]',
    id
  );
}
const obra = (title, status = "Lançado") => ({
  title,
  type: "Música",
  typeDetail: "",
  status,
  role: "Artista principal",
  roleDetail: "",
  description: "",
  genre: "Rap",
  genreDetail: "",
  lyrics: "",
  bpm: "",
  isrc: "",
  iswc: "",
  releaseDate: "2026-01-01",
  listenLink: "",
});
b.criarObraCypher("artista", obra("Conexão Obra"), []);
b.criarObraCypher("artista", obra("Segredo Rascunho", "Rascunho"), []);
b.criarObraCypher("privado", obra("Segredo Obra Privada"), []);
b.criarBeatCypher("artista", {
  title: "Conexão Beat",
  bpm: "90",
  key: "",
  genre: "Rap",
  license: "Não informado",
  duration: "",
  description: "",
  usage: "",
  ofertas: [],
  vendaExclusiva: false,
});
b.criarEventoCypher("artista", {
  title: "Conexão Evento",
  category: "Show",
  categoryDetail: "",
  date: "2099-01-01",
  time: "20:00",
  location: "São Paulo",
  org: "Conexão Artista",
  status: "Aberto",
  color: "yellow",
  description: "",
  format: "Presencial",
  registration: "",
  prize: "",
  tags: [],
  participationType: "aberta",
});
const token = auth.iniciarSessao("visitante");
const busca = pesquisarGlobal({ q: "conexao" }, "visitante");
assert.equal(busca.total, 4);
assert.equal(
  busca.grupos.pessoas.length,
  1,
  "Múltiplas profissões devem produzir um único perfil"
);
assert.equal(busca.grupos.pessoas[0].city, "");
assert.equal(pesquisarGlobal({ q: "Cidade Oculta" }, "visitante").total, 0);
assert.equal(pesquisarGlobal({ q: "segredo" }, "visitante").total, 0);
const porIdentificador = pesquisarGlobal({ q: "reservado" }, "visitante").grupos.pessoas;
assert.equal(porIdentificador[0].name, "@reservado");
assert.equal(
  pesquisarGlobal({ categoria: "Rapper" }, "visitante").tipo,
  "pessoas",
  "Links antigos devem manter a busca de pessoas"
);
assert.equal(
  pesquisarGlobal(
    { tipo: "pessoas", categoria: "Rapper", genero: "Rap" },
    "visitante"
  ).total,
  1
);
assert.equal(
  pesquisarGlobal(
    { tipo: "pessoas", localizacao: "Cidade Oculta" },
    "visitante"
  ).total,
  0
);
assert.equal(
  pesquisarGlobal({ tipo: "beats", genero: "Trap" }, "visitante").total,
  0
);
assert.equal(
  pesquisarGlobal({ tipo: "eventos", periodo: "passados" }, "visitante").total,
  0
);
assert.equal(
  pesquisarGlobal(
    { tipo: "eventos", periodo: "proximos", localizacao: "São Paulo" },
    "visitante"
  ).total,
  1
);
assert.equal(
  pesquisarGlobal(
    { tipo: "obras", categoria: "Música", genero: "Rap", pagina: "999" },
    "visitante"
  ).pagina,
  1
);
for (let n = 0; n < 25; n++) {
  const id = "pagina" + n;
  b.criarContaCypher({
    id,
    email: id + "@busca.test",
    senhaHash: hashFixture,
    tipoConta: "profissional",
    nome: "Profissional " + String(n).padStart(2, "0"),
    nomePublico: true,
    funcao: "Rapper",
    identificador: "@" + id,
    iniciais: "PP",
    categorias: ["Rapper"],
    outraCategoria: "",
  });
  db.prepare(
    "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
  ).run(id);
  db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
}
assert.equal(
  pesquisarGlobal(
    { q: "Profissional", tipo: "pessoas", pagina: "2" },
    "visitante"
  ).paginas,
  2
);

const reserva = createServer();
await new Promise(resolve => reserva.listen(0, "127.0.0.1", resolve));
const porta = reserva.address().port;
await new Promise(resolve => reserva.close(resolve));
const base = `http://127.0.0.1:${porta}`;
const processo = spawn(process.execPath, ["dist/src/aplicacao.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(porta) },
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
processo.stdout.on("data", d => (log += d));
processo.stderr.on("data", d => (log += d));
const fim = new Promise(resolve => processo.once("exit", resolve));
const get = (rota, autenticado = true) =>
  fetch(base + rota, {
    redirect: "manual",
    headers: autenticado ? { cookie: "cypher_session=" + token } : {},
  });
try {
  let pronto;
  for (let n = 0; n < 80; n++) {
    try {
      if ((await get("/login")).ok) {
        pronto = true;
        break;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(pronto, log);
  for (const rota of ["/search", "/search/suggestions?q=conexao"])
    assert.equal(
      (await get(rota, false)).status,
      302,
      "Busca exige a mesma sessão da plataforma"
    );
  for (const tipo of ["tudo", "pessoas", "obras", "beats", "eventos"]) {
    const r = await get(
      "/search?" + new URLSearchParams({ q: "conexão", tipo })
    );
    assert.equal(r.status, 200, log);
    const html = await r.text();
    assert.ok(html.includes('name="q" type="search" value="conexão"'));
    assert.ok(html.includes("q=conex%C3%A3o&amp;tipo=pessoas"));
    assert.doesNotMatch(
      html,
      /Cidade Oculta|Segredo Privado|Segredo Pendente|Segredo Rascunho/
    );
    assert.doesNotMatch(
      html.match(/<nav class="side-nav"[\s\S]*?<\/nav>/)?.[0] || "",
      /href="\/search/
    );
    if (tipo === "pessoas") {
      assert.equal((html.match(/class="search-person"/g) || []).length, 1);
      assert.match(html, /Rapper/);
      assert.match(html, /Beatmaker/);
      assert.doesNotMatch(
        html,
        /id="search-localizacao"/,
        "Cidades privadas não geram opções de filtro"
      );
    }
    if (tipo === "beats")
      assert.doesNotMatch(
        html,
        /id="search-categoria"|id="search-localizacao"/
      );
    if (tipo === "eventos")
      assert.doesNotMatch(html, /id="search-genero"|id="search-ordem"/);
  }
  const filtered = await (
    await get("/search?q=conex%C3%A3o&tipo=pessoas&genero=Trap")
  ).text();
  assert.match(filtered, /Essa conexão ainda não apareceu/);
  assert.match(
    filtered,
    /href="\/search\?q=conex%C3%A3o&amp;tipo=pessoas" data-search-navigation>Limpar filtros/
  );
  for (const rota of [
    "/dashboard",
    "/works",
    "/beats",
    "/events?localizacao=",
    "/settings",
  ]) {
    const r = await get(rota);
    assert.equal(r.status, 200, rota + log);
    assert.match(await r.text(), /action="\/search"[\s\S]*?data-global-search/);
  }
  const r = await get("/search/suggestions?q=conexao");
  assert.equal(r.headers.get("cache-control"), "no-store");
  const suggestions = await r.json();
  assert.equal(suggestions.itens.length, 4);
  assert.ok(suggestions.itens.every(i => i.url.startsWith("/")));
  assert.doesNotMatch(JSON.stringify(suggestions), /Cidade Oculta|Segredo/);
  assert.equal(
    (await (await get("/search/suggestions?q=x")).json()).itens.length,
    0
  );
  assert.equal(
    (await (await get("/search/suggestions?q=segredo")).json()).itens.length,
    0
  );
  const paginada = await (
    await get("/search?q=Profissional&tipo=pessoas&pagina=2")
  ).text();
  assert.equal((paginada.match(/class="search-person"/g) || []).length, 1);
  assert.match(paginada, /Página 2 de 2/);
  assert.match(paginada, /q=Profissional&amp;tipo=pessoas&amp;pagina=1/);
  const escaped = await (
    await get("/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E")
  ).text();
  assert.doesNotMatch(escaped, /<script>alert\(1\)<\/script>/);
  // Ocultar uma atuação também deve removê-la dos resultados e sugestões.
  db.prepare(
    `INSERT INTO respostas_atuacao_categoria (usuario_id,categoria,respostas_json,visibilidades_json) VALUES ('artista','Beatmaker','{}','{"__categoria__":"privado"}') ON CONFLICT(usuario_id,categoria) DO UPDATE SET visibilidades_json=excluded.visibilidades_json`
  ).run();
  assert.equal(
    pesquisarGlobal({ tipo: "pessoas", q: "Beatmaker" }, "visitante").total,
    0
  );
  const oculto = await (await get("/search/suggestions?q=conexao")).json();
  assert.ok(
    !oculto.itens
      .find(i => i.categoria === "Pessoas")
      .detalhe.includes("Beatmaker")
  );
  console.log(
    "Busca global: categorias, filtros, links legados, renderização, sugestões, sessão e privacidade validados."
  );

} finally {
  processo.kill();
  await fim;
  b.fecharBancoCypher();
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}
