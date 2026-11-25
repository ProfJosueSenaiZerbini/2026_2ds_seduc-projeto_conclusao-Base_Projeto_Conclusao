document.querySelectorAll("[data-beat-upload]").forEach(form => {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const arquivo = form.elements.arquivo.files[0],
      finalidade = form.elements.finalidade.value;
    const status = form.querySelector("[data-upload-status]"),
      botao = form.querySelector("button");
    if (!arquivo) return;
    if (arquivo.size > (finalidade === "previa" ? 12 : 50) * 1024 * 1024) {
      status.textContent = "O arquivo excede o limite desta finalidade.";
      return;
    }
    botao.disabled = true;
    status.textContent = "Enviando e conferindo o áudio…";
    try {
      const r = await fetch(
        `/beats/${encodeURIComponent(form.dataset.beatUpload)}/files?finalidade=${finalidade}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-File-Name": encodeURIComponent(arquivo.name),
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
              .content,
          },
          body: arquivo,
        }
      );
      if (!r.ok)
        throw new Error(
          r.status === 413
            ? "O arquivo excede o limite permitido."
            : "Não foi possível enviar. Confira o formato MP3, WAV ou OGG e tente novamente."
        );
      location.reload();
    } catch (erro) {
      status.textContent = erro.message;
      botao.disabled = false;
    }
  });
});
