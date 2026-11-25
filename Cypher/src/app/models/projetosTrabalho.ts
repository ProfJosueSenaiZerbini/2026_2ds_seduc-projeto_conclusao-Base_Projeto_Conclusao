import { objetoDisponivel } from "./politicasModeracao.js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { conexaoInternaCypher, caminhoBancoCypher } from "./bancoDados.js";
import type { Linha } from "./oportunidades.js";
import {
  conta,
  semBloqueio,
  profissoesAtivas,
  um,
  todos,
} from "./oportunidades.js";
import { profissoesCatalogo } from "./modeloPerfil.js";

export class ErroTrabalho extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
function exigir(ok: unknown, mensagem: string, status = 400): asserts ok {
  if (!ok) throw new ErroTrabalho(mensagem, status);
}
export const formatosTrabalho = [
  {
    id: "projeto",
    nome: "Projeto / experiência",
    profissoes: profissoesCatalogo
      .filter(p => p.id !== "podcaster")
      .map(p => p.id),
  },
  {
    id: "visual",
    nome: "Trabalho visual / galeria",
    profissoes: [
      "grafiteiro",
      "ilustrador",
      "designer-grafico",
      "fotografo",
      "criador-conteudo",
    ],
  },
  {
    id: "audiovisual",
    nome: "Vídeo / audiovisual",
    profissoes: [
      "videomaker",
      "editor-video",
      "criador-conteudo",
      "jornalista-cultural",
    ],
  },
  {
    id: "danca",
    nome: "Dança / coreografia",
    profissoes: ["b-boy-b-girl", "dancarino", "coreografo"],
  },
  {
    id: "audio",
    nome: "Set / performance sonora",
    profissoes: ["dj", "mc", "rapper", "freestyleiro", "produtor", "beatmaker"],
  },
  {
    id: "tecnico",
    nome: "Trabalho técnico de áudio",
    profissoes: ["engenheiro-audio", "mixador", "masterizador", "produtor"],
  },
  {
    id: "texto",
    nome: "Texto / matéria cultural",
    profissoes: ["jornalista-cultural", "criador-conteudo", "letrista"],
  },
];
export const formatosPermitidos = (ator: string) => {
  const ativos = profissoesAtivas(ator);
  return formatosTrabalho.filter(f =>
    f.profissoes.some(p => ativos.includes(p))
  );
};
function titular(ator: string) {
  const u = conta(ator);
  exigir(
    u.tipo_conta === "profissional",
    "É necessário um perfil profissional.",
    403
  );
}
const dadosProjeto = (id: string) =>
  um(
    `SELECT p.*,coalesce(d.modalidade,'projeto') modalidade,
 coalesce(d.profissoes_json,'[]') profissoes_json,coalesce(d.retirado,0) retirado,
 d.objetivo,d.inicio,d.fim,d.papel,d.equipe,d.entregas,d.resultados,d.texto,pf.nome autor
 FROM projetos_trabalho p LEFT JOIN detalhes_projetos d ON d.projeto_id=p.id
 JOIN perfis pf ON pf.usuario_id=p.autor_id WHERE p.id=?`,
    id
  );
