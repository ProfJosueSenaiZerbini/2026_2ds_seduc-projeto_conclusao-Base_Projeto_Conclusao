export function mensagemErroCredito(erro: unknown): string | null {
  if (erro instanceof Error && erro.message === "CREDITO_EM_ANALISE")
    return "Há um crédito em revisão. Aguarde a decisão antes de removê-lo ou alterá-lo.";
  const codigo = erro instanceof Error ? erro.message : "";
  if (codigo === "CREDITO_PERFIL_NAO_ENCONTRADO")
    return "Um dos identificadores informados não corresponde a um perfil Cypher. Confira o identificador ou remova esse crédito.";
  if (codigo === "CREDITO_PROPRIO")
    return "Seu papel já está registrado como participação principal da obra.";
  if (codigo === "CREDITOS_DUPLICADOS")
    return "A lista contém créditos repetidos. Revise os perfis e menções.";
  return null;
}
