import {
  situacaoContaModeracao,
  objetoDisponivel,
  objetoSobMedida,
} from "./politicasModeracao.js";
import { randomUUID } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import { profissoesCatalogo } from "./modeloPerfil.js";
import { exigirAdministrador } from "./administracao.js";
import {
  profissoesOportunidade,
  exigir,
  texto,
  validarChamada,
  validarTermos,
  ErroOportunidade,
} from "../validators/validarOportunidade.js";
// Linhas de consultas internas; nenhum objeto recebido do cliente é utilizado como SQL.
export type Linha = Record<string, any>;
const db = () => conexaoInternaCypher();
export const um = (sql: string, ...args: any[]) =>
  db()
    .prepare(sql)
    .get(...args) as Linha | undefined;
export const todos = (sql: string, ...args: any[]) =>
  db()
    .prepare(sql)
    .all(...args) as Linha[];
const run = (sql: string, ...args: any[]) =>
  db()
    .prepare(sql)
    .run(...args);
const transacao = <T>(fn: () => T) => db().transaction(fn).immediate();
export function repeticao(ator: string, chave: unknown, tipo: string) {
  if (!chave) return undefined;
  exigir(
    typeof chave === "string" && /^[a-zA-Z0-9-]{16,100}$/.test(chave),
    "Identificador de envio inválido."
  );
  return um(
    "SELECT resultado_id FROM operacoes_oportunidade WHERE autor_id=? AND chave=? AND tipo=?",
    ator,
    chave,
    tipo
  )?.resultado_id as string | undefined;
}
export function registrarOperacao(
  ator: string,
  chave: unknown,
  tipo: string,
  id: string
) {
  if (chave)
    run(
      "INSERT INTO operacoes_oportunidade(autor_id,chave,tipo,resultado_id) VALUES(?,?,?,?)",
      ator,
      chave,
      tipo,
      id
    );
}
export function conta(id: string) {
  exigir(
    !situacaoContaModeracao(conexaoInternaCypher(), id).restrita,
    "Conta com restrição ativa. Consulte o suporte para recorrer.",
    403
  );
  const u = um("SELECT * FROM usuarios WHERE id=?", id);
  exigir(u && !u.demonstracao, "Conta indisponível.", 403);
  exigir(
    !um(
      "SELECT 1 FROM restricoes_contas WHERE usuario_id=? AND (ate IS NULL OR datetime(ate)>datetime('now'))",
      id
    ),
    "Conta com restrição ativa.",
    403
  );
  exigir(
    u.email_confirmado_em ||
      (u.tipo_conta === "administrativo" &&
        um("SELECT 1 FROM administradores WHERE usuario_id=? AND ativo=1", id)),
    "Confirme seu e-mail para acessar Oportunidades.",
    403
  );
  return u;
}
export function profissoesAtivas(id: string) {
  return todos(
    "SELECT profissao_id FROM profissoes_usuario WHERE usuario_id=? AND estado='ativa'",
    id
  )
    .map(r => r.profissao_id)
    .filter(p => profissoesOportunidade.some(c => c.id === p));
}
export function profissional(id: string) {
  const u = titularProfissional(id);
  exigir(
    u.tipo_conta === "profissional" && profissoesAtivas(id).length,
    "É necessário um perfil profissional com profissão ativa.",
    403
  );
  return u;
}
// Retirar profissões restringe novos registros, sem retirar a gestão do acervo legítimo (RN-034).
export function titularProfissional(id: string) {
  const u = conta(id);
  exigir(
    u.tipo_conta === "profissional",
    "É necessário um perfil profissional.",
    403
  );
  return u;
}
export function semBloqueio(a: string, b: string) {
  exigir(
    !um(
      "SELECT 1 FROM bloqueios_usuarios WHERE (autor_id=? AND alvo_id=?) OR (autor_id=? AND alvo_id=?)",
      a,
      b,
      b,
      a
    ),
    "Contato indisponível entre estas contas.",
    403
  );
}
export function notificar(
  destino: string,
  titulo: string,
  url: string,
  chave: string,
  tipo = "oportunidade"
) {
  run(
    `INSERT INTO notificacoes(id,usuario_destino_id,tipo,titulo,mensagem,url,entidade_tipo,chave_origem) VALUES(?,?,?,?,'',?,'oportunidade',?) ON CONFLICT(chave_origem) DO NOTHING`,
    randomUUID(),
    destino,
    tipo,
    titulo,
    url,
    chave + ":" + destino
  );
}
export function historico(
  autor: string | null,
  acao: string,
  dados: unknown,
  oportunidade: string | null = null,
  pedido: string | null = null
) {
  run(
    "INSERT INTO historico_oportunidades(id,oportunidade_id,pedido_id,autor_id,acao,dados_json) VALUES(?,?,?,?,?,?)",
    randomUUID(),
    oportunidade,
    pedido,
    autor,
    acao,
    JSON.stringify(dados)
  );
}
export function expirar() {
  transacao(() => {
    for (const o of todos(
      "SELECT * FROM oportunidades_profissionais WHERE estado IN('aberta','pausada') AND prazo IS NOT NULL AND datetime(prazo)<=datetime('now')"
    )) {
      run(
        "UPDATE oportunidades_profissionais SET estado='expirada',revisao=revisao+1 WHERE id=?",
        o.id
      );
      historico(null, "expirada", {}, o.id);
      avisarEnvolvidos(
        o,
        "Prazo da oportunidade encerrado",
        `expirada:${o.id}`
      );
    }
  });
}
export function urlFicha(o: Linha, u: string) {
  return conta(u).tipo_conta === "administrativo"
    ? `/admin/oportunidades/${o.id}`
    : `/opportunities/${o.id}`;
}
function urlCandidatura(c: Linha, u: string) {
  return conta(u).tipo_conta === "administrativo"
    ? `/admin/oportunidades/candidaturas/${c.id}`
    : `/opportunities/applications/${c.id}`;
}
function avisarEnvolvidos(o: Linha, titulo: string, chave: string) {
  const ids = new Set([
    o.autor_id,
    ...todos(
      "SELECT candidato_id FROM candidaturas_oportunidade WHERE oportunidade_id=?",
      o.id
    ).map(c => c.candidato_id),
  ]);
  for (const id of ids)
    notificar(
      id,
      titulo,
      contaTipo(id) === "administrativo"
        ? `/admin/oportunidades/${o.id}`
        : `/opportunities/${o.id}`,
      chave
    );
}
const contaTipo = (id: string) =>
  um("SELECT tipo_conta FROM usuarios WHERE id=?", id)?.tipo_conta;
