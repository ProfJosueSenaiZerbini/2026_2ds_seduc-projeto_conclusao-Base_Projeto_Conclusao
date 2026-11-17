// CPF fictício (11 dígitos entre 1 e 9) usado nos cadastros dos testes E2E.
export function gerarCpfDeUmNove() {
    return Array.from({ length: 11 }, () => Math.floor(Math.random() * 9) + 1).join('');
}
