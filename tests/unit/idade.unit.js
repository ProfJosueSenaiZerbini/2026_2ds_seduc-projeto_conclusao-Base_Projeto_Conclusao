// Testes unitários da regra de idade (18 a 90 anos, inclusive).
// Não acessam o banco: os controllers recebem um banco falso em memória.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A pool do MariaDB é criada ao importar os controllers. Apontamos para uma porta fechada
// para garantir que nenhum banco real seja contatado durante os testes.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { validarIdade, IDADE_MINIMA, IDADE_MAXIMA } = await import('../../validations/usuarioValidation.js');
const { criarCadastradorUsuario } = await import('../../controllers/authController.js');
const { criarAtualizadorPerfil } = await import('../../controllers/perfilController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

// Banco falso: registra as consultas e responde vazio (nenhum e-mail/CPF duplicado).
const criarBancoFalso = () => {
    const consultas = [];
    return {
        consultas,
        query: async (sql, params) => {
            consultas.push({ sql, params });
            return [];
        }
    };
};

const hasherFalso = {
    genSalt: async () => 'salt',
    hash: async () => 'hash-falso'
};

// Resposta falsa do Express: guarda status, render, send e redirect.
const criarRespostaFalsa = () => {
    const res = { statusCode: 200 };
    res.status = (codigo) => { res.statusCode = codigo; return res; };
    res.render = (view, locais) => { res.view = view; res.locais = locais; return res; };
    res.send = (corpo) => { res.corpo = corpo; return res; };
    res.redirect = (url) => { res.redirecionadoPara = url; return res; };
    return res;
};

const corpoCadastro = (idade) => ({
    nome: 'Maria Teste',
    email: 'maria.teste@exemplo.com',
    cpf: '529.982.247-25',
    idade,
    senha: 'senha123',
    confirmarSenha: 'senha123',
    tipoPerfil: 'trabalhador',
    termos: 'on',
    maiorIdade: 'true'
});

const insertUsuario = (banco) => banco.consultas.find((c) => /INSERT INTO usuarios/i.test(c.sql));
const updatePerfil = (banco) => banco.consultas.find((c) => /UPDATE usuarios SET nome/i.test(c.sql));

describe('validarIdade', () => {
    test('usa o mesmo intervalo do CHECK do schema.sql', () => {
        const schema = readFileSync(new URL('../../schema.sql', import.meta.url), 'utf8');
        const check = schema.match(/chk_usuarios_idade CHECK \(idade BETWEEN (\d+) AND (\d+)\)/);
        assert.ok(check, 'CHECK chk_usuarios_idade não encontrado no schema.sql');
        assert.equal(Number(check[1]), IDADE_MINIMA);
        assert.equal(Number(check[2]), IDADE_MAXIMA);
        assert.equal(IDADE_MINIMA, 18);
        assert.equal(IDADE_MAXIMA, 90);
    });

    for (const [idade, esperado] of [[17, false], [18, true], [90, true], [91, false]]) {
        test(`${idade} anos (número e texto) → ${esperado ? 'aceita' : 'rejeita'}`, () => {
            assert.equal(validarIdade(idade), esperado);
            assert.equal(validarIdade(String(idade)), esperado);
        });
    }

    test('rejeita valores que não são idade inteira', () => {
        for (const valor of ['', '  ', 'abc', '2e1', '0x14', '18.5', '-20', 18.5, NaN, null, undefined, {}]) {
            assert.equal(validarIdade(valor), false, `deveria rejeitar ${JSON.stringify(valor)}`);
        }
    });
});

describe('cadastro (criarCadastradorUsuario)', () => {
    for (const idade of ['17', '91']) {
        test(`${idade} anos: rejeitado, sem gravar no banco`, async () => {
            const banco = criarBancoFalso();
            const res = criarRespostaFalsa();
            await criarCadastradorUsuario(banco, hasherFalso)({ body: corpoCadastro(idade) }, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.view, 'cadastrar');
            assert.match(res.locais.erro, /entre 18 e 90 anos/);
            assert.equal(res.locais.dados.idade, idade, 'a idade digitada volta para o formulário');
            assert.equal(insertUsuario(banco), undefined);
        });
    }

    for (const idade of ['18', '90']) {
        test(`${idade} anos: aceito e gravado com a idade informada`, async () => {
            const banco = criarBancoFalso();
            const res = criarRespostaFalsa();
            await criarCadastradorUsuario(banco, hasherFalso)({ body: corpoCadastro(idade) }, res);

            assert.equal(res.redirecionadoPara, '/login');
            const insert = insertUsuario(banco);
            assert.ok(insert, 'INSERT em usuarios não foi executado');
            assert.equal(insert.params[3], Number(idade));
        });
    }

    test('idade ausente: rejeitado', async () => {
        const banco = criarBancoFalso();
        const res = criarRespostaFalsa();
        const corpo = corpoCadastro(undefined);
        delete corpo.idade;
        await criarCadastradorUsuario(banco, hasherFalso)({ body: corpo }, res);

        assert.equal(res.statusCode, 400);
        assert.equal(insertUsuario(banco), undefined);
    });
});

describe('edição de perfil (criarAtualizadorPerfil)', () => {
    const requisicao = (idade) => ({
        session: { usuario: { id: 1, nome: 'Maria Teste', email: 'maria.teste@exemplo.com', idade: 30 } },
        body: { nome: 'Maria Teste', email: 'maria.teste@exemplo.com', idade }
    });

    for (const idade of ['17', '91']) {
        test(`${idade} anos: rejeitado, sem gravar no banco`, async () => {
            const banco = criarBancoFalso();
            const res = criarRespostaFalsa();
            const req = requisicao(idade);
            await criarAtualizadorPerfil(banco)(req, res);

            assert.equal(res.statusCode, 400);
            assert.match(res.corpo, /entre 18 e 90 anos/);
            assert.equal(updatePerfil(banco), undefined);
            assert.equal(req.session.usuario.idade, 30, 'a sessão não muda');
        });
    }

    for (const idade of ['18', '90']) {
        test(`${idade} anos: aceito e gravado`, async () => {
            const banco = criarBancoFalso();
            const res = criarRespostaFalsa();
            const req = requisicao(idade);
            await criarAtualizadorPerfil(banco)(req, res);

            assert.equal(res.redirecionadoPara, '/perfil');
            const update = updatePerfil(banco);
            assert.ok(update, 'UPDATE em usuarios não foi executado');
            assert.equal(update.params[2], Number(idade));
            assert.equal(req.session.usuario.idade, Number(idade));
        });
    }
});
