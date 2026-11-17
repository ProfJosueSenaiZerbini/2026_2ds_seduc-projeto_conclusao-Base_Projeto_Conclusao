// Roteiro de testes: CT10 (finalizar bico), CT12 (chat) e CT13 (avaliação).
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, sufixoUnico, formulario,
  adicionarSaldo, publicarBico, candidatar, listarCandidatos, aceitar,
  lerSaldoTrabalhador, statusDoBico, consultarBanco, executarNoBanco
} from '../support/cenario.js';

const VALOR = 150;

// Monta um bico Em andamento: contratante (com saldo) + trabalhador aceito.
const montarBicoEmAndamento = async (contratante, trabalhador, titulo) => {
  await adicionarSaldo(contratante.ctx, 200);
  const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
  expect((await candidatar(trabalhador.ctx, bicoId)).status()).toBe(302);
  const [candidato] = await listarCandidatos(contratante.ctx, bicoId);
  expect((await aceitar(contratante.ctx, candidato.candidaturaId)).status()).toBe(302);
  return { bicoId, candidaturaId: candidato.candidaturaId };
};

const finalizar = (ctx, bicoId) => ctx.request.post(`${BASE}/bicos/${bicoId}/finalizar`, { failOnStatusCode: false });

const avaliar = (ctx, bicoId, campos) =>
  ctx.request.post(`${BASE}/bicos/${bicoId}/avaliacao`, { form: campos, failOnStatusCode: false });

test.describe('CT10 – Finalizar bico', () => {
  test('bico vira Finalizado, o trabalhador recebe o valor e o evento é registrado', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ct10c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ct10t');
    const titulo = `Finalizar CT10 ${sufixoUnico()}`;
    const { bicoId } = await montarBicoEmAndamento(contratante, trabalhador, titulo);

    expect(await lerSaldoTrabalhador(trabalhador.ctx)).toBe(0);

    const resposta = await finalizar(contratante.ctx, bicoId);
    expect(resposta.status()).toBe(200);
    expect(await resposta.json()).toMatchObject({ sucesso: true, status: 'Finalizado' });

    // Bico Finalizado: some de "Bicos ativos" e a tela de gerenciar mostra o novo status.
    expect(await statusDoBico(contratante.ctx, bicoId)).toBe('Finalizado');
    const ativos = await (await contratante.ctx.request.get(`${BASE}/bicos/ativos`)).text();
    expect(ativos).not.toContain(`/bicos/${bicoId}/gerenciar`);

    // Trabalhador: saldo aumenta exatamente o valor do bico e o extrato mostra o pagamento.
    expect(await lerSaldoTrabalhador(trabalhador.ctx)).toBe(VALOR);
    const pagina = await trabalhador.ctx.newPage();
    await pagina.goto(`${BASE}/carteira/trabalhador`);
    const linha = pagina.locator('#transacoes-body tr', { hasText: `Pagamento recebido – ${titulo}` });
    await expect(linha).toHaveCount(1);
    await expect(linha).toContainText('Entrada');
    await expect(linha).toContainText('Creditado');
    await expect(linha).toContainText('+ R$ 150,00');

    // O bico aparece em "Concluídos" para o trabalhador.
    await pagina.goto(`${BASE}/historico`);
    await expect(pagina.locator('#concluidos')).toContainText(titulo);
    await expect(pagina.locator('#aceitos')).not.toContainText(titulo);
    await pagina.close();

    // Nenhuma tela exibe o evento; conferimos no banco (somente leitura).
    const eventos = await consultarBanco(
      `SELECT tipo_evento, status_anterior, status_novo FROM historico_eventos_bicos WHERE bico_id = ? AND tipo_evento = 'Finalizacao'`,
      [bicoId]
    );
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ status_anterior: 'Em andamento', status_novo: 'Finalizado' });
    const creditos = await consultarBanco(
      `SELECT valor FROM movimentacoes_carteira WHERE bico_id = ? AND tipo_movimentacao = 'CREDITO'`, [bicoId]
    );
    expect(creditos).toHaveLength(1);
    expect(Number(creditos[0].valor)).toBe(VALOR);

    // Finalizar de novo é recusado e não paga duas vezes.
    const repetida = await finalizar(contratante.ctx, bicoId);
    expect(repetida.status()).toBe(409);
    expect(await lerSaldoTrabalhador(trabalhador.ctx)).toBe(VALOR);

    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });

  test('finalização bloqueada: bico Aberto, de outro contratante, inexistente e feita por trabalhador', async ({ browser }) => {
    const dono = await criarConta(browser, 'contratante', 'ct10dono');
    const outro = await criarConta(browser, 'contratante', 'ct10outro');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ct10trab');

    const bicoAberto = await publicarBico(dono.ctx, `Finalizar aberto CT10 ${sufixoUnico()}`, VALOR);
    expect((await finalizar(dono.ctx, bicoAberto)).status(), 'bico Aberto').toBe(409);
    expect(await statusDoBico(dono.ctx, bicoAberto)).toBe('Aberto');

    const titulo = `Finalizar alheio CT10 ${sufixoUnico()}`;
    const { bicoId } = await montarBicoEmAndamento(dono, trabalhador, titulo);
    expect((await finalizar(outro.ctx, bicoId)).status(), 'outro contratante').toBe(403);
    expect((await finalizar(trabalhador.ctx, bicoId)).status(), 'trabalhador').toBe(403);
    expect(await statusDoBico(dono.ctx, bicoId)).toBe('Em andamento');
    expect(await lerSaldoTrabalhador(trabalhador.ctx)).toBe(0);

    const inexistente = await finalizar(dono.ctx, 999999999);
    expect(inexistente.status()).toBe(404);
    expect((await inexistente.json()).erro).toBe('Bico não encontrado.');

    for (const c of [dono, outro, trabalhador]) await c.ctx.close();
  });
});

