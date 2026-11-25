// Envia a foto de perfil assim que o arquivo é escolhido (views/Partials/fotoPerfilForm.ejs).
// O servidor confere o tipo (pelos bytes) e o tamanho; aqui só se evita um envio duplicado.
(function () {
    'use strict';

    document.querySelectorAll('form[data-foto-perfil]').forEach(function (form) {
        const arquivo = form.querySelector('input[type="file"]');
        if (!arquivo) return;

        let enviando = false;
        arquivo.addEventListener('change', function () {
            if (enviando || !arquivo.files || arquivo.files.length === 0) return;
            enviando = true;
            form.classList.add('enviando');
            form.submit();
        });
    });
})();
