(function () {
    "use strict";

    var chatData = window.__CHAT__ || {};
    var mensagensEl = document.getElementById("chat-messages");
    var form = document.getElementById("form-chat");
    var inputMensagem = document.getElementById("input-mensagem");
    var btnEnviar = document.getElementById("btn-enviar");
    var typingIndicator = document.getElementById("typing-indicator");
    var feedbackEl = document.getElementById("chat-feedback");
    var limiteCaracteres = 2000;
    var enviando = false;
    var consultandoMensagens = false;
    var idsMensagensExibidas = new Set();
    var ultimaMensagemId = 0;
    var usuarioId = Number(chatData.usuarioId);

    if (mensagensEl) {
        mensagensEl.querySelectorAll("[data-mensagem-id]").forEach(function (elemento) {
            var mensagemId = Number(elemento.dataset.mensagemId);
            if (Number.isSafeInteger(mensagemId) && mensagemId > 0) {
                idsMensagensExibidas.add(mensagemId);
                ultimaMensagemId = Math.max(ultimaMensagemId, mensagemId);
            }
        });
    }

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
        var texto = inputMensagem.value.trim();
        var tamanho = Array.from(texto).length;
        btnEnviar.disabled = enviando || tamanho === 0 || tamanho > limiteCaracteres;
        if (tamanho > limiteCaracteres) {
            mostrarFeedback("A mensagem deve ter no máximo 2.000 caracteres.");
        }
    }

    function mostrarFeedback(texto) {
        feedbackEl.textContent = texto;
    }

    inputMensagem.addEventListener("input", function () {
        ajustarAlturaCampo();
        if (Array.from(inputMensagem.value.trim()).length <= limiteCaracteres) {
            mostrarFeedback("");
        }
        atualizarEstadoBotao();
    });

    // Enter envia, Shift+Enter quebra linha
    inputMensagem.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!btnEnviar.disabled) {
                form.requestSubmit();
            }
        }
    });

    atualizarEstadoBotao();

    // =========================================================
    // Monta o elemento HTML de uma mensagem (mesmo padrão do EJS)
    // =========================================================
    function criarElementoMensagem(texto, horario, autor, autorNome, mensagemId) {
        var wrapper = document.createElement("div");
        wrapper.className = "message message--" + (autor === "eu" ? "enviada" : "recebida");
        if (Number.isSafeInteger(mensagemId) && mensagemId > 0) {
            wrapper.dataset.mensagemId = String(mensagemId);
        }

        if (autor !== "eu" && chatData.contato && chatData.contato.avatarUrl) {
            var avatar = document.createElement("img");
            avatar.className = "message__avatar";
            avatar.src = chatData.contato.avatarUrl;
            avatar.alt = "";
            wrapper.appendChild(avatar);
        }

        var bolha = document.createElement("div");
        bolha.className = "message__bolha";

        if (autorNome) {
            var nomeAutor = document.createElement("strong");
            nomeAutor.className = "message__autor";
            nomeAutor.textContent = autorNome;
            bolha.appendChild(nomeAutor);
        }

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

    function extrairHorario(criadoEm) {
        if (typeof criadoEm !== "string") {
            return "";
        }

        var correspondencia = criadoEm.match(/(?:T|\s)(\d{2}):(\d{2})/);
        return correspondencia ? correspondencia[1] + ":" + correspondencia[2] : "";
    }

    async function consultarNovasMensagens() {
        if (document.hidden || consultandoMensagens || !chatData.urlConsultar) {
            return;
        }

        consultandoMensagens = true;
        try {
            var separador = chatData.urlConsultar.includes("?") ? "&" : "?";
            var resposta = await fetch(
                chatData.urlConsultar + separador + "depoisDoId=" + encodeURIComponent(ultimaMensagemId),
                { method: "GET", credentials: "same-origin" }
            );

            if (!resposta.ok) {
                return;
            }

            var dados = await resposta.json();
            if (dados.sucesso !== true || !Array.isArray(dados.mensagens)) {
                return;
            }

            dados.mensagens.forEach(function (mensagem) {
                var mensagemId = Number(mensagem.id);
                var remetenteId = Number(mensagem.remetente_id);
                if (!Number.isSafeInteger(mensagemId) || mensagemId <= 0) {
                    return;
                }

                ultimaMensagemId = Math.max(ultimaMensagemId, mensagemId);
                if (idsMensagensExibidas.has(mensagemId)) {
                    return;
                }

                var autor = remetenteId === usuarioId ? "eu" : "outro";
                var elemento = criarElementoMensagem(
                    mensagem.texto,
                    extrairHorario(mensagem.criado_em),
                    autor,
                    mensagem.remetente_nome,
                    mensagemId
                );
                idsMensagensExibidas.add(mensagemId);
                mensagensEl.appendChild(elemento);
            });

            if (dados.mensagens.length > 0) {
                rolarParaFinal(true);
            }
        } catch (_erro) {
            // Falhas temporárias são ignoradas; a próxima consulta tenta novamente.
        } finally {
            consultandoMensagens = false;
        }
    }

    window.setInterval(consultarNovasMensagens, 3000);
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            consultarNovasMensagens();
        }
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var texto = inputMensagem.value.trim();
        var tamanho = Array.from(texto).length;
        if (enviando) return;
        if (!texto) {
            mostrarFeedback("Digite uma mensagem antes de enviar.");
            atualizarEstadoBotao();
            return;
        }
        if (tamanho > limiteCaracteres) {
            mostrarFeedback("A mensagem deve ter no máximo 2.000 caracteres.");
            atualizarEstadoBotao();
            return;
        }
        if (!chatData.urlEnviar || !chatData.candidaturaId) {
            mostrarFeedback("Não foi possível identificar esta conversa. Recarregue a página e tente novamente.");
            return;
        }

        enviando = true;
        inputMensagem.disabled = true;
        atualizarEstadoBotao();
        mostrarFeedback("");
        try {
            var resposta = await fetch(chatData.urlEnviar, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ texto: texto }),
            });

            var dados;
            try {
                dados = await resposta.json();
            } catch (_erroJson) {
                throw new Error("O servidor retornou uma resposta inválida.");
            }

            if (!resposta.ok) {
                throw new Error(dados && typeof dados.erro === "string"
                    ? dados.erro
                    : "Não foi possível enviar a mensagem.");
            }

            if (dados.sucesso !== true || !dados.mensagem ||
                typeof dados.mensagem.texto !== "string" ||
                typeof dados.mensagem.criado_em !== "string" ||
                !Number.isSafeInteger(Number(dados.mensagem.id)) ||
                Number(dados.mensagem.id) <= 0) {
                throw new Error("O servidor não confirmou o envio da mensagem.");
            }

            var elemento = criarElementoMensagem(
                dados.mensagem.texto,
                extrairHorario(dados.mensagem.criado_em),
                "eu",
                dados.mensagem.remetente_nome,
                Number(dados.mensagem.id)
            );
            var mensagemId = Number(dados.mensagem.id);
            if (!idsMensagensExibidas.has(mensagemId)) {
                mensagensEl.appendChild(elemento);
                idsMensagensExibidas.add(mensagemId);
                ultimaMensagemId = Math.max(ultimaMensagemId, mensagemId);
                rolarParaFinal(true);
            }
            inputMensagem.value = "";
            ajustarAlturaCampo();
            mostrarFeedback("");
        } catch (erro) {
            var erroDeRede = erro instanceof TypeError;
            mostrarFeedback(erroDeRede
                ? "Falha de conexão. Verifique sua rede e tente enviar novamente."
                : erro.message || "Não foi possível enviar a mensagem. Tente novamente.");
        } finally {
            enviando = false;
            inputMensagem.disabled = false;
            atualizarEstadoBotao();
            inputMensagem.focus();
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