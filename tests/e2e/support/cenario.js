// Helpers compartilhados pelos E2E do roteiro de testes (CT02 a CT13).
// Cada teste cria as próprias contas e bicos (e-mails e títulos únicos), pelas rotas reais da aplicação.
import 'dotenv/config';
import mariadb from 'mariadb';
import { expect } from '@playwright/test';
import { gerarCpfDeUmNove } from './gerarCpf.js';

export const BASE = 'http://localhost:3000';
export const SENHA = '123456';

let contador = 0;
export const sufixoUnico = () => `${Date.now()}_${process.pid}_${++contador}_${Math.floor(Math.random() * 1e6)}`;

export const formulario = (campos) => ({ form: campos, maxRedirects: 0, failOnStatusCode: false });

export const paraNumero = (textoBR) => Number(textoBR.replace(/\./g, '').replace(',', '.'));

export const dataFutura = (dias = 7) => {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split('T')[0];
};

// Cria uma conta nova e entra com ela. Devolve { ctx, email, nome }.
export const criarConta = async (browser, tipoPerfil, rotulo = tipoPerfil) => {
    const ctx = await browser.newContext();
    const email = `${rotulo}_${sufixoUnico()}@gmail.com`.toLowerCase(); // a aplicação grava o e-mail em minúsculas
    const nome = `${rotulo} Roteiro ${sufixoUnico()}`.slice(0, 60);

    const cadastro = await ctx.request.post(
        `${BASE}/cadastrar`,
        formulario({
            nome,
            email,
            cpf: gerarCpfDeUmNove(),
            idade: '30',
            senha: SENHA,
            confirmarSenha: SENHA,
            tipoPerfil,
            termos: 'on',
            maiorIdade: 'true'
        })
    );
    expect(cadastro.status(), `cadastro de ${rotulo}`).toBe(302);

    const login = await ctx.request.post(`${BASE}/login`, formulario({ email, senha: SENHA, tipoPerfil }));
    expect(login.status(), `login de ${rotulo}`).toBe(302);

    return { ctx, email, nome };
};

export const lerSaldoContratante = async (ctx) => {
    const html = await (await ctx.request.get(`${BASE}/carteira/contratante`)).text();
    const saldo = /wallet__balance">\s*R\$\s*([\d.]+,\d{2})/.exec(html);
    expect(saldo, 'saldo na carteira do contratante').not.toBeNull();
    return paraNumero(saldo[1]);
};

export const lerSaldoTrabalhador = async (ctx) => {
    const html = await (await ctx.request.get(`${BASE}/carteira/trabalhador`)).text();
    const saldo = /id="saldo-disponivel">\s*R\$\s*([\d.]+,\d{2})/.exec(html);
    expect(saldo, 'saldo na carteira do trabalhador').not.toBeNull();
    return paraNumero(saldo[1]);
};

export const adicionarSaldo = async (ctx, valor) => {
    const resposta = await ctx.request.post(
        `${BASE}/carteira/contratante/adicionar-saldo`,
        formulario({ valor: valor.toFixed(2) })
    );
    expect(resposta.status()).toBe(302);
};

