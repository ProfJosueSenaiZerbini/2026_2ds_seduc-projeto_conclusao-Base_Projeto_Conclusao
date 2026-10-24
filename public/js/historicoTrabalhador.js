document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      // Atualiza estado visual das abas
      tabs.forEach(t => {
        t.classList.remove('tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('tab--active');
      tab.setAttribute('aria-selected', 'true');

      // Esconde todos os painéis e exibe apenas o selecionado
      panels.forEach(panel => {
        if (panel.id === `panel-${targetId}`) {
          panel.classList.remove('panel--hidden');
        } else {
          panel.classList.add('panel--hidden');
        }
      });
    });
  });
});