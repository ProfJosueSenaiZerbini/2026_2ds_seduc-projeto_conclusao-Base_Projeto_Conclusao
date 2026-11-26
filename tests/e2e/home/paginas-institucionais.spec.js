// Páginas institucionais (Termos de Uso, Política de Privacidade e Central de Ajuda): públicas e ligadas
// pelo cadastro, pelo rodapé e pelo card "Precisa de ajuda?" do painel do contratante.
import { test, expect } from '@playwright/test';
import { BASE, criarConta } from '../support/cenario.js';

const PAGINAS = [
    { caminho: '/termos', titulo: 'Termos de Uso', link: 'Termos de Uso' },
    { caminho: '/privacidade', titulo: 'Política de Privacidade', link: 'Privacidade' },
    { caminho: '/ajuda', titulo: 'Central de Ajuda', link: 'Central de Ajuda' }
];

test.describe('Páginas institucionais', () => {
    for (const { caminho, titulo } of PAGINAS) {
        test(`${caminho} abre sem login, com status 200 e o título "${titulo}"`, async ({ page }) => {
            const resposta = await page.goto(`${BASE}${caminho}`);

            expect(resposta.status()).toBe(200);
            await expect(page).toHaveURL(`${BASE}${caminho}`);
            await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
            await expect(page.getByRole('link', { name: 'Voltar ao início' }).first()).toHaveAttribute('href', '/');
        });
    }

    test('a Central de Ajuda abre e fecha as respostas sem JavaScript', async ({ page }) => {
        await page.goto(`${BASE}/ajuda`);

        await expect(page.getByRole('heading', { name: 'Para contratantes' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Para trabalhadores' })).toBeVisible();

        const resposta = page.getByText('Não. O iBico é um projeto acadêmico, e todo o saldo é simulado.');
        await expect(resposta).toBeHidden();
        await page.getByText('O dinheiro é de verdade?').click();
        await expect(resposta).toBeVisible();
    });

    test('no cadastro, Termos de Uso e Política de Privacidade abrem as páginas em nova aba', async ({ page }) => {
        await page.goto(`${BASE}/cadastrar`);

        const termos = page.getByRole('link', { name: 'Termos de Uso' }).first();
        const privacidade = page.getByRole('link', { name: 'Política de Privacidade' });

        await expect(termos).toHaveAttribute('href', '/termos');
        await expect(termos).toHaveAttribute('target', '_blank');
        await expect(privacidade).toHaveAttribute('href', '/privacidade');
        await expect(privacidade).toHaveAttribute('target', '_blank');
    });

    test('logado como contratante: o rodapé e o "Acessar Central" levam às páginas', async ({ browser }) => {
        const { ctx } = await criarConta(browser, 'contratante', 'institucional');
        const page = await ctx.newPage();

        for (const { caminho, titulo, link } of PAGINAS) {
            await page.goto(`${BASE}/homeContratante`);
            await page.locator('footer').getByRole('link', { name: link, exact: true }).click();
            await expect(page).toHaveURL(`${BASE}${caminho}`);
            await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
        }

        await page.goto(`${BASE}/homeContratante`);
        await page.getByRole('link', { name: 'Acessar Central' }).click();
        await expect(page).toHaveURL(`${BASE}/ajuda`);
        await expect(page.getByRole('heading', { level: 1, name: 'Central de Ajuda' })).toBeVisible();

        await ctx.close();
    });
});

test.describe('Página 404', () => {
    test('endereço inexistente responde 404 com a página do iBico', async ({ page }) => {
        const resposta = await page.goto(`${BASE}/pagina-que-nao-existe`);

        expect(resposta.status()).toBe(404);
        await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
        await expect(page.getByText('Esse endereço não existe ou foi removido.')).toBeVisible();

        await page.locator('main').getByRole('link', { name: 'Voltar ao início' }).click();
        await expect(page).toHaveURL(`${BASE}/`);
    });

    test('/api/ inexistente responde 404 em JSON', async ({ request }) => {
        const resposta = await request.get(`${BASE}/api/qualquer-coisa`, { failOnStatusCode: false });

        expect(resposta.status()).toBe(404);
        expect(resposta.headers()['content-type']).toContain('application/json');
        expect(await resposta.json()).toEqual({ sucesso: false, erro: 'Página não encontrada.' });
    });

    test('pedido em JSON para endereço inexistente também recebe JSON', async ({ request }) => {
        const resposta = await request.get(`${BASE}/nao-existe`, {
            headers: { accept: 'application/json' },
            failOnStatusCode: false
        });

        expect(resposta.status()).toBe(404);
        expect(await resposta.json()).toEqual({ sucesso: false, erro: 'Página não encontrada.' });
    });
});