export function podeVerProjeto(ator: string, id: string) {
  if(!objetoDisponivel(conexaoInternaCypher(),"projeto",id,ator))return false;
  conta(ator);
  const p = dadosProjeto(id);
  if (!p || p.retirado) return false;
  if (p.autor_id === ator) return true;
  try {
    conta(p.autor_id);
    semBloqueio(ator, p.autor_id);
  } catch {
    return false;
  }
  return Boolean(
    p.publico &&
    um(
      "SELECT 1 FROM perfis WHERE usuario_id=? AND perfil_publico=1",
      p.autor_id
    )
  );
}
export function projetoTrabalho(
  ator: string,
  id: string
): Linha & {
  profissoes: string[];
  itens: (Linha & { nome: string; url: string; mime: string })[];
} {
  exigir(podeVerProjeto(ator, id), "Trabalho indisponível.", 404);
  const p = dadosProjeto(id)!;
  return {
    ...p,
    profissoes: JSON.parse(p.profissoes_json) as string[],
    itens: itensVisiveis(ator, id),
  };
}
export function listarProjetos(ator: string, somenteProprios = false) {
  conta(ator);
  return todos(
    `SELECT p.id FROM projetos_trabalho p LEFT JOIN detalhes_projetos d ON d.projeto_id=p.id
    WHERE coalesce(d.retirado,0)=0 ${somenteProprios ? "AND p.autor_id=?" : ""} ORDER BY p.criado_em DESC,p.id`,
    ...(somenteProprios ? [ator] : [])
  )
    .filter(p => podeVerProjeto(ator, p.id))
    .map(p => projetoTrabalho(ator, p.id));
}
const campo = (v: unknown, max: number, nome: string) => {
  exigir(v === undefined || typeof v === "string", `Confira o campo ${nome}.`);
  const texto = String(v ?? "").trim();
  exigir(texto.length <= max, `${nome}: máximo de ${max} caracteres.`);
  return texto;
};
type Item = {
  tipo: string;
  origem_id: string;
  legenda: string;
  publico?: string;
};
function lerItens(valor: unknown): Item[] {
  let itens: unknown;
  try {
    itens = JSON.parse(String(valor ?? "[]"));
  } catch {
    throw new ErroTrabalho("Confira a lista de materiais.");
  }
  exigir(
    Array.isArray(itens) && itens.length <= 50,
    "Use até 50 materiais por coleção."
  );
  const vistos = new Set<string>();
  return itens.map(i => {
    exigir(i && typeof i === "object", "Material inválido.");
    const tipo = campo(i.tipo, 20, "Tipo"),
      origem_id = campo(i.origem_id, 2048, "Origem"),
      legenda = campo(i.legenda, 240, "Legenda");
    exigir(
      ["midia", "projeto", "obra", "beat", "evento", "link"].includes(tipo) &&
        origem_id,
      "Material inválido."
    );
    exigir(!vistos.has(tipo + ":" + origem_id), "Remova materiais repetidos.");
    vistos.add(tipo + ":" + origem_id);
    if (tipo === "link")
      exigir(urlExterna(origem_id), "Use um endereço HTTPS válido.");
    return {
      tipo,
      origem_id,
      legenda,
      ...(tipo === "midia" && i.publico !== undefined
        ? { publico: i.publico === "sim" ? "sim" : "" }
        : {}),
    };
  });
}
export function urlExterna(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
function origemVisivel(ator: string, tipo: string, id: string) {
  if (tipo === "projeto") return podeVerProjeto(ator, id);
  const fontes: Record<string, [string, string]> = {
    obra: ["obras", "proprietario_id"],
    beat: ["beats", "produtor_id"],
    evento: ["eventos", "proprietario_id"],
  };
  const f = fontes[tipo];
  if (!f) return false;
  // Reutilização inicial de obras, beats e eventos do próprio titular. Nunca concede edição de terceiros.
  return Boolean(
    um(
      `SELECT 1 FROM ${f[0]} WHERE id=? AND ${f[1]}=? AND demonstracao=0`,
      id,
      ator
    )
  );
}
function validarCiclo(
  projeto: string,
  origem: string,
  vistos = new Set<string>()
) {
  exigir(
    origem !== projeto,
    "Uma coleção não pode conter a si própria, mesmo indiretamente."
  );
  if (vistos.has(origem)) return;
  vistos.add(origem);
  for (const i of todos(
    "SELECT origem_id FROM itens_projeto WHERE projeto_id=? AND tipo='projeto'",
    origem
  ))
    validarCiclo(projeto, i.origem_id, vistos);
}
export function salvarProjetoTrabalho(
  ator: string,
  b: Record<string, unknown>,
  id?: string
) {
  titular(ator);
  const anterior = id ? dadosProjeto(id) : undefined;
  if (id)
    exigir(objetoDisponivel(conexaoInternaCypher(),"projeto",id,ator),"Trabalho indisponível.",404);
  if (id)
    exigir(
      anterior && !anterior.retirado && anterior.autor_id === ator,
      "Trabalho indisponível.",
      404
    );
  const titulo = campo(b.titulo, 120, "Título"),
    descricao = campo(b.descricao, 4000, "Descrição");
  const modalidade = campo(b.modalidade, 30, "Modalidade");
  const formato = formatosTrabalho.find(f => f.id === modalidade);
  exigir(
    formato && titulo.length >= 2 && descricao.length >= 10,
    "Informe modalidade, título e descrição (mínimo de 10 caracteres)."
  );
  const selecionadas = Array.isArray(b.profissoes)
    ? b.profissoes
    : b.profissoes
      ? [b.profissoes]
      : [];
  const profissoes = [...new Set(selecionadas.map(p => String(p)))];
  const historicas: string[] = anterior
    ? JSON.parse(anterior.profissoes_json)
    : [];
  const ativos = profissoesAtivas(ator);
  exigir(
    profissoes.length &&
      profissoes.every(
        p =>
          formato.profissoes.includes(p) &&
          (ativos.includes(p) ||
            (anterior?.modalidade === modalidade && historicas.includes(p)))
      ),
    "Selecione uma atuação compatível com esta modalidade.",
    403
  );
  const detalhes = Object.fromEntries(
    ["objetivo", "papel", "equipe", "entregas", "resultados", "texto"].map(
      k => [k, campo(b[k], k === "texto" ? 12000 : 2000, k)]
    )
  );
  exigir(detalhes.papel, "Informe sua função no trabalho.");
  const inicio = campo(b.inicio, 10, "Início"),
    fim = campo(b.fim, 10, "Fim");
  for (const d of [inicio, fim])
    exigir(
      !d ||
        (/^\d{4}-\d{2}-\d{2}$/.test(d) &&
          !Number.isNaN(Date.parse(d)) &&
          new Date(d).toISOString().startsWith(d)),
      "Informe datas válidas."
    );
  exigir(
    !inicio || !fim || fim >= inicio,
    "O fim deve ser posterior ao início."
  );
  const itens = lerItens(b.itens);
  exigir(
    b.direitos === "sim",
    "Confirme a autorização para apresentar estes materiais."
  );
  const pid = id ?? randomUUID(),
    db = conexaoInternaCypher();
  db.transaction(() => {
    for (const i of itens) {
      if (i.tipo === "midia")
        exigir(
          um(
            "SELECT 1 FROM midias_trabalho WHERE id=? AND autor_id=?",
            i.origem_id,
            ator
          ),
          "Arquivo indisponível.",
          403
        );
      else if (i.tipo !== "link")
        exigir(
          origemVisivel(ator, i.tipo, i.origem_id),
          "Registro de origem indisponível.",
          403
        );
      if (i.tipo === "projeto") validarCiclo(pid, i.origem_id);
    }
    const publico = b.publico === "sim" ? 1 : 0;
    if (anterior)
      db.prepare(
        "UPDATE projetos_trabalho SET titulo=?,descricao=?,publico=? WHERE id=?"
      ).run(titulo, descricao, publico, pid);
    else
      db.prepare(
        "INSERT INTO projetos_trabalho(id,autor_id,titulo,descricao,publico) VALUES(?,?,?,?,?)"
      ).run(pid, ator, titulo, descricao, publico);
    db.prepare(
      `INSERT INTO detalhes_projetos(projeto_id,modalidade,profissoes_json,objetivo,inicio,fim,papel,equipe,entregas,resultados,texto)
      VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(projeto_id) DO UPDATE SET modalidade=excluded.modalidade,profissoes_json=excluded.profissoes_json,
      objetivo=excluded.objetivo,inicio=excluded.inicio,fim=excluded.fim,papel=excluded.papel,equipe=excluded.equipe,entregas=excluded.entregas,
      resultados=excluded.resultados,texto=excluded.texto,atualizado_em=CURRENT_TIMESTAMP`
    ).run(
      pid,
      modalidade,
      JSON.stringify(profissoes),
      detalhes.objetivo,
      inicio,
      fim,
      detalhes.papel,
      detalhes.equipe,
      detalhes.entregas,
      detalhes.resultados,
      detalhes.texto
    );
    db.prepare("DELETE FROM itens_projeto WHERE projeto_id=?").run(pid);
    itens.forEach((i, ordem) => {
      db.prepare(
        "INSERT INTO itens_projeto(projeto_id,tipo,origem_id,legenda,ordem) VALUES(?,?,?,?,?)"
      ).run(pid, i.tipo, i.origem_id, i.legenda, ordem);
      if (i.tipo === "midia" && i.publico !== undefined)
        db.prepare(
          "UPDATE midias_trabalho SET publico=? WHERE id=? AND autor_id=?"
        ).run(i.publico === "sim" ? 1 : 0, i.origem_id, ator);
    });
    db.prepare(
      "INSERT INTO historico_projetos(id,projeto_id,autor_id,acao,dados_json) VALUES(?,?,?,?,?)"
    ).run(
      randomUUID(),
      pid,
      ator,
      anterior ? "editado" : "criado",
      JSON.stringify({
        anterior: anterior ?? null,
        atual: {
          titulo,
          descricao,
          modalidade,
          profissoes,
          publico,
          ...detalhes,
          inicio,
          fim,
          itens,
        },
      })
    );
  }).immediate();
  return pid;
}
export function retirarProjeto(ator: string, id: string) {
  titular(ator);
  const p = projetoTrabalho(ator, id);
  exigir(p.autor_id === ator, "Sem autorização.", 403);
  const db = conexaoInternaCypher();
  db.transaction(() => {
    db.prepare("UPDATE projetos_trabalho SET publico=0 WHERE id=?").run(id);
    db.prepare(
      `INSERT INTO detalhes_projetos(projeto_id,modalidade,retirado) VALUES(?,'projeto',1)
      ON CONFLICT(projeto_id) DO UPDATE SET retirado=1,atualizado_em=CURRENT_TIMESTAMP`
    ).run(id);
    db.prepare(
      "INSERT INTO historico_projetos(id,projeto_id,autor_id,acao,dados_json) VALUES(?,?,?,?,?)"
    ).run(randomUUID(), id, ator, "retirado", JSON.stringify(p));
    db.prepare("DELETE FROM itens_projeto WHERE projeto_id=?").run(id);
  })();
}
export function pastaMidias() {
  return path.resolve(
    process.env.CYPHER_MEDIA_DIR ||
      path.join(path.dirname(caminhoBancoCypher()), "midias")
  );
}
export function midiasDoAutor(ator: string) {
  titular(ator);
  return todos(
    "SELECT * FROM midias_trabalho WHERE autor_id=? ORDER BY criada_em DESC",
    ator
  );
}
export function detectarMidia(b: Buffer) {
  const s = b.subarray(0, 16);
  if (
    s.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    b.length >= 24
  ) {
    const w = b.readUInt32BE(16),
      h = b.readUInt32BE(20);
    exigir(
      w >= 16 && h >= 16 && w <= 12000 && h <= 12000,
      "Imagens devem ter entre 16 e 12.000 pixels por lado."
    );
    return "image/png";
  }
  if (s[0] === 255 && s[1] === 216 && s[2] === 255) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 255) break;
      const marker = b[i + 1];
      if (marker === 0xda) break;
      const n = b.readUInt16BE(i + 2);
      if (n < 2) break;
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        const h = b.readUInt16BE(i + 5),
          w = b.readUInt16BE(i + 7);
        exigir(
          w >= 16 && h >= 16 && w <= 12000 && h <= 12000,
          "Imagens devem ter entre 16 e 12.000 pixels por lado."
        );
        return "image/jpeg";
      }
      i += 2 + n;
    }
  }
  if (
    s.toString("ascii", 0, 3) === "ID3" ||
    (s[0] === 255 && (s[1] & 0xe0) === 0xe0)
  )
    return "audio/mpeg";
  if (
    s.toString("ascii", 0, 4) === "RIFF" &&
    s.toString("ascii", 8, 12) === "WAVE"
  )
    return "audio/wav";
  if (s.toString("ascii", 0, 4) === "OggS") return "audio/ogg";
  if (
    s.toString("ascii", 4, 8) === "ftyp" &&
    ["isom", "mp41", "mp42", "avc1", "M4V ", "MSNV"].includes(
      s.toString("ascii", 8, 12)
    )
  )
    return "video/mp4";
  if (
    s.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
    b.subarray(0, 4096).includes(Buffer.from("webm"))
  )
    return "video/webm";
  throw new ErroTrabalho(
    "Formato inválido. Use PNG, JPEG, MP3, WAV, OGG, MP4 ou WebM."
  );
}
export function salvarMidia(ator: string, nome: string, arquivo: Buffer) {
  titular(ator);
  exigir(
    arquivo.length > 0 && arquivo.length <= 25 * 1024 * 1024,
    "Cada arquivo pode ter até 25 MB."
  );
  const mime = detectarMidia(arquivo);
  exigir(
    !mime.startsWith("image/") || arquivo.length <= 8 * 1024 * 1024,
    "Imagens podem ter até 8 MB."
  );
  const nomeSeguro = campo(nome, 160, "Nome do arquivo").replace(
    /[\x00-\x1f\x7f]/g,
    ""
  );
  exigir(nomeSeguro, "Informe o nome do arquivo.");
  const id = randomUUID(),
    dir = pastaMidias();
  fs.mkdirSync(dir, { recursive: true });
  const db = conexaoInternaCypher();
  db.transaction(() => {
    const total = um(
      "SELECT coalesce(sum(bytes),0) total FROM midias_trabalho WHERE autor_id=?",
      ator
    )!.total;
    exigir(
      total + arquivo.length <= 250 * 1024 * 1024,
      "Seu acervo atingiu o limite de 250 MB."
    );
    fs.writeFileSync(path.join(dir, id), arquivo, { flag: "wx" });
    try {
      db.prepare(
        "INSERT INTO midias_trabalho(id,autor_id,nome,mime,bytes) VALUES(?,?,?,?,?)"
      ).run(id, ator, nomeSeguro, mime, arquivo.length);
    } catch (e) {
      fs.unlinkSync(path.join(dir, id));
      throw e;
    }
  }).immediate();
  return { id, nome: nomeSeguro, mime };
}
export function midiaAutorizada(ator: string, id: string) {
  exigir(objetoDisponivel(conexaoInternaCypher(),"midia",id,ator),"Arquivo indisponível.",404);
  conta(ator);
  const m = um("SELECT * FROM midias_trabalho WHERE id=?", id);
  exigir(m, "Arquivo indisponível.", 404);
  exigir(
    m.autor_id === ator ||
      (m.publico &&
        todos(
          "SELECT projeto_id FROM itens_projeto WHERE tipo='midia' AND origem_id=?",
          id
        ).some(p => podeVerProjeto(ator, p.projeto_id))),
    "Arquivo indisponível.",
    404
  );
  return m;
}
export function alterarVisibilidadeMidia(
  ator: string,
  id: string,
  publico: boolean
) {
  titular(ator);
  exigir(
    um("SELECT 1 FROM midias_trabalho WHERE id=? AND autor_id=?", id, ator),
    "Arquivo indisponível.",
    404
  );
  conexaoInternaCypher()
    .prepare("UPDATE midias_trabalho SET publico=? WHERE id=?")
    .run(Number(publico), id);
}
export function excluirMidia(ator: string, id: string) {
  titular(ator);
  const m = midiaAutorizada(ator, id);
  exigir(m.autor_id === ator, "Sem autorização.", 403);
  exigir(
    !um("SELECT 1 FROM itens_projeto WHERE tipo='midia' AND origem_id=?", id),
    "Retire o arquivo de todas as coleções antes de excluí-lo."
  );
  // O banco deixa de autorizar o arquivo antes da remoção física.
  conexaoInternaCypher()
    .prepare("DELETE FROM midias_trabalho WHERE id=?")
    .run(id);
  fs.rmSync(path.join(pastaMidias(), id), { force: true });
}
function itensVisiveis(
  ator: string,
  id: string
): (Linha & { nome: string; url: string; mime: string })[] {
  const dono = dadosProjeto(id)!.autor_id === ator;
  return todos(
    "SELECT * FROM itens_projeto WHERE projeto_id=? ORDER BY ordem",
    id
  ).flatMap(i => {
    if (i.tipo === "link")
      return [
        {
          ...i,
          nome: i.legenda || "Material externo",
          url: i.origem_id,
          mime: "link",
        },
      ];
    if (i.tipo === "midia") {
      try {
        const m = midiaAutorizada(ator, i.origem_id);
        return [
          { ...i, nome: m.nome, url: "/work-media/" + m.id, mime: m.mime },
        ];
      } catch {
        return [];
      }
    }
    if (i.tipo === "projeto") {
      if (!podeVerProjeto(ator, i.origem_id)) return [];
      return [
        {
          ...i,
          nome: dadosProjeto(i.origem_id)!.titulo,
          url: "/work-projects/" + i.origem_id,
          mime: "registro",
        },
      ];
    }
    // Conteúdos existentes mantêm as permissões de sua ficha privada; não são expostos pela coleção.
    if (!dono || !origemVisivel(ator, i.tipo, i.origem_id)) return [];
    const fontes: Record<string, string> = {
      obra: "obras",
      beat: "beats",
      evento: "eventos",
    };
    const origem = um(
      `SELECT titulo FROM ${fontes[i.tipo]} WHERE id=?`,
      i.origem_id
    );
    return [
      {
        ...i,
        nome: origem!.titulo,
        url: "/espaco-de-trabalho/" + i.tipo + "/" + i.origem_id,
        mime: "registro",
      },
    ];
  });
}
