// CT27 – Foto de perfil: enviar, trocar, recusar arquivo inválido, remover e ver no perfil público.
// Exige a tabela fotos_perfil (schema atual ou migrations/004_foto_perfil.sql).
import { test, expect } from '@playwright/test';
import { BASE, criarConta, consultarBanco } from '../support/cenario.js';
import { iniciaisDoNome } from '../../../services/iniciais.js';

// PNG de 1x1 pixel, válido para o navegador desenhar.
const PNG_1X1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
);

const idPorEmail = async (email) => (await consultarBanco('SELECT id FROM usuarios WHERE email = ?', [email]))[0].id;

const avatarDaBarra = (page) => page.locator('.sidebar-account__profile [data-avatar]');
const avatarDoBanner = (page) => page.locator('.perfil-banner [data-avatar], .pt-banner [data-avatar]');

// Escolhe o arquivo no campo da foto; o script da página envia o formulário e volta para /perfil.
const escolherArquivo = async (page, arquivo) => {
    await Promise.all([page.waitForURL(`${BASE}/perfil`), page.locator('#fotoPerfilArquivo').setInputFiles(arquivo)]);
};

test.describe('CT27 – Foto de perfil', () => {
    test('contratante adiciona, tem arquivo inválido recusado e remove a foto', async ({ browser }) => {
        const { ctx, email, nome } = await criarConta(browser, 'contratante', 'ct27foto');
        const id = await idPorEmail(email);
        const page = await ctx.newPage();
        const externas = [];
        page.on('request', (req) => {
            if (/unsplash/i.test(req.url())) externas.push(req.url());
        });

        // Sem foto: iniciais na barra e no banner, nenhuma imagem de banco de imagens.
        await page.goto(`${BASE}/perfil`);
        await expect(avatarDaBarra(page)).toHaveAttribute('data-avatar', 'iniciais');
        await expect(avatarDaBarra(page)).toHaveText(iniciaisDoNome(nome));
        await expect(avatarDoBanner(page)).toHaveAttribute('data-avatar', 'iniciais');
        await expect(page.getByText('Adicionar foto')).toBeVisible();

        // Envia a foto: aparece no banner e na barra lateral.
        await escolherArquivo(page, { name: 'eu.png', mimeType: 'image/png', buffer: PNG_1X1 });
        const urlFoto = new RegExp(`^/perfil/${id}/foto\\?v=\\d+$`);
        await expect(avatarDoBanner(page)).toHaveAttribute('src', urlFoto);
        await expect(avatarDaBarra(page)).toHaveAttribute('src', urlFoto);
        await expect(page.getByText('Trocar foto')).toBeVisible();
        await expect(page.locator('#alerta-sistema')).toHaveCount(0);

        const imagem = await ctx.request.get(`${BASE}${await avatarDaBarra(page).getAttribute('src')}`);
        expect(imagem.status()).toBe(200);
        expect(imagem.headers()['content-type']).toBe('image/png');
        expect(imagem.headers()['x-content-type-options']).toBe('nosniff');
        expect(Buffer.compare(await imagem.body(), PNG_1X1)).toBe(0);

        // Texto renomeado para .png: recusado, a foto anterior continua.
        await escolherArquivo(page, {
            name: 'falso.png',
            mimeType: 'image/png',
            buffer: Buffer.from('não sou imagem')
        });
        await expect(page.locator('#alerta-sistema')).toContainText('A foto precisa ser uma imagem JPG, PNG ou WebP.');
        await expect(avatarDoBanner(page)).toHaveAttribute('src', urlFoto);

        // Acima de 2 MB: recusado.
        const grande = Buffer.concat([PNG_1X1, Buffer.alloc(2 * 1024 * 1024)]);
        await escolherArquivo(page, { name: 'grande.png', mimeType: 'image/png', buffer: grande });
        await expect(page.locator('#alerta-sistema')).toContainText('A foto pode ter no máximo 2 MB.');

        // Remove: voltam as iniciais.
        await Promise.all([
            page.waitForURL(`${BASE}/perfil`),
            page.getByRole('button', { name: 'Remover foto' }).click()
        ]);
        await expect(avatarDaBarra(page)).toHaveAttribute('data-avatar', 'iniciais');
        await expect(avatarDoBanner(page)).toHaveAttribute('data-avatar', 'iniciais');
        expect((await ctx.request.get(`${BASE}/perfil/${id}/foto`, { failOnStatusCode: false })).status()).toBe(404);

        expect(externas, 'nenhuma imagem do Unsplash').toEqual([]);
        await ctx.close();
    });

    test('foto do trabalhador aparece no perfil público, sem trocar o avatar do contratante', async ({ browser }) => {
        const trabalhador = await criarConta(browser, 'trabalhador', 'ct27trab');
        const contratante = await criarConta(browser, 'contratante', 'ct27contr');
        const idTrabalhador = await idPorEmail(trabalhador.email);

        const paginaTrabalhador = await trabalhador.ctx.newPage();
        await paginaTrabalhador.goto(`${BASE}/perfil`);
        await escolherArquivo(paginaTrabalhador, { name: 'eu.png', mimeType: 'image/png', buffer: PNG_1X1 });
        await expect(avatarDoBanner(paginaTrabalhador)).toHaveAttribute(
            'src',
            new RegExp(`^/perfil/${idTrabalhador}/foto`)
        );

        const paginaContratante = await contratante.ctx.newPage();
        await paginaContratante.goto(`${BASE}/perfil/publico/${idTrabalhador}`);
        await expect(paginaContratante.locator('.worker-avatar [data-avatar]')).toHaveAttribute(
            'src',
            new RegExp(`^/perfil/${idTrabalhador}/foto`)
        );
        await expect(avatarDaBarra(paginaContratante)).toHaveAttribute('data-avatar', 'iniciais');
        await expect(avatarDaBarra(paginaContratante)).toHaveText(iniciaisDoNome(contratante.nome));

        await trabalhador.ctx.close();
        await contratante.ctx.close();
    });

    test('a foto só é servida para quem está logado', async ({ request }) => {
        const resposta = await request.get(`${BASE}/perfil/1/foto`, { maxRedirects: 0, failOnStatusCode: false });
        expect(resposta.status()).toBe(302);
        expect(resposta.headers().location).toBe('/login');
    });
});
