// Testes do cálculo de quanto guardar por meta (public/js/meta-calculos.js).
//
// Como rodar, na pasta do projeto:
//
//     node Docs/Testes/teste-calculos-meta.js
//
// Cada linha compara o resultado da função com um valor calculado à mão.

const assert = require('assert');
const { mesesCompletos, calcularPlanoMeta } = require('../../public/js/meta-calculos.js');

function testar(descricao, funcao) {
  try {
    funcao();
    console.log('  ok   ' + descricao);
  } catch (erro) {
    console.log('  FALHOU ' + descricao + '\n         ' + erro.message);
    process.exitCode = 1;
  }
}

console.log('\nMeses completos até a data');
testar('mesmo dia, 6 meses depois', () => assert.strictEqual(mesesCompletos('2026-11-01', '2027-05-01'), 6));
testar('mês que não fechou não conta', () => assert.strictEqual(mesesCompletos('2026-11-20', '2027-05-10'), 5));
testar('dias a mais não viram mês', () => assert.strictEqual(mesesCompletos('2026-11-01', '2027-05-15'), 6));
testar('passa da virada do ano', () => assert.strictEqual(mesesCompletos('2026-12-15', '2027-01-15'), 1));
testar('menos de 1 mês dá zero', () => assert.strictEqual(mesesCompletos('2026-11-01', '2026-11-30'), 0));

console.log('\nQuanto guardar');
testar('divisão exata', () => {
  const p = calcularPlanoMeta(1200, 0, '2027-05-01', '2026-11-01');
  assert.deepStrictEqual(p, { falta: 1200, meses: 6, porMes: 200, porAno: null });
});
testar('arredonda para cima, para não faltar centavo', () => {
  assert.strictEqual(calcularPlanoMeta(1000, 0, '2027-02-01', '2026-11-01').porMes, 333.34);
});
testar('desconta o que já foi guardado', () => {
  assert.strictEqual(calcularPlanoMeta(1200, 600, '2027-05-01', '2026-11-01').porMes, 100);
});
testar('centavos não sofrem com ponto flutuante', () => {
  assert.strictEqual(calcularPlanoMeta(0.07, 0, '2026-12-01', '2026-11-01').porMes, 0.07);
});
testar('2 anos: mostra o valor por ano', () => {
  const p = calcularPlanoMeta(24000, 0, '2028-11-01', '2026-11-01');
  assert.strictEqual(p.porMes, 1000);
  assert.strictEqual(p.porAno, 12000);
});
testar('exatamente 1 ano: por ano é o que falta, sem passar', () => {
  const p = calcularPlanoMeta(1000, 0, '2027-11-01', '2026-11-01');
  assert.strictEqual(p.porMes, 83.34);
  assert.strictEqual(p.porAno, 1000);
});

console.log('\nCasos sem divisão');
testar('menos de 1 mês: não divide', () => {
  const p = calcularPlanoMeta(500, 100, '2026-11-20', '2026-11-01');
  assert.deepStrictEqual(p, { falta: 400, meses: 0, porMes: null, porAno: null });
});
testar('prazo que já passou: não divide', () => {
  assert.strictEqual(calcularPlanoMeta(500, 0, '2026-01-01', '2026-11-01').porMes, null);
});
testar('meta já alcançada: não falta nada', () => {
  const p = calcularPlanoMeta(500, 500, '2027-05-01', '2026-11-01');
  assert.strictEqual(p.falta, 0);
  assert.strictEqual(p.porMes, null);
});

console.log(process.exitCode ? '\nHá testes falhando.\n' : '\nTodos os testes passaram.\n');
