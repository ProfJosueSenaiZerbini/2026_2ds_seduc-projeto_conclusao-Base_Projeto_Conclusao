// Testes unitários da proteção contra envio duplicado (public/js/envioUnico.js), num DOM falso mínimo.
// Não usa navegador, banco nem internet. Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CODIGO = readFileSync(new URL('../../public/js/envioUnico.js', import.meta.url), 'utf8');

const criarFormulario = (grupo = '') => {
    const botao = { disabled: false };
    const ouvintes = [];
    return {
        botao,
        getAttribute: () => grupo,
        querySelectorAll: () => [botao],
        addEventListener: (_tipo, funcao) => ouvintes.push(funcao),
        // Simula um envio; `recusadoDepois` imita outro script que chama preventDefault em seguida.
        enviar({ recusadoAntes = false, recusadoDepois = false } = {}) {
            const evento = {
                defaultPrevented: recusadoAntes,
                preventDefault() {
                    this.defaultPrevented = true;
                }
            };
            ouvintes.forEach((funcao) => funcao(evento));
            const passou = !evento.defaultPrevented;
            if (recusadoDepois) evento.preventDefault();
            return passou;
        }
    };
};

const carregar = (...formularios) => {
    const pendentes = [];
    let aoVoltar;
    vm.runInNewContext(CODIGO, {
        document: { querySelectorAll: () => formularios },
        window: {
            addEventListener: (_tipo, funcao) => {
                aoVoltar = funcao;
            }
        },
        setTimeout: (funcao) => pendentes.push(funcao)
    });
    return {
        passarTempo: () => pendentes.splice(0).forEach((funcao) => funcao()),
        voltarPeloHistorico: () => aoVoltar({ persisted: true })
    };
};

describe('envio único de formulário', () => {
    test('só o primeiro envio passa e o botão fica desabilitado', () => {
        const formulario = criarFormulario();
        const pagina = carregar(formulario);

        assert.equal(formulario.enviar(), true);
        assert.equal(formulario.enviar(), false);
        pagina.passarTempo();
        assert.equal(formulario.botao.disabled, true);
    });

    test('envio recusado por outro script não trava o formulário', () => {
        const formulario = criarFormulario();
        const pagina = carregar(formulario);

        formulario.enviar({ recusadoAntes: true });
        formulario.enviar({ recusadoDepois: true });
        pagina.passarTempo();

        assert.equal(formulario.botao.disabled, false);
        assert.equal(formulario.enviar(), true);
    });

    test('no mesmo grupo, enviar um formulário bloqueia os outros (aceitar e recusar)', () => {
        const aceitar = criarFormulario('candidatura');
        const recusar = criarFormulario('candidatura');
        const pagina = carregar(aceitar, recusar);

        assert.equal(aceitar.enviar(), true);
        assert.equal(recusar.enviar(), false);
        pagina.passarTempo();
        assert.equal(recusar.botao.disabled, true);
    });

    test('formulários sem grupo são independentes', () => {
        const publicar = criarFormulario();
        const outro = criarFormulario();
        carregar(publicar, outro);

        assert.equal(publicar.enviar(), true);
        assert.equal(outro.enviar(), true);
    });

    test('voltar pelo histórico libera o envio', () => {
        const formulario = criarFormulario();
        const pagina = carregar(formulario);

        formulario.enviar();
        pagina.passarTempo();
        pagina.voltarPeloHistorico();

        assert.equal(formulario.botao.disabled, false);
        assert.equal(formulario.enviar(), true);
    });
});
