import { guiasIniciais } from "./centralConteudoInicial.js";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import { conta, um, todos, type Linha } from "./oportunidades.js";
import { exigirAdministrador } from "./administracao.js";
import { profissoesCatalogo } from "./modeloPerfil.js";
export class ErroCentral extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
function exigir(ok: unknown, msg: string, status = 400): asserts ok {
  if (!ok) throw new ErroCentral(msg, status);
}
const db = () => conexaoInternaCypher();
const run = (sql: string, ...args: any[]) =>
  db()
    .prepare(sql)
    .run(...args);
const transacao = <T>(fn: () => T) => db().transaction(fn).immediate();
export const categoriasCentral = [
  { id: "primeiros-passos", nome: "Primeiros passos", icone: "sparkles" },
  { id: "publicacoes", nome: "Trabalhos e portfólio", icone: "brush" },
  { id: "profissoes", nome: "Guias por profissão", icone: "users" },
  { id: "colaboracoes", nome: "Conexões e colaborações", icone: "headphones" },
  {
    id: "eventos-oportunidades",
    nome: "Eventos e oportunidades",
    icone: "calendarDays",
  },
  { id: "seguranca", nome: "Privacidade e segurança", icone: "shieldCheck" },
];
export const motivosCentral = [
  { id: "incompleta", nome: "Informação incompleta" },
  { id: "confusa", nome: "Explicação confusa" },
  { id: "dificil", nome: "Instruções difíceis de acompanhar" },
  { id: "desatualizada", nome: "Informação desatualizada" },
  { id: "nao-respondeu", nome: "Não respondeu à dúvida" },
  { id: "outro", nome: "Outro motivo" },
];
export type ArtigoCentral = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  intencao: string;
  profissoes: string[];
  passos: { titulo: string; conteudo: string; dica: string }[];
  exemplo: string;
  acao_url: string;
  acao_label: string;
  minutos: number;
  publicado_em: number | null;
  atualizado_em: number;
};
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const texto = (v: unknown, n: number, nome: string, min = 0) => {
  exigir(v === undefined || typeof v === "string", `Confira ${nome}.`);
  const s = String(v ?? "").trim();
  exigir(
    s.length >= min && s.length <= n,
    `${nome}: use de ${min} a ${n} caracteres.`
  );
  return s;
};
export function acessoEditorial(ator: string) {
  conta(ator);
  try {
    exigirAdministrador(ator, "editorial");
  } catch {
    throw new ErroCentral("Acesso editorial necessário.", 403);
  }
}
function leitor(id: string) {
  const u = conta(id);
  exigir(
    u.tipo_conta !== "administrativo",
    "Use o painel editorial para consultar conteúdo interno.",
    403
  );
}
function validarConteudo(b: Record<string, unknown>) {
  const titulo = texto(b.titulo, 120, "Título", 3),
    resumo = texto(b.resumo, 280, "Resumo", 15),
    categoria = texto(b.categoria, 40, "Categoria"),
    intencao = texto(b.intencao, 20, "Intenção");
  exigir(
    categoriasCentral.some(c => c.id === categoria),
    "Escolha uma categoria."
  );
  exigir(
    ["comecar", "publicar", "conectar", "resolver"].includes(intencao),
    "Escolha uma intenção."
  );
  const profissoes = [
    ...new Set(
      (Array.isArray(b.profissoes)
        ? b.profissoes
        : b.profissoes
          ? [b.profissoes]
          : []
      ).map(String)
    ),
  ];
  exigir(
    profissoes.every(
      id => id !== "podcaster" && profissoesCatalogo.some(p => p.id === id)
    ),
    "Selecione profissões oficiais."
  );
  let raw: unknown;
  try {
    raw = JSON.parse(String(b.passos ?? "[]"));
  } catch {
    throw new ErroCentral("Confira os passos do guia.");
  }
  exigir(
    Array.isArray(raw) && raw.length >= 1 && raw.length <= 12,
    "O guia deve ter de 1 a 12 passos."
  );
  const passos = raw.map(p => {
    exigir(p && typeof p === "object", "Passo inválido.");
    return {
      titulo: texto(p.titulo, 100, "Título do passo", 3),
      conteudo: texto(p.conteudo, 1600, "Conteúdo do passo", 10),
      dica: texto(p.dica, 300, "Dica"),
    };
  });
  const exemplo = texto(b.exemplo, 1200, "Exemplo"),
    acao_url = texto(b.acao_url, 180, "Destino da ação"),
    acao_label = texto(b.acao_label, 60, "Texto da ação");
  const destinos = [
    "/profile",
    "/espaco-de-trabalho",
    "/portfolio/edit",
    "/colaboracoes",
    "/beats",
    "/events",
    "/opportunities",
    "/work-projects/new",
    "/settings",
    "/suporte",
    "/search",
    "/works",
    "/profile/profissionalizar",
  ];
  exigir(
    !acao_url || destinos.includes(acao_url),
    "Escolha um destino interno disponível."
  );
  exigir(!acao_url || acao_label.length >= 3, "Dê um nome à ação prática.");
  const palavras = [
    titulo,
    resumo,
    ...passos.flatMap(p => [p.titulo, p.conteudo, p.dica]),
    exemplo,
  ]
    .join(" ")
    .split(/\s+/).length;
  return {
    titulo,
    resumo,
    categoria,
    intencao,
    profissoes,
    passos,
    exemplo,
    acao_url,
    acao_label,
    minutos: Math.max(1, Math.ceil(palavras / 180)),
  };
}
function registro(id: string) {
  const a = um("SELECT * FROM central_artigos WHERE id=?", id);
  exigir(a, "Artigo indisponível.", 404);
  return a;
}
function editorial(a: Linha) {
  return {
    id: a.id,
    slug: a.slug,
    estado: a.estado,
    versao: a.versao,
    rascunho: {
      ...JSON.parse(a.rascunho_json),
      id: a.id,
      slug: a.slug,
      atualizado_em: a.atualizado_em,
      publicado_em: a.publicado_em,
    },
    publicado: a.publicado_json ? JSON.parse(a.publicado_json) : null,
    autor:
      um("SELECT nome FROM administradores WHERE usuario_id=?", a.autor_id)
        ?.nome ?? "Equipe editorial",
    atualizado_em: a.atualizado_em,
  };
}
function historico(
  ator: string,
  a: Linha,
  acao: string,
  motivo: string,
  agora: number
) {
  run(
    "INSERT INTO central_revisoes(id,artigo_id,autor_id,acao,motivo,conteudo_json,criado_em) VALUES(?,?,?,?,?,?,?)",
    randomUUID(),
    a.id,
    ator,
    acao,
    motivo,
    a.rascunho_json,
    agora
  );
  run(
    "INSERT INTO auditoria_administrativa(id,autor_id,acao,alvo_id,detalhe) VALUES(?,?,?,?,?)",
    randomUUID(),
    ator,
    "central_" + acao,
    a.autor_id,
    JSON.stringify({ artigo: a.id, motivo, versao: a.versao })
  );
}
export function salvarArtigo(
  ator: string,
  b: Record<string, unknown>,
  id?: string,
  agora = Date.now()
) {
  acessoEditorial(ator);
  const conteudo = validarConteudo(b);
  return transacao(() => {
    let a: Linha;
    if (id) {
      a = registro(id);
      exigir(
        Number(b.versao) === a.versao,
        "O artigo mudou. Atualize o editor antes de salvar.",
        409
      );
      exigir(a.estado !== "arquivado", "Reabra o artigo antes de editar.", 409);
      run(
        "UPDATE central_artigos SET rascunho_json=?,estado='rascunho',versao=versao+1,atualizado_em=? WHERE id=?",
        JSON.stringify(conteudo),
        agora,
        id
      );
      a = registro(id);
    } else {
      const aid = randomUUID(),
        slug =
          normalizar(conteudo.titulo)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 80) +
          "-" +
          aid.slice(0, 8);
      run(
        "INSERT INTO central_artigos(id,slug,autor_id,rascunho_json,criada_em,atualizado_em) VALUES(?,?,?,?,?,?)",
        aid,
        slug,
        ator,
        JSON.stringify(conteudo),
        agora,
        agora
      );
      a = registro(aid);
    }
    historico(
      ator,
      a,
      id ? "editado" : "criado",
      id
        ? "Rascunho atualizado; versão pública preservada."
        : "Novo guia editorial.",
      agora
    );
    return a.id as string;
  });
}
export function transicionarArtigo(
  ator: string,
  id: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  acessoEditorial(ator);
  return transacao(() => {
    const a = registro(id),
      acao = texto(b.acao, 20, "Ação"),
      motivo = texto(b.motivo, 600, "Justificativa", 10);
    exigir(
      Number(b.versao) === a.versao,
      "Este artigo foi alterado. Confira a versão atual.",
      409
    );
    if (acao === "revisar") {
      exigir(
        a.estado === "rascunho",
        "Encaminhe um rascunho para revisão.",
        409
      );
      run(
        "UPDATE central_artigos SET estado='em_revisao',versao=versao+1 WHERE id=?",
        id
      );
    } else if (acao === "publicar") {
      exigir(
        a.estado === "em_revisao",
        "O guia precisa passar pela etapa de revisão.",
        409
      );
      const payload = {
        ...JSON.parse(a.rascunho_json),
        id: a.id,
        slug: a.slug,
        publicado_em: a.publicado_em ?? agora,
        atualizado_em: agora,
      };
      run(
        "UPDATE central_artigos SET publicado_json=?,estado='publicado',publicado_em=coalesce(publicado_em,?),atualizado_em=?,versao=versao+1 WHERE id=?",
        JSON.stringify(payload),
        agora,
        agora,
        id
      );
    } else if (acao === "arquivar") {
      exigir(a.estado !== "arquivado", "O guia já está arquivado.", 409);
      run(
        "UPDATE central_artigos SET estado='arquivado',versao=versao+1 WHERE id=?",
        id
      );
    } else if (acao === "reabrir") {
      exigir(a.estado === "arquivado", "Este guia não está arquivado.", 409);
      run(
        "UPDATE central_artigos SET estado='rascunho',publicado_json=NULL,versao=versao+1 WHERE id=?",
        id
      );
    } else throw new ErroCentral("Ação editorial inválida.");
    historico(ator, registro(id), acao, motivo, agora);
  });
}
export function artigosEditoriais(ator: string) {
  acessoEditorial(ator);
  return todos(
    "SELECT * FROM central_artigos ORDER BY atualizado_em DESC,id"
  ).map(editorial);
}
export function artigoEditorial(ator: string, id: string) {
  acessoEditorial(ator);
  return editorial(registro(id));
}
export function artigosPublicados() {
  return todos(
    "SELECT publicado_json FROM central_artigos WHERE publicado_json IS NOT NULL AND estado<>'arquivado' ORDER BY json_extract(publicado_json,'$.atualizado_em') DESC,id"
  ).map(a => JSON.parse(a.publicado_json) as ArtigoCentral);
}
export function preferenciaCentral(usuario: string, registrar: boolean) {
  leitor(usuario);
  run(
    "INSERT INTO central_preferencias(usuario_id,pesquisas) VALUES(?,?) ON CONFLICT(usuario_id) DO UPDATE SET pesquisas=excluded.pesquisas",
    usuario,
    Number(registrar)
  );
}
function limparRetencao(agora: number) {
  const limite = new Date(agora - 90 * 86400000).toISOString().slice(0, 10);
  run("DELETE FROM central_visitas WHERE dia<?", limite);
  run("DELETE FROM central_lacunas WHERE dia<?", limite);
  run("DELETE FROM central_buscas_dedupe WHERE dia<?", limite);
  run(
    "DELETE FROM central_feedback_eventos WHERE criado_em<?",
    agora - 90 * 86400000
  );
}
export function pesquisarCentral(
  usuario: string,
  qb: Record<string, unknown>,
  agora = Date.now()
) {
  leitor(usuario);
  const q = typeof qb.q === "string" ? qb.q.trim().slice(0, 120) : "",
    categoria = categoriasCentral.some(c => c.id === qb.categoria)
      ? String(qb.categoria)
      : "",
    intencao = ["comecar", "publicar", "conectar", "resolver"].includes(
      String(qb.intencao)
    )
      ? String(qb.intencao)
      : "",
    profissao = profissoesCatalogo.some(
      p => p.id === qb.profissao && p.id !== "podcaster"
    )
      ? String(qb.profissao)
      : "";
  const publicados = artigosPublicados(),
    termos = normalizar(q).split(/\s+/).filter(Boolean);
  const artigos = publicados
    .map(a => {
      const titulo = normalizar(a.titulo),
        resumo = normalizar(a.resumo),
        conteudo = normalizar(
          a.passos
            .map(p => p.titulo + " " + p.conteudo + " " + p.dica)
            .join(" ") +
            " " +
            a.exemplo +
            " " +
            a.profissoes
              .map(
                id => profissoesCatalogo.find(p => p.id === id)?.rotulo ?? ""
              )
              .join(" ")
        );
      return {
        a,
        score: termos.reduce(
          (n, t) =>
            n +
            (titulo.includes(t)
              ? 8
              : resumo.includes(t)
                ? 3
                : conteudo.includes(t)
                  ? 1
                  : 0),
          0
        ),
        combina: termos.every(t =>
          (titulo + " " + resumo + " " + conteudo).includes(t)
        ),
      };
    })
    .filter(
      r =>
        r.combina &&
        (!categoria || r.a.categoria === categoria) &&
        (!intencao || r.a.intencao === intencao) &&
        (!profissao ||
          !r.a.profissoes.length ||
          r.a.profissoes.includes(profissao))
    )
    .sort((a, b) => b.score - a.score || b.a.atualizado_em - a.a.atualizado_em)
    .map(r => r.a);
  const registrarPesquisas = Boolean(
    um("SELECT pesquisas FROM central_preferencias WHERE usuario_id=?", usuario)
      ?.pesquisas
  );
  if (q && artigos.length === 0 && registrarPesquisas) {
    transacao(() => {
      // Não guardar e-mail, @, telefones, URLs ou números digitados em consultas educativas.
      const termo = normalizar(q)
        .replace(
          /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b|https?:\/\/\S+|www\.\S+|\S+@\S+|@\S+|\d+/g,
          " "
        )
        .replace(/[^a-z\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (termo.length < 3) return;
      run(
        "INSERT INTO central_parametros(chave,valor) VALUES('hash_buscas',?) ON CONFLICT(chave) DO NOTHING",
        randomBytes(32).toString("hex")
      );
      const dia = new Date(agora).toISOString().slice(0, 10),
        secret = um(
          "SELECT valor FROM central_parametros WHERE chave='hash_buscas'"
        )!.valor;
      const chave = createHmac("sha256", secret)
        .update(usuario + "|" + dia + "|" + categoria + "|" + termo)
        .digest("hex");
      const novo = run(
        "INSERT INTO central_buscas_dedupe(chave,dia) VALUES(?,?) ON CONFLICT DO NOTHING",
        chave,
        dia
      );
      if (novo.changes)
        run(
          "INSERT INTO central_lacunas(termo,categoria,dia) VALUES(?,?,?) ON CONFLICT(termo,categoria,dia) DO UPDATE SET total=total+1",
          termo,
          categoria,
          dia
        );
      limparRetencao(agora);
    });
  }
  return {
    artigos,
    recentes: publicados.slice(0, 5),
    q,
    categoria,
    intencao,
    profissao,
    registrarPesquisas,
    quantidade: artigos.length,
  };
}
export function lerArtigo(
  usuario: string,
  slug: string,
  registrar = true,
  agora = Date.now()
): ArtigoCentral {
  leitor(usuario);
  const a = um(
    "SELECT id,publicado_json FROM central_artigos WHERE slug=? AND publicado_json IS NOT NULL AND estado<>'arquivado'",
    slug
  );
  exigir(a, "Guia indisponível.", 404);
  if (registrar)
    transacao(() => {
      const dia = new Date(agora).toISOString().slice(0, 10),
        v = um(
          "SELECT ultimo_em FROM central_visitas WHERE artigo_id=? AND usuario_id=? ORDER BY ultimo_em DESC LIMIT 1",
          a.id,
          usuario
        );
      if (!v || agora - v.ultimo_em >= 30 * 60000)
        run(
          "INSERT INTO central_visitas(artigo_id,usuario_id,dia,ultimo_em) VALUES(?,?,?,?) ON CONFLICT(artigo_id,usuario_id,dia) DO UPDATE SET acessos=acessos+1,ultimo_em=excluded.ultimo_em",
          a.id,
          usuario,
          dia,
          agora
        );
      limparRetencao(agora);
    });
  return JSON.parse(a.publicado_json);
}
export function feedbackDoLeitor(usuario: string, artigo: string) {
  leitor(usuario);
  const f = um(
    "SELECT util,motivo,comentario FROM central_feedback WHERE artigo_id=? AND usuario_id=?",
    artigo,
    usuario
  );
  return f ?? null;
}
export function feedbackArtigo(
  usuario: string,
  slug: string,
  b: Record<string, unknown>,
  agora = Date.now()
) {
  const a = lerArtigo(usuario, slug, false);
  exigir(b.util === "sim" || b.util === "nao", "Escolha Útil ou Não útil.");
  const util = b.util === "sim" ? 1 : 0,
    motivo = util ? "" : texto(b.motivo, 40, "Motivo"),
    comentario = util
      ? ""
      : texto(b.comentario, 600, "Comentário", motivo === "outro" ? 10 : 0);
  exigir(
    util || motivosCentral.some(m => m.id === motivo),
    "Escolha o motivo do retorno negativo."
  );
  transacao(() => {
    const anterior = um(
      "SELECT * FROM central_feedback WHERE artigo_id=? AND usuario_id=?",
      a.id,
      usuario
    );
    if (
      anterior &&
      anterior.util === util &&
      anterior.motivo === motivo &&
      anterior.comentario === comentario
    )
      return;
    run(
      "INSERT INTO central_feedback(artigo_id,usuario_id,util,motivo,comentario,criado_em,atualizado_em) VALUES(?,?,?,?,?,?,?) ON CONFLICT(artigo_id,usuario_id) DO UPDATE SET util=excluded.util,motivo=excluded.motivo,comentario=excluded.comentario,atualizado_em=excluded.atualizado_em",
      a.id,
      usuario,
      util,
      motivo,
      comentario,
      agora,
      agora
    );
    run(
      "INSERT INTO central_feedback_eventos(id,artigo_id,usuario_id,util,motivo,criado_em) VALUES(?,?,?,?,?,?)",
      randomUUID(),
      a.id,
      usuario,
      util,
      motivo,
      agora
    );
  });
}
export function qualidadeCentral(
  ator: string,
  f: Record<string, unknown>,
  agora = Date.now()
) {
  acessoEditorial(ator);
  const dias = ["7", "30", "90"].includes(String(f.dias)) ? Number(f.dias) : 30,
    inicio = agora - dias * 86400000,
    diaInicio = new Date(inicio).toISOString().slice(0, 10),
    categoria = categoriasCentral.some(c => c.id === f.categoria)
      ? String(f.categoria)
      : "",
    artigo = typeof f.artigo === "string" ? f.artigo : "";
  limparRetencao(agora);
  const escolhidos = todos(
    "SELECT * FROM central_artigos ORDER BY atualizado_em DESC"
  ).filter(
    a =>
      (!artigo || a.id === artigo) &&
      (!categoria ||
        JSON.parse(a.publicado_json ?? a.rascunho_json).categoria === categoria)
  );
  const ids = new Set(escolhidos.map(a => a.id));
  const visitas = todos(
    "SELECT artigo_id,usuario_id,dia,acessos FROM central_visitas WHERE dia>=?",
    diaInicio
  ).filter(v => ids.has(v.artigo_id));
  const feedback = todos(
    "SELECT artigo_id,usuario_id,util,motivo,atualizado_em FROM central_feedback WHERE atualizado_em>=?",
    inicio
  ).filter(v => ids.has(v.artigo_id));
  const eventos = todos(
    "SELECT artigo_id,criado_em FROM central_feedback_eventos WHERE criado_em>=?",
    inicio
  ).filter(v => ids.has(v.artigo_id));
  const stats = (v: Linha[], fb: Linha[]) => {
    const leitores = new Set(v.map(x => x.usuario_id)),
      respondentes = new Set(fb.map(x => x.usuario_id)),
      acessos = v.reduce((s, x) => s + x.acessos, 0),
      uteis = fb.filter(x => x.util).length;
    return {
      acessos,
      usuarios: leitores.size,
      avaliacoes: fb.length,
      uteis,
      negativas: fb.length - uteis,
      taxa: leitores.size
        ? ([...leitores].filter(u => respondentes.has(u)).length /
            leitores.size) *
          100
        : 0,
      aprovacao: fb.length ? (uteis / fb.length) * 100 : 0,
    };
  };
  const evolucao = (v: Linha[], ev: Linha[]) => {
    const dias = new Map<
      string,
      { dia: string; acessos: number; votos: number }
    >();
    for (const x of v) {
      const e = dias.get(x.dia) ?? { dia: x.dia, acessos: 0, votos: 0 };
      e.acessos += x.acessos;
      dias.set(x.dia, e);
    }
    for (const x of ev) {
      const d = new Date(x.criado_em).toISOString().slice(0, 10),
        e = dias.get(d) ?? { dia: d, acessos: 0, votos: 0 };
      e.votos++;
      dias.set(d, e);
    }
    return [...dias.values()].sort((a, b) => a.dia.localeCompare(b.dia));
  };
  const artigos = escolhidos.map(a => {
    const conteudo = JSON.parse(a.publicado_json ?? a.rascunho_json),
      v = visitas.filter(x => x.artigo_id === a.id),
      fb = feedback.filter(x => x.artigo_id === a.id),
      motivos = motivosCentral
        .map(m => ({
          motivo: m.nome,
          total: fb.filter(x => !x.util && x.motivo === m.id).length,
        }))
        .filter(m => m.total);
    return {
      id: a.id,
      titulo: conteudo.titulo,
      categoria: conteudo.categoria,
      estado: a.estado,
      ...stats(v, fb),
      motivos,
      evolucao: evolucao(
        v,
        eventos.filter(x => x.artigo_id === a.id)
      ),
    };
  });
  const lacunas = todos(
    "SELECT termo,categoria,dia,total FROM central_lacunas WHERE dia>=? ORDER BY total DESC,dia DESC",
    diaInicio
  ).filter(l => !categoria || l.categoria === categoria);
  const historico = todos(
    "SELECT r.artigo_id,r.acao,r.criado_em,r.motivo,a.nome autor,json_extract(r.conteudo_json,'$.titulo') titulo FROM central_revisoes r JOIN administradores a ON a.usuario_id=r.autor_id WHERE r.criado_em>=? ORDER BY r.criado_em DESC",
    inicio
  ).filter(h => ids.has(h.artigo_id));
  return {
    totais: stats(visitas, feedback),
    artigos,
    lacunas,
    evolucao: evolucao(visitas, eventos),
    historico,
  };
}

export function prepararCentralInicial(autor: string) {
  acessoEditorial(autor);
  transacao(() => {
    // Atualiza somente o guia original ainda intocado da entrega anterior.
    // Revisões editoriais, rascunhos e artigos arquivados continuam sob controle da equipe.
    const antigo = "O catálogo e as ofertas estão disponíveis, mas a aquisição demonstrativa, o checkout e a entrega de licença ainda não estão concluídos nesta versão.";
    for (const a of todos("SELECT * FROM central_artigos WHERE estado='publicado' AND versao=3 AND (SELECT count(*) FROM central_revisoes r WHERE r.artigo_id=central_artigos.id)=3")) {
      const conteudo = JSON.parse(a.rascunho_json);
      if (conteudo.titulo !== "Antes de escolher um beat" || !conteudo.passos?.some((p: Linha) => p.conteudo === antigo)) continue;
      const guia = guiasIniciais.find(g => g.titulo === conteudo.titulo)!;
      salvarArtigo(autor, { ...guia, passos: JSON.stringify(guia.passos), versao: a.versao }, a.id);
      for (const acao of ["revisar", "publicar"]) transicionarArtigo(autor, a.id, { acao, versao: registro(a.id).versao, motivo: "Atualização do guia inicial sobre as condições e entregas de licenças de beats." });
    }
    if (um("SELECT 1 FROM central_parametros WHERE chave='guias_iniciais_v1'"))
      return;
    run(
      "INSERT INTO central_parametros(chave,valor) VALUES('guias_iniciais_v1','preparado')"
    );
    if (um("SELECT count(*) n FROM central_artigos")!.n) return;
    for (const g of guiasIniciais) {
      const id = salvarArtigo(autor, {
        ...g,
        passos: JSON.stringify(g.passos),
      });
      transicionarArtigo(autor, id, {
        acao: "revisar",
        versao: registro(id).versao,
        motivo: "Revisão do conteúdo inicial baseado na documentação vigente.",
      });
      transicionarArtigo(autor, id, {
        acao: "publicar",
        versao: registro(id).versao,
        motivo: "Disponibilização inicial de orientações da plataforma.",
      });
    }
  });
}
