import {
  listarProfissoesCatalogo,
  obterProfissaoCatalogo,
} from "./modeloPerfil.js";

export const ROTULOS_OPCOES_ATUACAO: Readonly<Record<string, string>> = {
  iniciando: "Ainda estou começando",
  "<6m": "Há menos de 6 meses",
  "6m-1a": "De 6 meses a 1 ano",
  "1-3a": "De 1 a 3 anos",
  "3-5a": "De 3 a 5 anos",
  ">5a": "Há mais de 5 anos",
  "sem-projeto": "Ainda não tenho projeto ou trabalho nessa área",
  "em-desenvolvimento": "Tenho projeto ou trabalho em desenvolvimento",
  "concluidos-nao-publicados":
    "Tenho trabalhos concluídos, mas ainda não publicados/divulgados",
  publicados: "Tenho trabalhos publicados ou divulgados",
  "experiencia-anterior":
    "Já atuei, mas minha atividade está pausada no momento",
  nunca: "Ainda não participei",
  "em-colaboracao": "Participei em colaborações",
  "equipe-coletivo": "Participei de equipe, grupo ou coletivo",
  "eventos-apresentacoes":
    "Participei de eventos, apresentações ou oportunidades",
  oportunidades: "Participei de oportunidades ou projetos da área",
  interesse: "Tenho interesse, mas ainda não pratiquei",
  aprendizado: "Estou aprendendo ou treinando",
  "pratica-inicial": "Já comecei a praticar",
  "pratica-recorrente": "Pratico ou trabalho regularmente",
};

const TEMPO = ["iniciando", "<6m", "6m-1a", "1-3a", "3-5a", ">5a"] as const;
const PROJETOS = [
  "sem-projeto",
  "em-desenvolvimento",
  "concluidos-nao-publicados",
  "publicados",
  "experiencia-anterior",
] as const;
const PARTICIPACAO = [
  "nunca",
  "em-colaboracao",
  "equipe-coletivo",
  "eventos-apresentacoes",
  "oportunidades",
] as const;
const PRATICA = [
  "interesse",
  "aprendizado",
  "pratica-inicial",
  "pratica-recorrente",
  "experiencia-anterior",
] as const;

export type TipoPerguntaAtuacao = "enum";
export type EixoPerguntaAtuacao =
  | "tempoAtuacao"
  | "etapaProjetos"
  | "participacaoColetiva"
  | "atividadePratica";

export interface PerguntaAtuacao {
  profissaoId: string;
  eixo: EixoPerguntaAtuacao;
  campo: EixoPerguntaAtuacao;
  pergunta: string;
  tipo: TipoPerguntaAtuacao;
  obrigatoria: boolean;
  opcoes: readonly string[];
}

export type RespostasAtuacao = Record<string, unknown>;

export interface ErroValidacaoAtuacao {
  campo: string;
  codigo:
    | "payload_invalido"
    | "campo_desconhecido"
    | "obrigatorio"
    | "tipo_invalido"
    | "opcao_invalida";
  mensagem: string;
}

export type ResultadoValidacaoAtuacao =
  | { valido: true; erros: [] }
  | { valido: false; erros: ErroValidacaoAtuacao[] };

const CONTEXTOS: Readonly<Record<string, string>> = {
  rapper: "como Rapper",
  mc: "como MC",
  compositor: "na composição musical",
  letrista: "na escrita de letras",
  beatmaker: "na criação de beats",
  produtor: "na produção musical",
  dj: "como DJ",
  freestyleiro: "no freestyle",
  "b-boy-b-girl": "no breaking",
  dancarino: "na dança",
  coreografo: "na criação de coreografias",
  grafiteiro: "no grafite",
  ilustrador: "na ilustração",
  "designer-grafico": "no design gráfico",
  fotografo: "na fotografia",
  videomaker: "na produção de vídeo",
  "editor-video": "na edição de vídeo",
  "engenheiro-audio": "na engenharia de áudio",
  mixador: "na mixagem",
  masterizador: "na masterização",
  empresario: "na gestão de negócios culturais",
  "produtor-cultural": "na produção cultural",
  "organizador-eventos": "na organização de eventos",
  "criador-conteudo": "na criação de conteúdo",
  "jornalista-cultural": "no jornalismo cultural",
  podcaster: "na produção de podcasts",
};

