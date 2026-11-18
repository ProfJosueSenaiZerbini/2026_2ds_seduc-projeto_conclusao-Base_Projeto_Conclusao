import { test, expect } from '@playwright/test';
import { gerarCpfDeUmNove } from '../support/gerarCpf.js';

test.describe('Testes Funcionais e de Fluxo — Ibico', () => {
    test('deve alternar entre trabalhador e contratante na tela de login', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        const tipoPerfil = page.locator('#tipoPerfilInput');

        const perfis = [
            { botao: '#btnWork', valor: 'trabalhador' },
            { botao: '#btnHire', valor: 'contratante' }
        ];

        for (const perfil of perfis) {
            await page.locator(perfil.botao).click();
            await expect(tipoPerfil).toHaveValue(perfil.valor);
        }
    });

    test('deve abrir a página de cadastro pelo link do login', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        await page
            .getByRole('link', {
                name: /criar uma conta|cadastrar/i
            })
            .click();

        await expect(page).toHaveURL('http://localhost:3000/cadastrar');
    });

    test('deve impedir o cadastro com campos vazios', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        await page.locator('#btnSubmit').click();

        await expect(page).toHaveURL('http://localhost:3000/cadastrar');
        await expect(page.locator('#nome')).toBeFocused();
    });

    test('deve alternar entre os perfis no cadastro', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        const tipoPerfil = page.locator('#tipoPerfilInput');

        await expect(tipoPerfil).toHaveValue('Contratante');

        await page.locator('#cardTrabalhador').click();
        await expect(tipoPerfil).toHaveValue('Trabalhador');

        await page.locator('#cardContratante').click();
        await expect(tipoPerfil).toHaveValue('Contratante');
    });

    test('deve impedir o cadastro com e-mail inválido', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        await page.locator('#nome').fill('Usuario Teste');
        await page.locator('#cEmail').fill('emailinvalido');
        await page.locator('#cpf').fill('12345678909');
        await page.locator('#cIdade').fill('30');
        await page.locator('#cSenha').fill('senha123');
        await page.locator('#cConfirma').fill('senha123');

        await page.locator('#termos').check();
        await page.locator('#idade').check();

        await page.locator('#btnSubmit').click();

        await expect(page).toHaveURL('http://localhost:3000/cadastrar');
    });

    test('deve aceitar somente idades entre 18 e 90 no cadastro', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        const campoIdade = page.locator('#cIdade');
        await expect(campoIdade).toHaveAttribute('min', '18');
        await expect(campoIdade).toHaveAttribute('max', '90');

        for (const [idade, valida] of [
            ['17', false],
            ['18', true],
            ['90', true],
            ['91', false]
        ]) {
            await campoIdade.fill(idade);
            expect(await campoIdade.evaluate((el) => el.checkValidity()), `idade ${idade}`).toBe(valida);
        }
    });
});

test('deve realizar o cadastro e o login com sucesso como Contratante', async ({ page }) => {
    await page.goto('http://localhost:3000/cadastrar');

    const cpfAleatorio = gerarCpfDeUmNove();
    const emailDinamico = `contratante_${Date.now()}@gmail.com`;
    const senhaPadrao = '123456';

    await page.locator('#cardContratante').click();
    await expect(page.locator('#tipoPerfilInput')).toHaveValue('Contratante');

    await page.locator('#nome').fill('Contratante Teste E2E');
    await page.locator('#cEmail').fill(emailDinamico);
    await page.locator('#cpf').fill(cpfAleatorio);
    await page.locator('#cIdade').fill('30');
    await page.locator('#cSenha').fill(senhaPadrao);
    await page.locator('#cConfirma').fill(senhaPadrao);

    await page.locator('#termos').check();
    await page.locator('#idade').check();
    await page.locator('#btnSubmit').click();

    await expect(page).toHaveURL('http://localhost:3000/login');
    await page.locator('#btnHire').click();
    await page.locator('input[name="email"]').fill(emailDinamico);
    await page.locator('input[name="senha"]').fill(senhaPadrao);
    await page.locator('#submitBtn').click();

    await expect(page).toHaveURL('http://localhost:3000/homeContratante');
});

test('deve realizar o cadastro e o login com sucesso como Trabalhador', async ({ page }) => {
    await page.goto('http://localhost:3000/cadastrar');

    const cpfAleatorio = gerarCpfDeUmNove();
    const emailDinamico = `trabalhador_${Date.now()}@gmail.com`;
    const senhaPadrao = '123456';

    await page.locator('#cardTrabalhador').click();
    await page.locator('#nome').fill('Trabalhador Teste E2E');
    await page.locator('#cEmail').fill(emailDinamico);
    await page.locator('#cpf').fill(cpfAleatorio);
    await page.locator('#cIdade').fill('30');
    await page.locator('#cSenha').fill(senhaPadrao);
    await page.locator('#cConfirma').fill(senhaPadrao);

    await page.locator('#termos').check();
    await page.locator('#idade').check();

    await page.locator('#btnSubmit').click();

    await expect(page).toHaveURL('http://localhost:3000/login');
    await page.locator('#btnWork').click();
    await page.locator('input[name="email"]').fill(emailDinamico);
    await page.locator('input[name="senha"]').fill(senhaPadrao);
    await page.locator('#submitBtn').click();

    await expect(page).toHaveURL('http://localhost:3000/hometrabalhador');
});
