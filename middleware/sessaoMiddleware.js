import pool from '../config/database.js';
import { renovarSessao, versaoDaSenha } from '../services/sessaoService.js';
import { urlDaFoto } from '../services/fotoPerfil.js';

export const MENSAGEM_SESSAO_ENCERRADA = 'Sua senha foi alterada ou a conta não existe mais. Entre novamente.';

// Tira o usuário da sessão (#162) e deixa o aviso para a tela de login. Se o store falhar ao renovar a
// sessão, remove o usuário dela mesmo assim: a sessão nunca segue logada.
const encerrarSessao = async (req, res) => {
    try {
        await renovarSessao(req);
    } catch (erro) {
        console.error('Erro ao renovar a sessão encerrada:', erro?.code || 'erro inesperado');
        delete req.session.usuario;
        delete req.session.versaoSenha;
    }
    res.locals.usuario = null;
    definirAlerta(req, { tipo: 'erro', mensagem: MENSAGEM_SESSAO_ENCERRADA });
};

// Para rotas autenticadas: lê o saldo atual do banco a cada página (o valor gravado na sessão no login
// fica velho depois de adicionar saldo, reservar, estornar ou receber pagamento) e entrega às views.
// - Atualiza req.session.usuario.saldo_simulado, então as views que já usam usuario.saldo_simulado
//   passam a mostrar o valor correto sem nenhuma outra mudança.
// - Também disponibiliza res.locals.saldoAtual.
// Além disso, entrega o alerta "flash" (req.session.alerta) uma única vez, na próxima página HTML.
// #162: na mesma consulta confere a versão da senha gravada no login. Se a senha mudou depois (em outra
// sessão) ou a conta sumiu, a sessão é renovada sem usuário e o requireAuth da rota manda para o login.
export const criarCarregadorDadosDaSessao = (banco) => async (req, res, next) => {
    res.locals.alerta = null;
    res.locals.fotoPerfilUrl = null;

    // Só uma página (GET) consome o alerta: não conta JSON/polling do chat nem arquivos como /favicon.ico.
    const pedePaginaHtml =
        req.method === 'GET' &&
        !String(req.headers.accept || '').includes('application/json') &&
        !req.path.endsWith('/mensagens') &&
        !/\.[a-z0-9]+$/i.test(req.path);
    if (pedePaginaHtml && req.session?.alerta) {
        res.locals.alerta = req.session.alerta;
        delete req.session.alerta;
    }

    const usuario = req.session?.usuario;
    if (!usuario?.id) return next();

    try {
        // Na mesma consulta: o saldo, a versão da senha (#162) e a data da foto de perfil (barra lateral).
        const linhas = await banco.query(
            `SELECT u.saldo_simulado, u.senha, f.atualizado_em AS foto_atualizada_em
             FROM usuarios u
             LEFT JOIN fotos_perfil f ON f.usuario_id = u.id
             WHERE u.id = ?`,
            [usuario.id]
        );

        if (!linhas[0] || req.session.versaoSenha !== versaoDaSenha(linhas[0].senha)) {
            await encerrarSessao(req, res);
            return next();
        }

        const saldo = Number(linhas[0].saldo_simulado);
        if (Number(usuario.saldo_simulado) !== saldo) usuario.saldo_simulado = saldo;
        res.locals.saldoAtual = saldo;
        res.locals.fotoPerfilUrl = urlDaFoto(usuario.id, linhas[0].foto_atualizada_em);
    } catch (erro) {
        // Sem o saldo novo a página ainda funciona com o valor da sessão (como antes; a conferência da senha
        // fica para a próxima requisição).
        console.error('Erro ao atualizar o saldo da sessão:', erro?.code || 'erro inesperado');
    }

    return next();
};

export const carregarDadosDaSessao = criarCarregadorDadosDaSessao(pool);

// Guarda um alerta para a próxima página HTML (padrão "flash": redireciona e mostra uma vez).
export const definirAlerta = (req, alerta) => {
    if (req.session) req.session.alerta = alerta;
};
