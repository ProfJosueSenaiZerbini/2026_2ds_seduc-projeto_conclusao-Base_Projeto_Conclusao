// Roteiro de testes: CT02 (cadastro inválido) e CT03 (login inválido, rota interna sem login, logout).
import { test, expect } from '@playwright/test';
import { gerarCpfDeUmNove } from '../support/gerarCpf.js';
import { BASE, SENHA, criarConta, formulario, sufixoUnico } from '../support/cenario.js';

const cadastroValido = () => ({
    nome: 'Pessoa Roteiro Teste',
    email: `ct02_${sufixoUnico()}@gmail.com`,
    cpf: gerarCpfDeUmNove(),
    idade: '30',
    senha: SENHA,
    confirmarSenha: SENHA,
    tipoPerfil: 'contratante',
    termos: 'on',
    maiorIdade: 'true'
});

const preencherCadastro = async (page, dados) => {
    await page.goto(`${BASE}/cadastrar`);
    await page.locator('#nome').fill(dados.nome);
    await page.locator('#cEmail').fill(dados.email);
    await page.locator('#cpf').fill(dados.cpf);
    await page.locator('#cIdade').fill(dados.idade);
    await page.locator('#cSenha').fill(dados.senha);
    await page.locator('#cConfirma').fill(dados.confirmarSenha);
    await page.locator('#termos').check();
};

// Prova que a conta recusada não foi criada: o login com o e-mail dela é recusado.
// (Desde a #160 a mensagem é a mesma de senha errada, para não revelar quais e-mails têm conta.)
const afirmarContaNaoCriada = async (request, email) => {
    const login = await request.post(`${BASE}/login`, formulario({ email, senha: SENHA, tipoPerfil: 'contratante' }));
    expect(login.status()).toBe(400);
    expect(await login.text()).toContain('E-mail ou senha incorretos.');
};

test.describe('CT02 – Cadastro inválido', () => {
    test('CPF inválido é recusado com mensagem, pela tela', async ({ page }) => {
        const dados = cadastroValido();
        dados.cpf = '123.456.789-00'; // dígitos verificadores errados
        await preencherCadastro(page, dados);
        await page.locator('#idade').check();
        await page.locator('#btnSubmit').click();

        await expect(page).toHaveURL(`${BASE}/cadastrar`);
        await expect(page.locator('#alerta-sistema')).toContainText('Digite um CPF válido.');
        await afirmarContaNaoCriada(page.request, dados.email);
    });

    test('o navegador impede o envio sem marcar a confirmação de maioridade', async ({ page }) => {
        const dados = cadastroValido();
        await preencherCadastro(page, dados);
        // "Confirmo que possuo 18 anos ou mais" fica desmarcado.
        await expect(page.locator('#idade')).not.toBeChecked();
        await page.locator('#btnSubmit').click();

        await expect(page).toHaveURL(`${BASE}/cadastrar`);
        expect(await page.locator('#idade').evaluate((el) => el.validity.valueMissing)).toBe(true);
        await afirmarContaNaoCriada(page.request, dados.email);
    });

    test('o servidor recusa (400, com mensagem) CPF inválido, idade fora de 18–90 e sem maioridade', async ({
        request
    }) => {
        const casos = [
            { descricao: 'CPF inválido', alterar: { cpf: '12345678900' }, mensagem: 'Digite um CPF válido.' },
            {
                descricao: 'idade 17',
                alterar: { idade: '17' },
                mensagem: 'Informe uma idade válida, entre 18 e 90 anos.'
            },
            {
                descricao: 'idade 91',
                alterar: { idade: '91' },
                mensagem: 'Informe uma idade válida, entre 18 e 90 anos.'
            },
            {
                descricao: 'sem maioridade',
                alterar: { maiorIdade: undefined },
                mensagem: 'É necessário confirmar que possui 18 anos ou mais.'
            }
        ];

        for (const { descricao, alterar, mensagem } of casos) {
            const dados = { ...cadastroValido(), ...alterar };
            if ('maiorIdade' in alterar) delete dados.maiorIdade;

            const resposta = await request.post(`${BASE}/cadastrar`, formulario(dados));
            expect(resposta.status(), descricao).toBe(400);
            expect(await resposta.text(), descricao).toContain(mensagem);
            await afirmarContaNaoCriada(request, dados.email);
        }
    });

    test('idades 18 e 90 (limites) são aceitas pelo servidor', async ({ request }) => {
        for (const idade of ['18', '90']) {
            const resposta = await request.post(`${BASE}/cadastrar`, formulario({ ...cadastroValido(), idade }));
            expect(resposta.status(), `idade ${idade}`).toBe(302);
            expect(resposta.headers().location).toBe('/login');
        }
    });
});

