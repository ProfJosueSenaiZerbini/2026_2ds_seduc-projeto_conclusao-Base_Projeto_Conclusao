import nodemailer from "nodemailer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { validarEmail } from "../validators/validarAutenticacao.js";

export function configurarEmail() {
  const arquivo = path.resolve(".env.local");
  if (process.env.NODE_ENV !== "test" && fs.existsSync(arquivo))
    process.loadEnvFile(arquivo);
  const modo =
    process.env.NODE_ENV === "test"
      ? "local"
      : (process.env.CYPHER_EMAIL_TRANSPORT ?? "local");
  const remetente = process.env.CYPHER_EMAIL_FROM ?? "og.cypher.ofc@gmail.com";
  if (validarEmail(remetente))
    throw new Error("Configure um remetente válido.");
  if (
    !["local", "smtp"].includes(modo) ||
    (modo === "local" && process.env.NODE_ENV === "production")
  )
    throw new Error("Configure a entrega SMTP antes de habilitar o cadastro.");
  if (
    modo === "smtp" &&
    (!process.env.CYPHER_SMTP_USER || !process.env.CYPHER_SMTP_PASSWORD)
  )
    throw new Error("Configuração SMTP incompleta.");
  if (process.env.NODE_ENV === "production") {
    const origem = new URL(
      process.env.CYPHER_PUBLIC_ORIGIN ?? "http://localhost"
    );
    if (origem.protocol !== "https:")
      throw new Error(
        "Configure a origem pública HTTPS dos links de confirmação."
      );
  }
  return { modo, remetente };
}

export function transporteGmail() {
  configurarEmail();
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.CYPHER_SMTP_USER,
      pass: process.env.CYPHER_SMTP_PASSWORD?.replace(/\s/g, ""),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

export async function entregarEmail(
  destino: string,
  assunto: string,
  texto: string
) {
  const { modo, remetente } = configurarEmail();
  if (validarEmail(destino)) throw new Error("Endereço de e-mail inválido.");
  if (modo === "local") {
    const pasta = path.resolve(
      process.env.CYPHER_EMAIL_DIR ?? path.join(process.cwd(), "data", "emails")
    );
    fs.mkdirSync(pasta, { recursive: true });
    fs.writeFileSync(
      path.join(pasta, `${Date.now()}-${randomUUID()}.eml`),
      `To: ${destino}\nFrom: Cypher <${remetente}>\nSubject: ${assunto}\nDate: ${new Date().toUTCString()}\nContent-Type: text/plain; charset=UTF-8\n\n${texto}\n`,
      { flag: "wx", mode: 0o600 }
    );
    return;
  }
  try {
    const resultado = await transporteGmail().sendMail({
      from: { name: "Cypher", address: remetente },
      to: destino,
      subject: assunto,
      text: texto,
    });
    if (!resultado.accepted?.length || resultado.rejected?.length)
      throw new Error("Destinatário recusado.");
  } catch {
    throw new Error(
      "Não foi possível enviar o e-mail agora. Tente novamente em instantes."
    );
  }
}
