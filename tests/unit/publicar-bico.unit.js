// Testes unitários da publicação do bico: corpo ausente e data do serviço.
// Não acessam o banco nem a internet: o controller recebe um banco e uma consulta de CEP falsos.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarCadastradorBico } = await import('../../controllers/bicoController.js');
const { hojeEmSaoPaulo, dataServicoNoPassado } = await import('../../validations/bicoValidation.js');
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

// 17/11/2026, 23h30 em São Paulo (já é dia 18 em UTC).
const AGORA = new Date('2026-11-18T02:30:00Z');

const corpoValido = (extra = {}) => ({
    titulo: 'Montagem de móveis',
    descricao: 'Montar dois armários e uma cama.',
    valor: '150.00',
    data_servico: '2026-11-20',
    horario: '09:00',
    cep: '01310-100',
    numero: '1578',
    ...extra
});

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
    await criarCadastradorBico(banco, buscarCep, () => AGORA)({ body: corpo, session: { usuario: { id: 1 } } }, res);
    return { res, insercoes };
};

describe('publicar bico', () => {
    test('requisição sem corpo: 400 com a mensagem do formulário, sem gravar', async () => {
        const { res, insercoes } = await publicar(undefined);

        assert.equal(res.statusCode, 400);
        assert.equal(res.dados.erro, 'O título deve ter entre 3 e 100 caracteres.');
        assert.equal(insercoes.length, 0);
    });

    test('data no passado: 400, sem gravar, e o formulário volta com a data mínima', async () => {
        const { res, insercoes } = await publicar(corpoValido({ data_servico: '2026-11-16' }));

        assert.equal(res.statusCode, 400);
        assert.equal(res.dados.erro, 'A data do serviço não pode estar no passado.');
        assert.equal(res.dados.dataMinima, '2026-11-17');
        assert.equal(insercoes.length, 0);
    });

    test('data de hoje (fuso de São Paulo) é aceita', async () => {
        const { res, insercoes } = await publicar(corpoValido({ data_servico: '2026-11-17' }));

        assert.equal(res.statusCode, 302);
        assert.equal(insercoes.length, 1);
    });
});

describe('data do serviço no fuso de São Paulo', () => {
    test('"hoje" não vira o dia seguinte antes da meia-noite local', () => {
        assert.equal(hojeEmSaoPaulo(AGORA), '2026-11-17');
        assert.equal(dataServicoNoPassado('2026-11-17', AGORA), false);
        assert.equal(dataServicoNoPassado('2000-01-01', AGORA), true);
    });
});
