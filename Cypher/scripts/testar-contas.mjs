import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-contas-"));
const arquivo = path.join(pasta, "cypher.sqlite"),
  caixa = path.join(pasta, "emails");
process.env.CYPHER_DB_PATH = arquivo;
process.env.NODE_ENV = "test";
const banco = await import("../dist/src/app/models/bancoDados.js");
const protecoes = await import("../dist/src/app/models/protecoesConta.js");
const identidade =
  await import("../dist/src/app/validators/validarIdentidade.js");
const moderacao = await import("../dist/src/app/models/politicasModeracao.js");
const consentimento =
  await import("../dist/src/app/models/consentimentoConta.js");
const hoje = identidade.dataAtualCadastro();
const nascimento = idade =>
  `${Number(hoje.slice(0, 4)) - idade}${hoje.slice(4)}`;
assert.equal(identidade.idadeNaData("2010-11-24", "2026-11-24"), 16);
assert.equal(identidade.idadeNaData("2010-11-25", "2026-11-24"), 15);
assert.equal(identidade.idadeNaData("2008-02-29", "2026-02-28"), 17);
assert.equal(identidade.idadeNaData("2008-02-29", "2026-03-01"), 18);
banco.inicializarBancoCypher();
const administracao = await import('../dist/src/app/models/administracao.js');
const administradorId = await administracao.criarAdministrador({nome:'Equipe isolada',email:'admin@teste.local',senha:'AdminSomenteTeste2026',papel:'super_admin'});
banco.fecharBancoCypher();
const reserva = createServer();
await new Promise(resolve => reserva.listen(0, "127.0.0.1", resolve));
const porta = reserva.address().port;
await new Promise(resolve => reserva.close(resolve));
const base = `http://127.0.0.1:${porta}`;
const processo = spawn(process.execPath, ["dist/src/aplicacao.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(porta), CYPHER_EMAIL_DIR: caixa },
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
processo.stdout.on("data", d => (log += d));
processo.stderr.on("data", d => (log += d));
const fim = new Promise(resolve => processo.once("exit", resolve));
let db;
try {
  let pagina;
  for (let n = 0; n < 80; n++) {
    try {
      const r = await fetch(`${base}/register`);
      if (r.ok) {
        pagina = r;
        break;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(pagina, log);
  const html = await pagina.text();
  assert.match(html, /A partir de 16 anos/);
  assert.match(html, /name="aceiteTermos"/);
  const csrf = pagina.headers
    .getSetCookie()
    .find(c => c.startsWith("cypher_csrf="))
    .split(";")[0];
  const csrfToken = csrf.slice("cypher_csrf=".length);
  const req = (
    rota,
    { body, cookie = "", method = body ? "POST" : "GET" } = {}
  ) =>
    fetch(base + rota, {
      method,
      redirect: "manual",
      headers: {
        cookie: [csrf, cookie].filter(Boolean).join("; "),
        ...(body
          ? {
              "content-type": "application/x-www-form-urlencoded",
              "x-csrf-token": csrfToken,
            }
          : {}),
      },
      body: body ? new URLSearchParams(body) : undefined,
    });
  const dados = (nome, idade = 24, tipo = "consumidor") => ({
    name: `Pessoa ${nome}`,
    email: `${nome}@teste.local`,
    identificador: nome,
    nascimento: nascimento(idade),
    tipoConta: tipo,
    password: "SenhaOriginal2026",
    passwordConfirmation: "SenhaOriginal2026",
    aceiteTermos: "sim",
    versaoTermos: consentimento.versaoTermos,
    versaoPrivacidade: consentimento.versaoPrivacidade,
    ...(tipo === "profissional"
      ? {
          categorias: "Letrista",
          respostasAtuacoesJson: JSON.stringify({
            Letrista: { tempoAtuacao: "iniciando" },
          }),
          visibilidadesAtuacoesJson: "{}",
        }
      : {}),
  });
  db = new Database(arquivo);
  const conta = nome =>
    db
      .prepare("SELECT * FROM usuarios WHERE email=?")
      .get(`${nome}@teste.local`);
  const mensagem = (email, rota) =>
    fs
      .readdirSync(caixa)
      .filter(n => n.endsWith(".eml"))
      .sort()
      .reverse()
      .map(n => fs.readFileSync(path.join(caixa, n), "utf8"))
      .find(m => m.startsWith(`To: ${email}\n`) && m.includes(rota));
  const token = (email, rota) => {
    const m = mensagem(email, rota);
    assert.ok(m, `Mensagem ${rota} deve existir`);
    return m.match(/token=([a-f0-9]{64})/)[1];
  };
  const login = async (nome, senha = "SenhaOriginal2026") => {
    const r = await req("/login", {
      body: { identificador: `${nome}@teste.local`, password: senha },
    });
    assert.equal(r.status, 302, log);
    assert.equal(r.headers.get("location"), "/dashboard");
    return r.headers
      .getSetCookie()
      .find(c => c.startsWith("cypher_session="))
      .split(";")[0];
  };
  for (const alteracao of [
    { aceiteTermos: "" },
    { tipoConta: "" },
    { versaoTermos: "antiga" },
    { versaoPrivacidade: "antiga" },
    { nascimento: nascimento(15) },
  ]) {
    assert.equal(
      (await req("/register", { body: { ...dados("invalida"), ...alteracao } }))
        .status,
      400
    );
    assert.equal(conta("invalida"), undefined);
  }
  for (const [nome, idade, tipo] of [
    ["adulta", 24, "profissional"],
    ["jovem16", 16, "consumidor"],
    ["jovem17", 17, "profissional"],
  ]) {
    assert.equal(
      (await req("/register", { body: dados(nome, idade, tipo) })).status,
      303
    );
    assert.equal(
      (
        await req("/login", {
          body: { email: `${nome}@teste.local`, password: "SenhaOriginal2026" },
        })
      ).status,
      401
    );
    const registro = db
      .prepare("SELECT * FROM consentimentos_conta WHERE usuario_id=?")
      .get(conta(nome).id);
    assert.equal(registro.versao_termos, consentimento.versaoTermos);
    assert.equal(registro.versao_privacidade, consentimento.versaoPrivacidade);
    assert.ok(registro.aceito_em > 0);
    assert.equal(
      (
        await req("/confirmar-email", {
          body: { token: token(`${nome}@teste.local`, "/confirmar-email?") },
        })
      ).status,
      200
    );
  }
  const adulta = conta("adulta"),
    jovem = conta("jovem16"),
    jovem17 = conta("jovem17");
  let cookie = await login("adulta");
  const cookieJovem = await login("jovem16"),
    cookie17 = await login("jovem17");
  assert.equal(
    db
      .prepare("SELECT perfil_publico FROM perfis WHERE usuario_id=?")
      .get(adulta.id).perfil_publico,
    1
  );
  assert.equal(
    db
      .prepare("SELECT perfil_publico FROM perfis WHERE usuario_id=?")
      .get(jovem17.id).perfil_publico,
    0
  );
  await req("/settings/privacy", {
    body: {
      perfilPublico: "on",
      localizacaoPublica: "on",
      contatoPublico: "on",
    },
    cookie: cookie17,
  });
  assert.deepEqual(
    db
      .prepare(
        "SELECT perfil_publico,localizacao_publica,contato_publico FROM perfis WHERE usuario_id=?"
      )
      .get(jovem17.id),
    { perfil_publico: 0, localizacao_publica: 0, contato_publico: 0 }
  );
  const ativacao = {
    categorias: "Letrista",
    respostasAtuacoesJson: JSON.stringify({
      Letrista: { tempoAtuacao: "iniciando" },
    }),
    visibilidadesAtuacoesJson: "{}",
    confirmar: "1",
  };
  assert.equal(
    (
      await req("/profile/profissionalizar", {
        body: ativacao,
        cookie: cookieJovem,
      })
    ).status,
    303
  );
  assert.equal(
    db
      .prepare("SELECT perfil_publico FROM perfis WHERE usuario_id=?")
      .get(jovem.id).perfil_publico,
    0
  );
  assert.equal((await req("/p/jovem17", { cookie })).status, 404);
  assert.equal((await req("/p/adulta")).status, 302);
  assert.match(
    await (await req("/settings", { cookie: cookie17 })).text(),
    /Até os 18 anos/
  );
  assert.equal(
    protecoes.contatoEtarioPermitido(db, adulta.id, jovem.id),
    false
  );
  assert.equal(
    protecoes.contatoEtarioPermitido(db, jovem.id, jovem17.id),
    true
  );
  db.prepare("UPDATE perfis SET perfil_publico=1 WHERE usuario_id=?").run(
    jovem.id
  );
  assert.equal(
    moderacao.objetoDisponivel(db, "perfil", jovem.id, adulta.id),
    false,
    "Política central impede exposição mesmo com flag antiga"
  );
  const forjada = await req("/settings/identidade", {
    body: {
      nomeInformado: "Pessoa jovem16",
      vulgo: "",
      nascimento: nascimento(30),
      tratamento: "",
    },
    cookie: cookieJovem,
  });
  assert.equal(forjada.status, 400);
  assert.equal(
    db.prepare("SELECT nascimento FROM perfis WHERE usuario_id=?").get(jovem.id)
      .nascimento,
    nascimento(16)
  );
  for (const rota of [
    "/recuperar-senha",
    "/termos-de-uso",
    "/politica-privacidade",
  ])
    assert.equal((await req(rota)).status, 200);
  const desconhecida = await req("/recuperar-senha", {
    body: { email: "ausente@teste.local" },
  });
  const conhecida = await req("/recuperar-senha", {
    body: { email: adulta.email },
  });
  assert.equal(
    await conhecida.text(),
    await desconhecida.text(),
    "Resposta não deve revelar cadastro"
  );
  let recuperacao = token(adulta.email, "/redefinir-senha?");
  let registro = db
    .prepare("SELECT * FROM tokens_recuperacao_senha WHERE usuario_id=?")
    .get(adulta.id);
  assert.equal(
    registro.token_hash,
    createHash("sha256").update(recuperacao).digest("hex")
  );
  assert.equal(registro.expira_em - registro.criado_em, 30 * 60 * 1000);
  await req("/recuperar-senha", { body: { email: adulta.email } });
  assert.equal(
    db
      .prepare(
        "SELECT count(*) n FROM tokens_recuperacao_senha WHERE usuario_id=?"
      )
      .get(adulta.id).n,
    1
  );
  assert.equal(
    (await req("/redefinir-senha?token=" + recuperacao)).status,
    200
  );
  assert.equal(
    (
      await req("/redefinir-senha", {
        body: {
          token: recuperacao,
          password: "curta",
          passwordConfirmation: "curta",
        },
      })
    ).status,
    400
  );
  const segundaSessao = await login("adulta");
  const nova = {
    token: recuperacao,
    password: "NovaSenhaTeste2026",
    passwordConfirmation: "NovaSenhaTeste2026",
  };
  const repetidas = await Promise.all([
    req("/redefinir-senha", { body: nova }),
    req("/redefinir-senha", { body: nova }),
  ]);
  assert.deepEqual(repetidas.map(r => r.status).sort(), [200, 400]);
  assert.equal(
    db
      .prepare("SELECT count(*) n FROM sessoes WHERE usuario_id=?")
      .get(adulta.id).n,
    0
  );
  assert.equal((await req("/settings", { cookie })).status, 302);
  assert.equal((await req("/settings", { cookie: segundaSessao })).status, 302);
  assert.equal(
    (
      await req("/login", {
        body: { email: adulta.email, password: "SenhaOriginal2026" },
      })
    ).status,
    401
  );
  cookie = await login("adulta", nova.password);
  const hashAntes = conta("adulta").senha_hash;
  assert.match(
    (
      await req("/settings/senha", {
        cookie,
        body: {
          senhaAtual: "errada",
          password: "SenhaAlterada2026",
          passwordConfirmation: "SenhaAlterada2026",
        },
      })
    ).headers.get("location"),
    /erro=/
  );
  assert.equal(conta("adulta").senha_hash, hashAntes);
  assert.equal(
    (
      await req("/settings/senha", {
        cookie,
        body: {
          senhaAtual: nova.password,
          password: "SenhaAlterada2026",
          passwordConfirmation: "SenhaAlterada2026",
        },
      })
    ).status,
    200
  );
  assert.equal((await req("/settings", { cookie })).status, 302);
  cookie = await login("adulta", "SenhaAlterada2026");
  db.prepare(
    "UPDATE tokens_recuperacao_senha SET criado_em=criado_em-61000 WHERE usuario_id=?"
  ).run(adulta.id);
  await req("/recuperar-senha", { body: { email: adulta.email } });
  recuperacao = token(adulta.email, "/redefinir-senha?");
  db.prepare(
    "UPDATE tokens_recuperacao_senha SET expira_em=0 WHERE token_hash=?"
  ).run(createHash("sha256").update(recuperacao).digest("hex"));
  assert.equal(
    (await req("/redefinir-senha?token=" + recuperacao)).status,
    400
  );
  for (let n = 0; n < 6; n++) {
    db.prepare(
      "UPDATE tokens_recuperacao_senha SET criado_em=criado_em-61000 WHERE usuario_id=?"
    ).run(adulta.id);
    await req("/recuperar-senha", { body: { email: adulta.email } });
  }
  assert.equal(
    db
      .prepare(
        "SELECT count(*) n FROM tokens_recuperacao_senha WHERE usuario_id=?"
      )
      .get(adulta.id).n,
    5,
    "Limite de cinco emissões por hora"
  );
  db.prepare(
    "INSERT INTO obras(id,proprietario_id,titulo,tipo,situacao,publicada) VALUES('propria',?,'Trabalho próprio','Música','Lançado',1),('compartilhada',?,'Trabalho compartilhado','Música','Lançado',1)"
  ).run(adulta.id, jovem17.id);
  db.prepare(
    "INSERT INTO creditos(id,obra_id,usuario_creditado_id,nome_creditado,funcao) VALUES('credito','compartilhada',?,'Pessoa adulta','Letra')"
  ).run(adulta.id);
  assert.match(
    (
      await req("/settings/delete-account", {
        cookie,
        body: { senha: "SenhaAlterada2026", confirmacao: "NÃO" },
      })
    ).headers.get("location"),
    /erro=/
  );
  assert.equal(
    db
      .prepare("SELECT 1 FROM encerramentos_conta WHERE usuario_id=?")
      .get(adulta.id),
    undefined
  );
  db.prepare("INSERT INTO restricoes_contas(usuario_id,motivo,administrador_id) VALUES(?,?,?)").run(adulta.id,'Suspensão isolada para testar o direito de encerramento',administradorId);
  const acessoRestrito = await req('/settings',{cookie});
  assert.equal(acessoRestrito.status,303);
  assert.match(acessoRestrito.headers.get('location'),/^\/suporte/);
  assert.equal((await req('/settings/encerramento',{cookie})).status,200);
  assert.equal(
    (
      await req("/settings/delete-account", {
        cookie,
        body: { senha: "SenhaAlterada2026", confirmacao: "ENCERRAR" },
      })
    ).status,
    200
  );
  assert.equal((await req("/settings", { cookie })).status, 302);
  const encerrada = db
    .prepare("SELECT email,senha_hash FROM usuarios WHERE id=?")
    .get(adulta.id);
  assert.deepEqual(encerrada, { email: null, senha_hash: null });
  assert.equal(
    db
      .prepare("SELECT nome_informado FROM perfis WHERE usuario_id=?")
      .get(adulta.id).nome_informado,
    ""
  );
  assert.equal(
    db.prepare("SELECT publicada FROM obras WHERE id=?").get("propria")
      .publicada,
    0
  );
  assert.equal(
    db.prepare("SELECT count(*) n FROM creditos WHERE id=?").get("credito").n,
    1
  );
  assert.equal(db.prepare("SELECT count(*) n FROM obras").get().n, 2);
  assert.ok(
    db
      .prepare("SELECT 1 FROM identificadores_usuario WHERE usuario_id=?")
      .get(adulta.id)
  );
  assert.equal(
    protecoes.contatoEtarioPermitido(db, adulta.id, jovem.id),
    false
  );
  assert.equal(
    (
      await req("/login", {
        body: { email: adulta.email, password: "SenhaAlterada2026" },
      })
    ).status,
    401
  );
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  console.log(
    "OK: contas16/17, consentimentos versionados, privacidade e contato protegidos, recuperação sem enumeração, token30min/uso único/limites, alteração de senha e revogação de sessões, encerramento com preservação de créditos e integridade."
  );
} finally {
  db?.close();
  banco.fecharBancoCypher();
  processo.kill();
  await fim;
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}
