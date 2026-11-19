document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const cardsGrid = document.getElementById('cardsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const feedProgress = document.getElementById('feedProgress');
    const noResults = document.getElementById('noResults');
    const clearButtons = Array.from(document.querySelectorAll('#clearFilters, #clearFiltersEmpty'));
    const areaChips = Array.from(document.querySelectorAll('.area-chip'));
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const toast = document.getElementById('toast');

    if (!cardsGrid) return;

    const PAGE_SIZE = 6;
    const cards = Array.from(cardsGrid.querySelectorAll('.job-card'));
    let visibleLimit = PAGE_SIZE;
    let toastTimer;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function normalizeText(text) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .trim();
    }

    function getFilteredCards() {
        const query = normalizeText(searchInput ? searchInput.value : '');
        if (!query) return cards.slice();
        return cards.filter(
            (card) =>
                normalizeText(card.dataset.title).includes(query) ||
                normalizeText(card.dataset.location).includes(query)
        );
    }

    function sortCards(filteredCards) {
        const mode = sortSelect ? sortSelect.value : 'recent';
        return filteredCards.slice().sort((a, b) => {
            const priceA = Number(a.dataset.price) || 0;
            const priceB = Number(b.dataset.price) || 0;
            const dateA = Number(a.dataset.date) || 0;
            const dateB = Number(b.dataset.date) || 0;
            const titleA = normalizeText(a.dataset.title);
            const titleB = normalizeText(b.dataset.title);
            switch (mode) {
                case 'highest':
                    return priceB - priceA;
                case 'lowest':
                    return priceA - priceB;
                case 'az':
                    return titleA.localeCompare(titleB, 'pt-BR');
                default:
                    return dateB - dateA;
            }
        });
    }

    // Destaca o atalho de bairro cujo texto é exatamente o que está na pesquisa.
    function syncAreaChips() {
        const query = normalizeText(searchInput ? searchInput.value : '');
        areaChips.forEach((chip) => {
            const active = query !== '' && query === normalizeText(chip.dataset.area);
            chip.setAttribute('aria-pressed', String(active));
            chip.classList.toggle('is-active', active);
        });
    }

    function renderCards() {
        const filteredCards = getFilteredCards();
        const sortedCards = sortCards(filteredCards);
        const total = filteredCards.length;
        const shown = Math.min(visibleLimit, total);

        sortedCards.forEach((card) => cardsGrid.appendChild(card));
        sortedCards.forEach((card, index) => {
            card.hidden = index >= visibleLimit;
            card.style.display = index < visibleLimit ? '' : 'none';
        });
        cards.forEach((card) => {
            if (!sortedCards.includes(card)) {
                card.hidden = true;
                card.style.display = 'none';
            }
        });

        if (resultsCount) {
            const filtered = total !== cards.length;
            // "1 vaga" ou "3 de 19 vagas": o plural segue o último número exibido.
            resultsCount.textContent = filtered
                ? total + ' de ' + cards.length + (cards.length === 1 ? ' vaga' : ' vagas')
                : total + (total === 1 ? ' vaga' : ' vagas');
        }
        if (feedProgress) {
            feedProgress.textContent =
                total === 0
                    ? ''
                    : 'Mostrando ' + shown + ' de ' + total + (total === 1 ? ' oportunidade' : ' oportunidades');
        }
        if (noResults) noResults.hidden = total !== 0;
        if (loadMoreBtn) {
            const remaining = total - visibleLimit;
            loadMoreBtn.hidden = remaining <= 0;
            loadMoreBtn.innerHTML =
                'Carregar mais oportunidades' +
                (remaining > 0
                    ? ' <span class="load-more__rest">(' +
                      remaining +
                      (remaining === 1 ? ' restante' : ' restantes') +
                      ')</span>'
                    : '') +
                ' <i class="ph-fill ph-caret-down" aria-hidden="true"></i>';
        }
        syncAreaChips();
    }

    function resetFilters() {
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'recent';
        visibleLimit = PAGE_SIZE;
        renderCards();
        showToast('Filtros limpos');
    }

    if (searchInput)
        searchInput.addEventListener('input', () => {
            visibleLimit = PAGE_SIZE;
            renderCards();
        });

    if (sortSelect)
        sortSelect.addEventListener('change', () => {
            renderCards();
            const labels = {
                recent: 'Mais recentes',
                highest: 'Maior pagamento',
                lowest: 'Menor pagamento',
                az: 'Nome A–Z'
            };
            showToast('Ordenação: ' + (labels[sortSelect.value] || 'atualizada'));
        });

    clearButtons.forEach((button) => button.addEventListener('click', resetFilters));

    // Atalho de bairro: usa a própria pesquisa por local; clicar de novo no mesmo bairro remove o filtro.
    areaChips.forEach((chip) =>
        chip.addEventListener('click', () => {
            if (!searchInput) return;
            const alreadyActive = chip.getAttribute('aria-pressed') === 'true';
            searchInput.value = alreadyActive ? '' : chip.dataset.area;
            visibleLimit = PAGE_SIZE;
            renderCards();
        })
    );

    if (loadMoreBtn)
        loadMoreBtn.addEventListener('click', () => {
            visibleLimit += PAGE_SIZE;
            renderCards();
            showToast('Mais oportunidades exibidas');
        });

    renderCards();
});
