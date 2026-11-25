// Testes unitários do avatar da barra lateral do contratante: renderiza o partial com dados falsos.
// Não usa navegador nem banco. Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import { iniciaisDoNome } from '../../services/iniciais.js';

const HEADER = fileURLToPath(new URL('../../views/Partials/headerContratante.ejs', import.meta.url));

const renderizarBarra = (dados = {}) =>
    ejs.renderFile(HEADER, {
        usuario: { id: 4, nome: 'Carla Mendes', tipo_perfil: 'contratante', saldo_simulado: 0 },
        rotaAtual: '/homeContratante',
        formatarMoedaBRL: String,
        iniciaisDoNome,
        ...dados
    });

const blocoDaConta = (html) => html.slice(html.indexOf('sidebar-account__profile'));

describe('avatar da barra lateral do contratante', () => {
    test('sem foto: mostra as iniciais e não usa imagem externa', async () => {
        const html = await renderizarBarra();

        assert.doesNotMatch(html, /unsplash/i, 'nenhuma foto de banco de imagens');
        assert.match(blocoDaConta(html), /data-avatar="iniciais"[^>]*>CM</);
        assert.doesNotMatch(blocoDaConta(html), /data-avatar="foto"/);
    });

    test('com foto: mostra a imagem da própria conta', async () => {
        const html = await renderizarBarra({ fotoPerfilUrl: '/perfil/4/foto?v=123' });

        assert.match(blocoDaConta(html), /<img src="\/perfil\/4\/foto\?v=123"[^>]*data-avatar="foto"/);
    });

    test('a foto de outra pessoa na página (perfil público) não vaza para a barra', async () => {
        const html = await renderizarBarra({ fotoUrl: '/perfil/99/foto?v=1' });

        assert.doesNotMatch(html, /\/perfil\/99\/foto/);
        assert.match(blocoDaConta(html), /data-avatar="iniciais"/);
    });
});
