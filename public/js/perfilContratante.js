// Funções do Modal de Editar Perfil
function abrirModal() {
    const modal = document.getElementById('modalEditarPerfil');
    if (modal) modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modalEditarPerfil');
    if (modal) modal.style.display = 'none';
}

// Funções do Modal de Alterar Senha (ADICIONE ESTAS DUAS)
function abrirModalSenha() {
    const modal = document.getElementById('modalAlterarSenha');
    if (modal) modal.style.display = 'flex';
}

function fecharModalSenha() {
    const modal = document.getElementById('modalAlterarSenha');
    if (modal) modal.style.display = 'none';
}

// Evento para fechar os modais ao clicar no fundo escuro
window.addEventListener('click', function (event) {
    const modalPerfil = document.getElementById('modalEditarPerfil');
    const modalSenha = document.getElementById('modalAlterarSenha');

    if (event.target === modalPerfil) fecharModal();
    if (event.target === modalSenha) fecharModalSenha();
});