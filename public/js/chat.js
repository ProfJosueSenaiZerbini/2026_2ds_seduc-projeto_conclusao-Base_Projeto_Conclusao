(function () {
    'use strict';

    const chatData = window.__CHAT__ || {};
    const mensagensEl = document.getElementById('chat-messages');
    const form = document.getElementById('form-chat');
    const inputMensagem = document.getElementById('input-mensagem');
    const btnEnviar = document.getElementById('btn-enviar');
    const typingIndicator = document.getElementById('typing-indicator');
    const feedbackEl = document.getElementById('chat-feedback');
    const limiteCaracteres = 2000;
    let enviando = false;
    let consultandoMensagens = false;
    const idsMensagensExibidas = new Set();
    let ultimaMensagemId = 0;
    const usuarioId = Number(chatData.usuarioId);

    if (mensagensEl) {
        mensagensEl.querySelectorAll('[data-mensagem-id]').forEach(function (elemento) {
            const mensagemId = Number(elemento.dataset.mensagemId);
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
        document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
    }
    ajustarAlturaViewport();
    window.addEventListener('resize', ajustarAlturaViewport);
    window.addEventListener('orientationchange', ajustarAlturaViewport);

    // =========================================================
    // Scroll automático para a última mensagem
    // =========================================================
    function rolarParaFinal(suave) {
        if (!mensagensEl) return;
        if (suave) {
            mensagensEl.scrollTo({ top: mensagensEl.scrollHeight, behavior: 'smooth' });
        } else {
            mensagensEl.scrollTop = mensagensEl.scrollHeight;
        }
    }

    // Ao carregar a página, vai direto para a última mensagem (sem animação)
    window.addEventListener('DOMContentLoaded', function () {
        rolarParaFinal(false);
    });
    // Garante o scroll mesmo depois de avatares/imagens carregarem e alterarem a altura
    window.addEventListener('load', function () {
        rolarParaFinal(false);
    });

    // =========================================================
    // Campo de mensagem: auto-resize + habilita/desabilita envio
    // =========================================================
    function ajustarAlturaCampo() {
        inputMensagem.style.height = 'auto';
        inputMensagem.style.height = Math.min(inputMensagem.scrollHeight, 120) + 'px';
    }

    function atualizarEstadoBotao() {
        const texto = inputMensagem.value.trim();
        const tamanho = Array.from(texto).length;
        btnEnviar.disabled = enviando || tamanho === 0 || tamanho > limiteCaracteres;
        if (tamanho > limiteCaracteres) {
            mostrarFeedback('A mensagem deve ter no máximo 2.000 caracteres.');
        }
    }

    function mostrarFeedback(texto) {
        feedbackEl.textContent = texto;
    }

    inputMensagem.addEventListener('input', function () {
        ajustarAlturaCampo();
        if (Array.from(inputMensagem.value.trim()).length <= limiteCaracteres) {
            mostrarFeedback('');
        }
        atualizarEstadoBotao();
    });

    // Enter envia, Shift+Enter quebra linha
    inputMensagem.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
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
        const wrapper = document.createElement('div');
        wrapper.className = 'message message--' + (autor === 'eu' ? 'enviada' : 'recebida');
        if (Number.isSafeInteger(mensagemId) && mensagemId > 0) {
            wrapper.dataset.mensagemId = String(mensagemId);
        }

        if (autor !== 'eu' && chatData.contato && chatData.contato.avatarUrl) {
            const avatar = document.createElement('img');
            avatar.className = 'message__avatar';
            avatar.src = chatData.contato.avatarUrl;
            avatar.alt = '';
            wrapper.appendChild(avatar);
        }

        const bolha = document.createElement('div');
        bolha.className = 'message__bolha';

        if (autorNome) {
            const nomeAutor = document.createElement('strong');
            nomeAutor.className = 'message__autor';
            nomeAutor.textContent = autorNome;
            bolha.appendChild(nomeAutor);
        }

        const p = document.createElement('p');
        p.className = 'message__texto';
        p.textContent = texto;

        const hora = document.createElement('span');
        hora.className = 'message__hora';
        hora.textContent = horario;

        if (autor === 'eu') {
            const check = document.createElement('i');
            check.className = 'message__check ph ph-check';
            check.setAttribute('aria-hidden', 'true');
            hora.appendChild(check);
        }

        bolha.appendChild(p);
        bolha.appendChild(hora);
        wrapper.appendChild(bolha);
        return wrapper;
    }

    // Mantém a ordem dos ids: uma mensagem do outro lado pode chegar depois de uma própria, mais nova.
    function inserirMensagem(elemento, mensagemId) {
        const posterior = Array.from(mensagensEl.querySelectorAll('[data-mensagem-id]')).find(function (existente) {
            return Number(existente.dataset.mensagemId) > mensagemId;
        });
        mensagensEl.insertBefore(elemento, posterior || null);
        idsMensagensExibidas.add(mensagemId);
    }

    function extrairHorario(criadoEm) {
        if (typeof criadoEm !== 'string') {
            return '';
        }

        const correspondencia = criadoEm.match(/(?:T|\s)(\d{2}):(\d{2})/);
        return correspondencia ? correspondencia[1] + ':' + correspondencia[2] : '';
    }

    async function consultarNovasMensagens() {
        if (document.hidden || consultandoMensagens || !chatData.urlConsultar) {
            return;
        }

        consultandoMensagens = true;
        try {
            const separador = chatData.urlConsultar.includes('?') ? '&' : '?';
            const resposta = await fetch(
                chatData.urlConsultar + separador + 'depoisDoId=' + encodeURIComponent(ultimaMensagemId),
                { method: 'GET', credentials: 'same-origin' }
            );

            if (!resposta.ok) {
                return;
            }

            const dados = await resposta.json();
            if (dados.sucesso !== true || !Array.isArray(dados.mensagens)) {
                return;
            }

            dados.mensagens.forEach(function (mensagem) {
                const mensagemId = Number(mensagem.id);
                const remetenteId = Number(mensagem.remetente_id);
                if (!Number.isSafeInteger(mensagemId) || mensagemId <= 0) {
                    return;
                }

                ultimaMensagemId = Math.max(ultimaMensagemId, mensagemId);
                if (idsMensagensExibidas.has(mensagemId)) {
                    return;
                }

                const autor = remetenteId === usuarioId ? 'eu' : 'outro';
                const elemento = criarElementoMensagem(
                    mensagem.texto,
                    extrairHorario(mensagem.criado_em),
                    autor,
                    mensagem.remetente_nome,
                    mensagemId
                );
                inserirMensagem(elemento, mensagemId);
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
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            consultarNovasMensagens();
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const texto = inputMensagem.value.trim();
        const tamanho = Array.from(texto).length;
        if (enviando) return;
        if (!texto) {
            mostrarFeedback('Digite uma mensagem antes de enviar.');
            atualizarEstadoBotao();
            return;
        }
        if (tamanho > limiteCaracteres) {
            mostrarFeedback('A mensagem deve ter no máximo 2.000 caracteres.');
            atualizarEstadoBotao();
            return;
        }
        if (!chatData.urlEnviar || !chatData.candidaturaId) {
            mostrarFeedback('Não foi possível identificar esta conversa. Recarregue a página e tente novamente.');
            return;
        }

        enviando = true;
        inputMensagem.disabled = true;
        atualizarEstadoBotao();
        mostrarFeedback('');
        try {
            const resposta = await fetch(chatData.urlEnviar, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ texto: texto })
            });

            let dados;
            try {
                dados = await resposta.json();
            } catch (_erroJson) {
                throw new Error('O servidor retornou uma resposta inválida.');
            }

            if (!resposta.ok) {
                throw new Error(
                    dados && typeof dados.erro === 'string' ? dados.erro : 'Não foi possível enviar a mensagem.'
                );
            }

            if (
                dados.sucesso !== true ||
                !dados.mensagem ||
                typeof dados.mensagem.texto !== 'string' ||
                typeof dados.mensagem.criado_em !== 'string' ||
                !Number.isSafeInteger(Number(dados.mensagem.id)) ||
                Number(dados.mensagem.id) <= 0
            ) {
                throw new Error('O servidor não confirmou o envio da mensagem.');
            }

            const elemento = criarElementoMensagem(
                dados.mensagem.texto,
                extrairHorario(dados.mensagem.criado_em),
                'eu',
                dados.mensagem.remetente_nome,
                Number(dados.mensagem.id)
            );
            const mensagemId = Number(dados.mensagem.id);
            // Não avança ultimaMensagemId aqui: só a consulta periódica sabe até onde já recebeu tudo.
            if (!idsMensagensExibidas.has(mensagemId)) {
                inserirMensagem(elemento, mensagemId);
                rolarParaFinal(true);
            }
            inputMensagem.value = '';
            ajustarAlturaCampo();
            mostrarFeedback('');
        } catch (erro) {
            const erroDeRede = erro instanceof TypeError;
            mostrarFeedback(
                erroDeRede
                    ? 'Falha de conexão. Verifique sua rede e tente enviar novamente.'
                    : erro.message || 'Não foi possível enviar a mensagem. Tente novamente.'
            );
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
