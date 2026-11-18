document.addEventListener('DOMContentLoaded', () => {
    // O envio da avaliação fica em /js/avaliacaoBico.js.

    // Cancelamento do bico: modal de confirmação (com motivo opcional) e envio por fetch.
    const formCancelar = document.getElementById('form-cancelar-bico');
    const modalCancelar = document.getElementById('confirm-cancel-modal');

    if (formCancelar && modalCancelar) {
        const botaoCancelarBico = document.getElementById('btn-cancelar-bico');
        const botaoConfirmarCancelamento = document.getElementById('confirm-cancel-button');
        const botaoVoltar = document.getElementById('cancel-cancel-button');
        const campoMotivo = document.getElementById('motivo-cancelamento');
        const feedbackCancelamento = document.getElementById('feedback-finalizar-bico');

        const fecharModalCancelamento = () => {
            modalCancelar.classList.add('is-closing');
            window.setTimeout(() => {
                if (modalCancelar.open) modalCancelar.close();
                modalCancelar.classList.remove('is-closing');
            }, 170);
        };

        formCancelar.addEventListener('submit', (evento) => {
            evento.preventDefault();
            if (botaoCancelarBico.disabled) return;
            modalCancelar.showModal();
            botaoVoltar.focus();
        });

        botaoVoltar.addEventListener('click', fecharModalCancelamento);
        modalCancelar.addEventListener('cancel', (evento) => {
            evento.preventDefault();
            fecharModalCancelamento();
        });
        modalCancelar.addEventListener('click', (evento) => {
            if (evento.target === modalCancelar) fecharModalCancelamento();
        });

        botaoConfirmarCancelamento.addEventListener('click', async () => {
            botaoConfirmarCancelamento.disabled = true;
            botaoCancelarBico.disabled = true;
            feedbackCancelamento.textContent = '';

            try {
                const resposta = await fetch(formCancelar.action, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body: new URLSearchParams({ motivo: campoMotivo.value }).toString(),
                    credentials: 'same-origin'
                });

                let dados;
                try {
                    dados = await resposta.json();
                } catch (_erroJson) {
                    throw new Error('O servidor retornou uma resposta inválida.');
                }

                if (!resposta.ok || dados.sucesso !== true) {
                    throw new Error(dados.erro || 'Não foi possível cancelar o bico.');
                }

                // Recarrega a página para refletir o novo status e as candidaturas recusadas.
                window.location.reload();
            } catch (erro) {
                fecharModalCancelamento();
                feedbackCancelamento.textContent =
                    erro instanceof TypeError
                        ? 'Falha de conexão. Verifique sua rede e tente novamente.'
                        : erro.message || 'Não foi possível cancelar o bico.';
                botaoConfirmarCancelamento.disabled = false;
                botaoCancelarBico.disabled = false;
            }
        });
    }

    const form = document.getElementById('form-finalizar-bico');
    const botao = document.getElementById('btn-finalizar-bico');
    const feedback = document.getElementById('feedback-finalizar-bico');
    const statusBico = document.getElementById('status-bico');
    const modalConfirmacao = document.getElementById('confirm-finalize-modal');
    const botaoConfirmar = document.getElementById('confirm-finalize-button');
    const botaoCancelar = document.getElementById('cancel-finalize-button');

    if (!form || !botao || !feedback || !statusBico || !modalConfirmacao || !botaoConfirmar || !botaoCancelar) return;

    const confirmarFinalizacao = () =>
        new Promise((resolve) => {
            const elementoAnterior = document.activeElement;
            let finalizado = false;
            let confirmado = false;
            let timeoutFechamento;

            const concluirFechamento = (evento) => {
                if (evento && evento.animationName !== 'finalize-modal-exit') return;
                modalConfirmacao.removeEventListener('animationend', concluirFechamento);
                window.clearTimeout(timeoutFechamento);
                botaoConfirmar.removeEventListener('click', aoConfirmar);
                botaoCancelar.removeEventListener('click', aoCancelar);
                modalConfirmacao.removeEventListener('cancel', aoCancelarPorEvento);
                modalConfirmacao.removeEventListener('keydown', aoCancelarPorTeclado);
                modalConfirmacao.removeEventListener('click', aoCancelarPorFundo);
                if (modalConfirmacao.open) modalConfirmacao.close();
                modalConfirmacao.classList.remove('is-closing');
                if (elementoAnterior instanceof HTMLElement && elementoAnterior.isConnected) {
                    elementoAnterior.focus();
                }
                resolve(confirmado);
            };

            const fecharModal = (resultado) => {
                if (finalizado) return;
                finalizado = true;
                confirmado = resultado;
                modalConfirmacao.classList.add('is-closing');
                modalConfirmacao.addEventListener('animationend', concluirFechamento);
                timeoutFechamento = window.setTimeout(() => concluirFechamento(), 220);
            };

            const aoConfirmar = () => fecharModal(true);
            const aoCancelar = () => fecharModal(false);
            const aoCancelarPorEvento = (evento) => {
                evento.preventDefault();
                fecharModal(false);
            };
            const aoCancelarPorTeclado = (evento) => {
                if (evento.key !== 'Escape') return;
                evento.preventDefault();
                fecharModal(false);
            };
            const aoCancelarPorFundo = (evento) => {
                if (evento.target === modalConfirmacao) fecharModal(false);
            };

            botaoConfirmar.addEventListener('click', aoConfirmar);
            botaoCancelar.addEventListener('click', aoCancelar);
            modalConfirmacao.addEventListener('cancel', aoCancelarPorEvento);
            modalConfirmacao.addEventListener('keydown', aoCancelarPorTeclado);
            modalConfirmacao.addEventListener('click', aoCancelarPorFundo);

            modalConfirmacao.showModal();
            botaoCancelar.focus();
        });

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (botao.disabled || !(await confirmarFinalizacao())) return;
        if (window.Mascotes) window.Mascotes.prepararSom(); // o som só toca logo após um clique do usuário

        botao.disabled = true;
        feedback.textContent = '';

        try {
            const resposta = await fetch(form.action, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });

            let dados;
            try {
                dados = await resposta.json();
            } catch (_erroJson) {
                throw new Error('O servidor retornou uma resposta inválida.');
            }

            if (!resposta.ok || dados.sucesso !== true) {
                throw new Error(dados.erro || 'Não foi possível finalizar o serviço.');
            }

            // Recarrega a página para refletir o novo status: some o botão "Cancelar bico" e aparece o
            // formulário de avaliação (renderizado pelo servidor), além do saldo atualizado no menu.
            // A araponga comemora (com canto) ANTES de recarregar; depois de ~1,2 s a página recarrega.
            if (window.Mascotes) {
                window.Mascotes.sucesso(
                    feedback,
                    'Serviço finalizado com sucesso! Agora você pode avaliar o trabalhador.',
                    'araponga'
                );
                await new Promise((resolver) => setTimeout(resolver, 1200));
            }
            window.location.reload();
        } catch (erro) {
            feedback.textContent =
                erro instanceof TypeError
                    ? 'Falha de conexão. Verifique sua rede e tente novamente.'
                    : erro.message || 'Não foi possível finalizar o serviço.';
            botao.disabled = false;
        }
    });
});
