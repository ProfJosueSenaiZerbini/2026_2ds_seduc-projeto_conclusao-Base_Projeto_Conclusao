// Fluxo completo navegando SÓ POR CLIQUES (sem page.goto para URLs internas depois do login), saldo do
// menu lateral, alerta de saldo insuficiente e abas do painel de bicos do contratante.
import { test, expect } from '@playwright/test';
import {
  BASE, criarConta, sufixoUnico, dataFutura, formulario,
  adicionarSaldo, publicarBico, candidatar, listarCandidatos, aceitar, consultarBanco, envelhecerFinalizacao,
  preencherEnderecoNaTela
} from '../support/cenario.js';

const VALOR = 150;

// Único goto permitido: a tela de login. Depois disso, tudo é clique.
const entrarPelaTela = async (page, email, tipoPerfil) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator(tipoPerfil === 'contratante' ? '#btnHire' : '#btnWork').click();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="senha"]').fill('123456');
  await page.locator('#submitBtn').click();
  await page.waitForURL(tipoPerfil === 'contratante' ? /\/homeContratante$/ : /\/hometrabalhador$/);
};

const saldoDoMenu = (page) => page.locator('.sidebar-balance strong');
const irPara = (page, titulo) => page.locator(`a[title="${titulo}"]`).first().click();

