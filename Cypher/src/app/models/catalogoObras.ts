import { audioCatalogoLocal, duracaoAudioLocal } from "./audioCatalogoLocal.js";
import type Database from "better-sqlite3";
import { enderecoObra, perfilUrl } from "./enderecosPerfil.js";
import { conexaoInternaCypher } from "./bancoDados.js";
import { publicacoesDescoberta } from "./modeloDescoberta.js";
import { imagemPublicacaoDemo, discoDemo, idFaixaDemo, discosDemonstrativos, faixasDemonstrativas } from "./catalogoDemonstrativo.js";

const linksSpotify = new Map(
  [...discosDemonstrativos, ...faixasDemonstrativas]
    .filter(obra => obra.link.startsWith("https://open.spotify.com/"))
    .map(obra => [obra.id, obra.link])
);

export function duracaoDaFaixa(id: string, valor?: unknown) {
  const segundos = duracaoAudioLocal[id];
  if (segundos) return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
  return typeof valor === "string" && /^\d{1,3}:[0-5]\d$/.test(valor) && !/^0+:00$/.test(valor) ? valor : "";
}

export function plataformaDaObra(id: string, link: string) {
  const url = URL.parse(link?.trim() || "");
  const linkSpotify = url?.hostname === "open.spotify.com" && url.protocol === "https:" ? url.href : linksSpotify.get(id);
  if (linkSpotify) return { url: linkSpotify, nome: "Spotify", spotify: true };
  if (!url || !["https:", "http:"].includes(url.protocol)) return null;

  const host = url.hostname.replace(/^www\./, "");
  const nome = Object.entries({
    "music.apple.com": "Apple Music",
    "music.youtube.com": "YouTube Music",
    "youtube.com": "YouTube",
    "youtu.be": "YouTube",
    "soundcloud.com": "SoundCloud",
    "audiomack.com": "Audiomack",
    "deezer.com": "Deezer",
  }).find(([dominio]) => host === dominio)?.[1] ??
    (/^music\.amazon\.[a-z.]+$/.test(host) ? "Amazon Music" : "");
  return { url: url.href, nome, spotify: false };
}

type Complemento = {
  id: string;
  link: string;
  metadados: string;
  artistas: string;
};

// A seleção pública continua sob as mesmas regras de visibilidade da Descoberta.
export function obrasDoCatalogo(usuarioId = "") {
  const db: Database.Database = conexaoInternaCypher();
  return db.transaction(() => catalogoEmLeitura(db, usuarioId))();
}

