// Roteiro de testes: CT05 (publicar bico válido e inválido) e CT06 (adicionar saldo simulado).
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, formulario, sufixoUnico, dataFutura,
  lerSaldoContratante, adicionarSaldo
} from '../support/cenario.js';

const dataBR = (iso) => iso.split('-').reverse().join('/');

test.describe('CT05 – Publicar bico válido e inválido', () => {
  let contratante;

  test.beforeAll(async ({ browser }) => {
    contratante = await criarConta(browser, 'contratante', 'ct05');
  });

  test.afterAll(async () => {
    await contratante.ctx.close();
  });

  test('bico válido, publicado pela tela, aparece em Bicos ativos como Aberto com os dados certos', async () => {
    const titulo = `Pintura CT05 ${sufixoUnico()}`;
    const data = dataFutura(5);
    const page = await contratante.ctx.newPage();

    await page.goto(`${BASE}/bicos/novo`);
    await page.locator('input[name="titulo"]').fill(titulo);
    await page.locator('textarea[name="descricao"]').fill('Pintar a parede da sala, com tinta fornecida.');
    await page.locator('input[name="valor"]').fill('275.50');
    await page.locator('input[name="bairro"]').fill('Pinheiros');
    await page.locator('input[name="data_servico"]').fill(data);
    await page.locator('input[name="horario"]').fill('14:30');
    await page.getByRole('button', { name: /Publicar Vaga/i }).click();

    await expect(page).toHaveURL(`${BASE}/homeContratante`);

    await page.goto(`${BASE}/bicos/ativos`);
    const cartao = page.locator('article', { hasText: titulo });
    await expect(cartao).toHaveCount(1);
    await expect(cartao).toContainText('Aberto');
    await expect(cartao).toContainText('Pinheiros');
    await expect(cartao).toContainText(dataBR(data));
    await expect(cartao).toContainText('14:30');
    await expect(cartao).toContainText('275,50');
    await page.close();
  });

  test('bico inválido (título curto, descrição curta, bairro curto, valor 0, valor negativo, horário inválido) é recusado e não é criado', async () => {
    const sufixo = sufixoUnico();
    const base = {
      titulo: `Invalido CT05 ${sufixo}`,
      descricao: 'Descrição com tamanho suficiente.',
      valor: '100.00',
      bairro: 'Centro',
      data_servico: dataFutura(),
      horario: '10:00'
    };

    const casos = [
      { descricao: 'título curto', alterar: { titulo: 'ab' }, mensagem: 'O título deve ter entre 3 e 100 caracteres.' },
      { descricao: 'descrição curta', alterar: { descricao: 'curta' }, mensagem: 'A descrição deve ter entre 10 e 500 caracteres.' },
      { descricao: 'bairro curto', alterar: { bairro: 'x' }, mensagem: 'O bairro deve ter entre 2 e 100 caracteres.' },
      { descricao: 'sem data', alterar: { data_servico: '' }, mensagem: 'Informe a data do serviço.' },
      { descricao: 'horário inválido', alterar: { horario: '25:99' }, mensagem: 'Informe o horário do serviço.' },
      { descricao: 'valor 0', alterar: { valor: '0' }, mensagem: 'Informe um valor maior que zero' },
      { descricao: 'valor negativo', alterar: { valor: '-5' }, mensagem: 'Informe um valor maior que zero' }
    ];

    const contarBicos = async () => ((await (await contratante.ctx.request.get(BASE + '/bicos/ativos')).text()).match(/\/gerenciar/g) || []).length;
    const antes = await contarBicos();

    for (const { descricao, alterar, mensagem } of casos) {
      const resposta = await contratante.ctx.request.post(`${BASE}/bicos/novo`, formulario({ ...base, ...alterar }));
      expect(resposta.status(), descricao).toBe(400);
      expect(await resposta.text(), descricao).toContain(mensagem);
    }

    // Nada foi criado: a quantidade de bicos ativos não mudou e o título único não aparece.
    expect(await contarBicos()).toBe(antes);
    const ativos = await (await contratante.ctx.request.get(`${BASE}/bicos/ativos`)).text();
    expect(ativos).not.toContain(base.titulo);
  });

  test('bico inválido pela tela mostra a mensagem de erro na própria página', async () => {
    const page = await contratante.ctx.newPage();
    await page.goto(`${BASE}/bicos/novo`);
    await page.locator('input[name="titulo"]').fill('ab');
    await page.locator('textarea[name="descricao"]').fill('Descrição com tamanho suficiente.');
    await page.locator('input[name="valor"]').fill('100');
    await page.locator('input[name="bairro"]').fill('Centro');
    await page.locator('input[name="data_servico"]').fill(dataFutura());
    await page.locator('input[name="horario"]').fill('10:00');
    await page.getByRole('button', { name: /Publicar Vaga/i }).click();

    await expect(page.locator('#alerta-sistema')).toContainText('O título deve ter entre 3 e 100 caracteres.');
    await page.close();
  });
});

test.describe('CT06 – Adicionar saldo simulado', () => {
  test('o saldo aumenta exatamente o valor adicionado e o extrato mostra a adição', async ({ browser }) => {
    const { ctx } = await criarConta(browser, 'contratante', 'ct06');
    const page = await ctx.newPage();

    const saldoInicial = await lerSaldoContratante(ctx);
    expect(saldoInicial).toBe(0);

    await page.goto(`${BASE}/carteira/contratante`);
    await page.locator('input[name="valor"]').fill('150.00');
    await page.getByRole('button', { name: 'Adicionar Saldo' }).click();

    await expect(page).toHaveURL(`${BASE}/carteira/contratante`);
    await expect(page.locator('.wallet__balance')).toContainText('R$ 150,00');
    expect(await lerSaldoContratante(ctx)).toBe(saldoInicial + 150);

    const linha = page.locator('tr', { hasText: 'Adição de saldo simulado' });
    await expect(linha).toHaveCount(1);
    await expect(linha).toContainText('Entrada');
    await expect(linha).toContainText('Saldo adicionado');
    await expect(linha).toContainText('+ R$ 150,00');

    // Uma segunda adição soma ao saldo (não substitui) e gera uma segunda linha.
    await adicionarSaldo(ctx, 49.9);
    expect(await lerSaldoContratante(ctx)).toBeCloseTo(199.9, 2);
    await page.goto(`${BASE}/carteira/contratante`);
    await expect(page.locator('tr', { hasText: 'Adição de saldo simulado' })).toHaveCount(2);

    await ctx.close();
  });

  test('valor vazio, inválido, zero ou negativo responde 400 e não altera o saldo', async ({ browser }) => {
    const { ctx } = await criarConta(browser, 'contratante', 'ct06inv');

    for (const valor of ['', 'abc', '0', '-10', '10.999']) {
      const resposta = await ctx.request.post(`${BASE}/carteira/contratante/adicionar-saldo`, formulario({ valor }));
      expect(resposta.status(), `valor "${valor}"`).toBe(400);
    }

    expect(await lerSaldoContratante(ctx)).toBe(0);
    const html = await (await ctx.request.get(`${BASE}/carteira/contratante`)).text();
    expect(html).not.toContain('Adição de saldo simulado');
    await ctx.close();
  });
});
