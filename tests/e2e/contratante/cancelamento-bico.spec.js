import { test, expect } from '@playwright/test';
import { gerarCpfDeUmNove } from '../support/gerarCpf.js';
import { enderecoBico } from '../support/cenario.js';

// Cancelamento de bico pelo contratante (POST /bicos/:id/cancelar).
// Os dados são montados pelas rotas reais da aplicação, com contas fictícias novas a cada execução.
// Requer o banco com o tipo ESTORNO (schema.sql atual ou migrations/001_estorno.sql).
const BASE = 'http://localhost:3000';
const SENHA = '123456';
const VALOR = 150;
const OBSERVACAO = 'Bico cancelado pelo contratante';

test.describe.configure({ mode: 'serial' });

test.describe('Cancelamento de bico pelo contratante', () => {
    let navegador;
    const sessoes = {};

    const formulario = (campos) => ({
        form: campos,
        maxRedirects: 0,
        failOnStatusCode: false
    });

    const cadastrarEEntrar = async (chave, tipoPerfil) => {
        const ctx = await navegador.newContext();
        const email = `${chave}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@gmail.com`;

        const cadastro = await ctx.request.post(
            `${BASE}/cadastrar`,
            formulario({
                nome: `${chave} Teste E2E`,
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
        expect(cadastro.status(), `cadastro de ${chave}`).toBe(302);

        const login = await ctx.request.post(`${BASE}/login`, formulario({ email, senha: SENHA, tipoPerfil }));
        expect(login.status(), `login de ${chave}`).toBe(302);

        sessoes[chave] = { ctx, email };
        return ctx;
    };

    const lerSaldo = async (ctx) => {
        const html = await (await ctx.request.get(`${BASE}/carteira/contratante`)).text();
        const saldo = /wallet__balance">\s*R\$\s*([\d.]+,\d{2})/.exec(html);
        expect(saldo, 'saldo na carteira do contratante').not.toBeNull();
        return Number(saldo[1].replace('.', '').replace(',', '.'));
    };

    const adicionarSaldo = async (ctx, valor) => {
        const resposta = await ctx.request.post(
            `${BASE}/carteira/contratante/adicionar-saldo`,
            formulario({ valor: valor.toFixed(2) })
        );
        expect(resposta.status()).toBe(302);
    };

    // Texto exibido no extrato para o estorno de um bico (título do bico, não o id).
    const textoEstorno = (titulo) => `Estorno – ${titulo}`;

    const publicarBico = async (ctx, titulo) => {
        const data = new Date();
        data.setDate(data.getDate() + 7);

        const resposta = await ctx.request.post(
            `${BASE}/bicos/novo`,
            formulario({
                titulo,
                descricao: 'Bico criado pelo teste automatizado de cancelamento.',
                valor: VALOR.toFixed(2),
                ...enderecoBico(),
                data_servico: data.toISOString().split('T')[0],
                horario: '10:00'
            })
        );
        expect(resposta.status()).toBe(302);

        const html = await (await ctx.request.get(`${BASE}/bicos/ativos`)).text();
        const ids = [...html.matchAll(/\/bicos\/(\d+)\/gerenciar/g)].map((m) => Number(m[1]));
        expect(ids.length, 'bico publicado aparece em /bicos/ativos').toBeGreaterThan(0);
        return Math.max(...ids);
    };

    const candidatar = async (ctxTrabalhador, bicoId) => {
        const resposta = await ctxTrabalhador.request.post(
            `${BASE}/bicos/candidatar`,
            formulario({
                bico_id: String(bicoId),
                mensagem: 'Tenho interesse neste bico.'
            })
        );
        expect(resposta.status()).toBe(302);
    };

    const idCandidaturaPendente = async (ctxContratante, bicoId) => {
        const html = await (await ctxContratante.request.get(`${BASE}/bicos/${bicoId}/gerenciar`)).text();
        const id = /name="candidatura_id" value="(\d+)"/.exec(html);
        expect(id, 'candidatura pendente na tela de gerenciamento').not.toBeNull();
        return Number(id[1]);
    };

    const aceitar = async (ctxContratante, candidaturaId) => {
        const resposta = await ctxContratante.request.post(
            `${BASE}/bicos/candidaturas/status`,
            formulario({
                candidatura_id: String(candidaturaId),
                novo_status: 'Aceito'
            })
        );
        expect(resposta.status()).toBe(302);
    };

    const cancelar = (ctx, bicoId, motivo) =>
        ctx.request.post(`${BASE}/bicos/${bicoId}/cancelar`, {
            form: motivo === undefined ? {} : { motivo },
            failOnStatusCode: false
        });

    test.beforeAll(async ({ browser }) => {
        // Cada usuário usa um contexto próprio (sessão e cookies separados).
        navegador = browser;
        await cadastrarEEntrar('contratante', 'contratante');
        await cadastrarEEntrar('trabalhador', 'trabalhador');
        await cadastrarEEntrar('outro', 'contratante');
    });

    test.afterAll(async () => {
        for (const { ctx } of Object.values(sessoes)) {
            await ctx.close();
        }
    });

    test('cancela bico Aberto: sem estorno e candidaturas pendentes recusadas', async () => {
        const { contratante, trabalhador } = sessoes;
        const titulo = `Cancelar aberto ${Date.now()}`;

        await adicionarSaldo(contratante.ctx, 200);
        const saldoAntes = await lerSaldo(contratante.ctx);
        const bicoId = await publicarBico(contratante.ctx, titulo);
        await candidatar(trabalhador.ctx, bicoId);

        const resposta = await cancelar(contratante.ctx, bicoId, 'Não preciso mais do serviço');
        expect(resposta.status()).toBe(200);
        const corpo = await resposta.json();
        expect(corpo).toMatchObject({ sucesso: true, status: 'Cancelado', valorEstornado: 0 });

        // Sem reserva, o saldo não muda e não há ESTORNO no extrato.
        expect(await lerSaldo(contratante.ctx)).toBe(saldoAntes);
        const extrato = await (await contratante.ctx.request.get(`${BASE}/carteira/contratante`)).text();
        expect(extrato).not.toContain(textoEstorno(titulo));

        // O bico sai de "Bicos ativos" e a candidatura aparece como Recusada para o trabalhador.
        const ativos = await (await contratante.ctx.request.get(`${BASE}/bicos/ativos`)).text();
        expect(ativos).not.toContain(`/bicos/${bicoId}/gerenciar`);

        const pagina = await trabalhador.ctx.newPage();
        await pagina.goto(`${BASE}/historico`);
        const recusados = pagina.locator('#recusados');
        await expect(recusados).toContainText(titulo);
        await expect(recusados).toContainText(OBSERVACAO);
        await expect(pagina.locator('#pendentes')).not.toContainText(titulo);
        await expect(pagina.locator('#aceitos')).not.toContainText(titulo);
        await pagina.close();
    });

    test('cancela bico Em andamento: estorna a reserva e atualiza extrato, histórico e chat', async () => {
        const { contratante, trabalhador } = sessoes;
        const titulo = `Cancelar andamento ${Date.now()}`;

        await adicionarSaldo(contratante.ctx, 300);
        const bicoId = await publicarBico(contratante.ctx, titulo);
        await candidatar(trabalhador.ctx, bicoId);
        const candidaturaId = await idCandidaturaPendente(contratante.ctx, bicoId);

        const saldoAntesAceite = await lerSaldo(contratante.ctx);
        await aceitar(contratante.ctx, candidaturaId);
        expect(await lerSaldo(contratante.ctx), 'a reserva desconta o saldo').toBe(saldoAntesAceite - VALOR);

        const resposta = await cancelar(contratante.ctx, bicoId, 'Imprevisto');
        expect(resposta.status()).toBe(200);
        expect(await resposta.json()).toMatchObject({ sucesso: true, status: 'Cancelado', valorEstornado: VALOR });

        // Saldo: o valor reservado volta ao contratante.
        expect(await lerSaldo(contratante.ctx)).toBe(saldoAntesAceite);

        // Extrato: o estorno é uma entrada.
        const paginaContratante = await contratante.ctx.newPage();
        await paginaContratante.goto(`${BASE}/carteira/contratante`);
        const linhaEstorno = paginaContratante.locator('tr', { hasText: textoEstorno(titulo) });
        await expect(linhaEstorno).toHaveCount(1);
        await expect(linhaEstorno).toContainText('Entrada');
        await expect(linhaEstorno).toContainText('Valor estornado');
        await expect(linhaEstorno).toContainText('+ R$ 150,00');
        await paginaContratante.close();

        // Histórico do trabalhador: não aparece em andamento; aparece como cancelado pelo contratante.
        const paginaTrabalhador = await trabalhador.ctx.newPage();
        await paginaTrabalhador.goto(`${BASE}/historico`);
        await expect(paginaTrabalhador.locator('#aceitos')).not.toContainText(titulo);
        const cancelados = paginaTrabalhador.locator('#cancelados');
        await expect(cancelados).toContainText(titulo);
        await expect(cancelados).toContainText('Cancelado pelo contratante');
        await expect(cancelados).toContainText('Imprevisto');

        // Chat: leitura continua; envio bloqueado na tela e no servidor.
        await paginaTrabalhador.goto(`${BASE}/bicos/candidaturas/${candidaturaId}/chat`);
        await expect(paginaTrabalhador.locator('#input-mensagem')).toBeDisabled();
        await expect(paginaTrabalhador.locator('#chat-feedback')).toContainText('cancelado');
        await paginaTrabalhador.close();

        const envio = await trabalhador.ctx.request.post(`${BASE}/bicos/candidaturas/${candidaturaId}/chat/mensagens`, {
            form: { texto: 'Olá, ainda posso ir?' },
            failOnStatusCode: false
        });
        expect(envio.status()).toBe(409);
        expect((await envio.json()).erro).toMatch(/cancelado/);

        const leitura = await trabalhador.ctx.request.get(
            `${BASE}/bicos/candidaturas/${candidaturaId}/chat/mensagens?depoisDoId=0`,
            { failOnStatusCode: false }
        );
        expect(leitura.status()).toBe(200);
    });

    test('bico Finalizado não pode ser cancelado', async () => {
        const { contratante, trabalhador } = sessoes;

        await adicionarSaldo(contratante.ctx, 200);
        const titulo = `Cancelar finalizado ${Date.now()}`;
        const bicoId = await publicarBico(contratante.ctx, titulo);
        await candidatar(trabalhador.ctx, bicoId);
        await aceitar(contratante.ctx, await idCandidaturaPendente(contratante.ctx, bicoId));

        const finalizacao = await contratante.ctx.request.post(`${BASE}/bicos/${bicoId}/finalizar`, {
            failOnStatusCode: false
        });
        expect(finalizacao.status()).toBe(200);

        const saldoAntes = await lerSaldo(contratante.ctx);
        const resposta = await cancelar(contratante.ctx, bicoId);

        expect(resposta.status()).toBe(409);
        expect((await resposta.json()).erro).toMatch(/finalizados não podem ser cancelados/);
        expect(await lerSaldo(contratante.ctx)).toBe(saldoAntes);
        const extrato = await (await contratante.ctx.request.get(`${BASE}/carteira/contratante`)).text();
        // O extrato mostra o título do bico (a reserva existe), mas não há estorno.
        expect(extrato).toContain(`Reserva – ${titulo}`);
        expect(extrato).not.toContain(textoEstorno(titulo));
    });

    test('outro contratante e o trabalhador não conseguem cancelar o bico', async () => {
        const { contratante, trabalhador, outro } = sessoes;
        const bicoId = await publicarBico(contratante.ctx, `Cancelar alheio ${Date.now()}`);

        const deOutroContratante = await cancelar(outro.ctx, bicoId);
        expect(deOutroContratante.status()).toBe(403);

        const doTrabalhador = await cancelar(trabalhador.ctx, bicoId);
        expect(doTrabalhador.status()).toBe(403);

        // O bico continua disponível para o dono.
        const ativos = await (await contratante.ctx.request.get(`${BASE}/bicos/ativos`)).text();
        expect(ativos).toContain(`/bicos/${bicoId}/gerenciar`);
    });

    test('cancelar duas vezes não estorna duas vezes', async () => {
        const { contratante, trabalhador } = sessoes;

        await adicionarSaldo(contratante.ctx, 200);
        const titulo = `Cancelar duplicado ${Date.now()}`;
        const bicoId = await publicarBico(contratante.ctx, titulo);
        await candidatar(trabalhador.ctx, bicoId);
        await aceitar(contratante.ctx, await idCandidaturaPendente(contratante.ctx, bicoId));
        const saldoComReserva = await lerSaldo(contratante.ctx);

        const primeira = await cancelar(contratante.ctx, bicoId);
        const segunda = await cancelar(contratante.ctx, bicoId);

        expect(primeira.status()).toBe(200);
        expect(segunda.status()).toBe(409);
        expect((await segunda.json()).erro).toMatch(/já foi cancelado/);
        expect(await lerSaldo(contratante.ctx), 'estorno uma única vez').toBe(saldoComReserva + VALOR);

        const extrato = await (await contratante.ctx.request.get(`${BASE}/carteira/contratante`)).text();
        expect(extrato.split(textoEstorno(titulo)).length - 1).toBe(1);
    });

    test('tela: o modal avisa do estorno e cancela o bico pelo botão', async () => {
        const { contratante, trabalhador } = sessoes;

        // Bico Aberto: o modal informa que não há estorno e o botão Voltar não cancela nada.
        const bicoAbertoId = await publicarBico(contratante.ctx, `Cancelar pela tela aberto ${Date.now()}`);
        const pagina = await contratante.ctx.newPage();
        await pagina.setViewportSize({ width: 360, height: 740 });
        await pagina.goto(`${BASE}/bicos/${bicoAbertoId}/gerenciar`);
        await pagina.locator('#btn-cancelar-bico').click();
        const modal = pagina.locator('#confirm-cancel-modal');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('Nenhum valor foi reservado');
        expect(
            await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
            'sem rolagem horizontal'
        ).toBe(true);
        await pagina.locator('#cancel-cancel-button').click();
        await expect(modal).toBeHidden();
        await expect(pagina.locator('#status-bico')).toContainText('Aberto');

        // Bico Em andamento: o modal mostra o valor a estornar; ao confirmar, o status vira Cancelado.
        await adicionarSaldo(contratante.ctx, 200);
        const bicoId = await publicarBico(contratante.ctx, `Cancelar pela tela andamento ${Date.now()}`);
        await candidatar(trabalhador.ctx, bicoId);
        await aceitar(contratante.ctx, await idCandidaturaPendente(contratante.ctx, bicoId));
        const saldoComReserva = await lerSaldo(contratante.ctx);

        await pagina.goto(`${BASE}/bicos/${bicoId}/gerenciar`);
        await pagina.locator('#btn-cancelar-bico').click();
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('R$ 150,00');
        await expect(modal).toContainText('estornado');
        await pagina.locator('#motivo-cancelamento').fill('Cancelado pelo teste de tela');
        await pagina.locator('#confirm-cancel-button').click();

        await expect(pagina.locator('#status-bico')).toContainText('Cancelado');
        await expect(pagina.locator('#btn-cancelar-bico')).toHaveCount(0);
        await expect(pagina.locator('#btn-finalizar-bico')).toHaveCount(0);
        expect(await lerSaldo(contratante.ctx)).toBe(saldoComReserva + VALOR);
        await pagina.close();
    });
});
