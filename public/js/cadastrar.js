document.addEventListener('DOMContentLoaded', () => {
  const cardContratante = document.getElementById('cardContratante');
  const cardTrabalhador = document.getElementById('cardTrabalhador');
  const tipoPerfilInput = document.getElementById('tipoPerfilInput');
  const visualTag = document.getElementById('visualTag');
  const visualTitle = document.getElementById('visualTitle');
  const visualDesc = document.getElementById('visualDesc');
  const signupTitle = document.getElementById('signupTitle');
  const signupSubtitle = document.getElementById('signupSubtitle');

  // O alerta de erro mostra só o mascote do perfil escolhido (araponga = Contratante, tiê = Trabalhador),
  // trocando na hora junto com a escolha; o mascote que aparece fica triste.
  function trocarMascoteDoAlerta(perfil) {
    const alerta = document.getElementById('alerta-sistema');
    if (!alerta) return;
    alerta.classList.remove('alerta-sistema--contratante', 'alerta-sistema--trabalhador');
    alerta.classList.add('alerta-sistema--' + perfil);
    alerta.querySelectorAll('[data-mascote-perfil]').forEach((caixa) => {
      const ativo = caixa.dataset.mascotePerfil === perfil;
      const eraVisivel = !caixa.hidden;
      caixa.hidden = !ativo;
      const mascote = caixa.querySelector('.mascote');
      if (ativo && !eraVisivel && mascote && window.Mascotes) window.Mascotes.triste(mascote);
    });
  }

  // Função para alternar para a view de Trabalhador
  function ativarModoTrabalhador() {
    cardContratante.classList.remove('active');
    cardTrabalhador.classList.add('active');

    document.body.classList.remove('theme-contratante');
    document.body.classList.add('theme-trabalhador');
    tipoPerfilInput.value = 'Trabalhador';
    visualTag.textContent = 'Para quem trabalha';
    visualTitle.textContent = 'Seu talento pode abrir novas oportunidades.';
    visualDesc.textContent = 'Crie seu perfil, encontre serviços locais e conecte-se a quem precisa do seu trabalho.';
    signupTitle.textContent = 'Crie sua conta de Trabalhador';
    signupSubtitle.textContent = 'Encontre oportunidades e mostre o valor do seu trabalho.';
    trocarMascoteDoAlerta('trabalhador');

  }

  // Função para alternar para a view de Contratante
  function ativarModoContratante() {
    cardTrabalhador.classList.remove('active');
    cardContratante.classList.add('active');

    document.body.classList.remove('theme-trabalhador');
    document.body.classList.add('theme-contratante');
    tipoPerfilInput.value = 'Contratante';
    visualTag.textContent = 'Para quem contrata';
    visualTitle.textContent = 'Conecte seus projetos a talentos locais.';
    visualDesc.textContent = 'Publique seus bicos e encontre profissionais para realizar cada oportunidade com agilidade.';
    signupTitle.textContent = 'Crie sua conta de Contratante';
    signupSubtitle.textContent = 'Encontre profissionais para tirar seus projetos do papel.';
    trocarMascoteDoAlerta('contratante');

  }

  cardContratante.addEventListener('click', ativarModoContratante);
  cardTrabalhador.addEventListener('click', ativarModoTrabalhador);

  if (tipoPerfilInput.value.toLowerCase() === 'trabalhador') {
    ativarModoTrabalhador();
  } else {
    ativarModoContratante();
  }

  // Toggle de visibilidade da senha
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.getAttribute('data-toggle-password');
      const input = document.getElementById(inputId);
      if (input) {
        const isVisible = input.type === 'password';
        input.type = isVisible ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(isVisible));
        button.setAttribute(
          'aria-label',
          `${isVisible ? 'Ocultar' : 'Mostrar'} ${button.getAttribute('data-toggle-label')}`
        );
      }
    });
  });
});