import { normalizarBusca } from "./espacoTrabalho.js";

export const modalidadesCatalogoBeat = {
  free: "Free Use",
  premium: "Premium não exclusiva",
  exclusiva: "Exclusiva sob negociação",
};
export const formatosCatalogoBeat = {
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/ogg": "OGG",
};
export const disponibilidadesCatalogoBeat = {
  disponivel: "Aquisições ativas",
  pausado: "Aquisições pausadas",
  sem_oferta: "Sem oferta para aquisição",
  vendido: "Vendido com exclusividade",
};

export function lerFiltrosBeats(query: Record<string, unknown>) {
  const texto = (chave: string, limite: number) => {
    const valor = query[chave];
    return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
  };
  const inteiro = (chave: string) => {
    const valor = texto(chave, 12);
    return /^\d{1,3}$/.test(valor) ? valor : "";
  };
  const duracao = (chave: string) => {
    const valor = texto(chave, 12);
    return segundosBeat(valor) !== null ? valor : "";
  };
  const preco = (chave: string) => {
    const valor = texto(chave, 14);
    return /^\d{1,6}([.,]\d{1,2})?$/.test(valor) ? valor : "";
  };
  const opcao = (chave: string, opcoes: object) => {
    const valor = texto(chave, 30);
    return Object.hasOwn(opcoes, valor) ? valor : "";
  };
  return {
    q: texto("q", 120),
    genero: texto("genero", 60),
    licenca: texto("licenca", 60),
    tonalidade: texto("tonalidade", 30),
    bpmMin: inteiro("bpmMin"),
    bpmMax: inteiro("bpmMax"),
    duracaoMin: duracao("duracaoMin"),
    duracaoMax: duracao("duracaoMax"),
    precoMin: preco("precoMin"),
    precoMax: preco("precoMax"),
    modalidade: opcao("modalidade", modalidadesCatalogoBeat),
    disponibilidade: opcao("disponibilidade", disponibilidadesCatalogoBeat),
    arquivo: opcao("arquivo", formatosCatalogoBeat),
  };
}

type Filtros = ReturnType<typeof lerFiltrosBeats>;
type Oferta = {
  modalidade: string;
  precoCentavos: number | null;
  formatos: string[];
};
type Beat = {
  title: string;
  producer: string;
  producerHandle?: string;
  genre: string;
  license: string;
  key: string;
  bpm: string | number;
  duration: string;
  disponibilidade: string;
  ofertas: Oferta[];
};

function segundosBeat(texto: string) {
  if (!/^\d{1,2}:[0-5]\d$/.test(texto)) return null;
  const [minutos, segundos] = texto.split(":").map(Number);
  return minutos * 60 + segundos;
}

function centavos(texto: string) {
  return Math.round(Number(texto.replace(",", ".")) * 100);
}

function entre(
  valor: number | null,
  min: string,
  max: string,
  converter: (s: string) => number | null
) {
  if (!min && !max) return true;
  return (
    valor !== null &&
    (!min || valor >= converter(min)!) &&
    (!max || valor <= converter(max)!)
  );
}

export function filtrarCatalogoBeats<T extends Beat>(
  catalogo: T[],
  filtros: Filtros
) {
  const termos = normalizarBusca(filtros.q).split(/\s+/).filter(Boolean);
  const filtrarOfertas = Boolean(
    filtros.modalidade ||
    filtros.arquivo ||
    filtros.precoMin ||
    filtros.precoMax
  );
  return catalogo.flatMap(beat => {
    const busca = normalizarBusca(
      [
        beat.title,
        beat.producer,
        beat.producerHandle,
        beat.genre,
        beat.key,
        beat.bpm ? `${beat.bpm} BPM` : "",
      ].join(" ")
    );
    if (!termos.every(termo => busca.includes(termo))) return [];
    if (filtros.genero && beat.genre !== filtros.genero) return [];
    if (filtros.licenca && beat.license !== filtros.licenca) return [];
    if (filtros.tonalidade && beat.key.trim() !== filtros.tonalidade) return [];
    if (
      filtros.disponibilidade &&
      beat.disponibilidade !== filtros.disponibilidade
    )
      return [];
    if (
      !entre(Number(beat.bpm) || null, filtros.bpmMin, filtros.bpmMax, Number)
    )
      return [];
    if (
      !entre(
        segundosBeat(beat.duration),
        filtros.duracaoMin,
        filtros.duracaoMax,
        segundosBeat
      )
    )
      return [];
    if (!filtrarOfertas) return [beat];

    const ofertas = beat.ofertas.filter(
      oferta =>
        (!filtros.modalidade || oferta.modalidade === filtros.modalidade) &&
        (!filtros.arquivo || oferta.formatos.includes(filtros.arquivo)) &&
        entre(
          oferta.precoCentavos,
          filtros.precoMin,
          filtros.precoMax,
          centavos
        )
    );
    return ofertas.length ? [{ ...beat, ofertas }] : [];
  });
}
