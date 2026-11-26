// Limite simples de tentativas de login (#160), em memória: depois de `maximo` falhas dentro de `janelaMs`,
// a mesma chave (IP + e-mail) fica bloqueada até a janela da primeira falha vencer. Como as sessões, o
// contador zera quando o servidor reinicia.

export const MAXIMO_TENTATIVAS_LOGIN = 5;
export const JANELA_TENTATIVAS_LOGIN_MS = 15 * 60 * 1000;

export const criarLimitadorTentativas = ({
    maximo = MAXIMO_TENTATIVAS_LOGIN,
    janelaMs = JANELA_TENTATIVAS_LOGIN_MS,
    agora = Date.now
} = {}) => {
    // chave -> { falhas, inicio } (inicio = momento da primeira falha da janela atual)
    const registros = new Map();

    const vencido = (registro, instante) => instante - registro.inicio >= janelaMs;

    // Remove as entradas vencidas para o mapa não crescer sem limite.
    const limparVencidos = (instante) => {
        for (const [chave, registro] of registros) {
            if (vencido(registro, instante)) registros.delete(chave);
        }
    };

    return {
        bloqueado(chave) {
            const registro = registros.get(chave);
            if (!registro) return false;
            if (vencido(registro, agora())) {
                registros.delete(chave);
                return false;
            }
            return registro.falhas >= maximo;
        },

        registrarFalha(chave) {
            const instante = agora();
            limparVencidos(instante);
            const registro = registros.get(chave);
            if (!registro) {
                registros.set(chave, { falhas: 1, inicio: instante });
            } else {
                registro.falhas += 1;
            }
        },

        limpar(chave) {
            registros.delete(chave);
        }
    };
};