test.describe('CT12 – Chat entre participantes e bloqueio para terceiros', () => {
  test('contratante e trabalhador trocam mensagens; terceiros são bloqueados', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ct12c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ct12t');
    const terceiroTrabalhador = await criarConta(browser, 'trabalhador', 'ct12x');
    const terceiroContratante = await criarConta(browser, 'contratante', 'ct12y');
    const { candidaturaId } = await montarBicoEmAndamento(contratante, trabalhador, `Chat CT12 ${sufixoUnico()}`);

    const urlChat = `${BASE}/bicos/candidaturas/${candidaturaId}/chat`;
    const urlMensagens = `${urlChat}/mensagens`;
    const msgContratante = `Olá, podemos começar às 10h? ${sufixoUnico()}`;
    const msgTrabalhador = `Combinado, chego às 10h. ${sufixoUnico()}`;

    // Contratante envia; a API confirma com 201 e devolve a mensagem gravada.
    const envio1 = await contratante.ctx.request.post(urlMensagens, { form: { texto: msgContratante }, failOnStatusCode: false });
    expect(envio1.status()).toBe(201);
    expect((await envio1.json()).mensagem).toMatchObject({ texto: msgContratante, remetente_nome: contratante.nome });

    // Trabalhador vê a mensagem do contratante na tela e responde pela própria caixa de texto.
    const paginaT = await trabalhador.ctx.newPage();
    await paginaT.goto(urlChat);
    await expect(paginaT.locator('.message--recebida', { hasText: msgContratante })).toHaveCount(1);
    await paginaT.locator('#input-mensagem').fill(msgTrabalhador);
    await paginaT.locator('#btn-enviar').click();
    await expect(paginaT.locator('.message--enviada', { hasText: msgTrabalhador })).toHaveCount(1);

    // Contratante vê a resposta do trabalhador (e a própria mensagem como enviada).
    const paginaC = await contratante.ctx.newPage();
    await paginaC.goto(urlChat);
    await expect(paginaC.locator('.message--recebida', { hasText: msgTrabalhador })).toHaveCount(1);
    await expect(paginaC.locator('.message--enviada', { hasText: msgContratante })).toHaveCount(1);

    // Mensagem vazia é recusada.
    const vazia = await contratante.ctx.request.post(urlMensagens, { form: { texto: '   ' }, failOnStatusCode: false });
    expect(vazia.status()).toBe(400);

    // Terceiros (outro trabalhador e outro contratante) não abrem, não leem e não enviam.
    for (const [rotulo, terceiro] of [['trabalhador', terceiroTrabalhador], ['contratante', terceiroContratante]]) {
      const abrir = await terceiro.ctx.request.get(urlChat, { failOnStatusCode: false });
      expect(abrir.status(), `abrir (${rotulo})`).toBe(404);
      expect(await abrir.text(), `abrir (${rotulo})`).not.toContain(msgContratante);

      const ler = await terceiro.ctx.request.get(`${urlMensagens}?depoisDoId=0`, { failOnStatusCode: false });
      expect(ler.status(), `ler (${rotulo})`).toBe(404);
      expect(await ler.text(), `ler (${rotulo})`).not.toContain(msgContratante);

      const enviar = await terceiro.ctx.request.post(urlMensagens, { form: { texto: 'Intruso' }, failOnStatusCode: false });
      expect(enviar.status(), `enviar (${rotulo})`).toBe(404);
    }

    // A mensagem do intruso não foi gravada: a conversa tem só as duas mensagens dos participantes.
    const lidas = await (await contratante.ctx.request.get(`${urlMensagens}?depoisDoId=0`)).json();
    expect(lidas.mensagens.map((m) => m.texto)).toEqual([msgContratante, msgTrabalhador]);

    // Sem login, a conversa redireciona para /login.
    const anonimo = await browser.newContext();
    const semLogin = await anonimo.request.get(urlChat, { maxRedirects: 0, failOnStatusCode: false });
    expect(semLogin.status()).toBe(302);
    expect(semLogin.headers().location).toBe('/login');

    await anonimo.close();
    for (const c of [contratante, trabalhador, terceiroTrabalhador, terceiroContratante]) await c.ctx.close();
  });
});

