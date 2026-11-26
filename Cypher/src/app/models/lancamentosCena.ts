import { audioCatalogoLocal } from "./audioCatalogoLocal.js";
import path from "node:path";
import { caminhoBancoCypher, conexaoInternaCypher } from "./bancoDados.js";
import { fichaAcervo } from "./acervoMusical.js";
import { listarMidiasPublicacoes } from "./midiasPublicacoes.js";
import {
  discoDemo,
  faixasDemonstrativas,
  idFaixaDemo,
} from "./catalogoDemonstrativo.js";
import { duracaoDaFaixa, plataformaDaObra } from "./catalogoObras.js";
import { enderecoObra, perfilUrl } from "./enderecosPerfil.js";
import type { PublicacaoDescoberta } from "./modeloDescoberta.js";
import { objetoDisponivel } from "./politicasModeracao.js";

const faixa = {
  estilo: "faixa",
  rotulo: "Faixa",
  icone: "music",
  acao: "Abrir faixa",
};
const beat = {
  estilo: "beat",
  rotulo: "Beat",
  icone: "audioLines",
  acao: "Abrir beat",
};
const formatos = new Map([
  ["Música", faixa],
  ["Fonograma", faixa],
  ["Faixa", faixa],
  [
    "Álbum",
    { estilo: "album", rotulo: "Álbum", icone: "disc", acao: "Explorar álbum" },
  ],
  [
    "EP",
    { estilo: "ep", rotulo: "EP", icone: "listChecks", acao: "Explorar EP" },
  ],
  [
    "Single",
    {
      estilo: "single",
      rotulo: "Single",
      icone: "music2",
      acao: "Abrir single",
    },
  ],
  [
    "Mixtape",
    {
      estilo: "mixtape",
      rotulo: "Mixtape",
      icone: "radio",
      acao: "Explorar mixtape",
    },
  ],
  ["Beat", beat],
  [
    "Instrumental",
    {
      estilo: "instrumental",
      rotulo: "Instrumental",
      icone: "headphones",
      acao: "Abrir instrumental",
    },
  ],
]);

const dataExtenso = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatoLancamentoCena(item: PublicacaoDescoberta) {
  return item.grupo === "beats"
    ? beat
    : (formatos.get(item.tipo) ?? {
        estilo: "obra",
        rotulo: item.tipo || "Obra",
        icone: "fileMusic",
        acao: "Abrir obra",
      });
}

export function lancamentoCena(item: PublicacaoDescoberta, visitante: string) {
  const ehBeat = item.grupo === "beats";
  const formato = formatoLancamentoCena(item);
  const disco = ehBeat ? undefined : discoDemo(item.id);
  const faixaDemo = ehBeat
    ? undefined
    : faixasDemonstrativas.find(faixa => faixa.id === item.id);
  const musical = ehBeat ? null : fichaAcervo(conexaoInternaCypher(), path.dirname(caminhoBancoCypher()), item.id, visitante);
  const dataInformada = musical?.data || item.data;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dataInformada)
    ? new Date(dataInformada + "T12:00:00Z")
    : null;
  const faixas = musical?.lancamento ? musical.faixas.map(f => {
    const midia = listarMidiasPublicacoes(visitante, "obra", f.obraId).find(m => m.finalidade === "audio");
    return {
      numero: String(f.ordem).padStart(2, "0"),
      titulo: f.titulo,
      url: enderecoObra(item.handle, f.obraId),
      duracao: duracaoDaFaixa(f.obraId, disco?.duracoes?.[f.ordem - 1]),
      audio: midia ? "/publication-media/" + midia.id : audioCatalogoLocal[f.obraId] || "",
    };
  }) : disco ? faixasPublicasDoDisco(item, disco, visitante) : [];
  const audioLocal = Object.hasOwn(audioCatalogoLocal, item.id)
    ? audioCatalogoLocal[item.id]
    : "";
  const audio =
    audioLocal ||
    (ehBeat && item.temPrevia && !item.demonstracao
      ? "/beats/" + encodeURIComponent(item.id) + "/preview"
      : "");
  const duracao = duracaoDaFaixa(item.id, item.duracao);
  const bpm = item.bpm && Number(item.bpm) > 0 ? item.bpm + " BPM" : "";
  const quantidade = faixas.length
    ? faixas.length + (faixas.length === 1 ? " faixa" : " faixas")
    : "";
  return {
    formato,
    faixas,
    audio,
    duracao,
    bpm,
    tom: item.tom,
    quantidade,
    destaque:
      quantidade ||
      bpm ||
      duracao ||
      (audio ? (ehBeat ? "Prévia" : "Áudio") : ""),
    data: data && !Number.isNaN(data.getTime()) ? dataExtenso.format(data) : "",
    producao: disco?.producao || faixaDemo?.producao || "",
    participacao: faixaDemo?.participacao || "",
    plataforma: ehBeat ? null : plataformaDaObra(item.id, ""),
    artistaUrl: perfilUrl(item.handle),
    ficha: ehBeat ? "Ver no Banco de Beats" : "Ver ficha da obra",
  };
}

function faixasPublicasDoDisco(
  item: PublicacaoDescoberta,
  disco: NonNullable<ReturnType<typeof discoDemo>>,
  visitante: string
) {
  const ids = disco.faixas.map((_, indice) => idFaixaDemo(item.id, indice));
  const db = conexaoInternaCypher();
  const titulos = db
    .prepare(
      `
    SELECT id, titulo FROM obras
    WHERE id IN (SELECT value FROM json_each(?)) AND proprietario_id = ?
      AND demonstracao = ? AND publicada = 1 AND situacao IN ('', 'Lançado')
  `
    )
    .all(JSON.stringify(ids), item.autorId, item.demonstracao) as {
    id: string;
    titulo: string;
  }[];
  const porId = new Map(titulos.map(faixa => [faixa.id, faixa.titulo]));

  return ids.flatMap((id, indice) => {
    const titulo = porId.get(id);
    if (!titulo || !objetoDisponivel(db, "obra", id, visitante)) return [];
    return [
      {
        numero: String(indice + 1).padStart(2, "0"),
        titulo,
        url: enderecoObra(item.handle, id),
        duracao: duracaoDaFaixa(id, disco.duracoes?.[indice]),
        audio: audioCatalogoLocal[id] || "",
      },
    ];
  });
}
