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

  if (!form || !botao || !feedback || !statusBico) return;

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!window.confirm('Deseja realmente finalizar este serviço?')) return;

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

      statusBico.textContent = `• ${dados.status}`;
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
