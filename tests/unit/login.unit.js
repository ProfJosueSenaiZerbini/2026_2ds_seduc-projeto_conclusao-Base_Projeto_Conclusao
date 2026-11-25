// Testes unitários do login com campos de tipo inesperado. Não acessam o banco: o controller recebe um banco falso.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarAutenticadorUsuario } = await import('../../controllers/authController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

describe('login', () => {
    for (const tipoPerfil of [1, 0, ['contratante'], { a: 1 }]) {
        test(`tipoPerfil ${JSON.stringify(tipoPerfil)}: 400, sem consultar o banco`, async () => {
            let consultas = 0;
            const banco = {
                query: async () => {
                    consultas += 1;
                    return [];
                }
            };
            const res = {
                status(codigo) {
                    this.statusCode = codigo;
                    return this;
                },
                render(_view, dados) {
                    this.dados = dados;
                    return this;
                }
            };

            await criarAutenticadorUsuario(banco)(
                { body: { email: 'a@b.com', senha: 'segredo1', tipoPerfil }, session: {} },
                res
            );

            assert.equal(res.statusCode, 400);
            assert.equal(res.dados.erro, 'Tipo de usuário inválido.');
            assert.equal(consultas, 0);
        });
    }
});

// ------------------------------------------------------------ sessão no login (#161)
const { versaoDaSenha } = await import('../../services/sessaoService.js');

const HASH_DA_SENHA = '$2b$10$hashfalsodasenhacertaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const hasherFalso = { compare: async (senha, hash) => hash === HASH_DA_SENHA && senha === 'certa1' };

// Sessão falsa: regenerate troca o id e apaga os dados, como o express-session.
const criarSessaoFalsa = ({ falharRegenerate = false } = {}) => {
    const sessao = {
        id: 'id-plantado',
        regeneracoes: 0,
        regenerate(callback) {
            if (falharRegenerate) return callback(new Error('falha no store'));
            for (const chave of Object.keys(this)) {
                if (typeof this[chave] !== 'function' && chave !== 'regeneracoes') delete this[chave];
            }
            this.regeneracoes += 1;
            this.id = `id-novo-${this.regeneracoes}`;
            return callback();
        }
    };
    return sessao;
};

const criarRespostaLogin = () => {
    const res = { statusCode: 200, destino: null, dados: null, corpo: null };
    res.status = (codigo) => {
        res.statusCode = codigo;
        return res;
    };
    res.render = (_view, dados) => {
        res.dados = dados;
        return res;
    };
    res.redirect = (destino) => {
        res.destino = destino;
        return res;
    };
    res.send = (corpo) => {
        res.corpo = corpo;
        return res;
    };
    return res;
};

const usuarioDoBanco = {
    id: 3,
    nome: 'Ana',
    email: 'ana@exemplo.com',
    cpf: '00000000000',
    senha: HASH_DA_SENHA,
    tipo_perfil: 'Contratante',
    saldo_simulado: '10.00'
};

describe('login renova a sessão (#161)', () => {
    test('login certo troca o id da sessão antes de gravar o usuário e a versão da senha', async () => {
        const sessao = criarSessaoFalsa();
        sessao.lixoPlantado = 'valor do atacante';
        const res = criarRespostaLogin();
        const banco = { query: async () => [{ ...usuarioDoBanco }] };

        await criarAutenticadorUsuario(banco, hasherFalso)(
            { body: { email: 'ana@exemplo.com', senha: 'certa1' }, session: sessao, ip: '1.1.1.1' },
            res
        );

        assert.equal(res.destino, '/homeContratante');
        assert.equal(sessao.regeneracoes, 1);
        assert.notEqual(sessao.id, 'id-plantado', 'o id plantado deixa de valer');
        assert.equal(sessao.lixoPlantado, undefined, 'dados antigos da sessão são descartados');
        assert.equal(sessao.usuario.id, 3);
        assert.equal(sessao.versaoSenha, versaoDaSenha(HASH_DA_SENHA));
        assert.equal(sessao.usuario.senha, undefined, 'o hash da senha não vai para a sessão');
    });

    test('senha errada não renova nem grava nada na sessão', async () => {
        const sessao = criarSessaoFalsa();
        const res = criarRespostaLogin();
        const banco = { query: async () => [{ ...usuarioDoBanco }] };

        await criarAutenticadorUsuario(banco, hasherFalso)(
            { body: { email: 'ana@exemplo.com', senha: 'errada1' }, session: sessao, ip: '1.1.1.2' },
            res
        );

        assert.equal(res.statusCode, 400);
        assert.equal(sessao.regeneracoes, 0);
        assert.equal(sessao.usuario, undefined);
    });

    test('erro ao renovar a sessão: 500 e ninguém fica logado', async () => {
        const erro = console.error;
        console.error = () => {};
        const sessao = criarSessaoFalsa({ falharRegenerate: true });
        const res = criarRespostaLogin();
        const banco = { query: async () => [{ ...usuarioDoBanco }] };

        await criarAutenticadorUsuario(banco, hasherFalso)(
            { body: { email: 'ana@exemplo.com', senha: 'certa1' }, session: sessao, ip: '1.1.1.3' },
            res
        );
        console.error = erro;

        assert.equal(res.statusCode, 500);
        assert.equal(sessao.usuario, undefined);
        assert.equal(sessao.versaoSenha, undefined);
    });
});
