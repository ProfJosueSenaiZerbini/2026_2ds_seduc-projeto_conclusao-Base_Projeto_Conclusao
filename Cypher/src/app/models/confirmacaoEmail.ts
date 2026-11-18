import { createHash, randomBytes } from "node:crypto";
import { entregarEmail, configurarEmail } from "./entregaEmail.js";

import { conexaoInternaCypher } from "./bancoDados.js";
import { validarEmail } from "../validators/validarAutenticacao.js";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const duracaoConfirmacaoEmailMs = 30 * 60 * 1000;

export async function emitirConfirmacaoEmail(
  usuarioId: string,
  destino: string,
  finalidade: "cadastro" | "alteracao" = "cadastro"
) {
  if (validarEmail(destino)) throw new Error("Endereço de e-mail inválido.");
  const db = conexaoInternaCypher();
  const conta = db
    .prepare(
      "SELECT email,tipo_conta AS tipoConta,email_confirmado_em AS confirmado FROM usuarios WHERE id=?"
    )
    .get(usuarioId) as
    { email: string; tipoConta: string; confirmado: string | null } | undefined;
  if (
    !conta ||
    conta.tipoConta === "administrativo" ||
    (finalidade === "cadastro" && conta.confirmado)
  )
    throw new Error("Confirmação indisponível para esta conta.");
  const recente = db
    .prepare(
      "SELECT count(*) AS total,max(criado_em) AS ultimo FROM tokens_confirmacao_email WHERE usuario_id=? AND criado_em>?"
    )
    .get(usuarioId, Date.now() - 60 * 60 * 1000) as {
    total: number;
    ultimo: number | null;
  };
  if (
    recente.total >= 5 ||
    (recente.ultimo && Date.now() - recente.ultimo < 60_000)
  )
    throw new Error(
      "Aguarde um minuto antes de solicitar outro link de confirmação."
    );
  const ocupado = db
    .prepare("SELECT id FROM usuarios WHERE email=? COLLATE NOCASE AND id<>?")
    .get(destino, usuarioId);
  if (ocupado) throw new Error("O e-mail não está disponível.");
  configurarEmail();
  const token = randomBytes(32).toString("hex");
  const origem =
    process.env.CYPHER_PUBLIC_ORIGIN ??
    `http://localhost:${process.env.PORT ?? 3000}`;
  const url = new URL("/confirmar-email", origem);
  url.searchParams.set("token", token);
  db.transaction(() => {
    db.prepare(
      "UPDATE tokens_confirmacao_email SET usado_em=? WHERE usuario_id=? AND finalidade=? AND usado_em IS NULL"
    ).run(Date.now(), usuarioId, finalidade);
    db.prepare(
      "INSERT INTO tokens_confirmacao_email (token_hash,usuario_id,email_destino,finalidade,expira_em,criado_em) VALUES (?,?,?,?,?,?)"
    ).run(
      hashToken(token),
      usuarioId,
      destino.toLowerCase(),
      finalidade,
      Date.now() + duracaoConfirmacaoEmailMs,
      Date.now()
    );
  })();
  try {
    await entregarEmail(
      destino,
      "Confirme seu e-mail na Cypher",
      `Confirme seu endereço pelo link abaixo. Ele expira em 30 minutos e pode ser usado uma única vez.\n\n${url.href}\n\nSe você não solicitou esta ação, ignore esta mensagem.`
    );
  } catch (erro) {
    db.prepare(
      "UPDATE tokens_confirmacao_email SET usado_em=? WHERE token_hash=?"
    ).run(Date.now(), hashToken(token));
    throw erro;
  }
}

export async function confirmarEmailUsuario(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new Error("Link de confirmação inválido ou expirado.");
  const db = conexaoInternaCypher();
  let emailAnterior: string | undefined;
  const usuarioId = db.transaction(() => {
    const registro = db
      .prepare(
        "SELECT usuario_id AS usuarioId,email_destino AS email,finalidade FROM tokens_confirmacao_email WHERE token_hash=? AND usado_em IS NULL AND expira_em>?"
      )
      .get(hashToken(token), Date.now()) as
      { usuarioId: string; email: string; finalidade: string } | undefined;
    if (!registro) throw new Error("Link de confirmação inválido ou expirado.");
    const atual = db
      .prepare("SELECT email FROM usuarios WHERE id=?")
      .get(registro.usuarioId) as { email: string };
    if (registro.finalidade === "cadastro" && registro.email !== atual.email)
      throw new Error("Link de confirmação inválido ou expirado.");
    const ocupado = db
      .prepare("SELECT id FROM usuarios WHERE email=? COLLATE NOCASE AND id<>?")
      .get(registro.email, registro.usuarioId);
    if (ocupado) throw new Error("O novo e-mail não está disponível.");
    db.prepare(
      "UPDATE usuarios SET email=?,email_confirmado_em=CURRENT_TIMESTAMP,atualizado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(registro.email, registro.usuarioId);
    db.prepare(
      "UPDATE tokens_confirmacao_email SET usado_em=? WHERE usuario_id=? AND usado_em IS NULL"
    ).run(Date.now(), registro.usuarioId);
    if (registro.finalidade === "alteracao") {
      db.prepare("DELETE FROM sessoes WHERE usuario_id=?").run(
        registro.usuarioId
      );
      emailAnterior = atual.email;
    }
    return registro.usuarioId;
  })();
  if (emailAnterior) {
    try {
      await entregarEmail(
        emailAnterior,
        "E-mail alterado na Cypher",
        "O e-mail de acesso da sua conta foi alterado após confirmação do novo endereço. Se você não reconhece a alteração, entre em contato com a equipe."
      );
    } catch {
      console.error(
        "Não foi possível entregar o aviso de alteração de e-mail."
      );
    }
  }
  return usuarioId;
}
