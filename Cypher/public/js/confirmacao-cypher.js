(() => {
  const dialogo = document.querySelector("#cy-confirm");
  const aprovados = new WeakSet();
  function confirmar(mensagem, { destrutiva = false, rotulo = "Confirmar" } = {}) {
    if (!dialogo?.showModal) return Promise.resolve(window.confirm(mensagem));
    if (dialogo.open) return Promise.resolve(false);
    const anterior = document.activeElement;
    dialogo.querySelector("#cy-confirm-message").textContent = mensagem;
    dialogo.querySelector(".cy-confirm-submit").textContent = rotulo;
    dialogo.classList.toggle("cy-confirm-danger", destrutiva);
    dialogo.returnValue = "";
    return new Promise(resolve => {
      dialogo.addEventListener("close", () => {
        if (anterior instanceof HTMLElement && anterior.isConnected) anterior.focus({ preventScroll: true });
        resolve(dialogo.returnValue === "confirmar");
      }, { once: true });
      dialogo.showModal();
    });
  }
  window.cypherConfirmar = confirmar;
  document.addEventListener("submit", async evento => {
    const form = evento.target;
    if (!(form instanceof HTMLFormElement) || !form.dataset.confirm || aprovados.delete(form)) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
    const submitter = evento.submitter;
    const aprovado = await confirmar(form.dataset.confirm, {
      destrutiva: form.dataset.confirmDestrutiva === "true",
      rotulo: form.dataset.confirmRotulo || "Confirmar",
    });
    if (!aprovado || !form.isConnected || (submitter && submitter.form !== form)) return;
    aprovados.add(form);
    try { form.requestSubmit(submitter || undefined); } finally { aprovados.delete(form); }
  }, true);
})();
