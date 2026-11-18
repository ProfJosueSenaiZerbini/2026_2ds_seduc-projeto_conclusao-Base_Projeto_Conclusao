// Roteiro de testes: CT25 (endereço do bico verificado pelo CEP) e CT26 (privacidade do endereço).
// O servidor dos testes roda com CEP_FAKE=1 (playwright.config.js): os CEPs vêm de um provedor falso em memória.
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, formulario, sufixoUnico, dataFutura, adicionarSaldo, publicarBico, candidatar,
  listarCandidatos, aceitar, consultarBanco, enderecoBico, preencherEnderecoNaTela,
  CEP_TESTE, CEP_GERAL_TESTE, CEP_INEXISTENTE_TESTE
} from '../support/cenario.js';

const preencherDadosBasicos = async (page, titulo) => {
  await page.locator('input[name="titulo"]').fill(titulo);
  await page.locator('textarea[name="descricao"]').fill('Bico criado pelo teste de endereço por CEP.');
  await page.locator('input[name="valor"]').fill('120');
  await page.locator('input[name="data_servico"]').fill(dataFutura(4));
  await page.locator('input[name="horario"]').fill('08:30');
};

const lerBicoNoBanco = async (titulo) => {
  const [bico] = await consultarBanco(
    'SELECT cep, logradouro, numero, complemento, bairro, cidade, uf FROM bicos WHERE titulo = ?', [titulo]);
  return bico;
};

