(() => {
  const body = document.body;
  const states = Array.from(document.querySelectorAll("[data-state]"));
  const selectors = Array.from(document.querySelectorAll("[data-profile-select]"));
  const profileNames = {
    neutral: "iBico — Conexões que fazem acontecer",
    contratante: "iBico — Para quem contrata",
    trabalhador: "iBico — Para quem trabalha"
  };
  const descriptions = {
    neutral: "O iBico aproxima quem precisa de um serviço de quem procura uma oportunidade de trabalho.",
    contratante: "Conheça o iBico: publique serviços, acompanhe candidaturas e converse com quem você escolher.",
    trabalhador: "Conheça o iBico: encontre bicos, envie candidaturas e acompanhe suas oportunidades."
  };
  const themeColors = {
    neutral: "#F3EBDD",
    contratante: "#173F35",
    trabalhador: "#8B1728"
  };

  function selectProfile(profile, source) {
    if (!Object.hasOwn(profileNames, profile)) return;

    body.dataset.profile = profile;
    states.forEach((state) => {
      state.hidden = state.dataset.state !== profile;
    });
    selectors.forEach((selector) => {
      selector.setAttribute("aria-pressed", String(selector.dataset.profileSelect === profile));
    });

    document.title = profileNames[profile];
    document.querySelector('meta[name="description"]')?.setAttribute("content", descriptions[profile]);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[profile]);

    if (source?.closest("[data-state]")) {
      document.querySelector(`.landing-switcher [data-profile-select="${profile}"]`)?.focus();
    }
  }

  selectors.forEach((selector) => {
    selector.addEventListener("click", () => selectProfile(selector.dataset.profileSelect, selector));
  });

  selectProfile("neutral");
})();
