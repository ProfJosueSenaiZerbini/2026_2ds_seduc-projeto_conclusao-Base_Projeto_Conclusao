// Carteira do trabalhador: modal de histórico completo e filtros do extrato.
// Usa apenas as linhas que o servidor já renderizou (valores simulados); não cria dados.
(function () {
  'use strict';

  var modal = document.getElementById('historico-modal');
  var botaoAbrir = document.getElementById('abrir-historico');
  var botaoFechar = document.getElementById('fechar-historico');
  var corpoPrincipal = document.getElementById('transacoes-body');
  var corpoCompleto = document.getElementById('historico-completo-body');
  var filtroPrincipal = document.getElementById('filtro-bico');
  var filtroModal = document.getElementById('filtro-bico-modal');
  var semResultadosPrincipal = document.getElementById('sem-resultados');
  var semResultadosModal = document.getElementById('sem-resultados-modal');

  // ---------- Modal ----------
  var focoAnterior = null;
  var cliqueComecouNoFundo = false;

  function modalAberto() {
    return !!modal && modal.classList.contains('open');
  }

  function abrirModal() {
    if (!modal || modalAberto()) return;
    focoAnterior = document.activeElement;
    modal.classList.add('open');
    if (botaoFechar) botaoFechar.focus();
  }

  function fecharModal() {
    if (!modalAberto()) return;
    modal.classList.remove('open');
    if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus();
    focoAnterior = null;
  }

  if (botaoAbrir) {
    botaoAbrir.addEventListener('click', abrirModal);
    botaoAbrir.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirModal();
      }
    });
  }

  if (botaoFechar) botaoFechar.addEventListener('click', fecharModal);

  if (modal) {
    // Só fecha se o clique começou e terminou no fundo escuro (evita fechar ao arrastar a seleção de texto).
    modal.addEventListener('mousedown', function (e) {
      cliqueComecouNoFundo = e.target === modal;
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal && cliqueComecouNoFundo) fecharModal();
      cliqueComecouNoFundo = false;
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!modalAberto()) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      fecharModal();
      return;
    }

    // Mantém o foco do teclado dentro do modal enquanto ele estiver aberto.
    if (e.key === 'Tab') {
      var focaveis = modal.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!focaveis.length) return;
      var primeiro = focaveis[0];
      var ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  });

  // ---------- Filtro ----------
  // Critérios da interface: nome (descrição), valor e data/horário.
  var COL_DESCRICAO = 1;
  var COL_DATA = 2;
  var COL_VALOR = 4;

  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  function textoDaCelula(linha, indice) {
    var celula = linha.cells && linha.cells[indice];
    return celula ? normalizar(celula.textContent).replace(/\s+/g, ' ') : '';
  }

  // Aceita "1234,50", "1234.50" e "1.234,50" para o valor exibido como "R$ 1234,50".
  function variantesDoTermo(termo) {
    var variantes = [termo];
    if (/^[\d.,\s]+$/.test(termo) && /\d/.test(termo)) {
      var compacto = termo.replace(/\s/g, '');
      variantes.push(compacto.indexOf(',') >= 0 ? compacto.replace(/\./g, '') : compacto.replace(/\./g, ','));
    }
    return variantes.filter(function (v, i) { return v && variantes.indexOf(v) === i; });
  }

  function criarBusca(valorDigitado) {
    var termo = normalizar(valorDigitado);
    if (!termo) return null;
    var variantes = variantesDoTermo(termo);

    return function (linha) {
      var descricao = textoDaCelula(linha, COL_DESCRICAO);
      var data = textoDaCelula(linha, COL_DATA);
      var valor = textoDaCelula(linha, COL_VALOR);
      var valorNumerico = valor.replace(/[^\d,]/g, '');

      return variantes.some(function (v) {
        return descricao.indexOf(v) >= 0 ||
          data.indexOf(v) >= 0 ||
          valor.indexOf(v) >= 0 ||
          (valorNumerico && valorNumerico.indexOf(v) >= 0);
      });
    };
  }

  function limpar(elemento) {
    while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
  }

  var linhasCompletas = corpoCompleto ? Array.prototype.slice.call(corpoCompleto.rows) : [];
  var linhasResumo = corpoPrincipal ? Array.prototype.slice.call(corpoPrincipal.rows) : [];
  var statusDoResumo = linhasResumo.length && linhasResumo[0].cells[3] ? linhasResumo[0].cells[3].innerHTML : null;

  // Modal: mostra/oculta as linhas do histórico completo.
  function filtrarModal() {
    if (!filtroModal || !corpoCompleto) return;
    if (!linhasCompletas.length) return; // sem movimentações a página já mostra um aviso próprio
    var busca = criarBusca(filtroModal.value);
    var visiveis = 0;

    linhasCompletas.forEach(function (linha) {
      var mostrar = !busca || busca(linha);
      linha.style.display = mostrar ? '' : 'none';
      if (mostrar) visiveis += 1;
    });

    if (semResultadosModal) semResultadosModal.hidden = visiveis > 0;
  }

  // Tela principal: sem busca, mostra o resumo original (5 últimas);
  // com busca, pesquisa em TODAS as movimentações, não só nas 5 exibidas.
  function filtrarPrincipal() {
    if (!filtroPrincipal || !corpoPrincipal) return;
    if (!linhasCompletas.length) return; // sem movimentações a página já mostra um aviso próprio
    var busca = criarBusca(filtroPrincipal.value);

    limpar(corpoPrincipal);

    if (!busca) {
      linhasResumo.forEach(function (linha) { corpoPrincipal.appendChild(linha); });
      if (semResultadosPrincipal) semResultadosPrincipal.hidden = true;
      return;
    }

    var encontradas = linhasCompletas.filter(busca);
    encontradas.forEach(function (original) {
      var copia = original.cloneNode(true);
      copia.style.display = ''; // o filtro do modal pode ter ocultado a linha original
      // Mantém o mesmo rótulo de status que a tabela principal já usa.
      if (statusDoResumo !== null && copia.cells[3]) copia.cells[3].innerHTML = statusDoResumo;
      corpoPrincipal.appendChild(copia);
    });

    if (semResultadosPrincipal) semResultadosPrincipal.hidden = encontradas.length > 0;
  }

  if (filtroPrincipal) filtroPrincipal.addEventListener('input', filtrarPrincipal);
  if (filtroModal) filtroModal.addEventListener('input', filtrarModal);

  // O navegador pode restaurar texto digitado (voltar/avançar): aplica o filtro correspondente.
  filtrarPrincipal();
  filtrarModal();

  // ---------- Relatório CSV ----------
  // Exporta TODAS as movimentações (linhas do histórico completo), ignorando qualquer filtro aplicado.
  var botaoRelatorio = document.getElementById('gerar-relatorio');
  var avisoRelatorio = document.getElementById('relatorio-aviso');
  var temporizadorAviso = null;

  function mostrarAviso(texto) {
    if (!avisoRelatorio) return;
    avisoRelatorio.textContent = texto;
    avisoRelatorio.hidden = false;
    window.clearTimeout(temporizadorAviso);
    temporizadorAviso = window.setTimeout(function () { avisoRelatorio.hidden = true; }, 6000);
  }

  // Aspas e ";" são escapados e textos que começam com = + - @ ganham um apóstrofo,
  // para a planilha não interpretá-los como fórmula.
  function campoCsv(valor) {
    var texto = String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim();
    if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
    return /[";]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
  }

  // "+ R$ 1234,50" -> "1234,50" (vírgula decimal, sem símbolo nem sinal).
  function valorCsv(texto) {
    return String(texto == null ? '' : texto).replace(/[^\d,]/g, '');
  }

  function textoDaColuna(linha, indice) {
    return linha.cells[indice] ? linha.cells[indice].textContent : '';
  }

  function doisDigitos(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function nomeDoArquivo() {
    var hoje = new Date();
    return 'extrato-simulado-' + hoje.getFullYear() + '-' + doisDigitos(hoje.getMonth() + 1) + '-' + doisDigitos(hoje.getDate()) + '.csv';
  }

  function gerarRelatorio() {
    if (!linhasCompletas.length) {
      mostrarAviso('Não há movimentações para exportar.');
      return;
    }

    // Colunas da tabela: 0 Tipo, 1 Descrição, 2 Data, 3 Status, 4 Valor.
    var linhas = ['Descrição;Data;Tipo;Status;Valor (R$)'];
    linhasCompletas.forEach(function (linha) {
      linhas.push([
        campoCsv(textoDaColuna(linha, 1)),
        campoCsv(textoDaColuna(linha, 2)),
        campoCsv(textoDaColuna(linha, 0)),
        campoCsv(textoDaColuna(linha, 3)),
        valorCsv(textoDaColuna(linha, 4))
      ].join(';'));
    });

    var nome = nomeDoArquivo();
    // O BOM UTF-8 (U+FEFF) faz o Excel reconhecer os acentos.
    var arquivo = new Blob(['\uFEFF' + linhas.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    var endereco = URL.createObjectURL(arquivo);
    var link = document.createElement('a');
    link.href = endereco;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(endereco); }, 1000);

    mostrarAviso('Relatório gerado: ' + nome + ' (' + linhasCompletas.length + (linhasCompletas.length === 1 ? ' movimentação).' : ' movimentações).'));
  }

  if (botaoRelatorio) botaoRelatorio.addEventListener('click', gerarRelatorio);

  // ---------- Gráfico "Crescimento Mensal" ----------
  // As alturas das barras vêm prontas do servidor (proporção de cada mês); aqui só se troca o período.
  var graficoBarras = document.getElementById('grafico-barras');
  var seletorPeriodo = document.getElementById('grafico-periodo');
  var notaGrafico = document.getElementById('grafico-nota');
  var graficoVazio = document.getElementById('grafico-vazio');

  function formatarReais(valor) {
    return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
  }

  function atualizarGrafico() {
    if (!graficoBarras || !seletorPeriodo) return;

    var periodo = seletorPeriodo.value === '12' ? 12 : 6;
    var colunas = Array.prototype.slice.call(graficoBarras.querySelectorAll('.bar-col'));
    var visiveis = colunas.slice(-periodo);
    if (!visiveis.length) return;

    graficoBarras.classList.toggle('chart--6', periodo === 6);
    graficoBarras.classList.toggle('chart--12', periodo === 12);

    var total = visiveis.reduce(function (soma, coluna) { return soma + Number(coluna.getAttribute('data-total') || 0); }, 0);
    var primeira = visiveis[0];
    var ultima = visiveis[visiveis.length - 1];
    var faixa = primeira.getAttribute('data-rotulo').toLowerCase() + '/' + primeira.getAttribute('data-ano') +
      ' a ' + ultima.getAttribute('data-rotulo').toLowerCase() + '/' + ultima.getAttribute('data-ano');

    if (notaGrafico) {
      notaGrafico.textContent = 'Créditos simulados recebidos por mês, de ' + faixa + '. Meses sem movimentação aparecem como zero.';
    }

    graficoBarras.setAttribute('aria-label', 'Créditos simulados por mês: ' + visiveis.map(function (coluna) {
      return coluna.getAttribute('data-rotulo') + '/' + coluna.getAttribute('data-ano') + ' ' + formatarReais(coluna.getAttribute('data-total'));
    }).join('; '));

    if (graficoVazio) graficoVazio.hidden = Math.round(total * 100) > 0;
  }

  if (seletorPeriodo) seletorPeriodo.addEventListener('change', atualizarGrafico);
  atualizarGrafico();
})();
