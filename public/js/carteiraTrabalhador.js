
const RECENTES_LIMITE = 4;

async function fetchWalletData() {

  throw new Error("fetchWalletData() ainda não está conectado ao banco de dados.");
}

const STATUS_LABEL = {
  concluido: "Concluído",
  enviado: "Enviado",
  aguardando: "Aguardando",
};

let todasTransacoes = [];

function formatBRL(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderSaldos(data) {
  document.getElementById("saldo-disponivel").textContent = formatBRL(data.saldoDisponivel);

  const deltaEl = document.getElementById("saldo-delta");
  if (typeof data.variacaoMensalPct === "number") {
    const sinal = data.variacaoMensalPct >= 0 ? "+" : "";
    deltaEl.textContent = `↗ ${sinal}${data.variacaoMensalPct}% este mês`;
  } else {
    deltaEl.textContent = "";
  }

  document.getElementById("saldo-retido").textContent = formatBRL(data.saldoRetido);
  document.getElementById("saldo-retido-info").textContent =
    typeof data.diasLiberacaoRetido === "number"
      ? `Liberação prevista em ${data.diasLiberacaoRetido} dias úteis após a conclusão do biscate.`
      : "";
}

function linhaTransacaoHTML(t) {
  const valorClasse = t.sinal === "negativo" ? "value-negative" : "value-positive";
  const valorTexto = t.sinal === "negativo" ? `- ${formatBRL(t.valor)}` : formatBRL(t.valor);
  const horaTexto = t.hora ? ` · ${t.hora}` : "";

  return `
    <tr>
      <td><div class="type-icon ${t.tipo}">${t.icone}</div></td>
      <td>
        <div class="desc-title">${t.descricao}</div>
        <div class="desc-id">ID: #${t.id}</div>
      </td>
      <td>${t.data}${horaTexto}</td>
      <td><span class="status ${t.status}">${STATUS_LABEL[t.status] ?? t.status}</span></td>
      <td class="${valorClasse}">${valorTexto}</td>
    </tr>
  `;
}

function renderLista(tbodyId, lista, mensagemVazio) {
  const tbody = document.getElementById(tbodyId);
  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">${mensagemVazio}</td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(linhaTransacaoHTML).join("");
}

function renderTransacoesRecentes() {
  const recentes = todasTransacoes.slice(0, RECENTES_LIMITE);
  renderLista("transacoes-body", recentes, "Nenhuma transação encontrada.");
}


function filtrarTransacoes(termo) {
  const busca = termo.trim().toLowerCase();
  if (!busca) return todasTransacoes;

  return todasTransacoes.filter((t) => {
    const nome = t.descricao.toLowerCase();
    const dataHora = `${t.data} ${t.hora ?? ""}`.toLowerCase();
    const valorFormatado = formatBRL(t.valor).toLowerCase();
    const valorNumerico = String(t.valor);

    return (
      nome.includes(busca) ||
      dataHora.includes(busca) ||
      valorFormatado.includes(busca) ||
      valorNumerico.includes(busca)
    );
  });
}

function setupFiltroPrincipal() {
  const input = document.getElementById("filtro-bico");
  input.addEventListener("input", () => {
    const resultado = filtrarTransacoes(input.value);
    renderLista("transacoes-body", resultado.slice(0, RECENTES_LIMITE), "Nenhum resultado para essa busca.");
  });
}

function setupFiltroModal() {
  const input = document.getElementById("filtro-bico-modal");
  input.addEventListener("input", () => {
    const resultado = filtrarTransacoes(input.value);
    renderLista("historico-completo-body", resultado, "Nenhum resultado para essa busca.");
  });
}

function abrirHistorico() {
  const modal = document.getElementById("historico-modal");
  const inputModal = document.getElementById("filtro-bico-modal");
  inputModal.value = "";
  renderLista("historico-completo-body", todasTransacoes, "Nenhuma transação encontrada.");
  modal.classList.add("open");
  inputModal.focus();
}

function fecharHistorico() {
  document.getElementById("historico-modal").classList.remove("open");
}

function setupModal() {
  document.getElementById("abrir-historico").addEventListener("click", abrirHistorico);
  document.getElementById("fechar-historico").addEventListener("click", fecharHistorico);
  document.getElementById("historico-modal").addEventListener("click", (e) => {
    if (e.target.id === "historico-modal") fecharHistorico();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharHistorico();
  });
}

function renderErro(mensagem) {
  document.getElementById("saldo-disponivel").textContent = "--";
  document.getElementById("saldo-retido").textContent = "--";
  document.getElementById("transacoes-body").innerHTML =
    `<tr class="empty-row"><td colspan="5" style="color:var(--red);">${mensagem}</td></tr>`;
}

async function init() {
  setupFiltroPrincipal();
  setupFiltroModal();
  setupModal();

  try {
    const data = await fetchWalletData();
    todasTransacoes = data.transacoes ?? [];
    renderSaldos(data);
    renderTransacoesRecentes();
  } catch (err) {
    console.error(err);
    renderErro("Não foi possível carregar os dados da carteira.");
  }
}

document.addEventListener("DOMContentLoaded", init);
