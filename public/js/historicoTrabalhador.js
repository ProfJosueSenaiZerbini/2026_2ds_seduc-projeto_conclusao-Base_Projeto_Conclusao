(function () {
  const POR_PAGINA = 3;
  const tabs = document.querySelectorAll('.tab');
  const buscaEl = document.getElementById('busca');
  const ordenarEl = document.getElementById('ordenar');
  const infoEl = document.getElementById('infoPaginacao');
  const pagEl = document.getElementById('paginacao');

  let abaAtual = 'aceitos';
  let paginaAtual = 1;

  function valorDoCard(card) {
    const txt = card.querySelector('.price__value').textContent;
    return parseFloat(txt.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
  }

  function renderizar() {
    const painel = document.getElementById(abaAtual);
    const lista = painel.querySelector('.bicos-list');
    const msgFiltro = painel.querySelector('.empty--filtro');
    if (!lista) {
      infoEl.textContent = '';
      pagEl.innerHTML = '';
      return;
    }

    const termo = buscaEl.value.trim().toLowerCase();
    let cards = Array.from(lista.children);

    // Ordenação
    const ord = ordenarEl.value;
    cards.sort((a, b) => {
      if (ord === 'antigos') return a.dataset.ts - b.dataset.ts;
      if (ord === 'maior') return valorDoCard(b) - valorDoCard(a);
      if (ord === 'menor') return valorDoCard(a) - valorDoCard(b);
      return b.dataset.ts - a.dataset.ts;
    });
    cards.forEach(c => lista.appendChild(c));

    // Filtro + paginação
    const visiveis = cards.filter(c => c.dataset.busca.includes(termo));
    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const daPagina = visiveis.slice(inicio, inicio + POR_PAGINA);

    cards.forEach(c => { c.style.display = daPagina.includes(c) ? '' : 'none'; });
    if (msgFiltro) msgFiltro.hidden = visiveis.length > 0;

    infoEl.innerHTML = 'Mostrando <strong>' + daPagina.length + '</strong> de <strong>' +
      visiveis.length + '</strong> serviços';

    // Botões de paginação
    pagEl.innerHTML = '';
    if (totalPaginas <= 1) return;
    const add = (rotulo, pagina, opts = {}) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = rotulo;
      b.className = 'pagination__btn' + (opts.ativo ? ' pagination__btn--active' : '');
      b.disabled = !!opts.desabilitado;
      b.addEventListener('click', () => { paginaAtual = pagina; renderizar(); });
      pagEl.appendChild(b);
    };
    add('‹', paginaAtual - 1, { desabilitado: paginaAtual === 1 });
    for (let p = 1; p <= totalPaginas; p++) add(String(p), p, { ativo: p === paginaAtual });
    add('›', paginaAtual + 1, { desabilitado: paginaAtual === totalPaginas });
  }

  // Troca de abas
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('tab-panel--active'));
      tabs.forEach(t => t.classList.remove('tab--active'));
      abaAtual = tab.dataset.tab;
      document.getElementById(abaAtual).classList.add('tab-panel--active');
      tab.classList.add('tab--active');
      paginaAtual = 1;
      renderizar();
    });
  });

  buscaEl.addEventListener('input', () => { paginaAtual = 1; renderizar(); });
  ordenarEl.addEventListener('change', () => { paginaAtual = 1; renderizar(); });

  renderizar();

  // Pop-up "Dica para Profissionais"
  const dica = document.getElementById('dicaPopup');
  const fechar = document.getElementById('fecharDica');
  let dispensada = false;
  try { dispensada = sessionStorage.getItem('dicaProfissionaisFechada') === '1'; } catch (e) { }

  if (!dispensada) {
    setTimeout(() => { dica.hidden = false; }, 800);
  }
  fechar.addEventListener('click', () => {
    dica.hidden = true;
    try { sessionStorage.setItem('dicaProfissionaisFechada', '1'); } catch (e) { }
  });
})();