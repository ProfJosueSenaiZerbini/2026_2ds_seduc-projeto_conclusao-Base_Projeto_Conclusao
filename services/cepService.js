// Consulta de endereço pelo CEP, usada para verificar o local dos bicos.
// Fonte principal: ViaCEP. Reserva: BrasilAPI (v2). Usa o fetch nativo do Node, sem dependências.
//
// buscarEnderecoPorCep(cep) devolve:
//   - { cep, logradouro, bairro, cidade, uf } quando alguma das APIs encontra o CEP;
//   - null quando o CEP não existe (a BrasilAPI responde 404 — a ViaCEP sozinha não basta, porque
//     às vezes demora a ter CEPs novos, então um {"erro": true} dela sempre é conferido na BrasilAPI);
//   - lança CepIndisponivelError quando não dá para concluir (a BrasilAPI falhou depois da ViaCEP
//     falhar ou dizer que o CEP não existe).
// Com CEP_FAKE=1 (fora de produção) usa um provedor falso em memória, para os testes E2E rodarem sem internet.
import { normalizarCep, validarCep } from '../validations/bicoValidation.js';

export const TIMEOUT_CEP_MS = 3000;

export class CepIndisponivelError extends Error {
    constructor(mensagem = 'Serviços de CEP indisponíveis.', opcoes) {
        super(mensagem, opcoes);
        this.name = 'CepIndisponivelError';
    }
}

// CEPs conhecidos pelo provedor falso (CEP_FAKE=1). Qualquer outro CEP é tratado como inexistente.
export const CEPS_FALSOS = Object.freeze({
    '01310100': { cep: '01310100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' },
    // CEP geral de cidade pequena: a consulta não traz rua nem bairro.
    '13690000': { cep: '13690000', logradouro: '', bairro: '', cidade: 'Descalvado', uf: 'SP' }
    // '99999999' fica de fora de propósito: é o CEP inexistente dos testes.
});

export const modoCepFalso = () => (
    process.env.CEP_FAKE === '1' && process.env.NODE_ENV !== 'production'
);

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

const montarEndereco = ({ cep, logradouro, bairro, cidade, uf }) => ({
    cep: normalizarCep(texto(cep)),
    logradouro: texto(logradouro),
    bairro: texto(bairro),
    cidade: texto(cidade),
    uf: texto(uf).toUpperCase()
});

// Endereço utilizável precisa ao menos de cidade e UF (rua e bairro podem faltar no CEP geral).
const enderecoValido = (endereco) => validarCep(endereco.cep) && endereco.cidade && /^[A-Z]{2}$/.test(endereco.uf);

// GET com tempo limite. O AbortController cobre a conexão e a leitura do corpo.
const buscarJson = async (url, { fetch, timeoutMs }) => {
    const controle = new AbortController();
    const temporizador = setTimeout(() => controle.abort(), timeoutMs);
    try {
        const resposta = await fetch(url, { signal: controle.signal, headers: { Accept: 'application/json' } });
        const corpo = resposta.ok ? await resposta.json() : null;
        return { status: resposta.status, corpo };
    } finally {
        clearTimeout(temporizador);
    }
};

// Cada provedor devolve { encontrado: endereço } ou { inexistente: true }; qualquer outra situação lança erro.
const consultarViaCep = async (cep, opcoes) => {
    const { status, corpo } = await buscarJson(`https://viacep.com.br/ws/${cep}/json/`, opcoes);
    if (status === 200 && corpo && (corpo.erro === true || corpo.erro === 'true')) {
        return { inexistente: true };
    }
    if (status === 200 && corpo) {
        const endereco = montarEndereco({ ...corpo, cidade: corpo.localidade });
        if (enderecoValido(endereco)) return { encontrado: endereco };
    }
    throw new Error(`ViaCEP respondeu de forma inesperada (HTTP ${status}).`);
};

const consultarBrasilApi = async (cep, opcoes) => {
    const { status, corpo } = await buscarJson(`https://brasilapi.com.br/api/cep/v2/${cep}`, opcoes);
    if (status === 404) {
        return { inexistente: true };
    }
    if (status === 200 && corpo) {
        const endereco = montarEndereco({
            cep: corpo.cep,
            logradouro: corpo.street,
            bairro: corpo.neighborhood,
            cidade: corpo.city,
            uf: corpo.state
        });
        if (enderecoValido(endereco)) return { encontrado: endereco };
    }
    throw new Error(`BrasilAPI respondeu de forma inesperada (HTTP ${status}).`);
};

const consultarProvedorFalso = async (cep) => {
    const endereco = CEPS_FALSOS[cep];
    return endereco ? { ...endereco } : null;
};

// opcoes.fetch permite simular as APIs nos testes; quando é informado, o provedor falso não é usado.
export const buscarEnderecoPorCep = async (cep, opcoes = {}) => {
    const digitos = normalizarCep(cep);
    if (!validarCep(digitos)) {
        return null;
    }

    if (!opcoes.fetch && modoCepFalso()) {
        return consultarProvedorFalso(digitos);
    }

    const config = {
        fetch: opcoes.fetch || globalThis.fetch,
        timeoutMs: opcoes.timeoutMs ?? TIMEOUT_CEP_MS
    };

    let falhaViaCep = null;
    try {
        const viaCep = await consultarViaCep(digitos, config);
        if (viaCep.encontrado) return viaCep.encontrado;
        // ViaCEP disse que não existe: confere na BrasilAPI antes de concluir.
    } catch (erro) {
        falhaViaCep = erro;
    }

    try {
        const brasilApi = await consultarBrasilApi(digitos, config);
        return brasilApi.encontrado || null;
    } catch (erro) {
        console.error('❌ Consulta de CEP indisponível:', falhaViaCep?.message || 'ViaCEP: CEP não encontrado', '|', erro.message);
        throw new CepIndisponivelError(undefined, { cause: erro });
    }
};
