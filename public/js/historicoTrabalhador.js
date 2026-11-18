(function () {
    const POR_PAGINA = 3;
    const tabs = document.querySelectorAll('.tab');
    const buscaEl = document.getElementById('busca');
    const ordenarEl = document.getElementById('ordenar');
    const infoEl = document.getElementById('infoPaginacao');
    const pagEl = document.getElementById('paginacao');

    let abaAtual = 'aceitos';
    let paginaAtual = 1;

    // Remove acentos e ignora maiúsculas/minúsculas ("pintár" = "pintar", "João" = "joao").
    function normalizar(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/\p{M}/gu, '')
            .toLowerCase();
    }

    // O texto do card é "serviço cliente descrição local". A busca aceita a frase como trecho contínuo
    // (ex.: "gleba b") ou várias palavras em qualquer ordem (ex.: "teste01 gleba", "conserta teste01"),
    // cada palavra digitada devendo ser o início de uma palavra do card.
    function combinaComBusca(textoNormalizado, termo) {
        if (textoNormalizado.includes(termo)) return true;
        const partes = termo.split(/\s+/).filter(Boolean);
        if (partes.length < 2) return false;
        const palavras = textoNormalizado.split(/\s+/);
        return partes.every((p) => palavras.some((w) => w.startsWith(p)));
    }

    function valorDoCard(card) {
        const txt = card.querySelector('.price__value').textContent;
        return parseFloat(txt.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    }

    // Ex.: "Exibindo 1–3 de 4 serviços", "Exibindo 1 de 1 serviço" ou, com busca,
    // "Exibindo 1 de 1 serviço encontrado (4 na aba)".
    function textoInfo(inicio, exibidos, encontrados, naAba, comBusca) {
        const rotuloServico = (n) => (n === 1 ? 'serviço' : 'serviços');
        if (encontrados === 0) {
            return comBusca ? 'Nenhum serviço encontrado (' + naAba + ' na aba)' : 'Nenhum serviço';
        }
        const faixa = exibidos === 1 ? String(inicio + 1) : inicio + 1 + '–' + (inicio + exibidos);
        let txt =
            'Exibindo <strong>' +
            faixa +
            '</strong> de <strong>' +
            encontrados +
            '</strong> ' +
            rotuloServico(encontrados) +
            (comBusca ? ' encontrado' + (encontrados === 1 ? '' : 's') : '');
        if (comBusca) txt += ' (' + naAba + ' na aba)';
        return txt;
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

        const termo = normalizar(buscaEl.value.trim());
        const cards = Array.from(lista.children);

        // Ordenação
        const ord = ordenarEl.value;
        cards.sort((a, b) => {
            if (ord === 'antigos') return a.dataset.ts - b.dataset.ts;
            if (ord === 'maior') return valorDoCard(b) - valorDoCard(a);
            if (ord === 'menor') return valorDoCard(a) - valorDoCard(b);
            return b.dataset.ts - a.dataset.ts;
        });
        cards.forEach((c) => lista.appendChild(c));

        // Filtro + paginação
        const visiveis = cards.filter((c) => combinaComBusca(normalizar(c.dataset.busca), termo));
        const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
        if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
        const inicio = (paginaAtual - 1) * POR_PAGINA;
        const daPagina = visiveis.slice(inicio, inicio + POR_PAGINA);

        cards.forEach((c) => {
            c.style.display = daPagina.includes(c) ? '' : 'none';
        });
        if (msgFiltro) msgFiltro.hidden = visiveis.length > 0;

        infoEl.innerHTML = textoInfo(inicio, daPagina.length, visiveis.length, cards.length, termo !== '');

        // Botões de paginação
        pagEl.innerHTML = '';
        if (totalPaginas <= 1) return;
        const add = (rotulo, pagina, opts = {}) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = rotulo;
            b.className = 'pagination__btn' + (opts.ativo ? ' pagination__btn--active' : '');
            b.disabled = !!opts.desabilitado;
            b.addEventListener('click', () => {
                paginaAtual = pagina;
                renderizar();
            });
            pagEl.appendChild(b);
        };
        add('‹', paginaAtual - 1, { desabilitado: paginaAtual === 1 });
        for (let p = 1; p <= totalPaginas; p++) add(String(p), p, { ativo: p === paginaAtual });
        add('›', paginaAtual + 1, { desabilitado: paginaAtual === totalPaginas });
    }

    // Troca de abas
    // Ativa uma aba: classe visual, ARIA (aria-selected) e tabindex móvel (só a aba ativa entra na sequência do Tab).
    function ativarAba(tab) {
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('tab-panel--active'));
        tabs.forEach((t) => {
            const ativa = t === tab;
            t.classList.toggle('tab--active', ativa);
            t.setAttribute('aria-selected', ativa ? 'true' : 'false');
            t.setAttribute('tabindex', ativa ? '0' : '-1');
        });
        abaAtual = tab.dataset.tab;
        document.getElementById(abaAtual).classList.add('tab-panel--active');
        paginaAtual = 1;
        buscaEl.value = ''; // a busca vale só para a aba em que foi digitada
        renderizar();
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => ativarAba(tab));
        // Setas (circular), Home e End: movem o foco e ativam a aba na hora. Enter/Espaço seguem nativos (botão).
        tab.addEventListener('keydown', (e) => {
            if (e.altKey || e.ctrlKey || e.metaKey) return; // atalhos do navegador/sistema (ex.: Alt+←, Ctrl+Home) seguem nativos
            const ultimo = tabs.length - 1;
            let alvo = -1;
            if (e.key === 'ArrowRight') alvo = i === ultimo ? 0 : i + 1;
            else if (e.key === 'ArrowLeft') alvo = i === 0 ? ultimo : i - 1;
            else if (e.key === 'Home') alvo = 0;
            else if (e.key === 'End') alvo = ultimo;
            if (alvo < 0) return;
            e.preventDefault();
            ativarAba(tabs[alvo]);
            tabs[alvo].focus();
        });
    });

    // Permite abrir direto uma aba pela URL (ex.: /historico?aba=concluidos).
    const abaDaUrl = new URLSearchParams(window.location.search).get('aba');
    const abaInicial = abaDaUrl && document.getElementById('tab-' + abaDaUrl);
    if (abaInicial) ativarAba(abaInicial);

    buscaEl.addEventListener('input', () => {
        paginaAtual = 1;
        renderizar();
    });
    ordenarEl.addEventListener('change', () => {
        paginaAtual = 1;
        renderizar();
    });

    renderizar();

    // Pop-up "Dica para Profissionais"
    const dica = document.getElementById('dicaPopup');
    const fechar = document.getElementById('fecharDica');
    let dispensada = false;
    try {
        dispensada = sessionStorage.getItem('dicaProfissionaisFechada') === '1';
    } catch {
        /* sem sessionStorage: a dica aparece de novo */
    }

    // A dica aparece sem tirar o foco de onde o usuário estava. Guardamos o último foco FORA dela
    // para devolvê-lo se o usuário fechar a dica pelo teclado estando no botão de fechar.
    let ultimoFocoFora = null;
    document.addEventListener('focusin', (e) => {
        if (!dica.contains(e.target)) ultimoFocoFora = e.target;
    });

    if (!dispensada) {
        setTimeout(() => {
            dica.hidden = false;
        }, 800);
    }

    // devolverFoco: só quando o foco estava dentro da dica (fechamento por teclado). Foco fora da dica nunca é movido.
    function fecharDica(devolverFoco) {
        dica.hidden = true;
        try {
            sessionStorage.setItem('dicaProfissionaisFechada', '1');
        } catch {
            /* sem sessionStorage: só não lembra que a dica foi fechada */
        }
        if (!devolverFoco) return;
        const visivel = (el) => el && el.isConnected && el.getClientRects().length > 0;
        const destino = visivel(ultimoFocoFora) ? ultimoFocoFora : document.querySelector('.tab[aria-selected="true"]');
        if (destino) destino.focus();
    }

    fechar.addEventListener('click', (e) => {
        // e.detail === 0: clique gerado por teclado (Enter/Espaço). Com mouse/toque não movemos o foco
        // (evita abrir o teclado virtual ao devolver o foco a um campo de texto).
        fecharDica(e.detail === 0 && dica.contains(document.activeElement));
    });

    // Esc fecha a dica visível. Não interfere em campos que usam Esc (ex.: limpar a busca, fechar a lista do select).
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || e.defaultPrevented || dica.hidden) return;
        const alvo = e.target;
        if (alvo && alvo !== dica && !dica.contains(alvo) && /^(INPUT|SELECT|TEXTAREA)$/.test(alvo.tagName)) return;
        fecharDica(dica.contains(document.activeElement));
    });
})();