test.describe('Fluxo completo por cliques', () => {
  test('publicar → candidatar → aceitar → finalizar → avaliar (os dois lados), só clicando', async ({ browser }) => {
    test.setTimeout(90000); // fluxo longo: dois navegadores e dezenas de cliques
    const contratante = await criarConta(browser, 'contratante', 'cl_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'cl_t');
    const titulo = `Fluxo cliques ${sufixoUnico()}`;

    const pc = await contratante.ctx.newPage();
    const pt = await trabalhador.ctx.newPage();
    await entrarPelaTela(pc, contratante.email, 'contratante');
    await entrarPelaTela(pt, trabalhador.email, 'trabalhador');

    // Contratante adiciona saldo pela carteira e o menu lateral acompanha.
    await expect(saldoDoMenu(pc)).toContainText('0,00');
    await irPara(pc, 'Carteira');
    await expect(pc).toHaveURL(/\/carteira\/contratante$/);
    await pc.locator('input[name="valor"]').fill('300');
    await pc.getByRole('button', { name: 'Adicionar Saldo' }).click();
    await expect(saldoDoMenu(pc)).toContainText('300,00');

    // Publica o bico.
    await irPara(pc, 'Publicar Bico');
    await pc.locator('input[name="titulo"]').fill(titulo);
    await pc.locator('textarea[name="descricao"]').fill('Bico criado pelo teste que navega só por cliques.');
    await pc.locator('input[name="valor"]').fill(String(VALOR));
    await preencherEnderecoNaTela(pc);
    await pc.locator('input[name="data_servico"]').fill(dataFutura(5));
    await pc.locator('input[name="horario"]').fill('09:00');
    await pc.getByRole('button', { name: /Publicar Vaga/i }).click();
    await expect(pc).toHaveURL(/\/homeContratante$/);

    // Trabalhador atualiza o feed pelo menu (clicando em Início), acha o bico, abre os detalhes e se candidata.
    await pt.getByRole('link', { name: 'Início' }).first().click();
    await pt.locator('#searchInput').fill(titulo);
    const cardFeed = pt.locator('.job-card', { hasText: titulo });
    await expect(cardFeed).toBeVisible();
    await cardFeed.getByRole('link', { name: /Ver detalhes/i }).click();
    await expect(pt).toHaveURL(/\/bicos\/\d+$/);
    await expect(pt.locator('.summary-card h3')).toContainText('Candidatar-se');
    await pt.locator('button.btn-accept').click();
    await expect(pt).toHaveURL(/\/hometrabalhador$/);

    // Contratante chega ao bico pelo menu "Bicos" e aceita o candidato.
    await irPara(pc, 'Bicos');
    await expect(pc).toHaveURL(/\/bicos\/ativos/);
    await pc.locator('.job-card', { hasText: titulo }).getByRole('link', { name: /Ver Detalhes/i }).click();
    await expect(pc).toHaveURL(/\/bicos\/\d+\/gerenciar$/);
    await pc.getByRole('button', { name: 'Aceitar' }).click();
    await expect(pc.locator('#status-bico')).toContainText('Em andamento');
    await expect(saldoDoMenu(pc)).toContainText('150,00'); // 300 - 150 reservados

    // Finaliza: SEM recarregar à mão, o botão Cancelar some e o formulário de avaliação aparece.
    await expect(pc.locator('#btn-cancelar-bico')).toHaveCount(1);
    await pc.locator('#btn-finalizar-bico').click();
    await pc.locator('#confirm-finalize-button').click();
    // A araponga comemora ANTES de a página recarregar (aguarda ~1,2 s).
    await expect(pc.locator('#feedback-finalizar-bico .mascote.araponga')).toBeVisible();
    await expect(pc.locator('#feedback-finalizar-bico')).toContainText('Serviço finalizado com sucesso');
    await expect(pc.locator('#status-bico')).toContainText('Finalizado');
    await expect(pc.locator('#btn-cancelar-bico')).toHaveCount(0);
    await expect(pc.locator('#btn-finalizar-bico')).toHaveCount(0);
    await expect(pc.locator('#form-avaliacao-bico')).toBeVisible();

    // Contratante volta para a home: o card "Bicos para avaliar" leva à aba Concluídos.
    await irPara(pc, 'Início');
    await expect(pc.locator('#valor-para-avaliar')).toHaveText('1');
    await pc.locator('#card-para-avaliar').click();
    await expect(pc).toHaveURL(/\/bicos\/ativos\?aba=concluidos$/);
    const seloContratante = pc.locator('.job-card', { hasText: titulo }).locator('.selo-avaliacao');
    await expect(seloContratante).toHaveText('Avaliar');
    await seloContratante.click();
    await expect(pc).toHaveURL(/\/bicos\/\d+\/gerenciar$/);

    // Contratante avalia o trabalhador.
    await pc.locator('label[for="nota-5"]').click();
    await pc.locator('#comentario-avaliacao').fill('Excelente, recomendo.');
    await pc.locator('#btn-salvar-avaliacao').click();
    await expect(pc.locator('#feedback-avaliacao-bico')).toContainText('Avaliação registrada.');
    // Comemoração da araponga com botão de som (o som vem ligado por padrão).
    await expect(pc.locator('#feedback-avaliacao-bico.sucesso-mascote .mascote.araponga')).toBeVisible();
    await expect(pc.locator('#feedback-avaliacao-bico .mascote-som')).toHaveAttribute('aria-pressed', 'true');

    // O selo na aba Concluídos vira "Avaliado ★5".
    await irPara(pc, 'Bicos');
    await pc.locator('#aba-concluidos').click();
    await expect(pc.locator('.job-card', { hasText: titulo }).locator('.selo-avaliacao--avaliado')).toHaveText('Avaliado ★5');

    // Trabalhador: o contador da home leva ao Histórico, aba Concluídos.
    await pt.getByRole('link', { name: 'Início' }).first().click();
    await expect(pt.locator('#valor-para-avaliar')).toHaveText('1');
    await pt.locator('#link-para-avaliar').click();
    await expect(pt).toHaveURL(/\/historico\?aba=concluidos$/);
    await expect(pt.locator('#tab-concluidos')).toHaveAttribute('aria-selected', 'true');
    const seloTrabalhador = pt.locator('#concluidos .selo-avaliacao');
    await expect(seloTrabalhador).toHaveText('Avaliar contratante');
    await seloTrabalhador.click();
    await expect(pt).toHaveURL(/\/bicos\/\d+$/);

    // Bico finalizado: o card lateral não se chama mais "Candidatar-se".
    await expect(pt.locator('.summary-card h3')).toHaveText('Sua participação');
    await expect(pt.locator('#titulo-avaliacao-bico')).toContainText('Avaliar contratante');
    await pt.locator('label[for="nota-4"]').click();
    await pt.locator('#comentario-avaliacao').fill('Contratante organizado.');
    await pt.locator('#btn-salvar-avaliacao').click();
    await expect(pt.locator('#feedback-avaliacao-bico')).toContainText('Avaliação registrada.');

    // Histórico do trabalhador: o selo vira "Avaliado ★4".
    await pt.getByRole('link', { name: 'Histórico' }).first().click();
    await pt.locator('#tab-concluidos').click();
    await expect(pt.locator('#concluidos .selo-avaliacao--avaliado')).toHaveText('Avaliado ★4');

    // O trabalhador recebeu o pagamento e o contratante já não tem bico para avaliar.
    await irPara(pc, 'Início');
    await expect(pc.locator('#valor-para-avaliar')).toHaveText('0');

    await pc.close();
    await pt.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });
});

test.describe('Saldo do menu lateral', () => {
  test('muda na hora ao adicionar saldo, aceitar candidato (reserva) e cancelar (estorno)', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'sd_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'sd_t');
    const titulo = `Saldo menu ${sufixoUnico()}`;

    const pc = await contratante.ctx.newPage();
    await entrarPelaTela(pc, contratante.email, 'contratante');
    await expect(saldoDoMenu(pc)).toContainText('0,00');

    // Adicionar saldo (por clique).
    await irPara(pc, 'Carteira');
    await pc.locator('input[name="valor"]').fill('250');
    await pc.getByRole('button', { name: 'Adicionar Saldo' }).click();
    await expect(saldoDoMenu(pc)).toContainText('250,00');

    // Saldo adicionado em outra aba/sessão (outro caminho) também aparece sem novo login.
    await adicionarSaldo(contratante.ctx, 50);
    await irPara(pc, 'Início');
    await expect(saldoDoMenu(pc)).toContainText('300,00');

    // Aceitar candidato: reserva de R$ 150.
    const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhador.ctx, bicoId)).status()).toBe(302);
    await irPara(pc, 'Bicos');
    await pc.locator('.job-card', { hasText: titulo }).getByRole('link', { name: /Ver Detalhes/i }).click();
    await pc.getByRole('button', { name: 'Aceitar' }).click();
    await expect(pc.locator('#status-bico')).toContainText('Em andamento');
    await expect(saldoDoMenu(pc)).toContainText('150,00');

    // Cancelar o bico em andamento: estorno devolve os R$ 150.
    await pc.locator('#btn-cancelar-bico').click();
    await pc.locator('#confirm-cancel-button').click();
    await expect(pc.locator('#status-bico')).toContainText('Cancelado');
    await expect(saldoDoMenu(pc)).toContainText('300,00');

    await pc.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });
});

