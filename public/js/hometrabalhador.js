document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const cardsGrid = document.getElementById('cardsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    const clearFilters = document.getElementById('clearFilters');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const toast = document.getElementById('toast');

    if (!cardsGrid) return;

    const cards = Array.from(cardsGrid.querySelectorAll('.job-card'));
    let visibleLimit = 6;
    let toastTimer;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function normalizeText(text) {
        return String(text || '').normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
    }

    function getFilteredCards() {
        const query = normalizeText(searchInput ? searchInput.value : '');
        if (!query) return cards.slice();
        return cards.filter(card =>
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
                case 'highest': return priceB - priceA;
                case 'lowest': return priceA - priceB;
                case 'az': return titleA.localeCompare(titleB, 'pt-BR');
                default: return dateB - dateA;
            }
        });
    }

    function renderCards() {
        const filteredCards = getFilteredCards();
        const sortedCards = sortCards(filteredCards);

        sortedCards.forEach(card => cardsGrid.appendChild(card));
        sortedCards.forEach((card, index) => {
            card.hidden = index >= visibleLimit;
            card.style.display = index < visibleLimit ? '' : 'none';
        });
        cards.forEach(card => {
            if (!sortedCards.includes(card)) {
                card.hidden = true;
                card.style.display = 'none';
            }
        });

        if (resultsCount) {
            const total = filteredCards.length;
            resultsCount.textContent = total + (total === 1 ? ' vaga' : ' vagas');
        }
        if (noResults) noResults.hidden = filteredCards.length !== 0;
        if (loadMoreBtn) {
            loadMoreBtn.hidden = filteredCards.length <= visibleLimit;
            loadMoreBtn.innerHTML = 'Carregar mais oportunidades <i class="ph-fill ph-caret-down" aria-hidden="true"></i>';
        }
    }

    if (searchInput) searchInput.addEventListener('input', () => {
        visibleLimit = 6;
        renderCards();
    });

    if (sortSelect) sortSelect.addEventListener('change', () => {
        renderCards();
        const labels = {recent: 'Mais recentes', highest: 'Maior pagamento', lowest: 'Menor pagamento', az: 'Nome A–Z'};
        showToast('Ordenação: ' + (labels[sortSelect.value] || 'atualizada'));
    });

    if (clearFilters) clearFilters.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'recent';
        visibleLimit = 6;
        renderCards();
        showToast('Filtros limpos');
    });

    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => {
        visibleLimit += 6;
        renderCards();
        showToast('Mais oportunidades exibidas');
    });

    renderCards();
});
