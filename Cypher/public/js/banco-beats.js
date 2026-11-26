(() => {
  const pagina = document.querySelector(".banco-beats");
  if (!pagina) return;

  const status = pagina.querySelector("[data-beats-status]");
  const anunciar = mensagem => {
    if (status) status.textContent = mensagem;
  };
  const destino = new URL(location.href);
  const ancora = destino.hash.slice(1);
  if (ancora.startsWith("beat-") && !destino.searchParams.has("beat")) {
    let id = "";
    try { id = decodeURIComponent(ancora); } catch {}
    if (id && !document.getElementById(id)) {
      destino.searchParams.set("beat", id.slice(5));
      location.replace(destino);
    }
  }
  const importar = pagina.querySelector("[data-importar-favoritos]");
  const chave = pagina.dataset.favoritesKey;
  let favoritosLocais = [];
  try {
    const dados = JSON.parse(localStorage.getItem(chave) || "[]");
    if (Array.isArray(dados))
      favoritosLocais = [
        ...new Set(
          dados.filter(id => typeof id === "string" && id.length <= 120)
        ),
      ];
  } catch {
    /* Armazenamento local indisponível. */
  }

  if (importar && favoritosLocais.length) {
    importar.hidden = false;
    importar.addEventListener("click", async () => {
      importar.disabled = true;
      const csrf = document.querySelector('meta[name="csrf-token"]').content;
      try {
        while (favoritosLocais.length) {
          const resposta = await fetch("/colecoes/importar-beats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf,
            },
            body: JSON.stringify({ ids: favoritosLocais.slice(0, 100) }),
          });
          if (!resposta.ok) throw new Error();
          favoritosLocais = favoritosLocais.slice(100);
          localStorage.setItem(chave, JSON.stringify(favoritosLocais));
        }
        localStorage.removeItem(chave);
        location.assign("/colecoes");
      } catch {
        importar.disabled = false;
        anunciar("Não foi possível terminar a importação. Tente novamente.");
      }
    });
  }

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
})();
