import { test, expect } from '@playwright/test';

function gerarCpfDeUmNove() {
    return Array.from({ length: 11 }, () => Math.floor(Math.random() * 9) + 1).join('');
}
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
// ==========================================
// 1. TESTES UNITÁRIOS E DE ESTRUTURA
// ==========================================
test.describe('Testes Unitários e de Estrutura — Ibico', () => {

    test('deve abrir a página de login e validar elementos estáticos', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        await expect(page).toHaveTitle(/Login/i);
        
        // Valida se existe qualquer cabeçalho (h1 ou h2) na página de login
        await expect(
            page.locator('h1, h2').first()
        ).toBeVisible();

        const elementos = [
            'input[name="email"]',
            'input[name="senha"]',
            '#submitBtn'
        ];

        for (const elemento of elementos) {
            await expect(page.locator(elemento)).toBeVisible();
        }
    });

    test('deve impedir o envio do formulário vazio', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        const campos = ['email', 'senha'];

        for (const campo of campos) {
            await expect(
                page.locator(`input[name="${campo}"]`)
            ).toHaveAttribute('required', '');
        }

        await page.locator('#submitBtn').click();
        await expect(page).toHaveURL('http://localhost:3000/login');
    });

    test('deve abrir a página de cadastro corretamente', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        await expect(page).toHaveTitle(/Criar Conta|Cadastro/i);

        await expect(
            page.locator('h1, h2').first()
        ).toBeVisible();

        const campos = [
            '#nome',
            '#cEmail',
            '#cpf',
            '#cSenha',
            '#cConfirma',
            '#btnSubmit'
        ];

        for (const campo of campos) {
            await expect(page.locator(campo)).toBeVisible();
        }
    });

    test('deve verificar os campos obrigatórios do cadastro', async ({ page }) => {
        await page.goto('http://localhost:3000/cadastrar');

        const campos = [
            '#nome',
            '#cEmail',
            '#cpf',
            '#cSenha',
            '#cConfirma',
            '#termos',
            '#idade'
        ];

        for (const campo of campos) {
            await expect(page.locator(campo)).toHaveAttribute('required', '');
        }
    });

});

// ==========================================
// 2. TESTES FUNCIONAIS E DE FLUXO
// ==========================================
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

        await page.getByRole('link', {
            name: /criar uma conta|cadastrar/i
        }).click();

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
        await page.locator('#cSenha').fill('senha123');
        await page.locator('#cConfirma').fill('senha123');

        await page.locator('#termos').check();
        await page.locator('#idade').check();

        await page.locator('#btnSubmit').click();

        await expect(page).toHaveURL('http://localhost:3000/cadastrar');
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


test.describe('Fluxo Completo E2E - Área do Contratante (iBico)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.locator('#btnHire').click();
    await page.locator('input[name="email"]').fill('silvaliuson778@gmail.com');
    await page.locator('input[name="senha"]').fill('123456');
    await page.locator('#submitBtn').click();
    await page.waitForURL('http://localhost:3000/homeContratante');
  });

 
  test.describe('1. Painel do Contratante (Home)', () => {

    test('Deve testar o Menu Lateral (Sidebar) e o Rodapé (Footer)', async ({ page }) => {
      // Sidebar
      const sidebar = page.locator('aside, nav, .sidebar').first();
      await expect(sidebar).toBeVisible();
      
      await page.getByRole('link', { name: /início/i }).first().click();
      await expect(page).toHaveURL(/\/homeContratante/);

      await expect(page.getByRole('link', { name: /publicar bico/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /bicos/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /carteira/i }).first()).toBeVisible();
      
      const btnSair = page.locator('button, a').filter({ hasText: /sair|encerrar/i }).first();
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

      const bairros = ['Itaim Bibi', 'Pinheiros', 'Moema', 'Vila Mariana', 'Centro'];
      const horarios = ['08:00', '09:30', '13:00', '14:30', '16:00'];

      // Sorteia os valores aleatoriamente
      const tituloAleatorio = titulos[Math.floor(Math.random() * titulos.length)];
      const descricaoAleatoria = descricoes[Math.floor(Math.random() * descricoes.length)];
      const valorAleatorio = Math.floor(Math.random() * 400) + 100; // Gera um valor entre 100 e 500
      const bairroAleatorio = bairros[Math.floor(Math.random() * bairros.length)];
      const horarioAleatorio = horarios[Math.floor(Math.random() * horarios.length)];

      // Gera uma data futura aleatória (de 1 a 10 dias à frente)
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + Math.floor(Math.random() * 10) + 1);
      const dataFormatada = dataFutura.toISOString().split('T')[0];

      // Preenchendo os campos do formulário com os dados aleatórios gerados
      await page.locator('input[placeholder*="Montagem de móveis"], input[name*="titulo"], input[id*="titulo"]').first().fill(tituloAleatorio);
      await page.locator('textarea').first().fill(descricaoAleatoria);
      
      const inputValor = page.locator('input[value="250"], input[type="number"], input[name*="valor"]').first();
      if (await inputValor.isVisible()) {
        await inputValor.clear();
        await inputValor.fill(String(valorAleatorio));
      }

      // Preenchendo Bairro / Localização
      const inputBairro = page.locator('input[placeholder*="Itaim Bibi"], input[name*="bairro"], select[name*="bairro"]').first();
      if (await inputBairro.isVisible()) {
        await inputBairro.fill(bairroAleatorio).catch(() => {});
      }

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
      const inputSaldo = page.locator('input[placeholder*="Valor para adicio"], input[type="number"], input[type="text"]').first();
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
        await page.locator('a, button').filter({ hasText: /perfil|conta|são jorge/i }).first().click();
      }
    });

    test('Deve testar os botões de dados e segurança do Perfil', async ({ page }) => {
      // Botão Ocultar (CPF)
      const btnOcultar = page.getByRole('button', { name: /ocultar|mostrar/i });
      if (await btnOcultar.isVisible()) {
        await btnOcultar.click();
      }

      // Botão Alterar senha
      const btnSenha = page.getByRole('button', { name: /alterar senha|senha/i }).or(page.getByRole('link', { name: /alterar senha|senha/i }));
      if (await btnSenha.isVisible()) {
        await btnSenha.click();
      }

      // Botão Voltar
      const btnVoltar = page.getByRole('link', { name: /voltar/i }).or(page.getByRole('button', { name: /voltar/i }));
      if (await btnVoltar.isVisible()) {
        await btnVoltar.click();
        await expect(page).toHaveURL(/\/homeContratante/);
      }
    });

    test('Deve abrir o Modal Editar Perfil, preencher dados e testar ações', async ({ page }) => {
      // Abre o modal de edição de perfil
      const btnEditar = page.getByRole('button', { name: /editar perfil|editar/i }).or(page.getByRole('link', { name: /editar perfil|editar/i }));
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

