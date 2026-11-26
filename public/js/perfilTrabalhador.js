(function () {
    'use strict';

    // ---------- Modais ----------
    function abrir(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('pt-aberto');
        modal.setAttribute('aria-hidden', 'false');
        const primeiro = modal.querySelector('input:not([disabled])');
        if (primeiro) primeiro.focus();
    }

    function fechar(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('pt-aberto');
        modal.setAttribute('aria-hidden', 'true');
    }

    // Botões que abrem modais
    const aberturas = {
        ptBtnEditar: 'ptModalEditar',
        ptBtnSenha: 'ptModalSenha'
    };
    Object.keys(aberturas).forEach(function (btnId) {
        const btn = document.getElementById(btnId);
        if (btn)
            btn.addEventListener('click', function () {
                abrir(aberturas[btnId]);
            });
    });

    // Botões de fechar / cancelar
    document.querySelectorAll('[data-pt-fechar]').forEach(function (el) {
        el.addEventListener('click', function () {
            fechar(el.getAttribute('data-pt-fechar'));
        });
    });

    // Clique no fundo escuro fecha o modal
    document.querySelectorAll('.pt-modal-overlay').forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) fechar(overlay.id);
        });
    });

    // ESC fecha qualquer modal aberto
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.pt-modal-overlay.pt-aberto').forEach(function (m) {
            fechar(m.id);
        });
    });

    // ---------- Mostrar / ocultar CPF ----------
    const btnCpf = document.getElementById('ptBtnCpf');
    const cpfValor = document.getElementById('ptCpfValor');
    const cpfTexto = document.getElementById('ptCpfTexto');
    if (btnCpf && cpfValor) {
        const cpfReal = cpfValor.getAttribute('data-cpf') || '';
        let oculto = false;
        btnCpf.addEventListener('click', function () {
            oculto = !oculto;
            cpfValor.textContent = oculto ? cpfReal.replace(/\d/g, '•') : cpfReal;
            cpfTexto.textContent = oculto ? 'Mostrar' : 'Ocultar';
            btnCpf.setAttribute('aria-pressed', String(oculto));
        });
    }

    // ---------- Validação: confirmar nova senha ----------
    const formSenha = document.getElementById('ptFormSenha');
    if (formSenha) {
        formSenha.addEventListener('submit', function (e) {
            const nova = document.getElementById('novaSenha').value;
            const conf = document.getElementById('confirmarNovaSenha').value;
            const erro = document.getElementById('ptErroSenha');
            if (nova !== conf) {
                e.preventDefault();
                erro.hidden = false;
            } else {
                erro.hidden = true;
            }
        });
    }
})();
