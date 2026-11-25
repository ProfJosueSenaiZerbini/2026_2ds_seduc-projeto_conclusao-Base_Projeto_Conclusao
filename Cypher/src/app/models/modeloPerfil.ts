import { podePublicar } from "./permissoes.js";
export type GrupoProfissional = {
  id: string;
  rotulo: string;
  profissoes: readonly ProfissaoCatalogo[];
};

export type ProfissaoCatalogo = {
  id: string;
  rotulo: string;
  grupoId: string;
};

/**
 * Catálogo-alvo da reestruturação profissional.
 *
 * Este catálogo é a fonte canônica de profissões e rótulos do produto.
 */
export const catalogoProfissional: readonly GrupoProfissional[] = [
  {
    id: "musica",
    rotulo: "Música",
    profissoes: [
      { id: "rapper", rotulo: "Rapper", grupoId: "musica" },
      { id: "mc", rotulo: "MC", grupoId: "musica" },
      { id: "compositor", rotulo: "Compositor(a)", grupoId: "musica" },
      { id: "letrista", rotulo: "Letrista", grupoId: "musica" },
      { id: "beatmaker", rotulo: "Beatmaker", grupoId: "musica" },
      { id: "produtor", rotulo: "Produtor(a)", grupoId: "musica" },
      { id: "dj", rotulo: "DJ", grupoId: "musica" },
      { id: "freestyleiro", rotulo: "Freestyleiro", grupoId: "musica" },
    ],
  },
  {
    id: "danca",
    rotulo: "Dança",
    profissoes: [
      { id: "b-boy-b-girl", rotulo: "B-boy / B-girl", grupoId: "danca" },
      { id: "dancarino", rotulo: "Dançarino(a)", grupoId: "danca" },
      { id: "coreografo", rotulo: "Coreógrafo(a)", grupoId: "danca" },
    ],
  },
  {
    id: "artes-visuais",
    rotulo: "Artes visuais",
    profissoes: [
      { id: "grafiteiro", rotulo: "Grafiteiro(a)", grupoId: "artes-visuais" },
      { id: "ilustrador", rotulo: "Ilustrador(a)", grupoId: "artes-visuais" },
      {
        id: "designer-grafico",
        rotulo: "Designer gráfico",
        grupoId: "artes-visuais",
      },
    ],
  },
  {
    id: "audiovisual",
    rotulo: "Audiovisual",
    profissoes: [
      { id: "fotografo", rotulo: "Fotógrafo(a)", grupoId: "audiovisual" },
      { id: "videomaker", rotulo: "Videomaker", grupoId: "audiovisual" },
      {
        id: "editor-video",
        rotulo: "Editor(a) de vídeo",
        grupoId: "audiovisual",
      },
    ],
  },
  {
    id: "producao-tecnica",
    rotulo: "Produção técnica",
    profissoes: [
      {
        id: "engenheiro-audio",
        rotulo: "Engenheiro(a) de áudio",
        grupoId: "producao-tecnica",
      },
      { id: "mixador", rotulo: "Mixador(a)", grupoId: "producao-tecnica" },
      {
        id: "masterizador",
        rotulo: "Masterizador(a)",
        grupoId: "producao-tecnica",
      },
    ],
  },
  {
    id: "gestao-producao",
    rotulo: "Gestão e produção",
    profissoes: [
      { id: "empresario", rotulo: "Empresário(a)", grupoId: "gestao-producao" },
      {
        id: "produtor-cultural",
        rotulo: "Produtor(a) cultural",
        grupoId: "gestao-producao",
      },
      {
        id: "organizador-eventos",
        rotulo: "Organizador(a) de eventos",
        grupoId: "gestao-producao",
      },
    ],
  },
  {
    id: "comunicacao-cultura",
    rotulo: "Comunicação e cultura",
    profissoes: [
      {
        id: "criador-conteudo",
        rotulo: "Criador(a) de conteúdo",
        grupoId: "comunicacao-cultura",
      },
      {
        id: "jornalista-cultural",
        rotulo: "Jornalista cultural",
        grupoId: "comunicacao-cultura",
      },
    ],
  },
];

export const profissoesCatalogo = catalogoProfissional.flatMap(
  grupo => grupo.profissoes
);

const gruposComEstilosMusicais = new Set(["musica", "producao-tecnica"]);
export const profissoesComEstilosMusicais = new Set(
  profissoesCatalogo
    .filter(profissao => gruposComEstilosMusicais.has(profissao.grupoId))
    .map(profissao => profissao.rotulo)
);

export function listarGruposProfissionais(): readonly GrupoProfissional[] {
  return catalogoProfissional;
}

export function listarProfissoesCatalogo(): readonly ProfissaoCatalogo[] {
  return profissoesCatalogo;
}

export function obterProfissaoCatalogo(
  id: string
): ProfissaoCatalogo | undefined {
  return profissoesCatalogo.find(profissao => profissao.id === id);
}

export const categoriasGerais = profissoesCatalogo.map(
  profissao => profissao.rotulo
);

export type CategoriaProfissional = (typeof categoriasGerais)[number];

export function temCategoria(
  categorias: readonly string[],
  categoria: CategoriaProfissional
): boolean {
  return categorias.includes(categoria);
}

export function podeCriarBeat(categorias: readonly string[]): boolean {
  return podePublicar(
    { tipoConta: "profissional", categories: categorias },
    "beat"
  );
}
export function podeCriarObra(
  categorias: readonly string[],
  tipo?: string
): boolean {
  return podePublicar(
    { tipoConta: "profissional", categories: categorias },
    "obra",
    tipo
  );
}
export function podeCriarEvento(categorias: readonly string[]): boolean {
  return podePublicar(
    { tipoConta: "profissional", categories: categorias },
    "evento"
  );
}

export const opcoesDisponibilidadeProfissional = [
  { value: "disponivel-colaboracao", label: "Disponível para trabalhos e colaborações" },
  { value: "sob-consulta", label: "Disponibilidade sob consulta" },
  { value: "indisponivel", label: "Indisponível no momento" },
] as const;

// Valores de perfis anteriores permanecem legíveis até o titular editar a disponibilidade.
const disponibilidadeAnterior: Readonly<Record<string, string>> = {
  "buscando-feats": "Buscando feats e colaborações",
  "disponivel-apresentacoes": "Disponível para apresentações",
  "buscando-producao": "Buscando beats ou produção musical",
  "disponivel-producao": "Disponível para produzir",
  "buscando-artistas": "Buscando artistas para colaboração",
  "disponivel-eventos": "Disponível para eventos",
  "buscando-parcerias": "Buscando parcerias profissionais",
  "recebendo-inscricoes": "Recebendo inscrições para eventos",
  "buscando-profissionais-eventos": "Buscando profissionais para eventos",
};

export function rotuloStatusProfissional(valor: string): string {
  return opcoesDisponibilidadeProfissional.find(opcao => opcao.value === valor)?.label
    ?? (Object.hasOwn(disponibilidadeAnterior, valor) ? disponibilidadeAnterior[valor] : "Disponibilidade não informada");
}
