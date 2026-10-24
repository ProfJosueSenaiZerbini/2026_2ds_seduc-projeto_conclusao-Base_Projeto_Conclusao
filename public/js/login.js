document.addEventListener('DOMContentLoaded', () => {
    const btnHire = document.getElementById('btnHire');
    const btnWork = document.getElementById('btnWork');
    const panel = document.getElementById('panel');
    const birdHire = document.getElementById('birdHire');
    const birdWork = document.getElementById('birdWork');
    const caption = document.getElementById('sideCaption');
    const tipoPerfilInput = document.getElementById('tipoPerfilInput'); // Mapeia o campo hidden
    const title = document.getElementById('loginTitle');
    const subtitle = document.getElementById('loginSubtitle');
    const captions = {
        hire: '<span class="caption-eyebrow">Para quem contrata</span><div class="name">Araponga</div><div class="latin">Procnias nudicollis</div><div class="image-credit">Foto: <a href="https://commons.wikimedia.org/wiki/File:Araponga-comum_-_PE_Tur%C3%ADstico_do_Alto_Ribeira_-_Clodomiro_Esteves_Junior%28001%29.jpg" target="_blank" rel="noopener noreferrer">Clodomiro Esteves Junior</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> · enquadramento e cores ajustados em CSS</div>',
        work: '<span class="caption-eyebrow">Para quem trabalha</span><div class="name">Tiê-de-sangue</div><div class="latin">Ramphocelus bresilius</div><div class="image-credit">Foto: <a href="https://commons.wikimedia.org/wiki/File:Ramphocelus_bresilius_-Sao_Paulo_Bagre,_Cananeia,_Sao_Paulo,_Brasil_-male-8.jpg" target="_blank" rel="noopener noreferrer">Dario Sanches</a> · <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 2.0</a> · enquadramento e cores ajustados em CSS</div>'
    };

    function updateCaption(mode) {
        caption.classList.add('is-changing');
        window.requestAnimationFrame(() => {
            caption.innerHTML = captions[mode];
            caption.classList.remove('is-changing');
        });
    }

    function selectMode(mode) {
        if (mode === 'hire') {
            btnHire.classList.add('active-hire');
            btnHire.classList.remove('active-work');
            btnWork.classList.remove('active-hire', 'active-work');
            panel.classList.remove('mode-work');

            birdWork.classList.remove('show');
            birdHire.classList.add('show');
            updateCaption('hire');
            title.textContent = 'Sua próxima oportunidade começa aqui';
            subtitle.textContent = 'Acesse sua conta de contratante e encontre talentos para seus bicos.';

            if (tipoPerfilInput) tipoPerfilInput.value = 'contratante'; // Atualiza o valor do form
        } else {
            btnWork.classList.remove('active-work');
            void btnWork.offsetWidth; // Força o reflow para reiniciar animação CSS
            btnWork.classList.add('active-work');
            btnHire.classList.remove('active-hire', 'active-work');
            panel.classList.add('mode-work');

            birdHire.classList.remove('show');
            birdWork.classList.add('show');
            updateCaption('work');
            title.textContent = 'Encontre seu próximo bico';
            subtitle.textContent = 'Acesse sua conta de trabalhador e descubra novas oportunidades.';

            if (tipoPerfilInput) tipoPerfilInput.value = 'trabalhador'; // Atualiza o valor do form
        }
    }

    // Adiciona os eventos diretamente nos botões se eles existirem na tela
    if (btnHire && btnWork) {
        btnHire.addEventListener('click', () => selectMode('hire'));
        btnWork.addEventListener('click', () => selectMode('work'));
        selectMode(tipoPerfilInput?.value === 'trabalhador' ? 'work' : 'hire');
    }

    const passwordField = document.querySelector('.password-field');
    const passwordInput = passwordField?.querySelector('input[name="senha"]');
    const passwordToggle = passwordField?.querySelector('.eye');

    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const isVisible = passwordInput.type === 'password';
            passwordInput.type = isVisible ? 'text' : 'password';
            passwordToggle.setAttribute('aria-pressed', String(isVisible));
            passwordToggle.setAttribute('aria-label', isVisible ? 'Ocultar senha' : 'Mostrar senha');
        });
    }

    const avisoErro = document.querySelector('.erro-passarinho-login');

    if (avisoErro) {
        setTimeout(() => {
            avisoErro.classList.add('sumindo');

            setTimeout(() => {
                avisoErro.remove();
            }, 500);
        }, 4000);
    }

});