import { transporteGmail } from "../dist/src/app/models/entregaEmail.js";
try {
  await transporteGmail().verify();
  console.log(
    "OK: conexão TLS e autenticação SMTP do Gmail verificadas. Nenhum e-mail foi enviado."
  );
} catch (erro) {
  const codigo = typeof erro?.code === "string" ? erro.code : "INDISPONIVEL";
  console.error(
    `Falha na verificação SMTP (${codigo}). Confira a conexão e a configuração privada.`
  );
  process.exitCode = 1;
}
