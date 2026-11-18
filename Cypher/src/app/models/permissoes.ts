export type TipoConta = "consumidor" | "profissional" | "administrativo";
export type PapelAdministrativo = "super_admin" | "moderador" | "editor";
export type AcaoAdministrativa =
  "taxonomia" | "excecoes" | "equipe" | "editorial" | "auditoria";
export type ContextoConta = {
  tipoConta: TipoConta;
  categories: readonly string[];
};

// Capacidades correspondem aos tipos realmente suportados pelos módulos atuais.
// Ausência de publicação musical não impede crédito, atuação ou futuro portfólio.
const lancamentos = [
  "Obra",
  "Música",
  "Single",
  "EP",
  "Álbum",
  "Mixtape",
  "Outro",
];
export const matrizProfissional: Readonly<
  Record<
    string,
    {
      obras: readonly string[];
      beat: boolean;
      evento: boolean;
      contexto: string;
    }
  >
> = {
  Rapper: {
    obras: lancamentos,
    beat: false,
    evento: false,
    contexto: "Faixas e lançamentos autorais de rap",
  },
  MC: {
    obras: [],
    beat: false,
    evento: false,
    contexto:
      "Condução de eventos e apresentações; crédito não equivale a publicar lançamento musical",
  },
  "Compositor(a)": {
    obras: ["Obra"],
    beat: false,
    evento: false,
    contexto: "Composição autoral; não concede publicação de fonograma ou beat",
  },
  Letrista: {
    obras: [],
    beat: false,
    evento: false,
    contexto:
      "Letras e créditos de escrita; publicação de letras terá modalidade própria",
  },
  Beatmaker: {
    obras: ["Instrumental"],
    beat: true,
    evento: false,
    contexto: "Instrumentais e beats próprios",
  },
  "Produtor(a)": {
    obras: [...lancamentos, "Instrumental"],
    beat: false,
    evento: false,
    contexto:
      "Produções musicais; produção não implica licença de beat de terceiro",
  },
  DJ: {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Sets e performances; modalidade própria futura",
  },
  Freestyleiro: {
    obras: ["Música", "Single"],
    beat: false,
    evento: false,
    contexto:
      "Gravações próprias de freestyle; não cria eventos de batalha por participar deles",
  },
  "B-boy / B-girl": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Registros de breaking e participações",
  },
  "Dançarino(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Registros de dança e participações",
  },
  "Coreógrafo(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Coreografias e créditos",
  },
  "Grafiteiro(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Galeria de grafites",
  },
  "Ilustrador(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Ilustrações e capas",
  },
  "Designer gráfico": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Identidades visuais e peças gráficas",
  },
  "Fotógrafo(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Ensaios e fotografias",
  },
  Videomaker: {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Vídeos e coberturas",
  },
  "Editor(a) de vídeo": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Edições e pós-produção",
  },
  "Engenheiro(a) de áudio": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Captação e serviços de áudio, com créditos",
  },
  "Mixador(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Mixagens e créditos técnicos",
  },
  "Masterizador(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Masterizações e créditos técnicos",
  },
  "Empresário(a)": {
    obras: [],
    beat: false,
    evento: false,
    contexto:
      "Gestão de carreira; não assume autoria ou organização de evento automaticamente",
  },
  "Produtor(a) cultural": {
    obras: [],
    beat: false,
    evento: false,
    contexto:
      "Projetos culturais; evento exige também a atuação de organizador",
  },
  "Organizador(a) de eventos": {
    obras: [],
    beat: false,
    evento: true,
    contexto: "Criação e gestão de eventos",
  },
  "Criador(a) de conteúdo": {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Publicações multimídia futuras",
  },
  "Jornalista cultural": {
    obras: [],
    beat: false,
    evento: false,
    contexto:
      "Matérias e coberturas; não recebe papel editorial administrativo",
  },
  Podcaster: {
    obras: [],
    beat: false,
    evento: false,
    contexto: "Episódios de podcast em modalidade própria futura",
  },
};

export function tiposObraPermitidos(categorias: readonly string[]): string[] {
  return [
    ...new Set(
      categorias.flatMap(
        categoria => matrizProfissional[categoria]?.obras ?? []
      )
    ),
  ];
}

export function podePublicar(
  conta: ContextoConta,
  modalidade: "obra" | "beat" | "evento",
  tipoObra?: string
): boolean {
  if (conta.tipoConta !== "profissional") return false;
  if (modalidade === "obra") {
    const tipos = tiposObraPermitidos(conta.categories);
    return tipoObra === undefined ? tipos.length > 0 : tipos.includes(tipoObra);
  }
  return conta.categories.some(
    categoria => matrizProfissional[categoria]?.[modalidade] === true
  );
}

export function podeAdministrar(
  conta: {
    tipoConta: TipoConta;
    papelAdministrativo?: PapelAdministrativo | null;
  },
  acao: AcaoAdministrativa
): boolean {
  if (conta.tipoConta !== "administrativo") return false;
  if (conta.papelAdministrativo === "super_admin") return true;
  return (
    (conta.papelAdministrativo === "moderador" && acao === "excecoes") ||
    (conta.papelAdministrativo === "editor" && acao === "editorial")
  );
}
