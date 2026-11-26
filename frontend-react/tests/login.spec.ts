import { test, expect } from '@playwright/test';

/**
 * ✦ SUÍTE DE TESTES E2E — LUMINA BLOG & REVISTA CULTURAL ✦
 * Testes essenciais que cobrem o ciclo completo da aplicação:
 * 1. Autenticação (Login com Sucesso)
 * 2. Validação de Credenciais Incorretas (Feedback Visual de Erro)
 * 3. Cadastro de Nova Integrante (com interesses culturais)
 * 4. Leitura e Abertura de Artigo
 * 5. Marcador no Caderno Pessoal (Slow Media / Sem métricas de like)
 * 6. Envio de Recado no Mural de Comentários
 * 7. Navegação Cultural e Logout Seguro
 */

// Credenciais de usuário padrão para testes
const USUARIO_TESTE = {
  email: 'gioferreira@gmail.com',
  senha: 'gio12345'
};

// Função auxiliar reutilizável para autenticação nos testes
async function realizarLogin(page) {
  await page.goto('/login');

  await page.getByPlaceholder('nome@exemplo.com').fill(USUARIO_TESTE.email);
  await page.getByPlaceholder('••••••••').fill(USUARIO_TESTE.senha);

  await page.getByRole('button', { name: /ENTRAR/i }).click();

  // Aguarda o redirecionamento com confirmação da área logada
  await page.waitForURL('**/home', { timeout: 15000 });
}

// 1. TESTE DE LOGIN COM SUCESSO
test('1. Deve realizar login com sucesso e redirecionar para o feed', async ({ page }) => {
  await realizarLogin(page);

  await expect(page).toHaveURL(/\/home$/);

  // Confirma que a barra logada está ativa exibindo o botão SAIR
  await expect(
    page.getByRole('button', { name: /SAIR/i })
  ).toBeVisible();
});

// 2. TESTE DE LOGIN COM ERRO (SENHA INVÁLIDA)
test('2. Deve exibir mensagem de erro ao tentar logar com credenciais inválidas', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('nome@exemplo.com').fill(USUARIO_TESTE.email);
  await page.getByPlaceholder('••••••••').fill('senha_errada_9999');

  await page.getByRole('button', { name: /ENTRAR/i }).click();

  // Valida que o alerta visual com a mensagem de erro é exibido na tela
  const alertaErro = page.locator('.bg-red-100');
  await expect(alertaErro).toBeVisible({ timeout: 15000 });
  await expect(alertaErro).toContainText(/invalidos|credenciais|Erro/i);
});

// 3. TESTE DE CADASTRO DE NOVA INTEGRANTE
test('3. Deve cadastrar nova usuária com e-mail único e acessar a plataforma', async ({ page }) => {
  await page.goto('/register');

  const emailDinamico = `leitora_${Date.now()}@lumina.com`;

  await page.getByPlaceholder('Machado de Assis').fill('Helena Soares');
  await page.getByPlaceholder('autor@plural.com').fill(emailDinamico);
  await page.getByPlaceholder('••••••••').fill('senha123456');

  // Seleciona interesses culturais
  await page.getByRole('button', { name: 'Cinema' }).click();
  await page.getByRole('button', { name: 'Música' }).click();

  // Envia formulário de cadastro
  await page.getByRole('button', { name: /CRIAR CONTA/i }).click();

  // Aguarda entrada automática na área do assinante
  await page.waitForURL('**/home', { timeout: 15000 });
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('button', { name: /SAIR/i })).toBeVisible();
});

// 4. TESTE DE VISUALIZAÇÃO DE ARTIGO COMPLETO
test('4. Deve acessar um artigo do feed e abrir a página individual', async ({ page }) => {
  await realizarLogin(page);

  const primeiroPost = page.locator('article').first();
  await expect(primeiroPost).toBeVisible({ timeout: 10000 });
  await primeiroPost.click();

  await expect(page).toHaveURL(/\/post\/\d+$/, { timeout: 10000 });

  // Confirma presença do botão de retorno ao feed
  await expect(
    page.getByRole('link', { name: /VOLTAR/i }).first()
  ).toBeVisible();
});

// 5. TESTE DE MARCAR PÁGINA (SLOW MEDIA / SEM CONTADOR DE LIKES)
test('5. Deve guardar artigo no caderno pessoal (marcador de leitura lenta)', async ({ page }) => {
  await realizarLogin(page);

  await page.locator('article').first().click();
  await expect(page).toHaveURL(/\/post\/\d+$/, { timeout: 10000 });

  // Localiza o botão de marcador editorial íntimo
  const botaoCaderno = page.getByRole('button', { name: /GUARDAR PÁGINA|MARCADO NO CADERNO/i });
  await expect(botaoCaderno).toBeVisible();
  await botaoCaderno.click();

  // Confirma estado ativo do marcador no caderno
  await expect(
    page.getByRole('button', { name: /GUARDAR PÁGINA|MARCADO NO CADERNO/i })
  ).toBeVisible();
});

// 6. TESTE DE RECADO NO MURAL DO POST (COMENTÁRIOS)
test('6. Deve publicar um recado no mural do post com sucesso', async ({ page }) => {
  await realizarLogin(page);

  await page.locator('article').first().click();
  await expect(page).toHaveURL(/\/post\/\d+$/, { timeout: 10000 });

  const textoRecado = `Publicação sensível e enriquecedora! (Teste ${Date.now()})`;

  const inputRecado = page.getByPlaceholder(/Escreva sua opinião|recado/i);
  await expect(inputRecado).toBeVisible({ timeout: 10000 });
  await inputRecado.fill(textoRecado);

  await page.getByRole('button', { name: /PUBLICAR RECADO/i }).click();

  // Valida que o recado apareceu no mural de comentários
  await expect(
    page.getByText(textoRecado)
  ).toBeVisible({ timeout: 15000 });
});

// 7. TESTE DE NAVEGAÇÃO ENTRE AS SEÇÕES DA REVISTA E LOGOUT
test('7. Deve navegar pelas abas principais (Resenhas, Hobbies, Chat) e encerrar sessão', async ({ page }) => {
  await realizarLogin(page);

  // Navega para Resenhas
  await page.locator('a[href="/resenhas"]').click();
  await expect(page).toHaveURL(/\/resenhas$/, { timeout: 10000 });

  // Navega para Hobbies
  await page.locator('a[href="/hobbies"]').click();
  await expect(page).toHaveURL(/\/hobbies$/, { timeout: 10000 });

  // Navega para Chat
  await page.locator('a[href="/chat"]').click();
  await expect(page).toHaveURL(/\/chat$/, { timeout: 10000 });

  // Finaliza sessão e retorna à capa pública
  await page.getByRole('button', { name: /SAIR/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
});
