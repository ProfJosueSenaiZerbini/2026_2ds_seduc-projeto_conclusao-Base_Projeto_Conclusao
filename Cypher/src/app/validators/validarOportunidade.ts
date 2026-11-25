import { profissoesCatalogo } from "../models/modeloPerfil.js";
export const profissoesOportunidade = profissoesCatalogo.filter(
  p => p.id !== "podcaster"
);
export const tiposChamada = {
  servico: "Prestação de serviço",
  projeto: "Equipe para projeto",
  colaboracao: "Colaboração",
  vaga: "Vaga profissional",
};
export const modosTrabalho = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};
export const remuneracoes = {
  a_combinar: "A combinar",
  remunerada: "Remunerada",
  colaboracao: "Colaboração não remunerada",
};
export const estadosChamada = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  pausada: "Pausada",
  encerrada: "Encerrada",
  expirada: "Expirada",
  cancelada: "Cancelada",
};
export const estadosCandidatura = {
  enviada: "Enviada",
  analise: "Em análise",
  selecionada: "Em negociação",
  recusada: "Recusada",
  retirada: "Retirada",
  acordo: "Acordo confirmado",
};
export class ErroOportunidade extends Error {
  constructor(
    message: string,
    public status = 400,
    public campos: Record<string, string> = {}
  ) {
    super(message);
  }
}
export function exigir(
  condicao: unknown,
  mensagem: string,
  status = 400
): asserts condicao {
  if (!condicao) throw new ErroOportunidade(mensagem, status);
}
export function texto(valor: unknown, limite = 4000) {
  exigir(
    typeof valor === "string" || valor === undefined || valor === null,
    "Formato de texto inválido."
  );
  const s = String(valor ?? "").trim();
  exigir(s.length <= limite, `Use até ${limite} caracteres.`);
  return s;
}
export function moeda(valor: unknown) {
  const s = texto(valor, 20).replace(",", ".");
  if (!s) return null;
  exigir(/^\d{1,9}(\.\d{1,2})?$/.test(s), "Informe um valor monetário válido.");
  return Math.round(Number(s) * 100);
}
export function validarChamada(b: Record<string, unknown>) {
  const erros: Record<string, string> = {};
  const campo = (nome: string, limite: number, obrigatorio = false) => {
    try {
      const v = texto(b[nome], limite);
      if (obrigatorio && !v) erros[nome] = "Preencha este campo.";
      return v;
    } catch (e) {
      erros[nome] = (e as Error).message;
      return "";
    }
  };
  const titulo = campo("titulo", 120, true),
    descricao = campo("descricao", 6000, true),
    contexto = campo("contexto", 2000),
    condicoes = campo("condicoes", 3000);
  const tipo = campo("tipo", 30),
    modalidade = campo("modalidade", 30),
    remuneracao = campo("remuneracao", 30),
    localizacao = campo("localizacao", 150),
    unidade = campo("unidade", 20) || "projeto";
  if (!Object.hasOwn(tiposChamada, tipo)) erros.tipo = "Escolha a finalidade.";
  if (!Object.hasOwn(modosTrabalho, modalidade))
    erros.modalidade = "Escolha a modalidade.";
  if (modalidade !== "remoto" && !localizacao)
    erros.localizacao = "Informe a região de trabalho.";
  if (!Object.hasOwn(remuneracoes, remuneracao))
    erros.remuneracao = "Escolha a condição de remuneração.";
  if (!["projeto", "hora", "mes"].includes(unidade))
    erros.unidade = "Escolha uma unidade válida.";
  let valor_centavos: number | null = null;
  try {
    valor_centavos = moeda(b.valor);
  } catch (e) {
    erros.valor = (e as Error).message;
  }
  if (remuneracao !== "remunerada" && valor_centavos !== null)
    erros.valor = "Valores são exclusivos de chamadas remuneradas.";
  const data = (n: string) => {
    const s = campo(n, 10);
    if (!s) return null;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
      !Number.isFinite(Date.parse(s)) ||
      new Date(s).toISOString().slice(0, 10) !== s
    ) {
      erros[n] = "Data inválida.";
      return null;
    }
    return s;
  };
  const inicio = data("inicio"),
    fim = data("fim"),
    prazoDia = data("prazo");
  const prazo = prazoDia ? `${prazoDia}T23:59:59-03:00` : null;
  if (prazo && Date.parse(prazo) <= Date.now())
    erros.prazo = "O prazo precisa estar no futuro.";
  if (inicio && fim && fim < inicio)
    erros.fim = "O término deve ocorrer após o início.";
  if (prazoDia && fim && prazoDia > fim)
    erros.prazo = "A candidatura deve terminar até o fim do trabalho.";
  const recebidas = Array.isArray(b.funcoes)
    ? b.funcoes
    : Object.values(
        b.funcoes && typeof b.funcoes === "object" ? b.funcoes : {}
      );
  if (!recebidas.length || recebidas.length > 25)
    erros.funcoes = "Inclua de 1 a 25 funções.";
  const ids = new Set<string>();
  const funcoes = recebidas.map((raw, i) => {
    const f = (raw && typeof raw === "object" ? raw : {}) as Record<
      string,
      unknown
    >;
    const profissao_id = String(f.profissao_id ?? "");
    const vagas = Number(f.vagas);
    const key = `funcoes.${i}`;
    if (
      !profissoesOportunidade.some(p => p.id === profissao_id) ||
      ids.has(profissao_id)
    )
      erros[key] = "Escolha uma profissão oficial sem repetir funções.";
    ids.add(profissao_id);
    if (!Number.isInteger(vagas) || vagas < 1 || vagas > 1000)
      erros[key] = "Informe de 1 a 1.000 vagas.";
    let responsabilidades = "",
      requisitos = "",
      desejaveis = "";
    try {
      responsabilidades = texto(f.responsabilidades, 2500);
      requisitos = texto(f.requisitos, 2500);
      desejaveis = texto(f.desejaveis, 2000);
      if (!responsabilidades) erros[key] = "Descreva as responsabilidades.";
    } catch (e) {
      erros[key] = (e as Error).message;
    }
    return { profissao_id, vagas, responsabilidades, requisitos, desejaveis };
  });
  const evento_id = campo("evento_id", 100) || null,
    projeto_id = campo("projeto_id", 100) || null;
  if (Object.keys(erros).length)
    throw new ErroOportunidade("Confira os campos indicados.", 400, erros);
  return {
    titulo,
    descricao,
    contexto,
    tipo,
    modalidade,
    localizacao,
    remuneracao,
    valor_centavos,
    unidade,
    condicoes,
    inicio,
    fim,
    prazo,
    evento_id,
    projeto_id,
    funcoes,
  };
}
export function validarTermos(b: Record<string, unknown>) {
  const responsabilidades = texto(b.responsabilidades, 3000),
    entregas = texto(b.entregas, 3000),
    prazos = texto(b.prazos, 1500),
    remuneracao = texto(b.remuneracao, 2000),
    condicoes = texto(b.condicoes, 3000);
  exigir(
    responsabilidades && entregas && prazos && remuneracao,
    "Preencha responsabilidades, entregas, prazos e remuneração (ou ausência dela)."
  );
  return { responsabilidades, entregas, prazos, remuneracao, condicoes };
}
