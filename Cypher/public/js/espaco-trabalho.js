(() => {
  const menu = document.querySelector(".et-create");
  if (menu) {
    const controle = menu.querySelector("summary");
    function fechar(devolverFoco) {
      menu.open = false;
      if (devolverFoco) controle.focus();
    }

    menu.addEventListener("toggle", () => {
      controle.setAttribute("aria-label", menu.open ? "Fechar menu de criação" : "Abrir menu de criação");
    });
    document.addEventListener("click", evento => {
      if (!menu.contains(evento.target)) fechar(false);
    });
    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape" && menu.open) {
        evento.preventDefault();
        fechar(true);
      }
    });
    menu.addEventListener("focusout", evento => {
      if (evento.relatedTarget && !menu.contains(evento.relatedTarget))
        fechar(false);
    });
  }
  if (
    location.hash === "#cadastro-obra" &&
    document.getElementById("cadastro-obra")
  )
    location.replace("/works/new");
  const filtro = document.querySelector(".et-filter");
  if (!filtro) return;
  const busca = filtro.elements.q;
  let atraso,
    requisicao,
    versao = 0;
  async function filtrar() {
    clearTimeout(atraso);
    requisicao?.abort();
    const atual = ++versao;
    requisicao = new AbortController();
    const url = new URL(filtro.action, location.origin);
    for (const [chave, valor] of new FormData(filtro))
      if (valor && !(chave === "profissao" && valor === "todas"))
        url.searchParams.set(chave, valor);
    const resultados = document.querySelector("#et-resultados");
    resultados.setAttribute("aria-busy", "true");
    try {
      const resposta = await fetch(url, { signal: requisicao.signal });
      const pagina = new DOMParser().parseFromString(
        await resposta.text(),
        "text/html"
      );
      if (atual !== versao) return;
      const novos = pagina.querySelector("#et-resultados");
      if (!novos || !resposta.ok) {
        location.assign(url);
        return;
      }
      resultados.replaceChildren(...novos.childNodes);
      const voltar = document.querySelector(".et-filter ~ .et-back");
      if (voltar)
        voltar.href = pagina.querySelector(".et-filter ~ .et-back").href;
      document.querySelector(".et-feedback")?.remove();
      history.replaceState(null, "", url);
      document.querySelector("#et-aviso").textContent = [
        ...resultados.querySelectorAll("h2"),
      ]
        .map(h => h.textContent)
        .join(". ");
    } catch (erro) {
      if (erro.name !== "AbortError" && atual === versao) location.assign(url);
    } finally {
      if (atual === versao) resultados.removeAttribute("aria-busy");
    }
  }
  filtro.addEventListener("submit", evento => {
    evento.preventDefault();
    filtrar();
  });
  filtro.addEventListener("change", evento => {
    if (["profissao", "modalidade"].includes(evento.target.name)) filtrar();
  });
  busca.addEventListener("input", () => {
    ++versao;
    requisicao?.abort();
    clearTimeout(atraso);
    atraso = setTimeout(filtrar, 250);
  });
})();
