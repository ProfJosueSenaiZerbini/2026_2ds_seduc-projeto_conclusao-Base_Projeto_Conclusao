(() => {
  document.querySelectorAll("[data-global-search]").forEach(form => {
    const input = form.querySelector('input[name="q"]');
    const panel = form.querySelector(".global-search-suggestions");
    const list = panel.querySelector("ul");
    const status = panel.querySelector('[role="status"]');
    const all = panel.querySelector(".global-search-all");
    const button = form.querySelector(".global-search-button");
    form.classList.add("is-collapsible");
    button.setAttribute("aria-controls", input.id);
    const setOpen = open => {
      form.classList.toggle("is-open", open);
      input.inert = !open;
      button.type = open ? "submit" : "button";
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute(
        "aria-label",
        open ? "Pesquisar na Cypher" : "Abrir busca"
      );
    };
    setOpen(false);
    const collapse = () => {
      close();
      setOpen(false);
    };
    button.addEventListener("click", event => {
      if (form.classList.contains("is-open")) return;
      event.preventDefault();
      setOpen(true);
      input.focus();
    });
    let timer;
    let controller;
    let version = 0;
    const close = () => {
      clearTimeout(timer);
      controller?.abort();
      version++;
      panel.hidden = true;
      input.setAttribute("aria-expanded", "false");
    };
    const update = () => {
      close();
      const q = input.value.trim();
      if (q.length < 2) return;
      const current = version;
      list.replaceChildren();
      all.href = "/search?" + new URLSearchParams({ q });
      status.textContent = "Buscando na cena…";
      panel.hidden = false;
      input.setAttribute("aria-expanded", "true");
      timer = setTimeout(async () => {
        controller = new AbortController();
        try {
          const response = await fetch(
            "/search/suggestions?" + new URLSearchParams({ q }),
            {
              signal: controller.signal,
              headers: { Accept: "application/json" },
            }
          );
          if (
            !response.ok ||
            !response.headers.get("content-type")?.includes("application/json")
          )
            throw new Error("Busca indisponível");
          const data = await response.json();
          if (current !== version) return;
          for (const item of data.itens) {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = item.url;
            const name = document.createElement("strong");
            name.textContent = item.titulo;
            const detail = document.createElement("small");
            detail.textContent = [item.categoria, item.detalhe]
              .filter(Boolean)
              .join(" · ");
            link.append(name, detail);
            li.append(link);
            list.append(li);
          }
          status.textContent = data.itens.length
            ? "Sugestões rápidas"
            : "Nenhuma sugestão. Veja os resultados ou tente outro termo.";
          all.href = data.url;
        } catch (error) {
          if (error.name !== "AbortError" && current === version)
            status.textContent =
              "Não foi possível carregar sugestões. Pressione Enter para pesquisar.";
        }
      }, 250);
    };
    input.addEventListener("input", update);
    input.addEventListener("focus", update);
    form.addEventListener("keydown", event => {
      if (event.key === "Escape" && form.classList.contains("is-open")) {
        event.preventDefault();
        button.focus();
        collapse();
      }
      if (event.key === "Enter" && event.target === input) close();
      if (
        (event.key !== "ArrowDown" && event.key !== "ArrowUp") ||
        panel.hidden
      )
        return;
      const links = [...panel.querySelectorAll("a")];
      const index = links.indexOf(document.activeElement);
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      event.preventDefault();
      if (next < 0) input.focus();
      else links[Math.min(next, links.length - 1)]?.focus();
    });
    form.addEventListener("focusout", event => {
      if (!form.contains(event.relatedTarget)) collapse();
    });
    document.addEventListener("pointerdown", event => {
      if (!form.contains(event.target)) collapse();
    });
    form.addEventListener("submit", close);
  });
  const searchPage = document.querySelector(".cy-search");
  if (!searchPage) return;
  const pending = () => {
    searchPage.classList.add("search-pending");
    searchPage
      .querySelector(".search-results")
      ?.setAttribute("aria-busy", "true");
    searchPage.querySelector("[data-search-status]").textContent =
      "Carregando resultados…";
  };
  searchPage
    .querySelectorAll("form")
    .forEach(form => form.addEventListener("submit", pending));
  searchPage.querySelectorAll("[data-search-navigation]").forEach(link =>
    link.addEventListener("click", event => {
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        event.button === 0
      )
        pending();
    })
  );
  window.addEventListener("pageshow", () => {
    searchPage.classList.remove("search-pending");
    searchPage.querySelector(".search-results")?.removeAttribute("aria-busy");
    searchPage.querySelector("[data-search-status]").textContent = "";
  });
})();
