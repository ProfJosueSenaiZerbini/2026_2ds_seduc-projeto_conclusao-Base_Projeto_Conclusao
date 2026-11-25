(() => {
  const pagina = document.querySelector(".ob-acervo");
  if (!pagina) return;
  const cards = [...pagina.querySelectorAll("[data-ob-card]")];
  const prateleiras = [...pagina.querySelectorAll("[data-ob-shelf]")];
  const colecao = pagina.querySelector("[data-ob-collection]");
  const status = pagina.querySelector("[data-ob-status]");
  const anunciar = texto => {
    if (status) status.textContent = texto;
  };
  const favoritos = new Set(cards.filter(c => c.dataset.obLiked === "true").map(c => c.dataset.obId));
  let soFavoritos = new URL(location.href).searchParams.get("curtidos") === "1";
  const movimentoReduzido = matchMedia("(prefers-reduced-motion: reduce)");
  function saltarCurtida(botao, total) {
    botao.querySelector(".ob-like-jump")?.remove();
    if (movimentoReduzido.matches) return;
    const numero = document.createElement("span");
    numero.className = "ob-like-jump";
    numero.setAttribute("aria-hidden", "true");
    numero.textContent = total;
    botao.append(numero);
    numero.addEventListener("animationend", () => numero.remove(), { once: true });
  }
  function preservarFiltro() {
    const url = new URL(location.href);
    if (soFavoritos) url.searchParams.set("curtidos", "1");
    else url.searchParams.delete("curtidos");
    history.replaceState(null, "", url);
    pagina.querySelectorAll(".ob-format-tabs a").forEach(link => {
      const destino = new URL(link.href);
      if (soFavoritos) destino.searchParams.set("curtidos", "1");
      else destino.searchParams.delete("curtidos");
      link.href = destino;
    });
    pagina.querySelectorAll(".ob-filter form, .ob-sort").forEach(form => {
      form.querySelector('[name="curtidos"]')?.remove();
      if (soFavoritos) {
        const campo = document.createElement("input");
        campo.type = "hidden"; campo.name = "curtidos"; campo.value = "1";
        form.append(campo);
      }
    });
  }
  const audio = new Audio();
  audio.preload = "none";
  let atual = null;
  let falhou = false;
  let pedido = 0;

  function atualizarColecao() {
    let quantidade = 0;
    for (const card of cards) {
      const favorito = favoritos.has(card.dataset.obId);
      const botao = card.querySelector("[data-ob-favorite]");
      botao.hidden = false;
      botao.setAttribute("aria-pressed", String(favorito));
      botao.setAttribute(
        "aria-label",
        `${favorito ? "Descurtir" : "Curtir"} ${card.dataset.obTitle}, ${card.dataset.obLikes} curtidas`
      );
      botao.querySelector("[data-ob-like-total]").textContent = card.dataset.obLikes;
      card.hidden = soFavoritos && !favorito;
      if (!card.hidden) quantidade++;
      if (card.hidden && card === atual) audio.pause();
    }
    for (const prateleira of prateleiras) {
      const total = [...prateleira.querySelectorAll("[data-ob-card]")].filter(
        c => !c.hidden
      ).length;
      prateleira.hidden = total === 0;
      prateleira.querySelector("[data-ob-shelf-count]").textContent =
        `${total} ${total === 1 ? "obra" : "obras"}`;
    }
    const total = pagina.querySelector("[data-ob-total]");
    if (total)
      total.textContent = `${quantidade} ${quantidade === 1 ? "obra" : "obras"}`;
    const contador = pagina.querySelector("[data-ob-favorite-count]");
    if (contador)
      contador.textContent = cards.filter(c =>
        favoritos.has(c.dataset.obId)
      ).length;
    colecao?.setAttribute("aria-pressed", String(soFavoritos));
    preservarFiltro();
    const vazio = pagina.querySelector("[data-ob-collection-empty]");
    if (vazio) vazio.hidden = !soFavoritos || quantidade > 0;
  }
  cards.forEach(card => {
    const botao = card.querySelector("[data-ob-favorite]");
    botao.addEventListener("click", async () => {
      if (botao.disabled) return;
      botao.disabled = true;
      const id = card.dataset.obId;
      const curtida = !favoritos.has(id);
      try {
        const resposta = await fetch(`/works/${encodeURIComponent(id)}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": document.querySelector('meta[name="csrf-token"]')?.content || "" },
          body: JSON.stringify({ curtida }),
        });
        if (!resposta.ok || resposta.redirected) throw new Error("Falha ao salvar");
        const resultado = await resposta.json();
        if (resultado.curtida) favoritos.add(id);
        else favoritos.delete(id);
        card.dataset.obLikes = String(resultado.total);
        atualizarColecao();
        if (resultado.curtida) saltarCurtida(botao, resultado.total);
        else botao.querySelector(".ob-like-jump")?.remove();
        anunciar(`${card.dataset.obTitle}: ${resultado.total} curtidas. ${resultado.curtida ? "Curtida adicionada." : "Curtida removida."}`);
        if (card.hidden) colecao?.focus();
      } catch {
        anunciar("Não foi possível salvar a curtida. Tente novamente.");
      } finally { botao.disabled = false; }
    });
  });
  colecao?.addEventListener("click", () => {
    soFavoritos = !soFavoritos;
    atualizarColecao();
    anunciar(
      soFavoritos
        ? "Exibindo seus favoritos nesta seleção."
        : "Exibindo todo o acervo da seleção."
    );
  });
  pagina.querySelector("[data-ob-show-all]")?.addEventListener("click", () => {
    soFavoritos = false;
    atualizarColecao();
    colecao?.focus();
  });
  if (colecao) colecao.hidden = false;
  atualizarColecao();
  function atualizarPlayer() {
    for (const card of cards) {
      const previa = card.querySelector("[data-ob-preview]");
      if (!previa?.dataset.obSrc) continue;
      const tocando =
        card === atual && !falhou && !audio.paused && !audio.ended;
      card.classList.toggle("ob-is-playing", tocando);
      const botao = previa.querySelector("[data-ob-play]");
      botao.setAttribute("aria-pressed", String(tocando));
      botao.setAttribute(
        "aria-label",
        `${tocando ? "Pausar" : "Ouvir"} prévia de ${card.dataset.obTitle}`
      );
      previa.querySelector("[data-ob-preview-label]").textContent =
        card === atual && falhou
          ? "Tentar novamente"
          : tocando
            ? "Tocando prévia"
            : "Ouvir prévia";
      const progresso =
        card === atual && Number.isFinite(audio.duration) && audio.duration > 0
          ? (audio.currentTime / audio.duration) * 100
          : 0;
      previa.querySelector("[data-ob-progress]").style.width = `${progresso}%`;
    }
  }
  cards.forEach(card => {
    const previa = card.querySelector("[data-ob-preview]");
    if (!previa?.dataset.obSrc) return;
    previa
      .querySelector("[data-ob-play]")
      .addEventListener("click", async () => {
        const tentativa = ++pedido;
        if (card === atual && !audio.paused && !falhou) {
          audio.pause();
          return;
        }
        if (card !== atual || falhou) {
          audio.pause();
          atual = card;
          audio.src = previa.dataset.obSrc;
        }
        falhou = false;
        if (audio.ended) audio.currentTime = 0;
        try {
          await audio.play();
          if (tentativa === pedido)
            anunciar(`Ouvindo prévia de ${card.dataset.obTitle}.`);
        } catch {
          if (tentativa !== pedido) return;
          falhou = true;
          audio.pause();
          atualizarPlayer();
          anunciar(
            `A prévia de ${card.dataset.obTitle} não carregou. Tente novamente.`
          );
        }
      });
  });
  for (const evento of ["play", "pause", "ended", "timeupdate"])
    audio.addEventListener(evento, atualizarPlayer);
  audio.addEventListener("error", () => {
    falhou = true;
    audio.pause();
    atualizarPlayer();
  });
  window.addEventListener("pagehide", () => {
    pedido++;
    audio.pause();
  });
  cards.forEach(card => {
    const dialog = card.querySelector("[data-ob-album]");
    if (!dialog) return;
    const faixas = [...dialog.querySelectorAll("[data-ob-album-track]")];
    let origem;
    let overflowAnterior;
    let brilhoTimer;
    const selecionar = indice => {
      clearTimeout(brilhoTimer);
      faixas.forEach(faixa => faixa.classList.remove("ob-track-glow"));
      const faixa = faixas[indice];
      if (!faixa) return;
      void faixa.offsetWidth;
      faixa.classList.add("ob-track-glow");
      brilhoTimer = setTimeout(() => faixa.classList.remove("ob-track-glow"), 1800);
    };
    card
      .querySelectorAll("[data-ob-track-open], .ob-cover, h4 a")
      .forEach(link => {
        link.addEventListener("click", evento => {
          if (
            evento.ctrlKey ||
            evento.metaKey ||
            evento.shiftKey ||
            evento.altKey
          )
            return;
          evento.preventDefault();
          origem = link;
          const indice = Number(link.dataset.obTrackOpen || 0);
          overflowAnterior = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          dialog.showModal();
          fontes.forEach((_, indice) => carregarDuracao(indice));
          if (link.hasAttribute("data-ob-track-open")) selecionar(indice);
          faixas[indice]?.focus({ preventScroll: true });
          faixas[indice]?.scrollIntoView({
            block: "nearest",
            behavior: "instant",
          });
        });
      });
    const player = dialog.querySelector("[data-ob-album-audio]");
    const status = dialog.querySelector("[data-ob-audio-status]");
    const tituloAtual = dialog.querySelector("[data-ob-now-title]");
    const toggle = dialog.querySelector("[data-ob-album-listen]");
    const anterior = dialog.querySelector("[data-ob-audio-prev]");
    const seguinte = dialog.querySelector("[data-ob-audio-next]");
    const seek = dialog.querySelector("[data-ob-seek]");
    const elapsed = dialog.querySelector("[data-ob-elapsed]");
    const total = dialog.querySelector("[data-ob-total-time]");
    const fontes = faixas.map(faixa => faixa.dataset.audioSrc || "");
    const tempos = faixas.map(faixa => faixa.querySelector(".ob-album-track-duration"));
    const arquivosLocais = [];
    const metadados = new Map();
    let indiceAtual = -1;
    let tentativaAlbum = 0;
    const formatarTempo = segundos => {
      const inteiro = Math.floor(segundos);
      return `${Math.floor(inteiro / 60)}:${String(inteiro % 60).padStart(2, "0")}`;
    };
    const atualizarTempo = () => {
      const indice = indiceAtual < 0 ? fontes.findIndex(Boolean) : indiceAtual;
      const disponivel = Number.isFinite(player.duration) && player.duration > 0;
      seek.disabled = !disponivel;
      seek.max = disponivel ? player.duration : 1;
      seek.value = disponivel ? player.currentTime : 0;
      seek.setAttribute("aria-valuetext", formatarTempo(player.currentTime));
      seek.style.setProperty("--ob-seek-progress", disponivel ? `${player.currentTime / player.duration * 100}%` : "0%");
      elapsed.textContent = player.currentTime > 0 ? formatarTempo(player.currentTime) : "";
      total.textContent = disponivel ? formatarTempo(player.duration) : tempos[indice]?.textContent || "";
      if (disponivel && player.getAttribute("src") === fontes[indice] && tempos[indice])
        tempos[indice].textContent = total.textContent;
    };
    const carregarDuracao = indice => {
      const fonte = fontes[indice];
      if (!fonte || tempos[indice].textContent.trim() || metadados.has(indice)) return;
      const leitura = new Audio();
      const encerramento = new AbortController();
      leitura.preload = "metadata";
      const liberar = () => {
        encerramento.abort();
        metadados.delete(indice);
        leitura.removeAttribute("src");
        leitura.load();
      };
      const finalizar = () => {
        if (fontes[indice] === fonte && Number.isFinite(leitura.duration) && leitura.duration > 0) {
          tempos[indice].textContent = formatarTempo(leitura.duration);
          atualizarTempo();
        }
        liberar();
      };
      metadados.set(indice, liberar);
      leitura.addEventListener("loadedmetadata", finalizar, { once: true, signal: encerramento.signal });
      leitura.addEventListener("error", finalizar, { once: true, signal: encerramento.signal });
      leitura.src = fonte;
    };
    const faixaDisponivel = direcao => {
      for (let i = indiceAtual + direcao; i >= 0 && i < faixas.length; i += direcao) {
        if (fontes[i]) return i;
      }
      return -1;
    };
    const atualizarFaixa = () => {
      faixas.forEach((faixa, i) => {
        const ativa = i === indiceAtual;
        const tocando = ativa && !player.paused;
        faixa.classList.toggle("ob-track-active", ativa);
        faixa.setAttribute("aria-pressed", String(tocando));
        faixa.querySelector(".ob-album-track-action").textContent = tocando ? "Ⅱ" : "▷";
        faixa.setAttribute("aria-label", `${tocando ? "Pausar" : "Ouvir"} ${faixa.querySelector("strong").textContent}${fontes[i] ? "" : ", áudio não adicionado"}`);
      });
      const tocando = !player.paused && !player.ended;
      const acao = tocando ? "Pausar" : "Reproduzir";
      toggle.dataset.tocando = String(tocando);
      toggle.setAttribute("aria-label", acao);
      toggle.title = acao;
      toggle.disabled = !fontes.some(Boolean);
      if (indiceAtual < 0) {
        tituloAtual.textContent = faixas[fontes.findIndex(Boolean)]?.querySelector("strong").textContent || "Escolha uma faixa";
      }
      anterior.disabled = faixaDisponivel(-1) < 0;
      seguinte.disabled = faixaDisponivel(1) < 0;
      atualizarTempo();
    };
    const tocar = async indice => {
      const faixa = faixas[indice];
      if (!faixa) return;
      const tentativa = ++tentativaAlbum;
      selecionar(indice);
      if (indice === indiceAtual && !player.paused) { player.pause(); return; }
      player.pause();
      indiceAtual = indice;
      tituloAtual.textContent = faixa.querySelector("strong").textContent;
      if (!fontes[indice]) {
        player.removeAttribute("src"); player.load();
        status.textContent = "Adicione o áudio desta faixa em Abrir áudios locais.";
        atualizarFaixa(); return;
      }
      audio.pause();
      document.querySelectorAll("[data-ob-album-audio]").forEach(outro => { if (outro !== player) outro.pause(); });
      if (player.getAttribute("src") !== fontes[indice]) player.src = fontes[indice];
      status.textContent = "Carregando faixa…";
      atualizarFaixa();
      try {
        await player.play();
        if (tentativa === tentativaAlbum) status.textContent = "";
      } catch {
        if (tentativa === tentativaAlbum) status.textContent = "Não foi possível tocar este arquivo. Selecione outro áudio.";
      }
      atualizarFaixa();
    };
    const proxima = direcao => {
      const indice = faixaDisponivel(direcao);
      if (indice >= 0) tocar(indice);
      else atualizarFaixa();
    };
    faixas.forEach((faixa, i) => faixa.addEventListener("click", () => tocar(i)));
    toggle.addEventListener("click", () => {
      tocar(fontes[indiceAtual] ? indiceAtual : fontes.findIndex(Boolean));
    });
    anterior.addEventListener("click", () => proxima(-1));
    seguinte.addEventListener("click", () => proxima(1));
    seek.addEventListener("input", () => { player.currentTime = Number(seek.value); });
    for (const evento of ["loadedmetadata", "durationchange", "timeupdate"])
      player.addEventListener(evento, atualizarTempo);
    player.addEventListener("ended", () => proxima(1));
    player.addEventListener("play", atualizarFaixa);
    player.addEventListener("pause", atualizarFaixa);
    player.addEventListener("error", () => { status.textContent = "Arquivo indisponível ou formato não suportado pelo navegador."; });
    const normalizar = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    dialog.querySelector("[data-ob-audio-files]").addEventListener("change", evento => {
      const arquivos = [...evento.target.files].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}));
      let adicionados = 0;
      arquivos.forEach(arquivo => {
        const nome = arquivo.name.replace(/\.[^.]+$/, "");
        const numero = nome.match(/^(\d{1,2})[\s._-]/);
        let indice = faixas.findIndex(faixa => normalizar(nome.replace(/^\d+[\s._-]+/, "")) === normalizar(faixa.querySelector("strong").textContent));
        if (indice < 0 && numero) indice = Number(numero[1]) - 1;
        if (indice < 0 && arquivos.length === 1 && indiceAtual >= 0) indice = indiceAtual;
        if (indice < 0 || indice >= faixas.length) return;
        const url = URL.createObjectURL(arquivo);
        metadados.get(indice)?.();
        arquivosLocais.push(url); fontes[indice] = url; adicionados++;
        tempos[indice].textContent = "";
        carregarDuracao(indice);
      });
      status.textContent = adicionados ? `${adicionados} áudio(s) conectado(s). Escolha uma faixa para ouvir.` : "Use o título da faixa ou o número no início do nome do arquivo (01, 02…).";
      atualizarFaixa();
      evento.target.value = "";
    });
    atualizarFaixa();
    window.addEventListener("pagehide", () => { player.pause(); arquivosLocais.forEach(url => URL.revokeObjectURL(url)); });
    audio.addEventListener("play", () => player.pause());

    dialog
      .querySelector("[data-ob-album-close]")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", evento => {
      if (evento.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        evento.clientX < r.left ||
        evento.clientX > r.right ||
        evento.clientY < r.top ||
        evento.clientY > r.bottom
      )
        dialog.close();
    });
    dialog.addEventListener("close", () => {
      tentativaAlbum++;
      player.pause();
      metadados.forEach(liberar => liberar());
      clearTimeout(brilhoTimer);
      faixas.forEach(faixa => faixa.classList.remove("ob-track-glow"));
      document.body.style.overflow = overflowAnterior;
      origem?.focus({ preventScroll: true });
    });
  });
})();
