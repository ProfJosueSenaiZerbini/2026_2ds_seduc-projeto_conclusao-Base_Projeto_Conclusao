(() => {
  // Preserve the native label, control, autocomplete and validation semantics.
  function prepareField(label) {
    if (label.classList.contains("floating-field")) return;
    const control = label.querySelector(":scope > :is(input,select,textarea)");
    if (!control || (control.tagName === "INPUT" && !["text","email","url","tel","number","search","date","password"].includes(control.type))) return;
    const caption = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      || label.querySelector(":scope > span:not([class])");
    if (!caption || label.querySelector("label")) return;
    const title = document.createElement("span");
    title.className = "field-caption";
    title.textContent = caption.textContent.trim();
    caption.replaceWith(title);
    const required = label.querySelector(":scope > .required-mark");
    if (required) title.append(required);
    label.classList.add("floating-field");
    if (control.matches("input:not([type=date]),textarea") && !control.hasAttribute("placeholder")) control.placeholder = " ";
  }

  for (const form of document.forms) {
    form.querySelectorAll("label").forEach(prepareField);
    if (!form.matches("[data-work-form], [data-event-form], [data-beat-form]")) continue;
    new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches("label")) prepareField(node);
          else node.querySelectorAll("label").forEach(prepareField);
        }
      }
    }).observe(form, { childList: true, subtree: true });
  }

  for (const select of document.querySelectorAll(".gender-field select")) {
    const field = select.closest(".gender-field").querySelector("[data-custom-gender]");
    const sync = () => {
      field.hidden = select.value !== "outro";
      field.querySelector("input").disabled = field.hidden;
      for (const title of select.form.querySelectorAll("[data-profissao]")) {
        title.textContent = title.dataset[select.value] || title.dataset.neutro;
      }
      for (const panel of select.form.querySelectorAll("[data-atuacao-questionario]")) {
        const title = select.form.querySelector(`[data-profissao="${CSS.escape(panel.dataset.categoria)}"]`);
        if (!title) continue;
        panel.querySelector("h3").textContent = title.textContent;
        panel.setAttribute("aria-label", "Questionário de atuação: " + title.textContent);
        panel.querySelector("[data-visibilidade-categoria]")?.setAttribute("aria-label", "Visibilidade da categoria " + title.textContent);
      }
    };
    select.addEventListener("change", sync);
    sync();
  }

  for (const form of document.querySelectorAll(".tag-panel form:not([data-register-form])")) {
    form.addEventListener("invalid", event => {
      event.preventDefault();
      let notice = form.querySelector("[data-validation-notice]");
      if (!notice) {
        notice = document.createElement("p");
        notice.className = "auth-message auth-message-error";
        notice.dataset.validationNotice = "";
        notice.setAttribute("role", "alert");
        form.prepend(notice);
      }
      notice.textContent = event.target.validationMessage;
      notice.hidden = false;
      event.target.focus();
      event.target.addEventListener("input", () => { notice.hidden = true; }, {once:true});
    }, true);
  }

  document.addEventListener("pointerup", event => {
    const button = event.target.closest?.("form .button, .tag-panel .button");
    if (!button || event.pointerType === "mouse") return;
    button.classList.add("button-tapped");
    window.setTimeout(() => button.classList.remove("button-tapped"), 200);
  });

  const password = document.querySelector('.tag-panel input[name="password"]');
  if (password) {
    const label = password.closest("label");
    const group = document.createElement("div");
    group.className = "password-control";
    label.before(group);
    group.append(label);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "password-toggle";
    password.id ||= "senha-principal";
    toggle.setAttribute("aria-controls", password.id);
    toggle.append(document.querySelector("[data-password-icons]").content.cloneNode(true));
    function show(visible) {
      password.type = visible ? "text" : "password";
      toggle.setAttribute("aria-label", visible ? "Ocultar senha" : "Mostrar senha");
      toggle.querySelector("[data-show]").hidden = visible;
      toggle.querySelector("[data-hide]").hidden = !visible;
    }
    toggle.addEventListener("click", () => show(password.type === "password"));
    window.addEventListener("pagehide", () => show(false));
    group.append(toggle);
    show(false);
  }
})();