test.describe('Aceitar sem saldo: alerta estilizado', () => {
  test('mostra o alerta com o botão "Adicionar saldo" e não altera nada', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'al_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'al_t');
    const titulo = `Alerta saldo ${sufixoUnico()}`;

    await adicionarSaldo(contratante.ctx, 100); // menor que o valor do bico
    const bicoId = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhador.ctx, bicoId)).status()).toBe(302);

    const pc = await contratante.ctx.newPage();
    await entrarPelaTela(pc, contratante.email, 'contratante');
    await irPara(pc, 'Bicos');
    await pc.locator('.job-card', { hasText: titulo }).getByRole('link', { name: /Ver Detalhes/i }).click();
    await expect(saldoDoMenu(pc)).toContainText('100,00');

    await pc.getByRole('button', { name: 'Aceitar' }).click();

    // Volta para a tela de gerenciamento, com alerta estilizado (não texto puro).
    await expect(pc).toHaveURL(new RegExp(`/bicos/${bicoId}/gerenciar$`));
    const alerta = pc.locator('#alerta-sistema');
    await expect(alerta).toBeVisible();
    await expect(alerta).toHaveAttribute('role', 'alert');
    // Mascote da área (araponga) em estado triste enquanto o alerta estiver na tela.
    const mascoteAlerta = alerta.locator('.mascote.araponga');
    await expect(mascoteAlerta).toBeVisible();
    await expect(mascoteAlerta).toHaveClass(/estado-triste/);
    await expect(alerta.locator('.mascote.tie')).toHaveCount(0);
    await expect(alerta.locator('#alerta-sistema-mensagem')).toHaveText('Saldo insuficiente. Adicione saldo à sua carteira para aceitar este trabalhador.');
    const botao = alerta.getByRole('link', { name: 'Adicionar saldo' });
    await expect(botao).toBeVisible();

    // Nada mudou: saldo, status do bico e candidatura.
    await expect(saldoDoMenu(pc)).toContainText('100,00');
    await expect(pc.locator('#status-bico')).toContainText('Aberto');
    expect((await listarCandidatos(contratante.ctx, bicoId)).map((c) => c.status)).toEqual(['Pendente']);
    const reservas = await consultarBanco(`SELECT id FROM movimentacoes_carteira WHERE bico_id = ? AND tipo_movimentacao = 'RESERVA'`, [bicoId]);
    expect(reservas).toHaveLength(0);

    // O alerta aparece uma vez só: ao recarregar, some.
    await pc.reload({ waitUntil: 'domcontentloaded' });
    await expect(pc.locator('#alerta-sistema')).toHaveCount(0);

    // O botão leva para a carteira; com saldo suficiente o aceite passa.
    await pc.getByRole('button', { name: 'Aceitar' }).click();
    await pc.locator('#alerta-sistema-acao').click();
    await expect(pc).toHaveURL(/\/carteira\/contratante$/);
    await pc.locator('input[name="valor"]').fill('100');
    await pc.getByRole('button', { name: 'Adicionar Saldo' }).click();
    await expect(saldoDoMenu(pc)).toContainText('200,00');
    await irPara(pc, 'Bicos');
    await pc.locator('.job-card', { hasText: titulo }).getByRole('link', { name: /Ver Detalhes/i }).click();
    await pc.getByRole('button', { name: 'Aceitar' }).click();
    await expect(pc.locator('#status-bico')).toContainText('Em andamento');
    await expect(saldoDoMenu(pc)).toContainText('50,00');

    await pc.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });

  test('candidatura já processada também volta com alerta (sem mudar nada)', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ap_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ap_t');
    await adicionarSaldo(contratante.ctx, 300);
    const bicoId = await publicarBico(contratante.ctx, `Processada ${sufixoUnico()}`, VALOR);
    expect((await candidatar(trabalhador.ctx, bicoId)).status()).toBe(302);
    const [candidato] = await listarCandidatos(contratante.ctx, bicoId);
    expect((await aceitar(contratante.ctx, candidato.candidaturaId)).status()).toBe(302);

    // Aceitar de novo: a candidatura já foi processada.
    const repetido = await aceitar(contratante.ctx, candidato.candidaturaId);
    expect(repetido.status()).toBe(302);
    expect(repetido.headers().location).toBe(`/bicos/${bicoId}/gerenciar`);
    const tela = await (await contratante.ctx.request.get(`${BASE}/bicos/${bicoId}/gerenciar`)).text();
    expect(tela).toContain('Esta candidatura já foi processada.');
    expect(tela).not.toContain('id="alerta-sistema-acao"'); // só o saldo insuficiente oferece "Adicionar saldo"

    // Regras que não dependem do bico continuam como estavam (status inválido: 400 em texto).
    const invalido = await contratante.ctx.request.post(`${BASE}/bicos/candidaturas/status`, formulario({ candidatura_id: String(candidato.candidaturaId), novo_status: 'Qualquer' }));
    expect(invalido.status()).toBe(400);
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });
});