test.describe('CT13 – Avaliação de bico finalizado', () => {
  test('a avaliação aparece no perfil público do trabalhador com a média certa', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ct13c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ct13t');

    // Dois bicos finalizados para o mesmo trabalhador: notas 5 (pela tela) e 4 (média 4,5).
    const titulo1 = `Avaliar CT13 A ${sufixoUnico()}`;
    const bico1 = await montarBicoEmAndamento(contratante, trabalhador, titulo1);
    expect((await finalizar(contratante.ctx, bico1.bicoId)).status()).toBe(200);

    const pagina = await contratante.ctx.newPage();
    await pagina.goto(`${BASE}/bicos/${bico1.bicoId}/gerenciar`);
    const idTrabalhador = /\/perfil\/publico\/(\d+)/.exec(await pagina.content())?.[1];
    expect(idTrabalhador, 'link do perfil público do trabalhador').toBeTruthy();
    await pagina.locator('label[for="nota-5"]').click();
    await pagina.locator('#comentario-avaliacao').fill('Excelente trabalho, muito pontual.');
    await pagina.locator('#btn-salvar-avaliacao').click();
    await expect(pagina.locator('#feedback-avaliacao-bico')).toContainText('Avaliação registrada.');

    const titulo2 = `Avaliar CT13 B ${sufixoUnico()}`;
    const bico2 = await montarBicoEmAndamento(contratante, trabalhador, titulo2);
    expect((await finalizar(contratante.ctx, bico2.bicoId)).status()).toBe(200);
    const resposta2 = await avaliar(contratante.ctx, bico2.bicoId, { nota: '4', comentario: 'Bom serviço.' });
    expect(resposta2.status()).toBe(200);
    expect(await resposta2.json()).toMatchObject({ sucesso: true });

    // Perfil público: média 4,5, duas avaliações, com notas e comentários.
    const publico = await contratante.ctx.newPage();
    await publico.goto(`${BASE}/perfil/publico/${idTrabalhador}`);
    await expect(publico.locator('.rating-stars')).toHaveAttribute('aria-label', /4,5 de 5/);
    await expect(publico.locator('body')).toContainText('4,5 de 5');
    await expect(publico.locator('body')).toContainText('2 avaliações');
    await expect(publico.locator('.review-comment', { hasText: 'Excelente trabalho, muito pontual.' })).toHaveCount(1);
    await expect(publico.locator('.review-comment', { hasText: 'Bom serviço.' })).toHaveCount(1);
    await expect(publico.locator('.review-stars[aria-label="5 de 5 estrelas"]')).toHaveCount(1);
    await expect(publico.locator('.review-stars[aria-label="4 de 5 estrelas"]')).toHaveCount(1);
    await expect(publico.locator('body')).toContainText(contratante.nome);

    // Avaliar de novo o mesmo bico atualiza a nota (não duplica): média passa a (2 + 4) / 2 = 3,0.
    expect((await avaliar(contratante.ctx, bico1.bicoId, { nota: '2', comentario: 'Mudei de ideia.' })).status()).toBe(200);
    await publico.reload();
    await expect(publico.locator('body')).toContainText('3,0 de 5');
    await expect(publico.locator('body')).toContainText('2 avaliações');

    await pagina.close();
    await publico.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });

  test('avaliação recusada: bico não finalizado, nota fora de 1–5, outro contratante e trabalhador', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ct13rc');
    const outro = await criarConta(browser, 'contratante', 'ct13ro');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ct13rt');
    const terceiro = await criarConta(browser, 'trabalhador', 'ct13rx');

    // Bico Em andamento (não finalizado).
    const { bicoId: emAndamento } = await montarBicoEmAndamento(contratante, trabalhador, `Avaliar andamento CT13 ${sufixoUnico()}`);
    const naoFinalizado = await avaliar(contratante.ctx, emAndamento, { nota: '5' });
    expect(naoFinalizado.status()).toBe(409);
    expect((await naoFinalizado.json()).erro).toBe('Somente bicos finalizados podem ser avaliados.');

    // Bico Aberto também não pode ser avaliado.
    const aberto = await publicarBico(contratante.ctx, `Avaliar aberto CT13 ${sufixoUnico()}`, VALOR);
    expect((await avaliar(contratante.ctx, aberto, { nota: '5' })).status()).toBe(409);

    // Bico Finalizado: notas inválidas são recusadas com a mensagem do servidor.
    expect((await finalizar(contratante.ctx, emAndamento)).status()).toBe(200);
    for (const nota of ['0', '6', '-1', 'abc', '4.5', '']) {
      const resposta = await avaliar(contratante.ctx, emAndamento, { nota });
      expect(resposta.status(), `nota "${nota}"`).toBe(400);
      expect((await resposta.json()).erro, `nota "${nota}"`).toBe('A nota deve ser um número inteiro de 1 a 5.');
    }

    // Nada foi gravado: o perfil público segue sem avaliações.
    const idTrabalhador = /\/perfil\/publico\/(\d+)/.exec(
      await (await contratante.ctx.request.get(`${BASE}/bicos/${emAndamento}/gerenciar`)).text()
    )?.[1];
    const semNotas = await (await contratante.ctx.request.get(`${BASE}/perfil/publico/${idTrabalhador}`)).text();
    expect(semNotas).toContain('Ainda sem avaliações');

    // Quem não participa do bico (outro contratante e outro trabalhador) não pode avaliar.
    expect((await avaliar(outro.ctx, emAndamento, { nota: '5' })).status()).toBe(403);
    expect((await avaliar(terceiro.ctx, emAndamento, { nota: '5' })).status()).toBe(403);
    const aindaSem = await (await contratante.ctx.request.get(`${BASE}/perfil/publico/${idTrabalhador}`)).text();
    expect(aindaSem).toContain('Ainda sem avaliações');

    // Comentário acima de 500 caracteres é recusado.
    const longo = await avaliar(contratante.ctx, emAndamento, { nota: '5', comentario: 'a'.repeat(501) });
    expect(longo.status()).toBe(400);

    for (const c of [contratante, outro, trabalhador, terceiro]) await c.ctx.close();
  });
});
