document.querySelectorAll("[data-vinculos-musicais]").forEach(grupo => {
  const lista = grupo.querySelector("[data-lista-vinculos]");
  const botao = grupo.querySelector("[data-adicionar-vinculo]");
  if (!lista || !botao) return;
  const limite = Number(grupo.dataset.limite);
  botao.hidden = lista.children.length >= limite;
  botao.addEventListener("click", () => {
    if (lista.children.length >= limite) return;
    const selecao = lista.querySelector("select").cloneNode(true);
    selecao
      .querySelectorAll("[selected]")
      .forEach(opcao => opcao.removeAttribute("selected"));
    selecao.value = "";
    const rotulo = document.createElement("label");
    rotulo.textContent =
      botao.dataset.rotulo + " " + (lista.children.length + 1);
    rotulo.append(selecao);
    lista.append(rotulo);
    botao.hidden = lista.children.length >= limite;
    selecao.focus();
  });
});
