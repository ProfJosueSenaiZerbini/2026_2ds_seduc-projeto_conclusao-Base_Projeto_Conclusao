(() => {
  const pagina = document.querySelector(".banco-beats");
  if (!pagina) return;

  const status = pagina.querySelector("[data-beats-status]");
  const anunciar = mensagem => {
    if (status) status.textContent = mensagem;
  };
  const catalogo = pagina.querySelector(".beats-catalog");
  const cards = [...pagina.querySelectorAll("[data-beat-card]")];
  const filtro = pagina.querySelector("[data-favorites-filter]");
  const contador = pagina.querySelector("[data-beats-count]");
  const vazio = pagina.querySelector("[data-favorites-empty]");
  const chave = pagina.dataset.favoritesKey;
  let favoritos = new Set();
  let somenteFavoritos = false;

  try {
    const salvos = JSON.parse(localStorage.getItem(chave) || "[]");
    if (Array.isArray(salvos))
      favoritos = new Set(salvos.filter(id => typeof id === "string"));
  } catch {
    /* A seleção continua funcionando quando o armazenamento está indisponível. */
  }

  function atualizarFavoritos() {
    let visiveis = 0;
    for (const card of cards) {
      const favorito = favoritos.has(card.dataset.beatId);
      const botao = card.querySelector("[data-beat-favorite]");
      botao.hidden = false;
      botao.setAttribute("aria-pressed", String(favorito));
      botao.setAttribute(
        "aria-label",
        `${favorito ? "Desfavoritar" : "Favoritar"} ${card.dataset.title}`
      );
      card.hidden = somenteFavoritos && !favorito;
      if (!card.hidden) visiveis++;
    }
    if (contador)
      contador.textContent = `${visiveis} ${visiveis === 1 ? "beat" : "beats"}`;
    const quantidade = pagina.querySelector("[data-favorites-count]");
    if (quantidade)
      quantidade.textContent = cards.filter(card =>
        favoritos.has(card.dataset.beatId)
      ).length;
    if (vazio) vazio.hidden = !somenteFavoritos || visiveis > 0;
    filtro?.setAttribute("aria-pressed", String(somenteFavoritos));
  }

  for (const card of cards) {
    card.querySelector("[data-beat-favorite]").addEventListener("click", () => {
      const id = card.dataset.beatId;
      if (favoritos.has(id)) favoritos.delete(id);
      else favoritos.add(id);
      let persistido = true;
      try {
        localStorage.setItem(chave, JSON.stringify([...favoritos]));
      } catch {
        persistido = false;
      }
      atualizarFavoritos();
      anunciar(
        `${card.dataset.title} ${favoritos.has(id) ? "adicionado aos" : "removido dos"} favoritos.${persistido ? "" : " A seleção está salva apenas nesta página."}`
      );
      if (card.hidden) filtro?.focus();
    });
  }
  filtro?.addEventListener("click", () => {
    somenteFavoritos = !somenteFavoritos;
    atualizarFavoritos();
    anunciar(
      somenteFavoritos
        ? "Exibindo seus favoritos nesta seleção."
        : "Exibindo todos os beats da seleção."
    );
  });
  pagina
    .querySelector("[data-show-all-beats]")
    ?.addEventListener("click", () => {
      somenteFavoritos = false;
      atualizarFavoritos();
      filtro?.focus();
    });
  pagina
    .querySelector("[data-beats-sort]")
    ?.addEventListener("change", evento => {
      const ordem = evento.target.value;
      const valor = (card, campo) =>
        card.dataset[campo] === "" ||
        (Number(card.dataset[campo]) <= 0 && campo === "bpm")
          ? Infinity
          : Number(card.dataset[campo]);
      const ordenados = [...cards];
      if (ordem === "title")
        ordenados.sort((a, b) =>
          a.dataset.title.localeCompare(b.dataset.title, "pt-BR")
        );
      if (ordem === "price" || ordem === "bpm")
        ordenados.sort((a, b) => valor(a, ordem) - valor(b, ordem));
      for (const card of ordenados) catalogo.append(card);
      anunciar(
        `Beats ordenados por ${evento.target.selectedOptions[0].textContent}.`
      );
    });
  const barra = pagina.querySelector("[data-beats-toolbar]");
  if (barra) barra.hidden = false;
  atualizarFavoritos();

  // Uma única fonte de áudio mantém as prévias do destaque e do catálogo sincronizadas.
  const previas = [...pagina.querySelectorAll("[data-beat-preview]")];
  const audio = new Audio();
  audio.preload = "none";
  let atual = null;
  let requisicao = 0;
  let falhaPrevia = null;
  const tempo = segundos =>
    `${Math.floor(segundos / 60)}:${String(Math.floor(segundos % 60)).padStart(2, "0")}`;

  function atualizarPlayer() {
    for (const previa of previas) {
      const selecionada =
        atual && previa.dataset.previewId === atual.dataset.previewId;
      const falhou = falhaPrevia === previa.dataset.previewId;
      const tocando = selecionada && !falhou && !audio.paused && !audio.ended;
      previa.classList.toggle("is-playing", Boolean(tocando));
      const botao = previa.querySelector("[data-preview-play]");
      botao.setAttribute("aria-pressed", String(Boolean(tocando)));
      if (previa.dataset.previewSrc)
        botao.setAttribute(
          "aria-label",
          `${tocando ? "Pausar" : "Ouvir"} prévia de ${previa.dataset.previewTitle}`
        );
      const legenda = previa.querySelector("[data-preview-label]");
      if (previa.dataset.previewSrc)
        legenda.textContent = falhou
          ? "Tentar novamente"
          : tocando
            ? "Tocando prévia"
            : "Ouvir prévia";
      previa.querySelector("[data-preview-time]").textContent = selecionada
        ? tempo(audio.currentTime || 0)
        : previa.dataset.previewSrc
          ? "0:00"
          : "—:—";
      const progresso = previa.querySelector("[data-preview-progress]");
      progresso.hidden = !selecionada || !Number.isFinite(audio.duration);
      progresso.value =
        selecionada && audio.duration > 0
          ? (audio.currentTime / audio.duration) * 100
          : 0;
    }
  }

  for (const previa of previas) {
    previa
      .querySelector("[data-preview-play]")
      .addEventListener("click", async () => {
        if (!previa.dataset.previewSrc) return;
        const pedido = ++requisicao;
        const repetir = falhaPrevia === previa.dataset.previewId;
        falhaPrevia = null;
        if (
          atual?.dataset.previewId === previa.dataset.previewId &&
          !audio.paused
        ) {
          audio.pause();
          return;
        }
        if (atual?.dataset.previewId !== previa.dataset.previewId || repetir) {
          audio.pause();
          atual = previa;
          audio.src = previa.dataset.previewSrc;
        }
        if (audio.ended) audio.currentTime = 0;
        try {
          await audio.play();
          if (pedido === requisicao)
            anunciar(`Ouvindo a prévia de ${previa.dataset.previewTitle}.`);
        } catch {
          if (pedido !== requisicao) return;
          falhaPrevia = previa.dataset.previewId;
          audio.pause();
          atualizarPlayer();
          anunciar(
            `Não foi possível reproduzir a prévia de ${previa.dataset.previewTitle}. Tente novamente.`
          );
        }
      });
  }
  for (const evento of [
    "play",
    "pause",
    "ended",
    "timeupdate",
    "loadedmetadata",
  ])
    audio.addEventListener(evento, atualizarPlayer);
  audio.addEventListener("error", () => {
    falhaPrevia = atual?.dataset.previewId;
    audio.pause();
    atualizarPlayer();
  });
  window.addEventListener("pagehide", () => {
    requisicao++;
    audio.pause();
  });
  window.addEventListener("storage", evento => {
    if (evento.key !== chave && evento.key !== null) return;
    try {
      const salvos = JSON.parse(evento.newValue || "[]");
      favoritos = new Set(
        Array.isArray(salvos) ? salvos.filter(id => typeof id === "string") : []
      );
      atualizarFavoritos();
    } catch {
      /* Ignora dados inválidos de outra aba. */
    }
  });
})();