test.describe('CT25 – Endereço do bico verificado pelo CEP', () => {
  let contratante;

  test.beforeAll(async ({ browser }) => {
    contratante = await criarConta(browser, 'contratante', 'ct25');
  });

  test.afterAll(async () => {
    await contratante.ctx.close();
  });

  test('CEP válido preenche rua, bairro, cidade e UF (somente leitura), foca o número e monta o resumo', async () => {
    const titulo = `Endereco CT25 ${sufixoUnico()}`;
    const page = await contratante.ctx.newPage();
    await page.goto(`${BASE}/bicos/novo`);

    const ajuda = page.getByRole('link', { name: /Não sei meu CEP/ });
    await expect(ajuda).toHaveAttribute('href', 'https://buscacepinter.correios.com.br');
    await expect(ajuda).toHaveAttribute('target', '_blank');

    await preencherDadosBasicos(page, titulo);
    await page.locator('input[name="cep"]').pressSequentially('01310100'); // a máscara coloca o traço
    await expect(page.locator('input[name="cep"]')).toHaveValue('01310-100');

    for (const [campo, valor] of [['#logradouro', 'Avenida Paulista'], ['#bairro', 'Bela Vista'], ['#cidade', 'São Paulo'], ['#uf', 'SP']]) {
      await expect(page.locator(campo)).toHaveValue(valor);
      await expect(page.locator(campo)).toHaveAttribute('readonly', '');
    }
    await expect(page.locator('#numero')).toBeFocused();

    await page.locator('#numero').fill('1578');
    await page.locator('#complemento').fill('Sala 4');
    await expect(page.locator('[data-summary="bairro"]')).toHaveText('Avenida Paulista, 1578 – Bela Vista, São Paulo/SP');

    await page.getByRole('button', { name: /Publicar Vaga/i }).click();
    await expect(page).toHaveURL(`${BASE}/homeContratante`);

    // O CEP é gravado só com os 8 dígitos; o endereço vem da consulta.
    expect(await lerBicoNoBanco(titulo)).toEqual({
      cep: '01310100', logradouro: 'Avenida Paulista', numero: '1578', complemento: 'Sala 4',
      bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP'
    });
    await page.close();
  });

  test('rua, bairro, cidade e UF enviados no formulário são ignorados: valem os da consulta do CEP', async () => {
    const titulo = `Forjado CT25 ${sufixoUnico()}`;
    await publicarBico(contratante.ctx, titulo, 150, {
      logradouro: 'Rua Inventada', bairro: 'Bairro Falso', cidade: 'Cidade Falsa', uf: 'XX', numero: 's/n'
    });

    expect(await lerBicoNoBanco(titulo)).toEqual({
      cep: '01310100', logradouro: 'Avenida Paulista', numero: 'S/N', complemento: null,
      bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP'
    });
  });

  test('CEP geral libera rua e bairro para digitar; cidade e UF continuam vindo da consulta', async () => {
    const titulo = `CEP geral CT25 ${sufixoUnico()}`;
    const page = await contratante.ctx.newPage();
    await page.goto(`${BASE}/bicos/novo`);
    await preencherDadosBasicos(page, titulo);

    await page.locator('input[name="cep"]').fill(CEP_GERAL_TESTE);
    await expect(page.locator('#cep-status')).toContainText('CEP geral de Descalvado/SP');
    await expect(page.locator('#logradouro')).not.toHaveAttribute('readonly', '');
    await expect(page.locator('#bairro')).not.toHaveAttribute('readonly', '');
    await expect(page.locator('#cidade')).toHaveValue('Descalvado');
    await expect(page.locator('#uf')).toHaveValue('SP');
    await expect(page.locator('#logradouro')).toBeFocused();

    await page.locator('#logradouro').fill('Rua XV de Novembro');
    await page.locator('#bairro').fill('Centro');
    await page.locator('#numero').fill('210');
    await page.getByRole('button', { name: /Publicar Vaga/i }).click();
    await expect(page).toHaveURL(`${BASE}/homeContratante`);

    expect(await lerBicoNoBanco(titulo)).toEqual({
      cep: '13690000', logradouro: 'Rua XV de Novembro', numero: '210', complemento: null,
      bairro: 'Centro', cidade: 'Descalvado', uf: 'SP'
    });

    // Pelas rotas: CEP geral exige rua e bairro digitados, e a cidade enviada continua sendo ignorada.
    const semBairro = await contratante.ctx.request.post(`${BASE}/bicos/novo`, formulario({
      titulo: `CEP geral sem bairro ${sufixoUnico()}`, descricao: 'Descrição com tamanho suficiente.',
      valor: '80.00', data_servico: dataFutura(), horario: '10:00',
      ...enderecoBico({ cep: CEP_GERAL_TESTE, logradouro: 'Rua Um' })
    }));
    expect(semBairro.status()).toBe(400);
    expect(await semBairro.text()).toContain('Este CEP não informa o bairro');
    await page.close();
  });

  test('CEP inexistente mostra erro amigável e o formulário não é enviado', async () => {
    const titulo = `Inexistente CT25 ${sufixoUnico()}`;
    const page = await contratante.ctx.newPage();
    await page.goto(`${BASE}/bicos/novo`);
    await preencherDadosBasicos(page, titulo);

    await page.locator('input[name="cep"]').fill(CEP_INEXISTENTE_TESTE);
    await expect(page.locator('#cep-status')).toContainText('CEP não encontrado');
    await expect(page.locator('#cep-field')).toHaveClass(/is-invalid/);
    await expect(page.locator('#logradouro')).toHaveValue('');

    await page.locator('#numero').fill('10');
    await page.getByRole('button', { name: /Publicar Vaga/i }).click();
    await expect(page).toHaveURL(`${BASE}/bicos/novo`);
    expect(await lerBicoNoBanco(titulo)).toBeUndefined();

    // Corrigindo o CEP, o erro some e o endereço é preenchido.
    await preencherEnderecoNaTela(page, { cep: CEP_TESTE });
    await expect(page.locator('#cep-field')).not.toHaveClass(/is-invalid/);
    await expect(page.locator('#logradouro')).toHaveValue('Avenida Paulista');
    await page.close();
  });

  test('erro do servidor devolve o formulário com os valores digitados', async () => {
    const resposta = await contratante.ctx.request.post(`${BASE}/bicos/novo`, formulario({
      titulo: 'Título mantido', descricao: 'Descrição mantida após o erro.', valor: '0',
      data_servico: dataFutura(), horario: '10:00', ...enderecoBico({ complemento: 'Fundos' })
    }));
    expect(resposta.status()).toBe(400);
    const html = await resposta.text();
    expect(html).toContain('Informe um valor maior que zero');
    expect(html).toContain('value="Título mantido"');
    expect(html).toContain('Descrição mantida após o erro.');
    expect(html).toContain(`value="${CEP_TESTE}"`);
    expect(html).toContain('value="1000"');
    expect(html).toContain('value="Fundos"');
  });

  test('sessão expirada: a consulta do CEP leva para /login em vez de mostrar erro', async ({ browser }) => {
    const { ctx } = await criarConta(browser, 'contratante', 'ct25sessao');
    const page = await ctx.newPage();
    await page.goto(`${BASE}/bicos/novo`);
    await ctx.clearCookies(); // a sessão deixa de valer; /api/cep redireciona para /login (HTML)
    await page.locator('input[name="cep"]').fill(CEP_TESTE);
    await expect(page).toHaveURL(`${BASE}/login`);
    await ctx.close();
  });
});

