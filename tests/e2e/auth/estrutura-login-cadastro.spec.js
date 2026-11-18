import { test, expect } from '@playwright/test';
test.describe('Testes Unitários e de Estrutura — Ibico', () => {
    test('deve abrir a página de login e validar elementos estáticos', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        await expect(page).toHaveTitle(/Login/i);

        // Valida se existe qualquer cabeçalho (h1 ou h2) na página de login
        await expect(page.locator('h1, h2').first()).toBeVisible();

        const elementos = ['input[name="email"]', 'input[name="senha"]', '#submitBtn'];

        for (const elemento of elementos) {
            await expect(page.locator(elemento)).toBeVisible();
        }
    });

    test('deve impedir o envio do formulário vazio', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        const campos = ['email', 'senha'];

        for (const campo of campos) {
            await expect(page.locator(`input[name="${campo}"]`)).toHaveAttribute('required', '');
        }

        await page.locator('#submitBtn').click();
        await expect(page).toHaveURL('http://localhost:3000/login');
    });

    test('deve abrir a página de cadastro corretamente', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        await expect(page).toHaveTitle(/Criar Conta|Cadastro/i);

        await expect(page.locator('h1, h2').first()).toBeVisible();

        const campos = ['#nome', '#cEmail', '#cpf', '#cIdade', '#cSenha', '#cConfirma', '#btnSubmit'];

        for (const campo of campos) {
            await expect(page.locator(campo)).toBeVisible();
        }
    });

    test('deve verificar os campos obrigatórios do cadastro', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        const campos = ['#nome', '#cEmail', '#cpf', '#cIdade', '#cSenha', '#cConfirma', '#termos', '#idade'];

        for (const campo of campos) {
            await expect(page.locator(campo)).toHaveAttribute('required', '');
        }
    });
});
