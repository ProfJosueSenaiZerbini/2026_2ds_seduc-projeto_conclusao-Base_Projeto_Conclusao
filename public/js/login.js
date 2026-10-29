// Função para alternar entre "Quero Contratar" e "Quero Trabalhar"
function selecionarPerfil(perfil) {
    const cardContratar = document.getElementById('card-contratar');
    const cardTrabalhar = document.getElementById('card-trabalhar');
    const inputPerfil = document.getElementById('tipo_perfil'); // Ajustado para tipo_perfil (com underline)

    if (cardContratar && cardTrabalhar) {
        cardContratar.classList.remove('active');
        cardTrabalhar.classList.remove('active');
        
        if (perfil === 'Contratante') {
            cardContratar.classList.add('active');
        } else {
            cardTrabalhar.classList.add('active');
        }
    }

    // Atualiza o valor do input escondido para enviar no req.body
    if (inputPerfil) {
        inputPerfil.value = perfil;
    }
}

// Função para mostrar/esconder a senha
function toggleSenha() {
    const senhaInput = document.getElementById('senha');
    const icon = document.querySelector('.toggle-password');
    
    if (!senhaInput) return;

    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        senhaInput.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}