test.describe('CT25 – Rota /api/cep', () => {
  test('só o contratante logado consulta; responde 200, 404 e 400 em JSON', async ({ browser, playwright }) => {
    const contratante = await criarConta(browser, 'contratante', 'ct25api');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ct25api');

    const ok = await contratante.ctx.request.get(`${BASE}/api/cep/${CEP_TESTE}`);
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toEqual({ cep: '01310100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' });

    const inexistente = await contratante.ctx.request.get(`${BASE}/api/cep/99999999`);
    expect(inexistente.status()).toBe(404);
    expect(await inexistente.json()).toEqual({ erro: 'CEP não encontrado.' });

    const invalido = await contratante.ctx.request.get(`${BASE}/api/cep/123`);
    expect(invalido.status()).toBe(400);

    const doTrabalhador = await trabalhador.ctx.request.get(`${BASE}/api/cep/${CEP_TESTE}`, { failOnStatusCode: false });
    expect(doTrabalhador.status()).toBe(403);

    const anonimo = await playwright.request.newContext();
    const semLogin = await anonimo.get(`${BASE}/api/cep/${CEP_TESTE}`, { maxRedirects: 0, failOnStatusCode: false });
    expect(semLogin.status()).toBe(302);
    expect(semLogin.headers().location).toBe('/login');

    await anonimo.dispose();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });
});

test.describe('CT26 – Privacidade do endereço do bico', () => {
  test('endereço completo só para o dono e o trabalhador aceito; os demais veem bairro e cidade/UF', async ({ browser }) => {
    const dono = await criarConta(browser, 'contratante', 'ct26dono');
    const outroContratante = await criarConta(browser, 'contratante', 'ct26outro');
    const aceito = await criarConta(browser, 'trabalhador', 'ct26aceito');
    const recusado = await criarConta(browser, 'trabalhador', 'ct26recusado');
    const curioso = await criarConta(browser, 'trabalhador', 'ct26curioso');

    await adicionarSaldo(dono.ctx, 500);
    const bicoId = await publicarBico(dono.ctx, `Privacidade CT26 ${sufixoUnico()}`, 150, { complemento: 'Apto 71' });

    const detalhes = async (ctx) => (await ctx.request.get(`${BASE}/bicos/${bicoId}`)).text();
    const conferirPublico = (html, quem) => {
      expect(html, quem).toContain('Bela Vista – São Paulo/SP');
      expect(html, quem).not.toContain('Avenida Paulista');
      expect(html, quem).not.toContain('Apto 71');
      expect(html, quem).not.toContain('01310-100');
      expect(html, quem).not.toContain('id="endereco-completo"');
    };
    const conferirCompleto = (html, quem) => {
      expect(html, quem).toContain('id="endereco-completo"');
      expect(html, quem).toContain('Avenida Paulista, 1000 – Apto 71');
      expect(html, quem).toContain('CEP 01310-100');
    };

    // Antes do aceite: só o dono vê tudo.
    conferirCompleto(await detalhes(dono.ctx), 'dono');
    conferirPublico(await detalhes(outroContratante.ctx), 'outro contratante');
    expect((await candidatar(aceito.ctx, bicoId)).status()).toBe(302);
    expect((await candidatar(recusado.ctx, bicoId)).status()).toBe(302);
    conferirPublico(await detalhes(aceito.ctx), 'candidato pendente');

    const candidatura = (await listarCandidatos(dono.ctx, bicoId)).find((c) => c.nome === aceito.nome);
    expect((await aceitar(dono.ctx, candidatura.candidaturaId)).status()).toBe(302);

    // Depois do aceite: o trabalhador aceito passa a ver; os demais continuam só com bairro e cidade/UF.
    conferirCompleto(await detalhes(aceito.ctx), 'trabalhador aceito');
    conferirPublico(await detalhes(recusado.ctx), 'candidato recusado');
    conferirPublico(await detalhes(curioso.ctx), 'trabalhador sem candidatura');
    conferirPublico(await detalhes(outroContratante.ctx), 'outro contratante');

    for (const conta of [dono, outroContratante, aceito, recusado, curioso]) await conta.ctx.close();
  });
});
