(function () {
    'use strict';

    // ---------- Modais ----------
    function abrir(id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('aberto');
        modal.setAttribute('aria-hidden', 'false');
        var primeiro = modal.querySelector('input:not([disabled])');
        if (primeiro) primeiro.focus();
    }

    function fechar(id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('aberto');
        modal.setAttribute('aria-hidden', 'true');
    }

    // Funções globais (compatibilidade com onclick antigos)
    window.abrirModal = function () { abrir('modalEditarPerfil'); };
    window.fecharModal = function () { fechar('modalEditarPerfil'); };
    window.abrirModalSenha = function () { abrir('modalAlterarSenha'); };
    window.fecharModalSenha = function () { fechar('modalAlterarSenha'); };

    // Botões que abrem modais
    var aberturas = {
        btnEditarPerfil: 'modalEditarPerfil',
        btnAlterarSenha: 'modalAlterarSenha',
        btnAddHabilidade: 'modalHabilidade'
    };
    Object.keys(aberturas).forEach(function (btnId) {
        var btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', function () { abrir(aberturas[btnId]); });
    });

    // Botões de fechar / cancelar
    document.querySelectorAll('[data-fechar]').forEach(function (el) {
        el.addEventListener('click', function () { fechar(el.getAttribute('data-fechar')); });
    });

    // Clique no fundo escuro fecha o modal
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) fechar(overlay.id);
        });
    });

    // ESC fecha qualquer modal aberto
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay.aberto').forEach(function (m) { fechar(m.id); });
    });

    // ---------- Mostrar / ocultar CPF ----------
    var btnCpf = document.getElementById('btnToggleCpf');
    var cpfValor = document.getElementById('cpfValor');
    var cpfTexto = document.getElementById('cpfToggleTexto');
    if (btnCpf && cpfValor) {
        var cpfReal = cpfValor.getAttribute('data-cpf') || '';
        var oculto = false;
        btnCpf.addEventListener('click', function () {
            oculto = !oculto;
            cpfValor.textContent = oculto ? cpfReal.replace(/\d/g, '•') : cpfReal;
            cpfTexto.textContent = oculto ? 'Mostrar' : 'Ocultar';
            btnCpf.setAttribute('aria-pressed', String(oculto));
        });
    }

    // ---------- Validação: confirmar nova senha ----------
    var formSenha = document.getElementById('formSenha');
    if (formSenha) {
        formSenha.addEventListener('submit', function (e) {
            var nova = document.getElementById('novaSenha').value;
            var conf = document.getElementById('confirmarNovaSenha').value;
            var erro = document.getElementById('erroSenha');
            if (nova !== conf) {
                e.preventDefault();
                erro.hidden = false;
            } else {
                erro.hidden = true;
            }
        });
    }
})();