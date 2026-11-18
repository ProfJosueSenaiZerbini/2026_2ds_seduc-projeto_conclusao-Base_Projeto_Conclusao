import { categoriasGerais } from "../models/modeloPerfil.js";
import { validarRespostasAtuacao } from "../models/questionarioAtuacao.js";
import { vertentesProfissionais } from "../models/modeloProfissionalPersistido.js";
import type { AtuacaoProfissionalPersistida, VisibilidadesAtuacao } from "../models/bancoDados.js";

export function listaTextual(valor: unknown): string[] {
  const itens = valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];
  return itens.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean);
}

function objeto(valor: unknown): Record<string, unknown> | null {
  if (typeof valor !== "string" || valor.length > 100_000) return null;
  try {
    const resultado = JSON.parse(valor);
    return resultado && typeof resultado === "object" && !Array.isArray(resultado) ? resultado : null;
  } catch { return null; }
}

export function validarSelecaoProfissional(categorias: string[], respostasJson: unknown, visibilidadesJson: unknown, vertentes: string[]) {
  if (!categorias.length || categorias.length > 26 || new Set(categorias).size !== categorias.length || categorias.some(item => !categoriasGerais.includes(item))) throw new Error("Selecione pelo menos uma das profissões disponíveis.");
  if (new Set(vertentes).size !== vertentes.length || vertentes.some(item => !(vertentesProfissionais as readonly string[]).includes(item)) || (vertentes.length > 0 && !categorias.includes("Rapper"))) throw new Error("Vertentes profissionais são opções do Rapper. Confira sua seleção.");
  const respostas = objeto(respostasJson);
  const visibilidades = objeto(visibilidadesJson);
  if (!respostas || !visibilidades || [...Object.keys(respostas),...Object.keys(visibilidades)].some(item => !categorias.includes(item))) throw new Error("Confira as respostas das profissões selecionadas.");
  const atuacoes: AtuacaoProfissionalPersistida[] = categorias.map(categoria => {
    const resposta = respostas[categoria];
    if (!validarRespostasAtuacao(categoria,resposta,true).valido) throw new Error(`Informe o tempo de atuação em ${categoria}.`);
    const bruto = visibilidades[categoria];
    const niveis = bruto && typeof bruto === "object" && !Array.isArray(bruto) ? bruto as Record<string, unknown> : {};
    const permitidos = ["__categoria__","tempoAtuacao","etapaProjetos","participacaoColetiva","atividadePratica"];
    if (Object.entries(niveis).some(([campo,nivel]) => !permitidos.includes(campo) || !["publico","colaboradores","privado"].includes(String(nivel)))) throw new Error("Confira a visibilidade das respostas.");
    const seguras = {__categoria__:"publico",...niveis} as VisibilidadesAtuacao;
    for (const campo of Object.keys(resposta as object)) seguras[campo] ??= "privado";
    return {categoria,respostas:resposta as AtuacaoProfissionalPersistida["respostas"],visibilidades:seguras};
  });
  return {categorias,atuacoes,vertentes};
}
