(() => {
  const nav = document.querySelector(".pf-nav");
  const atual = nav?.querySelector("[aria-current]");
  if (atual && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft =
      atual.getBoundingClientRect().left -
      nav.getBoundingClientRect().left -
      (nav.clientWidth - atual.offsetWidth) / 2;
  }
  const contexto = document.querySelector("[data-profile-context]");
  if (contexto) {
    contexto.classList.add("is-enhanced");
    contexto.elements.atuacao.addEventListener("change", () =>
      contexto.requestSubmit()
    );
  }
  const editor = document.querySelector("[data-seal-editor]");
  if (editor) {
    const previa = editor.querySelector("[data-seal-preview]");
    editor.addEventListener("input", () => {
      previa.textContent =
        editor.elements.letras.value.toLocaleUpperCase("pt-BR");
      previa.dataset.forma = editor.elements.forma.value;
      previa.dataset.cor = editor.elements.cor.value;
    });
  }
  const menu = document.querySelector(".pf-menu");
  if (menu) {
    document.addEventListener("click", event => {
      if (!menu.contains(event.target)) menu.open = false;
    });
    menu.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  }
  const compartilhar = document.querySelector("[data-share-profile]");
  compartilhar?.addEventListener("click", async event => {
    event.preventDefault();
    const url = compartilhar.href;
    const status = document.querySelector(".pf-share-status");
    try {
      if (navigator.share)
        await navigator.share({ title: document.title, url });
      else {
        await navigator.clipboard.writeText(url);
        status.textContent = "Link copiado.";
      }
      menu.open = false;
      menu.querySelector("summary").focus();
    } catch (erro) {
      if (erro.name !== "AbortError")
        window.prompt("Copie o endereço deste perfil", url);
    }
  });

  // Favoritos e links de catálogos anteriores usavam apenas o fragmento da obra.
  function abrirFichaAntiga() {
    const url = new URL(location.href);
    if (!url.pathname.startsWith("/p/") || !url.hash.startsWith("#obra-"))
      return;
    let id;
    try {
      id = decodeURIComponent(url.hash.slice(6));
    } catch {
      return;
    }
    if (!id || url.searchParams.get("obra") === id) return;
    url.search = new URLSearchParams({ obra: id }).toString();
    location.replace(url.href);
  }
  abrirFichaAntiga();
  window.addEventListener("hashchange", abrirFichaAntiga);
})();
