// Testes unitários do cancelamento de bico pelo contratante (POST /bicos/:id/cancelar).
// Não acessam o banco: o controller recebe um banco falso em memória que simula as tabelas.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A pool do MariaDB é criada ao importar os controllers. Apontamos para uma porta fechada
// para garantir que nenhum banco real seja contatado durante os testes.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarCanceladorBico, OBSERVACAO_CANCELAMENTO_BICO } = await import('../../controllers/bicoController.js');
const { default: roteadorBicos } = await import('../../routes/bicoRoutes.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const CONTRATANTE_ID = 10;
const OUTRO_CONTRATANTE_ID = 11;
const TRABALHADOR_ID = 20;
const BICO_ID = 5;
const VALOR = 150;

// Banco falso: guarda o estado das tabelas envolvidas e registra tudo que é executado.
const criarBancoFalso = ({
    bico,
    movimentacoes = [],
    pendentes = [],
    aceitas = [],
    saldoContratante = 0
}) => {
    const estado = {
        bico: bico ? { ...bico } : null,
        movimentacoes: movimentacoes.map((m) => ({ ...m })),
        pendentes: pendentes.map((id) => ({ id })),
        aceitas: aceitas.map((id) => ({ id })),
        saldoContratante,
        candidaturasRecusadas: [],
        historicoCandidaturas: [],
        eventos: [],
        consultas: [],
        transacao: []
    };

    const connection = {
        beginTransaction: async () => { estado.transacao.push('begin'); },
        commit: async () => { estado.transacao.push('commit'); },
        rollback: async () => { estado.transacao.push('rollback'); },
        release: () => { estado.transacao.push('release'); },
        query: async (sql, params = []) => {
            estado.consultas.push({ sql, params });
            const comando = sql.replace(/\s+/g, ' ').trim();

            if (/^SELECT id, contratante_id, trabalhador_id, valor, status FROM bicos/.test(comando)) {
                return estado.bico ? [estado.bico] : [];
            }
            if (/^SELECT id FROM movimentacoes_carteira .*IN \('CREDITO', 'ESTORNO'\)/.test(comando)) {
                return estado.movimentacoes.filter((m) => ['CREDITO', 'ESTORNO'].includes(m.tipo));
            }
            if (/^SELECT usuario_id, valor FROM movimentacoes_carteira .*'RESERVA'/.test(comando)) {
                return estado.movimentacoes.filter((m) => m.tipo === 'RESERVA');
            }
            if (/^SELECT id FROM usuarios/.test(comando)) {
                return [{ id: params[0] }];
            }
            if (/^UPDATE bicos SET status = 'Cancelado'/.test(comando)) {
                const [, contratanteId, statusEsperado] = params;
                if (estado.bico.contratante_id === contratanteId && estado.bico.status === statusEsperado) {
                    estado.bico.status = 'Cancelado';
                    return { affectedRows: 1 };
                }
                return { affectedRows: 0 };
            }
            if (/^UPDATE usuarios SET saldo_simulado = saldo_simulado \+ \?/.test(comando)) {
                estado.saldoContratante += params[0];
                return { affectedRows: 1 };
            }
            if (/^INSERT INTO movimentacoes_carteira/.test(comando)) {
                const [usuarioId, bicoId, valor, descricao] = params;
                const tipo = /'ESTORNO'/.test(comando) ? 'ESTORNO' : 'OUTRO';
                // Simula a restrição UNIQUE (bico_id, tipo_movimentacao).
                if (estado.movimentacoes.some((m) => m.bico_id === bicoId && m.tipo === tipo)) {
                    throw Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });
                }
                estado.movimentacoes.push({ usuario_id: usuarioId, bico_id: bicoId, tipo, valor, descricao });
                return { affectedRows: 1 };
            }
            if (/^SELECT id FROM candidaturas .*status = 'Pendente'/.test(comando)) {
                return estado.pendentes;
            }
            if (/^SELECT id FROM candidaturas .*status = 'Aceito'/.test(comando)) {
                return estado.aceitas;
            }
            if (/^UPDATE candidaturas SET status = 'Recusado'/.test(comando)) {
                estado.candidaturasRecusadas.push(params[0]);
                return { affectedRows: 1 };
            }
            if (/^INSERT INTO historico_candidaturas/.test(comando)) {
                const anterior = /VALUES \(\?, '(\w+)', '(\w+)'/.exec(comando);
                estado.historicoCandidaturas.push({
                    candidaturaId: params[0],
                    de: anterior[1],
                    para: anterior[2],
                    alteradoPor: params[1],
                    observacao: params[2]
                });
                return { affectedRows: 1 };
            }
            if (/^INSERT INTO historico_eventos_bicos/.test(comando)) {
                const [bicoId, usuarioId, statusAnterior, observacao] = params;
                estado.eventos.push({ bicoId, usuarioId, statusAnterior, observacao, sql: comando });
                return { affectedRows: 1 };
            }
            throw new Error(`Consulta inesperada no banco falso: ${comando}`);
        }
    };

    return { estado, banco: { getConnection: async () => connection } };
};