function historicoAcessivel(o: Linha, ator: string) {
  // O bloqueio impede novas abordagens; não apaga os registros privados das partes.
  return Boolean(
    o.estado !== "rascunho" &&
    !objetoSobMedida(db(), "oportunidade", o.id) &&
    !objetoSobMedida(db(), "perfil", o.autor_id) &&
    !situacaoContaModeracao(db(), o.autor_id).restrita &&
    um(
      "SELECT 1 FROM candidaturas_oportunidade WHERE oportunidade_id=? AND candidato_id=?",
      o.id,
      ator
    )
  );
}
function chamadaDisponivel(o: Linha, ator: string) {
  return (
    objetoDisponivel(db(), "oportunidade", o.id, ator) ||
    historicoAcessivel(o, ator)
  );
}
export function ficha(id: string, ator: string) {
  conta(ator);
  expirar();
  const o = um(
    `SELECT o.*,coalesce(p.nome,a.nome) AS autor_nome,CASE WHEN p.perfil_publico=1 THEN p.identificador ELSE NULL END AS identificador FROM oportunidades_profissionais o LEFT JOIN perfis p ON p.usuario_id=o.autor_id LEFT JOIN administradores a ON a.usuario_id=o.autor_id WHERE o.id=?`,
    id
  );
  exigir(o && chamadaDisponivel(o, ator), "Oportunidade não encontrada.", 404);
  exigir(
    o.estado !== "rascunho" || o.autor_id === ator,
    "Oportunidade não encontrada.",
    404
  );
  if (o.autor_id !== ator && contaTipo(ator) === "administrativo")
    throw new ErroOportunidade(
      "A gestão pertence ao responsável designado.",
      403
    );
  // Preserva acesso histórico às partes; uma restrição impede novas ações, não destrói acordos.
  if (
    o.autor_id !== ator &&
    !um(
      "SELECT 1 FROM candidaturas_oportunidade WHERE oportunidade_id=? AND candidato_id=?",
      id,
      ator
    )
  )
    conta(o.autor_id);
  o.funcoes = todos(
    `SELECT f.*,(SELECT COUNT(*) FROM acordos_oportunidade a WHERE a.funcao_id=f.id AND a.estado='confirmado') AS ocupadas FROM funcoes_oportunidade f WHERE oportunidade_id=?`,
    id
  ).map(f => ({
    ...f,
    nome:
      profissoesCatalogo.find(p => p.id === f.profissao_id)?.rotulo ??
      f.profissao_id,
    disponiveis: f.vagas - f.ocupadas,
  }));
  o.candidaturas =
    um(
      "SELECT COUNT(*) AS n FROM candidaturas_oportunidade WHERE oportunidade_id=?",
      id
    )?.n ?? 0;
  o.vagas = o.funcoes.reduce((s: number, f: Linha) => s + f.vagas, 0);
  o.ocupadas = o.funcoes.reduce((s: number, f: Linha) => s + f.ocupadas, 0);
  o.profissoes = profissoesAtivas(o.autor_id)
    .map(id => profissoesCatalogo.find(p => p.id === id)?.rotulo)
    .join(" · ");
  o.evento = o.evento_id
    ? um(
        "SELECT e.id,e.titulo FROM eventos e JOIN perfis p ON p.usuario_id=e.proprietario_id WHERE e.id=? AND p.perfil_publico=1 AND e.demonstracao=0",
        o.evento_id
      )
    : null;
  o.projeto = o.projeto_id
    ? um(
        `SELECT p.id,p.titulo FROM projetos_trabalho p JOIN perfis pf ON pf.usuario_id=p.autor_id
         WHERE p.id=? AND NOT EXISTS(SELECT 1 FROM detalhes_projetos d WHERE d.projeto_id=p.id AND d.retirado=1)
         AND (p.autor_id=? OR (p.publico=1 AND pf.perfil_publico=1
           AND NOT EXISTS(SELECT 1 FROM bloqueios_usuarios bl WHERE (bl.autor_id=p.autor_id AND bl.alvo_id=?) OR (bl.alvo_id=p.autor_id AND bl.autor_id=?))
           AND NOT EXISTS(SELECT 1 FROM restricoes_contas rc WHERE rc.usuario_id=p.autor_id AND (rc.ate IS NULL OR datetime(rc.ate)>datetime('now')))))`,
        o.projeto_id,
        ator,
        ator,
        ator
      )
    : null;
  if (o.evento && !objetoDisponivel(db(), "evento", o.evento.id, ator))
    o.evento = null;
  if (o.projeto && !objetoDisponivel(db(), "projeto", o.projeto.id, ator))
    o.projeto = null;
  return o;
}
function dono(o: Linha, ator: string) {
  exigir(
    o.autor_id === ator,
    "Você não pode administrar esta oportunidade.",
    403
  );
  if (o.pedido_id && contaTipo(ator) === "administrativo")
    exigirAdministrador(ator, "excecoes");
  else titularProfissional(ator);
}
function vinculos(d: ReturnType<typeof validarChamada>, ator: string) {
  if (d.evento_id)
    exigir(
      objetoDisponivel(db(), "evento", d.evento_id, ator) &&
        um(
          "SELECT id FROM eventos WHERE id=? AND proprietario_id=? AND demonstracao=0",
          d.evento_id,
          ator
        ),
      "Selecione um evento sob sua responsabilidade."
    );
  if (d.projeto_id)
    exigir(
      objetoDisponivel(db(), "projeto", d.projeto_id, ator) &&
        um(
          "SELECT id FROM projetos_trabalho WHERE id=? AND autor_id=? AND NOT EXISTS(SELECT 1 FROM detalhes_projetos d WHERE d.projeto_id=projetos_trabalho.id AND d.retirado=1)",
          d.projeto_id,
          ator
        ),
      "Selecione um projeto próprio."
    );
}
function inserir(
  d: ReturnType<typeof validarChamada>,
  ator: string,
  estado: string,
  pedido: string | null = null
) {
  const id = randomUUID();
  const { funcoes, ...campos } = d;
  run(
    `INSERT INTO oportunidades_profissionais(id,autor_id,${Object.keys(campos).join(",")},estado,pedido_id,publicada_em) VALUES(${Array(
      Object.keys(campos).length + 5
    )
      .fill("?")
      .join(",")})`,
    id,
    ator,
    ...Object.values(campos),
    estado,
    pedido,
    estado === "aberta" ? new Date().toISOString() : null
  );
  for (const f of funcoes)
    run(
      "INSERT INTO funcoes_oportunidade(id,oportunidade_id,profissao_id,vagas,responsabilidades,requisitos,desejaveis) VALUES(?,?,?,?,?,?,?)",
      randomUUID(),
      id,
      f.profissao_id,
      f.vagas,
      f.responsabilidades,
      f.requisitos,
      f.desejaveis
    );
  historico(ator, "criacao", { ...d, estado }, id, pedido);
  return id;
}
export function salvarChamada(
  ator: string,
  b: Record<string, unknown>,
  id?: string
) {
  const d = validarChamada(b);
  if (id) titularProfissional(ator);
  else profissional(ator);
  vinculos(d, ator);
  return transacao(() => {
    const anterior = id ? ficha(id, ator) : null;
    if (!anterior) {
      const existente = repeticao(ator, b.submissao, "chamada");
      if (existente) return existente;
      const novo = inserir(
        d,
        ator,
        b.acao === "rascunho" ? "rascunho" : "aberta"
      );
      registrarOperacao(ator, b.submissao, "chamada", novo);
      return novo;
    }
    dono(anterior, ator);
    exigir(
      !["cancelada", "encerrada"].includes(anterior.estado),
      "Esta chamada não aceita edição."
    );
    exigir(
      Number(b.revisao) === anterior.revisao,
      "A chamada mudou. Reabra a edição antes de salvar.",
      409
    );
    if (anterior.pedido_id)
      exigir(
        false,
        "Pedidos aprovados preservam as condições da decisão. Solicite nova análise."
      );
    const usadas = todos(
      "SELECT DISTINCT funcao_id FROM candidaturas_oportunidade WHERE oportunidade_id=?",
      id
    ).map(r => r.funcao_id);
    for (const f of anterior.funcoes) {
      const nova = d.funcoes.find(n => n.profissao_id === f.profissao_id);
      exigir(
        nova || !usadas.includes(f.id),
        "Não remova funções com candidaturas registradas."
      );
      if (nova)
        exigir(
          nova.vagas >= f.ocupadas,
          "As vagas não podem ficar abaixo dos acordos confirmados."
        );
    }
    const { funcoes, ...campos } = d;
    run(
      `UPDATE oportunidades_profissionais SET ${Object.keys(campos)
        .map(k => `${k}=?`)
        .join(",")},revisao=revisao+1 WHERE id=?`,
      ...Object.values(campos),
      id
    );
    for (const f of funcoes) {
      const atual = anterior.funcoes.find(
        (v: Linha) => v.profissao_id === f.profissao_id
      );
      if (atual)
        run(
          "UPDATE funcoes_oportunidade SET vagas=?,responsabilidades=?,requisitos=?,desejaveis=? WHERE id=?",
          f.vagas,
          f.responsabilidades,
          f.requisitos,
          f.desejaveis,
          atual.id
        );
      else
        run(
          "INSERT INTO funcoes_oportunidade(id,oportunidade_id,profissao_id,vagas,responsabilidades,requisitos,desejaveis) VALUES(?,?,?,?,?,?,?)",
          randomUUID(),
          id,
          f.profissao_id,
          f.vagas,
          f.responsabilidades,
          f.requisitos,
          f.desejaveis
        );
    }
    for (const f of anterior.funcoes)
      if (!funcoes.some(n => n.profissao_id === f.profissao_id))
        run("DELETE FROM funcoes_oportunidade WHERE id=?", f.id);
    historico(ator, "edicao", { antes: anterior, depois: d }, id);
    avisarEnvolvidos(
      anterior,
      "Condições da oportunidade atualizadas",
      `edicao:${id}:${anterior.revisao + 1}`
    );
    return id!;
  });
}
export function mudarEstado(ator: string, id: string, estado: string) {
  return transacao(() => {
    const o = ficha(id, ator);
    dono(o, ator);
    if (estado === o.estado) return;
    const permitidos: Record<string, string[]> = {
      rascunho: ["aberta", "cancelada"],
      aberta: ["pausada", "encerrada", "cancelada"],
      pausada: ["aberta", "encerrada", "cancelada"],
      expirada: ["aberta", "cancelada"],
      encerrada: ["aberta", "cancelada"],
      cancelada: [],
    };
    exigir(permitidos[o.estado]?.includes(estado), "Transição indisponível.");
    if (estado === "aberta") {
      exigir(
        !o.prazo || Date.parse(o.prazo) > Date.now(),
        "Atualize o prazo antes de reabrir."
      );
      exigir(o.vagas > o.ocupadas, "Todas as vagas estão ocupadas.");
    }
    run(
      "UPDATE oportunidades_profissionais SET estado=?,revisao=revisao+1,publicada_em=CASE WHEN ?='aberta' THEN coalesce(publicada_em,CURRENT_TIMESTAMP) ELSE publicada_em END WHERE id=?",
      estado,
      estado,
      id
    );
    historico(ator, "estado", { anterior: o.estado, estado }, id);
    avisarEnvolvidos(
      o,
      `Situação da oportunidade: ${estado}`,
      `estado:${id}:${o.revisao + 1}`
    );
  });
}
function elegivel(o: Linha, ator: string, funcao: Linha) {
  profissional(ator);
  conta(o.autor_id);
  semBloqueio(ator, o.autor_id);
  exigir(ator !== o.autor_id, "Você não pode se candidatar à própria chamada.");
  exigir(
    o.estado === "aberta" && (!o.prazo || Date.parse(o.prazo) > Date.now()),
    "Esta oportunidade não está recebendo candidaturas."
  );
  exigir(
    funcao && profissoesAtivas(ator).includes(funcao.profissao_id),
    "A função exige uma profissão ativa compatível."
  );
  exigir(funcao.disponiveis > 0, "Não há vaga disponível para esta função.");
}
function contatoNegociacao(o: Linha, candidato: string) {
  exigir(
    objetoDisponivel(db(), "oportunidade", o.id, candidato),
    "A chamada não está disponível para novas candidaturas ou acordos.",
    403
  );
  exigir(
    !situacaoContaModeracao(db(), candidato).contatoRestrito &&
      !situacaoContaModeracao(db(), o.autor_id).contatoRestrito,
    "Contato restrito por medida administrativa.",
    403
  );
}
export function candidatar(
  ator: string,
  id: string,
  b: Record<string, unknown>
) {
  return transacao(() => {
    const o = ficha(id, ator);
    contatoNegociacao(o, ator);
    const f = o.funcoes.find((f: Linha) => f.id === b.funcao_id);
    elegivel(o, ator, f);
    exigir(
      b.requisitos === "sim",
      "Confirme que atende aos requisitos divulgados."
    );
    const anterior = um(
      "SELECT id FROM candidaturas_oportunidade WHERE oportunidade_id=? AND candidato_id=? AND estado NOT IN('retirada','recusada')",
      id,
      ator
    );
    if (anterior) return anterior.id as string;
    const cid = randomUUID();
    run(
      "INSERT INTO candidaturas_oportunidade(id,oportunidade_id,funcao_id,candidato_id,apresentacao,estado) VALUES(?,?,?,?,?,'enviada')",
      cid,
      id,
      f.id,
      ator,
      texto(b.apresentacao, 2000)
    );
    historico(
      ator,
      "candidatura",
      { candidatura: cid, funcao: f.id, requisitosConfirmados: true },
      id
    );
    notificar(
      o.autor_id,
      "Nova candidatura recebida",
      urlFicha(o, o.autor_id),
      `candidatura:${cid}`
    );
    return cid;
  });
}
export function candidatura(id: string, ator: string) {
  conta(ator);
  const c = um(
    "SELECT c.*,p.nome,p.identificador,p.perfil_publico FROM candidaturas_oportunidade c JOIN perfis p ON p.usuario_id=c.candidato_id WHERE c.id=?",
    id
  );
  exigir(c, "Candidatura não encontrada.", 404);
  const o = ficha(c.oportunidade_id, ator);
  exigir(
    c.candidato_id === ator || o.autor_id === ator,
    "Esta candidatura é privada.",
    403
  );
  c.oportunidade = o;
  c.funcao = o.funcoes.find((f: Linha) => f.id === c.funcao_id);
  c.propostas = todos(
    "SELECT * FROM propostas_oportunidade WHERE candidatura_id=? ORDER BY versao DESC",
    id
  ).map(p => ({
    ...p,
    termos: JSON.parse(p.termos_json),
    aceites: todos(
      "SELECT usuario_id,criado_em FROM aceites_oportunidade WHERE proposta_id=?",
      p.id
    ),
  }));
  c.acordo = um(
    "SELECT * FROM acordos_oportunidade WHERE candidatura_id=?",
    id
  );
  c.conversa = um("SELECT * FROM conversas WHERE candidatura_id=?", id);
  return c;
}
export function decidirCandidatura(ator: string, id: string, estado: string) {
  return transacao(() => {
    const c = candidatura(id, ator),
      o = c.oportunidade;
    if (estado === c.estado) return;
    exigir(
      !["retirada", "recusada", "acordo"].includes(c.estado),
      "A candidatura já foi concluída."
    );
    if (estado === "retirada")
      exigir(c.candidato_id === ator, "Apenas o candidato pode retirar.", 403);
    else {
      dono(o, ator);
      exigir(
        ["analise", "selecionada", "recusada"].includes(estado),
        "Decisão inválida."
      );
      if (estado === "selecionada") {
        contatoNegociacao(o, c.candidato_id);
        elegivel(o, c.candidato_id, c.funcao);
      }
    }
    run("UPDATE candidaturas_oportunidade SET estado=? WHERE id=?", estado, id);
    if (["retirada", "recusada"].includes(estado))
      run(
        "UPDATE propostas_oportunidade SET estado='recusada' WHERE candidatura_id=? AND estado='enviada'",
        id
      );
    if (estado === "selecionada" && !c.conversa)
      run(
        "INSERT INTO conversas(id,participante_a,participante_b,candidatura_id,contexto) VALUES(?,?,?,?,?)",
        randomUUID(),
        o.autor_id,
        c.candidato_id,
        id,
        o.titulo
      );
    historico(ator, "decisao_candidatura", { id, estado }, o.id);
    const alvo = ator === c.candidato_id ? o.autor_id : c.candidato_id;
    notificar(
      alvo,
      `Candidatura: ${estado}`,
      urlCandidatura(c, alvo),
      `decisao:${id}:${estado}`
    );
  });
}
export function propor(ator: string, id: string, b: Record<string, unknown>) {
  const termos = validarTermos(b);
  return transacao(() => {
    const c = candidatura(id, ator);
    contatoNegociacao(c.oportunidade, c.candidato_id);
    exigir(
      c.estado === "selecionada",
      "Selecione a candidatura antes de negociar."
    );
    elegivel(c.oportunidade, c.candidato_id, c.funcao);
    dono(c.oportunidade, c.oportunidade.autor_id);
    const ultima = c.propostas[0];
    exigir(
      Number(b.versao_base || 0) === (ultima?.versao ?? 0),
      "Há uma versão mais recente. Recarregue a negociação.",
      409
    );
    const pid = randomUUID(),
      versao = (ultima?.versao ?? 0) + 1;
    run(
      "UPDATE propostas_oportunidade SET estado='substituida' WHERE candidatura_id=? AND estado='enviada'",
      id
    );
    run(
      "INSERT INTO propostas_oportunidade(id,candidatura_id,versao,autor_id,termos_json,estado) VALUES(?,?,?,?,?,'enviada')",
      pid,
      id,
      versao,
      ator,
      JSON.stringify({ ...termos, funcao: c.funcao.nome })
    );
    historico(ator, "proposta", { id: pid, versao }, c.oportunidade.id);
    const outro =
      ator === c.candidato_id ? c.oportunidade.autor_id : c.candidato_id;
    notificar(
      outro,
      `Proposta recebida · versão ${versao}`,
      urlCandidatura(c, outro),
      `proposta:${pid}`
    );
    return pid;
  });
}
export function responderProposta(
  ator: string,
  id: string,
  pid: string,
  acao: string
) {
  return transacao(() => {
    const c = candidatura(id, ator);
    const p = c.propostas[0];
    exigir(p && p.id === pid, "Esta versão foi substituída.", 409);
    if (p.estado === "confirmada" && acao === "aceitar") return c.acordo?.id;
    exigir(
      c.estado === "selecionada" && p.estado === "enviada",
      "Esta proposta não está em negociação."
    );
    if (acao === "recusar") {
      run(
        "UPDATE propostas_oportunidade SET estado='recusada' WHERE id=?",
        pid
      );
      run(
        "UPDATE candidaturas_oportunidade SET estado='recusada' WHERE id=?",
        id
      );
      historico(ator, "proposta_recusada", { pid }, c.oportunidade.id);
      const outro =
        ator === c.candidato_id ? c.oportunidade.autor_id : c.candidato_id;
      notificar(
        outro,
        "Proposta recusada",
        urlCandidatura(c, outro),
        `recusa:${pid}`
      );
      return;
    }
    exigir(acao === "aceitar", "Resposta inválida.");
    contatoNegociacao(c.oportunidade, c.candidato_id);
    elegivel(c.oportunidade, c.candidato_id, c.funcao);
    dono(c.oportunidade, c.oportunidade.autor_id);
    run(
      "INSERT INTO aceites_oportunidade(proposta_id,usuario_id) VALUES(?,?) ON CONFLICT DO NOTHING",
      pid,
      ator
    );
    const outro =
      ator === c.candidato_id ? c.oportunidade.autor_id : c.candidato_id;
    notificar(
      outro,
      "Aceite registrado na proposta",
      urlCandidatura(c, outro),
      `aceite:${pid}:${ator}`
    );
    if (
      um(
        "SELECT COUNT(*) AS total FROM aceites_oportunidade WHERE proposta_id=?",
        pid
      )?.total === 2
    ) {
      const aid = randomUUID();
      run(
        "INSERT INTO acordos_oportunidade(id,candidatura_id,proposta_id,funcao_id) VALUES(?,?,?,?)",
        aid,
        id,
        pid,
        c.funcao_id
      );
      run(
        "UPDATE propostas_oportunidade SET estado='confirmada' WHERE id=?",
        pid
      );
      run(
        "UPDATE candidaturas_oportunidade SET estado='acordo' WHERE id=?",
        id
      );
      if (c.oportunidade.ocupadas + 1 === c.oportunidade.vagas) {
        avisarEnvolvidos(
          c.oportunidade,
          "Todas as vagas da oportunidade foram preenchidas",
          `lotacao:${aid}`
        );
        historico(
          ator,
          "encerramento_automatico",
          { acordo: aid },
          c.oportunidade.id
        );
        run(
          "UPDATE oportunidades_profissionais SET estado='encerrada',revisao=revisao+1 WHERE id=?",
          c.oportunidade.id
        );
      }
      historico(
        ator,
        "acordo_confirmado",
        { id: aid, proposta: pid },
        c.oportunidade.id
      );
      for (const u of [c.candidato_id, c.oportunidade.autor_id])
        notificar(
          u,
          "Acordo confirmado pelas duas partes",
          urlCandidatura(c, u),
          `acordo:${aid}`
        );
      return aid;
    }
  });
}
export function desistirAcordo(ator: string, id: string, motivo: unknown) {
  return transacao(() => {
    const c = candidatura(id, ator);
    exigir(c.acordo?.estado === "confirmado", "Acordo indisponível.");
    const m = texto(motivo, 2000);
    exigir(m, "Informe o motivo do encerramento consensual.");
    run(
      "INSERT INTO desistencias_acordo(acordo_id,usuario_id,motivo) VALUES(?,?,?) ON CONFLICT DO NOTHING",
      c.acordo.id,
      ator,
      m
    );
    if (
      um(
        "SELECT COUNT(*) AS n FROM desistencias_acordo WHERE acordo_id=?",
        c.acordo.id
      )?.n === 2
    ) {
      run(
        "UPDATE acordos_oportunidade SET estado='desfeito' WHERE id=?",
        c.acordo.id
      );
      historico(
        ator,
        "desistencia_bilateral",
        { acordo: c.acordo.id },
        c.oportunidade.id
      );
    }
    const outro =
      ator === c.candidato_id ? c.oportunidade.autor_id : c.candidato_id;
    notificar(
      outro,
      "Pedido de encerramento consensual do acordo",
      urlCandidatura(c, outro),
      `desistencia:${c.acordo.id}:${ator}`
    );
  });
}
export function listar(
  ator: string,
  f: Record<string, string>,
  contexto = "explorar"
) {
  conta(ator);
  expirar();
  const where: string[] = ["o.estado<>'rascunho'"],
    args: any[] = [];
  if (contexto === "minhas") {
    titularProfissional(ator);
    where[0] = "o.autor_id=?";
    args.push(ator);
  } else if (contexto === "candidaturas") {
    titularProfissional(ator);
    where[0] =
      "EXISTS(SELECT 1 FROM candidaturas_oportunidade c WHERE c.oportunidade_id=o.id AND c.candidato_id=?)";
    args.push(ator);
  } else {
    where.push(
      "o.estado='aberta'",
      "NOT EXISTS(SELECT 1 FROM restricoes_contas r WHERE r.usuario_id=o.autor_id AND (r.ate IS NULL OR datetime(r.ate)>datetime('now')))"
    );
  }
  if (contexto !== "candidaturas") {
    where.push(
      "NOT EXISTS(SELECT 1 FROM bloqueios_usuarios b WHERE (b.autor_id=? AND b.alvo_id=o.autor_id) OR (b.alvo_id=? AND b.autor_id=o.autor_id))"
    );
    args.push(ator, ator);
  }
  for (const key of ["tipo", "modalidade", "remuneracao", "unidade"])
    if (f[key]) {
      where.push(`o.${key}=?`);
      args.push(f[key]);
    }
  if (f.estado && contexto !== "explorar") {
    where.push("o.estado=?");
    args.push(f.estado);
  }
  if (f.q) {
    where.push("(o.titulo LIKE ? OR o.descricao LIKE ?)");
    args.push("%" + f.q + "%", "%" + f.q + "%");
  }
  if (f.localizacao) {
    where.push("o.localizacao LIKE ?");
    args.push("%" + f.localizacao + "%");
  }
  let profissoes = f.profissao
    ? [f.profissao]
    : f.area
      ? profissoesCatalogo.filter(p => p.grupoId === f.area).map(p => p.id)
      : [];
  if (profissoes.length) {
    where.push(
      `EXISTS(SELECT 1 FROM funcoes_oportunidade fn WHERE fn.oportunidade_id=o.id AND fn.profissao_id IN(${profissoes.map(() => "?").join(",")}))`
    );
    args.push(...profissoes);
  }
  for (const [key, expr] of [
    ["desde", "date(o.publicada_em)>=date(?)"],
    ["ate", "date(o.publicada_em)<=date(?)"],
    ["prazo", "date(o.prazo)<=date(?)"],
  ] as const)
    if (/^\d{4}-\d{2}-\d{2}$/.test(f[key] ?? "")) {
      where.push(expr);
      args.push(f[key]);
    }
  for (const [key, op] of [
    ["min", ">="],
    ["max", "<="],
  ] as const)
    if (f[key] && f.unidade && Number.isFinite(Number(f[key]))) {
      where.push(`o.remuneracao='remunerada' AND o.valor_centavos${op}?`);
      args.push(Math.round(Number(f[key]) * 100));
    }
  if (f.vagas && Number.isInteger(Number(f.vagas))) {
    where.push(
      "(SELECT SUM(vagas) FROM funcoes_oportunidade WHERE oportunidade_id=o.id)-(SELECT COUNT(*) FROM acordos_oportunidade a JOIN candidaturas_oportunidade c ON c.id=a.candidatura_id WHERE c.oportunidade_id=o.id AND a.estado='confirmado')>=?"
    );
    args.push(Number(f.vagas));
  }
  const sql = where.join(" AND ");
  const ordem =
    f.ordem === "antigas"
      ? "o.publicada_em ASC"
      : f.ordem === "prazo"
        ? "o.prazo IS NULL,datetime(o.prazo) ASC"
        : "o.criada_em DESC";
  const permitidos = todos(
    `SELECT o.id,o.autor_id,o.estado FROM oportunidades_profissionais o WHERE ${sql} ORDER BY ${ordem},o.id`,
    ...args
  ).filter(r =>
    contexto === "candidaturas"
      ? chamadaDisponivel(r, ator)
      : objetoDisponivel(db(), "oportunidade", r.id, ator)
  );
  const total = permitidos.length,
    paginas = Math.max(1, Math.ceil(total / 12)),
    pagina = Math.max(1, Math.min(paginas, Math.floor(Number(f.pagina) || 1)));
  return {
    itens: permitidos
      .slice((pagina - 1) * 12, pagina * 12)
      .map(r => ficha(r.id, ator)),
    total,
    pagina,
    paginas,
  };
}
