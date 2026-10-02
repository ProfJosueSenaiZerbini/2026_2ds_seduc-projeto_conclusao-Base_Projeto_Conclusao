import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

// Cria um objeto minimo para testar o middleware sem iniciar o servidor.
const criarResposta = () => ({
    statusCode: null,
    mensagem: null,
    redirecionadoPara: null,
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

test('requireAuth redireciona usuario anonimo', () => {
    const resposta = criarResposta();
    let chamado = false;

    requireAuth({ session: {} }, resposta, () => {
        chamado = true;
    });

    assert.equal(resposta.redirecionadoPara, '/login');
    assert.equal(chamado, false);
});

test('requireAuth permite usuario autenticado', () => {
    const resposta = criarResposta();
    let chamado = false;

    requireAuth({ session: { usuario: { id: 1 } } }, resposta, () => {
        chamado = true;
    });

    assert.equal(chamado, true);
});

test('requireRole bloqueia perfil diferente', () => {
    const resposta = criarResposta();

    requireRole('contratante')(
        { session: { usuario: { tipo_perfil: 'trabalhador' } } },
        resposta,
        () => assert.fail('next nao deveria ser chamado')
    );

    assert.equal(resposta.statusCode, 403);
});

test('requireRole permite perfil sem diferenciar maiusculas', () => {
    const resposta = criarResposta();
    let chamado = false;

    requireRole('trabalhador')(
        { session: { usuario: { tipo_perfil: 'Trabalhador' } } },
        resposta,
        () => {
            chamado = true;
        }
    );

    assert.equal(chamado, true);
});
