document.querySelectorAll("[data-publication-upload]").forEach(form => {
  const tipos = {
    imagem: ".png,.jpg,.jpeg",
    capa: ".png,.jpg,.jpeg",
    audio: ".mp3,.wav,.ogg",
    video: ".mp4,.webm",
    texto: ".txt",
  };
  const ajustarArquivo = () => {
    form.elements.arquivo.accept = tipos[form.elements.finalidade.value];
  };
  form.elements.finalidade.addEventListener("change", ajustarArquivo);
  ajustarArquivo();
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const arquivo = form.elements.arquivo.files[0],
      botao = form.querySelector("button"),
      status = form.querySelector("[data-upload-status]");
    if (!arquivo) return;
    botao.disabled = true;
    status.textContent = "Enviando arquivo…";
    try {
      if (!form.elements.autorizacao.checked)
        throw Error("Confirme a autorização de uso do arquivo.");
      const limite = {
        imagem: 8 * 1024 * 1024,
        capa: 8 * 1024 * 1024,
        audio: 25 * 1024 * 1024,
        video: 25 * 1024 * 1024,
        texto: 256 * 1024,
      }[form.elements.finalidade.value];
      if (arquivo.size > limite)
        throw Error("O arquivo ultrapassa o limite da finalidade selecionada.");
      const r = await fetch(
        form.dataset.publicationUpload +
          "?finalidade=" +
          encodeURIComponent(form.elements.finalidade.value),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Midia-Autorizada": "sim",
            "X-File-Name": encodeURIComponent(arquivo.name),
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
              .content,
          },
          body: arquivo,
        }
      );
      if (!r.ok) {
        let msg = "Não foi possível enviar o arquivo.";
        try {
          msg = (await r.json()).erro || msg;
        } catch {}
        throw Error(msg);
      }
      location.reload();
    } catch (erro) {
      status.textContent = erro.message;
      botao.disabled = false;
    }
  });
});
