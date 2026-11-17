// Testes unitários da avaliação bidirecional (POST /bicos/:id/avaliacao).
// Não acessam o banco: o controller recebe um banco falso em memória que simula bicos e avaliacoes.
// Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers. Apontamos para uma porta fechada
// para garantir que nenhum banco real seja contatado durante os testes.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarSalvadorAvaliacaoBico, PRAZO_AVALIACAO_DIAS } = await import('../../controllers/bicoController.js');
const { calcularPrazoAvaliacao, normalizarComentario } = await import('../../controllers/avaliacaoRegras.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const CONTRATANTE_ID = 10;
const TRABALHADOR_ID = 20;
const TERCEIRO_ID = 30;
const BICO_ID = 5;
const AGORA = new Date('2026-11-17T12:00:00');
const diasAtras = (dias) => new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000);

// Banco falso: um bico e a tabela de avaliações; registra o que foi gravado.
const criarBancoFalso = ({ status = 'Finalizado', finalizadoEm = diasAtras(1), trabalhadorId = TRABALHADOR_ID, bico = true, avaliacoes = [] } = {}) => {
    const estado = {
        avaliacoes: avaliacoes.map((a) => ({ ...a })),
        inserts: [],
        updates: [],
        consultas: []
    };
    let proximoId = 100;

    const banco = {
        query: async (sql, params = []) => {
            const comando = sql.replace(/\s+/g, ' ').trim();
            estado.consultas.push({ comando, params });

            if (/^SELECT b\.contratante_id, b\.trabalhador_id, b\.status, .* AS finalizado_em FROM bicos b WHERE b\.id = \?/.test(comando)) {
                return bico
                    ? [{ contratante_id: CONTRATANTE_ID, trabalhador_id: trabalhadorId, status, finalizado_em: finalizadoEm }]
                    : [];
            }
            if (/^SELECT id FROM avaliacoes WHERE bico_id = \? AND avaliador_id = \?/.test(comando)) {
                const [bicoId, avaliadorId] = params;
                return estado.avaliacoes.filter((a) => a.bico_id === bicoId && a.avaliador_id === avaliadorId).map((a) => ({ id: a.id }));
            }
            if (/^UPDATE avaliacoes SET nota = \?, comentario = \? WHERE id = \?/.test(comando)) {
                const [nota, comentario, id] = params;
                const existente = estado.avaliacoes.find((a) => a.id === id);
                Object.assign(existente, { nota, comentario });
                estado.updates.push({ id, nota, comentario });
                return { affectedRows: 1 };
            }
            if (/^INSERT INTO avaliacoes/.test(comando)) {
                const [bicoId, avaliadorId, avaliadoId, nota, comentario] = params;
                const nova = { id: proximoId++, bico_id: bicoId, avaliador_id: avaliadorId, avaliado_id: avaliadoId, nota, comentario };
                estado.avaliacoes.push(nova);
                estado.inserts.push(nova);
                return { affectedRows: 1, insertId: nova.id };
            }
            throw new Error(`Consulta inesperada no banco falso: ${comando}`);
        }
    };

    return { banco, estado };
};

const criarRespostaFalsa = () => {
    const res = { statusCode: 200, corpo: undefined };
    res.status = (codigo) => { res.statusCode = codigo; return res; };
    res.json = (corpo) => { res.corpo = corpo; return res; };
    return res;
};

const avaliar = async (banco, opcoes) => {
    const { usuarioId, comentario, bicoId = String(BICO_ID) } = opcoes;
    const nota = 'nota' in opcoes ? opcoes.nota : '5';
    const req = {
        params: { id: bicoId },
        body: { nota, ...(comentario === undefined ? {} : { comentario }) },
        session: usuarioId === undefined ? {} : { usuario: { id: usuarioId } }
    };
    const res = criarRespostaFalsa();
    await criarSalvadorAvaliacaoBico(banco, () => AGORA)(req, res);
    return res;
};

