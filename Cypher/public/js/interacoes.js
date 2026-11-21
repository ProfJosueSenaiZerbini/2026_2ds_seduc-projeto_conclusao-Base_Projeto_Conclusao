(() => {
  const navegacaoMobile = document.querySelector(".dc-bottom");
  const indicadorMobile = navegacaoMobile?.querySelector(".dc-nav-glider");
  if (
    indicadorMobile?.animate &&
    document.referrer &&
    matchMedia("(max-width: 900px)").matches &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const origem = new URL(document.referrer);
    const destinos = Array.from(navegacaoMobile.querySelectorAll("a"));
    const anterior = destinos.findIndex(
      link => link.pathname === origem.pathname
    );
    const atual = destinos.findIndex(link => link.hasAttribute("aria-current"));
    if (
      origem.origin === location.origin &&
      anterior >= 0 &&
      atual >= 0 &&
      anterior !== atual
    ) {
      indicadorMobile.animate(
        [
          { transform: `translateX(${anterior * 100}%)` },
          { transform: `translateX(${atual * 100}%)` },
        ],
        { duration: 220, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" }
      );
    }
  }

  const navegacaoPerfil = document.querySelector("[data-profile-section-nav]");
  if (navegacaoPerfil) {
    const linksPerfil = Array.from(
      navegacaoPerfil.querySelectorAll('a[href^="#"]')
    );
    const secoesPerfil = linksPerfil
      .map(link =>
        document.getElementById(decodeURIComponent(link.hash.slice(1)))
      )
      .filter(Boolean);
    const ativarLinkPerfil = id => {
      linksPerfil.forEach(link => {
        const ativo = decodeURIComponent(link.hash.slice(1)) === id;
        link.classList.toggle("is-current", ativo);
        if (ativo) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    if (secoesPerfil.length) {
      const inicial = decodeURIComponent(location.hash.slice(1));
      ativarLinkPerfil(
        secoesPerfil.some(secao => secao.id === inicial)
          ? inicial
          : secoesPerfil[0].id
      );
    }
    linksPerfil.forEach(link =>
      link.addEventListener("click", () =>
        ativarLinkPerfil(decodeURIComponent(link.hash.slice(1)))
      )
    );
    window.addEventListener("hashchange", () => {
      const atual = decodeURIComponent(location.hash.slice(1));
      if (secoesPerfil.some(secao => secao.id === atual))
        ativarLinkPerfil(atual);
    });
  }

  const criarAviso = mensagem => {
    const aviso = document.createElement("div");
    aviso.className = "mvc-toast";
    aviso.setAttribute("role", "status");
    aviso.textContent = mensagem;
    document.body.appendChild(aviso);
    window.setTimeout(() => aviso.remove(), 2800);
  };

  document.addEventListener("click", evento => {
    const botaoAviso = evento.target.closest("[data-toast]");
    if (botaoAviso) {
      evento.preventDefault();
      criarAviso(botaoAviso.dataset.toast);
    }
  });

  document.addEventListener("click", async evento => {
    const botaoCompartilhar = evento.target.closest("[data-share-event]");
    if (!botaoCompartilhar) return;
    const dialogo = botaoCompartilhar.closest("dialog");
    const eventoId = dialogo?.dataset.eventId;
    if (!eventoId) return;
    const titulo = dialogo
      .querySelector("[data-event-title-detail]")
      ?.textContent?.trim();
    const ficha = new URL("/events?localizacao=", window.location.href);
    ficha.hash = `evento-${encodeURIComponent(eventoId)}`;
    const url = ficha.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo || "Evento Cypher", url });
      } else {
        await navigator.clipboard.writeText(url);
        criarAviso("Link do evento copiado.");
      }
    } catch {
      criarAviso("Não foi possível compartilhar o evento.");
    }
  });

  document.querySelectorAll("[data-filter]").forEach(campo => {
    campo.addEventListener("input", () => {
      const consulta = campo.value.trim().toLocaleLowerCase("pt-BR");
      document.querySelectorAll("[data-search-item]").forEach(item => {
        item.hidden = !item.textContent
          .toLocaleLowerCase("pt-BR")
          .includes(consulta);
      });
    });
  });

  const buscaExcecoesAdmin = document.querySelector(
    "[data-admin-exception-search]"
  );
  const listaExcecoesAdmin = document.querySelector(
    "[data-admin-exception-list]"
  );
  if (buscaExcecoesAdmin && listaExcecoesAdmin) {
    const botaoExpandir = document.querySelector(
      "[data-admin-exception-toggle]"
    );
    const controles = document.querySelector("[data-admin-exception-controls]");
    const contagem = document.querySelector("[data-admin-exception-count]");
    const vazio = document.querySelector("[data-admin-exception-empty]");
    const totalInicial = Number(listaExcecoesAdmin.dataset.adminTotal) || 0;
    let expandida = false;
    let temporizadorBusca;
    let requisicaoBusca;
    if (controles) controles.hidden = false;
    if (botaoExpandir) botaoExpandir.hidden = totalInicial <= 7;

    const elementoComTexto = (tag, classe, texto) => {
      const elemento = document.createElement(tag);
      if (classe) elemento.className = classe;
      elemento.textContent = texto ?? "";
      return elemento;
    };

    const criarLinhaConta = perfil => {
      const artigo = elementoComTexto("article", "admin-account-row");
      const identidade = elementoComTexto("div", "admin-account-identity");
      identidade.append(
        elementoComTexto("span", "admin-account-avatar", perfil.iniciais)
      );
      const detalhes = document.createElement("div");
      detalhes.append(
        elementoComTexto("strong", "", perfil.nome),
        elementoComTexto("p", "", perfil.email),
        elementoComTexto(
          "span",
          "admin-category-list",
          `Categorias: ${perfil.categorias.join(" · ")}`
        )
      );
      detalhes.lastElementChild.setAttribute(
        "aria-label",
        "Categorias profissionais"
      );
      if (perfil.alteradaEmFormatada) {
        detalhes.append(
          elementoComTexto(
            "small",
            "",
            `Última alteração: ${perfil.alteradaEmFormatada}${perfil.proximaAlteracaoFormatada ? ` · Próxima data: ${perfil.proximaAlteracaoFormatada}` : ""}`
          )
        );
      } else {
        detalhes.append(
          elementoComTexto(
            "small",
            "",
            "Ainda não realizou alteração de categorias após criar a conta."
          )
        );
      }
      if (perfil.excecaoPendente) {
        detalhes.append(
          elementoComTexto(
            "span",
            "admin-pending-label",
            "Exceção não utilizada já concedida"
          )
        );
      }
      if (!perfil.bloqueada) {
        detalhes.append(
          elementoComTexto(
            "span",
            "admin-available-label",
            "Prazo encerrado — exceção não necessária"
          )
        );
      }
      identidade.append(detalhes);
      const form = document.createElement("form");
      form.method = "post";
      form.action = `/admin/revisao/excecoes-categorias/${encodeURIComponent(perfil.usuarioId)}`;
      const label = elementoComTexto("label", "", "Motivo da exceção");
      const input = document.createElement("input");
      input.name = "motivo";
      input.minLength = 10;
      input.maxLength = 500;
      input.required = true;
      input.placeholder = "Registre o motivo verificável";
      label.append(input);
      const botao = elementoComTexto(
        "button",
        "button button-outline",
        "Autorizar uma alteração"
      );
      botao.type = "submit";
      botao.disabled = !perfil.bloqueada || perfil.excecaoPendente;
      form.append(label, botao);
      artigo.append(identidade, form);
      return artigo;
    };

    const carregarContas = async () => {
      requisicaoBusca?.abort();
      requisicaoBusca = new AbortController();
      const consulta = buscaExcecoesAdmin.value.trim();
      const parametros = new URLSearchParams();
      if (consulta) parametros.set("q", consulta);
      else if (expandida) parametros.set("todos", "1");
      try {
        const resposta = await fetch(
          `/admin/revisao/excecoes/busca?${parametros.toString()}`,
          {
            headers: { Accept: "application/json" },
            signal: requisicaoBusca.signal,
          }
        );
        if (!resposta.ok) throw new Error("Falha ao carregar as contas.");
        const resultado = await resposta.json();
        listaExcecoesAdmin.replaceChildren(
          ...resultado.perfis.map(criarLinhaConta)
        );
        const visiveis = resultado.perfis.length;
        if (contagem) {
          contagem.textContent = consulta
            ? `${visiveis} resultado${visiveis === 1 ? "" : "s"} de ${resultado.total}`
            : `${visiveis} de ${resultado.total} contas exibidas`;
        }
        if (vazio) vazio.hidden = visiveis > 0;
        if (botaoExpandir) {
          botaoExpandir.hidden = Boolean(consulta) || resultado.total <= 7;
          botaoExpandir.setAttribute("aria-expanded", String(expandida));
          botaoExpandir.textContent = expandida
            ? "Mostrar somente as primeiras 7"
            : `Mostrar todas as ${resultado.total} contas`;
        }
      } catch (erro) {
        if (erro.name !== "AbortError")
          criarAviso("Não foi possível buscar as contas. Tente novamente.");
      }
    };
    buscaExcecoesAdmin.addEventListener("input", () => {
      window.clearTimeout(temporizadorBusca);
      temporizadorBusca = window.setTimeout(carregarContas, 180);
    });
    botaoExpandir?.addEventListener("click", () => {
      expandida = !expandida;
      carregarContas();
    });
  }

  const listaDecisoesAdmin = document.querySelector(
    "[data-admin-decision-list]"
  );
  if (listaDecisoesAdmin) {
    const botoesFiltro = Array.from(
      document.querySelectorAll("[data-admin-decision-filter]")
    );
    const contagemDecisoes = document.querySelector(
      "[data-admin-decision-count]"
    );
    const vazioDecisoes = document.querySelector(
      "[data-admin-decision-empty]"
    );
    const pedidosDecididos = Array.from(
      listaDecisoesAdmin.querySelectorAll("[data-exception-decision]")
    );
    const filtrarDecisoes = filtro => {
      let totalVisivel = 0;
      pedidosDecididos.forEach(pedido => {
        const corresponde =
          filtro === "todas" || pedido.dataset.exceptionDecision === filtro;
        pedido.hidden = !corresponde;
        if (corresponde) totalVisivel += 1;
      });
      botoesFiltro.forEach(botao => {
        const ativo = botao.dataset.adminDecisionFilter === filtro;
        botao.classList.toggle("is-active", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
      });
      if (contagemDecisoes) {
        const rotulo =
          filtro === "aprovado"
            ? "aprovadas"
            : filtro === "rejeitado"
              ? "recusadas"
              : "solicitações no histórico";
        contagemDecisoes.textContent = `${totalVisivel} ${rotulo}`;
      }
      if (vazioDecisoes) vazioDecisoes.hidden = totalVisivel > 0;
    };
    botoesFiltro.forEach(botao =>
      botao.addEventListener("click", () =>
        filtrarDecisoes(botao.dataset.adminDecisionFilter)
      )
    );
  }

  document.querySelectorAll("[data-faq]").forEach(botao => {
    botao.addEventListener("click", () => {
      const item = botao.closest(".faq-item");
      const aberto = item.classList.toggle("open");
      botao.setAttribute("aria-expanded", String(aberto));
    });
  });

  document.querySelectorAll("[data-menu-toggle]").forEach(botao => {
    botao.addEventListener("click", () => {
      const menu = document.getElementById(botao.dataset.menuToggle);
      if (!menu) return;
      const aberto = botao.getAttribute("aria-expanded") !== "true";
      botao.setAttribute("aria-expanded", String(aberto));
      menu.hidden = !aberto;
    });
  });

  const barraLateral = document.querySelector(".sidebar");
  // Continuidade do rail: estado de uma navegação, não uma preferência fixa.
  const raizSidebar = document.documentElement;
  const chaveSidebar = "cypher-sidebar-percurso";
  const ambienteSidebar = window.matchMedia(
    "(min-width: 901px) and (hover: hover) and (pointer: fine)"
  );
  const limparContinuidadeSidebar = () => {
    raizSidebar.classList.remove("sidebar-em-transicao");
    try {
      sessionStorage.removeItem(chaveSidebar);
    } catch {}
  };
  if (barraLateral?.closest(".dc-shell")) {
    barraLateral.addEventListener("pointerleave", limparContinuidadeSidebar);
    document.documentElement.addEventListener(
      "pointerleave",
      limparContinuidadeSidebar
    );
    barraLateral.addEventListener("click", evento => {
      limparContinuidadeSidebar();
      const link = evento.target.closest("a[href]");
      if (
        !link ||
        !ambienteSidebar.matches ||
        !barraLateral.matches(":hover") ||
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.detail === 0 ||
        evento.pointerType === "touch" ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey ||
        link.hasAttribute("download") ||
        (link.target && link.target.toLowerCase() !== "_self")
      )
        return;
      const destino = new URL(link.href, window.location.href);
      if (
        destino.origin !== location.origin ||
        destino.hash ||
        !["/", "/dashboard", "/espaco-de-trabalho"].includes(destino.pathname)
      )
        return;
      try {
        sessionStorage.setItem(
          chaveSidebar,
          JSON.stringify({
            destino:
              (destino.pathname === "/" ? "/dashboard" : destino.pathname) +
              destino.search,
            instante: Date.now(),
          })
        );
        raizSidebar.classList.add("sidebar-em-transicao");
      } catch {}
    });
    document.addEventListener("pointermove", evento => {
      if (
        evento.pointerType === "touch" ||
        !raizSidebar.classList.contains("sidebar-em-transicao")
      )
        return;
      const limites = barraLateral.getBoundingClientRect();
      if (
        evento.clientX < limites.left ||
        evento.clientX >= limites.right ||
        evento.clientY < limites.top ||
        evento.clientY >= limites.bottom
      )
        limparContinuidadeSidebar();
    });
    ambienteSidebar.addEventListener("change", () => {
      if (!ambienteSidebar.matches) limparContinuidadeSidebar();
    });
    window.addEventListener("pageshow", evento => {
      if (evento.persisted) limparContinuidadeSidebar();
    });
  } else {
    limparContinuidadeSidebar();
  }
  const camadaMenu = document.querySelector(
    "[data-sidebar-close].mobile-overlay"
  );
  const abrirMenu = document.querySelector("[data-sidebar-open]");
  const fecharMenu = () => {
    if (barraLateral?.classList.contains("sidebar-open")) abrirMenu?.focus();
    abrirMenu?.setAttribute("aria-expanded", "false");
    barraLateral?.classList.remove("sidebar-open");
    document.body.classList.remove("sidebar-visible");
    if (camadaMenu) camadaMenu.hidden = true;
  };
  document.querySelectorAll("[data-sidebar-open]").forEach(botao => {
    botao.addEventListener("click", () => {
      botao.setAttribute("aria-expanded", "true");
      barraLateral?.classList.add("sidebar-open");
      document.body.classList.add("sidebar-visible");
      if (camadaMenu) camadaMenu.hidden = false;
      barraLateral?.querySelector(".mobile-close")?.focus();
    });
  });
  document.querySelectorAll("[data-sidebar-close]").forEach(botao => {
    botao.addEventListener("click", fecharMenu);
  });
  barraLateral?.querySelectorAll("a.side-link").forEach(link => {
    link.addEventListener("click", fecharMenu);
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") fecharMenu();
  });

  const atualizarInteresse = (
    status,
    eventoId,
    demonstracao = false,
    tipoParticipacao = "aberta"
  ) => {
    const ativo = ["interessado", "inscrito", "confirmado"].includes(status);
    const confirmado = status === "confirmado";
    const rotuloInicial =
      tipoParticipacao === "aprovacao"
        ? "Solicitar participação"
        : "Quero participar";
    const rotulos =
      tipoParticipacao === "aprovacao"
        ? {
            interessado: "Solicitação enviada",
            inscrito: "Solicitação em análise",
            confirmado: "Participação confirmada",
          }
        : {
            interessado: "Participação registrada",
            inscrito: "Participação registrada",
            confirmado: "Participação confirmada",
          };
    document.querySelectorAll("[data-interest-button]").forEach(botao => {
      botao.setAttribute("aria-pressed", String(ativo));
      botao.disabled = !eventoId || confirmado || demonstracao;
      const rotulo = botao.querySelector("[data-interest-label]");
      if (rotulo) rotulo.textContent = rotulos[status] ?? rotuloInicial;
      botao.classList.toggle("is-interested", ativo);
    });
    document.querySelectorAll("[data-interest-form]").forEach(formulario => {
      formulario.hidden = demonstracao;
      if (eventoId && !demonstracao) {
        formulario.action = ativo
          ? `/events/${encodeURIComponent(eventoId)}/interest/cancel`
          : `/events/${encodeURIComponent(eventoId)}/interest`;
      } else {
        formulario.removeAttribute("action");
      }
    });
    document.querySelectorAll("[data-interest-notice]").forEach(aviso => {
      aviso.hidden = !ativo || demonstracao;
    });
    document.querySelectorAll(".event-detail-count").forEach(contagem => {
      contagem.hidden = demonstracao;
    });
  };
  atualizarInteresse(null, null, false);

  const seletorTipoObra = document.querySelector("#selecao-tipo-obra");
  let acionadorTipoObra = null;
  const abrirSelecaoTipoObra = acionador => {
    if (!seletorTipoObra) return;
    acionadorTipoObra =
      acionador ?? document.querySelector("[data-work-type-open]");
    if (typeof seletorTipoObra.showModal === "function") {
      if (!seletorTipoObra.open) seletorTipoObra.showModal();
    } else {
      seletorTipoObra.setAttribute("open", "");
    }
    seletorTipoObra.querySelector("a, button")?.focus();
  };
  const fecharSelecaoTipoObra = () => {
    if (!seletorTipoObra) return;
    if (typeof seletorTipoObra.close === "function" && seletorTipoObra.open) {
      seletorTipoObra.close();
    } else {
      seletorTipoObra.removeAttribute("open");
      acionadorTipoObra?.focus();
    }
  };
  document.querySelectorAll("[data-work-type-open]").forEach(botao => {
    botao.addEventListener("click", () => abrirSelecaoTipoObra(botao));
  });
  document.querySelectorAll("[data-work-type-close]").forEach(botao => {
    botao.addEventListener("click", fecharSelecaoTipoObra);
  });
  seletorTipoObra?.addEventListener("click", evento => {
    if (evento.target === seletorTipoObra) fecharSelecaoTipoObra();
  });
  seletorTipoObra?.addEventListener("close", () => acionadorTipoObra?.focus());
  if (window.location.hash === "#cadastro-obra") abrirSelecaoTipoObra();

  const dialogos = new Map();
  const definirTexto = (dialogo, seletor, valor) => {
    dialogo.querySelectorAll(seletor).forEach(elemento => {
      elemento.textContent = valor ?? "";
    });
  };
  const selecionarAbaEvento = (dialogo, aba) => {
    dialogo.querySelectorAll("[data-event-detail-tab]").forEach(botao => {
      const ativa = botao.dataset.eventDetailTab === aba;
      botao.classList.toggle("is-active", ativa);
      botao.setAttribute("aria-selected", String(ativa));
      botao.tabIndex = ativa ? 0 : -1;
    });
    dialogo.querySelectorAll("[data-event-detail-panel]").forEach(painel => {
      painel.hidden = painel.dataset.eventDetailPanel !== aba;
    });
  };
  const preencherGestaoEvento = (dialogo, dados) => {
    const abaGestao = dialogo.querySelector('[data-event-detail-tab="gestao"]');
    const editora = dialogo.querySelector("[data-event-edit]");
    const exclusao = dialogo.querySelector("[data-event-delete]");
    const lista = dialogo.querySelector("[data-event-interested-list]");
    const proprietario = dados.detailOwned === "true";
    abaGestao.hidden = !proprietario;
    selecionarAbaEvento(dialogo, "geral");
    if (!proprietario) return;
    editora.href = `/events/${encodeURIComponent(dados.detailId)}/edit`;
    exclusao.action = `/events/${encodeURIComponent(dados.detailId)}/delete`;
    lista.replaceChildren();
    let interessados = [];
    try {
      interessados = JSON.parse(
        decodeURIComponent(dados.detailInterested || "")
      );
    } catch {
      interessados = [];
    }
    const titulo = document.createElement("strong");
    titulo.textContent =
      dados.detailParticipationType === "aprovacao"
        ? `Solicitações recebidas (${dados.detailTotalInterested || 0})`
        : `Participações registradas (${dados.detailTotalInterested || 0})`;
    lista.appendChild(titulo);
    if (!interessados.length) {
      const vazio = document.createElement("p");
      vazio.textContent = "Nenhuma participação registrada ainda.";
      lista.appendChild(vazio);
      return;
    }
    const statusLabels = {
      interessado: "Interessado",
      inscrito: "Inscrito",
      confirmado: "Confirmado",
      rejeitado: "Rejeitado",
    };
    interessados.forEach(interesse => {
      const linha = document.createElement("div");
      linha.className = "event-interested-row";
      const pessoa = document.createElement("span");
      const nome = document.createElement("b");
      nome.textContent = interesse.nome;
      const detalhe = document.createElement("small");
      detalhe.textContent = `@${interesse.handle} · ${dados.detailParticipationType === "aprovacao" ? (statusLabels[interesse.status] ?? interesse.status) : "participação registrada"}`;
      pessoa.append(nome, detalhe);
      linha.appendChild(pessoa);
      if (dados.detailParticipationType === "aprovacao") {
        const formulario = document.createElement("form");
        formulario.method = "post";
        formulario.action = `/events/${encodeURIComponent(dados.detailId)}/interests/${encodeURIComponent(interesse.usuarioId)}/status`;
        const seletor = document.createElement("select");
        seletor.name = "status";
        seletor.setAttribute("aria-label", `Status de ${interesse.nome}`);
        Object.entries(statusLabels).forEach(([valor, label]) => {
          const opcao = document.createElement("option");
          opcao.value = valor;
          opcao.textContent = label;
          opcao.selected = interesse.status === valor;
          seletor.appendChild(opcao);
        });
        const salvar = document.createElement("button");
        salvar.className = "text-link";
        salvar.type = "submit";
        salvar.textContent = "Salvar";
        formulario.append(seletor, salvar);
        const csrf = exclusao.elements.namedItem("_csrf");
        if (csrf) formulario.appendChild(csrf.cloneNode(true));
        linha.appendChild(formulario);
      }
      lista.appendChild(linha);
    });
  };
  document.querySelectorAll("[data-event-detail-tab]").forEach(botao => {
    botao.addEventListener("click", () => {
      const dialogo = botao.closest("dialog");
      if (dialogo) selecionarAbaEvento(dialogo, botao.dataset.eventDetailTab);
    });
    botao.addEventListener("keydown", evento => {
      const abas = [...botao.parentElement.querySelectorAll("[data-event-detail-tab]:not([hidden])")];
      const atual = abas.indexOf(botao);
      const destinos = {
        ArrowLeft: (atual + abas.length - 1) % abas.length,
        ArrowRight: (atual + 1) % abas.length,
        Home: 0,
        End: abas.length - 1,
      };
      if (!Object.hasOwn(destinos, evento.key)) return;
      evento.preventDefault();
      const destino = abas[destinos[evento.key]];
      selecionarAbaEvento(botao.closest("dialog"), destino.dataset.eventDetailTab);
      destino.focus();
    });
  });
  const abrirDialogo = (dialogo, acionador) => {
    if (!dialogo) return;
    dialogos.set(dialogo, acionador);
    if (typeof dialogo.showModal === "function") dialogo.showModal();
    else dialogo.setAttribute("open", "");
    dialogo.querySelector("[data-dialog-close]")?.focus();
  };
  document.querySelectorAll("[data-event-card]").forEach(cartao => {
    cartao.addEventListener("click", () => {
      const dialogo = document.getElementById("detalhe-oportunidade");
      if (!dialogo) return;
      const dados = cartao.dataset;
      dialogo.dataset.eventId = dados.detailId || "";
      definirTexto(dialogo, "[data-event-title-detail]", dados.detailTitle);
      definirTexto(
        dialogo,
        "[data-event-category-detail]",
        [
          dados.detailCategory,
          dados.detailCategoryDetail,
          ...(dados.detailWorkshopTypes ?? "").split("|").filter(Boolean),
        ]
          .filter(Boolean)
          .join(" · ")
      );
      definirTexto(dialogo, "[data-event-date-detail]", dados.detailDate);
      definirTexto(dialogo, "[data-event-time-detail]", dados.detailTime);
      definirTexto(dialogo, "[data-event-status-detail]", dados.detailStatus);
      definirTexto(
        dialogo,
        "[data-event-location-detail]",
        dados.detailLocation
      );
      definirTexto(dialogo, "[data-event-org-detail]", dados.detailOrg);
      definirTexto(
        dialogo,
        "[data-event-description-detail]",
        dados.detailDescription
      );
      definirTexto(dialogo, "[data-event-format-detail]", dados.detailFormat);
      definirTexto(
        dialogo,
        "[data-event-registration-detail]",
        dados.detailRegistration
      );
      definirTexto(dialogo, "[data-event-prize-detail]", dados.detailPrize);
      const listaTags = dialogo.querySelector("[data-event-tags-detail]");
      if (listaTags) {
        listaTags.replaceChildren();
        (dados.detailTags ?? "")
          .split("|")
          .filter(Boolean)
          .forEach(tag => {
            const elemento = document.createElement("span");
            elemento.textContent = tag;
            listaTags.appendChild(elemento);
          });
      }
      atualizarInteresse(
        dados.detailInterestStatus || null,
        dados.detailId || null,
        dados.detailDemonstracao === "true",
        dados.detailParticipationType || "aberta"
      );
      const total = Number(dados.detailTotalInterested) || 0;
      const [singular, plural] = dados.detailParticipationType === "aprovacao"
        ? ["solicitação recebida.", "solicitações recebidas."]
        : ["participação registrada.", "participações registradas."];
      definirTexto(dialogo, "[data-event-interest-total]", String(total));
      definirTexto(
        dialogo,
        "[data-event-interest-count-label]",
        total === 1 ? singular : plural
      );
      preencherGestaoEvento(dialogo, dados);
      abrirDialogo(dialogo, cartao);
    });
  });

  document.querySelectorAll("[data-work-card]").forEach(cartao => {
    cartao.addEventListener("click", () => {
      const dialogo = document.getElementById("detalhe-obra");
      if (!dialogo) return;
      const dados = cartao.dataset;
      const campos = {
        "[data-work-title-detail]": "workTitle",
        "[data-work-type-detail]": "workType",
        "[data-work-status-detail]": "workStatus",
        "[data-work-meta-detail]": "workMeta",
        "[data-work-role-detail]": "workRole",
        "[data-work-credits-detail]": "workCredits",
        "[data-work-description-detail]": "workDescription",
        "[data-work-bpm-detail]": "workBpm",
        "[data-work-isrc-detail]": "workIsrc",
        "[data-work-iswc-detail]": "workIswc",
      };
      Object.entries(campos).forEach(([seletor, chave]) =>
        definirTexto(dialogo, seletor, dados[chave])
      );
      const listaCreditos = dialogo.querySelector("[data-work-credit-list]");
      if (listaCreditos) {
        listaCreditos.replaceChildren();
        let creditos = [];
        try {
          creditos = JSON.parse(
            decodeURIComponent(dados.workCreditDetails || "")
          );
        } catch {
          creditos = [];
        }
        if (creditos.length === 0) {
          const vazio = document.createElement("p");
          vazio.textContent = "Nenhum crédito associado.";
          listaCreditos.appendChild(vazio);
        } else {
          creditos.forEach(credito => {
            const linha = document.createElement("div");
            linha.className = "work-credit-detail";
            const pessoa = document.createElement("strong");
            pessoa.textContent = credito.name;
            const funcao = document.createElement("span");
            funcao.textContent = credito.role;
            const participacao = document.createElement("small");
            const estado = credito.verified
              ? "Confirmado"
              : credito.userId
                ? "Crédito não confirmado"
                : "Menção sem perfil vinculado";
            participacao.textContent = [credito.participation, estado]
              .filter(Boolean)
              .join(" · ");
            linha.append(pessoa, funcao, participacao);
            listaCreditos.appendChild(linha);
          });
        }
      }

      const linkEscuta = dialogo.querySelector("[data-work-listen-link]");
      if (linkEscuta) {
        linkEscuta.hidden = true;
        linkEscuta.removeAttribute("href");
        if (dados.workLink) {
          try {
            const url = new URL(dados.workLink);
            if (url.protocol === "http:" || url.protocol === "https:") {
              linkEscuta.href = url.href;
              linkEscuta.hidden = false;
            }
          } catch {
            // Links inválidos não são exibidos.
          }
        }
      }

      const id = encodeURIComponent(dados.workId || "");
      const obraDoUsuario = dados.workOwned === "true";
      const editar = dialogo.querySelector("[data-work-edit]");
      if (editar) {
        editar.href = `/works/${id}/edit`;
        editar.hidden = !obraDoUsuario;
      }
      const excluir = dialogo.querySelector("[data-work-delete]");
      if (excluir) {
        excluir.action = `/works/${id}/delete`;
        excluir.hidden = !obraDoUsuario;
        excluir.onsubmit = evento => {
          if (!window.confirm("Excluir esta obra e os créditos associados?")) {
            evento.preventDefault();
          }
        };
      }
      abrirDialogo(dialogo, cartao);
    });
  });

  document.querySelectorAll("[data-beat-detail]").forEach(botao => {
    botao.addEventListener("click", () => {
      const dialogo = document.getElementById("detalhe-beat");
      if (!dialogo) return;
      const dados = botao.dataset;
      const campos = {
        "[data-beat-title-detail]": "beatTitle",
        "[data-beat-producer-detail]": "beatProducer",
        "[data-beat-bpm-detail]": "beatBpm",
        "[data-beat-key-detail]": "beatKey",
        "[data-beat-genre-detail]": "beatGenre",
        "[data-beat-license-detail]": "beatLicense",
        "[data-beat-duration-detail]": "beatDuration",
        "[data-beat-description-detail]": "beatDescription",
        "[data-beat-usage-detail]": "beatUsage",
      };
      Object.entries(campos).forEach(([seletor, chave]) =>
        definirTexto(dialogo, seletor, dados[chave])
      );
      const exclusivo = dialogo.querySelector("[data-beat-exclusive-detail]");
      if (exclusivo instanceof HTMLElement) {
        exclusivo.hidden = dados.beatExclusive !== "true";
      }
      const ofertas = dialogo.querySelector("[data-beat-ofertas-detail]");
      if (ofertas) {
        ofertas.replaceChildren();
        let lista = [];
        try {
          lista = JSON.parse(decodeURIComponent(dados.beatOfertas ?? ""));
        } catch {
          lista = [];
        }
        if (lista.length === 0) {
          const vazio = document.createElement("p");
          vazio.textContent = "Nenhuma oferta cadastrada.";
          ofertas.append(vazio);
        } else {
          lista.forEach(oferta => {
            const item = document.createElement("div");
            item.className = "beat-offer-detail";
            const titulo = document.createElement("strong");
            titulo.textContent = oferta.tipo;
            const preco = document.createElement("span");
            preco.textContent =
              oferta.precoCentavos === null
                ? "Preço sob consulta"
                : `R$ ${(oferta.precoCentavos / 100).toFixed(2).replace(".", ",")}`;
            const descricao = document.createElement("small");
            descricao.textContent =
              oferta.descricao || "Sem descrição adicional.";
            item.append(titulo, preco, descricao);
            ofertas.append(item);
          });
        }
      }
      abrirDialogo(dialogo, botao);
    });
  });

  document.querySelectorAll("[data-dialog-close]").forEach(botao => {
    botao.addEventListener("click", () => botao.closest("dialog")?.close());
  });
  document.querySelectorAll("dialog.detail-dialog").forEach(dialogo => {
    dialogo.addEventListener("click", evento => {
      if (evento.target === dialogo) dialogo.close();
    });
    dialogo.addEventListener("close", () => dialogos.get(dialogo)?.focus());
  });

  // Links da Descoberta abrem a mesma ficha acionada no catálogo.
  function abrirFichaVinculada() {
    const item = document.getElementById(location.hash.slice(1));
    if (item?.matches("[data-event-card]")) item.click();
    else item?.querySelector("[data-beat-detail]")?.click();
  }
  abrirFichaVinculada();
  window.addEventListener("hashchange", abrirFichaVinculada);

  const linksConfiguracao = [
    ...document.querySelectorAll("[data-settings-link]"),
  ];
  const atualizarSecaoConfiguracao = linkAtivo => {
    linksConfiguracao.forEach(link => {
      const ativo = link === linkAtivo;
      link.classList.toggle("active", ativo);
      if (ativo) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  linksConfiguracao.forEach(link => {
    link.addEventListener("click", () => atualizarSecaoConfiguracao(link));
  });
  const sincronizarSecaoConfiguracao = () => {
    const link = linksConfiguracao.find(
      item => item.getAttribute("href") === window.location.hash
    );
    if (link) atualizarSecaoConfiguracao(link);
  };
  window.addEventListener("hashchange", sincronizarSecaoConfiguracao);
  sincronizarSecaoConfiguracao();

  const salvarTema = tema => {
    try {
      window.localStorage.setItem("cypher-tema", tema);
    } catch {
      /* armazenamento pode estar bloqueado */
    }
  };
  const aplicarTema = tema => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    document.querySelectorAll("[data-theme-toggle]").forEach(controle => {
      const escuro = tema === "dark";
      const destino = escuro ? "claro" : "escuro";
      controle.checked = escuro;
      controle.title = `Ativar tema ${destino}`;
    });
    document.querySelectorAll("[data-theme-mode]").forEach(botao => {
      botao.setAttribute(
        "aria-pressed",
        String(botao.dataset.themeMode === tema)
      );
    });
    document
      .querySelectorAll('form[action="/settings/preferencias"] [name="tema"]')
      .forEach(campo => {
        campo.value = tema;
      });
  };
  // O cabeçalho já resolveu a preferência antes dos estilos; não a sobrescreve.
  aplicarTema(document.documentElement.classList.contains("dark") ? "dark" : "light");
  document.querySelectorAll("[data-theme-toggle]").forEach(controle => {
    let alternando = false;
    controle.addEventListener("change", async () => {
      if (alternando) {
        controle.checked = document.documentElement.classList.contains("dark");
        return;
      }
      const temaSolicitado = controle.checked ? "dark" : "light";
      salvarTema(temaSolicitado);
      const trocar = () => aplicarTema(temaSolicitado);
      if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        alternando = true;
        try { await document.startViewTransition(trocar).finished; }
        catch { trocar(); }
        finally { alternando = false; }
      } else trocar();
    });
  });
  document.querySelectorAll("[data-theme-mode]").forEach(botao => {
    botao.addEventListener("click", () => {
      salvarTema(botao.dataset.themeMode);
      aplicarTema(botao.dataset.themeMode);
    });
  });
  document
    .querySelectorAll('form[action="/settings/preferencias"]')
    .forEach(formulario => {
      formulario.addEventListener("submit", () => {
        const tema = formulario.elements.tema?.value;
        if (tema === "light" || tema === "dark") {
          salvarTema(tema);
          aplicarTema(tema);
        }
      });
    });

  const formularioObra = document.querySelector("[data-work-form]");
  const escolhasTipoObra = [
    ...document.querySelectorAll("[data-work-type-choice]"),
  ];
  const valorTipoObra = formularioObra?.querySelector("[data-work-type-value]");
  const contextoTipoObra = formularioObra?.querySelector(
    "[data-work-type-context]"
  );
  const sugestaoTipoObra = formularioObra?.querySelector(
    "[data-work-type-suggestion]"
  );
  const campoTipoOutro = formularioObra?.querySelector(
    "[data-work-type-other-field]"
  );
  const entradaTipoOutro = formularioObra?.querySelector(
    "[data-work-type-other-input]"
  );
  const campoGeneroOutro = formularioObra?.querySelector(
    "[data-work-genre-other-field]"
  );
  const seletorGeneroObra = formularioObra?.querySelector(
    "[data-work-genre-select]"
  );
  const entradaGeneroOutro = formularioObra?.querySelector(
    "[data-work-genre-other-input]"
  );
  const campoPapelOutro = formularioObra?.querySelector(
    "[data-work-role-other-field]"
  );
  const seletorPapelObra = formularioObra?.querySelector('[name="papel"]');
  const entradaPapelOutro = formularioObra?.querySelector(
    "[data-work-role-other-input]"
  );
  const atualizarDetalhesOutrosObra = () => {
    const tipoOutro = valorTipoObra?.value === "Outro";
    const generoOutro = seletorGeneroObra?.value === "Outro";
    const papelOutro = seletorPapelObra?.value === "Outro crédito";
    if (campoTipoOutro) campoTipoOutro.hidden = !tipoOutro;
    if (entradaTipoOutro) {
      entradaTipoOutro.disabled = !tipoOutro;
      entradaTipoOutro.required =
        Boolean(tipoOutro) &&
        formularioObra?.dataset.typeOtherLegacyEmpty !== "true";
      if (!tipoOutro) entradaTipoOutro.value = "";
    }
    if (campoGeneroOutro) campoGeneroOutro.hidden = !generoOutro;
    if (entradaGeneroOutro) {
      entradaGeneroOutro.disabled = !generoOutro;
      entradaGeneroOutro.required =
        Boolean(generoOutro) &&
        formularioObra?.dataset.genreOtherLegacyEmpty !== "true";
      if (!generoOutro) entradaGeneroOutro.value = "";
    }
    if (campoPapelOutro) campoPapelOutro.hidden = !papelOutro;
    if (entradaPapelOutro) {
      entradaPapelOutro.disabled = !papelOutro;
      entradaPapelOutro.required =
        Boolean(papelOutro) &&
        formularioObra?.dataset.roleOtherLegacyEmpty !== "true";
      if (!papelOutro) entradaPapelOutro.value = "";
    }
  };
  seletorGeneroObra?.addEventListener("change", atualizarDetalhesOutrosObra);
  seletorPapelObra?.addEventListener("change", atualizarDetalhesOutrosObra);
  atualizarDetalhesOutrosObra();

  const contextoPorTipo = {
    Música: {
      contexto: "Faixa musical",
      sugestao:
        "Priorize o título, gênero, letra, BPM e os créditos de quem participou.",
      campos: [
        "bpm",
        "lyrics",
        "description",
        "codes",
        "release-date",
        "listen-link",
      ],
      creditos: "Créditos da faixa",
      lancamento: "Identificação e lançamento da faixa",
    },
    Single: {
      contexto: "Lançamento individual",
      sugestao:
        "Use este formato para uma música lançada ou planejada como registro individual.",
      campos: [
        "bpm",
        "lyrics",
        "description",
        "codes",
        "release-date",
        "listen-link",
      ],
      creditos: "Créditos do single",
      lancamento: "Identificação e lançamento do single",
    },
    EP: {
      contexto: "Lançamento curto",
      sugestao:
        "Registre os dados gerais agora; a organização das faixas poderá ser adicionada posteriormente.",
      campos: ["bpm", "description", "codes", "release-date", "listen-link"],
      creditos: "Créditos gerais do EP",
      lancamento: "Dados do lançamento",
    },
    Álbum: {
      contexto: "Lançamento completo",
      sugestao:
        "Registre os dados gerais agora; a tracklist e a ordem das faixas serão organizadas posteriormente.",
      campos: ["description", "codes", "release-date", "listen-link"],
      creditos: "Créditos gerais do álbum",
      lancamento: "Dados do lançamento",
    },
    Beat: {
      contexto: "Instrumental",
      sugestao:
        "Para beats, informe BPM e link de escuta. Licenciamento detalhado será adicionado em uma próxima etapa.",
      campos: ["bpm", "description", "release-date", "listen-link"],
      creditos: "Beatmaker e créditos",
      lancamento: "Identificação e disponibilidade do beat",
    },
    Outro: {
      contexto: "Projeto flexível",
      sugestao:
        "Use a descrição, o gênero e o link para explicar o material enquanto novos tipos são adicionados ao Cypher.",
      campos: ["description", "listen-link"],
      creditos: "Colaboradores do projeto",
      lancamento: "Identificação do projeto",
    },
    Instrumental: {
      contexto: "Material instrumental",
      sugestao:
        "Informe os dados essenciais do instrumental e, se quiser, um link para escuta.",
      campos: ["bpm", "description", "release-date", "listen-link"],
      creditos: "Créditos do instrumental",
      lancamento: "Identificação e disponibilidade do instrumental",
    },
    Obra: {
      contexto: "Obra musical",
      sugestao:
        "Use o formato geral para registrar uma obra que ainda não se encaixa em um lançamento específico.",
      campos: [
        "bpm",
        "lyrics",
        "description",
        "codes",
        "release-date",
        "listen-link",
      ],
      creditos: "Créditos da obra",
      lancamento: "Identificação e lançamento",
    },
    Mixtape: {
      contexto: "Projeto de mixtape",
      sugestao:
        "Registre os dados gerais e use os créditos para organizar as participações do projeto.",
      campos: ["description", "codes", "release-date", "listen-link"],
      creditos: "Créditos gerais da mixtape",
      lancamento: "Dados do lançamento",
    },
  };

  const atualizarContextoObra = tipo => {
    if (!formularioObra || !valorTipoObra) return;
    const configuracao = contextoPorTipo[tipo] ?? null;
    valorTipoObra.value = tipo;
    escolhasTipoObra.forEach(escolha => {
      const selecionada = escolha.value === tipo;
      escolha.checked = selecionada;
      escolha
        .closest("[data-work-type-option]")
        ?.classList.toggle("selected", selecionada);
    });
    if (contextoTipoObra)
      contextoTipoObra.textContent =
        configuracao?.contexto ?? "Escolha um formato";
    if (sugestaoTipoObra) {
      sugestaoTipoObra.textContent = configuracao?.sugestao ?? "";
      sugestaoTipoObra.hidden = !configuracao;
    }
    formularioObra.querySelectorAll("[data-work-field]").forEach(campo => {
      campo.hidden =
        Boolean(configuracao) &&
        !configuracao.campos.includes(campo.dataset.workField);
    });
    atualizarDetalhesOutrosObra();
    const creditos = formularioObra.querySelector(
      "[data-work-section=credits] h2"
    );
    const lancamento = formularioObra.querySelector(
      "[data-work-section=release] h2"
    );
    if (creditos)
      creditos.textContent =
        configuracao?.creditos ?? "Créditos e participações";
    if (lancamento)
      lancamento.textContent =
        configuracao?.lancamento ?? "Identificação e lançamento";
  };

  escolhasTipoObra.forEach(escolha =>
    escolha.addEventListener("change", () =>
      atualizarContextoObra(escolha.value)
    )
  );
  if (formularioObra) {
    const tipoInicial = valorTipoObra?.value || "";
    atualizarContextoObra(tipoInicial);
    formularioObra.addEventListener("submit", evento => {
      if (valorTipoObra?.value) return;
      evento.preventDefault();
      if (sugestaoTipoObra) {
        sugestaoTipoObra.hidden = false;
        sugestaoTipoObra.textContent = "Escolha um formato antes de continuar.";
      }
      escolhasTipoObra[0]?.focus();
    });
  }
  const formularioEvento = document.querySelector("[data-event-form]");
  const categoriaEvento = formularioEvento?.querySelector(
    "[data-event-category-select]"
  );
  const campoCategoriaEventoOutro = formularioEvento?.querySelector(
    "[data-event-category-other-field]"
  );
  const entradaCategoriaEventoOutro = formularioEvento?.querySelector(
    "[data-event-category-other-input]"
  );
  const campoTiposWorkshop = formularioEvento?.querySelector(
    "[data-workshop-types-field]"
  );
  const erroTiposWorkshop = formularioEvento?.querySelector(
    "[data-workshop-types-error]"
  );
  const opcoesTiposWorkshop = [
    ...(formularioEvento?.querySelectorAll(
      'input[name="tiposWorkshop"]'
    ) ?? []),
  ];
  const atualizarDetalheCategoriaEvento = () => {
    const outro = categoriaEvento?.value === "Outro";
    if (campoCategoriaEventoOutro) campoCategoriaEventoOutro.hidden = !outro;
    if (entradaCategoriaEventoOutro) {
      entradaCategoriaEventoOutro.disabled = !outro;
      entradaCategoriaEventoOutro.required =
        Boolean(outro) &&
        formularioEvento?.dataset.categoryOtherLegacyEmpty !== "true";
      if (!outro) entradaCategoriaEventoOutro.value = "";
    }
  };
  categoriaEvento?.addEventListener("change", atualizarDetalheCategoriaEvento);
  atualizarDetalheCategoriaEvento();
  const atualizarTiposWorkshop = () => {
    const workshop = categoriaEvento?.value === "Workshop";
    if (campoTiposWorkshop) campoTiposWorkshop.hidden = !workshop;
    if (!workshop) {
      opcoesTiposWorkshop.forEach(opcao => {
        opcao.checked = false;
        opcao.disabled = true;
        opcao.closest(".workshop-type-option")?.classList.remove("selected");
      });
      if (erroTiposWorkshop) erroTiposWorkshop.hidden = true;
    } else {
      opcoesTiposWorkshop.forEach(opcao => {
        opcao.disabled = false;
        opcao.closest(".workshop-type-option")?.classList.toggle("selected", opcao.checked);
      });
    }
  };
  categoriaEvento?.addEventListener("change", atualizarTiposWorkshop);
  atualizarTiposWorkshop();
  opcoesTiposWorkshop.forEach(opcao => {
    opcao.addEventListener("change", () => {
      opcao.closest(".workshop-type-option")?.classList.toggle("selected", opcao.checked);
      if (opcoesTiposWorkshop.some(item => item.checked) && erroTiposWorkshop) {
        erroTiposWorkshop.hidden = true;
      }
    });
  });
  formularioEvento?.addEventListener("submit", evento => {
    if (
      categoriaEvento?.value === "Workshop" &&
      !opcoesTiposWorkshop.some(opcao => opcao.checked)
    ) {
      evento.preventDefault();
      if (erroTiposWorkshop) erroTiposWorkshop.hidden = false;
      opcoesTiposWorkshop[0]?.focus();
    }
  });
  const categoriaOutros = document.querySelector("[data-category-other]");
  const blocoOutraCategoria = document.querySelector(
    "[data-other-category-field]"
  );
  const entradaCategoria = document.getElementById("categoria-personalizada");
  const atualizarCategorias = () => {
    document.querySelectorAll(".category-option").forEach(opcao => {
      const campo = opcao.querySelector("input[type=checkbox]");
      opcao.classList.toggle("selected", Boolean(campo?.checked));
    });
    const exibir = Boolean(categoriaOutros?.checked);
    if (blocoOutraCategoria) blocoOutraCategoria.hidden = !exibir;
    if (entradaCategoria) entradaCategoria.required = exibir;
  };
  document
    .querySelectorAll(".category-option input[type=checkbox]")
    .forEach(campo => {
      campo.addEventListener("change", atualizarCategorias);
    });
  atualizarCategorias();

  const generoOutro = document.querySelector("[data-genre-other]");
  const blocoOutroGenero = document.querySelector("[data-other-genre-field]");
  const entradaOutroGenero = document.getElementById("genero-personalizado");
  const atualizarOutroGenero = () => {
    const exibir = Boolean(generoOutro?.checked);
    if (blocoOutroGenero) blocoOutroGenero.hidden = !exibir;
    if (entradaOutroGenero) entradaOutroGenero.required = exibir;
    generoOutro
      ?.closest(".profile-genre-option")
      ?.classList.toggle("selected", exibir);
  };
  generoOutro?.addEventListener("change", atualizarOutroGenero);
  document
    .querySelectorAll(".profile-genre-option input[type=checkbox]")
    .forEach(campo => {
      const atualizarEstado = () => {
        campo
          .closest(".profile-genre-option")
          ?.classList.toggle("selected", campo.checked);
      };
      campo.addEventListener("change", atualizarEstado);
      atualizarEstado();
    });
  atualizarOutroGenero();

  const seletorStatusPerfil = document.querySelector("[data-profile-status]");
  const atualizarStatusPerfil = () => {
    if (!seletorStatusPerfil) return;
    const categoriasSelecionadas = new Set(
      [
        ...document.querySelectorAll(".profile-category-option input:checked"),
      ].map(campo => campo.value)
    );
    const opcaoAtual = seletorStatusPerfil.selectedOptions[0];
    seletorStatusPerfil
      .querySelectorAll("option[data-categorias]")
      .forEach(opcao => {
        const compativel = opcao.dataset.categorias
          .split("|")
          .some(categoria => categoriasSelecionadas.has(categoria));
        opcao.hidden = !compativel;
        opcao.disabled = !compativel;
      });
    if (opcaoAtual?.disabled) seletorStatusPerfil.value = "";
  };
  document
    .querySelectorAll(".profile-category-option input[type=checkbox]")
    .forEach(campo => {
      campo.addEventListener("change", atualizarStatusPerfil);
    });
  atualizarStatusPerfil();

  const listaPerfisCredito = document.querySelector(
    "[data-profile-credit-list]"
  );
  document
    .querySelector("[data-add-profile-credit]")
    ?.addEventListener("click", () => {
      if (!listaPerfisCredito) return;
      const grupo = document.createElement("fieldset");
      grupo.className = "ghost-entry credit-entry";
      grupo.dataset.creditEntry = "";
      const legenda = document.createElement("legend");
      legenda.textContent = "Perfil Cypher";
      const linha = document.createElement("div");
      linha.className = "form-grid";
      const criarCampo = (rotulo, nome, placeholder, maxLength, required) => {
        const campo = document.createElement("label");
        campo.textContent = rotulo;
        const entrada = document.createElement("input");
        entrada.type = "text";
        entrada.name = nome;
        entrada.maxLength = maxLength;
        entrada.placeholder = placeholder;
        entrada.required = required;
        if (nome === "perfilCreditoHandle") {
          entrada.setAttribute("list", "perfis-cypher");
          entrada.autocomplete = "off";
        }
        campo.appendChild(entrada);
        return campo;
      };
      linha.append(
        criarCampo(
          "Identificador do perfil",
          "perfilCreditoHandle",
          "@identificador",
          81,
          true
        ),
        criarCampo("Função", "perfilCreditoPapel", "Ex.: composição", 80, true),
        criarCampo(
          "Participação",
          "perfilCreditoParticipacao",
          "Ex.: 50%",
          30,
          false
        )
      );
      const remover = document.createElement("button");
      remover.type = "button";
      remover.className = "text-link ghost-remove";
      remover.dataset.removeCreditEntry = "";
      remover.textContent = "Remover crédito";
      grupo.append(legenda, linha, remover);
      listaPerfisCredito.appendChild(grupo);
      grupo.querySelector("input")?.focus();
    });

  const listaMenções = document.querySelector("[data-ghost-list]");
  document.querySelector("[data-add-ghost]")?.addEventListener("click", () => {
    if (!listaMenções) return;
    const grupo = document.createElement("fieldset");
    grupo.className = "ghost-entry";
    grupo.dataset.ghostEntry = "";
    const legenda = document.createElement("legend");
    legenda.textContent = "Pessoa sem conta no Cypher";
    const linha = document.createElement("div");
    linha.className = "form-grid";
    const campoNome = document.createElement("label");
    campoNome.textContent = "Nome da pessoa";
    const nome = document.createElement("input");
    nome.name = "mencaoFantasmaNome";
    nome.maxLength = 100;
    nome.placeholder = "Nome artístico ou profissional";
    nome.required = true;
    campoNome.appendChild(nome);
    const campoPapel = document.createElement("label");
    campoPapel.textContent = "Crédito";
    const papel = document.createElement("input");
    papel.name = "mencaoFantasmaPapel";
    papel.maxLength = 80;
    papel.placeholder = "Ex.: composição, produção, feat";
    papel.required = true;
    campoPapel.appendChild(papel);
    const campoParticipacao = document.createElement("label");
    campoParticipacao.textContent = "Participação (opcional)";
    const participacao = document.createElement("input");
    participacao.name = "mencaoFantasmaParticipacao";
    participacao.maxLength = 30;
    participacao.placeholder = "Ex.: 50%";
    campoParticipacao.appendChild(participacao);
    linha.append(campoNome, campoPapel, campoParticipacao);
    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "text-link ghost-remove";
    remover.dataset.removeCreditEntry = "";
    remover.textContent = "Remover menção";
    grupo.append(legenda, linha, remover);
    listaMenções.appendChild(grupo);
    nome.focus();
  });

  document.addEventListener("click", evento => {
    if (!(evento.target instanceof Element)) return;
    const remover = evento.target.closest("[data-remove-credit-entry]");
    if (remover)
      remover.closest("[data-credit-entry], [data-ghost-entry]")?.remove();
  });

  document
    .querySelector("[data-central-search]")
    ?.addEventListener("submit", evento => {
      evento.preventDefault();
      const campo = evento.currentTarget.querySelector("input");
      const consulta = campo.value.trim().toLocaleLowerCase("pt-BR");
      document.querySelectorAll("[data-faq-item]").forEach(item => {
        item.hidden = !item.textContent
          .toLocaleLowerCase("pt-BR")
          .includes(consulta);
      });
    });

  const centroNotificacoes = document.querySelector(
    "[data-notification-center]"
  );
  const botaoNotificacoes = centroNotificacoes?.querySelector(
    "[data-notification-open]"
  );
  const painelNotificacoes = centroNotificacoes?.querySelector(
    "[data-notification-panel]"
  );
  const fecharNotificacoes = () => {
    if (!painelNotificacoes || !botaoNotificacoes) return;
    painelNotificacoes.hidden = true;
    botaoNotificacoes.setAttribute("aria-expanded", "false");
  };
  botaoNotificacoes?.addEventListener("click", () => {
    if (!painelNotificacoes) return;
    const aberto = painelNotificacoes.hidden;
    painelNotificacoes.hidden = !aberto;
    botaoNotificacoes.setAttribute("aria-expanded", String(aberto));
  });
  document.addEventListener("click", evento => {
    if (
      centroNotificacoes &&
      evento.target instanceof Node &&
      !centroNotificacoes.contains(evento.target)
    ) {
      fecharNotificacoes();
    }
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") fecharNotificacoes();
  });
})();

(() => {
  const cachePaletas = new Map();
  const cartazesWorkshop = document.querySelectorAll(
    '.dc-event-card[data-event-theme="cartaz-de-rua"][data-event-category="Workshop"][data-event-cover-src]'
  );

  const extrairMatiz = imagem => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    if (!contexto) return null;
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    const dados = contexto.getImageData(0, 0, canvas.width, canvas.height).data;
    let somaX = 0;
    let somaY = 0;
    let pesoTotal = 0;
    for (let pixel = 0; pixel < dados.length; pixel += 16) {
      const vermelho = dados[pixel] / 255;
      const verde = dados[pixel + 1] / 255;
      const azul = dados[pixel + 2] / 255;
      const maximo = Math.max(vermelho, verde, azul);
      const minimo = Math.min(vermelho, verde, azul);
      const diferenca = maximo - minimo;
      const saturacao = maximo ? diferenca / maximo : 0;
      const luminosidade = (maximo + minimo) / 2;
      if (saturacao < 0.16 || luminosidade < 0.12 || luminosidade > 0.9) {
        continue;
      }

      let matiz;
      if (maximo === vermelho) {
        matiz = ((verde - azul) / diferenca) % 6;
      } else if (maximo === verde) {
        matiz = (azul - vermelho) / diferenca + 2;
      } else {
        matiz = (vermelho - verde) / diferenca + 4;
      }
      matiz = ((matiz * 60) % 360 + 360) % 360;
      const peso = saturacao * (1 - Math.abs(luminosidade - 0.52));
      const radianos = (matiz * Math.PI) / 180;
      somaX += Math.cos(radianos) * peso;
      somaY += Math.sin(radianos) * peso;
      pesoTotal += peso;
    }

    if (!pesoTotal) return null;
    return (Math.atan2(somaY, somaX) * 180 / Math.PI + 360) % 360;
  };

  cartazesWorkshop.forEach(cartaz => {
    const origem = cartaz.dataset.eventCoverSrc;
    const aplicarPaleta = matiz => {
      cartaz.style.setProperty(
        "--cartaz-workshop-sticker-color",
        `hsl(${matiz} 42% 80%)`
      );
      cartaz.style.setProperty(
        "--cartaz-workshop-band-color",
        `hsl(${matiz} 44% 72%)`
      );
    };

    if (cachePaletas.has(origem)) {
      aplicarPaleta(cachePaletas.get(origem));
      return;
    }

    const imagem = new Image();
    imagem.onload = () => {
      try {
        const matiz = extrairMatiz(imagem);
        if (matiz === null) return;
        cachePaletas.set(origem, matiz);
        aplicarPaleta(matiz);
      } catch {
        // Mantém a paleta Cypher de fallback se o navegador bloquear a leitura da imagem.
      }
    };
    imagem.src = origem;
  });
})();
