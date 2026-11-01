const mascotToggle = document.querySelector('.mascot-assistant__toggle');
const mascotTip = document.querySelector('#mascot-tip');
const mascotTipClose = document.querySelector('.mascot-assistant__close');

if (mascotToggle && mascotTip && mascotTipClose) {
  const setTipOpen = (isOpen) => {
    mascotToggle.setAttribute('aria-expanded', String(isOpen));
    mascotToggle.setAttribute(
      'aria-label',
      isOpen ? 'Fechar dica para publicar um bico' : 'Abrir dica para publicar um bico',
    );
    mascotTip.hidden = !isOpen;
  };

  mascotToggle.addEventListener('click', () => {
    setTipOpen(mascotToggle.getAttribute('aria-expanded') !== 'true');
  });

  mascotTipClose.addEventListener('click', () => {
    setTipOpen(false);
    mascotToggle.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mascotToggle.getAttribute('aria-expanded') === 'true') {
      setTipOpen(false);
      mascotToggle.focus();
    }
  });
}

const publicarForm = document.querySelector('#publicar-form');

if (publicarForm) {
  const camposResumo = {
    titulo: publicarForm.elements.titulo,
    bairro: publicarForm.elements.bairro,
    data: publicarForm.elements.data_servico,
    horario: publicarForm.elements.horario,
    valor: publicarForm.elements.valor,
  };
  const resumoTitulo = document.querySelector('[data-summary="titulo"]');
  const resumoBairro = document.querySelector('[data-summary="bairro"]');
  const resumoAgenda = document.querySelector('[data-summary="agenda"]');
  const resumoValor = document.querySelector('[data-summary="valor"]');

  const atualizarResumo = () => {
    resumoTitulo.textContent = camposResumo.titulo.value.trim() || 'Seu título aparecerá aqui';
    resumoBairro.textContent = camposResumo.bairro.value.trim() || 'Bairro do serviço';

    const data = camposResumo.data.value
      ? new Date(`${camposResumo.data.value}T12:00:00`).toLocaleDateString('pt-BR')
      : '';
    const horario = camposResumo.horario.value;
    resumoAgenda.textContent = [data, horario].filter(Boolean).join(' às ') || 'A definir';

    const valor = Number(camposResumo.valor.value);
    resumoValor.textContent = valor > 0
      ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'A definir';
  };

  Object.values(camposResumo).forEach((campo) => campo.addEventListener('input', atualizarResumo));
  Object.values(camposResumo).forEach((campo) => campo.addEventListener('change', atualizarResumo));
  atualizarResumo();
}
