// Mascotes únicos (araponga = contratante, tiê-sangue = trabalhador): imagens, seletor de perfil,
// alertas com mascote triste, dica do histórico, movimento reduzido e comemoração.
import { test, expect } from '@playwright/test';
import { BASE, criarConta, sufixoUnico, dataFutura, preencherEnderecoNaTela } from '../support/cenario.js';

const IMAGENS = [
    'araponga-galho',
    'araponga-corpo',
    'araponga-asa',
    'araponga-ave',
    'tie-galho',
    'tie-corpo',
    'tie-asa',
    'tie-ave'
];

const animacoesAtivas = (page, seletor) =>
    page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel))
            .map((el) => ({ el: el.className || el.tagName, nome: getComputedStyle(el).animationName }))
            .filter((x) => x.nome !== 'none');
    }, seletor);

test.describe('Mascotes: imagens e nenhum passarinho genérico', () => {
    test('as 8 imagens em camadas respondem 200 e as antigas não existem mais', async ({ request }) => {
        for (const nome of IMAGENS) {
            const resposta = await request.get(`${BASE}/img/mascotes/${nome}.png`);
            expect(resposta.status(), nome).toBe(200);
            expect(resposta.headers()['content-type']).toContain('image/png');
        }
        for (const antigo of ['passarinho_transparente.png', 'balao_transparente.png']) {
            expect((await request.get(`${BASE}/img/${antigo}`, { failOnStatusCode: false })).status(), antigo).toBe(
                404
            );
        }
    });

    test('nenhuma página referencia passarinho_transparente nem balao_transparente', async ({ browser, request }) => {
        const contratante = await criarConta(browser, 'contratante', 'mascn_c');
        const trabalhador = await criarConta(browser, 'trabalhador', 'mascn_t');
        const publicas = ['/', '/login', '/cadastrar'];
        const doContratante = ['/homeContratante', '/bicos/novo', '/bicos/ativos', '/carteira/contratante'];
        const doTrabalhador = ['/hometrabalhador', '/historico', '/carteira/trabalhador'];

        const paginas = [
            ...publicas.map((rota) => [request, rota]),
            ...doContratante.map((rota) => [contratante.ctx.request, rota]),
            ...doTrabalhador.map((rota) => [trabalhador.ctx.request, rota])
        ];
        for (const [cliente, rota] of paginas) {
            const html = await (await cliente.get(`${BASE}${rota}`)).text();
            expect(html, rota).not.toMatch(/passarinho_transparente|balao_transparente/);
        }
        for (const arquivo of [
            '/css/login.css',
            '/css/cadastro.css',
            '/css/publicarBico.css',
            '/css/mascotes.css',
            '/js/mascotes.js',
            '/js/login.js',
            '/js/cadastrar.js'
        ]) {
            expect(await (await request.get(`${BASE}${arquivo}`)).text(), arquivo).not.toMatch(
                /passarinho_transparente|balao_transparente/
            );
        }
        await contratante.ctx.close();
        await trabalhador.ctx.close();
    });
});

