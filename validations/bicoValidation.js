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