// CEPs do provedor falso (o servidor dos testes roda com CEP_FAKE=1; ver services/cepService.js).
export const CEP_TESTE = '01310-100'; // Avenida Paulista, Bela Vista, São Paulo/SP
export const CEP_GERAL_TESTE = '13690-000'; // CEP geral de Descalvado/SP (sem rua e bairro)
export const CEP_INEXISTENTE_TESTE = '99999-999';
export const ENDERECO_TESTE = { logradouro: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' };

// Campos de endereço válidos para publicar um bico pelas rotas (POST /bicos/novo).
export const enderecoBico = (extra = {}) => ({ cep: CEP_TESTE, numero: '1000', ...extra });

// Pela tela: digita o CEP, espera a consulta preencher a rua e informa o número.
export const preencherEnderecoNaTela = async (page, { cep = CEP_TESTE, numero = '1000' } = {}) => {
    await page.locator('input[name="cep"]').fill(cep);
    await expect(page.locator('#cep-status')).toHaveClass(/cep-status--(ok|aviso)/);
    await page.locator('input[name="numero"]').fill(numero);
};

// `extra` sobrescreve/acrescenta campos do formulário (ex.: tentar enviar logradouro e bairro forjados).
export const publicarBico = async (ctx, titulo, valor = 150, extra = {}) => {
    const resposta = await ctx.request.post(
        `${BASE}/bicos/novo`,
        formulario({
            titulo,
            descricao: 'Bico criado pelo teste automatizado do roteiro.',
            valor: valor.toFixed(2),
            ...enderecoBico(),
            data_servico: dataFutura(),
            horario: '10:00',
            ...extra
        })
    );
    expect(resposta.status(), 'publicação do bico').toBe(302);

    const html = await (await ctx.request.get(`${BASE}/bicos/ativos`)).text();
    // Cada card traz o link de gerenciar; localizamos o do título único.
    const cartao = html.split('<article').find((trecho) => trecho.includes(titulo));
    expect(cartao, 'bico publicado aparece em /bicos/ativos').toBeTruthy();
    const id = /\/bicos\/(\d+)\/gerenciar/.exec(cartao);
    expect(id, 'link de gerenciar do bico').not.toBeNull();
    return Number(id[1]);
};

export const candidatar = (ctxTrabalhador, bicoId, mensagem = 'Tenho interesse neste bico.') =>
    ctxTrabalhador.request.post(`${BASE}/bicos/candidatar`, formulario({ bico_id: String(bicoId), mensagem }));

// Lê a tela de gerenciamento e devolve [{ candidaturaId, status, nome, trabalhadorId }] de todos os candidatos.
export const listarCandidatos = async (ctxContratante, bicoId) => {
    const html = await (await ctxContratante.request.get(`${BASE}/bicos/${bicoId}/gerenciar`)).text();
    return html
        .split('<article class="candidate-card">')
        .slice(1)
        .map((bloco) => ({
            candidaturaId:
                Number(
                    (/name="candidatura_id" value="(\d+)"/.exec(bloco) ||
                        /candidaturas\/(\d+)\/chat/.exec(bloco) ||
                        [])[1]
                ) || null,
            nome: (/candidate-card__name">\s*([^<]+?)\s*<\/h3>/.exec(bloco) || [])[1],
            trabalhadorId: Number((/\/perfil\/publico\/(\d+)/.exec(bloco) || [])[1]) || null,
            status: (/Status:\s*<strong>\s*([A-Za-zçã ]+?)\s*<\/strong>/.exec(bloco) || [])[1]
        }));
};

export const aceitar = (ctxContratante, candidaturaId) =>
    ctxContratante.request.post(
        `${BASE}/bicos/candidaturas/status`,
        formulario({
            candidatura_id: String(candidaturaId),
            novo_status: 'Aceito'
        })
    );

// Status da candidatura do próprio trabalhador, lido em /bicos/:id.
export const statusDaMinhaCandidatura = async (ctxTrabalhador, bicoId) => {
    const html = await (await ctxTrabalhador.request.get(`${BASE}/bicos/${bicoId}`)).text();
    const status = /candidatura-status__value[^>]*>[\s\S]*?<\/i>\s*([A-Za-zçã]+)\s*<\/strong>/.exec(html);
    return status ? status[1] : null;
};

export const statusDoBico = async (ctxContratante, bicoId) => {
    const html = await (await ctxContratante.request.get(`${BASE}/bicos/${bicoId}/gerenciar`)).text();
    const m = /id="status-bico"[^>]*>[\s\S]*?<\/i>\s*([A-Za-zçã ]+?)\s*<\/span>/.exec(html);
    return m ? m[1].trim() : null;
};

// Consulta somente leitura ao banco (para conferir registros que nenhuma tela exibe).
export const consultarBanco = async (sql, params = []) => {
    const conexao = await mariadb.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        return await conexao.query(sql, params);
    } finally {
        await conexao.end();
    }
};

// Escrita no banco, usada somente para envelhecer dados que o próprio teste criou (ex.: simular que o
// prazo de 7 dias de avaliação já passou). Nunca aponta para dados de outros testes.
export const executarNoBanco = async (sql, params = []) => consultarBanco(sql, params);

// Faz a finalização do bico "acontecer" há N dias (evento de finalização e crédito do pagamento).
export const envelhecerFinalizacao = async (bicoId, dias) => {
    await executarNoBanco(
        `UPDATE historico_eventos_bicos SET data_evento = DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE bico_id = ? AND status_novo = 'Finalizado'`,
        [dias, bicoId]
    );
    await executarNoBanco(
        `UPDATE movimentacoes_carteira SET criado_em = DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE bico_id = ? AND tipo_movimentacao = 'CREDITO'`,
        [dias, bicoId]
    );
};
