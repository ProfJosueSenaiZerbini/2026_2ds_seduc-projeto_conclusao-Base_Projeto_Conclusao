// Perfil público: "Ver todas" expande as avaliações além das 5 mais recentes (e recolhe de novo).
(() => {
  const botao = document.getElementById('ver-todas-avaliacoes');
  if (!botao) return;
  const extras = document.querySelectorAll('#lista-avaliacoes .review-card--extra');
  const total = botao.dataset.total;

  botao.addEventListener('click', () => {
    const expandir = botao.getAttribute('aria-expanded') !== 'true';
    extras.forEach((cartao) => { cartao.hidden = !expandir; });
    botao.setAttribute('aria-expanded', String(expandir));
    botao.textContent = expandir ? 'Ver menos' : `Ver todas (${total})`;
  });
})();
