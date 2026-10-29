const toast = document.getElementById('toast');
let toastTimer;

// Função para mostrar notificações na tela
function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Função do botão Candidatar-se
// Como ela é chamada direto no HTML (onclick), precisa ficar solta aqui no arquivo
function candidatar(btn, titulo) {
    if (btn.classList.contains('applied')) return;
    btn.textContent = 'Candidatura enviada ✓';
    btn.classList.add('applied');
    btn.disabled = true;
    showToast(`Você se candidatou para "${titulo}"`);
}

// Escutadores de eventos (esperamos carregar a página para evitar erros)
document.addEventListener('DOMContentLoaded', () => {

    // Navegação
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Notificações (Sino)
    const bellBtn = document.getElementById('bellBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            document.getElementById('bellDot').classList.remove('show');
            showToast('Você não tem novas notificações');
        });
    }

    // Perfil
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showToast('Abrindo seu perfil...');
        });
    }

    // Pesquisa (Funciona automaticamente com os cards do EJS!)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            document.querySelectorAll('.card').forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const loc = card.querySelector('.location').textContent.toLowerCase();
                // Mostra ou oculta o card com base na pesquisa
                card.style.display = (title.includes(q) || loc.includes(q)) ? '' : 'none';
            });
        });
    }

    // Ordenar
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            showToast(`Ordenado por: ${e.target.value}`);
        });
    }

    // Botão de carregar mais
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            showToast('Integração com paginação do banco em breve!');
        });
    }

    







document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('sortSelect');
    
    if (!select) return;

    // 1. Ao carregar a página, mantém selecionada a opção que veio na URL
    const urlParams = new URLSearchParams(window.location.search);
    const ordenarAtual = urlParams.get('ordenar');
    if (ordenarAtual) {
        select.value = ordenarAtual;
    }

    // 2. Quando o usuário mudar o select, recarrega a página passando o parâmetro
    select.addEventListener('change', function() {
        const criterio = this.value;
        const url = new URL(window.location.href);
        url.searchParams.set('ordenar', criterio);
        
        // Redireciona para a mesma página com o filtro aplicado
        window.location.href = url.toString();
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');

    // Mantém os valores selecionados de acordo com os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ordem')) {
        sortSelect.value = urlParams.get('ordem');
    }
    if (urlParams.has('busca')) {
        searchInput.value = urlParams.get('busca');
    }

    // Função para recarregar a página com os parâmetros atualizados no banco
    function aplicarFiltros() {
        const ordem = sortSelect.value;
        const busca = searchInput.value;

        const params = new URLSearchParams();
        if (ordem) params.set('ordem', ordem);
        if (busca) params.set('busca', busca);

        window.location.href = `${window.location.pathname}?${params.toString()}`;
    }

    // Evento ao mudar o filtro de ordenação
    sortSelect.addEventListener('change', aplicarFiltros);

    // Evento ao pressionar Enter na busca
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sortSelect');

    // Mantém a opção marcada de acordo com a URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ordem') && sortSelect) {
        sortSelect.value = urlParams.get('ordem');
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const ordem = sortSelect.value;
            const params = new URLSearchParams(window.location.search);
            params.set('ordem', ordem);

            // Redireciona para atualizar a query no MySQL
            window.location.search = params.toString();
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sortSelect');

    // Mantém a opção marcada de acordo com a URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ordem') && sortSelect) {
        sortSelect.value = urlParams.get('ordem');
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const ordem = sortSelect.value;
            const params = new URLSearchParams(window.location.search);
            params.set('ordem', ordem);

            // Redireciona para atualizar a query no MySQL
            window.location.search = params.toString();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sortSelect');
    
    // Procura o container onde os cards estão salvos
    const cardsGrid = document.querySelector('.cards-grid') || document.querySelector('.vagas-grid') || document.querySelector('.grid');

    if (!sortSelect || !cardsGrid) {
        console.error('❌ Não foi possível encontrar o <select id="sortSelect"> ou o container dos cards.');
        return;
    }

    sortSelect.addEventListener('change', () => {
        const opcao = sortSelect.value;
        
        // Pega todos os cards de bicos na tela
        const cards = Array.from(cardsGrid.querySelectorAll('.card, .card-bico, .vaga-card'));

        if (cards.length === 0) return;

        // Função auxiliar para extrair apenas o valor numérico do texto de preço
        const extrairValor = (card) => {
            const elementoPreco = card.querySelector('.price-pill') || card.querySelector('.preco') || card.querySelector('.valor');
            if (!elementoPreco) return 0;

            // Transforma "R$ 1.123.456,00" ou "1000.00" em um número float puro
            const texto = elementoPreco.textContent;
            const apenasNumeros = texto.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.');
            return parseFloat(apenasNumeros) || 0;
        };

        // Ordena os cards
        cards.sort((cardA, cardB) => {
            const valorA = extrairValor(cardA);
            const valorB = extrairValor(cardB);

            if (opcao === 'maior_preco') {
                return valorB - valorA; // Do maior para o menor
            } else if (opcao === 'menor_preco') {
                return valorA - valorB; // Do menor para o maior
            } else {
                // Caso 'recentes', mantém a ordem original recebida da página
                return 0;
            }
        });

        // Limpa a tela e reinsere na nova ordem (1º, 2º, 3º lugar)
        cardsGrid.innerHTML = '';
        cards.forEach(card => cardsGrid.appendChild(card));
    });
});
});