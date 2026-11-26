const formularioSelo = document.querySelector("[data-selo-externo]");
formularioSelo?.addEventListener("submit", async evento => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const arquivo = formulario.querySelector('input[type="file"]').files[0];
  const aviso = formulario.querySelector("[data-selo-erro]");
  const botao = formulario.querySelector("button");
  botao.disabled = true;
  aviso.hidden = true;
  try {
    if (
      !arquivo ||
      arquivo.size > 65536 ||
      !["image/png", "image/jpeg"].includes(arquivo.type)
    )
      throw new Error("Escolha uma imagem PNG ou JPEG de até 64 KB.");
    const imagem = await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () =>
        reject(new Error("Não foi possível ler a imagem."));
      leitor.readAsDataURL(arquivo);
    });
    const dados = Object.fromEntries(new FormData(formulario));
    const resposta = await fetch(formulario.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": dados._csrf,
      },
      body: JSON.stringify({ ...dados, imagem }),
    });
    const resultado = await resposta.json();
    if (!resposta.ok)
      throw new Error(resultado.erro || "Não foi possível enviar a marca.");
    window.location.assign(resultado.url);
  } catch (erro) {
    aviso.textContent = erro.message;
    aviso.hidden = false;
  } finally {
    botao.disabled = false;
  }
});
