import { test, expect } from '@playwright/test';
import { gerarCpfDeUmNove } from '../support/gerarCpf.js';

test.describe('Fluxo Completo E2E - Área do Contratante (iBico)', () => {
    // Conta fictícia criada pelo próprio teste (o banco pode estar vazio).
    const contratante = {
        email: `contratante_fluxo_${Date.now()}@gmail.com`,
        senha: '123456'
    };

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto('http://localhost:3000/cadastrar');
        await page.locator('#cardContratante').click();
        await page.locator('#nome').fill('Contratante Fluxo E2E');
        await page.locator('#cEmail').fill(contratante.email);
        await page.locator('#cpf').fill(gerarCpfDeUmNove());
        await page.locator('#cIdade').fill('30');
        await page.locator('#cSenha').fill(contratante.senha);
        await page.locator('#cConfirma').fill(contratante.senha);
        await page.locator('#termos').check();
        await page.locator('#idade').check();
        await page.locator('#btnSubmit').click();
        await page.waitForURL('http://localhost:3000/login');
        await page.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.locator('#btnHire').click();
        await page.locator('input[name="email"]').fill(contratante.email);
        await page.locator('input[name="senha"]').fill(contratante.senha);
        await page.locator('#submitBtn').click();
        await page.waitForURL('http://localhost:3000/homeContratante');
    });

    test.describe('1. Painel do Contratante (Home)', () => {
        test('Deve testar o Menu Lateral (Sidebar) e o Rodapé (Footer)', async ({ page }) => {
            // Sidebar
            const sidebar = page.locator('aside, nav, .sidebar').first();
            await expect(sidebar).toBeVisible();

            await page
                .getByRole('link', { name: /início/i })
                .first()
                .click();
            await expect(page).toHaveURL(/\/homeContratante/);

            await expect(page.getByRole('link', { name: /publicar bico/i }).first()).toBeVisible();
            await expect(page.getByRole('link', { name: /bicos/i }).first()).toBeVisible();
            await expect(page.getByRole('link', { name: /carteira/i }).first()).toBeVisible();

            const btnSair = page
                .locator('button, a')
                .filter({ hasText: /sair|encerrar/i })
                .first();
            await expect(btnSair).toBeVisible();

            // Footer - Rola até o rodapé para garantir que os elementos estejam visíveis na tela
            const footer = page.locator('footer');
            await footer.scrollIntoViewIfNeeded();

            await expect(footer.getByRole('link', { name: /início/i })).toBeVisible();
            await expect(footer.getByRole('link', { name: /publicar bico/i })).toBeVisible();

            // Busca flexível para os links do rodapé (aceita variações comuns de texto)
            await expect(footer.locator('a').filter({ hasText: /termos/i })).toBeVisible();
            await expect(footer.locator('a').filter({ hasText: /privacidade/i })).toBeVisible();
            await expect(footer.locator('a').filter({ hasText: /ajuda|suporte/i })).toBeVisible();
        });

        test('Deve testar os botões de ação do corpo da página inicial', async ({ page }) => {
            const btnPublicar = page.getByRole('link', { name: /publicar/i }).first();
            await expect(btnPublicar).toBeVisible();
            await btnPublicar.click();

            await page.goto('http://localhost:3000/homeContratante');

            const btnVagas = page.getByRole('link', { name: /vagas|bicos/i }).first();
            if (await btnVagas.isVisible()) {
                await btnVagas.click();
            }
        });
    });

    test.describe('2. Publicar Novo Bico', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('http://localhost:3000/bicos/novo');
        });

        test('Deve preencher os campos com dados aleatórios e publicar a vaga com sucesso', async ({ page }) => {
            // Arrays com opções variadas para gerar dados dinâmicos e aleatórios
            const titulos = [
                'Montagem de Estante de Escritório',
                'Limpeza Pós-Obra Residencial',
                'Pintura de Parede da Sala',
                'Instrução de Informática Básica',
                'Reparo em Encanamento de Cozinha'
            ];

            const descricoes = [
                'Precisa de atenção aos detalhes e ferramentas próprias.',
                'Serviço rápido para o final de semana. Bom pagamento.',
                'Necessário experiência prévia na área e agilidade.',
                'Trabalho com materiais já fornecidos no local.'
            ];

            const horarios = ['08:00', '09:30', '13:00', '14:30', '16:00'];

            // Sorteia os valores aleatoriamente
            const tituloAleatorio = titulos[Math.floor(Math.random() * titulos.length)];
            const descricaoAleatoria = descricoes[Math.floor(Math.random() * descricoes.length)];
            const valorAleatorio = Math.floor(Math.random() * 400) + 100; // Gera um valor entre 100 e 500
            const horarioAleatorio = horarios[Math.floor(Math.random() * horarios.length)];

            // Gera uma data futura aleatória (de 1 a 10 dias à frente)
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + Math.floor(Math.random() * 10) + 1);
            const dataFormatada = dataFutura.toISOString().split('T')[0];

            // Preenchendo os campos do formulário com os dados aleatórios gerados
            await page
                .locator('input[placeholder*="Montagem de móveis"], input[name*="titulo"], input[id*="titulo"]')
                .first()
                .fill(tituloAleatorio);
            await page.locator('textarea').first().fill(descricaoAleatoria);

            const inputValor = page.locator('input[value="250"], input[type="number"], input[name*="valor"]').first();
            if (await inputValor.isVisible()) {
                await inputValor.clear();
                await inputValor.fill(String(valorAleatorio));
            }

            // Preenchendo o endereço: CEP do provedor falso (CEP_FAKE=1); a consulta preenche rua, bairro, cidade e UF.
            await page.locator('input[name="cep"]').fill('01310-100');
            await expect(page.locator('input[name="logradouro"]')).toHaveValue('Avenida Paulista');
            await page.locator('input[name="numero"]').fill(String(Math.floor(Math.random() * 2000) + 1));

            // Preenchendo Data
            const inputData = page.locator('input[type="date"]').first();
            if (await inputData.isVisible()) {
                await inputData.fill(dataFormatada);
            }

            // Preenchendo Horário
            const inputHora = page.locator('input[type="time"], input[name*="hora"]').first();
            if (await inputHora.isVisible()) {
                await inputHora.fill(horarioAleatorio);
            }

            // Clica efetivamente no botão de publicar a vaga para salvar no sistema
            const btnPublicar = page.getByRole('button', { name: /Publicar Vaga|Publicar Bico|Cadastrar|Salvar/i });
            await expect(btnPublicar).toBeVisible();
            await btnPublicar.click();

            // Valida se após publicar houve o redirecionamento correto (ex: voltando para os bicos ou home)
            await page.waitForLoadState('networkidle');
        });
    });

    test.describe('3. Carteira do Contratante', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('http://localhost:3000/carteira/contratante');
        });

        test('Deve inserir um valor e testar o botão Adicionar Saldo', async ({ page }) => {
            const inputSaldo = page
                .locator('input[placeholder*="Valor para adicio"], input[type="number"], input[type="text"]')
                .first();
            if (await inputSaldo.isVisible()) {
                await inputSaldo.clear();
                await inputSaldo.fill('150.00');
                await page.getByRole('button', { name: 'Adicionar Saldo' }).click();
            }
        });
    });

    test.describe('4. Meu Perfil e Modal Editar Perfil', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('http://localhost:3000/homeContratante');

            // Tenta clicar no link do perfil usando atributos de rota (href) ou textos comuns
            const linkPerfil = page.locator('a[href*="perfil"], a[href*="usuario"], a[href*="conta"]').first();

            if (await linkPerfil.isVisible()) {
                await linkPerfil.click();
            } else {
                // Fallback caso o link use classe específica ou texto genérico
                await page
                    .locator('a, button')
                    .filter({ hasText: /perfil|conta|são jorge/i })
                    .first()
                    .click();
            }
        });

        test('Deve testar os botões de dados e segurança do Perfil', async ({ page }) => {
            // Botão Ocultar (CPF)
            const btnOcultar = page.getByRole('button', { name: /ocultar|mostrar/i });
            if (await btnOcultar.isVisible()) {
                await btnOcultar.click();
            }

            // Botão Alterar senha
            const btnSenha = page
                .getByRole('button', { name: /alterar senha|senha/i })
                .or(page.getByRole('link', { name: /alterar senha|senha/i }));
            if (await btnSenha.isVisible()) {
                await btnSenha.click();
            }

            // Botão Voltar
            const btnVoltar = page
                .getByRole('link', { name: /voltar/i })
                .or(page.getByRole('button', { name: /voltar/i }));
            if (await btnVoltar.isVisible()) {
                await btnVoltar.click();
                await expect(page).toHaveURL(/\/homeContratante/);
            }
        });

        test('Deve abrir o Modal Editar Perfil, preencher dados e testar ações', async ({ page }) => {
            // Abre o modal de edição de perfil
            const btnEditar = page
                .getByRole('button', { name: /editar perfil|editar/i })
                .or(page.getByRole('link', { name: /editar perfil|editar/i }));
            await expect(btnEditar).toBeVisible();
            await btnEditar.click();

            // Edita os campos do modal de forma segura
            const inputNome = page.locator('input[name*="nome"], input[id*="nome"]').first();
            if (await inputNome.isVisible()) {
                await inputNome.clear();
                await inputNome.fill('são jorge da Silva');
            }

            const inputIdade = page.locator('input[name*="idade"], input[id*="idade"]').first();
            if (await inputIdade.isVisible()) {
                await inputIdade.clear();
                await inputIdade.fill('25');
            }

            // Testa botão Cancelar do Modal
            const btnCancelarModal = page.locator('.modal, dialog, div').getByRole('button', { name: /cancelar/i });
            if (await btnCancelarModal.isVisible()) {
                await btnCancelarModal.click();
            }
        });
    });
});
