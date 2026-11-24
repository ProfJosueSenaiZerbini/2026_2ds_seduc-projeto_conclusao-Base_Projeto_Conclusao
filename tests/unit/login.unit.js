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
