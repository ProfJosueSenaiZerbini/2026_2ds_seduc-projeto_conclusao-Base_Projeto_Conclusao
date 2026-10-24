import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizarCPF,
    validarCPF,
    validarConfirmacaoSenha,
    validarEmail,
    validarIdade,
    validarNome,
    validarSenha
} from '../validations/usuarioValidation.js';

test('normaliza CPFs válidos e rejeita entrada com caracteres indevidos', () => {
    assert.equal(normalizarCPF('52998224725'), '529.982.247-25');
    assert.equal(normalizarCPF('529.982.247-25'), '529.982.247-25');
    assert.equal(validarCPF('111.111.111-11'), false);
    assert.equal(validarCPF('abc52998224725'), false);
});

test('valida e-mail e nome dentro dos limites do banco', () => {
    assert.equal(validarEmail('usuario@exemplo.com'), true);
    assert.equal(validarEmail(`${'a'.repeat(90)}@exemplo.com`), false);
    assert.equal(validarNome(' Ana ', 3), true);
    assert.equal(validarNome('Al', 3), false);
    assert.equal(validarNome('a'.repeat(101)), false);
});

test('valida senha por caracteres e limite UTF-8 do bcrypt', () => {
    assert.equal(validarSenha('123456'), true);
    assert.equal(validarSenha('12345'), false);
    assert.equal(validarSenha('é'.repeat(36)), true);
    assert.equal(validarSenha('é'.repeat(37)), false);
    assert.equal(validarConfirmacaoSenha('123456', '123456'), true);
    assert.equal(validarConfirmacaoSenha('123456', 123456), false);
});

test('valida idade adulta dentro do limite de inteiro do banco', () => {
    assert.equal(validarIdade('18'), true);
    assert.equal(validarIdade(17), false);
    assert.equal(validarIdade('18.5'), false);
    assert.equal(validarIdade('2147483648'), false);
});
