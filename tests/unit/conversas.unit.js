// Testes unitários da caixa de conversas (GET /conversas): regra de permissão, montagem da lista e estado vazio,
// com banco falso. Executar com: npm run test:unit
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar o controller: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { criarListadorConversas, cortarPrevia } = await import('../../controllers/conversasController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

const criarRes = () => {
    const res = { statusCode: 200, view: null, dados: null, destino: null, texto: null };
    res.status = (codigo) => {
        res.statusCode = codigo;
        return res;
    };
    res.render = (view, dados) => {
        res.view = view;
        res.dados = dados;
        return res;
    };
    res.redirect = (destino) => {
        res.destino = destino;
        return res;
    };
    res.send = (texto) => {
        res.texto = texto;
        return res;
    };
    return res;
};

const bancoCom = (linhas) => {
    const banco = {
        consultas: [],
        query: async (sql, params) => {
            banco.consultas.push({ comando: sql.replace(/\s+/g, ' ').trim(), params });
            return linhas;
        }
    };
    return banco;
};

const reqDe = (perfil, id = 7) => ({ session: { usuario: { id, tipo_perfil: perfil } } });

const linha = (extra) => ({
    candidatura_id: 4,
    titulo: 'Ajudante para evento',
    bico_status: 'Em andamento',
    outro_id: 9,
    outro_nome: 'Diego Santos',
    outro_foto_em: null,
    ultima_remetente_id: 9,
    ultima_texto: 'Combinado, estarei lá às 9h30.',
    ultima_horario: '25/11/2026 10:30',
    ...extra
});

describe('cortarPrevia', () => {
    test('junta quebras de linha e espaços repetidos', () => {
        assert.equal(cortarPrevia('  olá\n\n  tudo   bem  '), 'olá tudo bem');
    });

    test('corta no limite com reticências, sem partir emoji', () => {
        assert.equal(cortarPrevia('😀'.repeat(10), 5), `${'😀'.repeat(4)}…`);
        assert.equal([...cortarPrevia('a'.repeat(200))].length, 70);
    });

    test('texto curto fica como está', () => {
        assert.equal(cortarPrevia('Oi!'), 'Oi!');
    });
});

describe('GET /conversas', () => {
    test('contratante: filtra por candidaturas Aceito do próprio bico e monta a lista', async () => {
        const banco = bancoCom([
            linha(),
            linha({ candidatura_id: 5, outro_nome: 'Rafael Souza', ultima_texto: null, ultima_remetente_id: null })
        ]);
        const res = criarRes();

        await criarListadorConversas(banco)(reqDe('contratante'), res);

        assert.equal(res.view, 'conversas');
        assert.equal(res.dados.perfil, 'contratante');
        const [consulta] = banco.consultas;
        assert.match(consulta.comando, /c\.status = 'Aceito'/);
        assert.match(consulta.comando, /b\.contratante_id = \?/);
        assert.match(consulta.comando, /c\.trabalhador_id = \?/);
        assert.deepEqual(consulta.params, ['contratante', 'contratante', 7, 'contratante', 7]);

        const [primeira, segunda] = res.dados.conversas;
        assert.equal(primeira.candidaturaId, 4);
        assert.equal(primeira.outroNome, 'Diego Santos');
        assert.equal(primeira.ultimaPrevia, 'Combinado, estarei lá às 9h30.');
        assert.equal(primeira.ultimaPropria, false);
        assert.equal(primeira.ultimaHorario, '25/11/2026 10:30');
        assert.equal(primeira.outroFotoUrl, null);
        assert.equal(segunda.temMensagem, false);
        assert.equal(segunda.ultimaPrevia, '');
    });

    test('marca a última mensagem como própria e monta a URL da foto da outra pessoa', async () => {
        const banco = bancoCom([linha({ ultima_remetente_id: 20, outro_foto_em: new Date('2026-11-20T12:00:00Z') })]);
        const res = criarRes();

        await criarListadorConversas(banco)(reqDe('trabalhador', 20), res);

        const [c] = res.dados.conversas;
        assert.equal(c.ultimaPropria, true);
        assert.match(c.outroFotoUrl, /^\/perfil\/9\/foto\?v=\d+$/);
        assert.deepEqual(banco.consultas[0].params, ['trabalhador', 'trabalhador', 20, 'trabalhador', 20]);
    });

    test('sem conversas: renderiza a lista vazia (estado vazio na view)', async () => {
        const res = criarRes();
        await criarListadorConversas(bancoCom([]))(reqDe('trabalhador'), res);

        assert.equal(res.view, 'conversas');
        assert.deepEqual(res.dados.conversas, []);
    });

    test('sem usuário na sessão: redireciona ao login sem consultar o banco', async () => {
        const banco = bancoCom([]);
        const res = criarRes();
        await criarListadorConversas(banco)({ session: {} }, res);

        assert.equal(res.destino, '/login');
        assert.equal(banco.consultas.length, 0);
    });

    test('perfil desconhecido: 403 sem consultar o banco', async () => {
        const banco = bancoCom([]);
        const res = criarRes();
        await criarListadorConversas(banco)(reqDe('admin'), res);

        assert.equal(res.statusCode, 403);
        assert.equal(banco.consultas.length, 0);
    });

    test('erro no banco: 500 com mensagem genérica', async () => {
        const res = criarRes();
        const original = console.error;
        console.error = () => {};
        try {
            await criarListadorConversas({
                query: async () => {
                    throw new Error('falha');
                }
            })(reqDe('contratante'), res);
        } finally {
            console.error = original;
        }

        assert.equal(res.statusCode, 500);
        assert.equal(res.texto, 'Erro ao carregar as conversas.');
    });
});
