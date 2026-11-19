// Testes unitários do "Membro recente" do perfil privado (cadastro com menos de 30 dias).
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers; apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { cadastroRecente } = await import('../../controllers/perfilController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const AGORA = new Date('2026-11-17T12:00:00');
const diasAtras = (dias) => new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000);

describe('cadastroRecente', () => {
    test('menos de 30 dias é recente', () => {
        assert.equal(cadastroRecente(diasAtras(0), AGORA), true);
        assert.equal(cadastroRecente(diasAtras(29), AGORA), true);
    });

    test('30 dias ou mais não é recente', () => {
        assert.equal(cadastroRecente(diasAtras(30), AGORA), false);
        assert.equal(cadastroRecente(diasAtras(400), AGORA), false);
    });

    test('data ausente ou inválida não é recente', () => {
        assert.equal(cadastroRecente(null, AGORA), false);
        assert.equal(cadastroRecente(undefined, AGORA), false);
        assert.equal(cadastroRecente('não é data', AGORA), false);
    });
});
