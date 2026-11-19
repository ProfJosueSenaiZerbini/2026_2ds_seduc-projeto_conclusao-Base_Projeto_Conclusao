import { test, expect } from '@playwright/test';

// Executa o login automaticamente antes de cada teste
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'admin@blog.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Aguarda um elemento conhecido no painel pós-login aparecer (case-insensitive)
  await page.waitForSelector('text=/dashboard/i', { timeout: 10000 });
});