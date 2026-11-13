document.addEventListener('DOMContentLoaded', () => {
  const formAvaliacao = document.getElementById('form-avaliacao-bico');
  const botaoAvaliacao = document.getElementById('btn-salvar-avaliacao');
  const feedbackAvaliacao = document.getElementById('feedback-avaliacao-bico');

  if (formAvaliacao && botaoAvaliacao && feedbackAvaliacao) {
    formAvaliacao.addEventListener('submit', async (evento) => {
      evento.preventDefault();

      if (botaoAvaliacao.disabled) return;

      botaoAvaliacao.disabled = true;
      feedbackAvaliacao.textContent = '';
      feedbackAvaliacao.className = 'evaluation-feedback';

      try {
        const campos = new FormData(formAvaliacao);
        const corpo = new URLSearchParams({
          nota: campos.get('nota'),
          comentario: campos.get('comentario') || ''
        });
        const resposta = await fetch(formAvaliacao.action, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: corpo.toString(),
          credentials: 'same-origin'
        });

        let dados;
        try {
          dados = await resposta.json();
        } catch (_erroJson) {
          throw new Error('O servidor retornou uma resposta inválida.');
        }

        if (!resposta.ok || dados.sucesso !== true) {
          throw new Error(dados.erro || 'Não foi possível salvar a avaliação.');
        }

        feedbackAvaliacao.textContent = dados.mensagem || 'Avaliação salva com sucesso.';
        feedbackAvaliacao.classList.add('evaluation-feedback--success');
        formAvaliacao.querySelectorAll('input, textarea, button').forEach((campo) => {
          campo.disabled = true;
        });
      } catch (erro) {
        feedbackAvaliacao.textContent = erro instanceof TypeError
          ? 'Falha de conexão. Verifique sua rede e tente novamente.'
          : erro.message || 'Não foi possível salvar a avaliação.';
        feedbackAvaliacao.classList.add('evaluation-feedback--error');
        botaoAvaliacao.disabled = false;
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

  const confirmarFinalizacao = () => new Promise((resolve) => {
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

    if (botao.disabled || !await confirmarFinalizacao()) return;

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

      const statusIcon = document.createElement('i');
      statusIcon.className = 'ph-fill ph-circle';
      statusIcon.setAttribute('aria-hidden', 'true');
      statusBico.replaceChildren(statusIcon, document.createTextNode(` ${dados.status}`));
      feedback.textContent = dados.mensagem || 'Serviço finalizado com sucesso.';
      form.remove();
    } catch (erro) {
      feedback.textContent = erro instanceof TypeError
        ? 'Falha de conexão. Verifique sua rede e tente novamente.'
        : erro.message || 'Não foi possível finalizar o serviço.';
      botao.disabled = false;
    }
  });
});
