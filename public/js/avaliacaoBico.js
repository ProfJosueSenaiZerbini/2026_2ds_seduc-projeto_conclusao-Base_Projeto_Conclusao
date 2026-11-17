// Envio do formulário de avaliação do bico (contratante e trabalhador).

// Mensagem de sucesso com o mascote da área dando um pulinho (também usada após finalizar o bico).
// O mascote é recriado a cada chamada para a animação recomeçar.
window.mostrarSucessoComMascote = (elemento, texto, mascote) => {
  if (!elemento) return;
  elemento.replaceChildren();
  elemento.classList.add('mascote-sucesso');
  if (mascote) {
    const img = document.createElement('img');
    img.src = mascote;
    img.alt = '';
    img.width = 40;
    img.height = 40;
    img.setAttribute('aria-hidden', 'true');
    img.className = 'mascote-sucesso__img mascote--pulo';
    elemento.append(img);
  }
  const mensagem = document.createElement('span');
  mensagem.textContent = texto;
  elemento.append(mensagem);
};

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

      window.mostrarSucessoComMascote(feedbackAvaliacao, dados.mensagem || 'Avaliação registrada.', formAvaliacao.dataset.mascote);
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
