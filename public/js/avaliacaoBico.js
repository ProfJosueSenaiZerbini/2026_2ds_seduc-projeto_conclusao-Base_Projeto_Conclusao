// Envio do formulário de avaliação do bico (contratante e trabalhador).
document.addEventListener('DOMContentLoaded', () => {
  const formAvaliacao = document.getElementById('form-avaliacao-bico');
  const botaoAvaliacao = document.getElementById('btn-salvar-avaliacao');
  const feedbackAvaliacao = document.getElementById('feedback-avaliacao-bico');

  if (!formAvaliacao || !botaoAvaliacao || !feedbackAvaliacao) return;

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

      feedbackAvaliacao.textContent = dados.mensagem || 'Avaliação registrada.';
      feedbackAvaliacao.classList.add('evaluation-feedback--success');
      // A avaliação continua editável até o fim do prazo: o formulário segue ativo, agora como edição.
      botaoAvaliacao.textContent = 'Atualizar avaliação';
      const aviso = document.getElementById('avaliacao-prazo');
      if (aviso) aviso.textContent = aviso.textContent.replace('Você pode avaliar até', 'Você pode editar até');
    } catch (erro) {
      feedbackAvaliacao.textContent = erro instanceof TypeError
        ? 'Falha de conexão. Verifique sua rede e tente novamente.'
        : erro.message || 'Não foi possível salvar a avaliação.';
      feedbackAvaliacao.classList.add('evaluation-feedback--error');
    } finally {
      botaoAvaliacao.disabled = false;
    }
  });
});
