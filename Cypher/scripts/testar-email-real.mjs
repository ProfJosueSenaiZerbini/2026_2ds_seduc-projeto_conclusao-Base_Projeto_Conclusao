import assert from "node:assert/strict";
import { ImapFlow } from "imapflow";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Opt-in: envia uma confirmação real somente à própria conta SMTP configurada.
assert.ok(
  process.argv.includes("--enviar"),
  "Use --enviar para autorizar o teste real."
);
process.loadEnvFile(".env.local");
const destino = process.env.CYPHER_SMTP_USER;
assert.equal(destino, "og.cypher.ofc@gmail.com");
const imap = new ImapFlow({
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  auth: {
    user: destino,
    pass: process.env.CYPHER_SMTP_PASSWORD.replace(/\s/g, ""),
  },
  logger: false,
  connectionTimeout: 15000,
  socketTimeout: 20000,
});
imap.on("error", () => {});
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-email-real-"));
let servidor, fim;
try {
  await imap.connect();
  const pastas = await imap.list();
  const alvos = [
    "INBOX",
    ...pastas.filter(p => p.specialUse === "\\Junk").map(p => p.path),
  ];
  const limites = new Map();
  for (const alvo of alvos) {
    await imap.mailboxOpen(alvo, { readOnly: true });
    limites.set(alvo, imap.mailbox.uidNext);
  }
  const reserva = createServer();
  await new Promise(r => reserva.listen(0, "127.0.0.1", r));
  const porta = reserva.address().port;
  await new Promise(r => reserva.close(r));
  const origem = `http://localhost:${porta}`;
  servidor = spawn(process.execPath, ["dist/src/aplicacao.js"], {
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      NODE_ENV: "development",
      CYPHER_DB_PATH: path.join(pasta, "teste.sqlite"),
      PORT: String(porta),
      CYPHER_PUBLIC_ORIGIN: origem,
      CYPHER_EMAIL_TRANSPORT: "smtp",
    },
  });
  fim = new Promise(r => servidor.once("exit", r));
  let pagina;
  for (let n = 0; n < 80; n++) {
    try {
      const r = await fetch(`${origem}/register`);
      if (r.ok) {
        pagina = r;
        break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(pagina, "Servidor temporário indisponível.");
  const csrf = pagina.headers
    .getSetCookie()
    .find(c => c.startsWith("cypher_csrf="))
    .split(";")[0];
  const post = (rota, body, cookie = "") =>
    fetch(`${origem}${rota}`, {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie: [csrf, cookie].filter(Boolean).join("; "),
        "content-type": "application/x-www-form-urlencoded",
        "x-csrf-token": csrf.slice("cypher_csrf=".length),
      },
      body: new URLSearchParams(body),
    });
  const senha = randomBytes(20).toString("base64url");
  const cadastro = await post("/register", {
    name: "Cypher Teste de Entrega",
    email: destino,
    identificador: "teste.email.real",
    tipoConta: "consumidor",
    nascimento: "1990-01-01",
    password: senha,
    passwordConfirmation: senha,
  });
  assert.equal(cadastro.status, 303);
  assert.equal(
    cadastro.headers.get("location"),
    "/email/pendente",
    "A entrega SMTP deve concluir sem erro."
  );
  console.log(
    "OK: cadastro HTTP e envio SMTP real concluídos. Aguardando chegada na própria caixa da Cypher."
  );
  let token, pastaRecebida;
  for (let tentativa = 0; tentativa < 18 && !token; tentativa++) {
    for (const alvo of alvos) {
      await imap.mailboxOpen(alvo, { readOnly: true });
      if (imap.mailbox.uidNext <= limites.get(alvo)) continue;
      const ids = await imap.search(
        { uid: `${limites.get(alvo)}:*`, from: destino, to: destino },
        { uid: true }
      );
      for (const uid of ids.filter(uid => uid >= limites.get(alvo))) {
        const mensagem = await imap.fetchOne(
          uid,
          { source: true },
          { uid: true }
        );
        const texto = mensagem.source
          .toString()
          .replace(/=\r?\n/g, "")
          .replace(/=3D/g, "=");
        const link = texto.match(
          new RegExp(
            `http://localhost:${porta}/confirmar-email\\?token=([a-f0-9]{64})`
          )
        );
        if (link) {
          token = link[1];
          pastaRecebida = alvo;
          break;
        }
      }
      if (token) break;
    }
    if (!token) await new Promise(r => setTimeout(r, 2000));
  }
  assert.ok(
    token,
    "Mensagem não localizada em Entrada/Spam no prazo do teste."
  );
  assert.equal(
    pastaRecebida,
    "INBOX",
    "Mensagem chegou ao spam; investigar entregabilidade."
  );
  assert.equal((await post("/confirmar-email", { token })).status, 200);
  assert.equal(
    (await post("/confirmar-email", { token })).status,
    400,
    "Token usado não pode ser reutilizado."
  );
  const login = await post("/login", { email: destino, password: senha });
  assert.equal(login.status, 302);
  assert.ok(
    login.headers.getSetCookie().some(c => c.startsWith("cypher_session="))
  );
  console.log(
    "OK: mensagem recebida na Caixa de entrada; link recebido confirmou a conta, uso repetido foi bloqueado e login funcionou."
  );
} catch (erro) {
  console.error(
    erro instanceof assert.AssertionError
      ? erro.message
      : `Teste real indisponível (${typeof erro?.code === "string" ? erro.code : "conexão ou serviço externo"}).`
  );
  process.exitCode = 1;
} finally {
  try {
    await imap.logout();
  } catch {
    imap.close();
  }
  if (servidor) {
    servidor.kill();
    await fim;
  }
  assert.equal(path.dirname(pasta), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}
