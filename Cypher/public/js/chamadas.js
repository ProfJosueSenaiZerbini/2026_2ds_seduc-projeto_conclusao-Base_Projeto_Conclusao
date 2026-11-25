(() => {
  const editor = document.querySelector("[data-op-review]");
  const functions = document.querySelector("[data-op-functions]");
  function renumber() {
    functions?.querySelectorAll("[data-op-function]").forEach((row, i) =>
      row.querySelectorAll("[name]").forEach(input => {
        input.name = input.name.replace(/funcoes\[\d+\]/, `funcoes[${i}]`);
      })
    );
  }
  document.querySelector("[data-op-add]")?.addEventListener("click", () => {
    if (functions.children.length >= 25) return;
    const clone = functions.firstElementChild.cloneNode(true);
    clone.querySelectorAll("input,select,textarea").forEach(input => {
      input.value = input.type === "number" ? "1" : "";
    });
    clone.querySelectorAll(".op-field-error").forEach(e => e.remove());
    functions.append(clone);
    renumber();
    clone.querySelector("select").focus();
  });
  functions?.addEventListener("click", e => {
    if (e.target.closest("[data-op-remove]") && functions.children.length > 1) {
      e.target.closest("[data-op-function]").remove();
      renumber();
    }
  });
  document.querySelector("[data-op-preview]")?.addEventListener("click", () => {
    const summary = document.querySelector("[data-op-summary]"),
      content = summary.querySelector("[data-op-summary-content]");
    content.replaceChildren();
    const dl = document.createElement("dl");
    editor.querySelectorAll("label").forEach(label => {
      const input = label.querySelector("input,textarea,select");
      if (!input?.value) return;
      const dt = document.createElement("dt"),
        dd = document.createElement("dd");
      dt.textContent = label.childNodes[0].textContent.trim();
      dd.textContent =
        input.tagName === "SELECT"
          ? input.selectedOptions[0].textContent
          : input.value;
      dl.append(dt, dd);
    });
    content.append(dl);
    summary.hidden = false;
    summary.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  });
  document.querySelectorAll('.op-content form[method="post"]').forEach(form =>
    form.addEventListener("submit", e => {
      if (form.dataset.confirm && !confirm(form.dataset.confirm)) {
        e.preventDefault();
        return;
      }
      if (form.dataset.sending) {
        e.preventDefault();
        return;
      }
      form.dataset.sending = "1";
      form.setAttribute("aria-busy", "true");
      setTimeout(
        () =>
          form
            .querySelectorAll('button[type="submit"],button:not([type])')
            .forEach(b => (b.disabled = true)),
        0
      );
    })
  );
})();
