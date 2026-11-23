const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
const contagemSempreVisivel = window.matchMedia("(max-width: 900px) and (hover: none)");

document.querySelectorAll("time.dc-event-date").forEach((data, indice) => {
  const aviso = data.querySelector(".dc-event-countdown");
  const card = data.closest(".dc-event-card");
  if (!aviso || !card) return;

  aviso.id = `dc-event-countdown-${indice}`;
  card.setAttribute("aria-describedby", aviso.id);

  function atualizarAviso() {
    const diaEvento = Date.parse(`${data.dateTime}T00:00:00Z`);
    if (!Number.isFinite(diaEvento)) return;
    const agora = new Date();
    const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const dias = (diaEvento - hoje) / 86400000;
    if (dias > 1) aviso.textContent = `Faltam ${dias} dias`;
    else if (dias === 1) aviso.textContent = "Falta 1 dia";
    else if (dias === 0) aviso.textContent = "É hoje!";
    else aviso.textContent = "Data já passou";
    aviso.hidden = false;
  }

  data.addEventListener("pointerenter", atualizarAviso);
  card.addEventListener("focus", atualizarAviso);
  card.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && !contagemSempreVisivel.matches) aviso.hidden = true;
  });
  if (contagemSempreVisivel.matches) atualizarAviso();
  contagemSempreVisivel.addEventListener("change", evento => {
    if (evento.matches) atualizarAviso();
  });
});

function criarPercurso(indicadores) {
  let temporizador;

  function cancelar() {
    window.clearTimeout(temporizador);
    indicadores.forEach(indicador => {
      indicador.classList.remove("dc-dot-pass");
      indicador.style.removeProperty("--dc-pass-delay");
    });
  }

  function mover(origem, destino) {
    cancelar();
    if (movimentoReduzido.matches || origem < 0 || destino < 0 || origem === destino)
      return;

    const sentido = Math.sign(destino - origem);
    const distancia = Math.abs(destino - origem);
    const intervalo = Math.min(45, 180 / distancia);
    void indicadores[origem].offsetWidth;
    for (let passo = 0; passo < distancia; passo++) {
      const indicador = indicadores[origem + passo * sentido];
      indicador.style.setProperty("--dc-pass-delay", `${passo * intervalo}ms`);
      indicador.classList.add("dc-dot-pass");
    }
    temporizador = window.setTimeout(cancelar, (distancia - 1) * intervalo + 115);
  }

  movimentoReduzido.addEventListener("change", evento => {
    if (evento.matches) cancelar();
  });
  window.addEventListener("pagehide", cancelar);
  return { mover };
}

const conteudoDestaques = document.querySelector(".dc-feature-content");
const navegacao = document.querySelector(".dc-feature-nav");
if (conteudoDestaques && navegacao) {
  const slides = conteudoDestaques.querySelectorAll(".dc-slide");
  const indicadores = Array.from(navegacao.querySelectorAll(".dc-dot"));
  const radios = indicadores.map(indicador => indicador.querySelector("input"));
  const anterior = navegacao.querySelector(".dc-feature-prev");
  const proximo = navegacao.querySelector(".dc-feature-next");
  const status = navegacao.querySelector(".dc-feature-status");
  if (radios.length > 1 && radios.length === slides.length && anterior && proximo) {
    navegacao.hidden = false;
    let atual = 0;
    const percurso = criarPercurso(indicadores);

    function mostrar(indice) {
      const antigo = atual;
      atual = indice;
      slides.forEach((slide, posicao) => {
        slide.hidden = posicao !== indice;
      });
      radios[indice].checked = true;
      if (status) status.textContent = radios[indice].getAttribute("aria-label");
      percurso.mover(antigo, indice);
    }

    mostrar(Math.max(0, radios.findIndex(radio => radio.checked)));
    function trocar(direcao) {
      mostrar((atual + direcao + radios.length) % radios.length);
    }

    anterior.addEventListener("click", () => trocar(-1));
    proximo.addEventListener("click", () => trocar(1));
    let inicioDeslize;
    let cancelouAbertura = false;
    conteudoDestaques.addEventListener("pointerdown", evento => {
      if (!evento.isPrimary) return;
      cancelouAbertura = false;
      inicioDeslize = evento.pointerType === "touch" ? evento : undefined;
    });
    conteudoDestaques.addEventListener("pointercancel", () => {
      inicioDeslize = undefined;
    });
    conteudoDestaques.addEventListener("pointerup", evento => {
      if (inicioDeslize?.pointerId !== evento.pointerId) return;
      const horizontal = evento.clientX - inicioDeslize.clientX;
      const vertical = evento.clientY - inicioDeslize.clientY;
      inicioDeslize = undefined;
      if (Math.abs(horizontal) < 45 || Math.abs(horizontal) < 1.4 * Math.abs(vertical))
        return;
      cancelouAbertura = true;
      trocar(horizontal < 0 ? 1 : -1);
    });
    conteudoDestaques.addEventListener("click", evento => {
      if (cancelouAbertura && evento.detail > 0) evento.preventDefault();
      cancelouAbertura = false;
    }, true);
    radios.forEach((radio, indice) => {
      radio.addEventListener("change", () => {
        if (radio.checked) mostrar(indice);
      });
      radio.addEventListener("keydown", evento => {
        if (evento.key !== "Home" && evento.key !== "End") return;
        evento.preventDefault();
        const destino = evento.key === "Home" ? 0 : radios.length - 1;
        mostrar(destino);
        radios[destino].focus();
      });
    });
  }
}

