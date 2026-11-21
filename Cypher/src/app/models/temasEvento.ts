export const temaEventoPadrao = "classico";

export const temasEvento = [
  {
    id: temaEventoPadrao,
    nome: "Clássico",
    descricao: "Data destacada e informações em um painel translúcido.",
  },
  {
    id: "cartaz-de-rua",
    nome: "Cartaz de rua",
    descricao: "Papel rasgado, título em destaque e data em adesivo.",
  },
] as const;

export function temaEventoDisponivel(valor: string): boolean {
  return temasEvento.some(tema => tema.id === valor);
}

export function resolverTemaEvento(valor: string | undefined): string {
  return valor && temaEventoDisponivel(valor) ? valor : temaEventoPadrao;
}