test.describe('Abas do painel de bicos do contratante', () => {
  test('Ativos, Concluídos e Cancelados mostram os bicos certos', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ab_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ab_t');
    const sufixo = sufixoUnico();
    const t = {
      aberto: `Aba aberto ${sufixo}`,
      andamento: `Aba andamento ${sufixo}`,
      finalizado: `Aba finalizado ${sufixo}`,
      cancelAndamento: `Aba cancelado com estorno ${sufixo}`,
      cancelAberto: `Aba cancelado sem estorno ${sufixo}`
    };
    await adicionarSaldo(contratante.ctx, 1000);

    const idAberto = await publicarBico(contratante.ctx, t.aberto, VALOR);
    const aceitarNovo = async (titulo) => {
      const id = await publicarBico(contratante.ctx, titulo, VALOR);
      expect((await candidatar(trabalhador.ctx, id)).status()).toBe(302);
      const [c] = await listarCandidatos(contratante.ctx, id);
      expect((await aceitar(contratante.ctx, c.candidaturaId)).status()).toBe(302);
      return id;
    };
    const idAndamento = await aceitarNovo(t.andamento);
    const idFinalizado = await aceitarNovo(t.finalizado);
    expect((await contratante.ctx.request.post(`${BASE}/bicos/${idFinalizado}/finalizar`, { failOnStatusCode: false })).status()).toBe(200);
    const idCancelAndamento = await aceitarNovo(t.cancelAndamento);
    expect((await contratante.ctx.request.post(`${BASE}/bicos/${idCancelAndamento}/cancelar`, { form: { motivo: 'Imprevisto na obra' }, failOnStatusCode: false })).status()).toBe(200);
    const idCancelAberto = await publicarBico(contratante.ctx, t.cancelAberto, VALOR);
    expect((await contratante.ctx.request.post(`${BASE}/bicos/${idCancelAberto}/cancelar`, { form: {}, failOnStatusCode: false })).status()).toBe(200);

    const pc = await contratante.ctx.newPage();
    await entrarPelaTela(pc, contratante.email, 'contratante');
    await irPara(pc, 'Bicos');

    // Aba Ativos (padrão): só Aberto e Em andamento.
    await expect(pc.locator('#aba-ativos')).toHaveAttribute('aria-current', 'page');
    await expect(pc.locator('.job-card', { hasText: t.aberto })).toHaveCount(1);
    await expect(pc.locator('.job-card', { hasText: t.andamento })).toHaveCount(1);
    await expect(pc.locator('.job-card', { hasText: t.finalizado })).toHaveCount(0);
    await expect(pc.locator('.job-card', { hasText: 'Aba cancelado' })).toHaveCount(0);
    await expect(pc.locator('#aba-ativos .painel-abas__contagem')).toHaveText('2');
    await expect(pc.locator('#aba-concluidos .painel-abas__contagem')).toHaveText('1');
    await expect(pc.locator('#aba-cancelados .painel-abas__contagem')).toHaveText('2');

    // Aba Concluídos: finalizado, com trabalhador, data de finalização e selo "Avaliar".
    await pc.locator('#aba-concluidos').click();
    await expect(pc).toHaveURL(/\?aba=concluidos$/);
    await expect(pc.locator('.job-card')).toHaveCount(1);
    const cardConcluido = pc.locator('.job-card', { hasText: t.finalizado });
    await expect(cardConcluido).toContainText(trabalhador.nome);
    await expect(cardConcluido).toContainText(/Finalizado em \d{2}\/\d{2}\/\d{4}/);
    await expect(cardConcluido.locator('.selo-avaliacao')).toHaveText('Avaliar');
    await cardConcluido.getByRole('link', { name: /Ver Detalhes/i }).click();
    await expect(pc).toHaveURL(new RegExp(`/bicos/${idFinalizado}/gerenciar$`));
    await expect(pc.locator('#form-avaliacao-bico')).toBeVisible();

    // Aba Cancelados: data, motivo e estorno (ou ausência dele).
    await irPara(pc, 'Bicos');
    await pc.locator('#aba-cancelados').click();
    await expect(pc.locator('.job-card')).toHaveCount(2);
    const comEstorno = pc.locator('.job-card', { hasText: t.cancelAndamento });
    await expect(comEstorno).toContainText(/Cancelado em \d{2}\/\d{2}\/\d{4}/);
    await expect(comEstorno).toContainText('Motivo: Imprevisto na obra');
    await expect(comEstorno).toContainText('Estorno: R$ 150,00');
    const semEstorno = pc.locator('.job-card', { hasText: t.cancelAberto });
    await expect(semEstorno).toContainText('Motivo: Não informado');
    await expect(semEstorno).toContainText('Estorno: não houve');

    // A URL aceita ?aba=... direto, e um valor inválido cai em Ativos.
    const direto = await contratante.ctx.request.get(`${BASE}/bicos/ativos?aba=concluidos`);
    expect(await direto.text()).toContain(t.finalizado);
    const invalida = await (await contratante.ctx.request.get(`${BASE}/bicos/ativos?aba=xyz`)).text();
    expect(invalida).toContain(t.aberto);
    expect(invalida).not.toContain(t.finalizado);

    // Cancelar bico já finalizado continua bloqueado (409), sem mexer no saldo.
    const antes = (await consultarBanco('SELECT saldo_simulado FROM usuarios WHERE email = ?', [contratante.email]))[0].saldo_simulado;
    const bloqueado = await contratante.ctx.request.post(`${BASE}/bicos/${idFinalizado}/cancelar`, { form: {}, failOnStatusCode: false });
    expect(bloqueado.status()).toBe(409);
    const depois = (await consultarBanco('SELECT saldo_simulado FROM usuarios WHERE email = ?', [contratante.email]))[0].saldo_simulado;
    expect(depois).toBe(antes);

    expect([idAberto, idAndamento].length).toBe(2);
    await pc.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });

  test('o histórico do trabalhador mostra o selo e abre a aba pela URL', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'ht_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'ht_t');
    const titulo = `Selo historico ${sufixoUnico()}`;
    await adicionarSaldo(contratante.ctx, 300);
    const id = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhador.ctx, id)).status()).toBe(302);
    const [c] = await listarCandidatos(contratante.ctx, id);
    expect((await aceitar(contratante.ctx, c.candidaturaId)).status()).toBe(302);

    const pt = await trabalhador.ctx.newPage();
    await entrarPelaTela(pt, trabalhador.email, 'trabalhador');
    await pt.getByRole('link', { name: 'Histórico' }).first().click();
    // Aceitos: o card tem link para os detalhes do bico (título e "Ver detalhes").
    await expect(pt.locator('#aceitos').getByRole('link', { name: /Ver detalhes/i })).toHaveAttribute('href', `/bicos/${id}`);

    // Bico finalizado: selo "Avaliar contratante"; depois de avaliar, "Avaliado ★N".
    expect((await contratante.ctx.request.post(`${BASE}/bicos/${id}/finalizar`, { failOnStatusCode: false })).status()).toBe(200);
    await pt.reload({ waitUntil: 'domcontentloaded' });
    await pt.locator('#tab-concluidos').click();
    await expect(pt.locator('#concluidos .selo-avaliacao--avaliar')).toHaveText('Avaliar contratante');
    const avaliar = await trabalhador.ctx.request.post(`${BASE}/bicos/${id}/avaliacao`, { form: { nota: '3' }, failOnStatusCode: false });
    expect(avaliar.status()).toBe(200);
    await pt.reload({ waitUntil: 'domcontentloaded' });
    await pt.locator('#tab-concluidos').click();
    await expect(pt.locator('#concluidos .selo-avaliacao--avaliado')).toHaveText('Avaliado ★3');

    await pt.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });
});

