// Teste unitário do script do chat (public/js/chat.js), executado num DOM falso mínimo.
// Não usa navegador, banco nem internet. Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CODIGO = readFileSync(new URL('../../public/js/chat.js', import.meta.url), 'utf8');

const criarElemento = () => {
    const ouvintes = {};
    const filhos = [];
    return {
        ouvintes,
        filhos,
        dataset: {},
        style: { setProperty() {} },
        value: '',
        textContent: '',
        addEventListener(tipo, funcao) {
            ouvintes[tipo] = funcao;
        },
        appendChild(filho) {
            filhos.push(filho);
        },
        insertBefore(filho, referencia) {
            filhos.splice(referencia ? filhos.indexOf(referencia) : filhos.length, 0, filho);
        },
        querySelectorAll: () => filhos.filter((filho) => filho.dataset.mensagemId),
        setAttribute() {},
        scrollTo() {},
        focus() {}
    };
};

const mensagem = (id, remetenteId, texto) => ({
    id,
    remetente_id: remetenteId,
    remetente_nome: 'Nome',
    texto,
    criado_em: '2026-11-17 10:00:00'
});

// Sobe o script com um servidor falso: `servidor` é a lista de mensagens gravadas.
const abrirChat = (servidor) => {
    const elementos = {};
    const porId = (id) => (elementos[id] ||= criarElemento());
    let consultar;
    const contexto = {
        document: {
            hidden: false,
            documentElement: criarElemento(),
            getElementById: porId,
            createElement: criarElemento,
            addEventListener() {}
        },
        window: {
            innerHeight: 800,
            __CHAT__: { urlEnviar: '/mensagens', urlConsultar: '/mensagens', candidaturaId: '1', usuarioId: '1' },
            addEventListener() {},
            setInterval(funcao) {
                consultar = funcao;
            }
        },
        fetch: async (url, opcoes) => {
            if (opcoes.method === 'POST') {
                const nova = mensagem(servidor.length + 11, 1, JSON.parse(opcoes.body).texto);
                servidor.push(nova);
                return { ok: true, json: async () => ({ sucesso: true, mensagem: nova }) };
            }
            const depoisDoId = Number(new URL(url, 'http://x').searchParams.get('depoisDoId'));
            return {
                ok: true,
                json: async () => ({ sucesso: true, mensagens: servidor.filter((m) => m.id > depoisDoId) })
            };
        }
    };
    vm.runInNewContext(CODIGO, contexto);

    return {
        consultar: () => consultar(),
        enviar: async (texto) => {
            porId('input-mensagem').value = texto;
            await porId('form-chat').ouvintes.submit({ preventDefault() {} });
        },
        ids: () => porId('chat-messages').filhos.map((filho) => Number(filho.dataset.mensagemId))
    };
};

describe('chat: consulta de mensagens novas', () => {
    test('mensagem do outro lado enviada antes da própria não se perde e entra na ordem', async () => {
        const servidor = [];
        const chat = abrirChat(servidor);
        servidor.push(mensagem(11, 2, 'do outro lado, ainda não consultada'));

        await chat.enviar('minha resposta');
        await chat.consultar();

        assert.deepEqual(chat.ids(), [11, 12]);
    });

    test('a própria mensagem não aparece duas vezes', async () => {
        const chat = abrirChat([]);

        await chat.enviar('oi');
        await chat.consultar();
        await chat.consultar();

        assert.deepEqual(chat.ids(), [11]);
    });
});