document.querySelectorAll(".dc-event-carousel .dc-event-nav").forEach(navegacaoEventos => {
  const anterior = navegacaoEventos.querySelector(".dc-event-prev");
  const faixaEventos = document.getElementById(anterior.getAttribute("aria-controls"));
  const proximo = navegacaoEventos.querySelector(".dc-event-next");
  const progresso = navegacaoEventos.querySelector(".dc-event-progress");
  const [primeiro, segundo] = faixaEventos.children;

  function atualizarNavegacao() {
    const { scrollWidth, clientWidth, scrollLeft } = faixaEventos;
    const limite = scrollWidth - clientWidth;
    navegacaoEventos.hidden = limite <= 1;
    if (navegacaoEventos.hidden) return;

    const posicao = Math.min(limite, Math.max(0, scrollLeft));
    anterior.disabled = posicao <= 1;
    proximo.disabled = posicao >= limite - 1;
    progresso.style.setProperty("--dc-event-progress-start", `${(posicao / scrollWidth) * 100}%`);
    progresso.style.setProperty("--dc-event-progress-width", `${(clientWidth / scrollWidth) * 100}%`);
  }

  function rolarEventos(sentido) {
    const passo = segundo.getBoundingClientRect().left - primeiro.getBoundingClientRect().left;
    faixaEventos.scrollBy({
      left: sentido * passo,
      behavior: movimentoReduzido.matches ? "auto" : "smooth",
    });
  }

  anterior.addEventListener("click", () => rolarEventos(-1));
  proximo.addEventListener("click", () => rolarEventos(1));
  faixaEventos.addEventListener("scroll", atualizarNavegacao, { passive: true });
  new ResizeObserver(atualizarNavegacao).observe(faixaEventos);
  atualizarNavegacao();
});

const filtros = document.querySelector(".dc-tabs");
if (filtros && document.referrer && !movimentoReduzido.matches) {
  const origem = new URL(document.referrer);
  if (origem.origin === location.origin && origem.pathname === location.pathname) {
    const links = Array.from(filtros.querySelectorAll("a"));
    const parametro = filtros.dataset.queryParam || "tipo";
    const categoria = url => url.searchParams.get(parametro) || (parametro === "tipo" ? "tudo" : "");
    const anterior = links.findIndex(link => categoria(new URL(link.href)) === categoria(origem));
    const atual = links.findIndex(link => link.hasAttribute("aria-current"));
    if (anterior >= 0 && atual >= 0 && anterior !== atual && filtros.animate) {
      const trilha = document.createElement("span");
      trilha.className = "dc-tab-trail";
      trilha.setAttribute("aria-hidden", "true");

      const primeiro = links[anterior].getBoundingClientRect();
      const barra = filtros.getBoundingClientRect();
      const sentido = Math.sign(atual - anterior);
      const quantidade = Math.abs(atual - anterior);
      trilha.style.width = `${primeiro.width}px`;
      trilha.style.height = `${primeiro.height}px`;

      const posicoes = Array.from({ length: quantidade + 1 }, (_, passo) => {
        const item = links[anterior + passo * sentido].getBoundingClientRect();
        return {
          x: item.left - barra.left - filtros.clientLeft + (item.width - primeiro.width) / 2,
          y: item.top - barra.top - filtros.clientTop + (item.height - primeiro.height) / 2,
          escala: item.width / primeiro.width,
        };
      });
      if (quantidade === 1) {
        const [partida, chegada] = posicoes;
        posicoes.splice(1, 0, {
          x: (partida.x + chegada.x) / 2,
          y: (partida.y + chegada.y) / 2,
          escala: (partida.escala + chegada.escala) / 2,
        });
      }
      const quadros = posicoes.map(({ x, y, escala }, indice) => {
        const emMovimento = indice > 0 && indice < posicoes.length - 1;
        const largura = escala * (emMovimento ? 1.14 : 1);
        const altura = emMovimento ? 0.7 : 1;
        const inclinacao = emMovimento ? -12 * sentido : 0;
        return {
          transform: `translate(${x}px, ${y}px) skewX(${inclinacao}deg) scale(${largura}, ${altura})`,
        };
      });

      filtros.append(trilha);
      const animacao = trilha.animate(quadros, {
        duration: 140 + quantidade * 40,
        easing: "cubic-bezier(0.3, 0, 0.2, 1)",
      });
      animacao.finished.then(() => trilha.remove(), () => trilha.remove());
    }
  }
}

const paineis = document.querySelectorAll(".dc-filter, .dc-create");
document.addEventListener("click", evento => {
  paineis.forEach(painel => {
    if (!painel.contains(evento.target)) painel.open = false;
  });
});
document.addEventListener("keydown", evento => {
  if (evento.key !== "Escape") return;
  paineis.forEach(painel => {
    if (!painel.open) return;
    painel.open = false;
    painel.querySelector("summary").focus();
  });
});
