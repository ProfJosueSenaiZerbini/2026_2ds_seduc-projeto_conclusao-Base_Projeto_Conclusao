// Avaliação bidirecional: o trabalhador também avalia o contratante; prazo de 7 dias; formulário
// já preenchido; perfis públicos; média nos candidatos e no feed; contador da home do contratante.
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, sufixoUnico,
  adicionarSaldo, publicarBico, candidatar, listarCandidatos, aceitar,
  consultarBanco, envelhecerFinalizacao
} from '../support/cenario.js';

const VALOR = 150;

const montarBicoEmAndamento = async (contratante, trabalhador, titulo) => {
  await adicionarSaldo(contratante.ctx, 200);
  const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
  expect((await candidatar(trabalhador.ctx, bicoId)).status()).toBe(302);
  const [candidato] = await listarCandidatos(contratante.ctx, bicoId);
  expect((await aceitar(contratante.ctx, candidato.candidaturaId)).status()).toBe(302);
  return bicoId;
};

const finalizar = (ctx, bicoId) => ctx.request.post(`${BASE}/bicos/${bicoId}/finalizar`, { failOnStatusCode: false });

const avaliar = (ctx, bicoId, campos) =>
  ctx.request.post(`${BASE}/bicos/${bicoId}/avaliacao`, { form: campos, failOnStatusCode: false });

const bicoFinalizado = async (contratante, trabalhador, rotulo) => {
  const titulo = `${rotulo} ${sufixoUnico()}`;
  const bicoId = await montarBicoEmAndamento(contratante, trabalhador, titulo);
  expect((await finalizar(contratante.ctx, bicoId)).status()).toBe(200);
  return { bicoId, titulo };
};

