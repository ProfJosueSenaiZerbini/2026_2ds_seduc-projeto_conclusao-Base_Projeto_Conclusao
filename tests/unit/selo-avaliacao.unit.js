// Testes unitários do selo de avaliação (cards de bicos concluídos) e da contagem de bicos a avaliar.
// Não acessam o banco. Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { montarSeloAvaliacao, contarBicosParaAvaliar, PRAZO_AVALIACAO_DIAS } = await import('../../controllers/avaliacaoRegras.js');

const AGORA = new Date('2026-11-17T12:00:00');
const diasAtras = (dias) => new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000);

describe('selo de avaliação', () => {
    test('já avaliou: "Avaliado ★N", mesmo com o prazo encerrado', () => {
        assert.deepEqual(montarSeloAvaliacao(4, diasAtras(1), 'Avaliar', AGORA), { tipo: 'avaliado', texto: 'Avaliado ★4' });
        assert.deepEqual(montarSeloAvaliacao('5', diasAtras(30), 'Avaliar', AGORA), { tipo: 'avaliado', texto: 'Avaliado ★5' });
    });

    test('sem avaliação e dentro do prazo: convite para avaliar (texto conforme o perfil)', () => {
        assert.deepEqual(montarSeloAvaliacao(null, diasAtras(2), 'Avaliar', AGORA), { tipo: 'avaliar', texto: 'Avaliar' });
        assert.deepEqual(montarSeloAvaliacao(undefined, diasAtras(2), 'Avaliar contratante', AGORA), { tipo: 'avaliar', texto: 'Avaliar contratante' });
    });

    test('sem avaliação e fora do prazo: "Prazo encerrado"', () => {
        assert.deepEqual(montarSeloAvaliacao(null, diasAtras(PRAZO_AVALIACAO_DIAS + 1), 'Avaliar', AGORA), { tipo: 'encerrado', texto: 'Prazo encerrado' });
    });
});

describe('contagem de bicos para avaliar', () => {
    test('usa o papel e o id do usuário, a regra do prazo e devolve um número', async () => {
        const consultas = [];
        const banco = { query: async (sql, params) => { consultas.push({ sql, params }); return [{ total: 3n }]; } };

        assert.equal(await contarBicosParaAvaliar(banco, 'trabalhador_id', 20), 3);
        assert.match(consultas[0].sql, /b\.trabalhador_id = \?/);
        assert.match(consultas[0].sql, /NOT EXISTS/);
        assert.match(consultas[0].sql, /DATE_ADD\(.*INTERVAL \? DAY\) > NOW\(\)/s);
        assert.deepEqual(consultas[0].params, [20, 20, PRAZO_AVALIACAO_DIAS]);
    });

    test('recusa um papel desconhecido (evita SQL montado com valor externo)', async () => {
        await assert.rejects(() => contarBicosParaAvaliar({ query: async () => [] }, 'id; DROP TABLE bicos', 1), /Papel inválido/);
    });
});
