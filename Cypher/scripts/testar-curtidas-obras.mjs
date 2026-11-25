import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ejs from "ejs";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-curtidas-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
const banco = await import("../dist/src/app/models/bancoDados.js");
const { definirCurtidaObra, obrasDoCatalogo } = await import("../dist/src/app/models/catalogoObras.js");
try {
  banco.inicializarBancoCypher();
  const db = banco.conexaoInternaCypher();
  banco.criarContaCypher({
    id: "artista", email: "artista@example.test", senhaHash: "teste",
    tipoConta: "profissional", nome: "Artista", funcao: "Rapper",
    identificador: "@artista", iniciais: "AR",
    categorias: ["Rapper"], outraCategoria: "",
  });
  db.prepare("UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id='artista'").run();
  db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id='artista'").run();
  db.prepare("INSERT INTO obras (id, proprietario_id, titulo, tipo, situacao, publicada) VALUES ('obra', 'artista', 'Obra', 'Single', 'Lançado', 1)").run();
  for (let i = 0; i < 33; i++) {
    db.prepare("INSERT INTO usuarios (id, tipo_conta) VALUES (?, 'consumidor')").run(`ouvinte-${i}`);
    assert.deepEqual(definirCurtidaObra("obra", `ouvinte-${i}`, true), { curtida: true, total: i + 1 });
  }
  assert.deepEqual(definirCurtidaObra("obra", "ouvinte-32", true), { curtida: true, total: 33 }, "Repetir pedido não duplica curtida");
  assert.equal(obrasDoCatalogo("ouvinte-32")[0].curtida, true);
  assert.equal(obrasDoCatalogo("artista")[0].curtida, false);
  banco.fecharBancoCypher();
  banco.inicializarBancoCypher();
  assert.equal(obrasDoCatalogo("ouvinte-32")[0].curtidas, 33, "Total persiste após reiniciar");
  assert.deepEqual(definirCurtidaObra("obra", "ouvinte-32", false), { curtida: false, total: 32 });
  const { default: express } = await import("express");
  const { default: routes } = await import("../dist/src/app/routes/rotasCypher.js");
  const { protegerEscrita } = await import("../dist/src/app/middlewares/seguranca.js");
  const { iniciarSessao } = await import("../dist/src/app/models/autenticacaoCypher.js");
  const app = express();
  app.use(express.json(), protegerEscrita, routes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/works/obra/like`;
    const token = "a".repeat(64);
    const cookie = `cypher_csrf=${token}; cypher_session=${iniciarSessao("artista")}`;
    const post = (headers, body = { curtida: true }) => fetch(url, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
    assert.equal((await post({ cookie })).status, 403, "CSRF obrigatório");
    assert.equal((await post({ cookie: `cypher_csrf=${token}`, "x-csrf-token": token })).status, 302, "Sessão obrigatória");
    const headers = { cookie, "x-csrf-token": token };
    assert.equal((await post(headers, { curtida: "sim" })).status, 400);
    const resposta = await post(headers);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), { curtida: true, total: 33 });
    assert.deepEqual(await (await post(headers, { curtida: false })).json(), { curtida: false, total: 32 });
  } finally { await new Promise(resolve => server.close(resolve)); }
  assert.deepEqual(definirCurtidaObra("obra", "ouvinte-32", false), { curtida: false, total: 32 });
  banco.conexaoInternaCypher().prepare("UPDATE obras SET publicada=0 WHERE id='obra'").run();
  assert.equal(definirCurtidaObra("obra", "ouvinte-32", true), null, "Obras privadas não recebem curtidas");
  assert.equal(definirCurtidaObra("inexistente", "ouvinte-32", true), null);
  for (const file of ["views/pages/obras.ejs", "views/partials/componentes/cartao-acervo.ejs", "views/partials/componentes/icone-beat.ejs"])
    ejs.compile(fs.readFileSync(file, "utf8"), { filename: file });
  const crown = await ejs.renderFile("views/partials/componentes/icone-beat.ejs", { tipo: "crown" });
  assert.ok(crown.includes("m2 5 5 4"));
  console.log("Curtidas: 32 → 33, idempotência, persistência, remoção, visibilidade e templates OK.");
} finally {
  banco.fecharBancoCypher();
  fs.rmSync(pasta, { recursive: true, force: true });
}
