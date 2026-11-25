import { randomUUID } from "node:crypto";
import { conexaoInternaCypher, criarNotificacaoCypher } from "./bancoDados.js";
import { exigirContaInteracao, ErroInteracao } from "./interacoesConteudo.js";
import {
  objetoDisponivel,
  situacaoContaModeracao,
} from "./politicasModeracao.js";
import { contatoEtarioPermitido } from "./protecoesConta.js";
const db = conexaoInternaCypher;
type Vinculo = {
  id: string;
  representante_id: string;
  representado_id: string;
  proponente_id: string;
  estado: string;
  escopo: string;
  versao: number;
  criada_em: number;
  atualizada_em: number;
  representante: string;
  representado: string;
};
function profissional(id: string) {
  exigirContaInteracao(id);
  if (
    !db()
      .prepare(
        "SELECT 1 FROM usuarios WHERE id=? AND tipo_conta='profissional'"
      )
      .get(id)
  )
    throw new ErroInteracao("Representações exigem conta Profissional.", 403);
}
function pertinente(ator: string, id: string) {
  profissional(ator);
  const v = db()
    .prepare(
      "SELECT * FROM representacoes_profissionais WHERE id=? AND (representante_id=? OR representado_id=?)"
    )
    .get(id, ator, ator) as Vinculo | undefined;
  if (!v) throw new ErroInteracao("Vínculo indisponível.", 404);
  return v;
}
function verificarPartes(a: string, b: string) {
  profissional(a);
  profissional(b);
  if (
    a === b ||
    !objetoDisponivel(db(), "perfil", b, a) ||
    !objetoDisponivel(db(), "perfil", a, b) ||
    !contatoEtarioPermitido(db(), a, b) ||
    situacaoContaModeracao(db(), a).contatoRestrito ||
    situacaoContaModeracao(db(), b).contatoRestrito
  )
    throw new ErroInteracao(
      "Este vínculo não pode ser iniciado entre estas contas.",
      403
    );
}
function historico(ator: string, v: Vinculo, acao: string, motivo = "") {
  db()
    .prepare(
      "INSERT INTO historico_representacao(id,representacao_id,autor_id,acao,motivo,criado_em) VALUES(?,?,?,?,?,?)"
    )
    .run(randomUUID(), v.id, ator, acao, motivo, Date.now());
  const outro =
    v.representante_id === ator ? v.representado_id : v.representante_id;
  criarNotificacaoCypher({
    usuarioDestinoId: outro,
    tipo: "representacao",
    titulo: "Atualização de representação profissional",
    mensagem: "Consulte a proposta e seu histórico.",
    url: "/representacoes",
    entidadeTipo: "representacao",
    entidadeId: v.id,
    chaveOrigem: "representacao:" + v.id + ":" + v.versao + ":" + acao,
  });
}
export function listarRepresentacoes(ator: string) {
  profissional(ator);
  return (
    db()
      .prepare(
        `SELECT r.*,a.nome representante,b.nome representado FROM representacoes_profissionais r
 JOIN perfis a ON a.usuario_id=r.representante_id JOIN perfis b ON b.usuario_id=r.representado_id
 WHERE r.representante_id=? OR r.representado_id=? ORDER BY r.atualizada_em DESC`
      )
      .all(ator, ator) as Vinculo[]
  ).map(v => ({
    ...v,
    historico: db()
      .prepare(
        "SELECT acao,motivo,criado_em FROM historico_representacao WHERE representacao_id=? ORDER BY criado_em,id"
      )
      .all(v.id) as { acao: string; motivo: string; criado_em: number }[],
  }));
}
export function convidarRepresentacao(
  ator: string,
  b: Record<string, unknown>
) {
  profissional(ator);
  const handle =
    typeof b.destinatario === "string"
      ? "@" + b.destinatario.trim().replace(/^@/, "")
      : "";
  const outro = db()
    .prepare(
      "SELECT usuario_id FROM perfis WHERE identificador=? COLLATE NOCASE"
    )
    .get(handle) as { usuario_id: string } | undefined;
  if (!outro) throw new ErroInteracao("Profissional não encontrado.", 404);
  if (!["representar", "ser_representado"].includes(String(b.papel)))
    throw new ErroInteracao("Escolha o papel da proposta.");
  const escopo = typeof b.escopo === "string" ? b.escopo.trim() : "";
  if (escopo.length < 10 || escopo.length > 2000)
    throw new ErroInteracao("Descreva o escopo com 10 a 2.000 caracteres.");
  return db()
    .transaction(() => {
      verificarPartes(ator, outro.usuario_id);
      const representante = b.papel === "representar" ? ator : outro.usuario_id;
      const representado = b.papel === "representar" ? outro.usuario_id : ator;
      if (
        db()
          .prepare(
            "SELECT 1 FROM representacoes_profissionais WHERE representante_id=? AND representado_id=? AND estado IN('pendente','ativa')"
          )
          .get(representante, representado)
      )
        throw new ErroInteracao(
          "Já existe uma proposta ou vínculo vigente entre estas partes.",
          409
        );
      const id = randomUUID(),
        agora = Date.now();
      db()
        .prepare(
          "INSERT INTO representacoes_profissionais(id,representante_id,representado_id,proponente_id,escopo,estado,criada_em,atualizada_em) VALUES(?,?,?,?,?,'pendente',?,?)"
        )
        .run(id, representante, representado, ator, escopo, agora, agora);
      historico(ator, pertinente(ator, id), "convite");
      return id;
    })
    .immediate();
}
export function responderRepresentacao(
  ator: string,
  id: string,
  b: Record<string, unknown>
) {
  return db()
    .transaction(() => {
      const v = pertinente(ator, id),
        acao = String(b.acao);
      if (String(v.versao) !== String(b.versao))
        throw new ErroInteracao("O vínculo mudou. Atualize a página.", 409);
      if (
        v.estado === "pendente" &&
        v.proponente_id !== ator &&
        ["aceitar", "recusar"].includes(acao)
      ) {
        if (acao === "aceitar")
          verificarPartes(v.representante_id, v.representado_id);
      } else if (
        !(
          v.estado === "pendente" &&
          v.proponente_id === ator &&
          acao === "cancelar"
        ) &&
        !(v.estado === "ativa" && acao === "encerrar")
      ) {
        throw new ErroInteracao("Ação indisponível para este vínculo.", 409);
      }
      const motivo = typeof b.motivo === "string" ? b.motivo.trim() : "";
      if (motivo.length > 2000 || (acao === "encerrar" && motivo.length < 10))
        throw new ErroInteracao(
          "Informe um motivo entre 10 e 2.000 caracteres."
        );
      const estados: Record<string, string> = {
        aceitar: "ativa",
        recusar: "recusada",
        cancelar: "cancelada",
        encerrar: "encerrada",
      };
      db()
        .prepare(
          "UPDATE representacoes_profissionais SET estado=?,versao=versao+1,atualizada_em=? WHERE id=?"
        )
        .run(estados[acao], Date.now(), id);
      historico(ator, v, acao, motivo);
    })
    .immediate();
}
