import { conexaoInternaCypher } from "./bancoDados.js";
export const versaoTermos = "2026-11-24";
export const versaoPrivacidade = "2026-11-24";

export function validarConsentimento(dados: {
  aceiteTermos?: unknown;
  versaoTermos?: unknown;
  versaoPrivacidade?: unknown;
}): string | null {
  return dados.aceiteTermos !== "sim" ||
    dados.versaoTermos !== versaoTermos ||
    dados.versaoPrivacidade !== versaoPrivacidade
    ? "Leia e aceite os Termos de Uso e confirme a ciência da Política de Privacidade vigente."
    : null;
}

export function registrarConsentimento(usuarioId: string) {
  conexaoInternaCypher()
    .prepare(
      "INSERT INTO consentimentos_conta(usuario_id,versao_termos,versao_privacidade,aceito_em) VALUES(?,?,?,?)"
    )
    .run(usuarioId, versaoTermos, versaoPrivacidade, Date.now());
}
