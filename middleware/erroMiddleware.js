// Tratador final de erros: sem ele, o Express devolve a pilha de chamadas (com caminhos de arquivos)
// quando NODE_ENV não é "production". O detalhe fica no log do servidor; o usuário recebe só uma frase.
const MENSAGENS = {
    400: 'Requisição inválida.',
    413: 'O conteúdo enviado é grande demais.',
    500: 'Erro interno do servidor.'
};

export const tratarErro = (erro, req, res, next) => {
    const informado = Number(erro?.status || erro?.statusCode);
    const status = informado >= 400 && informado < 500 ? informado : 500;

    if (status === 500) {
        console.error('Erro não tratado:', erro);
    } else {
        // Sem o objeto do erro: o do leitor do corpo carrega o conteúdo enviado (que pode ter senha).
        console.warn(`Requisição recusada (${status}): ${erro.type || 'erro do cliente'}.`);
    }

    // Resposta já começou a ser enviada: só o Express consegue encerrar a conexão.
    if (res.headersSent) {
        return next(erro);
    }

    const mensagem = MENSAGENS[status] || MENSAGENS[400];
    const querJson =
        String(req.headers.accept || '').includes('application/json') ||
        String(req.headers['content-type'] || '').includes('application/json');

    if (querJson) {
        return res.status(status).json({ sucesso: false, erro: mensagem });
    }

    return res.status(status).send(mensagem);
};
