// Mascotes do iBico (araponga = contratante, tiê-sangue = trabalhador).
// Movimentos, durações e sons iguais aos de Docs/mascotes/referencia-css-js.html.
// API: window.Mascotes.comemorar(el) · .triste(el) · .asas(el) · .pousar(el) · .piscar(el) · .curioso(el) · .criar(ave, opcoes)
(function () {
    'use strict';

    var DIMENSOES = { araponga: [384, 359], tie: [393, 310] };
    var movimentoReduzido = function () {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    // ---------- preferência de som (localStorage com try/catch) ----------
    var CHAVE_SOM = 'ibico:som';
    function somLigado() {
        try {
            return window.localStorage.getItem(CHAVE_SOM) !== '0';
        } catch (e) {
            return true;
        }
    }
    function definirSom(ligado) {
        try {
            window.localStorage.setItem(CHAVE_SOM, ligado ? '1' : '0');
        } catch (e) {
            /* sem armazenamento */
        }
    }

    // ---------- som (Web Audio, sem arquivos) ----------
    var ctx = null;
    function audio() {
        try {
            ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        } catch (e) {
            return null;
        }
    }
    function tom(c, t0, freq, dur, vol, tipo, freqFim) {
        var o = c.createOscillator(),
            g = c.createGain();
        o.type = tipo || 'sine';
        o.frequency.setValueAtTime(freq, t0);
        if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur * 0.8);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g);
        g.connect(c.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
    }
    function blem(c, t, base) {
        // sino metálico: parciais não harmônicos, como o canto da araponga
        [
            [1, 0.11, 0.7],
            [2.76, 0.05, 0.45],
            [5.4, 0.025, 0.25],
            [8.9, 0.012, 0.15]
        ].forEach(function (p) {
            tom(c, t, base * p[0], p[2], p[1], 'sine');
        });
    }
    function canto(ave) {
        if (!somLigado()) return;
        var c = audio();
        if (!c) return;
        var t = c.currentTime + 0.02;
        if (ave === 'araponga') {
            blem(c, t, 1180);
            blem(c, t + 0.26, 1180);
        } else {
            [
                [2600, 4300, 0],
                [3000, 4600, 0.11],
                [2400, 3900, 0.24]
            ].forEach(function (p) {
                tom(c, t + p[2], p[0], 0.09, 0.07, 'sine', p[1]);
            });
        }
    }

    function aveDe(el) {
        return el.classList.contains('tie') ? 'tie' : 'araponga';
    }

    // ---------- notas musicais saindo do bico ----------
    function notas(m) {
        if (movimentoReduzido()) return;
        var box = m.querySelector('.notas');
        if (!box) return;
        var lado = m.classList.contains('tie') ? -1 : 1;
        ['♪', '♫', '♪'].forEach(function (n, i) {
            var e = document.createElement('span');
            e.className = 'nota-musical';
            e.textContent = n;
            e.style.setProperty('--dx', lado * (14 + i * 16));
            e.style.setProperty('--dr', lado * (8 + i * 6));
            e.style.animationDelay = i * 0.16 + 's';
            box.appendChild(e);
            setTimeout(function () {
                e.remove();
            }, 1600);
        });
    }

    // ---------- animação por classe (igual à demonstração) ----------
    function anima(el, nome) {
        if (!el) return;
        if (nome !== 'triste') el.classList.remove('anima-triste');
        var cls = 'anima-' + nome;
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        if (nome === 'comemora') {
            notas(el);
            canto(aveDe(el));
        }
        if (nome === 'triste') return; // triste fica até outra ação
        el.addEventListener('animationend', function fim(e) {
            if (e.target.classList.contains('galho') && nome !== 'pisca') return;
            if (e.target.classList.contains('nota-musical')) return;
            el.classList.remove(cls);
            el.removeEventListener('animationend', fim);
        });
    }

    // Estado triste: anima e mantém a pose enquanto o alerta estiver na tela.
    function triste(el) {
        if (!el) return;
        el.classList.add('estado-triste');
        anima(el, 'triste');
    }

    // ---------- criação de mascote por JS (mesmo markup do Partials/mascote.ejs) ----------
    function criar(ave, opcoes) {
        opcoes = opcoes || {};
        var d = DIMENSOES[ave] || DIMENSOES.araponga;
        function img(classe, nome) {
            var i = document.createElement('img');
            i.className = classe;
            i.src = '/img/mascotes/' + ave + '-' + nome + '.png';
            i.alt = '';
            i.width = d[0];
            i.height = d[1];
            i.setAttribute('aria-hidden', 'true');
            return i;
        }
        var m = document.createElement('div');
        m.className = 'mascote ' + ave;
        m.setAttribute('aria-hidden', 'true');
        if (opcoes.tamanho) m.style.width = opcoes.tamanho + 'px';
        if (opcoes.comGalho !== false) m.appendChild(img('galho', 'galho'));
        var camada = document.createElement('div');
        camada.className = 'camada-ave';
        camada.appendChild(img('corpo', 'corpo'));
        camada.appendChild(img('asa', 'asa'));
        ['palpebra', 'gota'].forEach(function (c) {
            var s = document.createElement('span');
            s.className = c;
            camada.appendChild(s);
        });
        m.appendChild(camada);
        var n = document.createElement('span');
        n.className = 'notas';
        m.appendChild(n);
        return m;
    }

    // ---------- mensagem de sucesso: comemorar com canto e botão de som ----------
    // Chamar a partir de um clique do usuário (o navegador só libera o som logo após um clique).
    function sucesso(container, texto, ave, opcoes) {
        if (!container) return null;
        opcoes = opcoes || {};
        container.replaceChildren();
        container.classList.add('sucesso-mascote');
        var m = criar(ave, { tamanho: 64 });
        var span = document.createElement('span');
        span.className = 'sucesso-mascote__texto';
        span.textContent = texto;
        var botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'mascote-som';
        function rotular() {
            var ligado = somLigado();
            botao.setAttribute('aria-pressed', String(ligado));
            botao.setAttribute('aria-label', ligado ? 'Desligar o som do mascote' : 'Ligar o som do mascote');
            botao.title = ligado ? 'Som ligado' : 'Som desligado';
            botao.innerHTML =
                '<i class="ph ' + (ligado ? 'ph-speaker-high' : 'ph-speaker-slash') + '" aria-hidden="true"></i>';
        }
        botao.addEventListener('click', function () {
            definirSom(!somLigado());
            rotular();
            if (somLigado()) audio();
        });
        rotular();
        container.append(m, span, botao);
        anima(m, 'comemora');
        return m;
    }

    // ---------- inicialização automática ----------
    function iniciar() {
        var todos = Array.prototype.slice.call(document.querySelectorAll('.mascote'));

        // Piscar a cada 4–7 s (único movimento contínuo), só se a página estiver visível.
        todos
            .filter(function (m) {
                return m.hasAttribute('data-pisca');
            })
            .forEach(function (m) {
                (function agenda() {
                    setTimeout(
                        function () {
                            if (
                                !document.hidden &&
                                !movimentoReduzido() &&
                                !m.classList.contains('estado-triste') &&
                                m.offsetParent !== null
                            )
                                anima(m, 'pisca');
                            agenda();
                        },
                        4000 + Math.random() * 3000
                    );
                })();
            });

        // Mouse em cima: bate asas (cartões da landing e destaque da home do trabalhador).
        todos
            .filter(function (m) {
                return m.getAttribute('data-interacao') === 'asas';
            })
            .forEach(function (m) {
                var alvo = m.closest('[data-mascote-alvo]') || m;
                alvo.addEventListener('mouseenter', function () {
                    if (!m.classList.contains('anima-pouso') && !m.classList.contains('anima-asas')) anima(m, 'asas');
                });
            });

        // Pousar uma vez, quando aparecer na tela.
        var pousos = todos.filter(function (m) {
            return m.hasAttribute('data-pouso');
        });
        if (pousos.length && 'IntersectionObserver' in window && !movimentoReduzido()) {
            var obs = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    obs.unobserve(e.target);
                    var i = pousos.indexOf(e.target);
                    setTimeout(
                        function () {
                            anima(e.target, 'pouso');
                        },
                        150 + (i % 2) * 180
                    );
                });
            });
            pousos.forEach(function (m) {
                obs.observe(m);
            });
        }

        // Alertas de erro: o mascote fica triste enquanto o alerta estiver na tela.
        Array.prototype.forEach.call(document.querySelectorAll('.alerta-sistema'), function (alerta) {
            Array.prototype.forEach.call(alerta.querySelectorAll('.mascote'), function (m) {
                if (m.offsetParent === null) return;
                setTimeout(function () {
                    triste(m);
                }, 300);
            });
        });
    }

    window.Mascotes = {
        comemorar: function (el) {
            anima(el, 'comemora');
        },
        triste: triste,
        asas: function (el) {
            anima(el, 'asas');
        },
        pousar: function (el) {
            anima(el, 'pouso');
        },
        piscar: function (el) {
            anima(el, 'pisca');
        },
        curioso: function (el) {
            anima(el, 'curioso');
        },
        criar: criar,
        sucesso: sucesso,
        // Libera o áudio durante um clique do usuário (chamar nos manipuladores de clique).
        prepararSom: function () {
            if (somLigado()) audio();
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
