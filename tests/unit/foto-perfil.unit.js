// Testes unitários da foto de perfil: regras do arquivo (services/fotoPerfil.js), controllers com banco falso
// e as rotas com o multer (num Express local, sem banco). Executar com: npm run test:unit
import { test, describe, after, before, mock } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers: apontamos para uma porta fechada.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';

const { detectarTipoImagem, urlDaFoto, TAMANHO_MAXIMO_FOTO } = await import('../../services/fotoPerfil.js');
const { criarSalvadorFoto, criarRemovedorFoto, criarServidorFoto, MENSAGENS_FOTO } =
    await import('../../controllers/perfilController.js');
const { criarCarregadorDadosDaSessao } = await import('../../middleware/sessaoMiddleware.js');
const { versaoDaSenha } = await import('../../services/sessaoService.js');
const { default: express } = await import('express');
const { default: roteadorPerfil } = await import('../../routes/perfilRoutes.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

// Arquivos mínimos: só os bytes iniciais importam para a detecção.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const GIF = Buffer.from('GIF89a......');
const TEXTO = Buffer.from('não sou uma imagem');

describe('detectarTipoImagem', () => {
    test('aceita JPEG, PNG e WebP pelos bytes', () => {
        assert.equal(detectarTipoImagem(JPEG), 'image/jpeg');
        assert.equal(detectarTipoImagem(PNG), 'image/png');
        assert.equal(detectarTipoImagem(WEBP), 'image/webp');
    });

    test('recusa SVG, GIF, texto, arquivo vazio e o que não é Buffer', () => {
        for (const arquivo of [SVG, GIF, TEXTO, Buffer.alloc(0), Buffer.from('RIFF'), 'texto', null]) {
            assert.equal(detectarTipoImagem(arquivo), null);
        }
    });

    test('RIFF que não é WebP (ex.: WAV) é recusado', () => {
        const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WAVEfmt ')]);
        assert.equal(detectarTipoImagem(wav), null);
    });
});

describe('urlDaFoto', () => {
    test('sem foto devolve null; com foto, a versão muda junto com a data', () => {
        assert.equal(urlDaFoto(4, null), null);
        assert.equal(urlDaFoto(4, new Date(1000)), '/perfil/4/foto?v=1000');
        assert.notEqual(urlDaFoto(4, new Date(1000)), urlDaFoto(4, new Date(2000)));
    });
});

// ------------------------------------------------------------------ controllers com banco falso
const criarBanco = (linhas = []) => {
    const banco = {
        consultas: [],
        query: async (sql, params) => {
            banco.consultas.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
            return /^SELECT/i.test(sql.trim()) ? linhas : { affectedRows: 1 };
        }
    };
    return banco;
};

const criarRes = () => {
    const res = { statusCode: 200, cabecalhos: {}, destino: null, corpo: null };
    res.status = (codigo) => {
        res.statusCode = codigo;
        return res;
    };
    res.redirect = (destino) => {
        res.destino = destino;
        return res;
    };
    res.send = (corpo) => {
        res.corpo = corpo;
        return res;
    };
    res.set = (cabecalhos) => {
        Object.assign(res.cabecalhos, cabecalhos);
        return res;
    };
    return res;
};

const reqLogado = (extra = {}) => ({ session: { usuario: { id: 4 } }, ...extra });

describe('salvar a foto', () => {
    test('grava com o tipo detectado pelos bytes, não o informado pelo navegador', async () => {
        const banco = criarBanco();
        const req = reqLogado({ file: { buffer: PNG, mimetype: 'image/jpeg' } });
        const res = criarRes();

        await criarSalvadorFoto(banco)(req, res);

        assert.equal(res.destino, '/perfil');
        assert.equal(req.session.alerta, undefined);
        assert.equal(banco.consultas.length, 1);
        assert.match(banco.consultas[0].sql, /^INSERT INTO fotos_perfil .* ON DUPLICATE KEY UPDATE/);
        assert.deepEqual(banco.consultas[0].params, [4, 'image/png', PNG]);
    });

    for (const [descricao, arquivo, mensagem] of [
        ['sem arquivo', undefined, MENSAGENS_FOTO.semArquivo],
        ['SVG renomeado', { buffer: SVG, mimetype: 'image/png' }, MENSAGENS_FOTO.tipoInvalido],
        ['texto renomeado', { buffer: TEXTO, mimetype: 'image/png' }, MENSAGENS_FOTO.tipoInvalido]
    ]) {
        test(`${descricao}: não grava e volta ao perfil com alerta`, async () => {
            const banco = criarBanco();
            const req = reqLogado({ file: arquivo });
            const res = criarRes();

            await criarSalvadorFoto(banco)(req, res);

            assert.equal(res.destino, '/perfil');
            assert.deepEqual(req.session.alerta, { tipo: 'erro', mensagem });
            assert.equal(banco.consultas.length, 0);
        });
    }

    test('sem login: vai para o login sem gravar', async () => {
        const banco = criarBanco();
        const res = criarRes();

        await criarSalvadorFoto(banco)({ session: {}, file: { buffer: PNG } }, res);

        assert.equal(res.destino, '/login');
        assert.equal(banco.consultas.length, 0);
    });

    test('erro de banco: alerta, sem 500', async () => {
        mock.method(console, 'error', () => {});
        const banco = {
            query: async () => {
                throw Object.assign(new Error('fora do ar'), { code: 'ECONNREFUSED' });
            }
        };
        const req = reqLogado({ file: { buffer: JPEG } });
        const res = criarRes();

        await criarSalvadorFoto(banco)(req, res);

        assert.equal(res.destino, '/perfil');
        assert.equal(req.session.alerta.mensagem, MENSAGENS_FOTO.erroInterno);
        mock.restoreAll();
    });
});

describe('remover a foto', () => {
    test('apaga só a foto de quem está logado', async () => {
        const banco = criarBanco();
        const res = criarRes();

        await criarRemovedorFoto(banco)(reqLogado({ body: { usuario_id: 99 } }), res);

        assert.equal(res.destino, '/perfil');
        assert.deepEqual(banco.consultas, [{ sql: 'DELETE FROM fotos_perfil WHERE usuario_id = ?', params: [4] }]);
    });
});

describe('exibir a foto', () => {
    test('com foto: os bytes, o tipo salvo, nosniff e cache privado', async () => {
        const res = criarRes();
        await criarServidorFoto(criarBanco([{ tipo: 'image/png', dados: PNG }]))({ params: { id: '4' } }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.corpo, PNG);
        assert.equal(res.cabecalhos['Content-Type'], 'image/png');
        assert.equal(res.cabecalhos['X-Content-Type-Options'], 'nosniff');
        assert.match(res.cabecalhos['Cache-Control'], /^private/);
    });

    test('sem foto: 404', async () => {
        const res = criarRes();
        await criarServidorFoto(criarBanco([]))({ params: { id: '4' } }, res);

        assert.equal(res.statusCode, 404);
    });

    for (const id of ['abc', '0', '-1', '1.5', '99999999999']) {
        test(`id ${JSON.stringify(id)}: 400 sem consultar o banco`, async () => {
            const banco = criarBanco();
            const res = criarRes();
            await criarServidorFoto(banco)({ params: { id } }, res);

            assert.equal(res.statusCode, 400);
            assert.equal(banco.consultas.length, 0);
        });
    }
});

describe('barra lateral recebe a URL da foto (carregarDadosDaSessao)', () => {
    const rodar = async (fotoAtualizadaEm) => {
        const hash = '$2b$10$hashqualquer';
        const banco = {
            query: async () => [{ saldo_simulado: '5.00', senha: hash, foto_atualizada_em: fotoAtualizadaEm }]
        };
        const req = {
            method: 'GET',
            path: '/homeContratante',
            headers: {},
            session: { usuario: { id: 4, saldo_simulado: 5 }, versaoSenha: versaoDaSenha(hash) }
        };
        const res = { locals: {} };
        await criarCarregadorDadosDaSessao(banco)(req, res, () => {});
        return res.locals.fotoPerfilUrl;
    };

    test('com foto: /perfil/<id>/foto com a versão', async () => {
        assert.equal(await rodar(new Date(5000)), '/perfil/4/foto?v=5000');
    });

    test('sem foto: null (a barra mostra as iniciais)', async () => {
        assert.equal(await rodar(null), null);
    });
});

// ------------------------------------------------------------------ rotas com o multer (Express local)
describe('rotas da foto com o multer', () => {
    let servidor;
    let base;
    const sessoes = [];

    before(async () => {
        const app = express();
        // Sessão falsa: cada requisição ganha uma sessão logada, guardada para o teste conferir o alerta.
        app.use((req, _res, next) => {
            req.session = { usuario: { id: 4 } };
            sessoes.push(req.session);
            next();
        });
        app.use('/perfil', roteadorPerfil);
        await new Promise((resolve) => {
            servidor = app.listen(0, '127.0.0.1', resolve);
        });
        base = `http://127.0.0.1:${servidor.address().port}`;
    });

    after(() => new Promise((resolve) => servidor.close(resolve)));

    const enviar = (campo, bytes) => {
        const formulario = new FormData();
        formulario.append(campo, new Blob([bytes], { type: 'image/png' }), 'foto.png');
        return fetch(`${base}/perfil/foto`, { method: 'POST', body: formulario, redirect: 'manual' });
    };

    test('arquivo acima de 2 MB: volta ao perfil com o alerta de tamanho, sem chegar ao banco', async () => {
        const grande = Buffer.concat([PNG, Buffer.alloc(TAMANHO_MAXIMO_FOTO)]);
        const resposta = await enviar('foto', grande);

        assert.equal(resposta.status, 302);
        assert.equal(resposta.headers.get('location'), '/perfil');
        assert.equal(sessoes.at(-1).alerta.mensagem, MENSAGENS_FOTO.grandeDemais);
    });

    test('campo com outro nome: recusado com alerta', async () => {
        const resposta = await enviar('arquivo', PNG);

        assert.equal(resposta.status, 302);
        assert.equal(sessoes.at(-1).alerta.mensagem, MENSAGENS_FOTO.semArquivo);
    });

    test('arquivo que não é imagem: recusado antes de chegar ao banco', async () => {
        const resposta = await enviar('foto', TEXTO);

        assert.equal(resposta.status, 302);
        assert.equal(sessoes.at(-1).alerta.mensagem, MENSAGENS_FOTO.tipoInvalido);
    });
});
