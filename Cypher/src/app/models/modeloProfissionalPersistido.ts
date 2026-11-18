export const vertentesProfissionais = [
  "Boom bap",
  "Gangsta rap",
  "G-Funk",
  "R&B",
  "Gospel",
  "Jazz rap",
  "Trap",
  "Grime",
  "Drill",
  "Plug",
  "PluggnB",
  "Rage",
  "Melodic rap",
  "Detroit rap",
  "Jersey Club Rap",
  "Trap soul",
] as const;

export type VertenteProfissional = (typeof vertentesProfissionais)[number];

export const profissoesElegiveisParaVertentes = ["rapper"] as const;

export type ProfissaoElegivelParaVertente =
  (typeof profissoesElegiveisParaVertentes)[number];

export type OrigemProfissaoPersistida = "catalogo" | "legado" | "personalizado";

export type EstadoProfissaoPersistida = "ativa" | "inativa" | "pendente";

export type ProfissaoUsuarioPersistida = {
  id: string;
  usuarioId: string;
  profissaoId: string | null;
  valorOriginal: string;
  origem: OrigemProfissaoPersistida;
  estado: EstadoProfissaoPersistida;
  selecionadaEm: string;
  desativadaEm: string | null;
  atualizadaEm: string;
};

export type VertenteUsuarioPersistida = {
  id: string;
  usuarioId: string;
  vertenteId: VertenteProfissional;
  ativa: boolean;
  associacaoAtiva: boolean;
  criadaEm: string;
  desativadaEm: string | null;
  atualizadaEm: string;
};

export function profissaoPodeSelecionarVertentes(profissaoId: string): boolean {
  return (profissoesElegiveisParaVertentes as readonly string[]).includes(
    profissaoId
  );
}

export function vertenteProfissionalPermitida(
  valor: string
): valor is VertenteProfissional {
  return (vertentesProfissionais as readonly string[]).includes(valor);
}
