const formTemaEvento = document.querySelector("[data-event-form]");
const previasTemaEvento = formTemaEvento?.querySelectorAll(
  ".event-theme-preview"
);

if (previasTemaEvento?.length) {
  const campos = formTemaEvento.elements;
  const cores = [...campos.cor.options].map(opcao => `band-${opcao.value}`);
  const calendario = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  });
  const mesAbreviado = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });

  function atualizarPrevias() {
    const titulo = campos.titulo.value.trim() || "Batalha da Praça";
    const categoriasWorkshop = [
      ...formTemaEvento.querySelectorAll('input[name="tiposWorkshop"]:checked'),
    ].map(campo => campo.value);
    const tipo =
      (campos.categoria.value === "Outro" &&
        campos.categoriaDetalhe.value.trim()) ||
      campos.categoria.value ||
      "Batalha de rima";
    const detalhes = [
      campos.organizador.value.trim(),
      campos.local.value.trim() || "Praça Roosevelt, São Paulo",
      campos.horario.value || "19h30",
    ]
      .filter(Boolean)
      .join(" · ");
    const iso = campos.data.value || "2026-11-23";
    const data = new Date(`${iso}T00:00:00Z`);

    previasTemaEvento.forEach(previa => {
      const cartao = previa.querySelector(".dc-event-card");
      const cartazWorkshop =
        cartao?.dataset.eventTheme === "cartaz-de-rua" &&
        campos.categoria.value === "Workshop";
      if (cartao) cartao.dataset.eventCategory = campos.categoria.value;
      previa.querySelector(".dc-event-title").textContent = titulo;
      previa.querySelector(".dc-event-type").textContent = cartazWorkshop
        ? "Workshop"
        : campos.categoria.value === "Workshop"
          ? ["Workshop", ...categoriasWorkshop].join(" · ")
          : tipo;
      const categoriaWorkshop = previa.querySelector(
        ".dc-event-workshop-category"
      );
      if (categoriaWorkshop) {
        categoriaWorkshop.hidden = !cartazWorkshop;
        categoriaWorkshop.textContent =
          categoriasWorkshop.join(" · ") || "Categoria do workshop";
      }
      previa.querySelector(".dc-event-meta").textContent = detalhes;
      const faixa = previa.querySelector(".events-card-accent");
      faixa.classList.remove(...cores);
      faixa.classList.add(`band-${campos.cor.value}`);
      if (Number.isNaN(data.getTime())) return;
      const selo = previa.querySelector("time");
      selo.dateTime = iso;
      selo.setAttribute("aria-label", calendario.format(data));
      selo.querySelector("span").textContent = mesAbreviado
        .format(data)
        .replace(".", "")
        .toUpperCase();
      selo.querySelector("strong").textContent = String(
        data.getUTCDate()
      ).padStart(2, "0");
    });
  }

  formTemaEvento.addEventListener("input", atualizarPrevias);
  atualizarPrevias();
}
