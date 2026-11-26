import { conexaoInternaCypher } from "./bancoDados.js";

export function limparCredenciaisExpiradas(agora = Date.now()) {
  const db = conexaoInternaCypher();
  // A confirmação e a recuperação consultam as emissões da última hora.
  const fimJanelaEmissao = agora - 60 * 60 * 1000;
  return db.transaction(() => ({
    sessoes: db.prepare("DELETE FROM sessoes WHERE expira_em<=?").run(agora)
      .changes,
    confirmacoes: db
      .prepare(
        "DELETE FROM tokens_confirmacao_email WHERE expira_em<=? AND criado_em<=?"
      )
      .run(agora, fimJanelaEmissao).changes,
    recuperacoes: db
      .prepare(
        "DELETE FROM tokens_recuperacao_senha WHERE expira_em<=? AND criado_em<=?"
      )
      .run(agora, fimJanelaEmissao).changes,
  }))();
}
