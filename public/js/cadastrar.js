// Espera o documento carregar completamente
document.addEventListener('DOMContentLoaded', () => {

    // 1. Alternar entre "Quero Contratar" e "Quero Trabalhar"
    window.selecionarPerfil = function(perfil) {
        const cardContratar = document.querySelector('[data-role="contratante"]');
        const cardTrabalhar = document.querySelector('[data-role="trabalhador"]');
        const inputPerfil = document.getElementById('tipoPerfilInput');

        if (cardContratar && cardTrabalhar) {
            cardContratar.classList.remove('active');
            cardTrabalhar.classList.remove('active');

            if (perfil === 'Contratante') {
                cardContratar.classList.add('active');
            } else {
                cardTrabalhar.classList.add('active');
            }
        }

        if (inputPerfil) {
            inputPerfil.value = perfil;
        }
    };

    // Adiciona o evento de clique direto nos cards do HTML
    const cardTrabalhador = document.querySelector('[data-role="trabalhador"]');
    const cardContratante = document.querySelector('[data-role="contratante"]');

    if (cardTrabalhador) {
        cardTrabalhador.addEventListener('click', () => selecionarPerfil('Trabalhador'));
    }
    if (cardContratante) {
        cardContratante.addEventListener('click', () => selecionarPerfil('Contratante'));
    }


    // 2. Mostrar/Esconder a senha
    const toggleButtons = document.querySelectorAll('[data-toggle-password]');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.getAttribute('data-toggle-password');
            const inputField = document.getElementById(inputId);

            if (inputField) {
                if (inputField.type === 'password') {
                    inputField.type = 'text';
                    this.textContent = '🙈'; // Troca o ícone/emoji quando a senha fica visível
                } else {
                    inputField.type = 'password';
                    this.textContent = '👁️'; // Troca de volta para o olho
                }
            }
        });
    });

});