test.describe('Seletor de perfil mostra só a ave do perfil', () => {
    test('landing: Contratar = só araponga, Trabalhar = só tiê, Visão geral = as duas', async ({ page }) => {
        await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
        const araponga = page.locator('.mascote.araponga:visible');
        const tie = page.locator('.mascote.tie:visible');

        // Visão geral: as duas aves lado a lado, nos cartões de escolha.
        await expect(araponga).toHaveCount(1);
        await expect(tie).toHaveCount(1);
        await expect(page.locator('.landing-choice__option .mascote:visible')).toHaveCount(2);

        await page.locator('.landing-switcher__profile[data-profile-select="contratante"]').click();
        await expect(araponga).toHaveCount(1);
        await expect(tie).toHaveCount(0);

        await page.locator('.landing-switcher__profile[data-profile-select="trabalhador"]').click();
        await expect(tie).toHaveCount(1);
        await expect(araponga).toHaveCount(0);

        await page.locator('.landing-switcher__reset[data-profile-select="neutral"]').click();
        await expect(araponga).toHaveCount(1);
        await expect(tie).toHaveCount(1);

        // O cartão também leva ao perfil: clicar em "Quero trabalhar" mostra só o tiê.
        await page.locator('.landing-choice__option--work').click();
        await expect(tie).toHaveCount(1);
        await expect(araponga).toHaveCount(0);
    });

    test('login: o erro mostra a ave do perfil escolhido e troca junto com o seletor', async ({ page }) => {
        await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
        const email = `naoexiste_${sufixoUnico()}@gmail.com`;
        const enviar = async (botao) => {
            await page.locator(botao).click();
            await page.locator('input[name="email"]').fill(email);
            await page.locator('input[name="senha"]').fill('senha-qualquer');
            await page.locator('#submitBtn').click();
        };

        // Contratar: araponga, triste.
        await enviar('#btnHire');
        const alerta = page.locator('#alerta-sistema');
        await expect(alerta).toContainText('E-mail ou senha incorretos.');
        await expect(alerta.locator('.mascote:visible')).toHaveCount(1);
        await expect(alerta.locator('.mascote.araponga')).toBeVisible();
        await expect(alerta.locator('.mascote.araponga')).toHaveClass(/estado-triste/);
        await expect(alerta.locator('.mascote.tie')).toBeHidden();

        // Troca o seletor para Trabalhar: o tiê entra no lugar, triste.
        await page.locator('#btnWork').click();
        await expect(alerta.locator('.mascote.tie')).toBeVisible();
        await expect(alerta.locator('.mascote.tie')).toHaveClass(/estado-triste/);
        await expect(alerta.locator('.mascote.araponga')).toBeHidden();

        // Enviar com Trabalhar: depois do erro, o perfil escolhido continua e o tiê aparece.
        await page.locator('input[name="senha"]').fill('outra-senha');
        await page.locator('#submitBtn').click();
        await expect(page.locator('#alerta-sistema .mascote.tie')).toBeVisible();
        await expect(page.locator('#alerta-sistema .mascote.araponga')).toBeHidden();
        await expect(page.locator('#tipoPerfilInput')).toHaveValue('trabalhador');

        // E de volta para Contratar: a araponga.
        await page.locator('#btnHire').click();
        await expect(page.locator('#alerta-sistema .mascote.araponga')).toBeVisible();
        await expect(page.locator('#alerta-sistema .mascote.tie')).toBeHidden();
    });

    test('cadastro: o erro mostra a ave do perfil escolhido e troca junto com a escolha', async ({ page }) => {
        await page.goto(`${BASE}/cadastrar`, { waitUntil: 'domcontentloaded' });
        await page.locator('#cardTrabalhador').click();
        await page.locator('#nome').fill('Pessoa Mascote Teste');
        await page.locator('#cEmail').fill(`mascote_${sufixoUnico()}@gmail.com`);
        await page.locator('#cpf').fill('123.456.789-00'); // CPF inválido
        await page.locator('#cIdade').fill('30');
        await page.locator('#cSenha').fill('123456');
        await page.locator('#cConfirma').fill('123456');
        await page.locator('#termos').check();
        await page.locator('#idade').check();
        await page.locator('#btnSubmit').click();

        const alerta = page.locator('#alerta-sistema');
        await expect(alerta).toContainText('Digite um CPF válido.');
        await expect(alerta.locator('.mascote.tie')).toBeVisible();
        await expect(alerta.locator('.mascote.tie')).toHaveClass(/estado-triste/);
        await expect(alerta.locator('.mascote.araponga')).toBeHidden();

        await page.locator('#cardContratante').click();
        await expect(alerta.locator('.mascote.araponga')).toBeVisible();
        await expect(alerta.locator('.mascote.tie')).toBeHidden();
    });
});

