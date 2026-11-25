document.addEventListener("submit", async evento => {
  const form = evento.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.ciAction) return;
  evento.preventDefault();
  const botao = form.querySelector("button");
  if (botao.disabled || botao.getAttribute("aria-busy") === "true") return;
  const status = document.querySelector("#ci-status");
  const chave = form.dataset.ciAction;
  const estado = { curtir: "curtido", salvar: "salvo", seguir: "segue" }[chave];
  if (chave === "salvar") {
    botao.setAttribute("aria-busy", "true");
    botao.setAttribute("aria-disabled", "true");
  } else {
    botao.disabled = true;
  }
  try {
    const resposta = await fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": form.elements._csrf.value,
      },
      body: JSON.stringify({ ativo: form.elements.ativo.value }),
    });
    const dados = await resposta.json();
    if (!resposta.ok || !dados)
      throw new Error(dados?.erro || "Este registro está indisponível.");
    const ativo = dados[estado];
    for (const outra of document.querySelectorAll("form[data-ci-action]")) {
      if (outra.action !== form.action) continue;
      const controle = outra.querySelector("button");
      outra.elements.ativo.value = ativo ? "nao" : "sim";
      controle.setAttribute("aria-pressed", String(ativo));
      if (chave === "salvar") {
        controle.title = ativo ? "Remover dos salvos" : "Salvar na coleção";
      } else if (chave === "seguir") {
        controle.querySelector("[data-ci-label]").textContent = ativo
          ? "Deixar de seguir"
          : "Seguir";
      }
      const contador = controle.querySelector("[data-ci-count]");
      if (contador) {
        contador.textContent = dados.curtidas;
        const plural = dados.curtidas === 1 ? "curtida" : "curtidas";
        controle.setAttribute(
          "aria-label",
          `Curtir ${outra.dataset.ciName}, ${dados.curtidas} ${plural}`
        );
      }
    }
    if (status)
      status.textContent =
        chave === "curtir"
          ? ativo
            ? "Curtida adicionada."
            : "Curtida removida."
          : chave === "seguir"
            ? ativo
              ? "Você começou a seguir este perfil."
              : "Você deixou de seguir este perfil."
            : ativo
              ? "Adicionado aos seus salvos."
              : "Removido dos seus salvos.";
  } catch (erro) {
    if (status)
      status.textContent =
        erro instanceof SyntaxError
          ? "Não foi possível concluir a ação. Atualize a página e tente novamente."
          : erro.message;
  } finally {
    if (chave === "salvar") {
      botao.removeAttribute("aria-busy");
      botao.removeAttribute("aria-disabled");
    } else {
      botao.disabled = false;
    }
  }
});

