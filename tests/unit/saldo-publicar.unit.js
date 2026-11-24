// Teste unitário da conferência de saldo na tela de publicar bico (public/js/publicarBico.js),
// executado num DOM falso mínimo. Não usa navegador, banco nem internet. Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CODIGO = readFileSync(new URL('../../public/js/publicarBico.js', import.meta.url), 'utf8');

const criarElemento = () => {
    const ouvintes = {};
    return {
        ouvintes,
        value: '',
        textContent: '',
        className: '',
        dataset: {},
        classList: { toggle() {} },
        addEventListener(tipo, funcao) {
            ouvintes[tipo] = funcao;
        },
        removeAttribute() {},
        setAttribute() {},
        replaceChildren() {},
        append() {},
        focus() {}
    };
};

// Abre a tela com o saldo informado e devolve uma função que digita o valor do bico.
const abrirTela = (saldo) => {
    const elementos = {};
    const porSeletor = (seletor) => (elementos[seletor] ||= criarElemento());
    const campos = {};
    const formulario = porSeletor('#publicar-form');
    formulario.elements = new Proxy(campos, { get: (alvo, nome) => (alvo[nome] ||= criarElemento()) });
    porSeletor('#balance-box').dataset.saldo = String(saldo);

    vm.runInNewContext(CODIGO, {
        window: {},
        document: {
            querySelector: (seletor) => (seletor.includes('mascot') ? null : porSeletor(seletor)),
            addEventListener() {}
        }
    });

    return {
        digitarValor(valor) {
            formulario.elements.valor.value = valor;
            formulario.elements.valor.ouvintes.input();
        },
        reter: () => porSeletor('[data-saldo-reter]').textContent.replace(/\s/g, ' '),
        status: () => porSeletor('[data-saldo-status]')
    };
};

describe('publicar bico: conferência de saldo', () => {
    test('sem valor, não afirma que o saldo é suficiente', () => {
        const tela = abrirTela(0);

        assert.equal(tela.reter(), 'R$ 0,00');
        assert.equal(tela.status().textContent, 'Informe o valor para conferir o saldo.');
    });

    test('valor maior que o saldo: avisa que é insuficiente', () => {
        const tela = abrirTela(0);
        tela.digitarValor('500');

        assert.equal(tela.reter(), 'R$ 500,00');
        assert.match(tela.status().textContent, /^Saldo insuficiente/);
        assert.match(tela.status().className, /saldo-status--insuficiente/);
    });

    test('valor igual ao saldo é suficiente', () => {
        const tela = abrirTela(150.5);
        tela.digitarValor('150.50');

        assert.equal(tela.status().textContent, 'Saldo suficiente disponível');
        assert.match(tela.status().className, /saldo-status--ok/);
    });
});
