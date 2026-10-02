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
});