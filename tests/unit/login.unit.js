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

// ------------------------------------------------- mensagem única e limite de tentativas (#160)
const { MENSAGEM_LOGIN_INVALIDO, MENSAGEM_LOGIN_BLOQUEADO } = await import('../../controllers/authController.js');
const { criarLimitadorTentativas, MAXIMO_TENTATIVAS_LOGIN, JANELA_TENTATIVAS_LOGIN_MS } =
    await import('../../services/limiteTentativas.js');

// Relógio controlado pelo teste.
const criarRelogio = () => {
    let instante = 1_000_000;
    return { agora: () => instante, avancar: (ms) => (instante += ms) };
};

// Banco falso: só a conta ana@exemplo.com existe. Conta as consultas.
const criarBancoLogin = () => {
    const banco = {
        consultas: 0,
        query: async (_sql, [email]) => {
            banco.consultas += 1;
            return email === 'ana@exemplo.com' ? [{ ...usuarioDoBanco }] : [];
        }
    };
    return banco;
};

// Hasher que registra cada comparação.
const criarHasherEspiao = () => {
    const comparacoes = [];
    return {
        comparacoes,
        compare: async (senha, hash) => {
            comparacoes.push(hash);
            return hasherFalso.compare(senha, hash);
        }
    };
};

const tentarLogin = async ({ banco, hasher = hasherFalso, limitador, email, senha, ip = '9.9.9.9' }) => {
    const res = criarRespostaLogin();
    await criarAutenticadorUsuario(
        banco,
        hasher,
        limitador
    )({ body: { email, senha }, session: criarSessaoFalsa(), ip }, res);
    return res;
};

describe('login não revela quais e-mails têm conta (#160)', () => {
    test('e-mail sem conta e senha errada têm a mesma resposta', async () => {
        const limitador = criarLimitadorTentativas();
        const banco = criarBancoLogin();

        const semConta = await tentarLogin({ banco, limitador, email: 'nao@exemplo.com', senha: 'certa1' });
        const senhaErrada = await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'errada1' });

        assert.equal(semConta.statusCode, 400);
        assert.equal(senhaErrada.statusCode, 400);
        assert.equal(semConta.dados.erro, MENSAGEM_LOGIN_INVALIDO);
        assert.deepEqual(semConta.dados, senhaErrada.dados);
    });

    test('e-mail sem conta também compara a senha (com um hash falso), para gastar o mesmo tempo', async () => {
        const hasher = criarHasherEspiao();

        await tentarLogin({
            banco: criarBancoLogin(),
            hasher,
            limitador: criarLimitadorTentativas(),
            email: 'nao@exemplo.com',
            senha: 'certa1'
        });

        assert.equal(hasher.comparacoes.length, 1);
        assert.match(hasher.comparacoes[0], /^\$2[aby]\$10\$/, 'compara com um hash bcrypt de mesmo custo');
    });

    test('perfil trocado continua com a mensagem própria (só aparece com a senha certa)', async () => {
        const res = criarRespostaLogin();
        await criarAutenticadorUsuario(
            criarBancoLogin(),
            hasherFalso,
            criarLimitadorTentativas()
        )(
            {
                body: { email: 'ana@exemplo.com', senha: 'certa1', tipoPerfil: 'trabalhador' },
                session: criarSessaoFalsa(),
                ip: '9.9.9.9'
            },
            res
        );

        assert.equal(res.statusCode, 400);
        assert.match(res.dados.erro, /Sua conta está cadastrada como Contratante/);
    });
});

describe('limite de tentativas de login (#160)', () => {
    test(`depois de ${MAXIMO_TENTATIVAS_LOGIN} falhas, bloqueia com 429 sem consultar o banco`, async () => {
        const limitador = criarLimitadorTentativas();
        const banco = criarBancoLogin();

        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN; i++) {
            const res = await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'errada1' });
            assert.equal(res.statusCode, 400, `tentativa ${i + 1}`);
        }
        const consultasAntes = banco.consultas;

        const bloqueada = await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'certa1' });

        assert.equal(bloqueada.statusCode, 429);
        assert.equal(bloqueada.dados.erro, MENSAGEM_LOGIN_BLOQUEADO);
        assert.equal(banco.consultas, consultasAntes, 'nem consulta o banco');
    });

    test('e-mails sem conta também contam (senão daria para testar e-mails à vontade)', async () => {
        const limitador = criarLimitadorTentativas();
        const banco = criarBancoLogin();

        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN; i++) {
            await tentarLogin({ banco, limitador, email: 'nao@exemplo.com', senha: 'qualquer1' });
        }
        const res = await tentarLogin({ banco, limitador, email: 'nao@exemplo.com', senha: 'qualquer1' });

        assert.equal(res.statusCode, 429);
    });

    test('o bloqueio vale para o mesmo IP e e-mail; outro IP ou outro e-mail seguem livres', async () => {
        const limitador = criarLimitadorTentativas();
        const banco = criarBancoLogin();

        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN; i++) {
            await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'errada1', ip: '1.1.1.1' });
        }

        const outroIp = await tentarLogin({
            banco,
            limitador,
            email: 'ana@exemplo.com',
            senha: 'certa1',
            ip: '2.2.2.2'
        });
        const outroEmail = await tentarLogin({ banco, limitador, email: 'nao@exemplo.com', senha: 'x', ip: '1.1.1.1' });

        assert.equal(outroIp.destino, '/homeContratante');
        assert.equal(outroEmail.statusCode, 400);
    });

    test('o bloqueio acaba quando a janela de 15 minutos vence', async () => {
        const relogio = criarRelogio();
        const limitador = criarLimitadorTentativas({ agora: relogio.agora });
        const banco = criarBancoLogin();

        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN; i++) {
            await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'errada1' });
        }
        relogio.avancar(JANELA_TENTATIVAS_LOGIN_MS - 1);
        assert.equal(
            (await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'certa1' })).statusCode,
            429
        );

        relogio.avancar(1);
        const liberado = await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'certa1' });
        assert.equal(liberado.destino, '/homeContratante');
    });

    test('login certo zera o contador de falhas', async () => {
        const limitador = criarLimitadorTentativas();
        const banco = criarBancoLogin();

        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN - 1; i++) {
            await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'errada1' });
        }
        await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'certa1' });
        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN - 1; i++) {
            await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'errada1' });
        }

        const res = await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'certa1' });
        assert.equal(res.destino, '/homeContratante', 'as falhas de antes do login certo não contam');
    });

    test('campos vazios ou inválidos não contam como tentativa', async () => {
        const limitador = criarLimitadorTentativas();
        const banco = criarBancoLogin();

        for (let i = 0; i < MAXIMO_TENTATIVAS_LOGIN + 2; i++) {
            await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: '' });
        }

        const res = await tentarLogin({ banco, limitador, email: 'ana@exemplo.com', senha: 'certa1' });
        assert.equal(res.destino, '/homeContratante');
    });
});