const bicoAberto = { id: BICO_ID, contratante_id: CONTRATANTE_ID, trabalhador_id: null, valor: VALOR, status: 'Aberto' };
const bicoEmAndamento = { ...bicoAberto, trabalhador_id: TRABALHADOR_ID, status: 'Em andamento' };
const reserva = { usuario_id: CONTRATANTE_ID, bico_id: BICO_ID, tipo: 'RESERVA', valor: VALOR };

const criarRespostaFalsa = () => {
    const res = { statusCode: 200 };
    res.status = (codigo) => { res.statusCode = codigo; return res; };
    res.json = (corpo) => { res.corpo = corpo; return res; };
    return res;
};

const cancelar = async (banco, { usuarioId = CONTRATANTE_ID, id = String(BICO_ID), body = {} } = {}) => {
    const res = criarRespostaFalsa();
    await criarCanceladorBico(banco)(
        { params: { id }, session: { usuario: { id: usuarioId } }, body },
        res
    );
    return res;
};

const semEscritas = (estado) => {
    assert.equal(estado.saldoContratante, estado.saldoInicial ?? 0, 'o saldo não pode mudar');
    assert.equal(estado.movimentacoes.filter((m) => m.tipo === 'ESTORNO').length, 0, 'sem ESTORNO');
    assert.equal(estado.historicoCandidaturas.length, 0, 'sem histórico de candidaturas');
    assert.equal(estado.eventos.length, 0, 'sem evento do bico');
    assert.equal(estado.bico?.status === 'Cancelado', false, 'o bico não pode ser cancelado');
};

describe('cancelamento de bico Aberto', () => {
    test('cancela sem estorno e recusa as candidaturas pendentes com histórico', async () => {
        const { banco, estado } = criarBancoFalso({ bico: bicoAberto, pendentes: [101, 102], saldoContratante: 40 });
        const res = await cancelar(banco, { body: { motivo: '  Mudei de ideia  ' } });

        assert.equal(res.statusCode, 200);
        assert.equal(res.corpo.sucesso, true);
        assert.equal(res.corpo.status, 'Cancelado');
        assert.equal(res.corpo.valorEstornado, 0);

        assert.equal(estado.bico.status, 'Cancelado');
        assert.equal(estado.saldoContratante, 40, 'sem reserva, o saldo não muda');
        assert.equal(estado.movimentacoes.length, 0, 'nenhuma movimentação criada');

        assert.deepEqual(estado.candidaturasRecusadas, [101, 102]);
        assert.deepEqual(
            estado.historicoCandidaturas.map((h) => [h.candidaturaId, h.de, h.para, h.alteradoPor, h.observacao]),
            [
                [101, 'Pendente', 'Recusado', CONTRATANTE_ID, OBSERVACAO_CANCELAMENTO_BICO],
                [102, 'Pendente', 'Recusado', CONTRATANTE_ID, OBSERVACAO_CANCELAMENTO_BICO]
            ]
        );

        assert.equal(estado.eventos.length, 1);
        assert.match(estado.eventos[0].sql, /'Cancelamento'/);
        assert.match(estado.eventos[0].sql, /'Cancelado'/);
        assert.equal(estado.eventos[0].statusAnterior, 'Aberto');
        assert.equal(estado.eventos[0].observacao, 'Mudei de ideia');

        assert.deepEqual(estado.transacao, ['begin', 'commit', 'release']);
    });

    test('motivo vazio é gravado como nulo', async () => {
        const { banco, estado } = criarBancoFalso({ bico: bicoAberto });
        const res = await cancelar(banco, { body: { motivo: '   ' } });

        assert.equal(res.statusCode, 200);
        assert.equal(estado.eventos[0].observacao, null);
    });

    test('motivo com mais de 255 caracteres é rejeitado sem abrir transação', async () => {
        const { banco, estado } = criarBancoFalso({ bico: bicoAberto });
        const res = await cancelar(banco, { body: { motivo: 'a'.repeat(256) } });

        assert.equal(res.statusCode, 400);
        assert.match(res.corpo.erro, /no máximo 255/);
        assert.deepEqual(estado.transacao, []);
    });

    test('motivo com exatamente 255 caracteres é aceito', async () => {
        const { banco, estado } = criarBancoFalso({ bico: bicoAberto });
        const res = await cancelar(banco, { body: { motivo: 'a'.repeat(255) } });

        assert.equal(res.statusCode, 200);
        assert.equal(estado.eventos[0].observacao.length, 255);
    });
});

