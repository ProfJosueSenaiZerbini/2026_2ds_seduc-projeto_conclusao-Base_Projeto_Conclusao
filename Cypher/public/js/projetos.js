(() => {
  const form = document.querySelector("#pt-form");
  if (!form) return;
  const $ = s => document.querySelector(s),
    campo = $("#pt-itens"),
    lista = $("#pt-lista"),
    status = $("#pt-status");
  let itens = [];
  try {
    itens = JSON.parse(campo.value);
  } catch {}
  const estado = msg => {
    status.hidden = false;
    status.textContent = msg;
  };
  const el = (tag, texto, classe) => {
    const e = document.createElement(tag);
    if (texto) e.textContent = texto;
    if (classe) e.className = classe;
    return e;
  };
  const catalogo = new Map(
    [...document.querySelectorAll("#pt-midia option,#pt-referencia option")]
      .filter(o => o.value)
      .map(o => [
        o.value,
        {
          nome: o.dataset.nome,
          publico: o.dataset.publico,
          mime: o.dataset.mime,
        },
      ])
  );
  function desenhar() {
    campo.value = JSON.stringify(itens);
    lista.replaceChildren();
    itens.forEach((item, index) => {
      const info = catalogo.get(
        item.tipo === "midia"
          ? item.origem_id
          : item.tipo + ":" + item.origem_id
      );
      const row = el("li"),
        cab = el("div", null, "pt-material-head");
      cab.append(el("strong", info?.nome || item.origem_id));
      row.append(cab);
      if (item.tipo === "midia" && info?.mime?.startsWith("image/")) {
        const img = el("img");
        img.src = "/work-media/" + item.origem_id;
        img.alt = info.nome;
        img.loading = "lazy";
        row.append(img);
      }
      const label = el("label", "Legenda / função"),
        input = el("input");
      input.maxLength = 240;
      input.value = item.legenda || "";
      input.addEventListener("input", () => {
        item.legenda = input.value;
        campo.value = JSON.stringify(itens);
      });
      label.append(input);
      row.append(label);
      if (item.tipo === "midia") {
        if (item.publico === undefined)
          item.publico = info?.publico === "1" ? "sim" : "";
        const l = el("label", null, "pt-check"),
          c = el("input");
        c.type = "checkbox";
        c.checked = item.publico === "sim";
        c.addEventListener("change", () => {
          item.publico = c.checked ? "sim" : "";
          campo.value = JSON.stringify(itens);
        });
        l.append(
          c,
          document.createTextNode(
            "Autorizar este arquivo nas coleções visíveis"
          )
        );
        row.append(l);
      }
      const a = el("div", null, "pt-actions");
      for (const [text, d] of [
        ["Subir", -1],
        ["Descer", 1],
        ["Retirar", 0],
      ]) {
        const b = el("button", text, "pt-button");
        b.type = "button";
        b.disabled = d !== 0 && (index + d < 0 || index + d >= itens.length);
        b.addEventListener("click", () => {
          if (d === 0) itens.splice(index, 1);
          else
            [itens[index], itens[index + d]] = [itens[index + d], itens[index]];
          desenhar();
        });
        a.append(b);
      }
      row.append(a);
      lista.append(row);
    });
    campo.value = JSON.stringify(itens);
  }
  function add(tipo, id) {
    if (!id) return;
    if (itens.length >= 50) return estado("Use até 50 materiais por coleção.");
    if (itens.some(i => i.tipo === tipo && i.origem_id === id))
      return estado("Este material já está na coleção.");
    itens.push({ tipo, origem_id: id, legenda: "" });
    desenhar();
  }
  $("#pt-add-midia").addEventListener("click", () =>
    add("midia", $("#pt-midia").value)
  );
  $("#pt-add-referencia").addEventListener("click", () => {
    const [tipo, id] = $("#pt-referencia").value.split(":");
    add(tipo, id);
  });
  $("#pt-add-link").addEventListener("click", () => {
    try {
      const u = new URL($("#pt-link").value);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
      add("link", u.href);
      $("#pt-link").value = "";
    } catch {
      estado("Informe um endereço HTTPS válido.");
    }
  });
  let uploading = false;
  $("#pt-upload").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return estado("Arquivo maior que 25 MB.");
    uploading = true;
    estado("Enviando arquivo…");
    try {
      const r = await fetch("/work-media", {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
          "x-csrf-token": form.elements._csrf.value,
        },
        body: file,
      });
      const data = await r
        .json()
        .catch(() => ({
          erro:
            r.status === 413
              ? "Arquivo maior que 25 MB."
              : "Não foi possível enviar o arquivo.",
        }));
      if (!r.ok) throw Error(data.erro);
      catalogo.set(data.id, { nome: data.nome, mime: data.mime, publico: "0" });
      const option = el("option", data.nome);
      option.value = data.id;
      $("#pt-midia").append(option);
      add("midia", data.id);
      estado(
        "Arquivo enviado como privado. Confira a prévia e a autorização de compartilhamento."
      );
    } catch (err) {
      estado(err.message);
    } finally {
      uploading = false;
      e.target.value = "";
    }
  });
  const atualizar = () => {
    const select = $("#pt-modalidade"),
      ids = JSON.parse(select.selectedOptions[0]?.dataset.profissoes || "[]");
    document.querySelectorAll("[data-profissao]").forEach(l => {
      const c = l.querySelector("input");
      l.hidden = !ids.includes(l.dataset.profissao);
      c.disabled = l.hidden;
    });
  };
  $("#pt-modalidade").addEventListener("change", atualizar);
  atualizar();
  desenhar();
  form.addEventListener("submit", e => {
    if (uploading) {
      e.preventDefault();
      estado("Aguarde o envio do arquivo.");
    } else if (
      ![...form.querySelectorAll("[name=profissoes]:checked")].some(
        c => !c.disabled
      )
    ) {
      e.preventDefault();
      estado("Selecione uma atuação compatível.");
      $("#pt-modalidade").focus();
    }
  });
})();
