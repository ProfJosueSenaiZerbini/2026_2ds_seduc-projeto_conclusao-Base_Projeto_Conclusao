// Roteiro de testes: CT07 (candidatura e duplicada), CT08 (aceitar com saldo), CT09 (aceitar sem saldo)
// e CT11 (cancelar candidatura).
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, sufixoUnico, formulario,
  adicionarSaldo, publicarBico, candidatar, listarCandidatos, aceitar,
  lerSaldoContratante, statusDaMinhaCandidatura, statusDoBico
} from '../support/cenario.js';

const VALOR = 150;

test.describe('Candidaturas e reserva de saldo', () => {
  let contratante;
  let trabalhadorA;
  let trabalhadorB;

  test.beforeAll(async ({ browser }) => {
    contratante = await criarConta(browser, 'contratante', 'cand_contr');
    trabalhadorA = await criarConta(browser, 'trabalhador', 'cand_trabA');
    trabalhadorB = await criarConta(browser, 'trabalhador', 'cand_trabB');
  });

  test.afterAll(async () => {
    await contratante.ctx.close();
    await trabalhadorA.ctx.close();
    await trabalhadorB.ctx.close();
  });

  test('CT07: candidatura Pendente aparece para o trabalhador e o contratante; a segunda é recusada', async () => {
    const titulo = `Candidatura CT07 ${sufixoUnico()}`;
    const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);

    const primeira = await candidatar(trabalhadorA.ctx, bicoId, 'Posso fazer amanhã.');
    expect(primeira.status()).toBe(302);
    expect(primeira.headers().location).toBe('/hometrabalhador');

    // Trabalhador: status na página do bico e card na aba "Pendentes" do histórico.
    expect(await statusDaMinhaCandidatura(trabalhadorA.ctx, bicoId)).toBe('Pendente');
    const pagina = await trabalhadorA.ctx.newPage();
    await pagina.goto(`${BASE}/historico`);
    await expect(pagina.locator('#pendentes')).toContainText(titulo);
    await expect(pagina.locator('#aceitos')).not.toContainText(titulo);
    await pagina.close();

    // Contratante: um candidato, com o nome do trabalhador e status Pendente.
    const candidatos = await listarCandidatos(contratante.ctx, bicoId);
    expect(candidatos).toHaveLength(1);
    expect(candidatos[0]).toMatchObject({ nome: trabalhadorA.nome, status: 'Pendente' });

    // Segunda candidatura do mesmo trabalhador ao mesmo bico.
    const segunda = await candidatar(trabalhadorA.ctx, bicoId);
    expect(segunda.status()).toBe(400);
    expect(await segunda.text()).toContain('Você já se candidatou a este bico!');
    expect(await listarCandidatos(contratante.ctx, bicoId), 'continua uma só candidatura').toHaveLength(1);
  });

  test('CT07: contratante não pode se candidatar (403)', async () => {
    const bicoId = await publicarBico(contratante.ctx, `Candidatura CT07 contratante ${sufixoUnico()}`, VALOR);
    const resposta = await candidatar(contratante.ctx, bicoId);
    expect(resposta.status()).toBe(403);
  });

  test('CT08: aceitar com saldo suficiente reserva o valor, deixa o bico Em andamento e recusa as demais', async () => {
    const titulo = `Aceite CT08 ${sufixoUnico()}`;
    await adicionarSaldo(contratante.ctx, 300);
    const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhadorA.ctx, bicoId)).status()).toBe(302);
    expect((await candidatar(trabalhadorB.ctx, bicoId)).status()).toBe(302);

    const candidatos = await listarCandidatos(contratante.ctx, bicoId);
    expect(candidatos.map((c) => c.status)).toEqual(['Pendente', 'Pendente']);
    const daA = candidatos.find((c) => c.nome === trabalhadorA.nome);
    expect(daA?.candidaturaId).toBeTruthy();

    const saldoAntes = await lerSaldoContratante(contratante.ctx);
    const resposta = await aceitar(contratante.ctx, daA.candidaturaId);
    expect(resposta.status()).toBe(302);
    expect(resposta.headers().location).toBe(`/bicos/${bicoId}/gerenciar`);

    // Saldo diminui exatamente o valor do bico.
    expect(await lerSaldoContratante(contratante.ctx)).toBe(saldoAntes - VALOR);

    // Extrato: "Reserva – <título>", como Saída de R$ 150,00.
    const pagina = await contratante.ctx.newPage();
    await pagina.goto(`${BASE}/carteira/contratante`);
    const linha = pagina.locator('tr', { hasText: `Reserva – ${titulo}` });
    await expect(linha).toHaveCount(1);
    await expect(linha).toContainText('Saída');
    await expect(linha).toContainText('Valor reservado');
    await expect(linha).toContainText('- R$ 150,00');

    // Bico Em andamento (tela de gerenciar e lista de ativos).
    await pagina.goto(`${BASE}/bicos/${bicoId}/gerenciar`);
    await expect(pagina.locator('#status-bico')).toContainText('Em andamento');
    await pagina.goto(`${BASE}/bicos/ativos`);
    await expect(pagina.locator('article', { hasText: titulo })).toContainText('Em andamento');
    await pagina.close();

    // Candidato aceito fica Aceito; o outro, que estava Pendente, fica Recusado.
    expect(await statusDaMinhaCandidatura(trabalhadorA.ctx, bicoId)).toBe('Aceito');
    expect(await statusDaMinhaCandidatura(trabalhadorB.ctx, bicoId)).toBe('Recusado');
    const depois = await listarCandidatos(contratante.ctx, bicoId);
    expect(depois.find((c) => c.nome === trabalhadorA.nome).status).toBe('Aceito');
    expect(depois.find((c) => c.nome === trabalhadorB.nome).status).toBe('Recusado');

    // O bico em andamento não aparece mais para novas candidaturas.
    const paginaB = await trabalhadorB.ctx.newPage();
    await paginaB.goto(`${BASE}/historico`);
    await expect(paginaB.locator('#recusados')).toContainText(titulo);
    await expect(paginaB.locator('#pendentes')).not.toContainText(titulo);
    await paginaB.close();
  });

  test('CT09: aceitar sem saldo suficiente é bloqueado e nada muda', async ({ browser }) => {
    const pobre = await criarConta(browser, 'contratante', 'cand_pobre');
    const titulo = `Sem saldo CT09 ${sufixoUnico()}`;

    await adicionarSaldo(pobre.ctx, 100); // menor que o valor do bico (150)
    const bicoId = await publicarBico(pobre.ctx, titulo, VALOR);
    expect((await candidatar(trabalhadorA.ctx, bicoId)).status()).toBe(302);
    expect((await candidatar(trabalhadorB.ctx, bicoId)).status()).toBe(302);

    const candidatos = await listarCandidatos(pobre.ctx, bicoId);
    const saldoAntes = await lerSaldoContratante(pobre.ctx);
    expect(saldoAntes).toBe(100);

    const resposta = await aceitar(pobre.ctx, candidatos[0].candidaturaId);
    expect(resposta.status()).toBe(400);
    expect(await resposta.text()).toContain('Saldo insuficiente. Adicione saldo à sua carteira para aceitar este trabalhador.');

    // Saldo, status do bico e candidaturas continuam como estavam.
    expect(await lerSaldoContratante(pobre.ctx)).toBe(saldoAntes);
    expect(await statusDoBico(pobre.ctx, bicoId)).toBe('Aberto');
    expect((await listarCandidatos(pobre.ctx, bicoId)).map((c) => c.status)).toEqual(['Pendente', 'Pendente']);
    expect(await statusDaMinhaCandidatura(trabalhadorA.ctx, bicoId)).toBe('Pendente');
    expect(await statusDaMinhaCandidatura(trabalhadorB.ctx, bicoId)).toBe('Pendente');

    const extrato = await (await pobre.ctx.request.get(`${BASE}/carteira/contratante`)).text();
    expect(extrato).not.toContain(`Reserva – ${titulo}`);
    await pobre.ctx.close();
  });

  test('CT11: trabalhador cancela candidatura Pendente pela tela e ela fica Cancelado', async () => {
    const titulo = `Cancelar candidatura CT11 ${sufixoUnico()}`;
    const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhadorA.ctx, bicoId)).status()).toBe(302);
    expect(await statusDaMinhaCandidatura(trabalhadorA.ctx, bicoId)).toBe('Pendente');

    const pagina = await trabalhadorA.ctx.newPage();
    await pagina.goto(`${BASE}/bicos/${bicoId}`);
    await pagina.locator('#abrir-modal-cancelar').click();
    await pagina.getByRole('button', { name: 'Confirmar cancelamento' }).click();
    await expect(pagina).toHaveURL(`${BASE}/bicos/${bicoId}`);
    await expect(pagina.locator('.candidatura-status__value')).toContainText('Cancelado');

    expect(await statusDaMinhaCandidatura(trabalhadorA.ctx, bicoId)).toBe('Cancelado');
    expect((await listarCandidatos(contratante.ctx, bicoId))[0].status).toBe('Cancelado');

    await pagina.goto(`${BASE}/historico`);
    await expect(pagina.locator('#cancelados')).toContainText(titulo);
    await expect(pagina.locator('#pendentes')).not.toContainText(titulo);
    await pagina.close();

    // Candidatura cancelada não pode ser cancelada de novo nem refeita.
    const repetido = await trabalhadorA.ctx.request.post(`${BASE}/bicos/candidaturas/cancelar`, formulario({ bico_id: String(bicoId) }));
    expect(repetido.status()).toBe(400);
    expect((await candidatar(trabalhadorA.ctx, bicoId)).status()).toBe(400);
  });

  test('CT11: cancelar candidatura Aceita é recusado e ela continua Aceito', async () => {
    const titulo = `Cancelar aceita CT11 ${sufixoUnico()}`;
    await adicionarSaldo(contratante.ctx, 200);
    const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhadorB.ctx, bicoId)).status()).toBe(302);
    const [candidato] = await listarCandidatos(contratante.ctx, bicoId);
    expect((await aceitar(contratante.ctx, candidato.candidaturaId)).status()).toBe(302);
    expect(await statusDaMinhaCandidatura(trabalhadorB.ctx, bicoId)).toBe('Aceito');

    const resposta = await trabalhadorB.ctx.request.post(`${BASE}/bicos/candidaturas/cancelar`, formulario({ bico_id: String(bicoId) }));
    expect(resposta.status()).toBe(400);
    expect(await resposta.text()).toContain('Candidatura não encontrada ou não pode mais ser cancelada.');

    expect(await statusDaMinhaCandidatura(trabalhadorB.ctx, bicoId)).toBe('Aceito');
    expect(await statusDoBico(contratante.ctx, bicoId)).toBe('Em andamento');
  });
});
