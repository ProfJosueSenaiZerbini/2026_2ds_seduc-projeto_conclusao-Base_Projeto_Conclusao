import pool from '../config/database.js';

// Para rotas autenticadas: lê o saldo atual do banco a cada página (o valor gravado na sessão no login
// fica velho depois de adicionar saldo, reservar, estornar ou receber pagamento) e entrega às views.
// - Atualiza req.session.usuario.saldo_simulado, então as views que já usam usuario.saldo_simulado
//   passam a mostrar o valor correto sem nenhuma outra mudança.
// - Também disponibiliza res.locals.saldoAtual.
// Além disso, entrega o alerta "flash" (req.session.alerta) uma única vez, na próxima página HTML.
export const carregarDadosDaSessao = async (req, res, next) => {
    res.locals.alerta = null;

    // Só uma página (GET) consome o alerta: não conta JSON/polling do chat nem arquivos como /favicon.ico.
    const pedePaginaHtml = req.method === 'GET'
        && !String(req.headers.accept || '').includes('application/json')
        && !req.path.endsWith('/mensagens')
        && !/\.[a-z0-9]+$/i.test(req.path);
    if (pedePaginaHtml && req.session?.alerta) {
        res.locals.alerta = req.session.alerta;
        delete req.session.alerta;
    }

    const usuario = req.session?.usuario;
    if (!usuario?.id) return next();

    try {
        const linhas = await pool.query('SELECT saldo_simulado FROM usuarios WHERE id = ?', [usuario.id]);
        if (linhas[0]) {
            const saldo = Number(linhas[0].saldo_simulado);
            if (Number(usuario.saldo_simulado) !== saldo) usuario.saldo_simulado = saldo;
            res.locals.saldoAtual = saldo;
        }
    } catch (erro) {
        // Sem o saldo novo a página ainda funciona com o valor da sessão.
        console.error('Erro ao atualizar o saldo da sessão:', erro?.code || 'erro inesperado');
    }

    return next();
};

// Guarda um alerta para a próxima página HTML (padrão "flash": redireciona e mostra uma vez).
export const definirAlerta = (req, alerta) => {
    if (req.session) req.session.alerta = alerta;
};
