const grupoNomePublico = document.querySelector(".profile-completion-choice");
const linhaVulgo = grupoNomePublico.querySelector(".profile-completion-vulgo");
const campoVulgo = linhaVulgo.querySelector("input");

function exibirCampoVulgo() {
  const usarVulgo = grupoNomePublico.querySelector("input:checked").value === "vulgo";
  linhaVulgo.hidden = !usarVulgo;
  campoVulgo.disabled = !usarVulgo;
  campoVulgo.required = usarVulgo;
}

grupoNomePublico.addEventListener("change", exibirCampoVulgo);
exibirCampoVulgo();
