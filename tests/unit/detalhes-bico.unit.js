// Teste unitário do link "Voltar" da tela de detalhes do bico: renderiza a view com dados falsos.
// Não usa navegador nem banco. Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';

const VIEW = fileURLToPath(new URL('../../views/detalhesBico.ejs', import.meta.url));

const linkVoltar = async (tipoPerfil) => {
    const html = await ejs.renderFile(VIEW, {
        usuario: { id: 1, nome: 'Pessoa', tipo_perfil: tipoPerfil, saldo_simulado: 0 },
        bico: { id: 7, contratante_id: 2, titulo: 'Bico', status: 'Aberto', valor: 10 },
        minhaCandidatura: null,
        avaliacao: null,
        rotaAtual: '/7',
        alerta: null,
        formatarMoedaBRL: String
    });
    return html.match(/<a href="([^"]+)" class="btn-back">/)?.[1];
};

describe('detalhes do bico: link Voltar', () => {
    test('trabalhador volta para a home do trabalhador', async () => {
        assert.equal(await linkVoltar('trabalhador'), '/hometrabalhador');
    });

    test('contratante volta para a home do contratante', async () => {
        assert.equal(await linkVoltar('contratante'), '/homeContratante');
    });
});
