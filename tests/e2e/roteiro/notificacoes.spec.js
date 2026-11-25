// CT28 – Notificações do trabalhador: aceite, recusa e recusa automática aparecem no sino, com aviso e som.
// Exige a tabela notificacoes_leitura (schema atual ou migrations/005_notificacoes.sql).
import { test, expect } from '@playwright/test';
import {
    BASE,
    criarConta,
    sufixoUnico,
    adicionarSaldo,
    publicarBico,
    candidatar,
    listarCandidatos,
    aceitar,
    formulario
} from '../support/cenario.js';

const recusar = (ctxContratante, candidaturaId, observacao) =>
    ctxContratante.request.post(
        `${BASE}/bicos/candidaturas/status`,
        formulario({ candidatura_id: String(candidaturaId), novo_status: 'Recusado', observacao })
    );

// Página do trabalhador com consulta rápida (300 ms) e um AudioContext simulado que conta as notas do "plim".
// Simulado porque o servidor do CI (Linux, sem tela) não tem dispositivo de áudio: o AudioContext real pode
// nunca sair de "suspended" e o som não toca. Como no navegador, ele começa suspenso e só passa a "running"
// quando a página chama resume() (o script faz isso no primeiro clique ou tecla).
const abrirPaginaDoTrabalhador = async (ctx) => {
    await ctx.addInitScript(() => {
        window.ibicoNotificacoesIntervaloMs = 300;
        window.__notasTocadas = 0;
        const no = () => ({ connect: (destino) => destino });
        window.AudioContext = class {
            constructor() {
                this.state = 'suspended';
                this.currentTime = 0;
                this.destination = no();
            }
            resume() {
                this.state = 'running';
                return Promise.resolve();
            }
            createOscillator() {
                return {
                    ...no(),
                    type: 'sine',
                    frequency: { value: 0 },
                    start: () => {
                        window.__notasTocadas += 1;
                    },
                    stop: () => {}
                };
            }
            createGain() {
                return { ...no(), gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } };
            }
        };
        window.webkitAudioContext = window.AudioContext;
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/hometrabalhador`);
    // O navegador só libera áudio depois de uma interação.
    await page.mouse.click(5, 300);
    return page;
};

const contador = (page) => page.locator('#notificacoesContador');

test.describe('CT28 – Notificações do trabalhador', () => {
    test('aceite e recusa automática chegam com aviso, contador e som; abrir o painel marca como lidas', async ({
        browser
    }) => {
        const contratante = await criarConta(browser, 'contratante', 'ct28contr');
        const escolhido = await criarConta(browser, 'trabalhador', 'ct28escolhido');
        const outro = await criarConta(browser, 'trabalhador', 'ct28outro');
        await adicionarSaldo(contratante.ctx, 500);

        const titulo = `Notificação CT28 ${sufixoUnico()}`;
        const bicoId = await publicarBico(contratante.ctx, titulo, 100);
        expect((await candidatar(escolhido.ctx, bicoId)).status()).toBe(302);
        expect((await candidatar(outro.ctx, bicoId)).status()).toBe(302);

        const paginaEscolhido = await abrirPaginaDoTrabalhador(escolhido.ctx);
        const paginaOutro = await abrirPaginaDoTrabalhador(outro.ctx);
        await expect(contador(paginaEscolhido)).toBeHidden();

        // Candidatar-se não gera notificação para o próprio trabalhador.
        await paginaEscolhido.waitForTimeout(800);
        await expect(paginaEscolhido.locator('.notificacoes-aviso')).toHaveCount(0);

        const candidatos = await listarCandidatos(contratante.ctx, bicoId);
        const candidaturaEscolhido = candidatos.find((c) => c.nome === escolhido.nome).candidaturaId;
        expect((await aceitar(contratante.ctx, candidaturaEscolhido)).status()).toBe(302);

        // Escolhido: aviso de aceite, contador 1 e o "plim" (duas notas).
        const aviso = paginaEscolhido.locator('.notificacoes-aviso');
        await expect(aviso).toContainText('Candidatura aceita');
        await expect(aviso).toContainText(`Você foi escolhido para "${titulo}".`);
        await expect(contador(paginaEscolhido)).toHaveText('1');
        await expect.poll(() => paginaEscolhido.evaluate(() => window.__notasTocadas)).toBe(2);

        // Outro: recusado automaticamente.
        await expect(paginaOutro.locator('.notificacoes-aviso')).toContainText('Vaga preenchida');
        await expect(paginaOutro.locator('.notificacoes-aviso')).toContainText(
            `Outro profissional foi escolhido para "${titulo}".`
        );

        // O aviso não se repete nos ciclos seguintes nem ao recarregar.
        await paginaEscolhido.waitForTimeout(1000);
        await expect(aviso).toHaveCount(1);

        // Abrir o painel: a notificação aparece com link para o bico e o contador some.
        await paginaEscolhido.locator('#notificacoesBotao').click();
        const item = paginaEscolhido.locator('.notificacao').first();
        await expect(item).toContainText('Candidatura aceita');
        await expect(item.locator('a')).toHaveAttribute('href', `/bicos/${bicoId}`);
        await expect(contador(paginaEscolhido)).toBeHidden();

        await paginaEscolhido.reload();
        await paginaEscolhido.waitForTimeout(800);
        await expect(contador(paginaEscolhido)).toBeHidden();
        await expect(paginaEscolhido.locator('.notificacoes-aviso')).toHaveCount(0);

        for (const conta of [contratante, escolhido, outro]) await conta.ctx.close();
    });

    test('recusa pelo contratante mostra o motivo; o contratante não acessa as notificações', async ({ browser }) => {
        const contratante = await criarConta(browser, 'contratante', 'ct28recusa');
        const trabalhador = await criarConta(browser, 'trabalhador', 'ct28recusado');

        const titulo = `Recusa CT28 ${sufixoUnico()}`;
        const bicoId = await publicarBico(contratante.ctx, titulo, 80);
        expect((await candidatar(trabalhador.ctx, bicoId)).status()).toBe(302);
        const [candidato] = await listarCandidatos(contratante.ctx, bicoId);
        expect((await recusar(contratante.ctx, candidato.candidaturaId, 'Já contratei outra pessoa.')).status()).toBe(
            302
        );

        const resposta = await trabalhador.ctx.request.get(`${BASE}/notificacoes`, {
            headers: { Accept: 'application/json' }
        });
        expect(resposta.status()).toBe(200);
        const { naoLidas, notificacoes } = await resposta.json();
        expect(naoLidas).toBe(1);
        expect(notificacoes[0]).toMatchObject({
            tipo: 'recusada',
            titulo: 'Candidatura recusada',
            mensagem: `Sua candidatura para "${titulo}" não foi aceita.`,
            motivo: 'Já contratei outra pessoa.',
            href: `/bicos/${bicoId}`,
            lida: false
        });

        const page = await trabalhador.ctx.newPage();
        await page.goto(`${BASE}/hometrabalhador`);
        await page.locator('#notificacoesBotao').click();
        await expect(page.locator('.notificacao').first()).toContainText('Motivo: Já contratei outra pessoa.');

        const doContratante = await contratante.ctx.request.get(`${BASE}/notificacoes`, { failOnStatusCode: false });
        expect(doContratante.status()).toBe(403);

        await contratante.ctx.close();
        await trabalhador.ctx.close();
    });
});
