import { test, expect } from '@playwright/test';

// ✦ Dados de usuário padrão para testes
const USUARIO_TESTE = {
  email: 'gioferreira@gmail.com',
  senha: 'gio12345'
};

test.describe('✦ Suíte de Testes Essenciais — Lumina Blog', () => {

  // 1. TESTE DE LOGIN COM SUCESSO
  test('1. Deve realizar login com sucesso e redirecionar para o feed', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(USUARIO_TESTE.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USUARIO_TESTE.senha);
    await page.getByRole('button', { name: 'ENTRAR →' }).click();

    // Valida redirecionamento para o feed (/home)
    await expect(page).toHaveURL(/.*home/);
    
    // Valida que o botão de SAIR está visível na barra superior
    await expect(page.getByRole('button', { name: 'SAIR' })).toBeVisible();
  });

  // 2. TESTE DE LOGIN COM ERRO (SENHA INVÁLIDA)
  test('2. Deve exibir mensagem de erro ao tentar logar com senha incorreta', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(USUARIO_TESTE.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill('senha_errada_999');
    await page.getByRole('button', { name: 'ENTRAR →' }).click();

    // Valida que a mensagem de alerta/erro é exibida na tela
    const alertaErro = page.locator('div:has-text("⚠")');
    await expect(alertaErro.first()).toBeVisible();
  });

  // 3. TESTE DE CADASTRO DE NOVA INTEGRANTE
  test('3. Deve cadastrar nova usuária com e-mail único e acessar a plataforma', async ({ page }) => {
    await page.goto('http://localhost:5173/register');

    const emailDinamico = `leitora_${Date.now()}@lumina.com`;

    await page.getByRole('textbox', { name: 'Machado de Assis' }).fill('Helena Soares');
    await page.getByRole('textbox', { name: 'autor@plural.com' }).fill(emailDinamico);
    await page.getByRole('textbox', { name: '••••••••' }).fill('senha123456');

    // Seleciona interesses culturais
    await page.getByRole('button', { name: 'Cinema' }).click();
    await page.getByRole('button', { name: 'Música' }).click();

    // Envia formulário
    await page.getByRole('button', { name: 'CRIAR CONTA →' }).click();

    // Valida redirecionamento para a área logada
    await expect(page).toHaveURL(/.*home/);
  });

  // 4. TESTE DE VISUALIZAÇÃO DE POST COMPLETO
  test('4. Deve acessar um post do feed e abrir a página individual', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(USUARIO_TESTE.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USUARIO_TESTE.senha);
    await page.getByRole('button', { name: 'ENTRAR →' }).click();
    await page.waitForURL('**/home');

    // Clica no primeiro card de artigo disponível no feed
    const primeiroPost = page.locator('article').first();
    await expect(primeiroPost).toBeVisible();
    await primeiroPost.click();

    // Valida que entrou na rota individual do post (/post/:id)
    await expect(page).toHaveURL(/.*post\/\d+/);

    // Valida presença do botão de voltar para o feed
    await expect(page.getByRole('link', { name: 'VOLTAR PARA O FEED' })).toBeVisible();
  });

  // 5. TESTE DE RECADO NO MURAL DO POST (COMENTÁRIOS)
  test('5. Deve publicar um recado no mural do post com sucesso', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(USUARIO_TESTE.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USUARIO_TESTE.senha);
    await page.getByRole('button', { name: 'ENTRAR →' }).click();
    await page.waitForURL('**/home');

    // Abre o primeiro post
    await page.locator('article').first().click();
    await page.waitForURL(/.*post\/\d+/);

    const textoRecado = `Adorei essa resenha! ✧ (Teste ${Date.now()})`;

    // Preenche e publica o comentário
    const inputRecado = page.getByRole('textbox', { name: 'Deixe seu recadinho no mural:' });
    await inputRecado.fill(textoRecado);
    await page.getByRole('button', { name: 'PUBLICAR RECADO ✧' }).click();

    // Valida que o recado publicado apareceu na lista de comentários
    await expect(page.getByText(textoRecado)).toBeVisible({ timeout: 10000 });
  });

  // 6. TESTE DE NAVEGAÇÃO ENTRE AS ABAS DA REVISTA
  test('6. Deve navegar pelas abas principais (Resenhas, Hobbies, Chat e Logout)', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(USUARIO_TESTE.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USUARIO_TESTE.senha);
    await page.getByRole('button', { name: 'ENTRAR →' }).click();
    await page.waitForURL('**/home');

    // Navega para Resenhas usando o link da rota
    await page.locator('a[href="/resenhas"]').click();
    await expect(page).toHaveURL(/.*resenhas/);

    // Navega para Hobbies
    await page.locator('a[href="/hobbies"]').click();
    await expect(page).toHaveURL(/.*hobbies/);

    // Navega para Chat
    await page.locator('a[href="/chat"]').click();
    await expect(page).toHaveURL(/.*chat/);

    // Finaliza sessão pelo botão SAIR
    await page.getByRole('button', { name: 'SAIR' }).click();
    await expect(page).toHaveURL('http://localhost:5173/');
  });

});