// Uma conversa compartilhada por todos os botões, sem sair da publicação.
(() => {
  const dialog = document.querySelector("#ci-conversa");
  if (!dialog) return;
  const content = dialog.querySelector("[data-ci-content]");
  const message = dialog.querySelector("[data-ci-message]");
  const heading = dialog.querySelector("#ci-dialog-title");
  const drafts = new Map();
  const pendingComments = new Map();
  let trigger;
  let request;
  let pressedOutside = false;
  const announce = text => {
    message.textContent = text;
  };
  const position = () => {
    if (!dialog.open || !trigger) return;
    const bounds = trigger.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    const margin = 16;
    const gap = 10;
    const above = bounds.top - gap - dialog.offsetHeight;
    const below = bounds.bottom + gap;
    const idealY = above >= margin ? above : below;
    const x = Math.max(margin, Math.min(bounds.right - dialog.offsetWidth, clientWidth - dialog.offsetWidth - margin));
    const y = Math.max(margin, Math.min(idealY, clientHeight - dialog.offsetHeight - margin));
    dialog.style.setProperty("--ci-x", `${x}px`);
    dialog.style.setProperty("--ci-y", `${y}px`);
  };
  window.addEventListener("resize", position);

  function close() {
    request?.abort();
    dialog.close();
    trigger?.focus({ preventScroll: true });
    trigger = undefined;
    pressedOutside = false;
    content.replaceChildren();
  }
  dialog.querySelector("[data-ci-close]").addEventListener("click", close);
  dialog.addEventListener("cancel", e => {
    e.preventDefault();
    close();
  });
  const outside = e => {
    if (e.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return e.clientX < bounds.left || e.clientX > bounds.right ||
      e.clientY < bounds.top || e.clientY > bounds.bottom;
  };
  dialog.addEventListener("pointerdown", e => { pressedOutside = outside(e); });
  dialog.addEventListener("click", e => {
    if (pressedOutside && outside(e)) close();
    pressedOutside = false;
  });
  document.addEventListener("click", async e => {
    const button = e.target.closest("[data-ci-open]");
    if (!button || dialog.open) return;
    e.preventDefault();
    trigger = button;
    const url = button.dataset.ciOpen;
    const controller = new AbortController();
    request = controller;
    heading.textContent = button.dataset.ciName || "Publicação";
    announce("Carregando comentários…");
    dialog.showModal();
    position();
    try {
      await pendingComments.get(url);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.erro || "Não foi possível abrir os comentários.");
      if (controller.signal.aborted) return;
      content.innerHTML = data.html;
      heading.textContent = data.titulo || heading.textContent;
      announce("");
      const input = content.querySelector(".ci-composer textarea");
      if (input) {
        input.value = drafts.get(url) || "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } catch {
      if (!controller.signal.aborted) {
        announce("Não foi possível carregar os comentários. Feche e tente novamente.");
      }
    }
  });
  document.addEventListener("input", e => {
    if (!e.target.matches(".ci-compose-field textarea")) return;
    if (trigger && content.contains(e.target)) {
      drafts.set(trigger.dataset.ciOpen, e.target.value);
    }
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    e.target.closest("form").querySelector('button[type="submit"]').disabled =
      !e.target.value.trim();
  });
  document.addEventListener("keydown", e => {
    if (
      e.target.matches(".ci-compose-field textarea") &&
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing
    ) {
      e.preventDefault();
      if (e.target.value.trim()) e.target.form.requestSubmit();
    }
  });
  document.addEventListener("submit", async e => {
    const form = e.target;
    if (!form.matches("form[data-ci-comment]")) return;
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    if (
      form.dataset.ciComment === "excluir" &&
      !confirm("Excluir seu comentário?")
    )
      return;
    const root = form.closest(".ci-conversation");
    const url = content.contains(root) ? trigger?.dataset.ciOpen : null;
    const opening = request;
    const submittingText = root.querySelector(".ci-composer textarea")?.value || "";
    const publishing = form.dataset.ciComment === "publicar";
    const activeConversation = () => dialog.open && content.contains(root);
    const say = text => {
      const live = dialog.open && url && opening === request
        ? message : document.querySelector("#ci-status");
      if (live) live.textContent = text;
    };
    if (url && pendingComments.has(url)) return;
    const scroll = root.querySelector(".ci-messages").scrollTop;
    button.disabled = true;
    say("");
    try {
      const operation = fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": form.elements._csrf.value,
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw Error(data.erro || "Não foi possível concluir.");
        return data;
      });
      if (url) pendingComments.set(url, operation.catch(() => {}));
      const data = await operation;
      if (url && publishing && drafts.get(url) === submittingText) drafts.delete(url);
      if (activeConversation()) {
        content.innerHTML = data.html;
        const composer = content.querySelector(".ci-composer textarea");
        if (composer) {
          composer.value = drafts.get(url) || "";
          composer.dispatchEvent(new Event("input", { bubbles: true }));
          composer.focus({ preventScroll: true });
        }
        content.querySelector(".ci-messages").scrollTop = publishing ? 0 : scroll;
      } else if (!url) root.outerHTML = data.html;
      say(
        form.dataset.ciComment === "excluir"
          ? "Comentário excluído."
          : form.dataset.ciComment === "editar"
            ? "Comentário atualizado."
            : "Comentário publicado."
      );
    } catch (error) {
      say(
        error instanceof SyntaxError
          ? "Não foi possível concluir. Tente novamente."
          : error.message
      );
    } finally {
      if (url) pendingComments.delete(url);
      button.disabled = false;
    }
  });
})();
