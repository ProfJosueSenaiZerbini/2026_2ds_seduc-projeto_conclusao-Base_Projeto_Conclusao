const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
const contagemSempreVisivel = window.matchMedia(
  "(max-width: 900px) and (hover: none)"
);

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
    const hoje = Date.UTC(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );
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
    if (evento.key === "Escape" && !contagemSempreVisivel.matches)
      aviso.hidden = true;
  });
  if (contagemSempreVisivel.matches) atualizarAviso();
  contagemSempreVisivel.addEventListener("change", evento => {
    if (evento.matches) atualizarAviso();
  });
});

const conteudoDestaques = document.querySelector(".dc-feature-content");
const navegacao = document.querySelector(".dc-feature-nav");
if (conteudoDestaques && navegacao) {
  const slides = conteudoDestaques.querySelectorAll(".dc-slide");
  const indicadores = Array.from(
    navegacao.querySelectorAll(".dc-feature-choice")
  );
  const radios = indicadores.map(indicador => indicador.querySelector("input"));
  const anterior = navegacao.querySelector(".dc-feature-prev");
  const proximo = navegacao.querySelector(".dc-feature-next");
  const status = navegacao.querySelector(".dc-feature-status");
  if (
    radios.length > 1 &&
    radios.length === slides.length &&
    anterior &&
    proximo
  ) {
    navegacao.hidden = false;
    let atual = 0;
    const trilha = navegacao.querySelector(".dc-feature-choices");
    const contador = navegacao.querySelector(".dc-feature-counter");
    let transicao;

    function mostrar(indice) {
      const antigo = atual;
      const focoNoSlide = slides[antigo].contains(document.activeElement);
      atual = indice;
      slides.forEach((slide, posicao) => {
        slide.hidden = posicao !== indice;
      });
      radios[indice].checked = true;
      if (status)
        status.textContent = radios[indice].getAttribute("aria-label");
      if (contador)
        contador.textContent = `${String(indice + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      const escolha = indicadores[indice];
      if (trilha) {
        const esquerda =
          escolha.getBoundingClientRect().left -
          trilha.getBoundingClientRect().left +
          trilha.scrollLeft;
        trilha.scrollTo({
          left: Math.max(
            0,
            esquerda - (trilha.clientWidth - escolha.clientWidth) / 2
          ),
          behavior: movimentoReduzido.matches ? "auto" : "smooth",
        });
      }
      transicao?.cancel();
      if (antigo !== indice && !movimentoReduzido.matches)
        transicao = slides[indice].animate(
          [
            {
              opacity: 0.35,
              transform: `translateX(${indice > antigo ? 14 : -14}px)`,
            },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 240, easing: "ease-out" }
        );
      if (focoNoSlide) slides[indice].focus({ preventScroll: true });
    }

    mostrar(
      Math.max(
        0,
        radios.findIndex(radio => radio.checked)
      )
    );
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
      inicioDeslize = evento.button === 0 ? evento : undefined;
    });
    conteudoDestaques.addEventListener("dragstart", evento =>
      evento.preventDefault()
    );
    conteudoDestaques.addEventListener("pointermove", evento => {
      if (inicioDeslize?.pointerId !== evento.pointerId) return;
      const dx = evento.clientX - inicioDeslize.clientX,
        dy = evento.clientY - inicioDeslize.clientY;
      if (Math.abs(dx) > 12 && Math.abs(dx) > 1.4 * Math.abs(dy)) {
        cancelouAbertura = true;
        conteudoDestaques.setPointerCapture(evento.pointerId);
      }
    });
    conteudoDestaques.addEventListener("keydown", evento => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key))
        return;
      evento.preventDefault();
      if (evento.key === "Home") mostrar(0);
      else if (evento.key === "End") mostrar(slides.length - 1);
      else trocar(evento.key === "ArrowRight" ? 1 : -1);
    });
    conteudoDestaques.addEventListener("pointercancel", () => {
      inicioDeslize = undefined;
    });
    conteudoDestaques.addEventListener("pointerup", evento => {
      if (inicioDeslize?.pointerId !== evento.pointerId) return;
      const horizontal = evento.clientX - inicioDeslize.clientX;
      const vertical = evento.clientY - inicioDeslize.clientY;
      inicioDeslize = undefined;
      if (
        Math.abs(horizontal) < 45 ||
        Math.abs(horizontal) < 1.4 * Math.abs(vertical)
      )
        return;
      cancelouAbertura = true;
      trocar(horizontal < 0 ? 1 : -1);
    });
    conteudoDestaques.addEventListener(
      "click",
      evento => {
        if (cancelouAbertura && evento.detail > 0) evento.preventDefault();
        cancelouAbertura = false;
      },
      true
    );
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

document
  .querySelectorAll(".dc-event-carousel .dc-event-nav")
  .forEach(navegacaoEventos => {
    const anterior = navegacaoEventos.querySelector(".dc-event-prev");
    const faixaEventos = document.getElementById(
      anterior.getAttribute("aria-controls")
    );
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
      progresso.style.setProperty(
        "--dc-event-progress-start",
        `${(posicao / scrollWidth) * 100}%`
      );
      progresso.style.setProperty(
        "--dc-event-progress-width",
        `${(clientWidth / scrollWidth) * 100}%`
      );
    }

    function rolarEventos(sentido) {
      const passo =
        segundo.getBoundingClientRect().left -
        primeiro.getBoundingClientRect().left;
      faixaEventos.scrollBy({
        left: sentido * passo,
        behavior: movimentoReduzido.matches ? "auto" : "smooth",
      });
    }

    anterior.addEventListener("click", () => rolarEventos(-1));
    proximo.addEventListener("click", () => rolarEventos(1));
    faixaEventos.addEventListener("scroll", atualizarNavegacao, {
      passive: true,
    });
    new ResizeObserver(atualizarNavegacao).observe(faixaEventos);
    atualizarNavegacao();
  });

const filtros = document.querySelector(".dc-tabs");
if (filtros && document.referrer && !movimentoReduzido.matches) {
  const origem = new URL(document.referrer);
  if (
    origem.origin === location.origin &&
    origem.pathname === location.pathname
  ) {
    const links = Array.from(filtros.querySelectorAll("a"));
    const parametro = filtros.dataset.queryParam || "tipo";
    const categoria = url =>
      url.searchParams.get(parametro) || (parametro === "tipo" ? "tudo" : "");
    const anterior = links.findIndex(
      link => categoria(new URL(link.href)) === categoria(origem)
    );
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
          x:
            item.left -
            barra.left -
            filtros.clientLeft +
            (item.width - primeiro.width) / 2,
          y:
            item.top -
            barra.top -
            filtros.clientTop +
            (item.height - primeiro.height) / 2,
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
      animacao.finished.then(
        () => trilha.remove(),
        () => trilha.remove()
      );
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
