import type Database from "better-sqlite3";
import { consultaPreparada } from "./consultaPreparada.js";
import { contaEncerrada, menorProtegido } from "./protecoesConta.js";
type Banco = Database.Database;
// Políticas compartilhadas não alteram a visibilidade ou os registros de origem.
export function situacaoContaModeracao(
  db: Banco,
  id: string,
  agora = Date.now()
) {
  const antiga = consultaPreparada(db,
      "SELECT motivo FROM restricoes_contas WHERE usuario_id=? AND (ate IS NULL OR datetime(ate)>datetime('now'))"
    )
    .get(id) as { motivo: string } | undefined;
  const medidas = consultaPreparada(db,
      "SELECT acao,motivo FROM suporte_medidas WHERE alvo_tipo='perfil' AND alvo_id=? AND revogada_em IS NULL AND (ate IS NULL OR ate>?) ORDER BY criada_em DESC"
    )
    .all(id, agora) as { acao: string; motivo: string }[];
  const bloqueio = medidas.find(
    m => m.acao === "suspender" || m.acao === "excluir_conta"
  );
  return {
    restrita: Boolean(antiga || bloqueio),
    contatoRestrito: Boolean(
      antiga || bloqueio || medidas.some(m => m.acao === "restringir_contato")
    ),
    motivo: bloqueio?.motivo ?? antiga?.motivo ?? "",
  };
}
export function objetoSobMedida(
  db: Banco,
  tipo: string,
  id: string,
  agora = Date.now()
) {
  return Boolean(
    consultaPreparada(db,
        "SELECT 1 FROM suporte_medidas WHERE alvo_tipo=? AND alvo_id=? AND acao IN('ocultar','remover') AND revogada_em IS NULL AND (ate IS NULL OR ate>?)"
      )
      .get(tipo, id, agora)
  );
}
export function objetoDisponivel(
  db: Banco,
  tipo: string,
  id: string,
  visitante = "",
  agora = Date.now()
): boolean {
  if (objetoSobMedida(db, tipo, id, agora)) return false;
  if (
    tipo === "beat" &&
    consultaPreparada(db, "SELECT 1 FROM beat_catalogo WHERE beat_id=? AND retirado=1")
      .get(id)
  )
    return false;
  const fontes: Record<string, [string, string]> = {
    obra: ["obras", "proprietario_id"],
    beat: ["beats", "produtor_id"],
    evento: ["eventos", "proprietario_id"],
    projeto: ["projetos_trabalho", "autor_id"],
    midia: ["midias_trabalho", "autor_id"],
    selo: ["selos_perfil", "autor_id"],
    oportunidade: ["oportunidades_profissionais", "autor_id"],
    mensagem: ["mensagens", "autor_id"],
  };
  let dono = id;
  if (tipo !== "perfil") {
    const f = Object.hasOwn(fontes,tipo) ? fontes[tipo] : null;
    if (!f) return false;
    const r = consultaPreparada(db, `SELECT ${f[1]} dono FROM ${f[0]} WHERE id=?`)
      .get(id) as { dono: string } | undefined;
    if (!r) return false;
    dono = r.dono;
  }
  if (
    contaEncerrada(db, dono) ||
    (dono !== visitante && menorProtegido(db, dono)) ||
    objetoSobMedida(db, "perfil", dono, agora) ||
    situacaoContaModeracao(db, dono, agora).restrita
  )
    return false;
  if (
    visitante &&
    visitante !== dono &&
    consultaPreparada(db,
        "SELECT 1 FROM bloqueios_usuarios WHERE (autor_id=? AND alvo_id=?) OR (autor_id=? AND alvo_id=?)"
      )
      .get(dono, visitante, visitante, dono)
  )
    return false;
  // A permissão da origem continua obrigatória: a medida não concede acesso a conteúdo privado.
  const p = consultaPreparada(db, "SELECT perfil_publico FROM perfis WHERE usuario_id=?")
    .get(dono) as { perfil_publico: number } | undefined;
  const mediada =
    tipo === "oportunidade" &&
    consultaPreparada(db, "SELECT 1 FROM administradores WHERE usuario_id=? AND ativo=1")
      .get(dono);
  if (
    tipo !== "mensagem" &&
    !mediada &&
    dono !== visitante &&
    (!p || !p.perfil_publico)
  )
    return false;
  if (tipo === "projeto" && dono !== visitante) {
    if (
      !consultaPreparada(db,
          "SELECT 1 FROM projetos_trabalho p LEFT JOIN detalhes_projetos d ON d.projeto_id=p.id WHERE p.id=? AND p.publico=1 AND coalesce(d.retirado,0)=0"
        )
        .get(id)
    )
      return false;
  }
  return true;
}
