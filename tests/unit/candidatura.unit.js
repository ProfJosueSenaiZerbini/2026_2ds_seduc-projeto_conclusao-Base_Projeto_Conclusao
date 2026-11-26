// Testes unitários da mensagem da candidatura. Não acessam o banco: a recusa acontece antes da conexão.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { candidatarAoBico } = await import('../../controllers/bicoController.js');
const { validarMensagemCandidatura, normalizarMensagemCandidatura } =
    await import('../../validations/bicoValidation.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

describe('mensagem da candidatura', () => {
    test('é opcional e aceita até 500 caracteres', () => {
        assert.equal(validarMensagemCandidatura(undefined), true);
        assert.equal(validarMensagemCandidatura(''), true);
        assert.equal(validarMensagemCandidatura(`  ${'a'.repeat(500)}  `), true);
        assert.equal(validarMensagemCandidatura('a'.repeat(501)), false);
    });

    test('quebra de linha CRLF conta como um caractere', () => {
        const mensagem = `${'a'.repeat(249)}\r\n${'b'.repeat(250)}`;

        assert.equal(validarMensagemCandidatura(mensagem), true);
        assert.equal([...normalizarMensagemCandidatura(mensagem)].length, 500);
    });

    test('acima do limite o controller responde 400 sem acessar o banco', async () => {
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

        await candidatarAoBico(
            { body: { bico_id: '1', mensagem: 'a'.repeat(501) }, session: { usuario: { id: 2 } } },
            res
        );

        assert.equal(res.statusCode, 400);
        assert.equal(res.corpo, 'A mensagem da candidatura deve ter no máximo 500 caracteres.');
    });
});
