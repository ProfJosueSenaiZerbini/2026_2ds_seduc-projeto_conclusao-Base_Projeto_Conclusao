// Testes unitários do tratador final de erros: o usuário nunca recebe a pilha de chamadas.
// Sobem um Express mínimo numa porta temporária; não usam banco nem internet.
// Executar com: npm run test:unit
import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { tratarErro } from '../../middleware/erroMiddleware.js';

let servidor;
let base;

before(async () => {
    mock.method(console, 'error', () => {});
    mock.method(console, 'warn', () => {});

    const app = express();
    app.use(express.json());
    app.post('/eco', (req, res) => res.json(req.body));
    app.get('/quebra', async () => {
        throw new Error('detalhe interno em C:\\projeto\\arquivo.js');
    });
    app.use(tratarErro);

    await new Promise((resolve) => {
        servidor = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
    servidor.close();
    mock.restoreAll();
});

describe('tratador final de erros', () => {
    test('erro inesperado: 500 com mensagem genérica, sem pilha', async () => {
        const resposta = await fetch(`${base}/quebra`);

        assert.equal(resposta.status, 500);
        assert.equal(await resposta.text(), 'Erro interno do servidor.');
    });

    test('JSON malformado: 400 em JSON, sem pilha', async () => {
        const resposta = await fetch(`${base}/eco`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{x'
        });

        assert.equal(resposta.status, 400);
        assert.deepEqual(await resposta.json(), { sucesso: false, erro: 'Requisição inválida.' });
    });

    test('corpo grande demais mantém o status 413', async () => {
        const resposta = await fetch(`${base}/eco`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: 'a'.repeat(200_000) })
        });

        assert.equal(resposta.status, 413);
        assert.equal((await resposta.json()).erro, 'O conteúdo enviado é grande demais.');
    });
});