test.describe('Selo "Prazo encerrado"', () => {
  test('bico finalizado há mais de 7 dias mostra "Prazo encerrado" nos dois painéis (sem botão de avaliar)', async ({ browser }) => {
    const contratante = await criarConta(browser, 'contratante', 'pe_c');
    const trabalhador = await criarConta(browser, 'trabalhador', 'pe_t');
    const titulo = `Prazo encerrado ${sufixoUnico()}`;
    await adicionarSaldo(contratante.ctx, 300);
    const id = await publicarBico(contratante.ctx, titulo, VALOR);
    expect((await candidatar(trabalhador.ctx, id)).status()).toBe(302);
    const [c] = await listarCandidatos(contratante.ctx, id);
    expect((await aceitar(contratante.ctx, c.candidaturaId)).status()).toBe(302);
    expect((await contratante.ctx.request.post(`${BASE}/bicos/${id}/finalizar`, { failOnStatusCode: false })).status()).toBe(200);
    await envelhecerFinalizacao(id, 8);

    // Contratante: aba Concluídos de "Meus Bicos" e home (o card não conta bico com prazo vencido).
    const pc = await contratante.ctx.newPage();
    await entrarPelaTela(pc, contratante.email, 'contratante');
    await expect(pc.locator('#valor-para-avaliar')).toHaveText('0');
    await irPara(pc, 'Bicos');
    await pc.locator('#aba-concluidos').click();
    await expect(pc.locator('.job-card', { hasText: titulo }).locator('.selo-avaliacao--encerrado')).toHaveText('Prazo encerrado');

    // Trabalhador: Histórico, aba Concluídos.
    const pt = await trabalhador.ctx.newPage();
    await entrarPelaTela(pt, trabalhador.email, 'trabalhador');
    await expect(pt.locator('#valor-para-avaliar')).toHaveText('0');
    await pt.getByRole('link', { name: 'Histórico' }).first().click();
    await pt.locator('#tab-concluidos').click();
    await expect(pt.locator('#concluidos .selo-avaliacao--encerrado')).toHaveText('Prazo encerrado');
    await expect(pt.locator('#concluidos .selo-avaliacao--avaliar')).toHaveCount(0);

    await pc.close();
    await pt.close();
    await contratante.ctx.close();
    await trabalhador.ctx.close();
  });
});