describe('avaliação: quem pode avaliar', () => {
    test('o contratante avalia o trabalhador do bico', async () => {
        const { banco, estado } = criarBancoFalso();
        const res = await avaliar(banco, { usuarioId: CONTRATANTE_ID, nota: '4', comentario: 'Bom serviço' });

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.corpo, { sucesso: true, acao: 'criada', mensagem: 'Avaliação registrada.' });
        assert.equal(estado.inserts.length, 1);
        assert.deepEqual(
            { bico: estado.inserts[0].bico_id, de: estado.inserts[0].avaliador_id, para: estado.inserts[0].avaliado_id, nota: estado.inserts[0].nota },
            { bico: BICO_ID, de: CONTRATANTE_ID, para: TRABALHADOR_ID, nota: 4 }
        );
    });

    test('o trabalhador do bico avalia o contratante', async () => {
        const { banco, estado } = criarBancoFalso();
        const res = await avaliar(banco, { usuarioId: TRABALHADOR_ID, nota: '5', comentario: 'Pagou em dia' });

        assert.equal(res.statusCode, 200);
        assert.equal(res.corpo.mensagem, 'Avaliação registrada.');
        assert.equal(estado.inserts[0].avaliador_id, TRABALHADOR_ID);
        assert.equal(estado.inserts[0].avaliado_id, CONTRATANTE_ID);
    });

    test('contratante e trabalhador avaliam o mesmo bico de forma independente', async () => {
        const { banco, estado } = criarBancoFalso();
        await avaliar(banco, { usuarioId: CONTRATANTE_ID, nota: '3' });
        const res = await avaliar(banco, { usuarioId: TRABALHADOR_ID, nota: '5' });

        assert.equal(res.corpo.acao, 'criada');
        assert.equal(estado.avaliacoes.length, 2);
        assert.equal(estado.updates.length, 0);
    });

    test('um terceiro recebe 403 e nada é gravado', async () => {
        const { banco, estado } = criarBancoFalso();
        const res = await avaliar(banco, { usuarioId: TERCEIRO_ID });

        assert.equal(res.statusCode, 403);
        assert.equal(res.corpo.sucesso, false);
        assert.equal(estado.inserts.length, 0);
    });

    test('sem login responde 401; bico inexistente 404; id inválido 400', async () => {
        const { banco } = criarBancoFalso();
        assert.equal((await avaliar(banco, { usuarioId: undefined })).statusCode, 401);
        assert.equal((await avaliar(criarBancoFalso({ bico: false }).banco, { usuarioId: CONTRATANTE_ID })).statusCode, 404);
        assert.equal((await avaliar(banco, { usuarioId: CONTRATANTE_ID, bicoId: 'abc' })).statusCode, 400);
    });
});

describe('avaliação: estado do bico e nota', () => {
    for (const status of ['Aberto', 'Em andamento', 'Cancelado']) {
        test(`bico ${status} responde 409`, async () => {
            const { banco, estado } = criarBancoFalso({ status });
            const res = await avaliar(banco, { usuarioId: CONTRATANTE_ID });

            assert.equal(res.statusCode, 409);
            assert.equal(res.corpo.erro, 'Somente bicos finalizados podem ser avaliados.');
            assert.equal(estado.inserts.length, 0);
        });
    }

    for (const nota of ['0', '6', 'abc', '4.5', '', '-1', undefined]) {
        test(`nota ${JSON.stringify(nota)} responde 400 sem consultar o banco`, async () => {
            const { banco, estado } = criarBancoFalso();
            const res = await avaliar(banco, { usuarioId: CONTRATANTE_ID, nota });

            assert.equal(res.statusCode, 400);
            assert.equal(res.corpo.erro, 'A nota deve ser um número inteiro de 1 a 5.');
            assert.equal(estado.consultas.length, 0);
        });
    }

    test('comentário com mais de 500 caracteres responde 400', async () => {
        const { banco, estado } = criarBancoFalso();
        const res = await avaliar(banco, { usuarioId: CONTRATANTE_ID, comentario: 'a'.repeat(501) });

        assert.equal(res.statusCode, 400);
        assert.equal(estado.inserts.length, 0);
    });

    test('comentário só com espaços é gravado como NULL; comentário normal é aparado', async () => {
        const vazio = criarBancoFalso();
        await avaliar(vazio.banco, { usuarioId: CONTRATANTE_ID, comentario: '   \n  ' });
        assert.equal(vazio.estado.inserts[0].comentario, null);

        const normal = criarBancoFalso();
        await avaliar(normal.banco, { usuarioId: CONTRATANTE_ID, comentario: '  Excelente  ' });
        assert.equal(normal.estado.inserts[0].comentario, 'Excelente');

        const ausente = criarBancoFalso();
        await avaliar(ausente.banco, { usuarioId: CONTRATANTE_ID });
        assert.equal(ausente.estado.inserts[0].comentario, null);
    });
});

