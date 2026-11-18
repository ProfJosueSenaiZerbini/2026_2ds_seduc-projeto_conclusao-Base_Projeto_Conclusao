export const validarTituloBico = (titulo) => (
    typeof titulo === 'string' &&
    titulo.trim().length >= 3 &&
    titulo.trim().length <= 100
);

export const validarDescricaoBico = (descricao) => (
    typeof descricao === 'string' &&
    descricao.trim().length >= 10 &&
    descricao.trim().length <= 500
);

export const validarBairroBico = (bairro) => (
    typeof bairro === 'string' &&
    bairro.trim().length >= 2 &&
    bairro.trim().length <= 100
);

// Endereço do bico. O CEP é aceito com ou sem traço ("01310-100" ou "01310100") e gravado só com os dígitos.
export const normalizarCep = (cep) => (
    typeof cep === 'string' ? cep.trim().replace(/-/g, '') : ''
);

export const validarCep = (cep) => /^\d{8}$/.test(normalizarCep(cep));

// "01310100" -> "01310-100". Valores fora do formato voltam como vieram (bicos antigos não têm CEP).
export const formatarCep = (cep) => {
    const digitos = String(cep ?? '');
    return /^\d{8}$/.test(digitos) ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
};

// Número do imóvel: 1 a 10 caracteres; "s/n" (em qualquer caixa) é gravado como "S/N".
export const normalizarNumeroEndereco = (numero) => {
    const texto = typeof numero === 'string' ? numero.trim() : '';
    return /^s\s*\/\s*n$/i.test(texto) ? 'S/N' : texto;
};

export const validarNumeroEndereco = (numero) => {
    const texto = normalizarNumeroEndereco(numero);
    return texto.length >= 1 && texto.length <= 10;
};

// Complemento é opcional: ausente ou vazio é válido; preenchido, até 60 caracteres.
export const validarComplemento = (complemento) => (
    complemento === undefined ||
    complemento === null ||
    (typeof complemento === 'string' && complemento.trim().length <= 60)
);

// Usada apenas no CEP geral (cidade pequena), quando a consulta não devolve a rua.
export const validarLogradouro = (logradouro) => (
    typeof logradouro === 'string' &&
    logradouro.trim().length >= 2 &&
    logradouro.trim().length <= 150
);

export const validarDataServico = (data) => (
    typeof data === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    (() => {
        const [ano, mes, dia] = data.split('-').map(Number);
        const dataValidada = new Date(Date.UTC(ano, mes - 1, dia));
        return dataValidada.getUTCFullYear() === ano &&
            dataValidada.getUTCMonth() === mes - 1 &&
            dataValidada.getUTCDate() === dia;
    })()
);

export const validarHorarioServico = (horario) => (
    typeof horario === 'string' &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horario)
);