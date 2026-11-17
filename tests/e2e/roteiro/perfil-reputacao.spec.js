// Perfil público com reputação nos dois sentidos, "N bicos concluídos" nos candidatos, "Sobre o contratante"
// nos detalhes do bico e ausência de indicadores fictícios (verificado, validado, taxa de resposta).
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, sufixoUnico,
  adicionarSaldo, publicarBico, candidatar, listarCandidatos, aceitar, consultarBanco
} from '../support/cenario.js';

const VALOR = 100;
const dataBR = (d = new Date()) => {
  const dois = (n) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const idPorEmail = async (email) => (await consultarBanco('SELECT id FROM usuarios WHERE email = ?', [email]))[0].id;
const post = (ctx, url, form = {}) => ctx.request.post(`${BASE}${url}`, { form, failOnStatusCode: false });

// Cria um bico, o trabalhador se candidata e o contratante aceita. Devolve o id do bico.
const bicoAceito = async (contratante, trabalhador, rotulo) => {
  const id = await publicarBico(contratante.ctx, `${rotulo} ${sufixoUnico()}`, VALOR);
  expect((await candidatar(trabalhador.ctx, id)).status()).toBe(302);
  const [c] = await listarCandidatos(contratante.ctx, id);
  expect((await aceitar(contratante.ctx, c.candidaturaId)).status()).toBe(302);
  return id;
};
const finalizar = async (contratante, id) => expect((await post(contratante.ctx, `/bicos/${id}/finalizar`)).status()).toBe(200);
const avaliar = async (ctx, id, nota, comentario) =>
  expect((await post(ctx, `/bicos/${id}/avaliacao`, { nota: String(nota), comentario })).status()).toBe(200);

test.describe('Perfil público: reputação', () => {
  let contratante;
  let t1;
  let t2;
  let ids;

  test.beforeAll(async ({ browser }) => {
    contratante = await criarConta(browser, 'contratante', 'rep_c');
    t1 = await criarConta(browser, 'trabalhador', 'rep_t1');
    t2 = await criarConta(browser, 'trabalhador', 'rep_t2');
    await adicionarSaldo(contratante.ctx, 2000);

    // 2 concluídos (T1), 1 em andamento (T1), 1 cancelado depois do aceite (T2) e 1 antes do aceite, 1 aberto.
    const b1 = await bicoAceito(contratante, t1, 'Rep concluído A');
    await finalizar(contratante, b1);
    const b2 = await bicoAceito(contratante, t1, 'Rep concluído B');
    await finalizar(contratante, b2);
    const b3 = await bicoAceito(contratante, t1, 'Rep andamento');
    const b4 = await bicoAceito(contratante, t2, 'Rep cancelado depois');
    expect((await post(contratante.ctx, `/bicos/${b4}/cancelar`, { motivo: 'Mudança de planos' })).status()).toBe(200);
    const b5 = await publicarBico(contratante.ctx, `Rep cancelado antes ${sufixoUnico()}`, VALOR);
    expect((await post(contratante.ctx, `/bicos/${b5}/cancelar`, {})).status()).toBe(200);
    await publicarBico(contratante.ctx, `Rep aberto ${sufixoUnico()}`, VALOR);

    // Notas: o contratante avalia T1 com 5 e 4; T1 avalia o contratante com 3.
    await avaliar(contratante.ctx, b1, 5, 'Excelente trabalho');
    await avaliar(contratante.ctx, b2, 4, 'Muito bom');
    await avaliar(t1.ctx, b1, 3, 'Pagou, mas atrasou a liberação');
    ids = { b1, b2, b3, b4, b5, idT1: await idPorEmail(t1.email), idT2: await idPorEmail(t2.email), idC: await idPorEmail(contratante.email) };
  });

  test.afterAll(async () => {
    for (const c of [contratante, t1, t2]) await c.ctx.close();
  });

  test('trabalhador: média, distribuição, bicos concluídos e em andamento, último serviço e avaliações', async () => {
    const page = await t2.ctx.newPage(); // outro usuário logado olhando o perfil do T1
    await page.goto(`${BASE}/perfil/publico/${ids.idT1}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#perfil-tipo')).toContainText('Trabalhador');
    await expect(page.locator('#perfil-membro-desde')).toContainText(/Membro desde \S+ de \d{4}/);
    await expect(page.locator('#perfil-ultimo-servico')).toContainText(`Último serviço concluído em ${dataBR()}`);

    const reputacao = page.locator('#perfil-reputacao');
    await expect(page.locator('.rating-stars')).toHaveAttribute('aria-label', /4,5 de 5/);
    await expect(page.locator('.overall-rating')).toContainText('2 avaliações');
    await expect(reputacao.locator('#perfil-bicos-concluidos')).toHaveText('2 bicos concluídos');
    await expect(reputacao.locator('#perfil-bicos-andamento')).toHaveText('1');
    // Trabalhador não tem taxa de conclusão nem contadores de cancelamento (só o contratante cancela).
    await expect(reputacao.locator('#perfil-taxa-conclusao')).toHaveCount(0);
    await expect(reputacao.locator('#perfil-cancelados-apos-aceite')).toHaveCount(0);

    // Distribuição: 1 nota 5, 1 nota 4, o resto zero.
    const contagem = async (estrelas) => (await reputacao.locator(`.dist-row[data-estrelas="${estrelas}"] .dist-count`).textContent()).trim();
    expect([await contagem(5), await contagem(4), await contagem(3), await contagem(2), await contagem(1)]).toEqual(['1', '1', '0', '0', '0']);
    await expect(reputacao.locator('.dist-row[data-estrelas="5"] .dist-fill')).toHaveAttribute('style', /width: 50%/);

    // Avaliações: nota, comentário, nome e perfil de quem avaliou, e data.
    const cartoes = page.locator('.review-card');
    await expect(cartoes).toHaveCount(2);
    await expect(cartoes.filter({ hasText: 'Excelente trabalho' })).toContainText(contratante.nome);
    await expect(cartoes.filter({ hasText: 'Excelente trabalho' }).locator('.review-role')).toHaveText('Contratante');
    await expect(cartoes.filter({ hasText: 'Muito bom' })).toContainText(dataBR());
    await expect(cartoes.filter({ hasText: 'Muito bom' }).locator('.review-stars')).toHaveAttribute('aria-label', '4 de 5 estrelas');
    await page.close();
  });

  test('contratante: publicados, concluídos (valor simulado), cancelados depois/antes do aceite e taxa de conclusão', async () => {
    const page = await t1.ctx.newPage();
    await page.goto(`${BASE}/perfil/publico/${ids.idC}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#perfil-tipo')).toContainText('Contratante');
    await expect(page.locator('#perfil-ultimo-servico')).toContainText(`Último serviço concluído em ${dataBR()}`);
    const reputacao = page.locator('#perfil-reputacao');
    await expect(reputacao.locator('#perfil-bicos-publicados')).toHaveText('6');
    await expect(reputacao.locator('#perfil-bicos-concluidos')).toHaveText('2 bicos concluídos');
    await expect(reputacao).toContainText('carteira simulada (valor simulado, sem pagamento real)');
    await expect(reputacao.locator('#perfil-cancelados-apos-aceite')).toHaveText('1');
    await expect(reputacao.locator('#perfil-cancelados-antes')).toHaveText('1');
    // 2 ÷ (2 + 1) = 67%
    await expect(reputacao.locator('#perfil-taxa-conclusao')).toHaveText('67%');
    // Nota recebida do T1: 3,0 com 1 avaliação (e a distribuição acompanha).
    await expect(page.locator('.rating-stars')).toHaveAttribute('aria-label', /3,0 de 5/);
    await expect(reputacao.locator('.dist-row[data-estrelas="3"] .dist-count')).toHaveText('1');
    const cartao = page.locator('.review-card');
    await expect(cartao).toHaveCount(1);
    await expect(cartao).toContainText(t1.nome);
    await expect(cartao.locator('.review-role')).toHaveText('Trabalhador');
    await page.close();
  });

  test('o perfil público nunca mostra e-mail, CPF, idade ou saldo', async () => {
    for (const id of [ids.idT1, ids.idC]) {
      const pagina = await (await t2.ctx.request.get(`${BASE}/perfil/publico/${id}`)).text();
      const html = /<main[\s\S]*<\/main>/.exec(pagina)[0]; // o menu de quem vê fica fora do <main>
      for (const email of [contratante.email, t1.email, t2.email]) expect(pagina).not.toContain(email);
      expect(html).not.toMatch(/CPF|saldo|idade|\d{3}\.\d{3}\.\d{3}-\d{2}/i);
    }
  });

  test('usuário sem nenhum histórico: "Ainda sem avaliações", zeros e "Sem histórico suficiente" (sem parecer ruim)', async ({ browser }) => {
    const novoC = await criarConta(browser, 'contratante', 'rep_novoc');
    const novoT = await criarConta(browser, 'trabalhador', 'rep_novot');

    const htmlC = await (await t1.ctx.request.get(`${BASE}/perfil/publico/${await idPorEmail(novoC.email)}`)).text();
    expect(htmlC).toContain('Ainda sem avaliações');
    expect(htmlC).toContain('Nenhum serviço concluído ainda');
    expect(htmlC).toContain('Sem histórico suficiente');
    expect(htmlC).toMatch(/id="perfil-bicos-publicados">0</);
    expect(htmlC).toMatch(/id="perfil-cancelados-apos-aceite">0</);

    const htmlT = await (await t1.ctx.request.get(`${BASE}/perfil/publico/${await idPorEmail(novoT.email)}`)).text();
    expect(htmlT).toContain('Ainda sem avaliações');
    expect(htmlT).toContain('Nenhum serviço concluído ainda');
    expect(htmlT).toMatch(/id="perfil-bicos-concluidos">0 bicos concluídos</);
    expect(htmlT).toMatch(/id="perfil-bicos-andamento">0</);

    // Só bicos cancelados antes do aceite: continua sem histórico suficiente (nada de 0%).
    await adicionarSaldo(novoC.ctx, 100);
    const aberto = await publicarBico(novoC.ctx, `Rep só cancelado ${sufixoUnico()}`, VALOR);
    expect((await post(novoC.ctx, `/bicos/${aberto}/cancelar`)).status()).toBe(200);
    const htmlC2 = await (await t1.ctx.request.get(`${BASE}/perfil/publico/${await idPorEmail(novoC.email)}`)).text();
    expect(htmlC2).toContain('Sem histórico suficiente');
    expect(htmlC2).toMatch(/id="perfil-cancelados-antes">1</);
    await novoC.ctx.close();
    await novoT.ctx.close();
  });

  test('"Ver todas": mostra as 5 avaliações mais recentes e expande o restante', async ({ browser }) => {
    const c = await criarConta(browser, 'contratante', 'rep_manyc');
    const t = await criarConta(browser, 'trabalhador', 'rep_manyt');
    await adicionarSaldo(c.ctx, 1000);
    for (let i = 1; i <= 6; i += 1) {
      const id = await bicoAceito(c, t, `Rep muitas ${i}`);
      await finalizar(c, id);
      await avaliar(c.ctx, id, 5, `Comentário número ${i}`);
    }
    const page = await c.ctx.newPage();
    await page.goto(`${BASE}/perfil/publico/${await idPorEmail(t.email)}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.overall-rating')).toContainText('6 avaliações');
    await expect(page.locator('.review-card')).toHaveCount(6);
    await expect(page.locator('.review-card:visible')).toHaveCount(5);
    const botao = page.locator('#ver-todas-avaliacoes');
    await expect(botao).toHaveText('Ver todas (6)');
    await botao.click();
    await expect(page.locator('.review-card:visible')).toHaveCount(6);
    await expect(botao).toHaveText('Ver menos');
    await botao.click();
    await expect(page.locator('.review-card:visible')).toHaveCount(5);
    await page.close();
    await c.ctx.close();
    await t.ctx.close();
  });
});

test.describe('Onde a decisão acontece', () => {
  test('candidatos mostram "N bicos concluídos"; detalhes do bico mostram "Sobre o contratante"', async ({ browser }) => {
    const c = await criarConta(browser, 'contratante', 'dec_c');
    const veterano = await criarConta(browser, 'trabalhador', 'dec_v');
    const novato = await criarConta(browser, 'trabalhador', 'dec_n');
    await adicionarSaldo(c.ctx, 1000);

    // O veterano conclui 2 bicos (um cancelado depois do aceite entra no perfil do contratante).
    for (const rotulo of ['Dec concluído A', 'Dec concluído B']) {
      const id = await bicoAceito(c, veterano, rotulo);
      await finalizar(c, id);
    }
    const cancelado = await bicoAceito(c, novato, 'Dec cancelado depois');
    expect((await post(c.ctx, `/bicos/${cancelado}/cancelar`, {})).status()).toBe(200);
    const idVeterano = await idPorEmail(veterano.email);
    const idC = await idPorEmail(c.email);
    await avaliar(veterano.ctx, (await consultarBanco('SELECT id FROM bicos WHERE contratante_id = ? ORDER BY id LIMIT 1', [idC]))[0].id, 4, 'Contratante correto');

    // Bico aberto com os dois candidatos.
    const titulo = `Dec aberto ${sufixoUnico()}`;
    const aberto = await publicarBico(c.ctx, titulo, VALOR);
    expect((await candidatar(veterano.ctx, aberto)).status()).toBe(302);
    expect((await candidatar(novato.ctx, aberto)).status()).toBe(302);

    const pc = await c.ctx.newPage();
    await pc.goto(`${BASE}/bicos/${aberto}/gerenciar`, { waitUntil: 'domcontentloaded' });
    const cartaoVeterano = pc.locator('.candidate-card', { hasText: veterano.nome });
    await expect(cartaoVeterano.locator('.candidate-card__concluidos')).toHaveText('2 bicos concluídos');
    await expect(cartaoVeterano.locator('a', { hasText: 'Ver perfil' })).toHaveAttribute('href', `/perfil/publico/${idVeterano}`);
    const cartaoNovato = pc.locator('.candidate-card', { hasText: novato.nome });
    await expect(cartaoNovato.locator('.candidate-card__concluidos')).toHaveText('0 bicos concluídos');
    // O link do formulário de avaliação continua levando ao perfil público completo (checado no E2E da avaliação).
    await pc.close();

    // Trabalhador (outro) vê "Sobre o contratante" antes de se candidatar.
    const outro = await criarConta(browser, 'trabalhador', 'dec_o');
    const po = await outro.ctx.newPage();
    await po.goto(`${BASE}/bicos/${aberto}`, { waitUntil: 'domcontentloaded' });
    const bloco = po.locator('#sobre-contratante');
    await expect(bloco).toContainText('Sobre o contratante');
    await expect(bloco).toContainText(c.nome);
    await expect(bloco.locator('#sobre-contratante-media')).toContainText('★ 4,0');
    await expect(bloco.locator('#sobre-contratante-media')).toContainText('1 avaliação');
    await expect(bloco.locator('#sobre-contratante-concluidos')).toHaveText('2 bicos concluídos');
    await expect(bloco.locator('#sobre-contratante-cancelados')).toHaveText('1 cancelado depois de aceitar um trabalhador');
    await expect(bloco.locator('#sobre-contratante-link')).toHaveAttribute('href', `/perfil/publico/${idC}`);

    // O contratante, dono do bico, não vê esse bloco (ele usa a tela de gerenciar).
    expect(await (await c.ctx.request.get(`${BASE}/bicos/${aberto}`)).text()).not.toContain('id="sobre-contratante"');

    await po.close();
    for (const x of [c, veterano, novato, outro]) await x.ctx.close();
  });
});

test.describe('Sem indicadores fictícios', () => {
  test('nenhuma tela mostra "Verificado", "validado" ou "Taxa de resposta"', async ({ browser, request }) => {
    const c = await criarConta(browser, 'contratante', 'fic_c');
    const t = await criarConta(browser, 'trabalhador', 'fic_t');
    await adicionarSaldo(c.ctx, 500);
    const id = await bicoAceito(c, t, 'Fic bico');
    const idT = await idPorEmail(t.email);
    const idC = await idPorEmail(c.email);

    const paginas = [
      [request, '/'], [request, '/login'], [request, '/cadastrar'],
      [c.ctx.request, '/homeContratante'], [c.ctx.request, '/bicos/novo'], [c.ctx.request, '/bicos/ativos'],
      [c.ctx.request, '/carteira/contratante'], [c.ctx.request, `/bicos/${id}/gerenciar`], [c.ctx.request, '/perfil'],
      [t.ctx.request, '/hometrabalhador'], [t.ctx.request, '/historico'], [t.ctx.request, '/carteira/trabalhador'],
      [t.ctx.request, `/bicos/${id}`], [t.ctx.request, '/perfil'],
      [t.ctx.request, `/perfil/publico/${idT}`], [t.ctx.request, `/perfil/publico/${idC}`]
    ];
    for (const [cliente, rota] of paginas) {
      const html = await (await cliente.get(`${BASE}${rota}`)).text();
      expect(html, rota).not.toMatch(/verificad|validad|taxa de resposta|perfil verificado|ativo &amp; seguro/i);
    }
    await c.ctx.close();
    await t.ctx.close();
  });

  test('perfil privado do trabalhador mostra os números reais e o link "Ver como os outros veem meu perfil"', async ({ browser }) => {
    const c = await criarConta(browser, 'contratante', 'priv_c');
    const t = await criarConta(browser, 'trabalhador', 'priv_t');
    await adicionarSaldo(c.ctx, 500);
    const id = await bicoAceito(c, t, 'Priv bico');
    await finalizar(c, id);
    await avaliar(c.ctx, id, 5, 'Ótimo');
    const idT = await idPorEmail(t.email);

    const page = await t.ctx.newPage();
    await page.goto(`${BASE}/perfil`, { waitUntil: 'domcontentloaded' });
    const stats = page.locator('.pt-stats');
    await expect(stats).toContainText('Bicos concluídos');
    await expect(stats.locator('.pt-stat', { hasText: 'Bicos concluídos' }).locator('.pt-stat-valor')).toHaveText('1');
    await expect(stats.locator('.pt-stat', { hasText: 'Avaliação média' })).toContainText('5,0');
    await expect(stats.locator('.pt-stat', { hasText: 'Avaliação média' })).toContainText('1 avaliação');
    await expect(stats.locator('.pt-stat', { hasText: 'Membro desde' })).toContainText(/\S+ de \d{4}/);
    await expect(page.locator('#link-perfil-publico')).toHaveAttribute('href', `/perfil/publico/${idT}`);
    await expect(page.locator('body')).not.toContainText(/Perfil Verificado|Documento de Identidade|Telefone cadastrado|Confirmado|Taxa de resposta|Ativo & Seguro/);

    // Perfil privado do contratante: números reais e o mesmo link.
    const pc = await c.ctx.newPage();
    await pc.goto(`${BASE}/perfil`, { waitUntil: 'domcontentloaded' });
    await expect(pc.locator('.stat', { hasText: 'Bicos concluídos' }).locator('.stat-valor')).toHaveText('1');
    await expect(pc.locator('#link-perfil-publico')).toHaveAttribute('href', `/perfil/publico/${await idPorEmail(c.email)}`);
    await page.close();
    await pc.close();
    await c.ctx.close();
    await t.ctx.close();
  });
});

test.describe('Identidade visual do perfil público', () => {
  test('tema e mascote acompanham o perfil exibido (verde/araponga, grafite-vinho/tiê), com o menu de quem vê', async ({ browser }) => {
    const c = await criarConta(browser, 'contratante', 'tema_c');
    const t = await criarConta(browser, 'trabalhador', 'tema_t');
    const idC = await idPorEmail(c.email);
    const idT = await idPorEmail(t.email);

    // Trabalhador olhando um contratante: tema verde + araponga parada; menu de trabalhador.
    const p1 = await t.ctx.newPage();
    await p1.goto(`${BASE}/perfil/publico/${idC}`, { waitUntil: 'domcontentloaded' });
    await expect(p1.locator('body')).toHaveClass(/tema-contratante/);
    await expect(p1.locator('.perfil-mascote .mascote.araponga')).toBeVisible();
    await expect(p1.locator('.perfil-mascote .mascote.tie')).toHaveCount(0);
    await expect(p1.locator('header.navbar')).toBeVisible();
    expect(await p1.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(242, 235, 223)'); // creme
    expect(await p1.locator('.worker-card').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(20, 51, 43)'); // verde-escuro
    expect(await p1.locator('body').evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Inter/);
    // O mascote fica parado: sem animação e sem piscar automático.
    expect(await p1.locator('.perfil-mascote .mascote, .perfil-mascote .mascote *').evaluateAll((els) => els.filter((e) => getComputedStyle(e).animationName !== 'none').length)).toBe(0);
    await expect(p1.locator('.perfil-mascote .mascote')).not.toHaveAttribute('data-pisca', /.*/);
    await p1.close();

    // Contratante olhando um trabalhador: tema grafite/vinho + tiê; menu lateral do contratante.
    const p2 = await c.ctx.newPage();
    await p2.goto(`${BASE}/perfil/publico/${idT}`, { waitUntil: 'domcontentloaded' });
    await expect(p2.locator('body')).toHaveClass(/tema-trabalhador/);
    await expect(p2.locator('.perfil-mascote .mascote.tie')).toBeVisible();
    await expect(p2.locator('.perfil-mascote .mascote.araponga')).toHaveCount(0);
    await expect(p2.locator('.contractor-sidebar')).toBeVisible();
    expect(await p2.locator('.worker-card').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(33, 27, 28)'); // grafite
    expect(await p2.locator('.worker-avatar').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(139, 26, 43)'); // vinho
    await p2.close();
    await c.ctx.close();
    await t.ctx.close();
  });
});

test.describe('Textos fictícios removidos', () => {
  test('login sem Google/LinkedIn; cadastro e publicar bico com textos fiéis ao sistema', async ({ browser, request }) => {
    const login = await (await request.get(`${BASE}/login`)).text();
    expect(login).not.toMatch(/Google|LinkedIn|Ou entre com/);

    const cadastro = await (await request.get(`${BASE}/cadastrar`)).text();
    expect(cadastro).not.toMatch(/milhares|mais confiável/i);
    expect(cadastro).toContain('Conecte quem precisa de um serviço rápido a quem sabe fazer, perto de você.');

    const c = await criarConta(browser, 'contratante', 'txt_c');
    const publicar = await (await c.ctx.request.get(`${BASE}/bicos/novo`)).text();
    expect(publicar).not.toMatch(/Pagamento garantido|Segurança Ibico|Verificado|Alcance Local|propostas por hora|propostas\/hora/);
    expect(publicar).toContain('O valor fica reservado na sua carteira simulada quando você aceita um candidato.');
    await c.ctx.close();
  });

  test('perfis privados: sem bolinha online, bio padrão nem lista "Ativo"; "Membro recente" só com menos de 30 dias', async ({ browser }) => {
    const t = await criarConta(browser, 'trabalhador', 'txt_t');
    const c = await criarConta(browser, 'contratante', 'txt_pc');

    const ht = await (await t.ctx.request.get(`${BASE}/perfil`)).text();
    expect(ht).not.toMatch(/pt-avatar-status|title="Online"|Disponível para pequenos reparos, montagens/);
    expect(ht).toContain('Membro recente'); // cadastrado agora
    expect(ht).toContain('Alterar senha');
    const hc = await (await c.ctx.request.get(`${BASE}/perfil`)).text();
    expect(hc).not.toMatch(/avatar-status|Conta ativa|Conta e segurança|Dados pessoais cadastrados|Perfil de contratante/);
    expect(hc).toContain('Conta Ibico');
    expect(hc).toContain('Cadastrado');
    expect(hc).toContain('Alterar senha');

    // Cadastro com mais de 30 dias: a tag some.
    await consultarBanco('UPDATE usuarios SET criado_em = DATE_SUB(NOW(), INTERVAL 40 DAY) WHERE email = ?', [t.email]);
    expect(await (await t.ctx.request.get(`${BASE}/perfil`)).text()).not.toContain('Membro recente');
    await t.ctx.close();
    await c.ctx.close();
  });
});
