// Iniciais mostradas no avatar de quem não tem foto: 1ª letra do primeiro nome + 1ª do último
// ("Rafael Souza" -> "RS", "Ana de Souza Lima" -> "AL"). Nome de uma palavra só usa as 2 primeiras letras
// ("bruno" -> "BR"). Trata acentos e letras fora do BMP como um caractere só.
export const iniciaisDoNome = (nome, padrao = '?') => {
    const partes = String(nome ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (partes.length === 0) return padrao;

    const letras =
        partes.length === 1
            ? [...partes[0]].slice(0, 2).join('')
            : [...partes[0]][0] + [...partes[partes.length - 1]][0];

    return letras.toLocaleUpperCase('pt-BR');
};