function catalogoEmLeitura(db: Database.Database, usuarioId: string) {
  const comFaixas = publicacoesDescoberta("obras", "", true, usuarioId);
  const publicas = comFaixas.filter(o => !o.id.includes("-faixa-"));
  if (!publicas.length) return [];
  const lancamentos = new Map<string, string[]>();
  const faixasOrdenadas = db.prepare(`
    SELECT l.id, g.obra_id AS faixa FROM lancamentos l
    LEFT JOIN faixas_lancamento f ON f.lancamento_id=l.id
    LEFT JOIN fonogramas g ON g.id=f.fonograma_id
    WHERE l.id IN (SELECT value FROM json_each(?)) ORDER BY l.id,f.ordem
  `).all(JSON.stringify(publicas.map(o => o.id))) as { id: string; faixa: string | null }[];
  for (const { id, faixa } of faixasOrdenadas) {
    let lista = lancamentos.get(id);
    if (!lista) lancamentos.set(id, lista = []);
    if (faixa) lista.push(faixa);
  }
  const complementos = db
    .prepare(
      `
    SELECT o.id, o.link_escuta AS link, o.metadados,
      (SELECT json_group_array(c.nome_creditado) FROM creditos c
       WHERE c.obra_id=o.id AND c.demonstracao=o.demonstracao
         AND (c.demonstracao=1 OR c.verificado=1)
         AND lower(c.funcao) IN ('artista principal','colaboração','participação','participação como feat','voz','vocal','rapper','mc')) AS artistas
    FROM obras o WHERE o.id IN (SELECT value FROM json_each(?))
  `
    )
    .all(JSON.stringify(comFaixas.map(o => o.id))) as Complemento[];
  const curtidas = db.prepare(`
    SELECT obra_id, COUNT(*) AS total, MAX(usuario_id = ?) AS curtida
    FROM curtidas_obras GROUP BY obra_id
  `).all(usuarioId) as { obra_id: string; total: number; curtida: number }[];
  const porCurtida = new Map(curtidas.map(c => [c.obra_id, c]));
  const porId = new Map(complementos.map(o => [o.id, o]));
  const publicaPorId = new Map(comFaixas.map(o => [o.id, o]));
  const audioLocal = (valor: unknown) => typeof valor === "string" &&
    /^\/(?!\/)[^?#]*\.(mp3|wav|ogg|m4a|aac|flac)(?:\?[^#]*)?$/i.test(valor) ? valor : "";
  return publicas.map(obra => {
    const extra = porId.get(obra.id);
    let meta: Record<string, unknown> = {};
    try {
      const valor = JSON.parse(extra?.metadados || "{}");
      if (valor && typeof valor === "object" && !Array.isArray(valor))
        meta = valor;
    } catch {
      /* Metadados legados também podem ser texto livre. */
    }
    const colecao = ["EP", "Álbum", "Mixtape"].includes(obra.tipo);
    const tipo = ["Música", "Fonograma"].includes(obra.tipo) ? "Faixa" : obra.tipo;
    const artistas = [
      ...new Set([
        obra.autor,
        ...(JSON.parse(extra?.artistas || "[]") as string[]),
      ]),
    ].filter(Boolean);
    const link = /^https?:\/\//i.test(extra?.link || "") ? extra!.link : "";
    const previa = audioCatalogoLocal[obra.id] || audioLocal(meta.audio) || audioLocal(extra?.link) || (/\.(mp3|wav|ogg|m4a|aac)(?:\?|$)/i.test(link) ? link : "");
    const quantidade = obra.demonstracao
      ? discoDemo(obra.id)?.faixas.length
      : undefined;
    const idsFaixas = lancamentos.get(obra.id) ?? (Array.isArray(meta.faixas) ? meta.faixas : []);
    const faixas = quantidade ?? (lancamentos.has(obra.id) || Array.isArray(meta.faixas)
      ? idsFaixas.filter(id => publicaPorId.has(String(id))).length : null);
    const duracao = duracaoDaFaixa(obra.id, meta.duracao);
    return {
      ...obra,
      curtidas: porCurtida.get(obra.id)?.total ?? 0,
      curtida: Boolean(porCurtida.get(obra.id)?.curtida),
      tipo,
      colecao,
      artistas,
      plataforma: plataformaDaObra(obra.id, link === previa ? "" : link),
      previa,
      duracao,
      capa: imagemPublicacaoDemo(obra.id) || "",
      ano: /^\d{4}-\d{2}-\d{2}$/.test(obra.data) ? obra.data.slice(0, 4) : "",
      faixas,
      listaFaixas: obra.demonstracao ? (discoDemo(obra.id)?.faixas ?? []) :
        idsFaixas.map(id => publicaPorId.get(String(id))?.titulo).filter(Boolean),
      faixasDetalhadas: (obra.demonstracao && discoDemo(obra.id)
        ? discoDemo(obra.id)!.faixas.map((_, i) => idFaixaDemo(obra.id, i))
        : idsFaixas).flatMap(id => {
        const faixa = publicaPorId.get(String(id));
        if (!faixa) {
          if (!obra.demonstracao) return [];
          const chave = String(id);
          return [{ titulo: "", artistas: obra.autor, duracao: duracaoDaFaixa(chave, ""), audio: audioCatalogoLocal[chave] || "" }];
        }
        const dados = porId.get(String(id));
        let info: Record<string, unknown> = {};
        try { info = JSON.parse(dados?.metadados || "{}"); } catch {}
        return [{ titulo: faixa.titulo, artistas: [faixa.autor, ...JSON.parse(dados?.artistas || "[]")].filter(Boolean).join(" · "),
          duracao: duracaoDaFaixa(faixa.id, info?.duracao),
          audio: audioCatalogoLocal[faixa.id] || audioLocal(info?.audio) || audioLocal(dados?.link) }];
      }),
      url: enderecoObra(obra.handle, obra.id),
      artistaUrl: perfilUrl(obra.handle),
    };
  });
}

export function definirCurtidaObra(obraId: string, usuarioId: string, curtida: boolean) {
  const db = conexaoInternaCypher();
  return db.transaction(() => {
    if (!publicacoesDescoberta("obras", "", false, usuarioId).some(o => o.id === obraId)) return null;
    if (curtida) db.prepare("INSERT OR IGNORE INTO curtidas_obras (obra_id, usuario_id) VALUES (?, ?)").run(obraId, usuarioId);
    else db.prepare("DELETE FROM curtidas_obras WHERE obra_id = ? AND usuario_id = ?").run(obraId, usuarioId);
    const { total } = db.prepare("SELECT COUNT(*) AS total FROM curtidas_obras WHERE obra_id = ?").get(obraId) as { total: number };
    return { curtida, total };
  })();
}