test.describe('Dica e erro nas telas internas', () => {
    test('publicar bico: dica com a araponga (inclina ao abrir) e erro com alerta padronizado', async ({ browser }) => {
        const { ctx } = await criarConta(browser, 'contratante', 'mascp_c');
        const page = await ctx.newPage();
        await page.goto(`${BASE}/bicos/novo`, { waitUntil: 'domcontentloaded' });

        const botao = page.locator('.mascot-assistant__toggle');
        await expect(botao.locator('.mascote.araponga')).toBeVisible();
        await expect(botao.locator('.mascote .galho')).toHaveCount(0); // ave sem galho
        await botao.click();
        await expect(page.locator('#mascot-tip')).toBeVisible();
        await expect(botao.locator('.mascote')).toHaveClass(/anima-curioso/);

        // Erro de validação: título curto.
        await page.locator('input[name="titulo"]').fill('ab');
        await page.locator('textarea[name="descricao"]').fill('Descrição com tamanho suficiente.');
        await page.locator('input[name="valor"]').fill('100');
        await preencherEnderecoNaTela(page);
        await page.locator('input[name="data_servico"]').fill(dataFutura());
        await page.locator('input[name="horario"]').fill('10:00');
        await page.getByRole('button', { name: /Publicar Vaga/i }).click();
        const alerta = page.locator('#alerta-sistema');
        await expect(alerta).toContainText('O título deve ter entre 3 e 100 caracteres.');
        await expect(alerta.locator('.mascote.araponga')).toHaveClass(/estado-triste/);
        await expect(alerta.locator('.mascote.tie')).toHaveCount(0);
        await ctx.close();
    });

    test('histórico do trabalhador: a dica usa o tiê-sangue no lugar da lâmpada', async ({ browser }) => {
        const { ctx } = await criarConta(browser, 'trabalhador', 'mascd_t');
        const page = await ctx.newPage();
        await page.goto(`${BASE}/historico`, { waitUntil: 'domcontentloaded' });
        const dica = page.locator('#dicaPopup');
        await expect(dica).toBeVisible();
        await expect(dica.locator('.mascote.tie')).toBeVisible();
        await expect(dica.locator('.ph-lightbulb')).toHaveCount(0);
        // Lista vazia: o tiê parado, sem animação.
        const vazio = page.locator('.tab-panel--active .mascote-vazio .mascote.tie');
        await expect(vazio).toBeVisible();
        expect(await animacoesAtivas(page, '.mascote-vazio .mascote, .mascote-vazio .mascote *')).toEqual([]);
        await ctx.close();
    });
});

test.describe('Movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' });

    test('com reducedMotion "reduce", nenhum elemento do mascote tem animação ativa', async ({ page }) => {
        await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.mascote.araponga:visible')).toHaveCount(1);
        await page.locator('.landing-choice__option--hire').hover();
        await page.waitForTimeout(500);

        const alvos = '.mascote, .mascote *';
        expect(await animacoesAtivas(page, alvos)).toEqual([]);
        // A landing continua mostrando as aves paradas e visíveis (nada ficou escondido pelo pouso).
        for (const ave of ['araponga', 'tie']) {
            const opacidade = await page
                .locator(`.landing-choice__option .mascote.${ave} .camada-ave`)
                .evaluate((el) => getComputedStyle(el).opacity);
            expect(Number(opacidade)).toBe(1);
        }

        // Também no login com erro: o mascote triste fica na pose triste, mas sem animação.
        await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
        await page.locator('input[name="email"]').fill(`naoexiste_${sufixoUnico()}@gmail.com`);
        await page.locator('input[name="senha"]').fill('123456');
        await page.locator('#submitBtn').click();
        await expect(page.locator('#alerta-sistema .mascote.araponga')).toHaveClass(/estado-triste/);
        await page.waitForTimeout(500);
        expect(await animacoesAtivas(page, '.mascote, .mascote *, .alerta-sistema')).toEqual([]);
    });
});

test.describe('Movimento normal', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('na landing a ave pousa e, com o mouse em cima do cartão, bate asas; a API existe', async ({ page }) => {
        await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
        const cartao = page.locator('.landing-choice__option--hire');
        const mascote = cartao.locator('.mascote.araponga');
        await expect(mascote).toHaveClass(/anima-pouso/);
        await expect(mascote).not.toHaveClass(/anima-pouso/, { timeout: 5000 });
        await cartao.hover();
        await expect(mascote).toHaveClass(/anima-asas/);
        expect(
            await page.evaluate(() =>
                ['comemorar', 'triste', 'asas'].every((n) => typeof window.Mascotes[n] === 'function')
            )
        ).toBe(true);
    });
});
