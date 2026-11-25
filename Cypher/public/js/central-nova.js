(() => {
  const guides = document.querySelector("[data-cn-guides]");
  const moreGuides = document.querySelector("[data-cn-more]");
  if (guides && moreGuides) {
    const limit = Number(guides.dataset.limit),
      cards = [...guides.querySelectorAll(":scope > .cn-card")],
      notice = document.querySelector("[data-cn-guides-status]");
    if (limit > 0 && cards.length > limit) {
      let expanded = false;
      moreGuides.hidden = false;
      const render = () => {
        cards.forEach(
          (card, index) => (card.hidden = !expanded && index >= limit)
        );
        moreGuides.setAttribute("aria-expanded", String(expanded));
        moreGuides.textContent = expanded
          ? "Mostrar os primeiros guias"
          : "Explorar todos os guias";
        notice.textContent = `${expanded ? cards.length : limit} de ${cards.length} guias apresentados`;
      };
      moreGuides.addEventListener("click", () => {
        expanded = !expanded;
        render();
      });
      render();
    }
  }

  const passos = document.querySelector("[data-cn-passos]");
  if (passos) {
    const checks = [...passos.querySelectorAll("[data-cn-concluido]")];
    const progress = document.querySelector("#cn-progresso");
    const text = document.querySelector("#cn-progresso-texto");
    const refresh = () => {
      const complete = checks.filter(c => c.checked).length;
      progress.value = complete;
      text.textContent = `${complete} de ${checks.length} etapas compreendidas`;
    };
    checks.forEach(check => check.addEventListener("change", refresh));
    const toggle = document.querySelector("[data-cn-expandir]");
    toggle?.addEventListener("click", () => {
      const all = [...passos.querySelectorAll("details")];
      const open = all.some(d => !d.open);
      all.forEach(d => {
        d.open = open;
      });
      toggle.textContent = open ? "Recolher etapas" : "Expandir etapas";
      toggle.setAttribute("aria-expanded", String(open));
    });
    refresh();
  }

  const feedback = document.querySelector("[data-cn-feedback]");
  if (feedback) {
    const negative = feedback.querySelector("[data-cn-feedback-negativo]");
    const reason = feedback.querySelector("[name=motivo]");
    const comment = feedback.querySelector("[name=comentario]");
    const refresh = () => {
      const isNegative =
        feedback.querySelector("[name=util]:checked")?.value === "nao";
      negative.hidden = !isNegative;
      reason.disabled = !isNegative;
      comment.disabled = !isNegative;
      reason.required = isNegative;
      const other =
        isNegative && ["outro", "outro_motivo"].includes(reason.value);
      comment.required = other;
      comment.minLength = other ? 10 : 0;
    };
    feedback.addEventListener("change", refresh);
    refresh();
  }

  const form = document.querySelector("#cn-editor-form");
  if (!form) return;
  const container = document.querySelector("#cn-editor-passos");
  const field = document.querySelector("#cn-passos-json");
  const add = document.querySelector("#cn-adicionar-passo");
  const status = document.querySelector("#cn-editor-status");
  let steps = [];
  try {
    const parsed = JSON.parse(field.value);
    if (Array.isArray(parsed)) steps = parsed;
  } catch {}
  if (!steps.length) steps = [{ titulo: "", conteudo: "", dica: "" }];
  const el = (name, text, className) => {
    const element = document.createElement(name);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const sync = () => {
    field.value = JSON.stringify(steps);
  };
  function render() {
    container.replaceChildren();
    steps.forEach((step, index) => {
      const panel = el("section", null, "cn-editor-step");
      const header = el("div", null, "cn-editor-step-heading");
      header.append(el("h4", `Etapa ${String(index + 1).padStart(2, "0")}`));
      const actions = el("div", null, "cn-editor-step-actions");
      for (const [name, offset] of [
        ["Subir", -1],
        ["Descer", 1],
        ["Retirar", 0],
      ]) {
        const button = el("button", name, "cn-button");
        button.type = "button";
        button.disabled =
          offset === 0
            ? steps.length === 1
            : index + offset < 0 || index + offset >= steps.length;
        button.setAttribute("aria-label", `${name} etapa ${index + 1}`);
        button.addEventListener("click", () => {
          if (offset === 0) steps.splice(index, 1);
          else
            [steps[index], steps[index + offset]] = [
              steps[index + offset],
              steps[index],
            ];
          render();
          status.textContent =
            offset === 0
              ? `Etapa retirada. ${steps.length} etapas no guia.`
              : "Ordem das etapas atualizada.";
        });
        actions.append(button);
      }
      header.append(actions);
      panel.append(header);
      for (const spec of [
        {
          key: "titulo",
          label: "Título da etapa",
          tag: "input",
          max: 100,
          min: 3,
          required: true,
        },
        {
          key: "conteudo",
          label: "Explicação / ação prática",
          tag: "textarea",
          max: 1600,
          min: 10,
          required: true,
        },
        {
          key: "dica",
          label: "Dica opcional",
          tag: "textarea",
          max: 300,
          min: 0,
          required: false,
        },
      ]) {
        const label = el("label", spec.label);
        const control = el(spec.tag);
        if (spec.tag === "input") control.type = "text";
        else control.rows = spec.key === "conteudo" ? 4 : 2;
        control.maxLength = spec.max;
        control.minLength = spec.min;
        control.required = spec.required;
        control.value = String(step[spec.key] || "");
        control.addEventListener("input", () => {
          step[spec.key] = control.value;
          sync();
        });
        label.append(control);
        panel.append(label);
      }
      container.append(panel);
    });
    add.disabled = steps.length >= 12;
    sync();
  }
  add.addEventListener("click", () => {
    if (steps.length >= 12) return;
    steps.push({ titulo: "", conteudo: "", dica: "" });
    render();
    container.lastElementChild.querySelector("input").focus();
    status.textContent = `Etapa ${steps.length} adicionada.`;
  });
  form.addEventListener("submit", sync);
  render();
})();
