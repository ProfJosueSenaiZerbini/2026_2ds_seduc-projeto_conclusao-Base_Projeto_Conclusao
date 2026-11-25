import { randomUUID, createHash } from "node:crypto";
import { comentarioVisivel } from "./politicasInteracoes.js";
import { conexaoInternaCypher } from "./bancoDados.js";
import { exigirAdministrador } from "./administracao.js";
import {
  objetoDisponivel,
  situacaoContaModeracao,
} from "./politicasModeracao.js";
import { um, todos, type Linha } from "./oportunidades.js";
export class ErroSuporte extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
function exigir(ok: unknown, msg: string, status = 400): asserts ok {
  if (!ok) throw new ErroSuporte(msg, status);
}
const db = () => conexaoInternaCypher(),
  run = (sql: string, ...v: any[]) =>
    db()
      .prepare(sql)
      .run(...v),
  tx = <T>(f: () => T) => db().transaction(f).immediate();
const texto = (v: unknown, n: number, nome: string, min = 0) => {
  exigir(v === undefined || typeof v === "string", `Confira ${nome}.`);
  const s = String(v ?? "").trim();
  exigir(
    s.length >= min && s.length <= n,
    `${nome}: use de ${min} a ${n} caracteres.`
  );
  return s;
};
export const tiposSuporte = [
  { id: "ajuda", nome: "Preciso de ajuda" },
  { id: "sugestao", nome: "Quero sugerir uma melhoria" },
  { id: "denuncia", nome: "Quero denunciar uma ocorrência" },
];
export const motivosSuporte = [
  { id: "assedio", nome: "Assédio / ofensa" },
  { id: "discriminacao", nome: "Discriminação" },
  { id: "fraude", nome: "Fraude" },
  { id: "identidade", nome: "Falsidade de identidade" },
  { id: "plagio", nome: "Plágio" },
  { id: "menores", nome: "Risco envolvendo menores" },
  { id: "conteudo_inadequado", nome: "Conteúdo inadequado" },
  { id: "outro", nome: "Outro motivo" },
];
export const acoesModeracao = [
  { id: "responder", nome: "Responder / concluir sem medida" },
  { id: "advertir", nome: "Advertir" },
  { id: "ocultar", nome: "Ocultar temporariamente o objeto" },
  { id: "remover", nome: "Retirar objeto de circulação" },
  { id: "restringir_contato", nome: "Restringir contato da conta" },
  { id: "suspender", nome: "Suspender acesso da conta" },
  { id: "excluir_conta", nome: "Encerrar acesso e retirar perfil" },
  { id: "restaurar", nome: "Reverter medida anterior" },
];
function convencional(ator: string) {
  const u = um(
    "SELECT id,tipo_conta,email_confirmado_em FROM usuarios WHERE id=? AND demonstracao=0",
    ator
  );
  exigir(
    u &&
      ["profissional", "consumidor"].includes(u.tipo_conta) &&
      u.email_confirmado_em,
    "É necessário um acesso convencional confirmado.",
    403
  );
  return u;
}
function moderador(ator: string) {
  try {
    exigirAdministrador(ator, "moderacao");
  } catch {
    throw new ErroSuporte("Acesso de moderação necessário.", 403);
  }
}
function caso(id: string) {
  const c = um("SELECT * FROM suporte_casos WHERE id=?", id);
  exigir(c, "Solicitação indisponível.", 404);
  return c;
}
function versao(c: Linha, b: Record<string, unknown>) {
  exigir(
    Number(b.versao) === c.versao,
    "A solicitação mudou. Atualize a página antes de continuar.",
    409
  );
}
function evento(
  id: string,
  ator: string,
  acao: string,
  texto: string,
  visibilidade: string,
  agora: number
) {
  run(
    "INSERT INTO suporte_eventos(id,caso_id,autor_id,acao,texto,visibilidade,criada_em) VALUES(?,?,?,?,?,?,?)",
    randomUUID(),
    id,
    ator,
    acao,
    texto,
    visibilidade,
    agora
  );
}
function auditar(ator: string, c: Linha, acao: string, motivo: string) {
  run(
    "INSERT INTO auditoria_administrativa(id,autor_id,acao,alvo_id,detalhe) VALUES(?,?,?,?,?)",
    randomUUID(),
    ator,
    "suporte_" + acao,
    c.afetado_id ?? c.solicitante_id,
    JSON.stringify({ caso: c.id, motivo })
  );
}
function notificar(id: string, c: Linha, etapa: string) {
  run(
    "INSERT INTO notificacoes(id,usuario_destino_id,tipo,titulo,url,entidade_tipo,entidade_id,chave_origem) VALUES(?,?,'suporte',?,?, 'suporte',?,?) ON CONFLICT(chave_origem) DO NOTHING",
    randomUUID(),
    id,
    "Há uma atualização em uma solicitação de suporte.",
    "/suporte/" + c.id,
    c.id,
    "suporte:" + c.id + ":" + etapa + ":" + id
  );
}
function objeto(ator: string, tipo: string, id: string) {
  if (tipo === "conduta") tipo = "perfil";
  const fontes: Record<string, [string, string]> = {
    perfil: ["perfis", "usuario_id"],
    obra: ["obras", "proprietario_id"],
    beat: ["beats", "produtor_id"],
    evento: ["eventos", "proprietario_id"],
    projeto: ["projetos_trabalho", "autor_id"],
    midia: ["midias_trabalho", "autor_id"],
    oportunidade: ["oportunidades_profissionais", "autor_id"],
    mensagem: ["mensagens", "autor_id"],
    comentario: ["comentarios_conteudo", "autor_id"],
    selo: ["selos_perfil", "autor_id"],
  };
  const f = Object.hasOwn(fontes,tipo) ? fontes[tipo] : null;
  exigir(f && id, "Selecione um objeto existente para a denúncia.");
  if (tipo === "perfil" && id.startsWith("@")) {
    const p = um(
      "SELECT usuario_id FROM perfis WHERE identificador=? COLLATE NOCASE",
      id
    );
    exigir(p, "Perfil indisponível.", 404);
    id = p.usuario_id;
  }
  const r = um(
    `SELECT * FROM ${f[0]} WHERE ${tipo === "perfil" ? "usuario_id" : "id"}=?`,
    id
  );
  exigir(r, "Objeto indisponível.", 404);
  const dono = r[f[1]];
  if (tipo === "selo") {
    exigir(r.retirado_em === null && objetoDisponivel(db(), tipo, id, ator), "Selo indisponível.", 404);
  } else if (tipo === "comentario") {
    exigir(comentarioVisivel(db(), ator, r as Parameters<typeof comentarioVisivel>[2]), "Comentário indisponível.", 404);
  } else if (tipo === "mensagem") {
    exigir(
      um(
        "SELECT 1 FROM conversas WHERE id=? AND (participante_a=? OR participante_b=?)",
        r.conversa_id,
        ator,
        ator
      ),
      "Você só pode denunciar mensagens de suas próprias conversas.",
      403
    );
  } else
    exigir(
      dono === ator || objetoDisponivel(db(), tipo, id, ator),
      "Objeto indisponível.",
      404
    );
  const u = um("SELECT tipo_conta FROM usuarios WHERE id=?", dono);
  exigir(
    u && u.tipo_conta !== "administrativo",
    "Este canal trata de objetos convencionais. Use ajuda para relatar conduta da equipe."
  );
  const snapshot = {
    tipo,
    id,
    titulo:
      tipo === "perfil"
        ? r.nome
        : tipo === "mensagem"
          ? "Mensagem denunciada"
          : tipo === "comentario" ? "Comentário denunciado" : (r.titulo ?? r.nome ?? "Registro"),
    autor_id: dono,
    ...(["mensagem", "comentario"].includes(tipo) ? { texto: r.texto } : {}),
    ...(tipo === "selo" ? { letras: r.letras, forma: r.forma, cor: r.cor } : {}),
  };
  return { tipo, id, dono, snapshot };
}
function inserir(
  ator: string,
  b: Record<string, unknown>,
  recurso: Linha | null,
  agora: number
) {
  convencional(ator);
  const tipo = recurso ? "recurso" : texto(b.tipo, 20, "Tipo");
  exigir(
    recurso || tiposSuporte.some(t => t.id === tipo),
    "Escolha o tipo de solicitação."
  );
  const assunto = recurso
      ? "Recurso: " + recurso.assunto
      : texto(b.assunto, 120, "Assunto", 5),
    descricao = texto(b.descricao, 4000, "Descrição", 10),
    evidencias = texto(b.evidencias, 3000, "Evidências"),
    motivo = tipo === "denuncia" ? texto(b.motivo, 40, "Motivo") : "";
  exigir(
    tipo !== "denuncia" || motivosSuporte.some(m => m.id === motivo),
    "Escolha um motivo pertinente."
  );
  const chave = texto(b.chave_envio, 100, "Identificador de envio", 10);
  exigir(/^[a-zA-Z0-9-]+$/.test(chave), "Identificador de envio inválido.");
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        tipo,
        assunto,
        descricao,
        evidencias,
        motivo,
        origem: b.objeto_tipo,
        id: b.objeto_id,
        recurso: recurso?.id,
      })
    )
    .digest("hex");
  const existente = um(
    "SELECT id,hash_payload FROM suporte_casos WHERE solicitante_id=? AND chave_envio=?",
    ator,
    chave
  );
  if (existente) {
    exigir(
      existente.hash_payload === hash,
      "Este identificador já foi usado em outra solicitação.",
      409
    );
    return existente.id as string;
  }
  exigir(
    um(
      "SELECT count(*) n FROM suporte_casos WHERE solicitante_id=? AND criada_em>?",
      ator,
      agora - 86400000
    )!.n < 12,
    "Limite de 12 solicitações por dia.",
    429
  );
  const alvo =
    tipo === "denuncia"
      ? objeto(
          ator,
          texto(b.objeto_tipo, 25, "Tipo do objeto"),
          texto(b.objeto_id, 100, "Identificador do objeto")
        )
      : null;
  const nascimento = um(
    "SELECT nascimento FROM perfis WHERE usuario_id=?",
    ator
  )?.nascimento;
  const jovem =
    nascimento && Date.parse(nascimento) > agora - 18 * 365.25 * 86400000;
  const prioridade =
      motivo === "menores" || jovem || b.risco === "sim" ? "alta" : "normal",
    id = randomUUID();
  run(
    "INSERT INTO suporte_casos(id,solicitante_id,afetado_id,tipo,assunto,descricao,motivo,objeto_tipo,objeto_id,snapshot_json,evidencias,prioridade,criada_em,atualizada_em,recurso_de,chave_envio,hash_payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    id,
    ator,
    recurso?.afetado_id ?? alvo?.dono ?? null,
    tipo,
    assunto.slice(0, 140),
    descricao,
    motivo,
    recurso?.objeto_tipo ?? alvo?.tipo ?? "",
    recurso?.objeto_id ?? alvo?.id ?? "",
    recurso?.snapshot_json ?? JSON.stringify(alvo?.snapshot ?? {}),
    evidencias,
    prioridade,
    agora,
    agora,
    recurso?.id ?? null,
    chave,
    hash
  );
  evento(id, ator, "aberta", descricao, "solicitante", agora);
  notificar(ator, caso(id), "abertura");
  return id;
}
export function criarSolicitacao(
  ator: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => inserir(ator, b, null, agora));
}
export function listarSolicitacoes(ator: string) {
  convencional(ator);
  return todos(
    "SELECT id,assunto,tipo,estado,prioridade,criada_em,atualizada_em,solicitante_id,afetado_id FROM suporte_casos WHERE solicitante_id=? OR (afetado_id=? AND decidida_em IS NOT NULL) ORDER BY criada_em DESC",
    ator,
    ator
  );
}
export function solicitacaoDoUsuario(ator: string, id: string) {
  convencional(ator);
  const c = caso(id),
    solicitante = c.solicitante_id === ator;
  exigir(
    solicitante || (c.afetado_id === ator && c.decidida_em),
    "Solicitação indisponível.",
    404
  );
  const historico = todos(
    "SELECT acao,texto,criada_em FROM suporte_eventos WHERE caso_id=? AND visibilidade IN('ambos',?) ORDER BY criada_em,id",
    id,
    solicitante ? "solicitante" : "afetado"
  );
  const medidas = todos(
    "SELECT id,acao,alvo_tipo,alvo_id,motivo,criada_em,ate,revogada_em FROM suporte_medidas WHERE caso_id=?",
    id
  );
  return {
    id: c.id,
    assunto: c.assunto,
    tipo: c.tipo,
    estado: c.estado,
    versao: c.versao,
    prioridade: c.prioridade,
    criada_em: c.criada_em,
    atualizada_em: c.atualizada_em,
    descricao: solicitante ? c.descricao : "",
    evidencias: solicitante ? c.evidencias : "",
    resposta: c.resposta,
    decisao: c.decisao,
    recurso_de: c.recurso_de,
    solicitante,
    medidas: medidas.map(m => ({
      ...m,
      motivo: c.resposta || "Medida registrada; consulte a decisão comunicada.",
    })),
    historico,
    objeto_tipo: c.objeto_tipo,
    objeto_id: c.objeto_id,
  };
}
export function responderSolicitacao(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  convencional(ator);
  return tx(() => {
    const c = caso(id);
    exigir(
      c.solicitante_id === ator || c.afetado_id === ator,
      "Solicitação indisponível.",
      404
    );
    versao(c, b);
    exigir(
      ["pendente", "em_analise"].includes(c.estado),
      "Use recurso para uma solicitação já decidida.",
      409
    );
    evento(
      id,
      ator,
      "manifestacao",
      texto(b.texto, 3000, "Manifestação", 10),
      c.solicitante_id === ator ? "solicitante" : "afetado",
      agora
    );
    run(
      "UPDATE suporte_casos SET versao=versao+1,atualizada_em=? WHERE id=?",
      agora,
      id
    );
  });
}
export function recorrerSolicitacao(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  convencional(ator);
  return tx(() => {
    const c = caso(id);
    exigir(
      c.solicitante_id === ator || c.afetado_id === ator,
      "Solicitação indisponível.",
      404
    );
    versao(c, b);
    exigir(
      ["resolvida", "arquivada"].includes(c.estado),
      "Aguarde uma decisão para recorrer.",
      409
    );
    exigir(
      !um(
        "SELECT 1 FROM suporte_casos WHERE recurso_de=? AND solicitante_id=? AND estado IN('pendente','em_analise')",
        id,
        ator
      ),
      "Já há um recurso pendente.",
      409
    );
    const rid = inserir(ator, b, c, agora);
    evento(id, ator, "recurso", "Recurso registrado.", "ambos", agora);
    return rid;
  });
}
export function filaModeracao(ator: string, q: Record<string, unknown> = {}) {
  moderador(ator);
  return todos(
    "SELECT id,tipo,assunto,estado,prioridade,versao,revisor_id,criada_em,recurso_de FROM suporte_casos ORDER BY CASE WHEN estado IN('pendente','em_analise') THEN 0 ELSE 1 END,CASE WHEN prioridade='alta' THEN 0 ELSE 1 END,criada_em"
  ).filter(c => !q.estado || c.estado === q.estado);
}
export function assumirSolicitacao(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  moderador(ator);
  return tx(() => {
    const c = caso(id);
    versao(c, b);
    exigir(
      ["pendente", "em_analise"].includes(c.estado),
      "Solicitação já decidida.",
      409
    );
    const alvo = texto(b.revisor_id, 100, "Revisor") || ator;
    moderador(alvo);
    exigir(
      c.solicitante_id !== alvo && c.afetado_id !== alvo,
      "Conflito de interesse.",
      403
    );
    if (c.recurso_de) {
      const pai = caso(c.recurso_de);
      exigir(pai.revisor_id !== alvo, "O recurso exige outro revisor.", 403);
    }
    const superior = um(
      "SELECT 1 FROM administradores WHERE usuario_id=? AND papel='super_admin' AND ativo=1",
      ator
    );
    exigir(
      ((!c.revisor_id || c.revisor_id === ator) && alvo === ator) || superior,
      "Caso atribuído a outro responsável.",
      403
    );
    exigir(
      b.prioridade === undefined ||
        ["normal", "alta"].includes(String(b.prioridade)),
      "Prioridade inválida."
    );
    if (b.prioridade !== undefined)
      run("UPDATE suporte_casos SET prioridade=? WHERE id=?", b.prioridade, id);
    run(
      "UPDATE suporte_casos SET revisor_id=?,estado='em_analise',versao=versao+1,atualizada_em=? WHERE id=?",
      alvo,
      agora,
      id
    );
    evento(id, ator, "atribuida", "Responsável atribuído.", "interno", agora);
    auditar(ator, c, "atribuicao", "Atribuição de responsável ao caso.");
  });
}
export function casoModeracao(ator: string, id: string) {
  moderador(ator);
  const c = caso(id);
  const permitido =
    c.revisor_id === ator && c.solicitante_id !== ator && c.afetado_id !== ator;
  if (!permitido)
    return {
      id: c.id,
      tipo: c.tipo,
      assunto: c.assunto,
      estado: c.estado,
      versao: c.versao,
      prioridade: c.prioridade,
      revisor_id: c.revisor_id,
      recurso_de: c.recurso_de,
      criada_em: c.criada_em,
      atribuido: false,
    };
  const { snapshot_json, ...semSnapshot } = c;
  return {
    ...semSnapshot,
    atribuido: true,
    historico: todos(
      "SELECT e.*,coalesce(a.nome,p.nome) autor FROM suporte_eventos e LEFT JOIN administradores a ON a.usuario_id=e.autor_id LEFT JOIN perfis p ON p.usuario_id=e.autor_id WHERE caso_id=? ORDER BY e.criada_em,e.id",
      id
    ),
    medidas: todos(
      "SELECT * FROM suporte_medidas WHERE caso_id=? OR caso_id=?",
      id,
      c.recurso_de ?? ""
    ),
    responsaveis: todos(
      "SELECT usuario_id,nome FROM administradores WHERE ativo=1 AND papel IN('super_admin','moderador')"
    ),
  };
}
function atribuido(ator: string, id: string) {
  moderador(ator);
  const c = caso(id);
  exigir(
    c.revisor_id === ator && c.solicitante_id !== ator && c.afetado_id !== ator,
    "Assuma o caso para acessar evidências ou decidir.",
    403
  );
  return c;
}
export function consultarEvidencia(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    const c = atribuido(ator, id),
      motivo = texto(b.motivo, 1500, "Necessidade de acesso", 20);
    run(
      "INSERT INTO suporte_acessos(id,caso_id,autor_id,motivo,criada_em) VALUES(?,?,?,?,?)",
      randomUUID(),
      id,
      ator,
      motivo,
      agora
    );
    auditar(ator, c, "evidencia", motivo);
    return { objeto: JSON.parse(c.snapshot_json), referencias: c.evidencias };
  });
}
export function decidirSolicitacao(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    const c = atribuido(ator, id);
    versao(c, b);
    exigir(
      ["pendente", "em_analise"].includes(c.estado),
      "Solicitação já decidida.",
      409
    );
    const decisao = texto(b.decisao, 30, "Decisão"),
      estado = texto(b.estado, 20, "Estado"),
      resposta = texto(b.resposta, 3000, "Resposta", 10),
      motivo = texto(b.motivo, 3000, "Fundamentação", 20);
    exigir(
      ["resolvida", "arquivada"].includes(estado) &&
        acoesModeracao.some(a => a.id === decisao),
      "Decisão inválida."
    );
    if (decisao === "restaurar") {
      const medida = um(
        "SELECT * FROM suporte_medidas WHERE id=?",
        texto(b.medida_id, 100, "Medida")
      );
      exigir(
        medida &&
          medida.revogada_em === null &&
          (medida.caso_id === id || medida.caso_id === c.recurso_de),
        "A medida não pertence a este caso ou recurso."
      );
      run(
        "UPDATE suporte_medidas SET revogada_em=? WHERE id=?",
        agora,
        medida.id
      );
    } else if (decisao !== "responder") {
      exigir(
        c.afetado_id && c.objeto_tipo,
        "Uma medida exige objeto e titular identificados."
      );
      const contaAlvo = [
        "advertir",
        "restringir_contato",
        "suspender",
        "excluir_conta",
      ].includes(decisao);
      const tipo = contaAlvo ? "perfil" : c.objeto_tipo,
        alvo = contaAlvo ? c.afetado_id : c.objeto_id;
      exigir(
        tipo !== "perfil" || !["ocultar", "remover"].includes(decisao),
        "Use suspensão ou encerramento para uma conta."
      );
      const duration =
        b.duracao_dias === undefined || b.duracao_dias === ""
          ? null
          : Number(b.duracao_dias);
      exigir(
        duration === null ||
          (Number.isInteger(duration) && duration >= 1 && duration <= 365),
        "Use duração de 1 a 365 dias."
      );
      run(
        "INSERT INTO suporte_medidas(id,caso_id,autor_id,acao,alvo_tipo,alvo_id,motivo,criada_em,ate) VALUES(?,?,?,?,?,?,?,?,?)",
        randomUUID(),
        id,
        ator,
        decisao,
        tipo,
        alvo,
        motivo,
        agora,
        duration ? agora + duration * 86400000 : null
      );
    }
    run(
      "UPDATE suporte_casos SET estado=?,decisao=?,resposta=?,decidida_em=?,atualizada_em=?,versao=versao+1 WHERE id=?",
      estado,
      decisao,
      resposta,
      agora,
      agora,
      id
    );
    evento(id, ator, "decisao", resposta, "ambos", agora);
    evento(id, ator, "fundamentacao", motivo, "interno", agora);
    auditar(ator, c, decisao, motivo);
    notificar(c.solicitante_id, c, "decisao");
    if (c.afetado_id && c.afetado_id !== c.solicitante_id)
      notificar(c.afetado_id, c, "decisao");
    return id;
  });
}
