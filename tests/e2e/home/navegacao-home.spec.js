import { test, expect } from '@playwright/test';
test.describe('Testes de Botões e Navegação — iBico Home', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/#inicio');
  });

  test('Deve testar os links e botões do Cabeçalho (Header)', async ({ page }) => {
    const header = page.locator('header');
    
    // Clica no logo/marca
    const brand = header.locator('.landing-brand');
    await expect(brand).toBeVisible();
    await brand.click();

    // Link "Início"
    const linkInicio = header.locator('nav a, .nav-links a').filter({ hasText: /^Início$/ });
    await linkInicio.click();
    await expect(page).toHaveURL(/#inicio/);

    // Link "Propósito"
    await header.getByRole('link', { name: 'Propósito' }).click();

    // Link "Jornada"
    await header.getByRole('link', { name: 'Jornada' }).click();

    // Botão/Link "Visão geral"
    await expect(header.getByText('Visão geral')).toBeVisible();
    await header.getByText('Visão geral').click();

    // Nota: Ajustado para procurar pelo texto real do botão de acesso/login no header (ex: "Entrar" ou "Login" ou o que estiver no seu HTML)
    // Se no seu header os botões forem de login/cadastro, altere o texto abaixo para corresponder exatamente ao HTML.
    const botaoEntrar = header.locator('a, button').filter({ hasText: /Entrar|Login|Contratar|Trabalhar/i }).first();
    if (await botaoEntrar.isVisible()) {
        await botaoEntrar.click();
    }
  });

  test('Deve testar o botão "Conheça os dois caminhos" (Hero Section)', async ({ page }) => {
    const botaoConheca = page.locator('a, button').filter({ hasText: 'Conheça os dois caminhos' });
    await expect(botaoConheca).toBeVisible();
    await botaoConheca.click();
  });

  test('Deve testar os cartões de perfis (Contratante e Trabalhador)', async ({ page }) => {
    // Rola a página para garantir que os cartões estejam visíveis na tela
    await page.evaluate(() => window.scrollBy(0, 600));

    // Perfil 01: Contratante (usando rolagem e clique forçado se necessário)
    const cardContratante = page.locator('.landing-choice__option, [data-profile-select]').first();
    await cardContratante.scrollIntoViewIfNeeded();
    await cardContratante.click();

    // Retorna para o início
    await page.goto('http://localhost:3000/#inicio');
    await page.evaluate(() => window.scrollBy(0, 600));

    // Perfil 02: Trabalhador
    const cardTrabalhador = page.locator('.landing-choice__option, [data-profile-select]').last();
    await cardTrabalhador.scrollIntoViewIfNeeded();
    await cardTrabalhador.click();
  });

  test('Deve testar o botão de rodapé / chamadas finais', async ({ page }) => {
    // Rola até o rodapé para o botão aparecer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const botaoPerfil = page.getByRole('link', { name: /Escolher meu perfil/i });
    await expect(botaoPerfil).toBeVisible();
    await botaoPerfil.click();

    // Volta ao topo
    const botaoVoltar = page.locator('footer a.landing-footer__top, footer a').filter({ hasText: /Voltar ao início/i }).first();
    await expect(botaoVoltar).toBeVisible();
    await botaoVoltar.click();
    await expect(page).toHaveURL(/#inicio/);
  });

});
