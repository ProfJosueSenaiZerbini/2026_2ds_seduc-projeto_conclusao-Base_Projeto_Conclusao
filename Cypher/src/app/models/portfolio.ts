import { objetoDisponivel } from "./politicasModeracao.js";
import { capaPublicacao } from "./midiasPublicacoes.js";
import { conexaoInternaCypher } from "./bancoDados.js";
import { conta, semBloqueio, um, todos } from "./oportunidades.js";
import { podeVerProjeto, projetoTrabalho } from "./projetosTrabalho.js";
import { profissoesCatalogo } from "./modeloPerfil.js";
import { rotuloProfissional } from "./tratamentoProfissional.js";
import { resolverPerfilPublico } from "./identidadeUsuario.js";
export class ErroPortfolio extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
function exigir(ok: unknown, msg: string, status = 400): asserts ok {
  if (!ok) throw new ErroPortfolio(msg, status);
}
export type ConfigPortfolio = {
  modo: "manual" | "inteligente";
  molde: "grade" | "editorial" | "lista";
  visivel: boolean;
};
export type ItemPortfolio = {
  chave: string;
  tipo: "obra" | "beat" | "evento" | "projeto";
  id: string;
  titulo: string;
  autor: string;
  papel: string;
  proprio: boolean;
  atuacoes: string[];
  nomeTipo: string;
  descricao: string;
  url: string;
  capa: string;
  selecionado: boolean;
  oculto: boolean;
  destaque: boolean;
  ordem: number;
  secao: string;
  publicavel: boolean;
  responsavel: string;
};
export function titularPortfolio(id: string) {
  const u = conta(id);
  exigir(
    objetoDisponivel(conexaoInternaCypher(), "perfil", id, id),
    "Portfólio indisponível.",
    404
  );
  exigir(
    u.tipo_conta === "profissional",
    "O portfólio pertence a uma conta profissional.",
    403
  );
  const p = um(
    "SELECT usuario_id id,nome,identificador handle,biografia,perfil_publico FROM perfis WHERE usuario_id=? AND demonstracao=0",
    id
  );
  exigir(p, "Portfólio indisponível.", 404);
  return {
    id: p.id as string,
    nome: p.nome as string,
    handle: p.handle as string,
    biografia: p.biografia as string,
    publico: Boolean(p.perfil_publico),
  };
}
export function configuracaoPortfolio(id: string): ConfigPortfolio {
  const c = um("SELECT * FROM portfolio_config WHERE usuario_id=?", id);
  return {
    modo: c?.modo ?? "manual",
    molde: c?.molde ?? "grade",
    visivel: Boolean(c?.visivel),
  };
}
function perfilCompartilhavel(id: string, visitante: string) {
  try {
    const p = titularPortfolio(id);
    semBloqueio(visitante, id);
    return p.publico;
  } catch {
    return false;
  }
}
// Apenas dados da ficha profissional: letras, anexos privados e dados de conta não entram nesta projeção.
const fontes = `
SELECT o.id AS id,'obra' tipo,o.proprietario_id responsavel,o.titulo,p.nome autor,o.tipo nome_tipo,o.descricao,o.criado_em AS criado_em,
 o.proprietario_id=@titular proprio,o.publicada=1 AND o.situacao IN('','Lançado') origem_publica,
 CASE WHEN o.proprietario_id=@titular THEN trim(o.funcao_principal || ' ' || o.funcao_detalhe) ELSE
 (SELECT group_concat(c.funcao || CASE WHEN c.participacao<>'' THEN ' · '||c.participacao ELSE '' END,' / ') FROM creditos c WHERE c.obra_id=o.id AND c.usuario_creditado_id=@titular AND c.verificado=1 AND c.demonstracao=0) END papel,
 CASE WHEN o.proprietario_id=@titular THEN (SELECT json_group_array(profissao_id) FROM atuacoes_obra WHERE obra_id=o.id) ELSE '[]' END atuacoes
FROM obras o JOIN perfis p ON p.usuario_id=o.proprietario_id WHERE o.demonstracao=0 AND p.demonstracao=0 AND
 (o.proprietario_id=@titular OR EXISTS(SELECT 1 FROM creditos c WHERE c.obra_id=o.id AND c.usuario_creditado_id=@titular AND c.verificado=1 AND c.demonstracao=0))
UNION ALL
SELECT b.id,'beat',b.produtor_id,b.titulo,p.nome,'Beat',b.descricao,b.criado_em,b.produtor_id=@titular,1,
 CASE WHEN b.produtor_id=@titular THEN 'Produção do beat' ELSE
 (SELECT group_concat(c.funcao,' / ') FROM creditos_publicacoes c WHERE c.tipo='beat' AND c.objeto_id=b.id AND c.usuario_id=@titular AND c.confirmado=1 AND c.retirado_em IS NULL) END,
 CASE WHEN b.produtor_id=@titular THEN '["beatmaker"]' ELSE '[]' END
FROM beats b JOIN perfis p ON p.usuario_id=b.produtor_id WHERE b.demonstracao=0 AND p.demonstracao=0 AND
 (b.produtor_id=@titular OR EXISTS(SELECT 1 FROM creditos_publicacoes c WHERE c.tipo='beat' AND c.objeto_id=b.id AND c.usuario_id=@titular AND c.confirmado=1 AND c.retirado_em IS NULL))
UNION ALL
SELECT e.id,'evento',e.proprietario_id,e.titulo,p.nome,'Evento',e.descricao,e.criado_em,e.proprietario_id=@titular,1,
 CASE WHEN e.proprietario_id=@titular THEN 'Organização' ELSE coalesce(
 (SELECT group_concat(c.funcao,' / ') FROM creditos_publicacoes c WHERE c.tipo='evento' AND c.objeto_id=e.id AND c.usuario_id=@titular AND c.confirmado=1 AND c.retirado_em IS NULL),
 CASE WHEN EXISTS(SELECT 1 FROM eventos_presencas pr WHERE pr.evento_id=e.id AND pr.usuario_id=@titular AND pr.revogada_em IS NULL) THEN 'Comparecimento registrado; não comprova contribuição profissional' ELSE 'Participação confirmada no evento (registro legado)' END) END,
 CASE WHEN e.proprietario_id=@titular THEN '["organizador-eventos"]' ELSE '[]' END
FROM eventos e JOIN perfis p ON p.usuario_id=e.proprietario_id WHERE e.demonstracao=0 AND p.demonstracao=0 AND
 (e.proprietario_id=@titular OR EXISTS(SELECT 1 FROM creditos_publicacoes c WHERE c.tipo='evento' AND c.objeto_id=e.id AND c.usuario_id=@titular AND c.confirmado=1 AND c.retirado_em IS NULL) OR EXISTS(SELECT 1 FROM eventos_presencas pr WHERE pr.evento_id=e.id AND pr.usuario_id=@titular AND pr.revogada_em IS NULL) OR EXISTS(SELECT 1 FROM interesses_eventos i WHERE i.evento_id=e.id AND i.usuario_id=@titular AND i.status='confirmado' AND NOT EXISTS(SELECT 1 FROM eventos_inscricoes ni WHERE ni.evento_id=e.id AND ni.usuario_id=@titular)))
UNION ALL
SELECT p.id,'projeto',p.autor_id,p.titulo,pf.nome,coalesce(d.modalidade,'Projeto'),p.descricao,p.criado_em,1,p.publico,
 coalesce(nullif(d.papel,''),'Atuação declarada'),coalesce(d.profissoes_json,'[]')
FROM projetos_trabalho p JOIN perfis pf ON pf.usuario_id=p.autor_id LEFT JOIN detalhes_projetos d ON d.projeto_id=p.id
WHERE p.autor_id=@titular AND coalesce(d.retirado,0)=0 AND pf.demonstracao=0
ORDER BY criado_em DESC,tipo,id`;
export const inferirAtuacoes = (papel: string) => {
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const t = normalizar(papel);
  const funcoes: Record<string, string[]> = {
    beatmaker: ["beat", "beatmaking"],
    produtor: ["producao musical", "producao"],
    compositor: ["composicao"],
    letrista: ["letra"],
    fotografo: ["fotografia"],
    videomaker: ["filmagem", "videoclipe"],
    mixador: ["mixagem"],
    masterizador: ["masterizacao"],
    "editor-video": ["edicao de video"],
    "designer-grafico": ["design grafico", "design de capa"],
    ilustrador: ["ilustracao"],
    rapper: ["rapper", "rap", "voz", "vocal", "feat", "participacao como feat"],
  };
  const termos = t.split(/\s*(?:[·,;/&+]|\be\b)\s*/);
  return profissoesCatalogo.filter(p => {
    const nomes = ["feminino", "masculino", "outro"].map(t => rotuloProfissional(p.rotulo, t));
    return [p.id, p.rotulo, ...nomes, ...(funcoes[p.id] ?? [])].some(f => termos.includes(normalizar(f)));
  }).map(p => p.id);
};
export function origensPortfolio(titular: string) {
  return conexaoInternaCypher().prepare(
    `SELECT f.*, pf.identificador, u.email_confirmado_em IS NOT NULL AND u.tipo_conta='profissional' autor_confirmado,
     CASE WHEN json_valid(o.metadados) THEN json_extract(o.metadados,'$.disco') END album
     FROM (${fontes}) f JOIN perfis pf ON pf.usuario_id=f.responsavel
     JOIN usuarios u ON u.id=f.responsavel
     LEFT JOIN obras o ON f.tipo='obra' AND o.id=f.id
     ORDER BY f.criado_em DESC, f.tipo, f.id`
  ).all({ titular }) as Record<string, any>[];
}
export function candidatosPortfolio(titularId: string): ItemPortfolio[] {
  titularPortfolio(titularId);
  const escolhas = todos(
    "SELECT * FROM portfolio_itens WHERE usuario_id=?",
    titularId
  );
  const porChave = new Map(escolhas.map(e => [e.tipo + ":" + e.origem_id, e]));
  return origensPortfolio(titularId)
    .filter(r =>
      objetoDisponivel(conexaoInternaCypher(), r.tipo, r.id, titularId)
    )
    .map((r, index) => {
      const chave = r.tipo + ":" + r.id,
        c = porChave.get(chave);
      let atuacoes = JSON.parse(r.atuacoes || "[]") as string[];
      if (!atuacoes.length) atuacoes = inferirAtuacoes(r.papel || "");
      const publicavel = Boolean(
        r.origem_publica && perfilCompartilhavel(r.responsavel, titularId)
      );
      const nomes: Record<string, string> = {
        visual: "Trabalho visual",
        audiovisual: "Audiovisual",
        danca: "Dança",
        texto: "Texto",
        tecnico: "Trabalho técnico",
        audio: "Áudio",
        projeto: "Projeto",
      };
      return {
        chave,
        tipo: r.tipo,
        id: r.id,
        titulo: r.titulo,
        autor: r.autor,
        papel: r.papel || "Responsável pelo registro",
        proprio: Boolean(r.proprio),
        atuacoes,
        nomeTipo: nomes[r.nome_tipo] ?? r.nome_tipo,
        descricao: r.descricao,
        url: "",
        capa: "",
        responsavel: r.responsavel,
        publicavel,
        selecionado: Boolean(c?.selecionado),
        oculto: Boolean(c?.oculto),
        destaque: Boolean(c?.destaque),
        ordem: c?.ordem ?? 10000 + index,
        secao: c?.secao ?? "",
      };
    })
    .sort((a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave));
}
type Escolha = {
  chave: string;
  selecionado: boolean;
  oculto: boolean;
  destaque: boolean;
  ordem: number;
  secao: string;
};
function validarEdicao(ator: string, b: Record<string, unknown>) {
  titularPortfolio(ator);
  exigir(
    b.modo === "manual" || b.modo === "inteligente",
    "Escolha o modo do portfólio."
  );
  exigir(
    ["grade", "editorial", "lista"].includes(String(b.molde)),
    "Escolha um molde disponível."
  );
  exigir(
    b.visivel === undefined || b.visivel === "" || b.visivel === "sim",
    "Confira a visibilidade."
  );
  let raw: unknown;
  try {
    raw = JSON.parse(String(b.itens ?? "[]"));
  } catch {
    throw new ErroPortfolio("Não foi possível ler a seleção de trabalhos.");
  }
  exigir(
    Array.isArray(raw) && raw.length <= 500,
    "Organize até 500 escolhas por salvamento."
  );
  const validos = new Set(candidatosPortfolio(ator).map(i => i.chave)),
    vistos = new Set<string>();
  const itens: Escolha[] = raw.map(i => {
    exigir(
      i &&
        typeof i === "object" &&
        typeof i.chave === "string" &&
        validos.has(i.chave),
      "Um trabalho não está mais disponível. Atualize o editor."
    );
    exigir(!vistos.has(i.chave), "Um trabalho foi incluído mais de uma vez.");
    vistos.add(i.chave);
    exigir(
      ["selecionado", "oculto", "destaque"].every(
        k => typeof i[k] === "boolean"
      ),
      "Confira as opções do trabalho."
    );
    exigir(
      Number.isInteger(i.ordem) && i.ordem >= 0 && i.ordem <= 100000,
      "Confira a ordem dos trabalhos."
    );
    exigir(
      typeof i.secao === "string" && i.secao.trim().length <= 60,
      "A seção pode ter até 60 caracteres."
    );
    return {
      chave: i.chave,
      selecionado: i.selecionado,
      oculto: i.oculto,
      destaque: i.destaque,
      ordem: i.ordem,
      secao: i.secao.trim(),
    };
  });
  return {
    config: {
      modo: b.modo,
      molde: b.molde,
      visivel: b.visivel === "sim",
    } as ConfigPortfolio,
    itens,
  };
}
export function salvarPortfolio(ator: string, b: Record<string, unknown>) {
  const { config, itens } = validarEdicao(ator, b),
    db = conexaoInternaCypher();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO portfolio_config(usuario_id,modo,molde,visivel) VALUES(?,?,?,?) ON CONFLICT(usuario_id) DO UPDATE SET modo=excluded.modo,molde=excluded.molde,visivel=excluded.visivel,atualizado_em=CURRENT_TIMESTAMP`
    ).run(ator, config.modo, config.molde, Number(config.visivel));
    for (const i of itens) {
      const [tipo, id] = i.chave.split(":");
      db.prepare(
        `INSERT INTO portfolio_itens(usuario_id,tipo,origem_id,selecionado,oculto,destaque,ordem,secao) VALUES(?,?,?,?,?,?,?,?)
   ON CONFLICT(usuario_id,tipo,origem_id) DO UPDATE SET selecionado=excluded.selecionado,oculto=excluded.oculto,destaque=excluded.destaque,ordem=excluded.ordem,secao=excluded.secao`
      ).run(
        ator,
        tipo,
        id,
        Number(i.selecionado),
        Number(i.oculto),
        Number(i.destaque),
        i.ordem,
        i.secao
      );
    }
  }).immediate();
}
export function montarPortfolio(
  titularId: string,
  visitanteId: string,
  rascunho?: Record<string, unknown>
) {
  conta(visitanteId);
  const titular = titularPortfolio(titularId),
    dono = titularId === visitanteId;
  exigir(
    dono || perfilCompartilhavel(titularId, visitanteId),
    "Portfólio indisponível.",
    404
  );
  exigir(!rascunho || dono, "A prévia pertence ao titular.", 403);
  const edicao = rascunho ? validarEdicao(titularId, rascunho) : null;
  const config = edicao?.config ?? configuracaoPortfolio(titularId);
  exigir(dono || config.visivel, "Portfólio indisponível.", 404);
  const escolhas = new Map(edicao?.itens.map(i => [i.chave, i]));
  const itens = candidatosPortfolio(titularId)
    .map(i => ({ ...i, ...escolhas.get(i.chave) }))
    .filter(
      i =>
        i.publicavel &&
        objetoDisponivel(conexaoInternaCypher(), i.tipo, i.id, visitanteId) &&
        !i.oculto &&
        (config.modo === "inteligente" || i.selecionado) &&
        perfilCompartilhavel(i.responsavel, visitanteId) &&
        // Um bloqueio entre o titular da vitrine e a origem também impede participações.
        perfilCompartilhavel(i.responsavel, titularId)
    )
    .map(i => {
      const enviada = capaPublicacao(visitanteId, i.tipo, i.id);
      let capa = enviada ? "/publication-media/" + enviada : "";
      if (!capa && i.tipo === "projeto" && podeVerProjeto(visitanteId, i.id)) {
        const p = projetoTrabalho(visitanteId, i.id);
        capa =
          p.itens.find(
            it =>
              it.mime.startsWith("image/") &&
              um(
                "SELECT 1 FROM midias_trabalho WHERE id=? AND publico=1",
                it.origem_id
              )
          )?.url ?? "";
      }
      return {
        ...i,
        capa,
        url:
          "/portfolio/" +
          encodeURIComponent(titular.handle.replace(/^@/, "")) +
          "/item/" +
          i.tipo +
          "/" +
          encodeURIComponent(i.id),
      };
    })
    .sort(
      (a, b) =>
        Number(b.destaque) - Number(a.destaque) ||
        a.ordem - b.ordem ||
        a.chave.localeCompare(b.chave)
    );
  const grupos: { nome: string; itens: ItemPortfolio[] }[] = [];
  for (const i of itens) {
    const area = i.atuacoes
      .map(id => profissoesCatalogo.find(p => p.id === id)?.rotulo)
      .filter(Boolean)
      .join(" · ");
    const nome = i.secao || (area ? area : i.nomeTipo);
    let grupo = grupos.find(g => g.nome === nome);
    if (!grupo) {
      grupo = { nome, itens: [] };
      grupos.push(grupo);
    }
    grupo.itens.push(i);
  }
  return { titular, config, itens, grupos };
}
export function lerPortfolioPorHandle(handle: string, visitanteId: string) {
  conta(visitanteId);
  exigir(/^@?[a-z0-9_.]{3,24}$/i.test(handle), "Portfólio indisponível.", 404);
  const pedido = "@" + handle.replace(/^@/, "").toLowerCase();
  const atual = resolverPerfilPublico(pedido) ?? pedido;
  const p = um(
    "SELECT usuario_id id,identificador handle FROM perfis WHERE identificador=? COLLATE NOCASE",
    atual
  );
  exigir(p, "Portfólio indisponível.", 404);
  montarPortfolio(p.id, visitanteId); // Redirecionamento só revela destino atualmente acessível.
  return {
    id: p.id as string,
    handle: p.handle as string,
    redirecionar: pedido !== p.handle,
  };
}

export function portfolioDisponivel(titularId: string, visitanteId: string) {
  try {
    return montarPortfolio(titularId, visitanteId).config.visivel;
  } catch {
    return false;
  }
}
