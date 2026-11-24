// Testes unitários da publicação do bico: corpo ausente.
// Não acessam o banco nem a internet: o controller recebe um banco e uma consulta de CEP falsos.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarCadastradorBico } = await import('../../controllers/bicoController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const ENDERECO = {
    cep: '01310100',
    logradouro: 'Avenida Paulista',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP'
};

const publicar = async (corpo) => {
    const insercoes = [];
    const banco = {
        query: async (_sql, params) => {
            insercoes.push(params);
            return { affectedRows: 1 };
        }
    };
    const res = {
        statusCode: 200,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        render(_view, dados) {
            this.dados = dados;
            return this;
        },
        redirect(url) {
            this.statusCode = 302;
            this.location = url;
            return this;
        }
    };
    const buscarCep = async () => ({ ...ENDERECO });
    await criarCadastradorBico(banco, buscarCep)({ body: corpo, session: { usuario: { id: 1 } } }, res);
    return { res, insercoes };
};

describe('publicar bico', () => {
    test('requisição sem corpo: 400 com a mensagem do formulário, sem gravar', async () => {
        const { res, insercoes } = await publicar(undefined);

        assert.equal(res.statusCode, 400);
        assert.equal(res.dados.erro, 'O título deve ter entre 3 e 100 caracteres.');
        assert.equal(insercoes.length, 0);
    });
});