test.describe('CT03 – Login e rota interna sem login', () => {
    test('senha errada é recusada com mensagem e permanece em /login', async ({ browser }) => {
        const { ctx, email } = await criarConta(browser, 'contratante', 'ct03senha');
        const outro = await browser.newContext();
        const page = await outro.newPage();

        await page.goto(`${BASE}/login`);
        await page.locator('#btnHire').click();
        await page.locator('input[name="email"]').fill(email);
        await page.locator('input[name="senha"]').fill('senha-errada-999');
        await page.locator('#submitBtn').click();

        await expect(page).toHaveURL(`${BASE}/login`);
        await expect(page.locator('#alerta-sistema')).toContainText('E-mail ou senha incorretos.');
        // A sessão não foi aberta: a home continua redirecionando para o login.
        await page.goto(`${BASE}/homeContratante`);
        await expect(page).toHaveURL(`${BASE}/login`);

        await outro.close();
        await ctx.close();
    });

    test('e-mail não cadastrado e perfil trocado também são recusados com mensagem', async ({ browser }) => {
        const { ctx, email } = await criarConta(browser, 'contratante', 'ct03perfil');
        const anonimo = await browser.newContext();

        const inexistente = await anonimo.request.post(
            `${BASE}/login`,
            formulario({
                email: `nao_existe_${sufixoUnico()}@gmail.com`,
                senha: SENHA,
                tipoPerfil: 'contratante'
            })
        );
        expect(inexistente.status()).toBe(400);
        expect(await inexistente.text()).toContain('E-mail ou senha incorretos.');

        const perfilTrocado = await anonimo.request.post(
            `${BASE}/login`,
            formulario({ email, senha: SENHA, tipoPerfil: 'trabalhador' })
        );
        expect(perfilTrocado.status()).toBe(400);
        expect(await perfilTrocado.text()).toMatch(/Sua conta está cadastrada como contratante/i);

        await anonimo.close();
        await ctx.close();
    });

    test('rotas internas sem login redirecionam para /login', async ({ browser }) => {
        const anonimo = await browser.newContext();
        const rotas = [
            '/homeContratante',
            '/hometrabalhador',
            '/bicos/novo',
            '/bicos/ativos',
            '/carteira/contratante',
            '/historico',
            '/perfil'
        ];

        for (const rota of rotas) {
            const resposta = await anonimo.request.get(`${BASE}${rota}`, { maxRedirects: 0, failOnStatusCode: false });
            expect(resposta.status(), rota).toBe(302);
            expect(resposta.headers().location, rota).toBe('/login');
        }

        const page = await anonimo.newPage();
        await page.goto(`${BASE}/homeContratante`);
        await expect(page).toHaveURL(`${BASE}/login`);
        await anonimo.close();
    });

    test('depois do logout a rota interna volta a redirecionar para /login', async ({ browser }) => {
        const { ctx } = await criarConta(browser, 'contratante', 'ct03logout');
        const page = await ctx.newPage();

        await page.goto(`${BASE}/homeContratante`);
        await expect(page).toHaveURL(`${BASE}/homeContratante`);

        const logout = await ctx.request.post(`${BASE}/logout`, { maxRedirects: 0, failOnStatusCode: false });
        expect(logout.status()).toBe(302);
        expect(logout.headers().location).toBe('/login');

        await page.goto(`${BASE}/homeContratante`);
        await expect(page).toHaveURL(`${BASE}/login`);
        const resposta = await ctx.request.get(`${BASE}/carteira/contratante`, {
            maxRedirects: 0,
            failOnStatusCode: false
        });
        expect(resposta.status()).toBe(302);
        expect(resposta.headers().location).toBe('/login');

        await ctx.close();
    });
});
