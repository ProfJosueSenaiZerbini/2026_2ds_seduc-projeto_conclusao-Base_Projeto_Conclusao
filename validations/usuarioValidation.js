const extrairDigitosCPF = (cpf) => {
    if (typeof cpf !== 'string') {
        return null;
    }

    const valor = cpf.trim();
    if (!/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(valor)) {
        return null;
    }

    return valor.replace(/\D/g, '');
};

export const normalizarCPF = (cpf) => {
    const digitos = extrairDigitosCPF(cpf);

    if (!digitos || /^(\d)\1{10}$/.test(digitos)) {
        return null;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(digitos[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(digitos[9])) return null;

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(digitos[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(digitos[10])) return null;

    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
};

export const validarCPF = (cpf) => normalizarCPF(cpf) !== null;

export const validarEmail = (email) => (
    typeof email === 'string' &&
    [...email].length <= 100 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
);

export const validarNome = (nome, tamanhoMinimo = 1) => {
    if (typeof nome !== 'string') {
        return false;
    }

    const tamanho = [...nome.trim()].length;
    return tamanho >= tamanhoMinimo && tamanho <= 100;
};

export const validarSenha = (senha) => (
    typeof senha === 'string' &&
    [...senha].length >= 6 &&
    Buffer.byteLength(senha, 'utf8') <= 72
);

export const validarConfirmacaoSenha = (senha, confirmarSenha) => (
    typeof senha === 'string' &&
    typeof confirmarSenha === 'string' &&
    senha === confirmarSenha
);

export const validarIdade = (idade) => {
    if (typeof idade !== 'string' && typeof idade !== 'number') {
        return false;
    }

    const idadeNumerica = Number(idade);
    return Number.isInteger(idadeNumerica) && idadeNumerica >= 18 && idadeNumerica <= 2147483647;
};