function criarPerguntas(
  profissaoId: string,
  rotulo: string
): readonly PerguntaAtuacao[] {
  const contexto = CONTEXTOS[profissaoId] ?? `como ${rotulo}`;
  return [
    {
      profissaoId,
      eixo: "tempoAtuacao",
      campo: "tempoAtuacao",
      pergunta: `Há quanto tempo você atua ${contexto}?`,
      tipo: "enum",
      obrigatoria: true,
      opcoes: TEMPO,
    },
    {
      profissaoId,
      eixo: "etapaProjetos",
      campo: "etapaProjetos",
      pergunta: `Em que etapa estão seus projetos ou trabalhos ${contexto}?`,
      tipo: "enum",
      obrigatoria: false,
      opcoes: PROJETOS,
    },
    {
      profissaoId,
      eixo: "participacaoColetiva",
      campo: "participacaoColetiva",
      pergunta: `Como tem sido sua participação coletiva ${contexto}?`,
      tipo: "enum",
      obrigatoria: false,
      opcoes: PARTICIPACAO,
    },
    {
      profissaoId,
      eixo: "atividadePratica",
      campo: "atividadePratica",
      pergunta: `Como você descreve sua atividade prática ${contexto}?`,
      tipo: "enum",
      obrigatoria: false,
      opcoes: PRATICA,
    },
  ];
}

export const QUESTIONARIOS_PROFISSIONAIS: Readonly<
  Record<string, readonly PerguntaAtuacao[]>
> = Object.fromEntries(
  listarProfissoesCatalogo().map(profissao => [
    profissao.id,
    criarPerguntas(profissao.id, profissao.rotulo),
  ])
);

export function listarQuestionariosProfissionais(): readonly (readonly PerguntaAtuacao[])[] {
  return listarProfissoesCatalogo().map(
    profissao => QUESTIONARIOS_PROFISSIONAIS[profissao.id]
  );
}

export function catalogoPerguntasPorProfissao(
  profissaoId: string
): readonly PerguntaAtuacao[] {
  return QUESTIONARIOS_PROFISSIONAIS[profissaoId] ?? [];
}

export function idProfissaoPorCategoria(categoria: string): string | undefined {
  return listarProfissoesCatalogo().find(profissao => profissao.rotulo === categoria)?.id;
}

/** Compatibilidade de leitura com os controllers que ainda recebem o rótulo visível. */
export function catalogoPerguntasPorCategoria(
  categoria: string
): readonly PerguntaAtuacao[] {
  const id = idProfissaoPorCategoria(categoria);
  return id ? catalogoPerguntasPorProfissao(id) : [];
}

export function perguntasCadastroProfissao(categoria: string): readonly PerguntaAtuacao[] {
  return catalogoPerguntasPorCategoria(categoria).filter(pergunta => pergunta.eixo === "tempoAtuacao");
}

export function formatarRespostaAtuacao(valor: unknown): string {
  if (Array.isArray(valor))
    return valor.map(formatarRespostaAtuacao).join(", ");
  if (typeof valor !== "string") return "";
  return ROTULOS_OPCOES_ATUACAO[valor] ?? valor;
}

export function validarRespostasAtuacao(
  profissaoOuCategoria: string,
  resposta: unknown,
  obrigatorias = true
): ResultadoValidacaoAtuacao {
  const profissaoId = QUESTIONARIOS_PROFISSIONAIS[profissaoOuCategoria]
    ? profissaoOuCategoria
    : idProfissaoPorCategoria(profissaoOuCategoria);
  const perguntas = profissaoId
    ? catalogoPerguntasPorProfissao(profissaoId)
    : [];
  const erros: ErroValidacaoAtuacao[] = [];
  if (
    !profissaoId ||
    !perguntas.length ||
    typeof resposta !== "object" ||
    resposta === null ||
    Array.isArray(resposta)
  ) {
    return {
      valido: false,
      erros: [
        {
          campo: "",
          codigo: "payload_invalido",
          mensagem:
            "As respostas devem pertencer a uma profissão válida e ser um objeto.",
        },
      ],
    };
  }
  const dados = resposta as RespostasAtuacao;
  const permitidos = new Set<string>(perguntas.map(pergunta => pergunta.campo));
  for (const campo of Object.keys(dados)) {
    if (!permitidos.has(campo))
      erros.push({
        campo,
        codigo: "campo_desconhecido",
        mensagem: "Campo não permitido para esta profissão.",
      });
  }
  for (const pergunta of perguntas) {
    const valor = dados[pergunta.campo];
    if (valor === undefined || valor === null || valor === "") {
      if (obrigatorias && pergunta.obrigatoria)
        erros.push({
          campo: pergunta.campo,
          codigo: "obrigatorio",
          mensagem: "Informe uma resposta para este eixo.",
        });
      continue;
    }
    if (typeof valor !== "string") {
      erros.push({
        campo: pergunta.campo,
        codigo: "tipo_invalido",
        mensagem: "A resposta deve ser uma opção textual.",
      });
    } else if (!pergunta.opcoes.includes(valor)) {
      erros.push({
        campo: pergunta.campo,
        codigo: "opcao_invalida",
        mensagem: "Opção não permitida para este eixo.",
      });
    }
  }
  return erros.length ? { valido: false, erros } : { valido: true, erros: [] };
}

export const CATEGORIAS_ATUACAO = listarProfissoesCatalogo().map(
  profissao => profissao.rotulo
) as readonly string[];
export type CategoriaAtuacao = (typeof CATEGORIAS_ATUACAO)[number];
