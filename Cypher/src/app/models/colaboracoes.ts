import { objetoDisponivel, situacaoContaModeracao } from "./politicasModeracao.js";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { conexaoInternaCypher } from "./bancoDados.js";
import { conta, semBloqueio, um, todos, type Linha } from "./oportunidades.js";
import { exigirAdministrador } from "./administracao.js";
import {
  podeVerProjeto,
  midiaAutorizada,
  pastaMidias,
} from "./projetosTrabalho.js";
export const DIA = 86400000;
export const estadosColaboracao: Record<string, string> = {
  pendente_aceite: "Convite pendente",
  em_andamento: "Em andamento",
  conclusao_pendente: "Aguardando conclusão",
  contestada: "Em contestação",
  concluida: "Concluída",
  recusada: "Recusada",
  cancelada: "Cancelada",
  expirada: "Convite expirado",
  invalidada: "Invalidada",
};
export const motivosDenuncia = [
  "ofensa_assedio",
  "discriminacao",
  "dados_privados",
  "fraude",
  "fora_da_experiencia",
  "outro",
];
export class ErroColaboracao extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
function exigir(ok: unknown, msg: string, status = 400): asserts ok {
  if (!ok) throw new ErroColaboracao(msg, status);
}
const db = () => conexaoInternaCypher();
const executar = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .run(...v);
function transacao<T>(fn: () => T) {
  return db().transaction(fn).immediate();
}
function campo(v: unknown, n: number, nome: string, min = 0) {
  exigir(v === undefined || typeof v === "string", `Confira ${nome}.`);
  const s = String(v ?? "").trim();
  exigir(
    s.length >= min && s.length <= n,
    `${nome}: informe de ${min} a ${n} caracteres.`
  );
  return s;
}
const urlValida = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
};
function profissional(id: string) {
  const u = conta(id);
  exigir(
    u.tipo_conta === "profissional",
    "Ação disponível somente a profissionais.",
    403
  );
  return u;
}
const outro = (c: Linha, id: string) =>
  c.proponente_id === id ? c.convidado_id : c.proponente_id;
const participante = (c: Linha, id: string) =>
  c.proponente_id === id || c.convidado_id === id;
function vinculo(id: string) {
  const c = um("SELECT * FROM colaboracoes WHERE id=?", id);
  exigir(c, "Colaboração indisponível.", 404);
  return c;
}
function proprio(ator: string, id: string) {
  profissional(ator);
  const c = vinculo(id);
  exigir(participante(c, ator), "Colaboração indisponível.", 404);
  return c;
}
function registrar(
  c: Linha,
  ator: string | null,
  acao: string,
  antes: string,
  motivo = "",
  agora = Date.now()
) {
  executar(
    "INSERT INTO historico_colaboracao(id,colaboracao_id,autor_id,acao,estado_anterior,estado_novo,justificativa,ocorrida_em) VALUES(?,?,?,?,?,?,?,?)",
    randomUUID(),
    c.id,
    ator,
    acao,
    antes,
    c.estado,
    motivo,
    agora
  );
}
function notificar(id: string, c: Linha, texto: string, chave: string) {
  executar(
    `INSERT INTO notificacoes(id,usuario_destino_id,tipo,titulo,url,entidade_tipo,entidade_id,chave_origem) VALUES(?,?,'colaboracao',?,?,'colaboracao',?,?) ON CONFLICT(chave_origem) DO NOTHING`,
    randomUUID(),
    id,
    texto,
    "/colaboracoes/" + c.id,
    c.id,
    "collab:" + c.id + ":" + chave + ":" + id
  );
}
function ambas(c: Linha, texto: string, chave: string) {
  for (const id of [c.proponente_id, c.convidado_id])
    notificar(id, c, texto, chave);
}
function atualizar(c: Linha, mudancas: Record<string, unknown>) {
  const keys = Object.keys(mudancas);
  executar(
    "UPDATE colaboracoes SET " +
      keys.map(k => k + "=?").join(",") +
      ",versao=versao+1 WHERE id=?",
    ...Object.values(mudancas),
    c.id
  );
  Object.assign(c, mudancas);
  c.versao++;
}
const liberada = (c: Linha, agora: number) =>
  c.estado === "concluida" &&
  (agora > c.prazo_avaliacao_em ||
    um(
      "SELECT count(*) n FROM avaliacoes_colaboracao WHERE colaboracao_id=?",
      c.id
    )!.n === 2);
