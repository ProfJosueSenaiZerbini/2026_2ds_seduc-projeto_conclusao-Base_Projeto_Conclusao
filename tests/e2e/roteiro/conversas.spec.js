// Caixa de conversas: acessar o chat pelo item "Conversas" do menu, sem digitar URLs internas.
import { test, expect } from '@playwright/test';
import {
    BASE,
    SENHA,
    criarConta,
    sufixoUnico,
    adicionarSaldo,
    publicarBico,
    candidatar,
    listarCandidatos,
    aceitar
} from '../support/cenario.js';

const entrarPelaTela = async (page, email, tipoPerfil) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator(tipoPerfil === 'contratante' ? '#btnHire' : '#btnWork').click();
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="senha"]').fill(SENHA);
    await page.locator('#submitBtn').click();
    await page.waitForURL(tipoPerfil === 'contratante' ? /\/homeContratante$/ : /\/hometrabalhador$/);
};

test.describe('Conversas', () => {
    test('contratante e trabalhador abrem a conversa pelo menu e voltam para a lista', async ({ browser }) => {
        test.setTimeout(60000);
        const contratante = await criarConta(browser, 'contratante', 'cv_c');
        const trabalhador = await criarConta(browser, 'trabalhador', 'cv_t');
        const titulo = `Conversa menu ${sufixoUnico()}`;

        await adicionarSaldo(contratante.ctx, 200);
        const bicoId = await publicarBico(contratante.ctx, titulo, 100);
        await candidatar(trabalhador.ctx, bicoId);
        const [candidato] = await listarCandidatos(contratante.ctx, bicoId);
        await aceitar(contratante.ctx, candidato.candidaturaId);

        // Contratante: sidebar > Conversas > abrir a conversa > voltar.
        const paginaC = await contratante.ctx.newPage();
        await entrarPelaTela(paginaC, contratante.email, 'contratante');
        await paginaC.locator('a[title="Conversas"]').first().click();
        await expect(paginaC).toHaveURL(/\/conversas$/);
        await expect(paginaC.locator('a[title="Conversas"]').first()).toHaveClass(/active/);
        const conversaC = paginaC.locator('.conversa', { hasText: titulo });
        await expect(conversaC).toContainText(trabalhador.nome);
        await expect(conversaC).toContainText('Nenhuma mensagem ainda');
        await conversaC.click();
        await expect(paginaC).toHaveURL(/\/bicos\/candidaturas\/\d+\/chat/);
        await paginaC.locator('#input-mensagem').fill('Olá, combinado!');
        await paginaC.locator('#btn-enviar').click();
        await expect(paginaC.locator('.message--enviada', { hasText: 'Olá, combinado!' })).toBeVisible();
        await paginaC.locator('.chat-header__back').click();
        await expect(paginaC).toHaveURL(/\/conversas$/);
        await expect(paginaC.locator('.conversa', { hasText: titulo })).toContainText('Você: Olá, combinado!');

        // Trabalhador: navbar > Conversas > a mensagem do contratante aparece na prévia.
        const paginaT = await trabalhador.ctx.newPage();
        await entrarPelaTela(paginaT, trabalhador.email, 'trabalhador');
        await paginaT.locator('.navbar__links a', { hasText: 'Conversas' }).click();
        await expect(paginaT).toHaveURL(/\/conversas$/);
        const conversaT = paginaT.locator('.conversa', { hasText: titulo });
        await expect(conversaT).toContainText(contratante.nome);
        await expect(conversaT).toContainText('Olá, combinado!');
        await conversaT.click();
        await expect(paginaT.locator('.message--recebida', { hasText: 'Olá, combinado!' })).toBeVisible();
    });

    test('sem conversas: mostra o estado vazio', async ({ browser }) => {
        const trabalhador = await criarConta(browser, 'trabalhador', 'cv_v');
        const pagina = await trabalhador.ctx.newPage();
        await entrarPelaTela(pagina, trabalhador.email, 'trabalhador');
        await pagina.locator('.navbar__links a', { hasText: 'Conversas' }).click();
        await expect(pagina.getByRole('heading', { name: 'Nenhuma conversa por enquanto' })).toBeVisible();
        await expect(pagina.locator('.mascote-vazio')).toBeVisible();
    });
});
