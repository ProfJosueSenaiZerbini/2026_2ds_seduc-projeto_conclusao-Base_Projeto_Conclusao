// Testes unitários das iniciais do avatar (services/iniciais.js).
// Executar com: npm run test:unit
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { iniciaisDoNome } from '../../services/iniciais.js';

describe('iniciaisDoNome', () => {
    const casos = [
        ['Rafael Souza', 'RS', 'nome e sobrenome'],
        ['Carla Mendes', 'CM', 'nome e sobrenome'],
        ['Ana de Souza Lima', 'AL', 'primeiro e último nome, ignorando o meio'],
        ['bruno', 'BR', 'uma palavra só usa as 2 primeiras letras'],
        ['  joão   pedro  ', 'JP', 'espaços extras e minúsculas'],
        ['Érica Ávila', 'ÉÁ', 'acentos'],
        ['Ícaro', 'ÍC', 'acento na palavra única'],
        ['X', 'X', 'nome de uma letra']
    ];

    for (const [nome, esperado, descricao] of casos) {
        test(`${JSON.stringify(nome)} -> ${esperado} (${descricao})`, () => {
            assert.equal(iniciaisDoNome(nome), esperado);
        });
    }

    test('vazio, só espaços, null ou undefined usam o padrão', () => {
        assert.equal(iniciaisDoNome(''), '?');
        assert.equal(iniciaisDoNome('   '), '?');
        assert.equal(iniciaisDoNome(null, 'CT'), 'CT');
        assert.equal(iniciaisDoNome(undefined, '-'), '-');
    });
});
