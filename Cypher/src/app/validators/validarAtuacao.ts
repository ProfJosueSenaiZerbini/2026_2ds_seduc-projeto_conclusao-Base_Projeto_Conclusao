import { categoriasGerais } from "../models/modeloPerfil.js";
import { perguntasCadastroProfissao } from "../models/questionarioAtuacao.js";
import { vertentesProfissionais } from "../models/modeloProfissionalPersistido.js";
import type { AtuacaoProfissionalPersistida } from "../models/bancoDados.js";

export function listaTextual(valor: unknown): string[] {
  const itens =
    valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];
  return itens
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean);
}

function objeto(valor: unknown): Record<string, unknown> | null {
  if (typeof valor !== "string" || valor.length > 100_000) return null;
  try {
    const resultado = JSON.parse(valor);
    return resultado &&
      typeof resultado === "object" &&
      !Array.isArray(resultado)
      ? resultado
      : null;
  } catch {
    return null;
  }
}

export function validarSelecaoProfissional(
  categorias: string[],
  respostasJson: unknown,
  vertentes: string[]
) {
  if (
    !categorias.length ||
    categorias.length > 26 ||
    new Set(categorias).size !== categorias.length ||
    categorias.some(item => !categoriasGerais.includes(item))
  )
    throw new Error("Selecione pelo menos uma das profissões disponíveis.");
  if (
    new Set(vertentes).size !== vertentes.length ||
    vertentes.some(
      item => !(vertentesProfissionais as readonly string[]).includes(item)
    ) ||
    (vertentes.length > 0 && !categorias.includes("Rapper"))
  )
    throw new Error(
      "Vertentes profissionais são opções do Rapper. Confira sua seleção."
    );
  const respostas = objeto(respostasJson);
  if (
    !respostas ||
    Object.keys(respostas).some(item => !categorias.includes(item))
  )
    throw new Error("Confira as respostas das profissões selecionadas.");
  const atuacoes: AtuacaoProfissionalPersistida[] = categorias.map(
    categoria => {
      const tempoAtuacao = (
        respostas[categoria] as { tempoAtuacao?: unknown } | null
      )?.tempoAtuacao;
      if (
        typeof tempoAtuacao !== "string" ||
        !perguntasCadastroProfissao(categoria)[0]?.opcoes.includes(tempoAtuacao)
      ) {
        throw new Error(`Informe o tempo de atuação em ${categoria}.`);
      }
      return {
        categoria,
        respostas: { tempoAtuacao },
        visibilidades: { __categoria__: "publico", tempoAtuacao: "privado" },
      };
    }
  );
  return { categorias, atuacoes, vertentes };
}
