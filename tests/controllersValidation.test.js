import test from 'node:test';
import assert from 'node:assert/strict';
import { atualizarPerfil } from '../controllers/perfilController.js';
import { cadastrarBico } from '../controllers/bicoController.js';

const criarResposta = () => ({
    statusCode: null,
    mensagem: null,
    status(codigo) {
        this.statusCode = codigo;
        return this;
    },
    send(mensagem) {
        this.mensagem = mensagem;
        return this;
    },
    redirect(url) {
        this.redirecionadoPara = url;
        return this;
    }
});

test('atualizarPerfil rejeita idade abaixo de 18 anos', async () => {
    const resposta = criarResposta();

    await atualizarPerfil({
        session: { usuario: { id: 1 } },
        body: { nome: 'Ana', email: 'ana@example.com', idade: '17' }
    }, resposta);

    assert.equal(resposta.statusCode, 400);
});

test('atualizarPerfil rejeita idade que nao seja um inteiro', async () => {
    const resposta = criarResposta();

    await atualizarPerfil({
        session: { usuario: { id: 1 } },
        body: { nome: 'Ana', email: 'ana@example.com', idade: '18.5' }
    }, resposta);

    assert.equal(resposta.statusCode, 400);
});

for (const valor of ['0', '-0.01', 'invalido']) {
    test(`cadastrarBico rejeita valor ${valor}`, async () => {
        const resposta = criarResposta();

        await cadastrarBico({
            session: { usuario: { id: 1 } },
            body: { valor }
        }, resposta);

        assert.equal(resposta.statusCode, 400);
    });
}