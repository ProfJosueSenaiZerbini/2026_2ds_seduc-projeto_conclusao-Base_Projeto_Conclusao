// Testes unitários da repetição de transações com deadlock (config/transacao.js) e do aceite de candidatura
// (POST /bicos/candidaturas/status) quando o MariaDB escolhe a requisição como vítima de uma trava.
// Não acessam o banco: o controller recebe um banco falso em memória que só "grava" o que foi confirmado (commit).
// Executar com: npm run test:unit
import { test, describe, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers. Apontamos para uma porta fechada
// para garantir que nenhum banco real seja contatado durante os testes.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarAtualizadorStatusCandidatura } = await import('../../controllers/bicoController.js');
const { comRetentativa, ehErroDeTrava, esperaAleatoria, ERROS_DE_TRAVA, ESPERA_MINIMA_MS, ESPERA_MAXIMA_MS } =
    await import('../../config/transacao.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const erroDeBanco = (errno, mensagem = 'erro do banco') => Object.assign(new Error(mensagem), { errno });
const DEADLOCK = () => erroDeBanco(1213, 'Deadlock found when trying to get lock; try restarting transaction');
const LOCK_TIMEOUT = () => erroDeBanco(1205, 'Lock wait timeout exceeded; try restarting transaction');

// Sem espera real nos testes: guarda o tempo que seria esperado.
const semEspera = () => {
    const esperas = [];
    return { esperas, opcoes: { dormir: async (ms) => esperas.push(ms), aoRepetir: () => {} } };
};

describe('comRetentativa (config/transacao.js)', () => {
    test('reconhece só deadlock (1213) e lock wait timeout (1205)', () => {
        assert.deepEqual([...ERROS_DE_TRAVA], [1213, 1205]);
        assert.equal(ehErroDeTrava(DEADLOCK()), true);
        assert.equal(ehErroDeTrava(LOCK_TIMEOUT()), true);
        assert.equal(ehErroDeTrava(erroDeBanco(1062)), false);
        assert.equal(ehErroDeTrava(new Error('sem errno')), false);
        assert.equal(ehErroDeTrava(null), false);
    });

    test('a espera entre tentativas fica entre 20 e 80 ms', () => {
        for (let i = 0; i < 500; i++) {
            const ms = esperaAleatoria();
            assert.ok(Number.isInteger(ms) && ms >= ESPERA_MINIMA_MS && ms <= ESPERA_MAXIMA_MS, `espera ${ms}`);
        }
    });

    test('sucesso na primeira tentativa não espera nem repete', async () => {
        const { esperas, opcoes } = semEspera();
        let chamadas = 0;
        const resultado = await comRetentativa(async () => {
            chamadas++;
            return 'ok';
        }, opcoes);
        assert.equal(resultado, 'ok');
        assert.equal(chamadas, 1);
        assert.deepEqual(esperas, []);
    });

    test('repete em deadlock e em lock wait timeout e devolve o resultado da tentativa que der certo', async () => {
        const { esperas, opcoes } = semEspera();
        const numeros = [];
        const resultado = await comRetentativa(async (n) => {
            numeros.push(n);
            if (n === 1) throw DEADLOCK();
            if (n === 2) throw LOCK_TIMEOUT();
            return 'ok';
        }, opcoes);
        assert.equal(resultado, 'ok');
        assert.deepEqual(numeros, [1, 2, 3]);
        assert.equal(esperas.length, 2);
        assert.ok(esperas.every((ms) => ms >= ESPERA_MINIMA_MS && ms <= ESPERA_MAXIMA_MS));
    });

    test('desiste depois de 3 tentativas e relança o erro original', async () => {
        const { esperas, opcoes } = semEspera();
        let chamadas = 0;
        const ultimo = DEADLOCK();
        await assert.rejects(
            comRetentativa(async () => {
                chamadas++;
                throw chamadas === 3 ? ultimo : DEADLOCK();
            }, opcoes),
            (erro) => erro === ultimo
        );
        assert.equal(chamadas, 3);
        assert.equal(esperas.length, 2, 'não espera depois da última tentativa');
    });

    test('outro erro sobe na hora, sem repetir', async () => {
        const { esperas, opcoes } = semEspera();
        let chamadas = 0;
        await assert.rejects(
            comRetentativa(async () => {
                chamadas++;
                throw erroDeBanco(1062, 'Duplicate entry');
            }, opcoes),
            { errno: 1062 }
        );
        assert.equal(chamadas, 1);
        assert.deepEqual(esperas, []);
    });
});

// ---------------------------------------------------------------- aceite de candidatura com banco falso
const CONTRATANTE_ID = 10;
const TRABALHADOR_ID = 20;
const BICO_ID = 5;
const CANDIDATURA_ID = 7;
const OUTRA_CANDIDATURA_ID = 8;
const VALOR = 150;

// `falhas`: { <número da tentativa>: errno } lançado no primeiro "UPDATE candidaturas SET status = ?" da tentativa,
// isto é, depois de o saldo já ter sido debitado e a reserva registrada (para provar que o rollback descarta tudo).
const criarBancoFalso = ({ falhas = {} } = {}) => {
    const estado = {
        conexoes: 0,
        transacoes: [], // por conexão: ['begin', 'rollback' | 'commit', 'release']
        gravado: [] // só o que foi confirmado com commit
    };

    return {
        estado,
        getConnection: async () => {
            const numero = ++estado.conexoes;
            const registro = [];
            estado.transacoes.push(registro);
            let pendente = [];
            let falhou = false;

            return {
                beginTransaction: async () => registro.push('begin'),
                commit: async () => {
                    registro.push('commit');
                    estado.gravado.push(...pendente);
                    pendente = [];
                },
                rollback: async () => {
                    registro.push('rollback');
                    pendente = [];
                },
                release: () => registro.push('release'),
                query: async (sql, params = []) => {
                    const comando = sql.replace(/\s+/g, ' ').trim();

                    if (/^SELECT bico_id FROM candidaturas/.test(comando)) return [{ bico_id: BICO_ID }];
                    if (/^SELECT id, contratante_id, status, valor FROM bicos/.test(comando)) {
                        return [
                            { id: BICO_ID, contratante_id: CONTRATANTE_ID, status: 'Aberto', valor: String(VALOR) }
                        ];
                    }
                    if (/^SELECT \* FROM candidaturas WHERE id = \?/.test(comando)) {
                        return [
                            { id: CANDIDATURA_ID, bico_id: BICO_ID, trabalhador_id: TRABALHADOR_ID, status: 'Pendente' }
                        ];
                    }
                    if (/^SELECT saldo_simulado FROM usuarios/.test(comando)) return [{ saldo_simulado: '500.00' }];
                    if (/^SELECT id FROM candidaturas WHERE bico_id/.test(comando))
                        return [{ id: OUTRA_CANDIDATURA_ID }];

                    // Daqui em diante são gravações.
                    if (falhas[numero] && !falhou && /^UPDATE candidaturas SET status = \?/.test(comando)) {
                        falhou = true;
                        throw erroDeBanco(falhas[numero], 'falha simulada');
                    }
                    pendente.push({ comando, params });
                    return { affectedRows: 1 };
                }
            };
        }
    };
};

const criarRespostaFalsa = () => {
    const res = { statusCode: 200, destino: null, corpo: null };
    res.status = (codigo) => {
        res.statusCode = codigo;
        return res;
    };
    res.send = (corpo) => {
        res.corpo = corpo;
        return res;
    };
    res.redirect = (destino) => {
        res.destino = destino;
        return res;
    };
    return res;
};

const criarReq = () => ({
    body: { candidatura_id: String(CANDIDATURA_ID), novo_status: 'Aceito' },
    session: { usuario: { id: CONTRATANTE_ID } }
});

const contar = (gravado, regex) => gravado.filter((g) => regex.test(g.comando)).length;

describe('aceitar candidatura repete a transação em deadlock', () => {
    test('1ª tentativa com deadlock e 2ª certa: aceita normalmente e grava uma vez só', async () => {
        mock.method(console, 'error', () => {});
        const banco = criarBancoFalso({ falhas: { 1: 1213 } });
        const { esperas, opcoes } = semEspera();
        const res = criarRespostaFalsa();

        await criarAtualizadorStatusCandidatura(banco, opcoes)(criarReq(), res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.destino, `/bicos/${BICO_ID}/gerenciar`, 'redireciona como no aceite normal');
        assert.equal(banco.estado.conexoes, 2);
        assert.deepEqual(banco.estado.transacoes, [
            ['begin', 'rollback', 'release'],
            ['begin', 'commit', 'release']
        ]);
        assert.equal(esperas.length, 1);

        const { gravado } = banco.estado;
        assert.equal(contar(gravado, /^UPDATE usuarios SET saldo_simulado = saldo_simulado - \?/), 1, 'debita uma vez');
        assert.equal(contar(gravado, /^INSERT INTO movimentacoes_carteira/), 1, 'uma reserva no extrato');
        assert.equal(contar(gravado, /^UPDATE bicos SET trabalhador_id/), 1, 'vincula o trabalhador uma vez');
        const historicoAceito = gravado.filter(
            (g) => /^INSERT INTO historico_candidaturas/.test(g.comando) && g.params[0] === CANDIDATURA_ID
        );
        assert.equal(historicoAceito.length, 1, 'um histórico do aceite');
        const recusadaAuto = gravado.filter(
            (g) => /^INSERT INTO historico_candidaturas/.test(g.comando) && g.params[0] === OUTRA_CANDIDATURA_ID
        );
        assert.equal(recusadaAuto.length, 1, 'a outra pendente é recusada uma vez só');
        mock.restoreAll();
    });

    test('lock wait timeout (1205) também é repetido', async () => {
        mock.method(console, 'error', () => {});
        const banco = criarBancoFalso({ falhas: { 1: 1205 } });
        const res = criarRespostaFalsa();

        await criarAtualizadorStatusCandidatura(banco, semEspera().opcoes)(criarReq(), res);

        assert.equal(res.destino, `/bicos/${BICO_ID}/gerenciar`);
        assert.equal(banco.estado.conexoes, 2);
        assert.equal(contar(banco.estado.gravado, /^INSERT INTO movimentacoes_carteira/), 1);
        mock.restoreAll();
    });

    test('3 deadlocks seguidos: responde 500 e nada é gravado', async () => {
        const erro = mock.method(console, 'error', () => {});
        const banco = criarBancoFalso({ falhas: { 1: 1213, 2: 1213, 3: 1213 } });
        const { esperas, opcoes } = semEspera();
        const res = criarRespostaFalsa();

        await criarAtualizadorStatusCandidatura(banco, opcoes)(criarReq(), res);

        assert.equal(res.statusCode, 500);
        assert.equal(res.corpo, 'Erro interno ao atualizar candidatura.');
        assert.equal(res.destino, null);
        assert.equal(banco.estado.conexoes, 3, 'no máximo 3 tentativas');
        assert.deepEqual(banco.estado.transacoes, [
            ['begin', 'rollback', 'release'],
            ['begin', 'rollback', 'release'],
            ['begin', 'rollback', 'release']
        ]);
        assert.equal(esperas.length, 2);
        assert.deepEqual(banco.estado.gravado, [], 'nada foi gravado');
        assert.ok(erro.mock.callCount() >= 1, 'o erro final é registrado');
        mock.restoreAll();
    });

    test('outro erro de banco: 500 na hora, sem repetir', async () => {
        mock.method(console, 'error', () => {});
        const banco = criarBancoFalso({ falhas: { 1: 1062 } });
        const { esperas, opcoes } = semEspera();
        const res = criarRespostaFalsa();

        await criarAtualizadorStatusCandidatura(banco, opcoes)(criarReq(), res);

        assert.equal(res.statusCode, 500);
        assert.equal(banco.estado.conexoes, 1, 'não repete');
        assert.deepEqual(banco.estado.transacoes, [['begin', 'rollback', 'release']]);
        assert.deepEqual(esperas, []);
        assert.deepEqual(banco.estado.gravado, []);
        mock.restoreAll();
    });

    test('sem erro: uma tentativa só, igual ao comportamento anterior', async () => {
        const banco = criarBancoFalso();
        const res = criarRespostaFalsa();

        await criarAtualizadorStatusCandidatura(banco, semEspera().opcoes)(criarReq(), res);

        assert.equal(res.destino, `/bicos/${BICO_ID}/gerenciar`);
        assert.equal(banco.estado.conexoes, 1);
        assert.deepEqual(banco.estado.transacoes, [['begin', 'commit', 'release']]);
        assert.equal(contar(banco.estado.gravado, /^UPDATE usuarios SET saldo_simulado/), 1);
    });
});