const dataBR = (data) => {
  const dois = (n) => String(n).padStart(2, '0');
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()}`;
};
const daquiA7Dias = () => { const d = new Date(); d.setDate(d.getDate() + 7); return dataBR(d); };

const idPorEmail = async (email) => (await consultarBanco('SELECT id FROM usuarios WHERE email = ?', [email]))[0].id;

test.describe('Avaliação bidirecional (contratante e trabalhador)', () => {
  test('o trabalhador avalia o contratante e o contratante vê a nota no perfil público', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'bi_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'bi_t');
    const { bicoId } = await bicoFinalizado(contratante, trabalhador, 'Bidirecional');

    const criada = await avaliar(trabalhador.ctx, bicoId, { nota: '5', comentario: 'Pagou em dia e foi muito educado.' });
    expect(criada.status()).toBe(200);
    expect(await criada.json()).toMatchObject({ sucesso: true, acao: 'criada', mensagem: 'Avaliação registrada.' });

    // A avaliação do contratante ao trabalhador é independente (duas avaliações no mesmo bico).
    const doContratante = await avaliar(contratante.ctx, bicoId, { nota: '3', comentario: 'Cumpriu o combinado.' });
    expect(await doContratante.json()).toMatchObject({ acao: 'criada' });
    const linhas = await consultarBanco('SELECT avaliador_id, avaliado_id, nota FROM avaliacoes WHERE bico_id = ?', [bicoId]);
    expect(linhas).toHaveLength(2);

    // Perfil público do contratante, aberto pelo próprio contratante (qualquer usuário logado pode abrir).
    const idContratante = await idPorEmail(contratante.email);
    const pagina = await contratante.ctx.newPage();
    await pagina.goto(`${BASE}/perfil/publico/${idContratante}`, { waitUntil: 'domcontentloaded' });
    await expect(pagina.locator('#perfil-tipo')).toContainText('Contratante');
    await expect(pagina.locator('h1')).toContainText(contratante.nome);
    await expect(pagina.locator('#perfil-membro-desde')).toContainText(/Membro desde \S+ de \d{4}/);
    await expect(pagina.locator('#perfil-bicos-finalizados')).toContainText('1 bico finalizado');
    await expect(pagina.locator('.rating-stars')).toHaveAttribute('aria-label', /5,0 de 5/);
    await expect(pagina.locator('body')).toContainText('1 avaliação');
    const avaliacao = pagina.locator('.review-card');
    await expect(avaliacao).toHaveCount(1);
    await expect(avaliacao).toContainText(trabalhador.nome);
    await expect(avaliacao).toContainText('Pagou em dia e foi muito educado.');
    await expect(avaliacao.locator('.review-stars[aria-label="5 de 5 estrelas"]')).toHaveCount(1);

    // Privacidade: nada de e-mail, CPF, idade ou saldo no perfil público.
    const html = await pagina.content();
    expect(html).not.toContain(contratante.email);
    expect(html).not.toMatch(/CPF|saldo|idade/i);
    await pagina.close();

    // O trabalhador também tem perfil público, com a nota que o contratante deu.
    const idTrabalhador = await idPorEmail(trabalhador.email);
    const perfilTrabalhador = await (await contratante.ctx.request.get(`${BASE}/perfil/publico/${idTrabalhador}`)).text();
    expect(perfilTrabalhador).toContain('Perfil público · Trabalhador');
    expect(perfilTrabalhador).toContain('3,0 de 5');
    expect(perfilTrabalhador).not.toContain(trabalhador.email);

    // Sem avaliações: mostra "Ainda sem avaliações". Perfil inexistente: 404.
    const novo = await criarConta(browser, 'trabalhador', 'bi_novo');
    const semNotas = await (await contratante.ctx.request.get(`${BASE}/perfil/publico/${await idPorEmail(novo.email)}`)).text();
    expect(semNotas).toContain('Ainda sem avaliações');
    const inexistente = await contratante.ctx.request.get(`${BASE}/perfil/publico/999999999`, { failOnStatusCode: false });
    expect(inexistente.status()).toBe(404);

    for (const c of [contratante, trabalhador, novo]) await c.ctx.close();
  });

  test('formulário volta preenchido (contratante e trabalhador), com "Atualizar avaliação" e o prazo', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'pre_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'pre_t');
    const { bicoId } = await bicoFinalizado(contratante, trabalhador, 'Preenchido');
    const limite = daquiA7Dias();

    // Antes de avaliar: formulário vazio, botão "Salvar avaliação" e prazo para avaliar.
    const pc = await contratante.ctx.newPage();
    await pc.goto(`${BASE}/bicos/${bicoId}/gerenciar`, { waitUntil: 'domcontentloaded' });
    await expect(pc.locator('#btn-salvar-avaliacao')).toContainText('Salvar avaliação');
    await expect(pc.locator('input[name="nota"]:checked')).toHaveCount(0);
    await expect(pc.locator('#avaliacao-prazo')).toContainText(`Você pode avaliar até ${limite}`);
    await expect(pc.locator('body')).not.toContainText('futuramente');

    // Contratante avalia pela tela e depois reabre a página: tudo carregado.
    await pc.locator('label[for="nota-4"]').click();
    await pc.locator('#comentario-avaliacao').fill('Ótimo profissional.');
    await pc.locator('#btn-salvar-avaliacao').click();
    await expect(pc.locator('#feedback-avaliacao-bico')).toContainText('Avaliação registrada.');
    await pc.goto(`${BASE}/bicos/${bicoId}/gerenciar`, { waitUntil: 'domcontentloaded' });
    await expect(pc.locator('input[name="nota"]:checked')).toHaveValue('4');
    await expect(pc.locator('#comentario-avaliacao')).toHaveValue('Ótimo profissional.');
    await expect(pc.locator('#btn-salvar-avaliacao')).toContainText('Atualizar avaliação');
    await expect(pc.locator('#avaliacao-prazo')).toContainText(`Você pode editar até ${limite}`);

    // Edita pela tela: a resposta diz "atualizada", a nota muda e continua uma só avaliação.
    await pc.locator('label[for="nota-2"]').click();
    await pc.locator('#btn-salvar-avaliacao').click();
    await expect(pc.locator('#feedback-avaliacao-bico')).toContainText('Avaliação atualizada.');
    await pc.reload();
    await expect(pc.locator('input[name="nota"]:checked')).toHaveValue('2');
    const doContratante = await consultarBanco('SELECT nota FROM avaliacoes WHERE bico_id = ? AND avaliador_id = ?', [bicoId, await idPorEmail(contratante.email)]);
    expect(doContratante).toHaveLength(1);

    // Trabalhador: mesma experiência na página de detalhes do bico (avalia o contratante).
    const pt = await trabalhador.ctx.newPage();
    await pt.goto(`${BASE}/bicos/${bicoId}`, { waitUntil: 'domcontentloaded' });
    await expect(pt.locator('#titulo-avaliacao-bico')).toContainText('Avaliar contratante');
    await pt.locator('label[for="nota-5"]').click();
    await pt.locator('#comentario-avaliacao').fill('Contratante atencioso.');
    await pt.locator('#btn-salvar-avaliacao').click();
    await expect(pt.locator('#feedback-avaliacao-bico')).toContainText('Avaliação registrada.');
    await pt.goto(`${BASE}/bicos/${bicoId}`, { waitUntil: 'domcontentloaded' });
    await expect(pt.locator('input[name="nota"]:checked')).toHaveValue('5');
    await expect(pt.locator('#comentario-avaliacao')).toHaveValue('Contratante atencioso.');
    await expect(pt.locator('#btn-salvar-avaliacao')).toContainText('Atualizar avaliação');
    await expect(pt.locator('#avaliacao-prazo')).toContainText(`Você pode editar até ${limite}`);

    // Comentário só com espaços vira NULL no banco.
    expect((await avaliar(trabalhador.ctx, bicoId, { nota: '5', comentario: '    ' })).status()).toBe(200);
    const [linha] = await consultarBanco('SELECT comentario FROM avaliacoes WHERE bico_id = ? AND avaliador_id = ?', [bicoId, await idPorEmail(trabalhador.email)]);
    expect(linha.comentario).toBeNull();

    await pc.close();
    await pt.close();
    for (const c of [contratante, trabalhador]) await c.ctx.close();
  });

  test('depois de 7 dias da finalização não cria nem edita; a tela fica só para leitura', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'pz_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'pz_t');
    const { bicoId } = await bicoFinalizado(contratante, trabalhador, 'Prazo');

    // Dentro do prazo: contratante avalia (nota 4). O trabalhador ainda não avaliou.
    expect((await avaliar(contratante.ctx, bicoId, { nota: '4', comentario: 'Antes do prazo.' })).status()).toBe(200);

    // Passam-se 8 dias desde a finalização.
    await envelhecerFinalizacao(bicoId, 8);

    const edicao = await avaliar(contratante.ctx, bicoId, { nota: '1', comentario: 'Tarde demais.' });
    expect(edicao.status()).toBe(409);
    expect((await edicao.json()).erro).toBe('O prazo de 7 dias para avaliar este bico terminou.');
    const criacao = await avaliar(trabalhador.ctx, bicoId, { nota: '5' });
    expect(criacao.status()).toBe(409);
    expect((await criacao.json()).erro).toBe('O prazo de 7 dias para avaliar este bico terminou.');

    // Nada mudou no banco.
    const linhas = await consultarBanco('SELECT nota, comentario FROM avaliacoes WHERE bico_id = ?', [bicoId]);
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ nota: 4, comentario: 'Antes do prazo.' });

    // Contratante: avaliação só para leitura, sem formulário nem botão.
    const pc = await contratante.ctx.newPage();
    await pc.goto(`${BASE}/bicos/${bicoId}/gerenciar`, { waitUntil: 'domcontentloaded' });
    await expect(pc.locator('#avaliacao-somente-leitura')).toContainText('Antes do prazo.');
    await expect(pc.locator('#avaliacao-somente-leitura [aria-label="Sua nota: 4 de 5 estrelas"]')).toHaveCount(1);
    await expect(pc.locator('#form-avaliacao-bico')).toHaveCount(0);
    await expect(pc.locator('#btn-salvar-avaliacao')).toHaveCount(0);
    await expect(pc.locator('#avaliacao-prazo')).toContainText('O prazo para avaliar terminou em');

    // Trabalhador que não avaliou: também sem formulário.
    const pt = await trabalhador.ctx.newPage();
    await pt.goto(`${BASE}/bicos/${bicoId}`, { waitUntil: 'domcontentloaded' });
    await expect(pt.locator('#form-avaliacao-bico')).toHaveCount(0);
    await expect(pt.locator('#avaliacao-somente-leitura')).toContainText('não avaliou este bico dentro do prazo');
    await pc.close();
    await pt.close();
    for (const c of [contratante, trabalhador]) await c.ctx.close();
  });

  test('candidato mostra média e link do perfil; feed e detalhes mostram a nota do contratante', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'fd_c');
    const avaliado = await criarConta(browser, 'trabalhador', 'fd_a');
    const semNota = await criarConta(browser, 'trabalhador', 'fd_s');
    const { bicoId } = await bicoFinalizado(contratante, avaliado, 'Feed base');
    expect((await avaliar(contratante.ctx, bicoId, { nota: '4' })).status()).toBe(200);
    expect((await avaliar(avaliado.ctx, bicoId, { nota: '5', comentario: 'Excelente contratante.' })).status()).toBe(200);
    const idAvaliado = await idPorEmail(avaliado.email);
    const idContratante = await idPorEmail(contratante.email);

    // Novo bico aberto com dois candidatos: um avaliado (4,0) e um sem avaliações.
    const tituloNovo = `Feed novo ${sufixoUnico()}`;
    const novoId = await publicarBico(contratante.ctx, tituloNovo, VALOR);
    expect((await candidatar(avaliado.ctx, novoId)).status()).toBe(302);
    expect((await candidatar(semNota.ctx, novoId)).status()).toBe(302);

    const pc = await contratante.ctx.newPage();
    await pc.goto(`${BASE}/bicos/${novoId}/gerenciar`, { waitUntil: 'domcontentloaded' });
    const cartaoAvaliado = pc.locator('.candidate-card', { hasText: avaliado.nome });
    await expect(cartaoAvaliado.locator('.candidate-card__rating')).toContainText('★ 4,0');
    await expect(cartaoAvaliado.locator('.candidate-card__rating')).toContainText('(1 avaliação)');
    await expect(cartaoAvaliado.locator('a', { hasText: 'Ver perfil' })).toHaveAttribute('href', `/perfil/publico/${idAvaliado}`);
    const cartaoSem = pc.locator('.candidate-card', { hasText: semNota.nome });
    await expect(cartaoSem.locator('.candidate-card__rating')).toContainText('Sem avaliações');
    await expect(cartaoSem.locator('a', { hasText: 'Ver perfil' })).toHaveCount(1);

    // O contratante não vê e-mail nem idade dos candidatos (contato pelo chat; dados no perfil público).
    const listaHtml = await pc.locator('.candidate-section').innerHTML();
    expect(listaHtml).not.toContain(avaliado.email);
    expect(listaHtml).not.toContain(semNota.email);
    expect(listaHtml).not.toContain('E-mail:');
    expect(listaHtml).not.toMatch(/\d+ anos/);

    // O "Ver perfil" realmente abre o perfil público do candidato.
    await cartaoAvaliado.locator('a', { hasText: 'Ver perfil' }).click();
    await expect(pc.locator('h1')).toContainText(avaliado.nome);
    await expect(pc.locator('.rating-stars')).toHaveAttribute('aria-label', /4,0 de 5/);

    // Feed do trabalhador (outro trabalhador): contratante com ★ 5,0 e link para o perfil dele.
    const pt = await semNota.ctx.newPage();
    await pt.goto(`${BASE}/hometrabalhador`, { waitUntil: 'domcontentloaded' });
    const card = pt.locator('.job-card', { hasText: tituloNovo });
    await expect(card.locator('.job-contratante__nota')).toContainText('★ 5,0 (1)');
    await expect(card.locator('.job-contratante a')).toHaveAttribute('href', `/perfil/publico/${idContratante}`);

    // Detalhes do bico: contratante com nota e link.
    await pt.goto(`${BASE}/bicos/${novoId}`, { waitUntil: 'domcontentloaded' });
    await expect(pt.locator('.contratante-nota')).toContainText('★ 5,0');
    await expect(pt.locator('.contratante-nota')).toContainText('(1 avaliação)');
    await expect(pt.locator('.contratante-nota__link')).toHaveAttribute('href', `/perfil/publico/${idContratante}`);

    // Histórico (card do bico concluído) mostra a nota do cliente com link.
    const ph = await avaliado.ctx.newPage();
    await ph.goto(`${BASE}/historico`, { waitUntil: 'domcontentloaded' });
    const cliente = ph.locator('#concluidos .meta', { hasText: 'Cliente' }).first();
    await expect(cliente.locator('.meta__star')).toContainText('5,0');
    await expect(cliente.locator('a.meta__link')).toHaveAttribute('href', `/perfil/publico/${idContratante}`);

    for (const p of [pc, pt, ph]) await p.close();
    for (const c of [contratante, avaliado, semNota]) await c.ctx.close();
  });

  test('"Aguardando sua avaliação" conta só bicos finalizados sem avaliação deste usuário e dentro do prazo', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'hm_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'hm_t');
    const contagem = async () => {
      const html = await (await contratante.ctx.request.get(`${BASE}/homeContratante`)).text();
      return Number(/id="valor-para-avaliar">\s*(\d+)/.exec(html)?.[1]);
    };

    expect(await contagem()).toBe(0);

    // Bico finalizado e ainda sem avaliação conta 1 (o bico aberto não conta).
    await publicarBico(contratante.ctx, `Home aberto ${sufixoUnico()}`, VALOR);
    const a = await bicoFinalizado(contratante, trabalhador, 'Home A');
    expect(await contagem()).toBe(1);

    // Avaliar tira o bico da contagem.
    expect((await avaliar(contratante.ctx, a.bicoId, { nota: '5' })).status()).toBe(200);
    expect(await contagem()).toBe(0);

    // Segundo bico finalizado conta; se o prazo vence sem avaliar, deixa de contar.
    const b = await bicoFinalizado(contratante, trabalhador, 'Home B');
    expect(await contagem()).toBe(1);
    await envelhecerFinalizacao(b.bicoId, 8);
    expect(await contagem()).toBe(0);

    // A avaliação do trabalhador ao contratante não consome a pendência do contratante.
    const c = await bicoFinalizado(contratante, trabalhador, 'Home C');
    expect((await avaliar(trabalhador.ctx, c.bicoId, { nota: '5' })).status()).toBe(200);
    expect(await contagem()).toBe(1);

    for (const x of [contratante, trabalhador]) await x.ctx.close();
  });
});