describe('avaliação: edição e prazo de 7 dias', () => {
    test('a constante do prazo vale 7 dias', () => {
        assert.equal(PRAZO_AVALIACAO_DIAS, 7);
    });

    test('dentro do prazo, avaliar de novo atualiza (não cria outra avaliação)', async () => {
        const { banco, estado } = criarBancoFalso({
            finalizadoEm: diasAtras(3),
            avaliacoes: [{ id: 7, bico_id: BICO_ID, avaliador_id: CONTRATANTE_ID, avaliado_id: TRABALHADOR_ID, nota: 4, comentario: 'Antes' }]
        });
        const res = await avaliar(banco, { usuarioId: CONTRATANTE_ID, nota: '2', comentario: 'Depois' });

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.corpo, { sucesso: true, acao: 'atualizada', mensagem: 'Avaliação atualizada.' });
        assert.equal(estado.inserts.length, 0);
        assert.deepEqual(estado.updates, [{ id: 7, nota: 2, comentario: 'Depois' }]);
        assert.equal(estado.avaliacoes.length, 1);
    });

    test('exatamente no 7º dia ainda é permitido', async () => {
        const { banco } = criarBancoFalso({ finalizadoEm: diasAtras(7) });
        assert.equal((await avaliar(banco, { usuarioId: CONTRATANTE_ID })).statusCode, 200);
    });

    test('depois de 7 dias não cria: 409 com a mensagem do prazo', async () => {
        const { banco, estado } = criarBancoFalso({ finalizadoEm: diasAtras(8) });
        const res = await avaliar(banco, { usuarioId: TRABALHADOR_ID });

        assert.equal(res.statusCode, 409);
        assert.equal(res.corpo.erro, 'O prazo de 7 dias para avaliar este bico terminou.');
        assert.equal(estado.inserts.length, 0);
    });

    test('depois de 7 dias não edita a avaliação existente', async () => {
        const { banco, estado } = criarBancoFalso({
            finalizadoEm: diasAtras(10),
            avaliacoes: [{ id: 7, bico_id: BICO_ID, avaliador_id: CONTRATANTE_ID, avaliado_id: TRABALHADOR_ID, nota: 4, comentario: 'Antes' }]
        });
        const res = await avaliar(banco, { usuarioId: CONTRATANTE_ID, nota: '1', comentario: 'Tarde' });

        assert.equal(res.statusCode, 409);
        assert.equal(res.corpo.erro, 'O prazo de 7 dias para avaliar este bico terminou.');
        assert.equal(estado.updates.length, 0);
        assert.equal(estado.avaliacoes[0].nota, 4);
    });

    test('a consulta usa o evento de finalização (com alternativas) como data de partida', async () => {
        const { banco, estado } = criarBancoFalso();
        await avaliar(banco, { usuarioId: CONTRATANTE_ID });
        const consulta = estado.consultas[0].comando;

        assert.match(consulta, /historico_eventos_bicos/);
        assert.match(consulta, /status_novo = 'Finalizado'/);
        assert.match(consulta, /movimentacoes_carteira/);
    });
});

describe('regras auxiliares', () => {
    test('calcularPrazoAvaliacao informa o limite e se já encerrou', () => {
        const aberto = calcularPrazoAvaliacao(diasAtras(2), AGORA);
        assert.equal(aberto.encerrado, false);
        assert.equal(aberto.limiteFormatado, '22/11/2026');

        assert.equal(calcularPrazoAvaliacao(diasAtras(7.5), AGORA).encerrado, true);
        assert.equal(calcularPrazoAvaliacao(undefined, AGORA).encerrado, true);
    });

    test('normalizarComentario', () => {
        assert.equal(normalizarComentario(undefined), null);
        assert.equal(normalizarComentario(null), null);
        assert.equal(normalizarComentario('   '), null);
        assert.equal(normalizarComentario(' oi '), 'oi');
    });
});
