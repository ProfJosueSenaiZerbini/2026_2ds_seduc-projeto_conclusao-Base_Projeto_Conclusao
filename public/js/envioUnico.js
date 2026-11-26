// Proteção contra envio duplicado (duplo clique, Enter repetido) nos formulários com data-envio-unico:
// só o primeiro envio passa e os botões ficam desabilitados até a próxima página.
// Formulários com o mesmo valor no atributo (ex.: data-envio-unico="candidatura") formam um grupo: depois que
// um deles é enviado, os outros também ficam bloqueados.
(function () {
    'use strict';

    const grupos = new Map();

    document.querySelectorAll('form[data-envio-unico]').forEach(function (formulario) {
        const chave = formulario.getAttribute('data-envio-unico') || formulario;
        const grupo = grupos.get(chave) || { enviando: false, botoes: [] };
        grupos.set(chave, grupo);
        grupo.botoes.push(...formulario.querySelectorAll('button[type="submit"]'));

        formulario.addEventListener('submit', function (evento) {
            if (grupo.enviando) {
                evento.preventDefault();
                return;
            }
            // Outro script já recusou o envio (ex.: CEP não verificado).
            if (evento.defaultPrevented) return;
            grupo.enviando = true;

            // Desabilita depois que o navegador montou o envio e os demais scripts puderam recusá-lo.
            setTimeout(function () {
                if (evento.defaultPrevented) {
                    liberar(grupo);
                    return;
                }
                grupo.botoes.forEach(function (botao) {
                    botao.disabled = true;
                });
            }, 0);
        });
    });

    function liberar(grupo) {
        grupo.enviando = false;
        grupo.botoes.forEach(function (botao) {
            botao.disabled = false;
        });
    }

    // Voltar pelo histórico do navegador (página em cache): libera de novo.
    window.addEventListener('pageshow', function (evento) {
        if (evento.persisted) grupos.forEach(liberar);
    });
})();
