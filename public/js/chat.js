(function () {
    "use strict";

    var chatData = window.__CHAT__ || {};
    var mensagensEl = document.getElementById("chat-messages");
    var form = document.getElementById("form-chat");
    var inputMensagem = document.getElementById("input-mensagem");
    var btnEnviar = document.getElementById("btn-enviar");
    var typingIndicator = document.getElementById("typing-indicator");

    // =========================================================
    // Ajusta --vh para lidar com a barra de endereço do navegador
    // mobile mudando a altura útil da tela.
    // =========================================================
    function ajustarAlturaViewport() {
        document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
    }
    ajustarAlturaViewport();
    window.addEventListener("resize", ajustarAlturaViewport);
    window.addEventListener("orientationchange", ajustarAlturaViewport);

    // =========================================================
    // Scroll automático para a última mensagem
    // =========================================================
    function rolarParaFinal(suave) {
        if (!mensagensEl) return;
        if (suave) {
            mensagensEl.scrollTo({ top: mensagensEl.scrollHeight, behavior: "smooth" });
        } else {
            mensagensEl.scrollTop = mensagensEl.scrollHeight;
        }
    }

    // Ao carregar a página, vai direto para a última mensagem (sem animação)
    window.addEventListener("DOMContentLoaded", function () {
        rolarParaFinal(false);
    });
    // Garante o scroll mesmo depois de avatares/imagens carregarem e alterarem a altura
    window.addEventListener("load", function () {
        rolarParaFinal(false);
    });

    // =========================================================
    // Campo de mensagem: auto-resize + habilita/desabilita envio
    // =========================================================
    function ajustarAlturaCampo() {
        inputMensagem.style.height = "auto";
        inputMensagem.style.height = Math.min(inputMensagem.scrollHeight, 120) + "px";
    }

    function atualizarEstadoBotao() {
        var temTexto = inputMensagem.value.trim().length > 0;
        btnEnviar.disabled = !temTexto;
    }

    inputMensagem.addEventListener("input", function () {
        ajustarAlturaCampo();
        atualizarEstadoBotao();
    });

    // Enter envia, Shift+Enter quebra linha
    inputMensagem.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.requestSubmit();
        }
    });

    atualizarEstadoBotao();

    // =========================================================
    // Monta o elemento HTML de uma mensagem (mesmo padrão do EJS)
    // =========================================================
    function criarElementoMensagem(texto, horario, autor) {
        var wrapper = document.createElement("div");
        wrapper.className = "message message--" + (autor === "eu" ? "enviada" : "recebida");

        if (autor !== "eu") {
            var avatar = document.createElement("img");
            avatar.className = "message__avatar";
            avatar.src = chatData.contato ? chatData.contato.avatarUrl : "";
            avatar.alt = "";
            wrapper.appendChild(avatar);
        }

        var bolha = document.createElement("div");
        bolha.className = "message__bolha";

        var p = document.createElement("p");
        p.className = "message__texto";
        p.textContent = texto;

        var hora = document.createElement("span");
        hora.className = "message__hora";
        hora.textContent = horario;

        if (autor === "eu") {
            var check = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            check.setAttribute("class", "message__check");
            check.setAttribute("width", "15");
            check.setAttribute("height", "15");
            check.setAttribute("viewBox", "0 0 24 24");
            check.setAttribute("fill", "none");
            check.setAttribute("stroke", "currentColor");
            check.setAttribute("stroke-width", "2.2");
            check.setAttribute("stroke-linecap", "round");
            check.setAttribute("stroke-linejoin", "round");
            check.innerHTML = '<path d="M2 12l5 5L22 4"/>';
            hora.appendChild(check);
        }

        bolha.appendChild(p);
        bolha.appendChild(hora);
        wrapper.appendChild(bolha);
        return wrapper;
    }

    function horarioAgora() {
        var d = new Date();
        var h = String(d.getHours()).padStart(2, "0");
        var m = String(d.getMinutes()).padStart(2, "0");
        return h + ":" + m;
    }

    // =========================================================
    // Envio de mensagem (otimista: aparece na hora, depois confirma com o servidor)
    // =========================================================
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var texto = inputMensagem.value.trim();
        if (!texto) return;

        // Adiciona a mensagem na tela imediatamente
        var elemento = criarElementoMensagem(texto, horarioAgora(), "eu");
        mensagensEl.appendChild(elemento);
        rolarParaFinal(true);

        inputMensagem.value = "";
        ajustarAlturaCampo();
        atualizarEstadoBotao();
        inputMensagem.focus();

        if (!chatData.urlEnviar) return;

        try {
            var resposta = await fetch(chatData.urlEnviar, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    texto: texto,
                    destinatarioId: chatData.contato ? chatData.contato.id : null,
                    bicoId: chatData.bicoId || null,
                }),
            });

            if (!resposta.ok) {
                throw new Error("Falha ao enviar mensagem");
            }
            // Servidor confirmou o envio — nada mais a fazer aqui.
            // (poderia atualizar o ícone de "check" para "check duplo" com a resposta)
        } catch (erro) {
            elemento.classList.add("message--erro");
            var avisoErro = document.createElement("span");
            avisoErro.className = "message__erro-aviso";
            avisoErro.textContent = "Não enviada. Toque para tentar novamente.";
            elemento.querySelector(".message__bolha").appendChild(avisoErro);
        }
    });

    // Exemplo opcional de indicador "digitando..." (mostra/esconde sob demanda,
    // outro trecho da aplicação pode chamar essas funções via websocket/polling)
    window.mostrarDigitando = function () {
        typingIndicator.hidden = false;
        rolarParaFinal(true);
    };
    window.esconderDigitando = function () {
        typingIndicator.hidden = true;
    };
})();