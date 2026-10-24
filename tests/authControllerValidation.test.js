import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { criarCadastradorUsuario } from '../controllers/authController.js';
import pool from '../config/database.js';

after(async () => {
    await pool.end();
});

const criarResposta = () => ({
    statusCode: null,
    mensagem: null,
    destino: null,
    visualizacao: null,
    dadosVisualizacao: null,
    status(codigo) {
        this.statusCode = codigo;
        return this;
    },
    send(mensagem) {
        this.mensagem = mensagem;
        return this;
    },
    redirect(destino) {
        this.destino = destino;
        return this;
    },
    render(visualizacao, dados) {
        this.visualizacao = visualizacao;
        this.dadosVisualizacao = dados;
        return this;
    }
});

const criarBodyCadastro = (sobrescritas = {}) => ({
    nome: 'Ana Silva',
    email: 'ANA@EXEMPLO.COM',
    cpf: '52998224725',
    senha: 'senha-segura',
    confirmarSenha: 'senha-segura',
    tipoPerfil: 'Trabalhador',
    termos: 'on',
    maiorIdade: 'true',
    ...sobrescritas
});

test('cadastra com e-mail normalizado e CPF canônico', async () => {
    const chamadas = [];
    const banco = {
        async query(sql, parametros) {
            chamadas.push({ sql, parametros });
            return [];
        }
    };
    const hasher = {
        async genSalt() {
            return 'salt';
        },
        async hash() {
            return 'hash';
        }
    };
    const resposta = criarResposta();

    await criarCadastradorUsuario(banco, hasher)(
        { body: criarBodyCadastro() },
        resposta
    );

    assert.equal(resposta.destino, '/login');
    assert.deepEqual(chamadas[0].parametros, [
        'ana@exemplo.com',
        '529.982.247-25',
        '52998224725'
    ]);
    assert.deepEqual(chamadas[1].parametros, [
        'Ana Silva',
        'ana@exemplo.com',
        '529.982.247-25',
        18,
        'hash',
        'trabalhador'
    ]);
});

test('rejeita valores fora dos limites antes de consultar o banco', async () => {
    let consultado = false;
    const banco = {
        async query() {
            consultado = true;
            return [];
        }
    };
    const resposta = criarResposta();

    await criarCadastradorUsuario(banco, {})(
        { body: criarBodyCadastro({ senha: 'é'.repeat(37) }) },
        resposta
    );

    assert.equal(resposta.statusCode, 400);
    assert.equal(resposta.visualizacao, 'cadastrar');
    assert.equal(resposta.dadosVisualizacao.erro, 'A senha deve ter ao menos 6 caracteres e no máximo 72 bytes.');
    assert.deepEqual(resposta.dadosVisualizacao.dados, {
        nome: 'Ana Silva',
        email: 'ana@exemplo.com',
        cpf: '52998224725',
        tipoPerfil: 'trabalhador'
    });
    assert.equal(consultado, false);
});
