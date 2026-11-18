// Testes unitários dos indicadores de reputação (perfil público). Não acessam o banco real.
// Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { calcularTaxaConclusao, montarDistribuicao, montarReputacao, buscarReputacao } =
    await import('../../controllers/reputacao.js');

describe('taxa de conclusão', () => {
    test('concluídos ÷ (concluídos + cancelados depois do aceite), arredondada', () => {
        assert.equal(calcularTaxaConclusao(2, 1), 67);
        assert.equal(calcularTaxaConclusao(3, 1), 75);
        assert.equal(calcularTaxaConclusao(5, 0), 100);
        assert.equal(calcularTaxaConclusao(0, 2), 0);
        assert.equal(calcularTaxaConclusao(1, 1), 50);
    });

    test('sem nenhum bico nessas situações não há histórico suficiente (null)', () => {
        assert.equal(calcularTaxaConclusao(0, 0), null);
        assert.equal(calcularTaxaConclusao(undefined, undefined), null);
        assert.equal(calcularTaxaConclusao(null, null), null);
    });

    test('aceita números vindos do banco como texto ou BigInt', () => {
        assert.equal(calcularTaxaConclusao('3', '1'), 75);
        assert.equal(calcularTaxaConclusao(3n, 1n), 75);
    });
});

describe('distribuição das notas', () => {
    test('barras de 5★ a 1★ com quantidade e percentual; média com 1 casa', () => {
        const d = montarDistribuicao([
            { nota: 5, total: 3n },
            { nota: 4, total: 1n },
            { nota: 1, total: 0 }
        ]);
        assert.equal(d.total, 4);
        assert.equal(d.media, 4.8); // (15 + 4) / 4 = 4,75 → 4,8
        assert.deepEqual(
            d.barras.map((b) => [b.estrelas, b.quantidade, b.percentual]),
            [
                [5, 3, 75],
                [4, 1, 25],
                [3, 0, 0],
                [2, 0, 0],
                [1, 0, 0]
            ]
        );
    });

    test('notas 4 e 5 dão média 4,5', () => {
        assert.equal(
            montarDistribuicao([
                { nota: 5, total: 1 },
                { nota: 4, total: 1 }
            ]).media,
            4.5
        );
    });

    test('sem avaliações: média nula, total 0 e todas as barras zeradas (não parece "ruim")', () => {
        const d = montarDistribuicao([]);
        assert.equal(d.total, 0);
        assert.equal(d.media, null);
        assert.equal(d.barras.length, 5);
        assert.ok(d.barras.every((b) => b.quantidade === 0 && b.percentual === 0));
    });
});

describe('montarReputacao', () => {
    const contratante = {
        publicados: 6n,
        concluidos: '2',
        cancelados_apos_aceite: '1',
        cancelados_antes: '1',
        ultimo_servico: new Date('2026-11-17T12:00:00')
    };

    test('contratante: publicados, concluídos, cancelados (depois e antes do aceite), taxa e último serviço', () => {
        const r = montarReputacao('contratante', [{ nota: 3, total: 1 }], contratante);
        assert.equal(r.publicados, 6);
        assert.equal(r.concluidos, 2);
        assert.equal(r.canceladosAposAceite, 1);
        assert.equal(r.canceladosAntesDoAceite, 1);
        assert.equal(r.taxaConclusao, 67);
        assert.equal(r.media, 3);
        assert.equal(r.totalAvaliacoes, 1);
        assert.equal(r.ultimoServico, '17/11/2026');
    });

    test('contratante novo (sem nada): zeros, sem taxa, sem último serviço e sem média', () => {
        const r = montarReputacao('contratante', [], {});
        assert.deepEqual(
            [
                r.publicados,
                r.concluidos,
                r.canceladosAposAceite,
                r.canceladosAntesDoAceite,
                r.taxaConclusao,
                r.ultimoServico,
                r.media
            ],
            [0, 0, 0, 0, null, null, null]
        );
    });

    test('contratante só com bicos cancelados antes do aceite continua sem histórico suficiente', () => {
        const r = montarReputacao('contratante', [], { publicados: 2, cancelados_antes: 2 });
        assert.equal(r.taxaConclusao, null);
        assert.equal(r.canceladosAntesDoAceite, 2);
    });

    test('trabalhador: concluídos e em andamento; cancelamentos (feitos só pelo contratante) não entram', () => {
        const r = montarReputacao(
            'trabalhador',
            [
                { nota: 5, total: 1 },
                { nota: 4, total: 1 }
            ],
            {
                concluidos: 2,
                em_andamento: 1,
                ultimo_servico: new Date('2026-11-10T09:00:00')
            }
        );
        assert.equal(r.concluidos, 2);
        assert.equal(r.emAndamento, 1);
        assert.equal(r.taxaConclusao, null);
        assert.equal(r.media, 4.5);
        assert.equal(r.ultimoServico, '10/11/2026');
        assert.equal('canceladosAposAceite' in r, false);
    });

    test('trabalhador novo: zeros e "Nenhum serviço" (ultimoServico nulo)', () => {
        const r = montarReputacao('trabalhador', [], { concluidos: null, em_andamento: null, ultimo_servico: null });
        assert.deepEqual(
            [r.concluidos, r.emAndamento, r.ultimoServico, r.media, r.totalAvaliacoes],
            [0, 0, null, null, 0]
        );
    });
});

describe('buscarReputacao (poucas consultas, sem N+1)', () => {
    const bancoFalso = (retornos) => {
        const consultas = [];
        return {
            consultas,
            query: async (sql, params) => {
                consultas.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
                return retornos.shift();
            }
        };
    };

    test('contratante: 2 consultas (notas agrupadas e contadores de bicos)', async () => {
        const banco = bancoFalso([
            [{ nota: 5, total: 1 }],
            [{ publicados: 3, concluidos: 1, cancelados_apos_aceite: 1, cancelados_antes: 1, ultimo_servico: null }]
        ]);
        const r = await buscarReputacao(banco, 42, 'contratante');
        assert.equal(banco.consultas.length, 2);
        assert.match(banco.consultas[0].sql, /GROUP BY nota/);
        assert.match(banco.consultas[1].sql, /ESTORNO/);
        assert.match(banco.consultas[1].sql, /b\.contratante_id = \?/);
        assert.deepEqual(
            banco.consultas.map((c) => c.params),
            [[42], [42]]
        );
        assert.equal(r.taxaConclusao, 50);
    });

    test('trabalhador: 2 consultas e filtra por trabalhador_id', async () => {
        const banco = bancoFalso([[], [{ concluidos: 0, em_andamento: 0, ultimo_servico: null }]]);
        const r = await buscarReputacao(banco, 7, 'trabalhador');
        assert.equal(banco.consultas.length, 2);
        assert.match(banco.consultas[1].sql, /b\.trabalhador_id = \?/);
        assert.equal(r.media, null);
        assert.equal(r.concluidos, 0);
    });
});
