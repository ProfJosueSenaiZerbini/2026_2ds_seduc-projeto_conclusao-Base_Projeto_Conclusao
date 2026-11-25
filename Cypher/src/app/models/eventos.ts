import { randomUUID } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import { conta, um, todos, type Linha } from "./oportunidades.js";
import { objetoDisponivel } from "./politicasModeracao.js";
import { criarSolicitacao } from "./suporte.js";

export class ErroEvento extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
function exigir(ok: unknown, msg: string, status = 400): asserts ok {
  if (!ok) throw new ErroEvento(msg, status);
}
const db = () => conexaoInternaCypher();
const run = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .run(...v);
const tx = <T>(fn: () => T) => db().transaction(fn).immediate();
const texto = (v: unknown, n: number, nome: string, min = 0) => {
  exigir(typeof v === "string" || v === undefined, `Confira ${nome}.`);
  const s = String(v ?? "").trim();
  exigir(
    s.length >= min && s.length <= n,
    `${nome}: use de ${min} a ${n} caracteres.`
  );
  return s;
};
export const estadosInscricao: Record<string, string> = {
  pendente: "Aguardando aprovação",
  confirmada: "Confirmada",
  recusada: "Recusada",
  cancelada: "Cancelada",
};
export function fusoValido(valor: unknown) {
  const s = texto(valor, 80, "Fuso horário", 1);
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: s }).format();
    return s;
  } catch {
    throw new ErroEvento("Selecione um fuso horário válido.");
  }
}
function partes(n: number, fuso: string) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: fuso,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(n)
      .filter(p => p.type !== "literal")
      .map(p => [p.type, p.value])
  );
}
export function instanteLocal(data: string, hora: string, fuso: string) {
  exigir(
    /^\d{4}-\d{2}-\d{2}$/.test(data) && /^\d{2}:\d{2}$/.test(hora),
    "Informe data e horário completos."
  );
  const alvo = Date.parse(data + "T" + hora + ":00Z");
  exigir(
    Number.isFinite(alvo) &&
      new Date(alvo).toISOString().slice(0, 16) === data + "T" + hora,
    "Data ou horário inválido."
  );
  let t = alvo;
  for (let i = 0; i < 4; i++) {
    const p = partes(t, fuso);
    const local = Date.parse(
      `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`
    );
    const d = alvo - local;
    if (!d) break;
    t += d;
  }
  const p = partes(t, fuso);
  exigir(
    `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === data + "T" + hora,
    "Esse horário não existe no fuso selecionado."
  );
  return t;
}
function usuario(id: string) {
  try {
    const u = conta(id);
    exigir(
      ["consumidor", "profissional"].includes(u.tipo_conta),
      "Acesso convencional confirmado necessário.",
      403
    );
    return u;
  } catch {
    throw new ErroEvento("Acesso convencional confirmado necessário.", 403);
  }
}
function evento(id: string, ator: string) {
  usuario(ator);
  const e = um("SELECT * FROM eventos WHERE id=? AND demonstracao=0", id);
  exigir(
    e && objetoDisponivel(db(), "evento", id, ator),
    "Evento indisponível.",
    404
  );
  return e;
}
function config(id: string) {
  return (
    um("SELECT * FROM eventos_configuracoes WHERE evento_id=?", id) ?? {
      evento_id: id,
      capacidade: null,
      criterios: "",
      fuso: "America/Sao_Paulo",
      inicio_em: null,
      fim_em: null,
      latitude: null,
      longitude: null,
      local_confirmado: 0,
      serie_id: null,
      estado: "ativo",
      motivo_cancelamento: "",
      versao: 1,
    }
  );
}
function organizador(ator: string, id: string) {
  const e = evento(id, ator),
    u = usuario(ator);
  exigir(
    e.proprietario_id === ator && u.tipo_conta === "profissional",
    "Apenas a organização responsável pode realizar esta ação.",
    403
  );
  return e;
}
function versao(c: Linha, b: Record<string, unknown>) {
  exigir(
    Number(b.versao) === c.versao,
    "O evento mudou. Atualize a página antes de continuar.",
    409
  );
}
function historico(
  id: string,
  ator: string,
  acao: string,
  detalhe: string,
  agora: number
) {
  run(
    "INSERT INTO eventos_historico(id,evento_id,autor_id,acao,detalhe,criada_em) VALUES(?,?,?,?,?,?)",
    randomUUID(),
    id,
    ator,
    acao,
    detalhe,
    agora
  );
}
function notificar(
  destino: string,
  id: string,
  titulo: string,
  chave: string,
  mensagem = ""
) {
  run(
    `INSERT INTO notificacoes(id,usuario_destino_id,tipo,titulo,mensagem,url,entidade_tipo,entidade_id,chave_origem) VALUES(?,?,'evento',?,?,?,'evento',?,?) ON CONFLICT(chave_origem) DO NOTHING`,
    randomUUID(),
    destino,
    titulo,
    mensagem,
    "/events/" + id,
    id,
    "eventos:" + id + ":" + chave + ":" + destino
  );
}
function afetados(id: string) {
  return todos(
    `SELECT usuario_id FROM eventos_acompanhamentos WHERE evento_id=? AND (interessado=1 OR salvo=1) UNION SELECT usuario_id FROM eventos_inscricoes WHERE evento_id=? AND estado IN('pendente','confirmada')`,
    id,
    id
  );
}
function vagas(id: string, c: Linha) {
  const n = um(
    "SELECT COUNT(*) AS n FROM eventos_inscricoes WHERE evento_id=? AND estado='confirmada'",
    id
  )!.n;
  return c.capacidade === null ? null : Math.max(0, c.capacidade - n);
}
function participacaoAberta(e: Linha, c: Linha, agora: number) {
  exigir(
    c.estado === "ativo" &&
      e.situacao !== "Encerrado" &&
      e.situacao !== "Cancelado",
    "As inscrições deste evento estão encerradas."
  );
  exigir(
    c.inicio_em && c.fim_em,
    "A organização precisa confirmar os horários antes de abrir inscrições."
  );
  exigir(
    agora < c.inicio_em,
    "O evento já começou; novas inscrições estão encerradas."
  );
}
export function validarConfiguracaoEvento(b: Record<string, unknown>) {
  const fuso = fusoValido(b.fuso ?? "America/Sao_Paulo"),
    inicio = instanteLocal(String(b.data ?? ""), String(b.horario ?? ""), fuso),
    fim = instanteLocal(
      String(b.fimData ?? ""),
      String(b.fimHorario ?? ""),
      fuso
    );
  exigir(
    fim > inicio && fim - inicio <= 30 * 86400000,
    "O fim deve ser posterior ao início e em até 30 dias."
  );
  const cap = String(b.capacidade ?? "").trim();
  exigir(
    !cap || (/^\d+$/.test(cap) && Number(cap) >= 1 && Number(cap) <= 100000),
    "Informe de 1 a 100.000 vagas ou deixe sem limite."
  );
  const criterios = texto(b.criterios, 1500, "Critérios de participação", 10),
    serie = texto(b.serieId, 100, "Edição de referência");
  let lat: number | null = null,
    lon: number | null = null;
  if (b.localConfirmado === "sim") {
    exigir(
      String(b.latitude ?? "").trim() !== "" &&
        String(b.longitude ?? "").trim() !== "",
      "Informe as duas coordenadas confirmadas."
    );
    lat = Number(b.latitude);
    lon = Number(b.longitude);
    exigir(
      Number.isFinite(lat) &&
        lat >= -90 &&
        lat <= 90 &&
        Number.isFinite(lon) &&
        lon >= -180 &&
        lon <= 180,
      "Coordenadas inválidas."
    );
  }
  return {
    capacidade: cap ? Number(cap) : null,
    criterios,
    fuso,
    inicio_em: inicio,
    fim_em: fim,
    latitude: lat,
    longitude: lon,
    local_confirmado: lat === null ? 0 : 1,
    serie_id: serie || null,
  };
}
export function salvarConfiguracaoEvento(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  antes?: Linha,
  agora = Date.now()
) {
  return tx(() => {
    const e = organizador(ator, id),
      c = config(id),
      v = validarConfiguracaoEvento(b);
    if (antes) versao(c, b);
    exigir(
      c.estado === "ativo",
      "Eventos cancelados preservam o histórico e não podem ser reabertos."
    );
    const confirmados = um(
      "SELECT COUNT(*) AS n FROM eventos_inscricoes WHERE evento_id=? AND estado='confirmada'",
      id
    )!.n;
    exigir(
      v.capacidade === null || v.capacidade >= confirmados,
      "O limite não pode ser menor que as confirmações existentes."
    );
    if (v.serie_id) {
      const ref = evento(v.serie_id, ator);
      exigir(
        ref.proprietario_id === ator && ref.id !== id,
        "Selecione uma edição própria diferente deste evento."
      );
      exigir(
        !config(v.serie_id).serie_id,
        "Vincule a edição principal da série."
      );
    }
    run(
      `INSERT INTO eventos_configuracoes(evento_id,capacidade,criterios,fuso,inicio_em,fim_em,latitude,longitude,local_confirmado,serie_id) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(evento_id) DO UPDATE SET capacidade=excluded.capacidade,criterios=excluded.criterios,fuso=excluded.fuso,inicio_em=excluded.inicio_em,fim_em=excluded.fim_em,latitude=excluded.latitude,longitude=excluded.longitude,local_confirmado=excluded.local_confirmado,serie_id=excluded.serie_id,versao=eventos_configuracoes.versao+1`,
      id,
      v.capacidade,
      v.criterios,
      v.fuso,
      v.inicio_em,
      v.fim_em,
      v.latitude,
      v.longitude,
      v.local_confirmado,
      v.serie_id
    );
    const relevantes =
      antes &&
      (antes.data_texto !== e.data_texto ||
        antes.horario !== e.horario ||
        antes.local !== e.local ||
        antes.tipo_participacao !== e.tipo_participacao ||
        c.inicio_em !== v.inicio_em ||
        c.fim_em !== v.fim_em ||
        c.capacidade !== v.capacidade ||
        c.criterios !== v.criterios ||
        c.latitude !== v.latitude ||
        c.longitude !== v.longitude);
    historico(
      id,
      ator,
      antes ? "atualizado" : "configurado",
      JSON.stringify({
        anterior: antes
          ? {
              data: antes.data_texto,
              horario: antes.horario,
              local: antes.local,
              admissao: antes.tipo_participacao,
              configuracao: c,
            }
          : null,
        atual: {
          data: e.data_texto,
          horario: e.horario,
          local: e.local,
          admissao: e.tipo_participacao,
          configuracao: v,
        },
      }),
      agora
    );
    if (relevantes) {
      run("UPDATE notificacoes SET titulo='A programação do evento foi atualizada.',mensagem='Confira a data, o local e as condições atuais na ficha do evento.' WHERE entidade_tipo='evento' AND entidade_id=? AND tipo='evento_lembrete'", id);
      for (const u of afetados(id))
        notificar(
          u.usuario_id,
          id,
          "O evento que você acompanha foi atualizado.",
          "alteracao:" + config(id).versao,
          "Confira data, local e condições de participação."
        );
    }
  });
}
export function configuracaoFormularioEvento(ator: string, id: string) {
  organizador(ator, id);
  const c = config(id),
    p = c.fim_em ? partes(c.fim_em, c.fuso) : null;
  return {
    capacidade: c.capacidade ?? "",
    criterios: c.criterios,
    fuso: c.fuso,
    fimData: p ? `${p.year}-${p.month}-${p.day}` : "",
    fimHorario: p ? `${p.hour}:${p.minute}` : "",
    localConfirmado: c.local_confirmado ? "sim" : "",
    latitude: c.latitude ?? "",
    longitude: c.longitude ?? "",
    serieId: c.serie_id ?? "",
    versao: c.versao,
  };
}
export function eventoAntesDeEditar(ator: string, id: string) {
  return organizador(ator, id);
}
export function seguirEvento(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    const e = evento(id, ator),
      c = config(id);
    exigir(
      e.proprietario_id !== ator,
      "A organização já acompanha o próprio evento."
    );
    exigir(c.estado === "ativo", "Este evento foi cancelado.");
    const acao = String(b.acao ?? "");
    exigir(
      ["interesse", "salvar", "preferencias"].includes(acao),
      "Ação inválida."
    );
    run(
      "INSERT INTO eventos_acompanhamentos(evento_id,usuario_id,criada_em) VALUES(?,?,?) ON CONFLICT DO NOTHING",
      id,
      ator,
      agora
    );
    if (acao === "interesse")
      run(
        "UPDATE eventos_acompanhamentos SET interessado=? WHERE evento_id=? AND usuario_id=?",
        b.ativo === "sim" ? 1 : 0,
        id,
        ator
      );
    if (acao === "salvar")
      run(
        "UPDATE eventos_acompanhamentos SET salvo=? WHERE evento_id=? AND usuario_id=?",
        b.ativo === "sim" ? 1 : 0,
        id,
        ator
      );
    if (acao === "preferencias")
      run(
        "UPDATE eventos_acompanhamentos SET lembrar24=?,lembrar_dia=?,fuso=? WHERE evento_id=? AND usuario_id=?",
        b.lembrar24 === "sim" ? 1 : 0,
        b.lembrarDia === "sim" ? 1 : 0,
        fusoValido(b.fuso),
        id,
        ator
      );
  });
}
export function inscreverEvento(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    const e = evento(id, ator),
      c = config(id);
    exigir(
      e.proprietario_id !== ator,
      "A organização não pode se inscrever no próprio evento."
    );
    participacaoAberta(e, c, agora);
    exigir(
      b.aceite === "sim",
      "Confirme que leu os critérios de participação."
    );
    const atual = um(
      "SELECT * FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=?",
      id,
      ator
    );
    if (atual && ["pendente", "confirmada"].includes(atual.estado))
      return atual.id;
    exigir(
      atual?.estado !== "recusada",
      "Esta inscrição já foi recusada. Procure a organização ou o suporte."
    );
    const estado =
      e.tipo_participacao === "aprovacao" ? "pendente" : "confirmada";
    if (estado === "confirmada")
      exigir(vagas(id, c) !== 0, "Não há vagas disponíveis.");
    const just = texto(b.justificativa, 1000, "Apresentação");
    const iid = atual?.id ?? randomUUID();
    run(
      `INSERT INTO eventos_inscricoes(id,evento_id,usuario_id,estado,justificativa,criada_em,atualizada_em) VALUES(?,?,?,?,?,?,?) ON CONFLICT(evento_id,usuario_id) DO UPDATE SET estado=excluded.estado,justificativa=excluded.justificativa,resposta='',atualizada_em=excluded.atualizada_em,versao=eventos_inscricoes.versao+1`,
      iid,
      id,
      ator,
      estado,
      just,
      agora,
      agora
    );
    run(
      "INSERT INTO eventos_acompanhamentos(evento_id,usuario_id,criada_em) VALUES(?,?,?) ON CONFLICT DO NOTHING",
      id,
      ator,
      agora
    );
    historico(id, ator, "inscricao", estado, agora);
    notificar(
      e.proprietario_id,
      id,
      "Uma nova inscrição chegou ao seu evento.",
      "inscricao:" + iid + ":" + (atual?.versao ?? 0)
    );
    notificar(
      ator,
      id,
      estado === "pendente"
        ? "Sua inscrição aguarda aprovação."
        : "Sua inscrição foi confirmada.",
      "estado:" + iid + ":" + (atual?.versao ?? 0)
    );
    return iid;
  });
}
export function cancelarInscricaoEvento(
  ator: string,
  id: string,
  agora = Date.now()
) {
  return tx(() => {
    evento(id, ator);
    const i = um(
      "SELECT * FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=?",
      id,
      ator
    );
    exigir(
      i && ["pendente", "confirmada"].includes(i.estado),
      "Não há inscrição ativa para cancelar."
    );
    exigir(
      !um(
        "SELECT 1 FROM eventos_presencas WHERE evento_id=? AND usuario_id=? AND revogada_em IS NULL",
        id,
        ator
      ),
      "A presença já foi registrada. Solicite uma correção à organização."
    );
    run(
      "UPDATE eventos_inscricoes SET estado='cancelada',atualizada_em=?,versao=versao+1 WHERE id=?",
      agora,
      i.id
    );
    historico(
      id,
      ator,
      "inscricao_cancelada",
      "Cancelada pelo participante",
      agora
    );
  });
}
export function decidirInscricaoEvento(
  ator: string,
  id: string,
  participante: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    const e = organizador(ator, id),
      c = config(id);
    participacaoAberta(e, c, agora);
    const i = um(
      "SELECT * FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=?",
      id,
      participante
    );
    exigir(
      i && i.estado === "pendente",
      "Esta inscrição não está aguardando decisão."
    );
    versao(i, b);
    exigir(
      ["confirmada", "recusada"].includes(String(b.estado)),
      "Escolha uma decisão válida."
    );
    const resposta = texto(b.resposta, 1000, "Justificativa da decisão", 10);
    if (b.estado === "confirmada")
      exigir(vagas(id, c) !== 0, "O limite de vagas já foi preenchido.");
    run(
      "UPDATE eventos_inscricoes SET estado=?,resposta=?,atualizada_em=?,versao=versao+1 WHERE id=?",
      b.estado,
      resposta,
      agora,
      i.id
    );
    historico(
      id,
      ator,
      "inscricao_decidida",
      JSON.stringify({ inscricao: i.id, estado: b.estado, resposta }),
      agora
    );
    notificar(
      participante,
      id,
      b.estado === "confirmada"
        ? "Sua inscrição foi confirmada."
        : "Sua inscrição foi recusada.",
      "decisao:" + i.id + ":" + i.versao
    );
  });
}
export function registrarPresencaEvento(
  ator: string,
  id: string,
  participante: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    organizador(ator, id);
    const c = config(id);
    exigir(
      c.estado === "ativo" && c.inicio_em && agora >= c.inicio_em,
      "A presença só pode ser registrada após o início do evento."
    );
    const i = um(
      "SELECT id FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=? AND estado='confirmada'",
      id,
      participante
    );
    exigir(i, "Confirme a inscrição antes de registrar comparecimento.");
    const evidencia = texto(
      b.evidencia,
      1200,
      "Como o comparecimento foi conferido",
      10
    );
    const existente = um(
      "SELECT * FROM eventos_presencas WHERE evento_id=? AND usuario_id=?",
      id,
      participante
    );
    if (b.acao === "revogar") {
      exigir(
        existente && !existente.revogada_em,
        "Não há presença ativa para corrigir."
      );
      run(
        "UPDATE eventos_presencas SET revogada_em=? WHERE evento_id=? AND usuario_id=?",
        agora,
        id,
        participante
      );
      run(
        "UPDATE eventos_avaliacoes SET invalidada_em=? WHERE evento_id=? AND usuario_id=?",
        agora,
        id,
        participante
      );
    } else {
      exigir(!existente || existente.revogada_em, "Presença já registrada.");
      run(
        "INSERT INTO eventos_presencas(evento_id,usuario_id,responsavel_id,evidencia,registrada_em) VALUES(?,?,?,?,?) ON CONFLICT(evento_id,usuario_id) DO UPDATE SET responsavel_id=excluded.responsavel_id,evidencia=excluded.evidencia,registrada_em=excluded.registrada_em,revogada_em=NULL",
        id,
        participante,
        ator,
        evidencia,
        agora
      );
    }
    historico(
      id,
      ator,
      b.acao === "revogar" ? "presenca_corrigida" : "presenca_registrada",
      JSON.stringify({ participante, evidencia }),
      agora
    );
    notificar(
      participante,
      id,
      b.acao === "revogar"
        ? "O registro de presença foi corrigido."
        : "Sua presença foi registrada pela organização.",
      "presenca:" + participante + ":" + agora
    );
  });
}
export function cancelarEvento(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    organizador(ator, id);
    const c = config(id);
    if (c.estado === "cancelado") return;
    versao(c, b);
    const motivo = texto(b.motivo, 1500, "Motivo do cancelamento", 10);
    const pessoas = afetados(id);
    run(
      `INSERT INTO eventos_configuracoes(evento_id,estado,motivo_cancelamento) VALUES(?,'cancelado',?) ON CONFLICT(evento_id) DO UPDATE SET estado='cancelado',motivo_cancelamento=excluded.motivo_cancelamento,versao=eventos_configuracoes.versao+1`,
      id,
      motivo
    );
    run(
      "UPDATE eventos SET situacao='Cancelado',atualizado_em=CURRENT_TIMESTAMP WHERE id=?",
      id
    );
    run("UPDATE notificacoes SET titulo='Este evento foi cancelado.',mensagem='Consulte o motivo e as orientações da organização na ficha do evento.' WHERE entidade_tipo='evento' AND entidade_id=? AND tipo='evento_lembrete'", id);
    run(
      "UPDATE eventos_inscricoes SET estado='cancelada',resposta=?,atualizada_em=?,versao=versao+1 WHERE evento_id=? AND estado IN('pendente','confirmada')",
      "Evento cancelado: " + motivo,
      agora,
      id
    );
    historico(id, ator, "cancelado", motivo, agora);
    for (const u of pessoas)
      notificar(
        u.usuario_id,
        id,
        "Um evento que você acompanha foi cancelado.",
        "cancelamento",
        motivo
      );
  });
}
function elegivel(ator: string, id: string, agora: number) {
  const c = config(id);
  exigir(
    c.fim_em && agora >= c.fim_em && c.estado !== "cancelado",
    "A avaliação abre após o fim do evento."
  );
  exigir(
    um(
      "SELECT 1 FROM eventos_presencas WHERE evento_id=? AND usuario_id=? AND revogada_em IS NULL",
      id,
      ator
    ),
    "A avaliação exige comparecimento reconhecido pela organização.",
    403
  );
}
export function avaliarEvento(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    evento(id, ator);
    elegivel(ator, id, agora);
    exigir(
      ["sim", "nao"].includes(String(b.positiva)),
      "Informe como foi a experiência."
    );
    const just = texto(
      b.justificativa,
      1500,
      "Justificativa",
      b.positiva === "nao" ? 10 : 0
    );
    exigir(
      !um(
        "SELECT 1 FROM eventos_avaliacoes WHERE evento_id=? AND usuario_id=?",
        id,
        ator
      ),
      "Você já avaliou esta edição."
    );
    run(
      "INSERT INTO eventos_avaliacoes(id,evento_id,usuario_id,positiva,justificativa,criada_em) VALUES(?,?,?,?,?,?)",
      randomUUID(),
      id,
      ator,
      b.positiva === "sim" ? 1 : 0,
      just,
      agora
    );
  });
}
export function reclamarEvento(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    const e = evento(id, ator);
    elegivel(ator, id, agora);
    const descricao = texto(b.descricao, 3000, "Reclamação", 20),
      evidencias = texto(b.evidencias, 3000, "Evidências");
    exigir(
      !um(
        "SELECT 1 FROM eventos_reclamacoes WHERE evento_id=? AND usuario_id=?",
        id,
        ator
      ),
      "Já há uma reclamação sua nesta edição."
    );
    const rid = randomUUID();
    run(
      "INSERT INTO eventos_reclamacoes(id,evento_id,usuario_id,descricao,evidencias,criada_em) VALUES(?,?,?,?,?,?)",
      rid,
      id,
      ator,
      descricao,
      evidencias,
      agora
    );
    notificar(
      e.proprietario_id,
      id,
      "Uma reclamação sobre o evento aguarda resposta.",
      "reclamacao:" + rid
    );
    return rid;
  });
}
export function responderReclamacaoEvento(
  ator: string,
  id: string,
  rid: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  return tx(() => {
    organizador(ator, id);
    const r = um(
      "SELECT * FROM eventos_reclamacoes WHERE id=? AND evento_id=?",
      rid,
      id
    );
    exigir(r && r.estado === "pendente", "Esta reclamação já foi respondida.");
    exigir(
      ["reconhecida", "contestada"].includes(String(b.estado)),
      "Escolha reconhecer ou contestar."
    );
    const resposta = texto(b.resposta, 3000, "Resposta à reclamação", 20);
    run(
      "UPDATE eventos_reclamacoes SET estado=?,resposta=? WHERE id=?",
      b.estado,
      resposta,
      rid
    );
    historico(id, ator, "reclamacao_respondida", rid, agora);
    notificar(
      r.usuario_id,
      id,
      "A organização respondeu à sua reclamação.",
      "reclamacao-resposta:" + rid
    );
  });
}
export function encaminharReclamacaoEvento(
  ator: string,
  id: string,
  rid: string,
  agora = Date.now()
) {
  return tx(() => {
    evento(id, ator);
    const r = um(
      "SELECT * FROM eventos_reclamacoes WHERE id=? AND evento_id=? AND usuario_id=?",
      rid,
      id,
      ator
    );
    exigir(
      r && ["contestada", "moderacao"].includes(r.estado),
      "O encaminhamento requer uma reclamação contestada de sua autoria."
    );
    if (r.caso_suporte_id) return r.caso_suporte_id;
    const cid = criarSolicitacao(
      ator,
      {
        tipo: "denuncia",
        assunto: "Reclamação de evento contestada",
        descricao: r.descricao + "\n\nResposta da organização: " + r.resposta,
        evidencias: r.evidencias,
        motivo: "outro",
        objeto_tipo: "evento",
        objeto_id: id,
        chave_envio: "evento-reclamacao-" + rid,
      },
      agora
    );
    run(
      "UPDATE eventos_reclamacoes SET estado='moderacao',caso_suporte_id=? WHERE id=?",
      cid,
      rid
    );
    return cid;
  });
}
export function fichaEvento(ator: string, id: string, agora = Date.now()) {
  const e = evento(id, ator),
    c = config(id),
    dono = e.proprietario_id === ator,
    ac = um(
      "SELECT * FROM eventos_acompanhamentos WHERE evento_id=? AND usuario_id=?",
      id,
      ator
    ),
    i = um(
      "SELECT * FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=?",
      id,
      ator
    ),
    presenca = um(
      "SELECT * FROM eventos_presencas WHERE evento_id=? AND usuario_id=? AND revogada_em IS NULL",
      id,
      ator
    );
  const totais = {
    interessados: um(
      "SELECT COUNT(*) AS n FROM eventos_acompanhamentos WHERE evento_id=? AND interessado=1",
      id
    )!.n,
    inscritos: um(
      "SELECT COUNT(*) AS n FROM eventos_inscricoes WHERE evento_id=?",
      id
    )!.n,
    confirmados: um(
      "SELECT COUNT(*) AS n FROM eventos_inscricoes WHERE evento_id=? AND estado='confirmada'",
      id
    )!.n,
    presentes: um(
      "SELECT COUNT(*) AS n FROM eventos_presencas WHERE evento_id=? AND revogada_em IS NULL",
      id
    )!.n,
  };
  const publico = um(
    "SELECT COUNT(*) AS total,COALESCE(SUM(positiva),0) AS positivas FROM eventos_avaliacoes WHERE evento_id=? AND invalidada_em IS NULL",
    id
  );
  return {
    evento: e,
    config: c,
    dono,
    acompanhamento: ac,
    inscricao: i,
    presenca,
    totais,
    vagas: vagas(id, c),
    aberto:
      c.estado === "ativo" &&
      e.situacao !== "Encerrado" &&
      c.inicio_em &&
      agora < c.inicio_em,
    avaliavel:
      !!presenca && c.estado === "ativo" && c.fim_em && agora >= c.fim_em,
    avaliacao: um(
      "SELECT * FROM eventos_avaliacoes WHERE evento_id=? AND usuario_id=?",
      id,
      ator
    ),
    feedback: publico,
    reclamacoes: todos(
      "SELECT r.*,p.nome FROM eventos_reclamacoes r JOIN perfis p ON p.usuario_id=r.usuario_id WHERE r.evento_id=?" +
        (dono ? "" : " AND r.usuario_id=?") +
        " ORDER BY r.criada_em DESC",
      ...(dono ? [id] : [id, ator])
    ),
    inscricoes: dono
      ? todos(
          `SELECT i.*,p.nome,p.identificador,pr.registrada_em AS presenca_em FROM eventos_inscricoes i JOIN perfis p ON p.usuario_id=i.usuario_id LEFT JOIN eventos_presencas pr ON pr.evento_id=i.evento_id AND pr.usuario_id=i.usuario_id AND pr.revogada_em IS NULL WHERE i.evento_id=? ORDER BY i.criada_em,i.id`,
          id
        )
      : [],
    historico: dono
      ? todos(
          "SELECT * FROM eventos_historico WHERE evento_id=? ORDER BY criada_em DESC LIMIT 50",
          id
        )
      : [],
    edicoes: todos(
      "SELECT e.id,e.titulo,e.data_texto FROM eventos e LEFT JOIN eventos_configuracoes c ON c.evento_id=e.id WHERE (e.id=? OR c.serie_id=?) AND e.demonstracao=0 ORDER BY e.data_texto",
      c.serie_id ?? id,
      c.serie_id ?? id
    ).filter(x => objetoDisponivel(db(), "evento", x.id, ator)),
  };
}
export function pontosMapaEventos(ator: string) {
  usuario(ator);
  return todos(
    `SELECT e.id,e.titulo,e.local,c.latitude,c.longitude FROM eventos e JOIN eventos_configuracoes c ON c.evento_id=e.id WHERE e.demonstracao=0 AND c.estado='ativo' AND c.local_confirmado=1 AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL`
  ).filter(e => objetoDisponivel(db(), "evento", e.id, ator));
}
export function processarLembretesEventos(agora = Date.now()) {
  return tx(() => {
    let enviados = 0;
    for (const e of todos(
      `SELECT e.id,e.titulo,c.inicio_em,c.fim_em,c.fuso AS evento_fuso,a.* FROM eventos e JOIN eventos_configuracoes c ON c.evento_id=e.id JOIN eventos_acompanhamentos a ON a.evento_id=e.id JOIN usuarios u ON u.id=a.usuario_id WHERE c.estado='ativo' AND e.situacao NOT IN('Encerrado','Cancelado') AND e.demonstracao=0 AND u.demonstracao=0 AND u.email_confirmado_em IS NOT NULL AND c.inicio_em>? AND (a.interessado=1 OR a.salvo=1 OR EXISTS(SELECT 1 FROM eventos_inscricoes i WHERE i.evento_id=e.id AND i.usuario_id=a.usuario_id AND i.estado IN('pendente','confirmada')))`,
      agora
    )) {
      if (!objetoDisponivel(db(), "evento", e.id, e.usuario_id)) continue;
      const dataLocal = (n: number) => {
        const p = partes(n, e.fuso);
        return `${p.year}-${p.month}-${p.day}`;
      };
      for (const tipo of ["24h", "dia"]) {
        const ativo = tipo === "24h" ? e.lembrar24 : e.lembrar_dia;
        const devido =
          tipo === "24h"
            ? agora >= e.inicio_em - 86400000
            : dataLocal(agora) === dataLocal(e.inicio_em);
        if (!ativo || !devido) continue;
        const chave =
          "eventos:" +
          e.id +
          ":lembrete:" +
          tipo +
          ":" +
          e.inicio_em +
          ":" +
          e.usuario_id;
        const r = run(
          `INSERT INTO notificacoes(id,usuario_destino_id,tipo,titulo,mensagem,url,entidade_tipo,entidade_id,chave_origem) VALUES(?,?,'evento_lembrete',?,?,?,'evento',?,?) ON CONFLICT(chave_origem) DO NOTHING`,
          randomUUID(),
          e.usuario_id,
          tipo === "24h"
            ? "Um evento que você acompanha acontece em até 24 horas."
            : "Um evento que você acompanha acontece hoje.",
          e.titulo,
          "/events/" + e.id,
          e.id,
          chave
        );
        enviados += r.changes;
      }
    }
    return enviados;
  });
}
// A migração preserva declarações legadas, sem inferir presença ou confirmação a partir de interesse.
export function migrarParticipacoesEventos() {
  return tx(() => {
    if (um("SELECT 1 FROM eventos_migracoes WHERE chave='participacoes-v1'"))
      return;
    for (const r of todos("SELECT ie.* FROM interesses_eventos ie JOIN eventos e ON e.id=ie.evento_id JOIN usuarios u ON u.id=ie.usuario_id WHERE e.demonstracao=0 AND u.demonstracao=0")) {
      run(
        "INSERT INTO eventos_acompanhamentos(evento_id,usuario_id,interessado,criada_em) VALUES(?,?,?,?) ON CONFLICT DO NOTHING",
        r.evento_id,
        r.usuario_id,
        r.status === "interessado" ? 1 : 0,
        Date.parse(r.criado_em + "Z") || Date.now()
      );
      if (
        ["inscrito", "confirmado", "rejeitado", "cancelado"].includes(r.status)
      )
        run(
          "INSERT INTO eventos_inscricoes(id,evento_id,usuario_id,estado,criada_em,atualizada_em) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING",
          randomUUID(),
          r.evento_id,
          r.usuario_id,
          (
            {
              inscrito: "pendente",
              confirmado: "confirmada",
              rejeitado: "recusada",
              cancelado: "cancelada",
            } as Record<string, string>
          )[r.status],
          Date.parse(r.criado_em + "Z") || Date.now(),
          Date.parse(r.atualizado_em + "Z") || Date.now()
        );
    }
    run("INSERT INTO eventos_migracoes(chave) VALUES('participacoes-v1')");
  });
}
// Adaptações para chamadas legadas: interesse continua independente de inscrição.
export function interesseEventoLegado(eventoId: string, ator: string) {
  seguirEvento(ator, eventoId, { acao: "interesse", ativo: "sim" });
  return "interessado";
}
export function cancelarInteresseEventoLegado(eventoId: string, ator: string) {
  seguirEvento(ator, eventoId, { acao: "interesse", ativo: "nao" });
  return true;
}
export function statusInteresseEventoLegado(
  eventoId: string,
  ator: string,
  alvo: string,
  status: string
) {
  if(!['confirmado','rejeitado'].includes(status)) return false;
  const i = um(
    "SELECT * FROM eventos_inscricoes WHERE evento_id=? AND usuario_id=?",
    eventoId,
    alvo
  );
  if (!i) return false;
  decidirInscricaoEvento(ator, eventoId, alvo, {
    versao: i.versao,
    estado: status === "confirmado" ? "confirmada" : "recusada",
    resposta: "Decisão registrada pela organização.",
  });
  return true;
}
