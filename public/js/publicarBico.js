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
    // Ao abrir a dica, a araponga inclina a cabeça, curiosa.
    if (isOpen && window.Mascotes) window.Mascotes.curioso(mascotToggle.querySelector('.mascote'));
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
  const campos = publicarForm.elements;
  const cepInput = campos.cep;
  const cepField = document.querySelector('#cep-field');
  const cepStatus = document.querySelector('#cep-status');
  const camposEndereco = {
    logradouro: document.querySelector('[data-endereco="logradouro"]'),
    bairro: document.querySelector('[data-endereco="bairro"]'),
    cidade: document.querySelector('[data-endereco="cidade"]'),
    uf: document.querySelector('[data-endereco="uf"]'),
  };

  const resumoTitulo = document.querySelector('[data-summary="titulo"]');
  const resumoLocal = document.querySelector('[data-summary="bairro"]');
  const resumoAgenda = document.querySelector('[data-summary="agenda"]');
  const resumoValor = document.querySelector('[data-summary="valor"]');

  // "Rua X, 123 – Bairro, Cidade/UF" (cada parte só entra quando existe).
  const montarEnderecoResumo = () => {
    const rua = camposEndereco.logradouro.value.trim();
    const numero = campos.numero.value.trim();
    const bairro = camposEndereco.bairro.value.trim();
    const cidade = camposEndereco.cidade.value.trim();
    const uf = camposEndereco.uf.value.trim();

    const linhaRua = rua ? [rua, numero].filter(Boolean).join(', ') : '';
    const cidadeUf = cidade && uf ? `${cidade}/${uf}` : cidade;
    const linhaLocal = [bairro, cidadeUf].filter(Boolean).join(', ');
    return [linhaRua, linhaLocal].filter(Boolean).join(' – ');
  };

  const atualizarResumo = () => {
    resumoTitulo.textContent = campos.titulo.value.trim() || 'Seu título aparecerá aqui';
    resumoLocal.textContent = montarEnderecoResumo() || 'Endereço do serviço';

    const data = campos.data_servico.value
      ? new Date(`${campos.data_servico.value}T12:00:00`).toLocaleDateString('pt-BR')
      : '';
    const horario = campos.horario.value;
    resumoAgenda.textContent = [data, horario].filter(Boolean).join(' às ') || 'A definir';

    const valor = Number(campos.valor.value);
    resumoValor.textContent = valor > 0
      ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'A definir';
  };

  // ---------- CEP ----------
  const ICONES_STATUS = {
    carregando: 'ph-circle-notch',
    ok: 'ph-check-circle',
    aviso: 'ph-pencil-simple-line',
    erro: 'ph-warning-circle',
  };

  // Estado da verificação: 'vazio' | 'carregando' | 'ok' | 'erro'. Só 'ok' libera o envio.
  let estadoCep = 'vazio';
  let ultimoCepConsultado = '';
  let consultaAtual = 0;

  const mostrarStatus = (tipo, mensagem) => {
    cepStatus.className = tipo ? `cep-status cep-status--${tipo}` : 'cep-status';
    cepStatus.replaceChildren();
    if (!tipo || !mensagem) return;
    const icone = document.createElement('i');
    icone.className = `ph ${ICONES_STATUS[tipo]}`;
    icone.setAttribute('aria-hidden', 'true');
    const texto = document.createElement('span');
    texto.textContent = mensagem;
    cepStatus.append(icone, texto);
  };

  const definirCarregando = (carregando) => {
    cepField.classList.toggle('is-loading', carregando);
    cepInput.setAttribute('aria-busy', String(carregando));
  };

  const marcarCepInvalido = (invalido) => {
    cepField.classList.toggle('is-invalid', invalido);
    if (invalido) cepInput.setAttribute('aria-invalid', 'true');
    else cepInput.removeAttribute('aria-invalid');
  };

  // Campos do endereço: travados (readonly) quando vêm do CEP; liberados para digitar no CEP geral.
  const travarCampo = (campo, valor) => {
    campo.value = valor;
    campo.readOnly = true;
    campo.tabIndex = -1;
  };

  const liberarCampo = (campo, manterValor) => {
    if (!manterValor) campo.value = '';
    campo.readOnly = false;
    campo.removeAttribute('tabindex');
    campo.placeholder = campo === camposEndereco.logradouro ? 'Digite a rua' : 'Digite o bairro';
  };

  const limparEndereco = () => {
    Object.values(camposEndereco).forEach((campo) => travarCampo(campo, ''));
    camposEndereco.logradouro.placeholder = 'Preenchida pelo CEP';
    camposEndereco.bairro.placeholder = 'Preenchido pelo CEP';
  };

  const falhaCep = (mensagem) => {
    estadoCep = 'erro';
    marcarCepInvalido(true);
    limparEndereco();
    mostrarStatus('erro', mensagem);
    atualizarResumo();
  };

  // primeiraCarga: consulta feita ao abrir a página com um CEP já preenchido (volta de erro do servidor);
  // nesse caso o que foi digitado em rua/bairro no CEP geral é mantido e o foco não é movido.
  const consultarCep = async (digitos, { primeiraCarga = false } = {}) => {
    const idConsulta = ++consultaAtual;
    ultimoCepConsultado = digitos;
    estadoCep = 'carregando';
    marcarCepInvalido(false);
    definirCarregando(true);
    mostrarStatus('carregando', 'Buscando endereço...');

    let resposta;
    try {
      resposta = await fetch(`/api/cep/${digitos}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
    } catch {
      if (idConsulta !== consultaAtual) return;
      definirCarregando(false);
      ultimoCepConsultado = ''; // permite tentar de novo com o mesmo CEP
      falhaCep('Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.');
      return;
    }

    if (idConsulta !== consultaAtual) return; // o CEP mudou enquanto esta consulta estava em andamento
    definirCarregando(false);

    // Sessão expirada: o requireAuth redireciona para /login e a resposta deixa de ser JSON.
    const tipoConteudo = resposta.headers.get('content-type') || '';
    if (resposta.redirected || !tipoConteudo.includes('application/json')) {
      window.location.assign('/login');
      return;
    }

    const dados = await resposta.json().catch(() => null);

    if (resposta.status === 404) {
      falhaCep('CEP não encontrado. Confira os números ou use o link "Não sei meu CEP".');
      return;
    }

    if (!resposta.ok || !dados) {
      ultimoCepConsultado = '';
      falhaCep((dados && dados.erro) || 'Não conseguimos verificar o CEP agora, tente novamente em instantes.');
      return;
    }

    travarCampo(camposEndereco.cidade, dados.cidade);
    travarCampo(camposEndereco.uf, dados.uf);

    const semRua = !dados.logradouro;
    const semBairro = !dados.bairro;
    if (semRua) liberarCampo(camposEndereco.logradouro, primeiraCarga);
    else travarCampo(camposEndereco.logradouro, dados.logradouro);
    if (semBairro) liberarCampo(camposEndereco.bairro, primeiraCarga);
    else travarCampo(camposEndereco.bairro, dados.bairro);

    estadoCep = 'ok';
    if (semRua || semBairro) {
      const faltando = semRua && semBairro ? 'a rua e o bairro' : (semRua ? 'a rua' : 'o bairro');
      mostrarStatus('aviso', `CEP geral de ${dados.cidade}/${dados.uf}: digite ${faltando}.`);
      if (!primeiraCarga) (semRua ? camposEndereco.logradouro : camposEndereco.bairro).focus();
    } else {
      mostrarStatus('ok', `${dados.cidade}/${dados.uf}`);
      if (!primeiraCarga) campos.numero.focus();
    }
    atualizarResumo();
  };

  // Máscara 00000-000.
  const aplicarMascaraCep = () => {
    const digitos = cepInput.value.replace(/\D/g, '').slice(0, 8);
    cepInput.value = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    return digitos;
  };

  // Consulta automática ao completar os 8 dígitos.
  cepInput.addEventListener('input', () => {
    const digitos = aplicarMascaraCep();
    if (digitos.length === 8) {
      if (digitos !== ultimoCepConsultado || estadoCep === 'erro') consultarCep(digitos);
      return;
    }
    // CEP incompleto: o endereço anterior deixa de valer.
    if (estadoCep !== 'vazio') {
      consultaAtual += 1;
      ultimoCepConsultado = '';
      estadoCep = 'vazio';
      definirCarregando(false);
      marcarCepInvalido(false);
      mostrarStatus(null);
      limparEndereco();
      atualizarResumo();
    }
  });

  // Não publica sem o CEP verificado (o servidor confere de novo de qualquer forma).
  publicarForm.addEventListener('submit', (evento) => {
    if (estadoCep === 'ok') return;
    evento.preventDefault();
    if (estadoCep === 'carregando') {
      mostrarStatus('carregando', 'Aguarde: ainda estamos buscando o endereço do CEP.');
    } else if (estadoCep === 'vazio') {
      falhaCep('Digite um CEP válido para preencher o endereço.');
    }
    cepInput.focus();
  });

  [campos.titulo, campos.data_servico, campos.horario, campos.valor, campos.numero,
    camposEndereco.logradouro, camposEndereco.bairro].forEach((campo) => {
    campo.addEventListener('input', atualizarResumo);
    campo.addEventListener('change', atualizarResumo);
  });

  // Ao abrir: com CEP já preenchido (o servidor devolveu o formulário com erro), verifica de novo;
  // sem CEP, os campos do endereço começam travados, à espera da consulta.
  const cepInicial = aplicarMascaraCep();
  const ruaInicial = camposEndereco.logradouro.value;
  const bairroInicial = camposEndereco.bairro.value;
  limparEndereco();
  if (cepInicial.length === 8) {
    camposEndereco.logradouro.value = ruaInicial;
    camposEndereco.bairro.value = bairroInicial;
    consultarCep(cepInicial, { primeiraCarga: true });
  }
  atualizarResumo();
}
