// Testes unitários das notificações do trabalhador: classificação dos registros do histórico
// (services/notificacoes.js) e as rotas GET /notificacoes e POST /notificacoes/lidas com banco falso.
// Executar com: npm run test:unit
import { test, describe, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { classificarNotificacao, montarNotificacao } = await import('../../services/notificacoes.js');
const { OBSERVACAO_CANCELAMENTO_BICO, OBSERVACAO_RECUSA_AUTOMATICA } =
    await import('../../controllers/bicoController.js');
const { criarListadorNotificacoes, criarMarcadorLidas } = await import('../../controllers/notificacaoController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const OBS = { recusaAutomatica: OBSERVACAO_RECUSA_AUTOMATICA, cancelamentoBico: OBSERVACAO_CANCELAMENTO_BICO };

const linha = (extra) => ({
    id: 10,
    status_anterior: 'Pendente',
    status_novo: 'Aceito',
    observacao: null,
    data_alteracao: new Date('2026-11-25T12:00:00Z'),
    bico_id: 5,
    titulo: 'Montagem de guarda-roupa',
    ...extra
});

describe('classificação das notificações', () => {
    const casos = [
        ['aceite pelo contratante', { status_novo: 'Aceito' }, 'aceita'],
        ['recusa pelo contratante', { status_novo: 'Recusado', observacao: 'Já fechei' }, 'recusada'],
        ['recusa sem observação', { status_novo: 'Recusado' }, 'recusada'],
        [
            'recusa automática (outro aceito)',
            { status_novo: 'Recusado', observacao: OBSERVACAO_RECUSA_AUTOMATICA },
            'outro-escolhido'
        ],
        [
            'pendente recusada pelo cancelamento do bico',
            { status_novo: 'Recusado', observacao: OBSERVACAO_CANCELAMENTO_BICO },
            'bico-cancelado'
        ],
        [
            'aceita e depois o bico cancelado',
            { status_anterior: 'Aceito', status_novo: 'Aceito', observacao: OBSERVACAO_CANCELAMENTO_BICO },
            'bico-cancelado'
        ],
        ['candidatura (Pendente) não é notificação', { status_anterior: null, status_novo: 'Pendente' }, null],
        ['cancelamento pelo próprio trabalhador', { status_novo: 'Cancelado' }, null]
    ];

    for (const [descricao, extra, esperado] of casos) {
        test(`${descricao} -> ${esperado}`, () => {
            assert.equal(classificarNotificacao(linha(extra), OBS), esperado);
        });
    }
});

describe('montarNotificacao', () => {
    test('aceite: título, mensagem com o bico, link e data', () => {
        const n = montarNotificacao(linha(), OBS, 0);

        assert.deepEqual(n, {
            id: 10,
            tipo: 'aceita',
            titulo: 'Candidatura aceita',
            mensagem: 'Você foi escolhido para "Montagem de guarda-roupa".',
            motivo: null,
            href: '/bicos/5',
            quando: '2026-11-25T12:00:00.000Z',
            lida: false
        });
    });

    test('lida quando o id não passa do último lido', () => {
        assert.equal(montarNotificacao(linha({ id: 10 }), OBS, 10).lida, true);
        assert.equal(montarNotificacao(linha({ id: 11 }), OBS, 10).lida, false);
    });

    test('o motivo só aparece na recusa feita pelo contratante', () => {
        assert.equal(
            montarNotificacao(linha({ status_novo: 'Recusado', observacao: 'Já fechei' }), OBS).motivo,
            'Já fechei'
        );
        const automatica = montarNotificacao(
            linha({ status_novo: 'Recusado', observacao: OBSERVACAO_RECUSA_AUTOMATICA }),
            OBS
        );
        assert.equal(automatica.motivo, null);
        assert.equal(automatica.mensagem, 'Outro profissional foi escolhido para "Montagem de guarda-roupa".');
    });

    test('registro que não é notificação devolve null', () => {
        assert.equal(montarNotificacao(linha({ status_novo: 'Pendente' }), OBS), null);
    });
});

// ------------------------------------------------------------------ rotas com banco falso
const criarRes = () => {
    const res = { statusCode: 200, corpo: null, cabecalhos: {} };
    res.status = (codigo) => {
        res.statusCode = codigo;
        return res;
    };
    res.json = (corpo) => {
        res.corpo = corpo;
        return res;
    };
    res.set = (nome, valor) => {
        res.cabecalhos[nome] = valor;
        return res;
    };
    return res;
};

const reqTrabalhador = (extra = {}) => ({ session: { usuario: { id: 20, tipo_perfil: 'trabalhador' } }, ...extra });

describe('GET /notificacoes', () => {
    const bancoListagem = ({ ultimoLido = null, linhas = [], naoLidas = 0 } = {}) => {
        const banco = {
            consultas: [],
            query: async (sql, params) => {
                const comando = sql.replace(/\s+/g, ' ').trim();
                banco.consultas.push({ comando, params });
                if (/^SELECT ultimo_lido_id/.test(comando))
                    return ultimoLido === null ? [] : [{ ultimo_lido_id: ultimoLido }];
                if (/^SELECT COUNT/.test(comando)) return [{ total: BigInt(naoLidas) }];
                return linhas;
            }
        };
        return banco;
    };

    test('lista as notificações com o contador e marca as já lidas', async () => {
        const banco = bancoListagem({
            ultimoLido: 10,
            naoLidas: 1,
            linhas: [
                linha({ id: 12, status_novo: 'Recusado', observacao: OBSERVACAO_RECUSA_AUTOMATICA }),
                linha({ id: 10 })
            ]
        });
        const res = criarRes();

        await criarListadorNotificacoes(banco)(reqTrabalhador(), res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.corpo.naoLidas, 1);
        assert.deepEqual(
            res.corpo.notificacoes.map((n) => [n.id, n.tipo, n.lida]),
            [
                [12, 'outro-escolhido', false],
                [10, 'aceita', true]
            ]
        );
        assert.equal(res.cabecalhos['Cache-Control'], 'no-store');
    });

    test('a consulta filtra pelo trabalhador e exclui o que ele mesmo fez', async () => {
        const banco = bancoListagem();
        await criarListadorNotificacoes(banco)(reqTrabalhador(), criarRes());

        const lista = banco.consultas.find(
            (c) => /FROM historico_candidaturas/.test(c.comando) && /ORDER BY/.test(c.comando)
        );
        assert.match(lista.comando, /c\.trabalhador_id = \? AND h\.alterado_por <> \?/);
        assert.match(lista.comando, /h\.status_novo IN \('Aceito', 'Recusado'\)/);
        assert.deepEqual(lista.params, [20, 20]);

        const contagem = banco.consultas.find((c) => /^SELECT COUNT/.test(c.comando));
        assert.match(contagem.comando, /h\.id > \?$/);
        assert.deepEqual(contagem.params, [20, 20, 0], 'sem leitura registrada, tudo conta como não lido');
    });

    test('sem usuário na sessão: 401 sem consultar o banco', async () => {
        const banco = bancoListagem();
        const res = criarRes();
        await criarListadorNotificacoes(banco)({ session: {} }, res);

        assert.equal(res.statusCode, 401);
        assert.equal(banco.consultas.length, 0);
    });

    test('erro de banco: 500 em JSON', async () => {
        mock.method(console, 'error', () => {});
        const res = criarRes();
        await criarListadorNotificacoes({
            query: async () => {
                throw new Error('fora do ar');
            }
        })(reqTrabalhador(), res);

        assert.equal(res.statusCode, 500);
        assert.ok(res.corpo.erro);
        mock.restoreAll();
    });
});

describe('POST /notificacoes/lidas', () => {
    const bancoGravacao = () => {
        const banco = {
            consultas: [],
            query: async (sql, params) => {
                banco.consultas.push({ comando: sql.replace(/\s+/g, ' ').trim(), params });
                return { affectedRows: 1 };
            }
        };
        return banco;
    };

    test('grava até o id mostrado, sem nunca voltar para trás', async () => {
        const banco = bancoGravacao();
        const res = criarRes();
        await criarMarcadorLidas(banco)(reqTrabalhador({ body: { ateId: 12 } }), res);

        assert.deepEqual(res.corpo, { ok: true });
        assert.match(banco.consultas[0].comando, /ON DUPLICATE KEY UPDATE ultimo_lido_id = GREATEST\(/);
        assert.deepEqual(banco.consultas[0].params, [20, 12]);
    });

    for (const ateId of [undefined, 0, -1, 1.5, '12', 2147483648]) {
        test(`ateId ${JSON.stringify(ateId)}: 400 sem gravar`, async () => {
            const banco = bancoGravacao();
            const res = criarRes();
            await criarMarcadorLidas(banco)(reqTrabalhador({ body: { ateId } }), res);

            assert.equal(res.statusCode, 400);
            assert.equal(banco.consultas.length, 0);
        });
    }
});
