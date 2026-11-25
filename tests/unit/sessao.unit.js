// Testes unitários da troca de senha encerrando as outras sessões da conta (#162): a versão da senha gravada
// no login é conferida a cada requisição (carregarDadosDaSessao) e renovada na troca de senha.
// Não acessam o banco: banco e sessão falsos em memória.
// Executar com: npm run test:unit
import { test, describe, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarCarregadorDadosDaSessao, MENSAGEM_SESSAO_ENCERRADA } =
    await import('../../middleware/sessaoMiddleware.js');
const { criarAtualizadorSenha } = await import('../../controllers/perfilController.js');
const { versaoDaSenha } = await import('../../services/sessaoService.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const USUARIO_ID = 3;
const HASH_ANTIGO = '$2b$10$hashantigoaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HASH_NOVO = '$2b$10$hashnovobbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

// Sessão falsa: regenerate troca o id e apaga os dados, como o express-session.
const criarSessao = ({ versaoSenha = versaoDaSenha(HASH_ANTIGO), falharRegenerate = false } = {}) => ({
    id: 'id-original',
    regeneracoes: 0,
    usuario: { id: USUARIO_ID, nome: 'Ana', tipo_perfil: 'Contratante', saldo_simulado: 10 },
    versaoSenha,
    regenerate(callback) {
        if (falharRegenerate) return callback(new Error('falha no store'));
        for (const chave of Object.keys(this)) {
            if (typeof this[chave] !== 'function' && chave !== 'regeneracoes') delete this[chave];
        }
        this.regeneracoes += 1;
        this.id = `id-novo-${this.regeneracoes}`;
        return callback();
    }
});

const criarReq = (session) => ({ method: 'GET', path: '/homeContratante', headers: {}, session });

const rodarMiddleware = async (banco, session) => {
    const req = criarReq(session);
    const res = { locals: { usuario: session.usuario } };
    let chamouNext = 0;
    await criarCarregadorDadosDaSessao(banco)(req, res, () => {
        chamouNext += 1;
    });
    return { req, res, chamouNext };
};

const bancoComSenha = (senha, saldo = '25.50') => ({
    query: async () => (senha === null ? [] : [{ saldo_simulado: saldo, senha }])
});

describe('cada requisição confere a versão da senha (#162)', () => {
    test('senha igual à do login: segue logado e atualiza o saldo, como antes', async () => {
        const sessao = criarSessao();
        const { res, chamouNext } = await rodarMiddleware(bancoComSenha(HASH_ANTIGO), sessao);

        assert.equal(chamouNext, 1);
        assert.equal(sessao.regeneracoes, 0);
        assert.equal(sessao.usuario.id, USUARIO_ID);
        assert.equal(sessao.usuario.saldo_simulado, 25.5);
        assert.equal(res.locals.saldoAtual, 25.5);
    });

    test('senha trocada em outra sessão: esta sessão perde o usuário e ganha o aviso', async () => {
        const sessao = criarSessao();
        const { res, chamouNext } = await rodarMiddleware(bancoComSenha(HASH_NOVO), sessao);

        assert.equal(chamouNext, 1);
        assert.equal(sessao.regeneracoes, 1, 'a sessão é renovada');
        assert.equal(sessao.usuario, undefined, 'sem usuário, o requireAuth manda para o login');
        assert.equal(sessao.versaoSenha, undefined);
        assert.equal(res.locals.usuario, null);
        assert.deepEqual(sessao.alerta, { tipo: 'erro', mensagem: MENSAGEM_SESSAO_ENCERRADA });
    });

    test('sessão sem versão da senha também é encerrada', async () => {
        const sessao = criarSessao();
        delete sessao.versaoSenha;
        await rodarMiddleware(bancoComSenha(HASH_ANTIGO), sessao);

        assert.equal(sessao.usuario, undefined);
    });

    test('conta que não existe mais: sessão encerrada', async () => {
        const sessao = criarSessao();
        await rodarMiddleware(bancoComSenha(null), sessao);

        assert.equal(sessao.usuario, undefined);
    });

    test('se o store falhar ao renovar, o usuário sai da sessão mesmo assim', async () => {
        mock.method(console, 'error', () => {});
        const sessao = criarSessao({ falharRegenerate: true });
        const { chamouNext } = await rodarMiddleware(bancoComSenha(HASH_NOVO), sessao);

        assert.equal(chamouNext, 1);
        assert.equal(sessao.usuario, undefined);
        assert.equal(sessao.versaoSenha, undefined);
        mock.restoreAll();
    });

    test('erro de banco: a página segue com a sessão, como antes', async () => {
        mock.method(console, 'error', () => {});
        const sessao = criarSessao();
        const banco = {
            query: async () => {
                throw Object.assign(new Error('fora do ar'), { code: 'ECONNREFUSED' });
            }
        };
        const { chamouNext } = await rodarMiddleware(banco, sessao);

        assert.equal(chamouNext, 1);
        assert.equal(sessao.usuario.id, USUARIO_ID);
        mock.restoreAll();
    });

    test('sem usuário na sessão: não consulta o banco', async () => {
        let consultas = 0;
        const banco = {
            query: async () => {
                consultas += 1;
                return [];
            }
        };
        const sessao = criarSessao();
        delete sessao.usuario;
        await rodarMiddleware(banco, sessao);

        assert.equal(consultas, 0);
    });
});

// ------------------------------------------------------------------ troca de senha
const hasherFalso = {
    compare: async (senha, hash) => hash === HASH_ANTIGO && senha === 'antiga1',
    hash: async () => HASH_NOVO
};

const bancoDaTroca = () => {
    const banco = {
        atualizacoes: [],
        query: async (sql, params) => {
            if (/^SELECT senha FROM usuarios/.test(sql)) return [{ senha: HASH_ANTIGO }];
            banco.atualizacoes.push(params);
            return { affectedRows: 1 };
        }
    };
    return banco;
};

const trocarSenha = async (banco, sessao, senhaAtual = 'antiga1') => {
    const res = {
        statusCode: 200,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        send(corpo) {
            this.corpo = corpo;
            return this;
        },
        redirect(destino) {
            this.destino = destino;
            return this;
        }
    };
    await criarAtualizadorSenha(banco, hasherFalso)(
        { session: sessao, body: { senhaAtual, novaSenha: 'nova123', confirmarNovaSenha: 'nova123' } },
        res
    );
    return res;
};

describe('trocar a senha (#162)', () => {
    test('renova a sessão atual, mantém o usuário logado e grava a versão nova', async () => {
        const sessao = criarSessao();
        const banco = bancoDaTroca();
        const res = await trocarSenha(banco, sessao);

        assert.equal(res.destino, '/perfil');
        assert.deepEqual(banco.atualizacoes, [[HASH_NOVO, USUARIO_ID]]);
        assert.equal(sessao.regeneracoes, 1);
        assert.notEqual(sessao.id, 'id-original');
        assert.equal(sessao.usuario.id, USUARIO_ID, 'quem trocou a senha continua logado');
        assert.equal(sessao.versaoSenha, versaoDaSenha(HASH_NOVO));

        // A própria sessão passa na conferência; uma sessão aberta antes da troca, não.
        const mesma = await rodarMiddleware(bancoComSenha(HASH_NOVO), sessao);
        assert.equal(mesma.req.session.usuario.id, USUARIO_ID);
        const outra = criarSessao();
        await rodarMiddleware(bancoComSenha(HASH_NOVO), outra);
        assert.equal(outra.usuario, undefined);
    });

    test('senha atual errada: não grava nem renova a sessão', async () => {
        const sessao = criarSessao();
        const banco = bancoDaTroca();
        const res = await trocarSenha(banco, sessao, 'errada1');

        assert.equal(res.statusCode, 401);
        assert.deepEqual(banco.atualizacoes, []);
        assert.equal(sessao.regeneracoes, 0);
        assert.equal(sessao.versaoSenha, versaoDaSenha(HASH_ANTIGO));
    });
});
