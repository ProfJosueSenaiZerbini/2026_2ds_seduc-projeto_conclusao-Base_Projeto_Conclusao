// Sino de notificações do trabalhador (views/Partials/headertrabalhador.ejs).
// - Consulta GET /notificacoes ao abrir a página e a cada 20 s (pausa com a aba escondida).
// - Notificação nova (não lida e ainda não avisada neste navegador): aviso na tela + som curto.
// - Abrir o painel marca como lidas até a mais nova mostrada (POST /notificacoes/lidas).
// O som é gerado com a Web Audio API (sem arquivo). Os navegadores só liberam áudio depois de algum clique
// ou tecla na página; antes disso o aviso aparece sem som.
(function () {
    'use strict';

    const raiz = document.querySelector('[data-notificacoes]');
    if (!raiz) return;

    const botao = document.getElementById('notificacoesBotao');
    const contador = document.getElementById('notificacoesContador');
    const painel = document.getElementById('notificacoesPainel');
    const lista = document.getElementById('notificacoesLista');
    const vazio = document.getElementById('notificacoesVazio');
    const botaoSom = document.getElementById('notificacoesSom');
    const avisos = document.getElementById('notificacoesAvisos');

    const INTERVALO_MS = Number(window.ibicoNotificacoesIntervaloMs) || 20000;
    const usuario = raiz.getAttribute('data-usuario') || 'anonimo';
    const CHAVE_AVISADO = 'ibico:notificacoes:avisado:' + usuario;
    const CHAVE_SOM = 'ibico:notificacoes:som';

    let notificacoes = [];
    let destacadas = new Set(); // ids que estavam não lidos quando o painel abriu
    let temporizador = null;
    let parado = false;

    // ---------- armazenamento local (pode falhar em janela anônima: tudo segue funcionando) ----------
    const ler = (chave) => {
        try {
            return window.localStorage.getItem(chave);
        } catch {
            return null;
        }
    };
    const gravar = (chave, valor) => {
        try {
            window.localStorage.setItem(chave, valor);
        } catch {
            /* sem armazenamento: o aviso pode repetir na próxima página */
        }
    };

    // ---------- som ----------
    let audio = null;
    const somLigado = () => ler(CHAVE_SOM) !== 'desligado';

    const contextoDeAudio = () => {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (!Contexto) return null;
        if (!audio) audio = new Contexto();
        return audio;
    };

    // O navegador só libera o áudio depois de uma interação: na primeira, o contexto é criado e retomado.
    const liberarAudio = () => {
        const contexto = contextoDeAudio();
        if (contexto && contexto.state === 'suspended') contexto.resume().catch(() => {});
    };
    document.addEventListener('pointerdown', liberarAudio, { once: true });
    document.addEventListener('keydown', liberarAudio, { once: true });

    // "Plim" de duas notas curtas.
    const tocarSom = () => {
        if (!somLigado()) return;
        const contexto = contextoDeAudio();
        if (!contexto || contexto.state !== 'running') return;

        const inicio = contexto.currentTime;
        [
            [880, 0],
            [1320, 0.12]
        ].forEach(function ([frequencia, atraso]) {
            const oscilador = contexto.createOscillator();
            const volume = contexto.createGain();
            oscilador.type = 'sine';
            oscilador.frequency.value = frequencia;
            volume.gain.setValueAtTime(0.0001, inicio + atraso);
            volume.gain.exponentialRampToValueAtTime(0.18, inicio + atraso + 0.02);
            volume.gain.exponentialRampToValueAtTime(0.0001, inicio + atraso + 0.35);
            oscilador.connect(volume).connect(contexto.destination);
            oscilador.start(inicio + atraso);
            oscilador.stop(inicio + atraso + 0.4);
        });
    };

    const atualizarBotaoSom = () => {
        const ligado = somLigado();
        botaoSom.setAttribute('aria-pressed', String(ligado));
        botaoSom.querySelector('i').className = ligado ? 'ph ph-speaker-high' : 'ph ph-speaker-slash';
        botaoSom.querySelector('span').textContent = ligado ? 'Som ligado' : 'Som desligado';
    };

    botaoSom.addEventListener('click', function () {
        gravar(CHAVE_SOM, somLigado() ? 'desligado' : 'ligado');
        atualizarBotaoSom();
        if (somLigado()) {
            liberarAudio();
            tocarSom();
        }
    });

    // ---------- textos ----------
    const ICONES = {
        aceita: 'ph-check-circle',
        recusada: 'ph-x-circle',
        'outro-escolhido': 'ph-user-switch',
        'bico-cancelado': 'ph-prohibit'
    };

    const tempoRelativo = (iso) => {
        const data = iso ? new Date(iso) : null;
        if (!data || Number.isNaN(data.getTime())) return '';
        const minutos = Math.round((Date.now() - data.getTime()) / 60000);
        if (minutos < 1) return 'agora';
        if (minutos < 60) return 'há ' + minutos + ' min';
        const horas = Math.round(minutos / 60);
        if (horas < 24) return 'há ' + horas + ' h';
        const dias = Math.round(horas / 24);
        if (dias < 7) return dias === 1 ? 'há 1 dia' : 'há ' + dias + ' dias';
        return data.toLocaleDateString('pt-BR');
    };

    const elemento = (tag, classe, texto) => {
        const el = document.createElement(tag);
        if (classe) el.className = classe;
        if (texto != null) el.textContent = texto;
        return el;
    };

    // ---------- desenho ----------
    const desenharContador = (naoLidas) => {
        if (naoLidas > 0) {
            contador.textContent = naoLidas > 9 ? '9+' : String(naoLidas);
            contador.hidden = false;
            botao.setAttribute(
                'aria-label',
                'Notificações: ' + naoLidas + (naoLidas === 1 ? ' não lida' : ' não lidas')
            );
        } else {
            contador.hidden = true;
            botao.setAttribute('aria-label', 'Notificações');
        }
    };

    const desenharLista = () => {
        lista.replaceChildren();
        vazio.hidden = notificacoes.length > 0;

        notificacoes.forEach(function (n) {
            // As que eram novas ao abrir o painel continuam destacadas até ele fechar, mesmo já marcadas.
            const nova = !n.lida || destacadas.has(n.id);
            const item = elemento('li', 'notificacao notificacao--' + n.tipo + (nova ? ' notificacao--nova' : ''));
            const link = elemento('a', 'notificacao__link');
            link.href = n.href;
            link.dataset.notificacaoId = String(n.id);

            const icone = elemento('i', 'ph-fill ' + (ICONES[n.tipo] || 'ph-bell') + ' notificacao__icone');
            icone.setAttribute('aria-hidden', 'true');

            const corpo = elemento('span', 'notificacao__corpo');
            corpo.append(elemento('strong', 'notificacao__titulo', n.titulo));
            corpo.append(elemento('span', 'notificacao__mensagem', n.mensagem));
            if (n.motivo) corpo.append(elemento('span', 'notificacao__motivo', 'Motivo: ' + n.motivo));
            const quando = tempoRelativo(n.quando);
            if (quando) {
                const tempo = elemento('time', 'notificacao__quando', quando);
                tempo.dateTime = n.quando;
                corpo.append(tempo);
            }

            link.append(icone, corpo);
            item.append(link);
            lista.append(item);
        });
    };

    const mostrarAviso = (n, quantidade) => {
        const aviso = elemento('a', 'notificacoes-aviso notificacoes-aviso--' + n.tipo);
        aviso.href = n.href;
        const icone = elemento('i', 'ph-fill ' + (ICONES[n.tipo] || 'ph-bell') + ' notificacoes-aviso__icone');
        icone.setAttribute('aria-hidden', 'true');
        const texto = elemento('span', 'notificacoes-aviso__texto');
        texto.append(elemento('strong', null, n.titulo));
        texto.append(
            elemento('span', null, quantidade > 1 ? n.mensagem + ' (e mais ' + (quantidade - 1) + ')' : n.mensagem)
        );
        aviso.append(icone, texto);
        avisos.append(aviso);

        window.setTimeout(function () {
            aviso.classList.add('saindo');
            window.setTimeout(function () {
                aviso.remove();
            }, 400);
        }, 7000);
    };

    // ---------- dados ----------
    const avisarNovas = () => {
        const jaAvisado = Number(ler(CHAVE_AVISADO) || 0);
        const novas = notificacoes.filter(function (n) {
            return !n.lida && n.id > jaAvisado;
        });
        if (novas.length === 0) return;

        gravar(CHAVE_AVISADO, String(novas[0].id)); // a lista vem da mais nova para a mais antiga
        mostrarAviso(novas[0], novas.length);
        tocarSom();
    };

    const parar = () => {
        parado = true;
        window.clearTimeout(temporizador);
    };

    const agendar = () => {
        window.clearTimeout(temporizador);
        if (!parado && !document.hidden) temporizador = window.setTimeout(carregar, INTERVALO_MS);
    };

    async function carregar() {
        try {
            const resposta = await fetch('/notificacoes', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });
            const ehJson = (resposta.headers.get('content-type') || '').includes('application/json');
            // Sessão encerrada (redireciona para o login) ou perfil sem acesso: para de consultar.
            if (resposta.redirected || !ehJson || resposta.status === 401 || resposta.status === 403) {
                parar();
                return;
            }
            if (!resposta.ok) return;

            const dados = await resposta.json();
            notificacoes = Array.isArray(dados.notificacoes) ? dados.notificacoes : [];
            desenharContador(Number(dados.naoLidas) || 0);
            if (!painel.hidden) desenharLista();
            avisarNovas();
        } catch {
            /* rede instável: tenta de novo no próximo ciclo */
        } finally {
            agendar();
        }
    }

    const marcarComoLidas = async () => {
        const maisNova = notificacoes[0];
        if (!maisNova || notificacoes.every((n) => n.lida)) return;
        gravar(CHAVE_AVISADO, String(Math.max(Number(ler(CHAVE_AVISADO) || 0), maisNova.id)));
        try {
            const resposta = await fetch('/notificacoes/lidas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ ateId: maisNova.id })
            });
            if (resposta.ok) {
                notificacoes.forEach(function (n) {
                    if (n.id <= maisNova.id) n.lida = true;
                });
                desenharContador(0);
            }
        } catch {
            /* fica para a próxima vez que o painel abrir */
        }
    };

    // ---------- painel ----------
    const abrir = () => {
        destacadas = new Set(notificacoes.filter((n) => !n.lida).map((n) => n.id));
        desenharLista();
        painel.hidden = false;
        botao.setAttribute('aria-expanded', 'true');
        marcarComoLidas(); // o destaque das novas continua até o painel fechar
    };

    const fechar = (devolverFoco) => {
        if (painel.hidden) return;
        painel.hidden = true;
        destacadas = new Set();
        botao.setAttribute('aria-expanded', 'false');
        if (devolverFoco) botao.focus();
    };

    botao.addEventListener('click', function () {
        if (painel.hidden) abrir();
        else fechar(false);
    });

    document.addEventListener('click', function (evento) {
        if (!raiz.contains(evento.target)) fechar(false);
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') fechar(true);
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) window.clearTimeout(temporizador);
        else if (!parado) carregar();
    });

    atualizarBotaoSom();
    carregar();
})();
