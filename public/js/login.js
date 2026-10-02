document.addEventListener('DOMContentLoaded', () => {
    const btnHire = document.getElementById('btnHire');
    const btnWork = document.getElementById('btnWork');
    const panel = document.getElementById('panel');
    const birdHire = document.getElementById('birdHire');
    const birdWork = document.getElementById('birdWork');
    const caption = document.getElementById('sideCaption');
    const tipoPerfilInput = document.getElementById('tipoPerfilInput'); // Mapeia o campo hidden

    function selectMode(mode) {
        if (mode === 'hire') {
            btnHire.classList.add('active-hire');
            btnHire.classList.remove('active-work');
            btnWork.classList.remove('active-hire', 'active-work');
            panel.classList.remove('mode-work');

            birdWork.classList.remove('show');
            birdHire.classList.add('show');
            caption.innerHTML = '<div class="name">Araponga</div><div class="latin">Procnias nudicollis</div>';
            
            if (tipoPerfilInput) tipoPerfilInput.value = 'contratante'; // Atualiza o valor do form
        } else {
            btnWork.classList.remove('active-work');
            void btnWork.offsetWidth; // Força o reflow para reiniciar animação CSS
            btnWork.classList.add('active-work');
            btnHire.classList.remove('active-hire', 'active-work');
            panel.classList.add('mode-work');

            birdHire.classList.remove('show');
            birdWork.classList.add('show');
            caption.innerHTML = '<div class="name">Tiê-de-sangue</div><div class="latin">Ramphocelus bresilius</div>';
            
            if (tipoPerfilInput) tipoPerfilInput.value = 'trabalhador'; // Atualiza o valor do form
        }
    }

    // Adiciona os eventos diretamente nos botões se eles existirem na tela
    if (btnHire && btnWork) {
        btnHire.addEventListener('click', () => selectMode('hire'));
        btnWork.addEventListener('click', () => selectMode('work'));
    }
});