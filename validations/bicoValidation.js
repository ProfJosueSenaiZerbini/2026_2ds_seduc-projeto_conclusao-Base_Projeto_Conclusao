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
    data.trim() !== ''
);

export const validarHorarioServico = (horario) => (
    typeof horario === 'string' &&
    horario.trim() !== ''
);