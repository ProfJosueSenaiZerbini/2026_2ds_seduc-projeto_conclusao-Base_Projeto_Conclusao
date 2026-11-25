(() => {
  const form = document.querySelector("#pf-form");
  if (!form) return;
  const list = document.querySelector("#pf-edit-list");
  const data = document.querySelector("#pf-dados");
  const total = document.querySelector("#pf-total");
  const help = document.querySelector("#pf-mode-help");
  const notice = document.querySelector("#pf-aviso");
  const rows = () => [
    ...(list?.querySelectorAll(":scope > [data-chave]") || []),
  ];
  const smart = () =>
    form.querySelector('[name="modo"]:checked')?.value === "inteligente";
  const control = (row, field) => row.querySelector(`[data-pf="${field}"]`);

  function synchronize() {
    const intelligent = smart();
    const records = rows().map((row, index, all) => {
      const selected = control(row, "selecionado");
      const hidden = control(row, "oculto").checked;
      const eligible = row.dataset.publicavel === "sim";
      selected.disabled = intelligent || !eligible;
      row.classList.toggle("is-hidden", hidden);
      row.querySelector('[data-mover="-1"]').disabled = index === 0;
      row.querySelector('[data-mover="1"]').disabled = index === all.length - 1;
      row.querySelector(".pf-order").textContent =
        `${index + 1} / ${all.length}`;
      return {
        chave: row.dataset.chave,
        selecionado: selected.checked,
        oculto: hidden,
        destaque: control(row, "destaque").checked,
        ordem: index,
        secao: control(row, "secao").value.trim(),
      };
    });
    data.value = JSON.stringify(records);
    const visible = records.filter(
      (record, index) =>
        rows()[index].dataset.publicavel === "sim" &&
        !record.oculto &&
        (intelligent || record.selecionado)
    ).length;
    total.textContent = `${visible} ${visible === 1 ? "trabalho elegível" : "trabalhos elegíveis"} na vitrine`;
    help.textContent = intelligent
      ? "Modo Inteligente: os trabalhos elegíveis entram automaticamente. Desmarque “Ocultar da vitrine” para reexibir um item."
      : "Modo Manual: marque os trabalhos que deseja apresentar. Para reexibir um item oculto, selecione-o e desmarque “Ocultar da vitrine”.";
  }

  form.addEventListener("change", synchronize);
  form.addEventListener("input", event => {
    if (event.target.matches('[data-pf="secao"]')) synchronize();
  });
  form.addEventListener("submit", synchronize);
  list?.addEventListener("click", event => {
    const button = event.target.closest("[data-mover]");
    if (!button || button.disabled) return;
    const row = button.closest("[data-chave]");
    const direction = Number(button.dataset.mover);
    if (direction < 0 && row.previousElementSibling) {
      list.insertBefore(row, row.previousElementSibling);
    } else if (direction > 0 && row.nextElementSibling) {
      list.insertBefore(row.nextElementSibling, row);
    }
    synchronize();
    button.focus();
    notice.textContent = `Ordem atualizada. ${row.querySelector("h4").textContent} está na posição ${rows().indexOf(row) + 1}.`;
  });
  synchronize();
})();
