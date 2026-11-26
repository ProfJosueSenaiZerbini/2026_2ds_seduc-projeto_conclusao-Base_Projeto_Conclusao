// Repetição de transações que perdem uma disputa de travas no MariaDB.
//
// Duas requisições simultâneas podem travar as mesmas linhas em ordens diferentes. O MariaDB resolve
// escolhendo uma "vítima": ela recebe deadlock (errno 1213) ou, quando espera demais, lock wait timeout
// (errno 1205), e a transação inteira é desfeita. Nesses dois casos refazer a transação do início costuma
// funcionar, então `comRetentativa` repete a função. Qualquer outro erro sobe sem repetir.

// 1213 = ER_LOCK_DEADLOCK; 1205 = ER_LOCK_WAIT_TIMEOUT.
export const ERROS_DE_TRAVA = Object.freeze([1213, 1205]);

export const MAXIMO_TENTATIVAS = 3;
export const ESPERA_MINIMA_MS = 20;
export const ESPERA_MAXIMA_MS = 80;

export const ehErroDeTrava = (erro) => ERROS_DE_TRAVA.includes(Number(erro?.errno));

const dormirPadrao = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Espera curta e aleatória entre as tentativas, para as requisições não colidirem de novo no mesmo instante.
export const esperaAleatoria = (minimo = ESPERA_MINIMA_MS, maximo = ESPERA_MAXIMA_MS) =>
    minimo + Math.floor(Math.random() * (maximo - minimo + 1));

// Executa `tentativa(numero)` (numero começa em 1). `tentativa` deve fazer a transação inteira: pegar a
// conexão, begin, consultas, commit e, se falhar, rollback e release. Assim cada repetição recomeça limpa.
// Depois de `tentativas` falhas por trava (ou em qualquer outro erro) o erro original é relançado.
export async function comRetentativa(
    tentativa,
    {
        tentativas = MAXIMO_TENTATIVAS,
        dormir = dormirPadrao,
        espera = esperaAleatoria,
        aoRepetir = (erro, numero) =>
            console.warn(`Transação repetida (tentativa ${numero} de ${tentativas}): errno ${erro.errno}.`)
    } = {}
) {
    for (let numero = 1; ; numero++) {
        try {
            return await tentativa(numero);
        } catch (erro) {
            if (!ehErroDeTrava(erro) || numero >= tentativas) {
                throw erro;
            }
            aoRepetir(erro, numero);
            await dormir(espera());
        }
    }
}