describe('cancelamento de bico Em andamento', () => {
    test('estorna a reserva ao saldo, registra ESTORNO e o histórico da candidatura aceita', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: bicoEmAndamento,
            movimentacoes: [reserva],
            aceitas: [201],
            saldoContratante: 50
        });
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 200);
        assert.equal(res.corpo.sucesso, true);
        assert.equal(res.corpo.valorEstornado, VALOR);
        assert.match(res.corpo.mensagem, /estornado/);

        assert.equal(estado.bico.status, 'Cancelado');
        assert.equal(estado.saldoContratante, 50 + VALOR, 'saldo + valor reservado');

        const estornos = estado.movimentacoes.filter((m) => m.tipo === 'ESTORNO');
        assert.equal(estornos.length, 1);
        assert.deepEqual(
            [estornos[0].usuario_id, estornos[0].bico_id, estornos[0].valor, estornos[0].descricao],
            [CONTRATANTE_ID, BICO_ID, VALOR, `Estorno do bico: ${BICO_ID}`]
        );

        assert.deepEqual(
            estado.historicoCandidaturas.map((h) => [h.candidaturaId, h.de, h.para, h.observacao]),
            [[201, 'Aceito', 'Aceito', OBSERVACAO_CANCELAMENTO_BICO]]
        );
        assert.deepEqual(estado.candidaturasRecusadas, []);
        assert.equal(estado.eventos[0].statusAnterior, 'Em andamento');
        assert.deepEqual(estado.transacao, ['begin', 'commit', 'release']);
    });

    test('reserva diferente do valor do bico: aborta sem estornar', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: bicoEmAndamento,
            movimentacoes: [{ ...reserva, valor: 99 }],
            saldoContratante: 50
        });
        estado.saldoInicial = 50;
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 400);
        assert.deepEqual(estado.transacao, ['begin', 'rollback', 'release']);
        semEscritas(estado);
    });

    test('sem reserva: aborta sem estornar', async () => {
        const { banco, estado } = criarBancoFalso({ bico: bicoEmAndamento });
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 400);
        assert.match(res.corpo.erro, /reserva/);
        assert.deepEqual(estado.transacao, ['begin', 'rollback', 'release']);
    });
});

