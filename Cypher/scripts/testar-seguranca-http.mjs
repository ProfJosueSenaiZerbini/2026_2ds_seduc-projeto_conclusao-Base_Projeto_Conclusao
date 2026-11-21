import { verificarEspacoTrabalho } from "./verificar-espaco-trabalho.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-seguranca-http-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "cypher.sqlite");
process.env.NODE_ENV = "test";
const b = await import("../dist/src/app/models/bancoDados.js");
const a = await import("../dist/src/app/models/administracao.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
b.inicializarBancoCypher();
const senha = "SenhaForteParaTeste2026";
const superior = await a.criarAdministrador({
  nome: "Admin Interno",
  email: "super@teste.local",
  senha,
  papel: "super_admin",
});
await a.criarAdministrador(
  {
    nome: "Moderação Interna",
    email: "mod@teste.local",
    senha,
    papel: "moderador",
  },
  superior
);
const editorId = await a.criarAdministrador(
  {
    nome: "Editor Interno",
    email: "editor@teste.local",
    senha,
    papel: "editor",
  },
  superior
);
const hash = await auth.gerarHashSenha(senha);
for (const [id, tipo, categorias] of [
  ["rapper", "profissional", ["Rapper"]],
  ["letrista", "profissional", ["Letrista"]],
  ["consumidor", "consumidor", []],
]) {
  b.criarContaCypher({
    id,
    email: `${id}@teste.local`,
    senhaHash: hash,
    tipoConta: tipo,
    nome: `Conta ${id}`,
    funcao: categorias.join(" · "),
    identificador: `@${id}`,
    iniciais: "TE",
    cTag: `TAG-${id}`,
    categorias,
    outraCategoria: "",
  });
  b.conexaoInternaCypher().prepare("UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?").run(id);
  b.conexaoInternaCypher()
    .prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?")
    .run(id);
}
b.fecharBancoCypher();
const reserva = createServer();
await new Promise(resolve => reserva.listen(0, "127.0.0.1", resolve));
const porta = reserva.address().port;
await new Promise(resolve => reserva.close(resolve));
const base = `http://127.0.0.1:${porta}`;
const processo = spawn(process.execPath, ["dist/src/aplicacao.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(porta),
    CYPHER_ADMIN_EMAILS: "rapper@teste.local",
  },
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
processo.stdout.on("data", d => (log += d));
processo.stderr.on("data", d => (log += d));
const fim = new Promise(resolve => processo.once("exit", resolve));
try {
  let pronto;
  for (let n = 0; n < 80; n++) {
    try {
      const r = await fetch(`${base}/login`);
      if (r.ok) {
        pronto = r;
        break;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(pronto, log);
  const csrf = pronto.headers
    .getSetCookie()
    .find(c => c.startsWith("cypher_csrf="))
    ?.split(";")[0];
  const html = await pronto.text();
  assert.match(html, /name="_csrf"/);
  const token = csrf.slice("cypher_csrf=".length);
  const request = (
    rota,
    { cookie = "", method = "GET", body, proteger = true, extra = {} } = {}
  ) =>
    fetch(`${base}${rota}`, {
      method,
      redirect: "manual",
      headers: {
        cookie: [cookie, csrf].filter(Boolean).join("; "),
        ...(method === "POST"
          ? {
              "content-type": "application/x-www-form-urlencoded",
              ...(proteger ? { "x-csrf-token": token } : {}),
            }
          : {}),
        ...extra,
      },
      body: body ? new URLSearchParams(body) : undefined,
    });
  const login = async (email, interno = false) => {
    const r = await request(interno ? "/admin/login" : "/login", {
      method: "POST",
      body: { email, password: senha },
    });
    assert.equal(r.status, interno ? 303 : 302);
    const nome = interno ? "cypher_admin_session=" : "cypher_session=";
    const cookie = r.headers
      .getSetCookie()
      .find(c => c.startsWith(nome))
      ?.split(";")[0];
    assert.ok(cookie);
    return cookie;
  };
  assert.equal(
    (
      await request("/login", {
        method: "POST",
        body: { email: "rapper@teste.local", password: senha },
        proteger: false,
      })
    ).status,
    403
  );
  assert.equal(
    (
      await request("/login", {
        method: "POST",
        body: {},
        extra: { origin: "https://terceiro.invalid" },
      })
    ).status,
    403
  );
  assert.equal(
    (
      await request("/login", {
        method: "POST",
        body: {},
        extra: { "x-csrf-token": "é".repeat(64) },
      })
    ).status,
    403
  );
  const rapper = await login("rapper@teste.local");
  const letrista = await login("letrista@teste.local");
  const consumidor = await login("consumidor@teste.local");
  assert.equal(
    (await request("/admin", { cookie: rapper })).status,
    403,
    "Allowlist antiga não concede privilégio"
  );
  assert.equal(
    (
      await request("/admin/login", {
        method: "POST",
        body: { email: "rapper@teste.local", password: senha },
      })
    ).status,
    401
  );
  assert.equal(
    (
      await request("/login", {
        method: "POST",
        body: { email: "super@teste.local", password: senha },
      })
    ).status,
    401
  );
  assert.equal(
    (
      await request("/register", {
        method: "POST",
        body: {
          tipoConta: "administrativo",
          name: "Invasor",
          email: "invasor@teste.local",
          password: senha,
        },
      })
    ).status,
    400
  );
  assert.equal(
    (await request("/works/new?tipo=Instrumental", { cookie: rapper })).status,
    403
  );
  for (const categoria of ["Muralista", "Artista digital", "Manager", "Produtor(a) executivo(a)", "Crítico(a) musical", "Social media", "Educador(a)", "Pesquisador(a) cultural", "Articulador(a) cultural", "Diretor(a) audiovisual", "Freestyler"]) {
    const rejeitada = await request("/register", {method:"POST", body:{name:"Conta de teste",email:"retirada@teste.local",password:senha,categorias:categoria}});
    assert.equal(rejeitada.status,400,`${categoria} não pode entrar por POST manual`);
  }
  assert.equal(
    (await request("/works/new?tipo=Música", { cookie: rapper })).status,
    200
  );
  for (const cookie of [letrista, consumidor]) {
    const catalogo = await request("/works", { cookie });
    assert.equal(catalogo.status, 200);
    assert.doesNotMatch(await catalogo.text(), /data-work-type-open/);
    const proibido = await request("/works/new", {
      cookie,
      method: "POST",
      body: { tipo: "Música", titulo: "Forjada" },
    });
    assert.ok([303, 403].includes(proibido.status));
    const beat = await request("/beats/new", {
      cookie,
      method: "POST",
      body: { titulo: "Forjado" },
    });
    assert.ok([302, 303, 403].includes(beat.status));
    const evento = await request("/events/new", {
      cookie,
      method: "POST",
      body: { titulo: "Forjado" },
    });
    assert.ok([302, 303, 403].includes(evento.status));
  }
  assert.equal((await request("/p/consumidor")).status, 404);
  const busca = await request("/search", { cookie: rapper });
  const buscaHtml = await busca.text();
  assert.doesNotMatch(
    buscaHtml,
    /Conta consumidor|Admin Interno|Moderação Interna|Editor Interno/
  );
  const superiorCookie = await login("super@teste.local", true);
  const modCookie = await login("mod@teste.local", true);
  const editorCookie = await login("editor@teste.local", true);
  for (const cookie of [superiorCookie, modCookie, editorCookie]) {
    const painel = await request("/admin", { cookie });
    assert.equal(painel.status, 200);
    assert.doesNotMatch(
      await painel.text(),
      /href="\/profile"|REPUTAÇÃO|workspace-chip/
    );
    assert.equal((await request("/profile", { cookie })).status, 302);
  }
  assert.equal(
    (await request("/admin/revisao", { cookie: superiorCookie })).status,
    200
  );
  assert.equal(
    (await request("/admin/revisao", { cookie: modCookie })).status,
    403
  );
  assert.equal(
    (await request("/admin/revisao/excecoes", { cookie: modCookie })).status,
    200
  );
  assert.equal(
    (await request("/admin/revisao/excecoes", { cookie: editorCookie })).status,
    403
  );
  assert.equal(
    (
      await request("/admin/equipe", {
        cookie: modCookie,
        method: "POST",
        body: {},
      })
    ).status,
    403
  );
  assert.equal(
    (
      await request("/admin/equipe", {
        cookie: editorCookie,
        method: "POST",
        body: {},
      })
    ).status,
    403
  );
  const staff = await request("/admin/equipe", {
    cookie: superiorCookie,
    method: "POST",
    body: {
      nome: "Nova moderação",
      email: "nova@teste.local",
      senha,
      papel: "moderador",
    },
  });
  assert.equal(staff.status, 303);
  assert.equal(staff.headers.get("location"), "/admin?salvo=1");
  const revogar = await request(`/admin/equipe/${editorId}`, {
    cookie: superiorCookie,
    method: "POST",
    body: { papel: "editor" },
  });
  assert.equal(revogar.status, 303);
  assert.equal((await request("/admin", { cookie: editorCookie })).status, 302);
  for (let i = 0; i < 31; i++) {
    const r = await request("/login", {
      method: "POST",
      body: { email: "inexistente@teste.local", password: senha },
    });
    if (i === 30) {
      assert.equal(r.status, 429);
      assert.ok(r.headers.get("retry-after"));
    }
  }
  b.inicializarBancoCypher();
  const db = b.conexaoInternaCypher();
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS total FROM usuarios WHERE email='invasor@teste.local'"
      )
      .get().total,
    0
  );
  for (const tabela of ["obras", "beats", "eventos"])
    assert.equal(
      db.prepare(`SELECT count(*) AS total FROM ${tabela}`).get().total,
      0
    );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS total FROM perfis p JOIN usuarios u ON p.usuario_id=u.id WHERE u.tipo_conta='administrativo'"
      )
      .get().total,
    0
  );
  await verificarEspacoTrabalho({ request, banco:b, rapper, letrista, consumidor });
  b.fecharBancoCypher();
  console.log(
    "OK: HTTP compilado, CSRF, limite de login, permissões contextuais, consumidor privado, sessões separadas, RBAC e equipe sem perfil público."
  );
} finally {
  processo.kill();
  await fim;
  b.fecharBancoCypher();
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}

