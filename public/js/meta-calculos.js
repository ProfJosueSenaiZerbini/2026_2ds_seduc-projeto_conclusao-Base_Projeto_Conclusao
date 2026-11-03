// Cálculo de quanto guardar para chegar numa meta até a data escolhida.
//
// Só tem CONTA aqui, como em perfil-calculos.js: nenhuma função mexe na
// tela nem chama a API. Isso permite testar pelo Node:
//
//     node Docs/Testes/teste-calculos-meta.js
//
// O resultado NÃO é gravado no banco: muda com o passar dos dias e a cada
// valor guardado, então é calculado de novo toda vez que a tela abre.

// Quantos meses COMPLETOS existem entre duas datas "2026-11-01".
// De 01/11 a 15/05 são 6 meses, e não 7: contar um mês que não fecha
// faria a pessoa guardar de menos e não chegar no valor a tempo.
function mesesCompletos(hoje, dataLimite) {
  const [anoHoje, mesHoje, diaHoje] = hoje.slice(0, 10).split('-').map(Number);
  const [ano, mes, dia] = dataLimite.slice(0, 10).split('-').map(Number);

  const meses = (ano - anoHoje) * 12 + (mes - mesHoje);
  return dia < diaHoje ? meses - 1 : meses;
}

// Devolve { falta, meses, porMes, porAno }.
//
// porMes vem null quando não há nem 1 mês até a data: dividir não faz
// sentido, é preciso guardar tudo o que falta. porAno vem null quando a
// meta termina em menos de 1 ano.
//
// A conta é em centavos, que são números inteiros: 0,07 * 100 dá
// 7.000000000000001 no JavaScript, e o arredondamento para cima viraria 8.
function calcularPlanoMeta(valorAlvo, valorAtual, dataLimite, hoje) {
  const faltaCentavos = Math.max(0, Math.round((valorAlvo - valorAtual) * 100));
  const meses = mesesCompletos(hoje, dataLimite);

  if (faltaCentavos === 0 || meses < 1) {
    return { falta: faltaCentavos / 100, meses, porMes: null, porAno: null };
  }

  // Arredonda para CIMA: R$ 1.000 em 3 meses dá R$ 333,34. Com R$ 333,33,
  // no fim dos 3 meses faltaria 1 centavo.
  const porMesCentavos = Math.ceil(faltaCentavos / meses);

  // Min porque o arredondamento acima pode passar do que falta.
  const porAno = meses >= 12 ? Math.min(porMesCentavos * 12, faltaCentavos) / 100 : null;

  return { falta: faltaCentavos / 100, meses, porMes: porMesCentavos / 100, porAno };
}

if (typeof module !== 'undefined') {
  module.exports = { mesesCompletos, calcularPlanoMeta };
}
