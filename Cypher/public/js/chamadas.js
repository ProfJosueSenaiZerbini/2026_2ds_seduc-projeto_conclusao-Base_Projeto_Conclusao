(() => {
  const chatHistory = document.querySelector(".msg-history");
  if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
  const chatComposer = document.querySelector(".msg-compose");
  const chatText = chatComposer?.querySelector("textarea");
  const chatSend = chatComposer?.querySelector(".msg-send-button");
  const chatFile = chatComposer?.querySelector(".msg-file-input");
  const selectedFile = chatComposer?.querySelector(".msg-file-selected");
  const uploadStatus = chatComposer?.querySelector(".msg-upload-status");
  const attachToggle = chatComposer?.querySelector(".msg-attach-toggle");
  const attachOptions = chatComposer?.querySelector(".msg-attach-options");
  const recordButton = chatComposer?.querySelector(".msg-record-button");
  let recorder;
  let recordingStream;
  let recordingTimer;
  const showChatStatus = message => {
    if (!uploadStatus) return;
    uploadStatus.textContent = message;
    uploadStatus.hidden = !message;
  };
  const resizeChatText = () => {
    if (!chatText) return;
    chatText.style.height = "40px";
    chatText.style.height = Math.min(Math.max(chatText.scrollHeight, 40), 160) + "px";
    chatText.style.overflowY = chatText.scrollHeight > 160 ? "auto" : "hidden";
  };
  const updateChatSend = () => {
    const hasContent = Boolean(chatText?.value.trim() || chatFile?.files?.length);
    if (chatSend) { chatSend.hidden = !hasContent; chatSend.disabled = !hasContent; }
    if (recordButton) recordButton.hidden = hasContent;
    resizeChatText();
  };
  const closeAttachOptions = () => {
    if (!attachOptions) return;
    attachOptions.hidden = true;
    attachToggle.setAttribute("aria-expanded", "false");
  };
  attachToggle?.addEventListener("click", () => {
    attachOptions.hidden = !attachOptions.hidden;
    attachToggle.setAttribute("aria-expanded", String(!attachOptions.hidden));
  });
  attachOptions?.addEventListener("click", event => {
    const type = event.target.closest("[data-attachment]")?.dataset.attachment;
    if (!type) return;
    chatFile.accept = {
      image: ".png,.jpg,.jpeg",
      video: ".mp4,.webm",
      file: ".mp3,.wav,.ogg,.weba,.txt,.md,.pdf,.docx",
    }[type];
    closeAttachOptions();
    chatFile.click();
  });
  document.addEventListener("pointerdown", event => {
    if (attachToggle && !event.target.closest(".msg-attach-group")) closeAttachOptions();
  });
  async function toggleRecording() {
    if (recorder?.state === "recording") { recorder.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showChatStatus("Este navegador não permite gravar áudio aqui.");
      return;
    }
    const mime = ["audio/webm", "audio/ogg"].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) { showChatStatus("Este navegador não oferece um formato de áudio compatível."); return; }
    try {
      recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      recorder = new MediaRecorder(recordingStream, { mimeType: mime });
      recorder.addEventListener("dataavailable", event => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener("stop", () => {
        clearTimeout(recordingTimer);
        recordingStream?.getTracks().forEach(track => track.stop());
        recordButton.classList.remove("is-recording");
        recordButton.setAttribute("aria-label", "Gravar áudio");
        recordButton.title = "Gravar áudio";
        const blob = new Blob(chunks, { type: mime });
        if (!blob.size) { showChatStatus("Nenhum áudio foi gravado."); return; }
        if (blob.size > 25 * 1024 * 1024) { showChatStatus("O áudio pode ter até 25 MB."); return; }
        const file = new File([blob], `audio-${Date.now()}.${mime === "audio/ogg" ? "ogg" : "weba"}`, { type: mime });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        chatFile.files = transfer.files;
        chatFile.dispatchEvent(new Event("change"));
        showChatStatus("Áudio pronto para enviar.");
      });
      recorder.start(1000);
      recordingTimer = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 5 * 60 * 1000);
      recordButton.classList.add("is-recording");
      recordButton.setAttribute("aria-label", "Parar gravação");
      recordButton.title = "Parar gravação";
      showChatStatus("Gravando áudio… toque no microfone para parar.");
    } catch {
      recordingStream?.getTracks().forEach(track => track.stop());
      showChatStatus("Não foi possível acessar o microfone.");
    }
  }
  recordButton?.addEventListener("click", toggleRecording);
  chatText?.addEventListener("input", updateChatSend);
  chatFile?.addEventListener("change", () => {
    const file = chatFile.files?.[0];
    selectedFile.hidden = !file;
    const preview = selectedFile.querySelector(".msg-file-preview");
    const name = selectedFile.querySelector(".msg-file-meta strong");
    const size = selectedFile.querySelector(".msg-file-meta small");
    preview.replaceChildren();
    if (file) {
      name.textContent = file.name;
      size.textContent = `${file.type || "Arquivo"} · ${file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}`;
      const kind = file.type.startsWith("image/") ? "Imagem" : file.type.startsWith("video/") ? "Vídeo" : file.type.startsWith("audio/") ? "Áudio" : file.name.split(".").pop().toUpperCase();
      preview.dataset.kind = kind;
      if (file.type.startsWith("image/")) {
        const image = document.createElement("img");
        image.alt = "Prévia do anexo";
        image.src = URL.createObjectURL(file);
        image.onload = () => URL.revokeObjectURL(image.src);
        preview.append(image);
      } else {
        preview.textContent = kind.slice(0, 4);
      }
    } else {
      name.textContent = "";
      size.textContent = "";
      delete preview.dataset.kind;
    }
    chatText.required = !file;
    showChatStatus("");
    updateChatSend();
  });
  selectedFile?.querySelector("button")?.addEventListener("click", () => {
    chatFile.value = "";
    chatFile.dispatchEvent(new Event("change"));
  });
  chatComposer?.addEventListener("submit", async event => {
    const file = chatFile?.files?.[0];
    if (!file) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const showError = showChatStatus;
    if (file.size > 25 * 1024 * 1024) return showError("O anexo pode ter até 25 MB.");
    if (chatText.value.trim().length > 1000) return showError("A legenda pode ter até 1.000 caracteres.");
    chatSend.disabled = true;
    uploadStatus.textContent = "Enviando anexo…";
    uploadStatus.hidden = false;
    try {
      const response = await fetch(chatComposer.action + "/attachments", {
        method: "POST", credentials: "same-origin", body: file,
        headers: {
          "Content-Type": "application/octet-stream",
          "x-csrf-token": chatComposer.querySelector('[name="_csrf"]').value,
          "x-message-key": chatComposer.querySelector('[name="chave"]').value,
          "x-file-name": encodeURIComponent(file.name),
          "x-message-text": encodeURIComponent(chatText.value.trim()),
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.erro || "Não foi possível enviar o anexo.");
      window.location.assign(chatComposer.action);
    } catch (error) {
      showError(error.message || "Não foi possível enviar o anexo.");
      updateChatSend();
    }
  });
  if (chatText) window.addEventListener("resize", resizeChatText);
  updateChatSend();
  chatText?.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    if (chatSend && !chatSend.disabled && chatComposer.reportValidity())
      chatComposer.requestSubmit();
  });
  const searchForm = document.querySelector("[data-message-search]");
  if (searchForm) {
    const searchInput = searchForm.querySelector('input[name="q"]');
    const searchButton = searchForm.querySelector("button");
    searchForm.classList.add("is-collapsible");
    const setSearchOpen = open => {
      searchForm.classList.toggle("is-open", open);
      searchInput.inert = !open;
      searchButton.type = open ? "submit" : "button";
      searchButton.setAttribute("aria-expanded", String(open));
      searchButton.setAttribute("aria-label", open ? "Pesquisar pessoas" : "Abrir busca de pessoas");
    };
    setSearchOpen(Boolean(searchInput.value));
    searchButton.addEventListener("click", event => {
      if (searchForm.classList.contains("is-open")) return;
      event.preventDefault();
      setSearchOpen(true);
      searchInput.focus();
    });
    searchForm.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (new URLSearchParams(window.location.search).has("q")) {
        window.location.assign("/messages");
        return;
      }
      searchInput.value = "";
      setSearchOpen(false);
      searchButton.focus();
    });
    document.addEventListener("pointerdown", event => {
      if (!searchForm.contains(event.target) && !searchInput.value.trim())
        setSearchOpen(false);
    });
  }
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
