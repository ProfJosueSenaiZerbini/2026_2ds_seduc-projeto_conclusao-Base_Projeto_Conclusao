import { randomUUID } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import { exigirContaInteracao, ErroInteracao } from "./interacoesConteudo.js";
import { objetoSobMedida } from "./politicasModeracao.js";

type Selo = { id: string; letras: string; forma: string; cor: string };
export const formasSelo = { disco: "Disco", placa: "Placa", quadro: "Quadro" };
export const coresSelo = {
  oliva: "Oliva",
  areia: "Areia",
  lilas: "Lilás",
  cobre: "Cobre",
};

export function seloPerfil(titular: string) {
  const db = conexaoInternaCypher();
  const selo = db
    .prepare(
      "SELECT id,letras,forma,cor FROM selos_perfil WHERE autor_id=? AND retirado_em IS NULL"
    )
    .get(titular) as Selo | undefined;
  return selo && !objetoSobMedida(db, "selo", selo.id) ? selo : null;
}

export function salvarSeloPerfil(ator: string, dados: Record<string, unknown>) {
  exigirContaInteracao(ator);
  const db = conexaoInternaCypher();
  if (
    !db
      .prepare(
        "SELECT 1 FROM usuarios WHERE id=? AND tipo_conta='profissional'"
      )
      .get(ator)
  )
    throw new ErroInteracao("O selo pertence a uma conta profissional.", 403);
  const retirar = dados.acao === "retirar";
  const letras = String(dados.letras ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR")
    .normalize("NFC");
  const forma = String(dados.forma),
    cor = String(dados.cor);
  if (
    !retirar &&
    (!/^[\p{L}0-9]{1,3}$/u.test(letras) ||
      !Object.hasOwn(formasSelo, forma) ||
      !Object.hasOwn(coresSelo, cor))
  )
    throw new ErroInteracao(
      "Escolha uma forma, uma cor e até três letras ou números para sua assinatura."
    );
  db.transaction(() => {
    const ativo = seloPerfil(ator);
    if (
      !retirar &&
      ativo?.letras === letras &&
      ativo.forma === forma &&
      ativo.cor === cor
    )
      return;
    const agora = Date.now();
    db.prepare(
      "UPDATE selos_perfil SET retirado_em=? WHERE autor_id=? AND retirado_em IS NULL"
    ).run(agora, ator);
    if (!retirar)
      db.prepare(
        "INSERT INTO selos_perfil(id,autor_id,letras,forma,cor,criado_em) VALUES(?,?,?,?,?,?)"
      ).run(randomUUID(), ator, letras, forma, cor, agora);
  }).immediate();
}
