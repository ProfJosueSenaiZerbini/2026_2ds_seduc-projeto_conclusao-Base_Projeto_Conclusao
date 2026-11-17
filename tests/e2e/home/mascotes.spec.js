// Animação dos mascotes: com "reduzir movimento" o mascote fica parado; sem a preferência, ele se anima.
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const nomeDaAnimacao = (locator) => locator.evaluate((el) => getComputedStyle(el).animationName);

test.describe('Mascotes com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('na landing, os mascotes não têm animação ativa (animation-name: none)', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    const araponga = page.locator('.landing-choice__option--hire img');
    const tie = page.locator('.landing-choice__option--work img');
    await expect(araponga).toHaveClass(/mascote--respira/);

    expect(await nomeDaAnimacao(araponga)).toBe('none');
    expect(await nomeDaAnimacao(tie)).toBe('none');
    // O mascote fica visível e parado (não some por causa do "entra voando").
    await expect(araponga).toBeVisible();
    expect(Number(await araponga.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  });
});

test.describe('Mascotes sem preferência de movimento', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('na landing, o mascote entra voando e depois respira', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    const nomes = await nomeDaAnimacao(page.locator('.landing-choice__option--hire img'));
    expect(nomes).toContain('mascote-entra-voando');
    expect(nomes).toContain('mascote-respira');
  });
});