describe('cancelamentos bloqueados', () => {
    test('bico Finalizado: 409 e nada é alterado', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: { ...bicoEmAndamento, status: 'Finalizado' },
            movimentacoes: [reserva],
            saldoContratante: 10
        });
        estado.saldoInicial = 10;
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 409);
        assert.equal(res.corpo.sucesso, false);
        assert.match(res.corpo.erro, /finalizados não podem ser cancelados/);
        assert.deepEqual(estado.transacao, ['begin', 'rollback', 'release']);
        semEscritas(estado);
    });

    test('bico de outro contratante: 403 e nada é alterado', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: bicoEmAndamento,
            movimentacoes: [reserva],
            saldoContratante: 10
        });
        estado.saldoInicial = 10;
        const res = await cancelar(banco, { usuarioId: OUTRO_CONTRATANTE_ID });

        assert.equal(res.statusCode, 403);
        assert.deepEqual(estado.transacao, ['begin', 'rollback', 'release']);
        assert.equal(estado.bico.status, 'Em andamento');
        semEscritas(estado);
    });

    test('bico inexistente: 404 e a transação é desfeita', async () => {
        const { banco, estado } = criarBancoFalso({ bico: null });
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 404);
        assert.equal(res.corpo.erro, 'Bico não encontrado.');
        assert.deepEqual(estado.transacao, ['begin', 'rollback', 'release']);
    });

    test('identificador inválido: 400 sem abrir transação', async () => {
        const { banco, estado } = criarBancoFalso({ bico: bicoAberto });
        const res = await cancelar(banco, { id: 'abc' });

        assert.equal(res.statusCode, 400);
        assert.deepEqual(estado.transacao, []);
    });

    test('estorno duplicado: cancelar duas vezes estorna uma única vez', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: bicoEmAndamento,
            movimentacoes: [reserva],
            aceitas: [201],
            saldoContratante: 0
        });

        const primeira = await cancelar(banco);
        const segunda = await cancelar(banco);

        assert.equal(primeira.statusCode, 200);
        assert.equal(segunda.statusCode, 409);
        assert.match(segunda.corpo.erro, /já foi cancelado/);
        assert.equal(estado.saldoContratante, VALOR, 'o valor é devolvido uma única vez');
        assert.equal(estado.movimentacoes.filter((m) => m.tipo === 'ESTORNO').length, 1);
    });

    test('ESTORNO já registrado para o bico: aborta e não devolve de novo', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: bicoEmAndamento,
            movimentacoes: [reserva, { usuario_id: CONTRATANTE_ID, bico_id: BICO_ID, tipo: 'ESTORNO', valor: VALOR }],
            saldoContratante: 70
        });
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 409);
        assert.match(res.corpo.erro, /crédito ou estorno/);
        assert.equal(estado.saldoContratante, 70);
        assert.equal(estado.movimentacoes.filter((m) => m.tipo === 'ESTORNO').length, 1);
        assert.deepEqual(estado.transacao, ['begin', 'rollback', 'release']);
    });

    test('CREDITO já registrado para o bico: aborta sem estornar', async () => {
        const { banco, estado } = criarBancoFalso({
            bico: bicoEmAndamento,
            movimentacoes: [reserva, { usuario_id: TRABALHADOR_ID, bico_id: BICO_ID, tipo: 'CREDITO', valor: VALOR }],
            saldoContratante: 70
        });
        const res = await cancelar(banco);

        assert.equal(res.statusCode, 409);
        assert.equal(estado.saldoContratante, 70);
        assert.equal(estado.bico.status, 'Em andamento');
    });

    test('segundo cancelamento de bico Aberto: 409 "já foi cancelado"', async () => {
        const { banco } = criarBancoFalso({ bico: bicoAberto });
        const primeira = await cancelar(banco);
        const segunda = await cancelar(banco);

        assert.equal(primeira.statusCode, 200);
        assert.equal(segunda.statusCode, 409);
    });
});

describe('rota e schema', () => {
    test('POST /:id/cancelar fica depois de /candidaturas/cancelar', () => {
        const caminhos = roteadorBicos.stack
            .filter((camada) => camada.route && camada.route.methods.post)
            .map((camada) => camada.route.path);

        const candidatura = caminhos.indexOf('/candidaturas/cancelar');
        const bico = caminhos.indexOf('/:id/cancelar');

        assert.ok(candidatura >= 0, 'rota /candidaturas/cancelar não encontrada');
        assert.ok(bico >= 0, 'rota /:id/cancelar não encontrada');
        assert.ok(candidatura < bico, '/:id/cancelar capturaria /candidaturas/cancelar');
    });

    test('schema.sql e migração aceitam o tipo ESTORNO', () => {
        const schema = readFileSync(new URL('../../schema.sql', import.meta.url), 'utf8');
        const migracao = readFileSync(new URL('../../migrations/001_estorno.sql', import.meta.url), 'utf8');
        const enumEsperado = "ENUM('ADICAO', 'RESERVA', 'CREDITO', 'ESTORNO')";

        assert.ok(schema.includes(`tipo_movimentacao ${enumEsperado} NOT NULL`));
        assert.ok(migracao.includes(`MODIFY COLUMN tipo_movimentacao ${enumEsperado} NOT NULL`));
    });
});
