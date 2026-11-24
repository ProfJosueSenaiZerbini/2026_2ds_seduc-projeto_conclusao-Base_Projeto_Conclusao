// Proteção contra envio duplicado (duplo clique, Enter repetido) nos formulários com data-envio-unico:
// só o primeiro envio passa e os botões ficam desabilitados até a próxima página.
(function () {
    'use strict';

    document.querySelectorAll('form[data-envio-unico]').forEach(function (formulario) {
        const botoes = Array.from(formulario.querySelectorAll('button[type="submit"]'));
        let enviando = false;

        function liberar() {
            enviando = false;
            botoes.forEach(function (botao) {
                botao.disabled = false;
            });
        }

        formulario.addEventListener('submit', function (evento) {
            if (enviando) {
                evento.preventDefault();
                return;
            }
            // Outro script já recusou o envio (ex.: CEP não verificado).
            if (evento.defaultPrevented) return;
            enviando = true;

            // Desabilita depois que o navegador montou o envio e os demais scripts puderam recusá-lo.
            setTimeout(function () {
                if (evento.defaultPrevented) {
                    liberar();
                    return;
                }
                botoes.forEach(function (botao) {
                    botao.disabled = true;
                });
            }, 0);
        });

        // Voltar pelo histórico do navegador (página em cache): libera de novo.
        window.addEventListener('pageshow', function (evento) {
            if (evento.persisted) liberar();
        });
    });
})();
