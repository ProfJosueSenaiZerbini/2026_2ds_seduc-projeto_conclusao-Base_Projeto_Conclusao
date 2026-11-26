import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const pasta = await fs.mkdtemp(path.join(os.tmpdir(), "cypher-social-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "teste.sqlite");
const b = await import("../dist/src/app/models/bancoDados.js");
const { iniciarSessao } = await import("../dist/src/app/models/autenticacaoCypher.js");
let servidor;
let verificacoes = 0;
try {
  b.inicializarBancoCypher();
  const db = b.conexaoInternaCypher();
  const sessoes = {};
  for (const id of ["autora", "parceira", "terceiro", ...Array.from({ length: 8 }, (_, i) => "complementar" + i)]) {
    b.criarContaCypher({
      id, email: id + "@example.test", senhaHash: "fixture", tipoConta: "profissional",
      nome: id, funcao: "Rapper", identificador: "@" + id, iniciais: "QA",
      categorias: [id.startsWith("complementar") ? "Beatmaker" : "Rapper"], outraCategoria: "",
    });
    db.prepare("UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?").run(id);
    db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(id);
    sessoes[id] = iniciarSessao(id);
  }
  for (const papel of ["moderador", "editor"]) {
    db.prepare("INSERT INTO usuarios(id,tipo_conta) VALUES(?,'administrativo')").run(papel);
    db.prepare("INSERT INTO administradores(usuario_id,nome,papel) VALUES(?,?,?)").run(papel, papel, papel);
    sessoes[papel] = iniciarSessao(papel);
  }
  db.exec(`
    INSERT INTO obras(id,proprietario_id,titulo,tipo,situacao,publicada) VALUES('obra','autora','Obra da autora','Obra','',1);
    INSERT INTO creditos(id,obra_id,usuario_creditado_id,nome_creditado,funcao) VALUES('credito-obra','obra','parceira','parceira','Composição');
    INSERT INTO creditos(id,obra_id,usuario_creditado_id,nome_creditado,funcao) VALUES('credito-voz','obra','parceira','parceira','Vocal');
    INSERT INTO beats(id,produtor_id,titulo) VALUES('beat','autora','Beat da autora');
    INSERT INTO eventos(id,proprietario_id,titulo,categoria,data_texto) VALUES('evento','autora','Evento da autora','Show','2030-01-01');
  `);
  b.fecharBancoCypher();
  const reserva = net.createServer();
  await new Promise(resolve => reserva.listen(0, "127.0.0.1", resolve));
  const porta = reserva.address().port;
  await new Promise(resolve => reserva.close(resolve));
  servidor = spawn(process.execPath, ["dist/src/aplicacao.js"], {
    env: { ...process.env, PORT: String(porta), CYPHER_BIND_HOST: "127.0.0.1", NODE_ENV: "test",
      CYPHER_SUPER_ADMIN_EMAIL: "admin@example.test", CYPHER_SUPER_ADMIN_PASSWORD: "Apenas-fixture-local-2026" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise((resolve, reject) => {
    servidor.stdout.once("data", resolve);
    servidor.once("exit", codigo => reject(new Error("Instância encerrou com código " + codigo)));
  });
  const csrf = "f".repeat(64);
  const pedir = async (url, ator, status, dados) => {
    const cookie = url.startsWith("/admin") && ["moderador", "editor"].includes(ator)
      ? "cypher_admin_session" : "cypher_session";
    const r = await fetch("http://127.0.0.1:" + porta + url, {
      redirect: "manual", signal: AbortSignal.timeout(15_000),
      method: dados ? "POST" : "GET",
      headers: { cookie: `cypher_csrf=${csrf}` + (ator ? `; ${cookie}=${sessoes[ator]}` : ""), "x-csrf-token": csrf },
      body: dados ? new URLSearchParams(dados) : undefined,
    });
    const html = await r.text();
    assert.equal(r.status, status, url + " / " + ator + " / " + html.slice(0, 150));
    verificacoes++;
    return { html, local: r.headers.get("location") };
  };

  await pedir("/interacoes/perfil/parceira/seguir", "autora", 303, { ativo: "sim" });
  await pedir("/interacoes/perfil/autora/seguir", "parceira", 303, { ativo: "sim" });
  const destaque = (await pedir("/dashboard", "autora", 200)).html;
  assert.match(destaque.split("Profissionais para colaborar").at(-1).split("Eventos em destaque")[0], /\/p\/parceira/);
  assert.match((await pedir("/p/parceira", "autora", 200)).html, /action="\/messages\/start"/);
  const primeira = await pedir("/messages/start", "autora", 303, { alvo_id: "parceira" });
  const rota = primeira.local;
  assert.equal((await pedir("/messages/start", "parceira", 303, { alvo_id: "autora" })).local, rota);
  await pedir(rota, "terceiro", 403);
  await pedir(rota, null, 302);
  const mensagem = { texto: "CONTEUDO_PRIVADO_DO_ENSAIO", chave: "fixture-mensagem-0001" };
  await pedir(rota, "autora", 303, mensagem);
  await pedir(rota, "autora", 303, mensagem);
  assert.match((await pedir(rota, "autora", 200)).html, /· Enviada/);
  const caixaDestino = await pedir(rota, "parceira", 200);
  assert.equal(caixaDestino.html.split(mensagem.texto).length - 1, 1);
  assert.match((await pedir(rota, "autora", 200)).html, /· Lida/);
  await pedir(rota + "/hide", "terceiro", 403, {});
  await pedir(rota + "/hide", "autora", 303, {});
  assert.ok(!(await pedir("/messages", "autora", 200)).html.includes(rota));
  assert.ok((await pedir("/messages", "parceira", 200)).html.includes(rota));
  assert.match((await pedir(rota, "parceira", 200)).html, /CONTEUDO_PRIVADO_DO_ENSAIO/);
  await pedir("/messages/block", "autora", 303, { acao: "bloquear", alvo_id: "parceira" });
  const leitor = new Database(process.env.CYPHER_DB_PATH, { readonly: true });
  try {
    const vinculos = leitor.prepare("SELECT count(*) FROM profissionais_seguidos WHERE seguidor_id IN ('autora','parceira') AND profissional_id IN ('autora','parceira')").pluck();
    assert.equal(vinculos.get(), 0);
    await pedir("/messages/start", "parceira", 403, { alvo_id: "autora" });
    await pedir(rota, "parceira", 403, { texto: "Nova", chave: "fixture-bloqueio-0001" });
    await pedir("/messages/block", "autora", 303, { acao: "desbloquear", alvo_id: "parceira" });
    assert.equal(vinculos.get(), 0);
  } finally {
    leitor.close();
  }

  for (const [tipo, funcao, categoria] of [["beat", "Mixagem", ""], ["evento", "Sonorização", "equipe"]]) {
    await pedir(`/creditos/gerir/${tipo}/${tipo}`, "terceiro", 404);
    await pedir(`/creditos/gerir/${tipo}/${tipo}`, "autora", 303, { perfil: "@parceira", funcao, categoria });
  }
  b.inicializarBancoCypher();
  const creditos = b.conexaoInternaCypher().prepare("SELECT id,tipo FROM creditos_publicacoes ORDER BY tipo").all();
  b.fecharBancoCypher();
  assert.equal(creditos.length, 2);
  for (const { id, tipo } of [{ id: "credito-obra", tipo: "obra" }, ...creditos]) {
    const url = `/creditos/${tipo}/${id}`;
    const motivo = "A função foi conferida com a equipe.";
    await pedir(url, "terceiro", 404);
    await pedir(url, "autora", 409, { acao: "confirmado" });
    await pedir(url, "parceira", 303, { acao: "recusado" });
    await pedir(url, "autora", 303, { acao: "contestado", motivo });
    await pedir("/admin" + url, "editor", 403, { acao: "validado", motivo });
    await pedir("/admin" + url, "moderador", 303, { acao: tipo === "obra" ? "invalidado" : "validado", motivo });
  }
  const marca = { direitos: "sim", justificativa: "Marca sintética autorizada no ensaio.",
    imagem: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR4nGNwaEggCTGMahjVkDBsNQAA/NggEPO4huEAAAAASUVORK5CYII=" };
  await pedir("/selos/solicitacoes", "parceira", 201, marca);
  b.inicializarBancoCypher();
  const idSelo = b.conexaoInternaCypher().prepare("SELECT id FROM pedidos_selo_externo WHERE autor_id='parceira'").pluck().get();
  b.fecharBancoCypher();
  await pedir("/selos/imagem/" + idSelo, "terceiro", 404);
  await pedir("/admin/selos/" + idSelo, "editor", 403, { acao: "aprovado", motivo: "Revisão da autorização da marca." });
  await pedir("/admin/selos/imagem/" + idSelo, "moderador", 200);
  await pedir("/admin/selos/" + idSelo, "moderador", 303, { acao: "aprovado", motivo: "Revisão da autorização da marca." });
  await pedir("/creditos/obra/credito-voz", "parceira", 303, { acao: "confirmado" });
  for (const [url, funcao] of [["/events/evento", "Sonorização"], ["/beats/beat", "Mixagem"], ["/p/autora?obra=obra", "Vocal"]]) {
    const { html } = await pedir(url, "terceiro", 200);
    assert.ok(html.includes(funcao), "Função em " + url);
    assert.ok(html.includes("/selos/imagem/" + idSelo), "Selo aprovado em " + url);
  }
  b.inicializarBancoCypher();
  const { creditosFicha } = await import("../dist/src/app/models/creditosPublicacoes.js");
  assert.ok(creditosFicha("terceiro", "evento", "evento").equipe[0].selo);
  assert.ok(creditosFicha("terceiro", "beat", "beat").equipe[0].selo);
  assert.deepEqual(creditosFicha("terceiro", "obra", "obra").equipe.map(c => c.funcao), ["Vocal"]);
  console.log(`Fluxos sociais aprovados. ${verificacoes} respostas HTTP verificadas.`);
} finally {
  if (servidor?.exitCode === null) {
    servidor.kill();
    await new Promise(resolve => servidor.once("exit", resolve));
  }
  b.fecharBancoCypher();
  await fs.rm(pasta, { recursive: true, force: true });
}
