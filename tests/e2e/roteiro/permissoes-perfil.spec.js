// Roteiro de testes: CT04 (rota de outro perfil responde 403).
import { test, expect } from '@playwright/test';
import { BASE, criarConta } from '../support/cenario.js';

const MENSAGEM = 'Acesso negado para o perfil desta conta.';

test.describe('CT04 – Acesso a rota de outro perfil', () => {
  let trabalhador;
  let contratante;

  test.beforeAll(async ({ browser }) => {
    trabalhador = await criarConta(browser, 'trabalhador', 'ct04trab');
    contratante = await criarConta(browser, 'contratante', 'ct04contr');
  });

  test.afterAll(async () => {
    await trabalhador.ctx.close();
    await contratante.ctx.close();
  });

  test('trabalhador recebe 403 nas rotas de contratante', async () => {
    for (const rota of ['/homeContratante', '/bicos/novo', '/bicos/ativos', '/carteira/contratante']) {
      const resposta = await trabalhador.ctx.request.get(`${BASE}${rota}`, { maxRedirects: 0, failOnStatusCode: false });
      expect(resposta.status(), rota).toBe(403);
      expect(await resposta.text(), rota).toContain(MENSAGEM);
    }
  });

  test('contratante recebe 403 nas rotas de trabalhador', async () => {
    for (const rota of ['/hometrabalhador', '/historico', '/carteira/trabalhador']) {
      const resposta = await contratante.ctx.request.get(`${BASE}${rota}`, { maxRedirects: 0, failOnStatusCode: false });
      expect(resposta.status(), rota).toBe(403);
      expect(await resposta.text(), rota).toContain(MENSAGEM);
    }
  });

  test('na tela, o navegador mostra o texto de acesso negado', async () => {
    const page = await trabalhador.ctx.newPage();
    const resposta = await page.goto(`${BASE}/bicos/novo`);
    expect(resposta.status()).toBe(403);
    await expect(page.locator('body')).toContainText(MENSAGEM);
    await page.close();
  });

  test('cada perfil continua acessando as próprias rotas (200)', async () => {
    const t = await trabalhador.ctx.request.get(`${BASE}/carteira/trabalhador`);
    const c = await contratante.ctx.request.get(`${BASE}/carteira/contratante`);
    expect(t.status()).toBe(200);
    expect(c.status()).toBe(200);
  });
});