export function processarPrazos(agora = Date.now()) {
  transacao(() => {
    for (const c of todos(
      "SELECT * FROM colaboracoes WHERE estado IN('pendente_aceite','conclusao_pendente','em_andamento','concluida')"
    )) {
      const antes = c.estado;
      if (c.estado === "pendente_aceite" && agora >= c.criada_em + 30 * DIA) {
        atualizar(c, { estado: "expirada" });
        registrar(
          c,
          null,
          "convite_expirado",
          antes,
          "Sem aceite em 30 dias.",
          agora
        );
        ambas(c, "Convite de colaboração expirado.", "expirou");
      }
      if (
        c.estado === "conclusao_pendente" &&
        agora >= c.pedido_conclusao_em + 30 * DIA
      ) {
        atualizar(c, {
          estado: "em_andamento",
          pedido_conclusao_por: null,
          pedido_conclusao_em: null,
        });
        registrar(
          c,
          null,
          "pedido_conclusao_expirado",
          antes,
          "Sem confirmação; a colaboração continua em andamento.",
          agora
        );
        ambas(
          c,
          "Pedido de conclusão expirou sem concluir o trabalho.",
          "fim-pedido:" + c.versao
        );
      }
      if (c.cancelamento_em && agora >= c.cancelamento_em + 14 * DIA) {
        atualizar(c, { cancelamento_por: null, cancelamento_em: null });
        registrar(
          c,
          null,
          "cancelamento_expirado",
          c.estado,
          "Sem acordo para cancelar.",
          agora
        );
      }
      if (c.estado === "concluida") {
        if (
          liberada(c, agora) &&
          um(
            "SELECT 1 FROM avaliacoes_colaboracao WHERE colaboracao_id=?",
            c.id
          )
        )
          ambas(
            c,
            "As avaliações desta colaboração foram liberadas.",
            "avaliacoes-liberadas"
          );
        if (
          agora <= c.prazo_avaliacao_em &&
          agora >= c.prazo_avaliacao_em - 2 * DIA
        ) {
          for (const id of [c.proponente_id, c.convidado_id])
            if (
              !um(
                "SELECT 1 FROM avaliacoes_colaboracao WHERE colaboracao_id=? AND avaliador_id=?",
                c.id,
                id
              )
            )
              notificar(
                id,
                c,
                "Seu prazo para avaliar termina em até 48 horas.",
                "lembrete"
              );
        }
      }
    }
  });
}
function origemPermitida(ator: string, tipo: string, id: string) {
  if (!tipo && !id) return true;
  if(!objetoDisponivel(db(),tipo,id,ator))return false;
  if (tipo === "projeto") return podeVerProjeto(ator, id);
  const fontes: Record<string, [string, string]> = {
    obra: ["obras", "proprietario_id"],
    beat: ["beats", "produtor_id"],
    evento: ["eventos", "proprietario_id"],
  };
  const f = fontes[tipo];
  if (!f) return false;
  const r = um(
    `SELECT p.perfil_publico,o.${f[1]} dono FROM ${f[0]} o JOIN perfis p ON p.usuario_id=o.${f[1]} WHERE o.id=? AND o.demonstracao=0`,
    id
  );
  if (!r) return false;
  try {
    conta(r.dono);
    semBloqueio(ator, r.dono);
  } catch {
    return false;
  }
  if (r.dono === ator) return true;
  if (!r.perfil_publico) return false;
  return (
    tipo !== "obra" ||
    Boolean(
      um(
        "SELECT 1 FROM obras WHERE id=? AND publicada=1 AND situacao IN('','Lançado')",
        id
      )
    )
  );
}
export function criarColaboracao(
  ator: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  profissional(ator);
  const handle = campo(b.destinatario, 25, "@ do profissional", 3).replace(
    /^@/,
    ""
  );
  const destino = um(
    "SELECT usuario_id id FROM perfis WHERE identificador=? COLLATE NOCASE",
    "@" + handle
  );
  exigir(destino, "Profissional indisponível.", 404);
  profissional(destino.id);
  exigir(!situacaoContaModeracao(db(),ator).contatoRestrito&&!situacaoContaModeracao(db(),destino.id).contatoRestrito,"Contato restrito por medida administrativa.",403);
  exigir(ator !== destino.id, "Escolha outro profissional.");
  semBloqueio(ator, destino.id);
  const titulo = campo(b.titulo, 120, "Título", 3),
    natureza = campo(b.natureza, 60, "Natureza do trabalho", 3),
    descricao = campo(b.descricao, 3000, "Descrição", 10),
    fa = campo(b.funcao_proponente, 160, "Sua função", 2),
    fb = campo(b.funcao_convidado, 160, "Função do convidado", 2),
    periodo = campo(b.periodo, 100, "Período");
  exigir(
    b.consentimento === "sim",
    "Confirme as condições de colaboração e reputação."
  );
  const tipo = campo(b.origem_tipo, 15, "Tipo de origem"),
    id = campo(b.origem_id, 100, "Registro de origem");
  exigir(
    (!tipo && !id) ||
      (["obra", "beat", "evento", "projeto"].includes(tipo) && id),
    "Confira o vínculo de origem."
  );
  exigir(origemPermitida(ator, tipo, id), "Origem indisponível.", 403);
  const dupla = [ator, destino.id].sort().join("|");
  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const contexto = tipo
    ? tipo + ":" + id
    : "externo:" +
      createHash("sha256")
        .update(normalizar(natureza + "|" + titulo + "|" + periodo))
        .digest("hex");
  const exige = b.exige_lancamento === "sim";
  return transacao(() => {
    const existente = um(
      "SELECT id FROM colaboracoes WHERE dupla=? AND chave_contexto=? AND estado IN('pendente_aceite','em_andamento','conclusao_pendente','contestada','concluida')",
      dupla,
      contexto
    );
    if (existente) return existente.id as string;
    exigir(
      um(
        "SELECT count(*) n FROM colaboracoes WHERE proponente_id=? AND criada_em>?",
        ator,
        agora - DIA
      )!.n < 20,
      "Limite de 20 convites em 24 horas.",
      429
    );
    exigir(
      um(
        "SELECT count(*) n FROM colaboracoes WHERE proponente_id=? AND convidado_id=? AND criada_em>?",
        ator,
        destino.id,
        agora - 30 * DIA
      )!.n < 5,
      "Limite de 5 convites para este profissional em 30 dias.",
      429
    );
    const cid = randomUUID();
    executar(
      `INSERT INTO colaboracoes(id,proponente_id,convidado_id,dupla,chave_contexto,titulo,natureza,descricao,funcao_proponente,funcao_convidado,periodo,origem_tipo,origem_id,exige_lancamento,estado,criada_em,publico_a)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pendente_aceite',?,?)`,
      cid,
      ator,
      destino.id,
      dupla,
      contexto,
      titulo,
      natureza,
      descricao,
      fa,
      fb,
      periodo,
      tipo,
      id,
      Number(exige),
      agora,
      Number(b.publico === "sim")
    );
    const c = vinculo(cid);
    registrar(c, ator, "convite_criado", "", "", agora);
    notificar(
      destino.id,
      c,
      "Você recebeu um convite de colaboração.",
      "convite"
    );
    return cid;
  });
}
function verificarLancamento(c: Linha) {
  const local = /^\/work-media\/([a-f0-9-]{36})$/.exec(c.evidencia_url);
  let audio = false;
  if (local) {
    try {
      const a = midiaAutorizada(c.proponente_id, local[1]);
      midiaAutorizada(c.convidado_id, local[1]);
      audio = Boolean(
        a.publico &&
        a.mime.startsWith("audio/") &&
        fs.existsSync(path.join(pastaMidias(), a.id))
      );
    } catch {
      audio = false;
    }
  }
  exigir(
    (urlValida(c.evidencia_url) || audio) && c.evidencia_descricao.length >= 10,
    "Registre áudio autorizado acessível às partes ou publicação externa verificável, descrevendo a evidência de lançamento."
  );
  if (c.origem_tipo === "obra")
    exigir(
      um("SELECT 1 FROM obras WHERE id=? AND publicada=1", c.origem_id),
      "A obra vinculada não está publicada."
    );
}
export function agirColaboracao(
  ator: string,
  id: string,
  acao: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  processarPrazos(agora);
  return transacao(() => {
    const c = proprio(ator, id);
    exigir(
      Number(b.versao) === c.versao,
      "A colaboração mudou. Atualize a página e confira o estado atual.",
      409
    );
    const antes = c.estado;
    if (acao === "aceitar" || acao === "recusar") {
      exigir(
        c.estado === "pendente_aceite" && ator === c.convidado_id,
        "Somente o convidado pode responder a um convite pendente.",
        409
      );
      semBloqueio(ator, outro(c, ator));
      profissional(c.proponente_id);
      if (acao === "aceitar")
        exigir(
          b.consentimento === "sim",
          "Confirme as regras de reputação e privacidade."
        );
      atualizar(c, {
        estado: acao === "aceitar" ? "em_andamento" : "recusada",
        aceita_em: acao === "aceitar" ? agora : null,
        publico_b: acao === "aceitar" && b.publico === "sim" ? 1 : 0,
      });
    } else if (acao === "cancelar_convite") {
      exigir(
        c.estado === "pendente_aceite" && ator === c.proponente_id,
        "Este convite não pode ser cancelado por você.",
        409
      );
      atualizar(c, { estado: "cancelada" });
    } else if (acao === "pedir_conclusao") {
      exigir(
        c.estado === "em_andamento" && !c.cancelamento_por,
        "Resolva as pendências antes de solicitar conclusão.",
        409
      );
      exigir(
        um(
          "SELECT count(*) n FROM historico_colaboracao WHERE colaboracao_id=? AND acao='pedir_conclusao' AND ocorrida_em>?",
          id,
          agora - 30 * DIA
        )!.n < 2,
        "São permitidos até 2 pedidos de conclusão em 30 dias.",
        429
      );
      if (c.exige_lancamento) {
        c.evidencia_url = campo(b.evidencia_url, 2048, "Link de lançamento", 8);
        c.evidencia_descricao = campo(
          b.evidencia_descricao,
          2000,
          "Evidência de lançamento",
          10
        );
        verificarLancamento(c);
        exigir(
          b.evidencia_confirmada === "sim",
          "Confirme que verificou a evidência de lançamento."
        );
      }
      atualizar(c, {
        estado: "conclusao_pendente",
        pedido_conclusao_por: ator,
        pedido_conclusao_em: agora,
        evidencia_url: c.evidencia_url,
        evidencia_descricao: c.evidencia_descricao,
      });
    } else if (acao === "confirmar_conclusao" || acao === "ainda_nao") {
      exigir(
        c.estado === "conclusao_pendente" && ator !== c.pedido_conclusao_por,
        "A conclusão precisa da resposta do outro participante.",
        409
      );
      if (acao === "confirmar_conclusao") {
        exigir(b.confirmacao === "sim", "Confirme expressamente a conclusão.");
        if (c.exige_lancamento) {
          verificarLancamento(c);
          exigir(
            b.evidencia_confirmada === "sim",
            "Confira e reconheça a evidência de lançamento."
          );
        }
        atualizar(c, {
          estado: "concluida",
          concluida_em: agora,
          prazo_avaliacao_em: agora + 14 * DIA,
        });
        ambas(
          c,
          "Colaboração concluída: você tem 14 dias para avaliar.",
          "concluiu:" + agora
        );
      } else
        atualizar(c, {
          estado: "em_andamento",
          pedido_conclusao_por: null,
          pedido_conclusao_em: null,
        });
    } else if (acao === "pedir_cancelamento") {
      exigir(
        c.estado === "em_andamento" && !c.cancelamento_por,
        "Não é possível abrir um pedido de cancelamento agora.",
        409
      );
      atualizar(c, { cancelamento_por: ator, cancelamento_em: agora });
    } else if (
      acao === "confirmar_cancelamento" ||
      acao === "manter_colaboracao"
    ) {
      exigir(
        c.estado === "em_andamento" &&
          c.cancelamento_por &&
          ator !== c.cancelamento_por,
        "Responda somente ao pedido da outra parte.",
        409
      );
      atualizar(c, {
        estado:
          acao === "confirmar_cancelamento" ? "cancelada" : "em_andamento",
        cancelamento_por: null,
        cancelamento_em: null,
      });
    } else if (acao === "visibilidade") {
      exigir(
        c.estado !== "invalidada",
        "Vínculo invalidado não pode ser publicado."
      );
      if (b.publico === "sim")
        atualizar(c, {
          [ator === c.proponente_id ? "publico_a" : "publico_b"]: 1,
        });
      else atualizar(c, { publico_a: 0, publico_b: 0 });
    } else throw new ErroColaboracao("Ação inválida.");
    registrar(c, ator, acao, antes, campo(b.motivo, 2000, "Motivo"), agora);
    if (acao !== "visibilidade")
      notificar(
        outro(c, ator),
        c,
        "Uma etapa da colaboração foi atualizada.",
        "etapa:" + c.versao
      );
    return c.id as string;
  });
}
export function avaliarColaboracao(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  processarPrazos(agora);
  return transacao(() => {
    const c = proprio(ator, id);
    exigir(
      c.estado === "concluida" && agora <= c.prazo_avaliacao_em,
      "A avaliação exige colaboração concluída e prazo vigente.",
      409
    );
    exigir(
      !um(
        "SELECT 1 FROM avaliacoes_colaboracao WHERE colaboracao_id=? AND avaliador_id=?",
        id,
        ator
      ),
      "Sua avaliação já foi enviada.",
      409
    );
    exigir(
      b.confirmacao === "sim",
      "Confirme o envio definitivo da avaliação."
    );
    const notas = ["comunicacao", "combinados", "equipe"].map(k => {
      exigir(
        /^[1-5]$/.test(String(b[k] ?? "")),
        "Use notas inteiras de 1 a 5 em todos os critérios."
      );
      return Number(b[k]);
    });
    const aid = randomUUID();
    executar(
      "INSERT INTO avaliacoes_colaboracao(id,colaboracao_id,avaliador_id,avaliado_id,comunicacao,combinados,equipe,comentario,enviada_em) VALUES(?,?,?,?,?,?,?,?,?)",
      aid,
      id,
      ator,
      outro(c, ator),
      ...notas,
      campo(b.comentario, 1000, "Comentário"),
      agora
    );
    // Não gerar aviso sobre o envio isolado nem registrar notas no histórico compartilhado.
    if (liberada(c, agora))
      ambas(
        c,
        "As avaliações desta colaboração foram liberadas.",
        "avaliacoes-liberadas"
      );
    return aid;
  });
}
export function abrirCaso(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  processarPrazos(agora);
  return transacao(() => {
    const c = proprio(ator, id),
      aid = campo(b.avaliacao_id, 100, "Avaliação"),
      recurso = campo(b.recurso_de, 100, "Recurso");
    const motivo = campo(b.motivo, 100, "Motivo", 3),
      detalhes = campo(b.detalhes, 3000, "Justificativa", 10),
      evidencias = campo(b.evidencias, 3000, "Referências e evidências");
    let parent: Linha | undefined;
    if (recurso) {
      parent = um(
        "SELECT * FROM casos_colaboracao WHERE id=? AND colaboracao_id=?",
        recurso,
        id
      );
      exigir(
        parent && parent.estado === "decidida",
        "A decisão não está disponível para recurso.",
        409
      );
      exigir(
        (parent.avaliacao_id ?? "") === aid,
        "O recurso deve tratar do mesmo objeto."
      );
    }
    if (aid) {
      exigir(
        motivosDenuncia.includes(motivo),
        "Escolha um motivo de denúncia."
      );
      const a = um(
        "SELECT * FROM avaliacoes_colaboracao WHERE id=? AND colaboracao_id=?",
        aid,
        id
      );
      exigir(
        a && (parent || (a.avaliado_id === ator && liberada(c, agora))),
        "Você pode denunciar avaliações recebidas e liberadas.",
        403
      );
    }
    exigir(
      !um(
        "SELECT 1 FROM casos_colaboracao WHERE colaboracao_id=? AND autor_id=? AND coalesce(avaliacao_id,'')=? AND estado IN('aberta','em_analise','recorrida')",
        id,
        ator,
        aid
      ),
      "Já existe uma análise pendente para este objeto.",
      409
    );
    exigir(
      um(
        "SELECT count(*) n FROM casos_colaboracao WHERE autor_id=? AND criada_em>?",
        ator,
        agora - DIA
      )!.n < 10,
      "Limite de solicitações de revisão em 24 horas.",
      429
    );
    if (!aid && !recurso) {
      exigir(
        [
          "pendente_aceite",
          "em_andamento",
          "conclusao_pendente",
          "concluida",
        ].includes(c.estado),
        "Este vínculo não pode receber nova contestação agora.",
        409
      );
      const antes = c.estado;
      atualizar(c, {
        estado: "contestada",
        cancelamento_por: null,
        cancelamento_em: null,
      });
      registrar(c, ator, "contestacao", antes, detalhes, agora);
    }
    const caso = randomUUID();
    executar(
      "INSERT INTO casos_colaboracao(id,colaboracao_id,avaliacao_id,autor_id,motivo,detalhes,evidencias,criada_em,recurso_de) VALUES(?,?,?,?,?,?,?,?,?)",
      caso,
      id,
      aid || null,
      ator,
      motivo,
      detalhes,
      evidencias,
      agora,
      recurso || null
    );
    if (parent)
      executar(
        "UPDATE casos_colaboracao SET estado='recorrida' WHERE id=?",
        parent.id
      );
    ambas(
      c,
      "Uma solicitação de revisão foi aberta. As partes podem se manifestar.",
      "caso:" + caso
    );
    return caso;
  });
}
export function manifestarCaso(
  ator: string,
  casoId: string,
  texto: unknown,
  agora = Date.now()
) {
  return transacao(() => {
    const k = um("SELECT * FROM casos_colaboracao WHERE id=?", casoId);
    exigir(k, "Solicitação indisponível.", 404);
    const c = proprio(ator, k.colaboracao_id);
    exigir(
      ["aberta", "em_analise"].includes(k.estado),
      "A análise já recebeu uma decisão.",
      409
    );
    executar(
      "INSERT INTO manifestacoes_colaboracao(caso_id,autor_id,texto,criada_em) VALUES(?,?,?,?) ON CONFLICT(caso_id,autor_id) DO UPDATE SET texto=excluded.texto,criada_em=excluded.criada_em",
      casoId,
      ator,
      campo(texto, 3000, "Manifestação", 10),
      agora
    );
    registrar(
      c,
      ator,
      "manifestacao_registrada",
      c.estado,
      "Manifestação anexada à análise.",
      agora
    );
  });
}
function moderador(ator: string) {
  conta(ator);
  try {
    exigirAdministrador(ator, "reputacao");
  } catch {
    throw new ErroColaboracao("Acesso de moderação necessário.", 403);
  }
}
function casoModeravel(ator: string, casoId: string) {
  moderador(ator);
  const k = um("SELECT * FROM casos_colaboracao WHERE id=?", casoId);
  exigir(k, "Solicitação indisponível.", 404);
  const c = vinculo(k.colaboracao_id);
  exigir(
    !participante(c, ator) && k.autor_id !== ator,
    "Não é permitido decidir em interesse próprio.",
    403
  );
  return { k, c };
}
export function decidirCaso(
  ator: string,
  casoId: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return transacao(() => {
    const { k, c } = casoModeravel(ator, casoId);
    exigir(
      ["aberta", "em_analise"].includes(k.estado),
      "A solicitação já foi decidida.",
      409
    );
    if (k.recurso_de) {
      const anterior = um(
        "SELECT revisor_id FROM casos_colaboracao WHERE id=?",
        k.recurso_de
      );
      exigir(
        anterior?.revisor_id !== ator,
        "O recurso deve ser analisado por outro responsável autorizado.",
        403
      );
    }
    const decisao = campo(b.decisao, 40, "Decisão", 3),
      justificativa = campo(b.justificativa, 3000, "Fundamentação", 20);
    if (decisao === "assumir") {
      exigir(
        !k.revisor_id || k.revisor_id === ator,
        "A análise já está atribuída a outro responsável.",
        409
      );
      executar(
        "UPDATE casos_colaboracao SET estado='em_analise',revisor_id=? WHERE id=?",
        ator,
        casoId
      );
      auditar(ator, c, "analise_assumida", justificativa, agora);
      return;
    }
    if (k.revisor_id)
      exigir(
        k.revisor_id === ator,
        "A análise está atribuída a outro responsável.",
        409
      );
    const antes = c.estado;
    if (decisao === "restaurar_vinculo") {
      exigir(
        c.estado === "invalidada" && k.recurso_de && c.concluida_em,
        "A restauração do vínculo exige recurso de uma invalidação anterior."
      );
      exigir(
        um(
          "SELECT 1 FROM casos_colaboracao WHERE id=? AND decisao='invalidar_vinculo'",
          k.recurso_de
        ),
        "O recurso deve tratar da invalidação do vínculo."
      );
      exigir(
        b.evidencias_suficientes === "sim" &&
          (k.evidencias.length >= 10 ||
            campo(b.evidencias, 3000, "Evidências").length >= 10),
        "Fundamente a restauração com evidências suficientes."
      );
      exigir(
        um(
          "SELECT 1 FROM manifestacoes_colaboracao WHERE caso_id=? AND autor_id=?",
          k.id,
          outro(c, k.autor_id)
        ) || agora >= k.criada_em + 7 * DIA,
        "Aguarde a manifestação da outra parte ou 7 dias para resposta."
      );
      atualizar(c, { estado: "concluida" });
      executar(
        "UPDATE avaliacoes_colaboracao SET estado=estado_antes_vinculo,estado_antes_vinculo=NULL WHERE colaboracao_id=? AND estado_antes_vinculo IS NOT NULL",
        c.id
      );
    } else if (k.avaliacao_id) {
      exigir(
        [
          "manter",
          "restaurar",
          "ocultar_avaliacao",
          "ocultar_comentario",
          "invalidar_avaliacao",
          "invalidar_vinculo",
        ].includes(decisao),
        "Decisão inválida."
      );
      if (decisao === "ocultar_comentario")
        executar(
          "UPDATE avaliacoes_colaboracao SET comentario_oculto=1 WHERE id=?",
          k.avaliacao_id
        );
      if (decisao === "ocultar_avaliacao")
        executar(
          "UPDATE avaliacoes_colaboracao SET estado='oculta',estado_antes_vinculo=NULL WHERE id=?",
          k.avaliacao_id
        );
      if (decisao === "invalidar_avaliacao")
        executar(
          "UPDATE avaliacoes_colaboracao SET estado='invalidada',estado_antes_vinculo=NULL WHERE id=?",
          k.avaliacao_id
        );
      if (decisao === "restaurar")
        executar(
          "UPDATE avaliacoes_colaboracao SET estado='ativa',comentario_oculto=0,estado_antes_vinculo=NULL WHERE id=?",
          k.avaliacao_id
        );
    } else {
      exigir(
        ["retomar", "cancelar", "concluir", "invalidar_vinculo"].includes(
          decisao
        ),
        "Escolha uma decisão para o vínculo."
      );
      if (decisao === "retomar") {
        exigir(
          !c.concluida_em,
          "Uma conclusão anterior deve ser mantida com prazo original ou invalidada."
        );
        exigir(
          c.aceita_em,
          "Convite não aceito não pode virar colaboração em andamento."
        );
        atualizar(c, {
          estado: "em_andamento",
          pedido_conclusao_por: null,
          pedido_conclusao_em: null,
        });
      }
      if (decisao === "cancelar") {
        exigir(
          !c.concluida_em,
          "Conclusão anterior exige decisão de manutenção ou invalidação."
        );
        atualizar(c, { estado: "cancelada" });
      }
      if (decisao === "concluir") {
        exigir(
          c.aceita_em,
          "Não se pode concluir um convite sem aceite bilateral."
        );
        exigir(
          b.evidencias_suficientes === "sim",
          "Registre que as evidências são suficientes para a conclusão excepcional."
        );
        exigir(
          k.evidencias.length >= 10 ||
            campo(b.evidencias, 3000, "Evidências").length >= 10,
          "Registre as evidências verificadas."
        );
        exigir(
          um(
            "SELECT 1 FROM manifestacoes_colaboracao WHERE caso_id=? AND autor_id=?",
            k.id,
            outro(c, k.autor_id)
          ) || agora >= k.criada_em + 7 * DIA,
          "Aguarde a manifestação da outra parte ou o prazo de 7 dias para resposta."
        );
        if (c.exige_lancamento) verificarLancamento(c);
        // Restaurar conclusão contestada mantém o prazo original; uma conclusão excepcional inicial começa agora.
        const concluida = c.concluida_em ?? agora;
        atualizar(c, {
          estado: "concluida",
          concluida_em: concluida,
          prazo_avaliacao_em: c.prazo_avaliacao_em ?? agora + 14 * DIA,
        });
      }
    }
    if (decisao === "invalidar_vinculo") {
      exigir(c.concluida_em, "A invalidação exige conclusão anterior.");
      atualizar(c, { estado: "invalidada" });
      executar(
        "UPDATE avaliacoes_colaboracao SET estado_antes_vinculo=coalesce(estado_antes_vinculo,CASE WHEN estado IN('ativa','oculta') THEN estado END),estado='invalidada' WHERE colaboracao_id=?",
        c.id
      );
    }
    executar(
      "UPDATE casos_colaboracao SET estado='decidida',revisor_id=?,decisao=?,justificativa=?,revisada_em=? WHERE id=?",
      ator,
      decisao,
      justificativa,
      agora,
      k.id
    );
    if (k.recurso_de)
      executar(
        "UPDATE casos_colaboracao SET estado='encerrada' WHERE id=?",
        k.recurso_de
      );
    registrar(c, ator, "decisao_" + decisao, antes, justificativa, agora);
    auditar(ator, c, decisao, justificativa, agora);
    ambas(
      c,
      "Há uma decisão de moderação sobre sua colaboração.",
      "decisao:" + k.id
    );
  });
}
function auditar(
  ator: string,
  c: Linha,
  acao: string,
  motivo: string,
  agora: number
) {
  executar(
    "INSERT INTO auditoria_administrativa(id,autor_id,acao,alvo_id,detalhe) VALUES(?,?,?,?,?)",
    randomUUID(),
    ator,
    "reputacao_" + acao,
    c.proponente_id,
    JSON.stringify({
      colaboracao: c.id,
      justificativa: motivo,
      ocorrida_em: agora,
    })
  );
}
export function inspecionarAvaliacao(
  ator: string,
  casoId: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return transacao(() => {
    const { k, c } = casoModeravel(ator, casoId);
    exigir(k.avaliacao_id, "Esta solicitação não trata de uma avaliação.");
    const motivo = campo(b.necessidade, 3000, "Necessidade de acesso", 20);
    exigir(
      b.risco_grave === "sim",
      "O acesso excepcional exige investigação de risco grave."
    );
    auditar(ator, c, "acesso_excepcional", motivo, agora);
    return um(
      "SELECT id,comunicacao,combinados,equipe,comentario FROM avaliacoes_colaboracao WHERE id=?",
      k.avaliacao_id
    );
  });
}
function avaliacoesValidas(id: string, agora: number) {
  return todos(
    `SELECT a.*,c.publico_a,c.publico_b,c.proponente_id,c.convidado_id,c.origem_tipo,c.origem_id,c.titulo,c.funcao_proponente,c.funcao_convidado,c.concluida_em
 FROM avaliacoes_colaboracao a JOIN colaboracoes c ON c.id=a.colaboracao_id WHERE a.avaliado_id=? AND a.estado='ativa' AND c.estado='concluida'
 AND (c.prazo_avaliacao_em<? OR (SELECT count(*) FROM avaliacoes_colaboracao x WHERE x.colaboracao_id=c.id)=2) ORDER BY a.enviada_em DESC`,
    id,
    agora
  );
}
export function resumoReputacao(id: string, agora = Date.now()) {
  const linhas = avaliacoesValidas(id, agora),
    autores = new Map<string, number[]>();
  for (const a of linhas) {
    const notas = autores.get(a.avaliador_id) ?? [];
    notas.push((a.comunicacao + a.combinados + a.equipe) / 3);
    autores.set(a.avaliador_id, notas);
  }
  const quantidade = autores.size;
  const media =
    quantidade >= 3
      ? [...autores.values()].reduce(
          (s, n) => s + n.reduce((a, b) => a + b, 0) / n.length,
          0
        ) / quantidade
      : null;
  return {
    estado:
      quantidade === 0
        ? "Ainda sem avaliações"
        : quantidade < 3
          ? "Reputação em formação"
          : "Reputação profissional",
    media,
    avaliacoes: linhas.length,
    avaliadores: quantidade,
  };
}
function perfilVisivel(id: string, visitante: string) {
  try {
    profissional(id);
    semBloqueio(id, visitante);
    return objetoDisponivel(db(),"perfil",id,visitante);
  } catch {
    return false;
  }
}
export function reputacaoPublica(
  id: string,
  visitante: string,
  agora = Date.now()
) {
  conta(visitante);
  exigir(
    perfilVisivel(id, visitante) || id === visitante,
    "Profissional indisponível.",
    404
  );
  const resumo = resumoReputacao(id, agora);
  const avaliacoes =
    resumo.media === null
      ? []
      : avaliacoesValidas(id, agora)
          .filter(
            a =>
              a.publico_a &&
              a.publico_b &&
              perfilVisivel(a.avaliador_id, visitante) &&
              (!a.origem_tipo ||
                origemPermitida(visitante, a.origem_tipo, a.origem_id))
          )
          .map(a => ({
            id: a.id,
            nota: (a.comunicacao + a.combinados + a.equipe) / 3,
            comentario: a.comentario_oculto ? "" : a.comentario,
            avaliador:
              um("SELECT nome FROM perfis WHERE usuario_id=?", a.avaliador_id)
                ?.nome ?? "Profissional",
            titulo: a.titulo,
            papel:
              a.avaliado_id === a.proponente_id
                ? a.funcao_proponente
                : a.funcao_convidado,
          }));
  return { ...resumo, avaliacoesPublicas: avaliacoes };
}
export function colaboracaoPrivada(
  ator: string,
  id: string,
  agora = Date.now()
): Linha {
  processarPrazos(agora);
  const c = proprio(ator, id),
    outra = outro(c, ator);
  const propriaAvaliacao = um(
    "SELECT id FROM avaliacoes_colaboracao WHERE colaboracao_id=? AND avaliador_id=?",
    id,
    ator
  );
  const avaliacoes = liberada(c, agora)
    ? todos(
        "SELECT a.id,a.avaliador_id,a.avaliado_id,a.comunicacao,a.combinados,a.equipe,CASE WHEN a.comentario_oculto=1 THEN '' ELSE a.comentario END comentario,p.nome avaliador FROM avaliacoes_colaboracao a JOIN perfis p ON p.usuario_id=a.avaliador_id WHERE a.colaboracao_id=? AND a.estado='ativa'",
        id
      )
    : [];
  const casos = todos(
    "SELECT * FROM casos_colaboracao WHERE colaboracao_id=? ORDER BY criada_em DESC",
    id
  ).map(k => ({
    ...k,
    manifestacoes: todos(
      "SELECT m.*,p.nome autor FROM manifestacoes_colaboracao m JOIN perfis p ON p.usuario_id=m.autor_id WHERE caso_id=? ORDER BY criada_em",
      k.id
    ),
  }));
  const origem =
    c.origem_tipo && origemPermitida(ator, c.origem_tipo, c.origem_id)
      ? { tipo: c.origem_tipo, id: c.origem_id }
      : null;
  return {
    ...c,
    origem_tipo: origem ? c.origem_tipo : "",
    origem_id: origem ? c.origem_id : "",
    outro_nome:
      um("SELECT nome FROM perfis WHERE usuario_id=?", outra)?.nome ??
      "Profissional",
    eProponente: c.proponente_id === ator,
    podeAvaliar:
      c.estado === "concluida" &&
      agora <= c.prazo_avaliacao_em &&
      !propriaAvaliacao,
    enviou: Boolean(propriaAvaliacao),
    avaliacoes,
    casos,
    historico: todos(
      "SELECT acao,estado_anterior,estado_novo,justificativa,ocorrida_em FROM historico_colaboracao WHERE colaboracao_id=? ORDER BY ocorrida_em,id",
      id
    ),
    nomeEstado: estadosColaboracao[c.estado],
    agora,
  };
}
export function listarColaboracoes(ator: string, agora = Date.now()) {
  profissional(ator);
  processarPrazos(agora);
  return todos(
    `SELECT c.id,c.titulo,c.estado,c.criada_em,c.prazo_avaliacao_em,p.nome outro_nome,
   EXISTS(SELECT 1 FROM avaliacoes_colaboracao a WHERE a.colaboracao_id=c.id AND a.avaliador_id=@ator) enviou
   FROM colaboracoes c JOIN perfis p ON p.usuario_id=CASE WHEN c.proponente_id=@ator THEN c.convidado_id ELSE c.proponente_id END
   WHERE c.proponente_id=@ator OR c.convidado_id=@ator ORDER BY c.criada_em DESC`,
    { ator }
  ).map(c => ({
    id: c.id,
    titulo: c.titulo,
    nomeEstado: estadosColaboracao[c.estado],
    estado: c.estado,
    outro_nome: c.outro_nome,
    criada_em: c.criada_em,
    podeAvaliar:
      c.estado === "concluida" && agora <= c.prazo_avaliacao_em && !c.enviou,
  }));
}
export function avaliacoesRecebidas(ator: string, agora = Date.now()) {
  profissional(ator);
  processarPrazos(agora);
  return avaliacoesValidas(ator, agora).map(a => ({
    id: a.id,
    colaboracao_id: a.colaboracao_id,
    nota: (a.comunicacao + a.combinados + a.equipe) / 3,
    comentario: a.comentario_oculto ? "" : a.comentario,
    avaliador:
      um("SELECT nome FROM perfis WHERE usuario_id=?", a.avaliador_id)?.nome ??
      "Profissional",
    titulo: a.titulo,
  }));
}
export function filaModeracao(ator: string) {
  moderador(ator);
  return todos(
    `SELECT k.id,k.motivo,k.estado,k.criada_em,k.revisor_id,k.recurso_de,c.id colaboracao_id,c.estado vinculo_estado FROM casos_colaboracao k JOIN colaboracoes c ON c.id=k.colaboracao_id ORDER BY CASE WHEN k.estado IN('aberta','em_analise') THEN 0 ELSE 1 END,k.criada_em`
  );
}
export function detalheModeracao(ator: string, id: string, agora = Date.now()) {
  const { k, c } = casoModeravel(ator, id);
  const historico = todos(
    "SELECT * FROM historico_colaboracao WHERE colaboracao_id=? ORDER BY ocorrida_em",
    c.id
  );
  const manifestacoes = todos(
    "SELECT m.*,p.nome autor FROM manifestacoes_colaboracao m JOIN perfis p ON p.usuario_id=m.autor_id WHERE caso_id=?",
    k.id
  );
  const avaliacao =
    k.avaliacao_id && liberada(c, agora)
      ? um(
          "SELECT id,comunicacao,combinados,equipe,comentario,estado,comentario_oculto FROM avaliacoes_colaboracao WHERE id=?",
          k.avaliacao_id
        )
      : null;
  const padroes = um(
    `SELECT count(*) vinculos,sum(estado='concluida') concluidas FROM colaboracoes WHERE dupla=?`,
    c.dupla
  );
  const sinais = todos(
    `SELECT p.nome,u.criado_em,
   (SELECT count(*) FROM avaliacoes_colaboracao a JOIN colaboracoes v ON v.id=a.colaboracao_id WHERE a.avaliador_id=u.id AND a.estado='ativa' AND v.estado='concluida' AND a.enviada_em>@inicio30 AND (v.prazo_avaliacao_em<@agora OR (SELECT count(*) FROM avaliacoes_colaboracao x WHERE x.colaboracao_id=v.id)=2)) avaliacoes_30d,
   (SELECT count(*) FROM colaboracoes v WHERE (v.proponente_id=u.id OR v.convidado_id=u.id) AND v.estado='concluida' AND v.concluida_em>@inicio7) conclusoes_7d
   FROM usuarios u JOIN perfis p ON p.usuario_id=u.id WHERE u.id IN(@a,@b)`,
    {
      a: c.proponente_id,
      b: c.convidado_id,
      inicio30: agora - 30 * DIA,
      inicio7: agora - 7 * DIA,
      agora,
    }
  );
  return {
    sinais,
    caso: k,
    colaboracao: c,
    manifestacoes,
    historico,
    avaliacao,
    padroes,
    partes: todos(
      "SELECT usuario_id,nome FROM perfis WHERE usuario_id IN(?,?)",
      c.proponente_id,
      c.convidado_id
    ),
  };
}
