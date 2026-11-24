// Teste unitário do gerenciamento com id inválido. Não acessa o banco: a recusa acontece antes da consulta.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { exibirGerenciamentoBico } = await import('../../controllers/bicoController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

describe('gerenciar bico com id inválido', () => {
    for (const id of ['abc', '1abc', '-1', '1.5']) {
        test(`"${id}": 404, sem consultar o banco`, async (t) => {
            const consulta = t.mock.method(pool, 'query', async () => []);
            const res = {
                status(codigo) {
                    this.statusCode = codigo;
                    return this;
                },
                send(texto) {
                    this.corpo = texto;
                    return this;
                }
            };

            await exibirGerenciamentoBico({ params: { id }, session: { usuario: { id: 1 } } }, res);

            assert.equal(res.statusCode, 404);
            assert.equal(consulta.mock.callCount(), 0);
        });
    }
});
