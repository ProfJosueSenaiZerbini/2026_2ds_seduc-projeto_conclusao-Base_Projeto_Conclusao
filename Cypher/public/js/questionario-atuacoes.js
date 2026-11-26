(() => {
  "use strict";

  const form = document.querySelector(
    "form[data-register-form][data-atuacao-form]"
  );

  const stages = form
    ? [...form.querySelectorAll("[data-register-stage]")]
    : [];
  const indicators = form
    ? [...form.querySelectorAll("[data-step-indicator]")]
    : [];
  const title = document.querySelector("[data-register-title]");
  const description = document.querySelector("[data-register-description]");
  const accountNext = form?.querySelector("[data-account-next]");
  const categoriesNext = form?.querySelector("[data-categories-next]");
  const questionNext = form?.querySelector("[data-question-next]");
  const questionPrevious = form?.querySelector("[data-question-previous]");
  const finishButton = form?.querySelector("[data-register-submit]");
  const categoryValidation = form?.querySelector("[data-category-validation]");
  const areaPicker = form?.querySelector("[data-category-area-picker]");
  const categoryBrowser = form?.querySelector("[data-category-browser]");
  const questionCurrent = form?.querySelector("[data-question-current]");
  const questionAnswered = form?.querySelector("[data-question-answered]");
  const progress = form?.querySelector('[role="progressbar"]');
  const progressBar = form?.querySelector("[data-question-progress-bar]");
  const progressPercent = form?.querySelector("[data-question-percent]");
  const categoryContext = form?.querySelector("[data-question-category]");
  const page = form?.closest("[data-tag-page]");
  const savedStage = { profissional: "conta", consumidor: "conta" };
  let sending = false;
  let stage = "conta";
  let questionIndex = 0;
  let questions = [];
  let pendingQuestion = null;
  const pageByStage = {
    conta: ["Como você se chama?", "Informe seu nome e escolha se ele aparece publicamente."],
    contato: ["Como te encontrar?", "Escolha seu @ e informe seu e-mail."],
    acesso: ["Crie seu acesso", "Informe sua data de nascimento e escolha uma senha."],
    categorias: ["Como você movimenta a cena?", "Selecione uma ou mais profissões. Você pode escolher em áreas diferentes."],
    vertentes: ["Qual é a sua sonoridade?", "Esta etapa é opcional. Você pode mudar suas escolhas depois."],
    questionarios: ["Tempo de atuação", "Informe seu tempo de atuação em cada profissão selecionada."],

  };

  const selectedCategories = (targetForm = form) =>
    new Set(
      [...targetForm.querySelectorAll('[name="categorias"]:checked')].map(
        input => input.value
      )
    );

  function showError(message, stageName = stage) {
    const container = form.querySelector(
      `[data-register-stage="${stageName}"] [data-stage-error]`
    );
    if (!container) return;
    container.textContent = message;
    container.hidden = !message;
  }

  function clearErrors() {
    form.querySelectorAll("[data-stage-error]").forEach(error => {
      error.hidden = true;
      error.textContent = "";
    });
  }

  function showStage(nextStage) {
    if (stage === "questionarios" && ["categorias", "vertentes"].includes(nextStage)) {
      pendingQuestion = questions[questionIndex] ?? null;
    }
    stage = nextStage;
    clearErrors();
    stages.forEach(section => {
      section.hidden = section.dataset.registerStage !== stage;
    });
    syncBranch();
    indicators.forEach(item => {
      const active = item.dataset.stepIndicator === stage;
      const current = indicators.findIndex(
        indicator => indicator.dataset.stepIndicator === stage
      );
      const own = indicators.indexOf(item);
      if (active) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
      item.classList.toggle("is-complete", own < current);
    });
    if (title && description) {
      [title.textContent, description.textContent] = pageByStage[stage];
    }
    if (stage === "questionarios") {
      rebuildQuestions();
      if (pendingQuestion) {
        const restoredIndex = questions.findIndex(
          item => item.fieldset === pendingQuestion.fieldset
        );
        questionIndex = restoredIndex >= 0 ? restoredIndex : 0;
        pendingQuestion = null;
      }
      showQuestion();
    }
    if (page.dataset.active) {
      const target = stage === "categorias"
        ? title
        : form.querySelector(`[data-register-stage="${stage}"] :is(input:not([type=hidden]),select,button):not(:disabled)`);
      requestAnimationFrame(() => {
        if (!form.querySelector("[aria-invalid=true]:focus")) target?.focus({preventScroll:true});
      });
    }
  }

  function isAnswered(fieldset) {
    const controls = [
      ...fieldset.querySelectorAll("[data-resposta-atuacao]:not(:disabled)"),
    ];
    if (!controls.length) return false;
    const first = controls[0];
    if (first.type === "checkbox")
      return controls.some(control => control.checked);
    if (first.type === "radio")
      return controls.some(control => control.checked);
    return controls.some(control => String(control.value).trim() !== "");
  }

  function updateDependencies(panel) {
    panel.querySelectorAll("[data-depende-campo]").forEach(field => {
      const parentName = field.getAttribute("data-depende-campo");
      const parentValue = field.getAttribute("data-depende-valor");
      const parents = [
        ...panel.querySelectorAll("[data-resposta-atuacao]"),
      ].filter(
        control => control.getAttribute("data-resposta-atuacao") === parentName
      );
      const active = parents.some(
        control => control.checked && control.value === parentValue
      );
      field.dataset.dependencyInactive = String(!active);
      field.hidden = !active;
      const dependencyRequired = active && Boolean(field.dataset.dependeCampo);
      field.querySelectorAll("input, select, textarea").forEach(control => {
        control.disabled = !active;
        control.required = dependencyRequired;
        if (dependencyRequired) control.setAttribute("aria-required", "true");
        else control.removeAttribute("aria-required");
        if (!active) {
          if (control.type === "checkbox" || control.type === "radio")
            control.checked = false;
          else control.value = "";
        }
      });
    });
  }

  function activeFieldsets() {
    const selected = selectedCategories();
    const result = [];
    form
      .querySelectorAll("[data-atuacao-questionario][data-categoria]")
      .forEach(panel => {
        updateDependencies(panel);
        if (!selected.has(panel.dataset.categoria)) return;
        panel
          .querySelectorAll(".professional-questionnaire__field")
          .forEach(fieldset => {
            if (fieldset.dataset.dependencyInactive === "true") return;
            result.push({ panel, fieldset, category: panel.dataset.categoria });
          });
      });
    return result;
  }

  function rebuildQuestions() {
    questions = activeFieldsets();
    questionIndex = Math.min(questionIndex, Math.max(0, questions.length - 1));
    refreshProgress();
  }

  function refreshProgress() {
    form.querySelectorAll('.trajectory-options').forEach(options => {
      const labels = [...options.querySelectorAll('.trajectory-option')];
      const chosen = labels.findIndex(label => label.querySelector('input').checked);
      const previous = Number(options.dataset.timeIndex ?? -1);
      labels.forEach((label, index) => {
        label.classList.toggle('is-past', index < chosen);
        const fill = chosen < 0 || index > chosen ? 0 : index < chosen ? 1 : index === 0 ? 0 : index === labels.length - 1 ? 1 : .5;
        label.style.setProperty('--time-fill', fill);
        label.style.setProperty('--time-delay', `${Math.min(Math.abs(index - previous) * 35, 140)}ms`);
      });
      if (previous !== chosen && chosen >= 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        labels[chosen].querySelector('.trajectory-option-mark').animate([
          {transform:'scale(1)'}, {transform:'scale(1.2)',offset:.45}, {transform:'scale(1)'}
        ], {duration:320,easing:'ease-out'});
      }
      options.dataset.timeIndex = chosen;
    });
    const answered = questions.filter(item => isAnswered(item.fieldset)).length;
    const total = questions.length;
    if (!total) {
      if (questionCurrent)
        questionCurrent.textContent = "Nenhuma pergunta disponível";
      if (questionAnswered)
        questionAnswered.textContent =
          "Selecione ao menos uma profissão para continuar";
      if (progress) progress.setAttribute("aria-valuenow", "0");
      if (progressBar) progressBar.style.width = "0%";
      if (progressPercent) progressPercent.textContent = "0%";
      if (questionNext) questionNext.hidden = true;
      if (questionPrevious) questionPrevious.hidden = true;
      if (finishButton) finishButton.hidden = true;
      return;
    }
    const current = Math.min(questionIndex + 1, Math.max(total, 1));
    const percent = total ? Math.round((answered / total) * 100) : 100;
    if (questionCurrent)
      questionCurrent.textContent = `Profissão ${current} de ${total}`;
    if (questionAnswered)
      questionAnswered.textContent = `${answered} de ${total} preenchidas`;
    if (progress) progress.setAttribute("aria-valuenow", String(percent));
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (questionNext) questionNext.hidden = questionIndex >= total - 1;
    if (questionPrevious) questionPrevious.hidden = questionIndex <= 0;
    if (finishButton)
      finishButton.hidden = total === 0 || questionIndex < total - 1;
  }

  function showQuestion() {
    const active = questions[questionIndex];
    form
      .querySelectorAll("[data-atuacao-questionario][data-categoria]")
      .forEach(panel => {
        panel.hidden = !active || panel !== active.panel;
      });
    form
      .querySelectorAll(".professional-questionnaire__field")
      .forEach(fieldset => {
        fieldset.hidden = true;
      });
    if (!active) {
      if (categoryContext)
        categoryContext.textContent =
          "Nenhuma profissão selecionada. Volte e escolha ao menos uma para continuar.";
      refreshProgress();
      return;
    }
    active.fieldset.hidden = false;
    if (categoryContext) {
      categoryContext.replaceChildren();
      [...new Set(questions.map(item => item.category))].forEach(category => {
        const label = document.createElement('span');
        label.className = 'trajectory-profession';
        label.textContent = (form.querySelector(`[data-profissao="${CSS.escape(category)}"]`)?.textContent || category).trim();
        if (category === active.category) label.setAttribute('aria-current', 'step');
        categoryContext.append(label);
      });
    }
    refreshProgress();
  }

  function updateCategoryCards(targetForm = form) {
    if (!targetForm) return;
    const selected = selectedCategories(targetForm);
    targetForm.querySelectorAll(".category-option").forEach(card => {
      const input = card.querySelector('[name="categorias"]');
      card.classList.toggle("selected", Boolean(input?.checked));
    });
    const summary = targetForm.querySelector("[data-category-summary]");
    if (summary) {
      summary.textContent = selected.size
        ? `${selected.size} ${selected.size === 1 ? "profissão selecionada" : "profissões selecionadas"}`
        : "Nenhuma profissão selecionada";
    }
    targetForm.querySelectorAll("[data-category-count]").forEach(counter => {
      const group = counter.closest("[data-professional-group]");
      const count = group
        ? [...group.querySelectorAll('[name="categorias"]:checked')].length
        : 0;
      counter.textContent = String(count);
      counter.hidden = count === 0;
    });
    targetForm.querySelectorAll("[data-category-area]").forEach(button => {
      const areaId = button.dataset.categoryArea;
      const group = targetForm.querySelector(
        `[data-category-area-panel="${CSS.escape(areaId)}"]`
      );
      const count = group
        ? group.querySelectorAll('[name="categorias"]:checked').length
        : 0;
      const counter = button.querySelector("[data-category-area-count]");
      button.classList.toggle("has-selection", count > 0);
      if (counter) {
        counter.textContent = String(count);
        counter.hidden = count === 0;
      }
    });
  }

  function showCategoryArea(areaId, targetForm = form) {
    if (!targetForm) return;
    const picker = targetForm.querySelector("[data-category-area-picker]");
    const browser = targetForm.querySelector("[data-category-browser]");
    targetForm.querySelectorAll("[data-category-area-panel]").forEach(panel => {
      panel.hidden = panel.dataset.categoryAreaPanel !== areaId;
    });
    if (picker) picker.hidden = true;
    if (browser) browser.hidden = false;
    browser?.querySelector("[data-category-back-to-areas]")?.focus({ preventScroll: true });
  }

  function showCategoryAreas(targetForm = form) {
    if (!targetForm) return;
    const picker = targetForm.querySelector("[data-category-area-picker]");
    const browser = targetForm.querySelector("[data-category-browser]");
    const openArea = targetForm.querySelector("[data-category-area-panel]:not([hidden])");
    if (openArea) openArea.hidden = true;
    if (picker) picker.hidden = false;
    if (browser) browser.hidden = true;
    if (openArea) {
      picker?.querySelector(`[data-category-area="${CSS.escape(openArea.dataset.categoryAreaPanel)}"]`)
        ?.focus({ preventScroll: true });
    }
  }

  function bindCategoryAreaNavigation(targetForm = form) {
    if (!targetForm) return;
    targetForm.querySelectorAll("[data-category-area]").forEach(button => {
      button.addEventListener("click", () => {
        showCategoryArea(button.dataset.categoryArea, targetForm);
      });
    });
    targetForm
      .querySelector("[data-category-back-to-areas]")
      ?.addEventListener("click", () => showCategoryAreas(targetForm));
    updateCategoryCards(targetForm);
  }

  function serialize(targetForm = form) {
    const responses = {};
    const visibilities = {};
    const selected = selectedCategories(targetForm);
    targetForm
      .querySelectorAll("[data-atuacao-questionario][data-categoria]")
      .forEach(panel => {
        const category = panel.dataset.categoria;
        if (!selected.has(category)) return;
        const categoryResponses = {};
        const categoryVisibilities = {};
        panel.querySelectorAll("[data-resposta-atuacao]").forEach(control => {
          if (control.disabled) return;
          const key = control.dataset.respostaAtuacao;
          if (
            !key ||
            Object.prototype.hasOwnProperty.call(categoryResponses, key)
          )
            return;
          const peers = [
            ...panel.querySelectorAll(
              `[data-resposta-atuacao="${CSS.escape(key)}"]:not(:disabled)`
            ),
          ];
          if (!peers.length) return;
          const first = peers[0];
          if (first.type === "radio") {
            const chosen = peers.find(peer => peer.checked);
            if (chosen)
              categoryResponses[key] =
                chosen.dataset.tipoRespostaAtuacao === "booleano"
                  ? chosen.value === "true"
                  : chosen.value;
          } else if (first.type === "checkbox") {
            const chosen = peers
              .filter(peer => peer.checked)
              .map(peer => peer.value);
            if (chosen.length) categoryResponses[key] = chosen;
          } else if (String(first.value).trim()) {
            categoryResponses[key] = first.value;
          }
        });
        panel
          .querySelectorAll("[data-visibilidade-atuacao]")
          .forEach(control => {
            if (!control.disabled && control.value && (control.type !== "radio" || control.checked))
              categoryVisibilities[control.dataset.visibilidadeAtuacao] =
                control.value;
          });
        const categoryVisibility = panel.querySelector(
          "[data-visibilidade-categoria]"
        );
        if (categoryVisibility)
          categoryVisibilities.__categoria__ = categoryVisibility.value;
        responses[category] = categoryResponses;
        visibilities[category] = categoryVisibilities;
      });
    const responsesInput = targetForm.querySelector(
      "[data-respostas-atuacoes-json]"
    );
    const visibilitiesInput = targetForm.querySelector(
      "[data-visibilidades-atuacoes-json]"
    );
    if (responsesInput) responsesInput.value = JSON.stringify(responses);
    if (visibilitiesInput)
      visibilitiesInput.value = JSON.stringify(visibilities);
  }

  if (!form) {
    document
      .querySelectorAll("form[data-atuacao-form]:not([data-register-form])")
      .forEach(formulario => {
        const atualizarQuestionariosSelecionados = () => {
          const selecionadas = selectedCategories(formulario);
          const estilos = formulario.querySelector("[data-estilos-profissionais]");
          if (estilos) {
            estilos.hidden = estilos.dataset.temGeneros !== "true" &&
              !formulario.querySelector('[data-estilos-musicais]:checked');
          }
          formulario
            .querySelectorAll("[data-atuacao-questionario][data-categoria]")
            .forEach(painel => {
              updateDependencies(painel);
              const grupo = painel.closest("[data-profile-category-group]");
              const visivel = selecionadas.has(painel.dataset.categoria);
              if (grupo) grupo.hidden = !visivel;
              else painel.hidden = !visivel;
              if (visivel) painel.hidden = false;
              if (visivel && grupo?.tagName === "DETAILS") grupo.open = true;
            });
        };

        const limparMensagensValidacao = () => {
          formulario
            .querySelectorAll(
              "[data-category-validation], [data-profile-question-validation]"
            )
            .forEach(mensagem => {
              mensagem.hidden = true;
              mensagem.textContent = mensagem.dataset.defaultMessage || "";
            });
        };

        const validarFormulario = evento => {
          const selecionadas = selectedCategories(formulario);
          const erroCategorias = formulario.querySelector(
            "[data-category-validation]"
          );
          if (erroCategorias) {
            erroCategorias.hidden = selecionadas.size > 0;
            if (!selecionadas.size) {
              evento.preventDefault();
              formulario
                .querySelector('[name="categorias"]:not(:disabled)')
                ?.focus();
              return;
            }
          }

          for (const grupo of formulario.querySelectorAll(
            "[data-profile-category-group]"
          )) {
            if (
              !selecionadas.has(grupo.dataset.categoria) ||
              grupo.dataset.categoriaAtual === "true"
            )
              continue;
            const painel = grupo.querySelector(
              "[data-atuacao-questionario][data-categoria]"
            );
            if (!painel) continue;
            updateDependencies(painel);
            for (const pergunta of painel.querySelectorAll(
              '.professional-questionnaire__field[data-obrigatoria="true"]'
            )) {
              if (
                pergunta.hidden ||
                pergunta.dataset.dependencyInactive === "true" ||
                isAnswered(pergunta)
              )
                continue;
              const mensagem = grupo.querySelector(
                "[data-profile-question-validation]"
              );
              if (mensagem) {
                mensagem.textContent =
                  "Responda às perguntas obrigatórias desta nova categoria antes de salvar.";
                mensagem.hidden = false;
              }
              evento.preventDefault();
              pergunta
                .querySelector("[data-resposta-atuacao]:not(:disabled)")
                ?.focus();
              return;
            }
          }
        };

        formulario.addEventListener("change", evento => {
          const alvo = evento.target;
          if (alvo.matches('[name="categorias"]')) {
            updateCategoryCards(formulario);
            atualizarQuestionariosSelecionados();
            limparMensagensValidacao();
          } else if (alvo.matches("[data-resposta-atuacao]")) {
            const painel = alvo.closest("[data-atuacao-questionario]");
            if (painel) updateDependencies(painel);
            const mensagem = alvo
              .closest("[data-profile-category-group]")
              ?.querySelector("[data-profile-question-validation]");
            if (mensagem) mensagem.hidden = true;
          }
        });
        formulario.addEventListener("submit", evento => {
          serialize(formulario);
          validarFormulario(evento);
        });
        bindCategoryAreaNavigation(formulario);
        atualizarQuestionariosSelecionados();
      });
    return;
  }

  async function validateAccount() {
    if (!validStep(stage)) return false;
    accountNext.disabled = true;
    accountNext.setAttribute("aria-busy", "true");
    const originalText = accountNext.innerHTML;
    accountNext.textContent = "Verificando…";
    try {
      const response = await fetch("/register/validate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
          accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) {
        const field = form.elements.namedItem(result.field);
        const fieldStage = field?.closest("[data-register-stage]")?.dataset.registerStage || "acesso";
        showStage(fieldStage);
        showError(result.message || "Confira os dados e tente novamente.", fieldStage);
        if (field?.focus) {
          const error = form.querySelector(`[data-register-stage="${fieldStage}"] [data-stage-error]`);
          error.id = "cadastro-erro-campo";
          field.closest("label")?.after(error);
          field.setAttribute("aria-invalid","true");
          const original = field.getAttribute("aria-describedby");
          field.setAttribute("aria-describedby", [original,error.id].filter(Boolean).join(" "));
          field.addEventListener("input", () => {
            field.removeAttribute("aria-invalid");
            if (original) field.setAttribute("aria-describedby",original);
            else field.removeAttribute("aria-describedby");
            error.hidden = true;
          }, {once:true});
          field.focus();
        }
        return false;
      }
      return true;
    } catch {
      showError(
        "Não foi possível verificar os dados agora. Confira sua conexão e tente novamente.",
        "acesso"
      );
      return false;
    } finally {
      accountNext.disabled = false;
      accountNext.removeAttribute("aria-busy");
      accountNext.innerHTML = originalText;
    }
  }

  async function nextFromAccount() {
    const tipo = page?.dataset.active;
    if (tipo && await validateAccount() && page.dataset.active === tipo) {
      if(form.querySelector('[name="tipoConta"]:checked')?.value === 'consumidor') form.requestSubmit();
      else showStage("categorias");
    }
  }

  function nextFromCategories() {
    updateCategoryCards();
    const selected = selectedCategories();
    if (!selected.size) {
      categoryValidation.hidden = false;
      categoryValidation.scrollIntoView({ block: "nearest" });
      return;
    }
    categoryValidation.hidden = true;
    questionIndex = 0;
    showStage(selected.has("Rapper") ? "vertentes" : "questionarios");
  }

  function currentQuestionValid() {
    const item = questions[questionIndex];
    if (!item || item.fieldset.dataset.obrigatoria !== "true") return true;
    if (isAnswered(item.fieldset)) return true;
    showError(
      "Esta pergunta é obrigatória. Selecione ou informe uma resposta para continuar."
    );
    item.fieldset
      .querySelector("[data-resposta-atuacao]:not(:disabled)")
      ?.focus();
    return false;
  }

  function moveQuestion(direction) {
    if (direction > 0 && !currentQuestionValid()) return;
    clearErrors();
    rebuildQuestions();
    questionIndex = Math.min(
      Math.max(questionIndex + direction, 0),
      Math.max(questions.length - 1, 0)
    );
    showQuestion();
  }

  form.addEventListener("change", event => {
    if (event.target.matches('[name="categorias"]')) {
      updateCategoryCards();
      syncBranch();
      categoryValidation.hidden = true;
      if (stage === "questionarios") {
        rebuildQuestions();
        showQuestion();
      }
      return;
    }
    if (event.target.matches("[data-resposta-atuacao]")) {
      const panel = event.target.closest("[data-atuacao-questionario]");
      if (panel) updateDependencies(panel);
      if (stage === "questionarios") {
        const activeFieldset = questions[questionIndex]?.fieldset;
        rebuildQuestions();
        const updatedIndex = questions.findIndex(
          item => item.fieldset === activeFieldset
        );
        if (updatedIndex >= 0) questionIndex = updatedIndex;
        else
          questionIndex = Math.min(
            questionIndex,
            Math.max(questions.length - 1, 0)
          );
        showQuestion();
      }
    }
    if (stage === "questionarios") refreshProgress();
  });

  bindCategoryAreaNavigation(form);

  form.addEventListener("invalid", event => {
    event.preventDefault();
    const field = event.target;
    const fieldStage = field.closest("[data-register-stage]")?.dataset.registerStage;
    if (!fieldStage) return;
    if (stage !== fieldStage) showStage(fieldStage);
    showError(field.validationMessage, fieldStage);
    field.setAttribute("aria-invalid", "true");
    const error = form.querySelector(`[data-register-stage="${fieldStage}"] [data-stage-error]`);
    error.id ||= "aviso-" + fieldStage;
    const previous = field.getAttribute("aria-describedby");
    field.setAttribute("aria-describedby", [...new Set([...(previous || "").split(" ").filter(Boolean), error.id])].join(" "));
    field.focus({preventScroll:true});
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      if (previous) field.setAttribute("aria-describedby", previous);
      else field.removeAttribute("aria-describedby");
      error.hidden = true;
    }, {once:true});
  }, true);

  function syncBranch() {
    const enabled = selectedCategories().has("Rapper") && form.querySelector('[name="tipoConta"]:checked')?.value === "profissional";
    form.querySelector('[data-step-indicator="vertentes"]').hidden = !enabled;
    form.querySelector('.register-steps').classList.toggle('has-rap-branch', enabled);
    const count = form.querySelectorAll('[name="vertentes"]:checked').length;
    form.querySelector('[data-branches-status]').textContent = count
      ? `${count} ${count === 1 ? 'vertente selecionada' : 'vertentes selecionadas'}`
      : 'Nenhuma vertente selecionada.';
    form.querySelector('[data-register-stage="vertentes"] [data-continue]').textContent = count ? 'Continuar →' : 'Pular etapa →';
  }
  form.addEventListener('change', event => {
    if (event.target.matches('[name="vertentes"]')) syncBranch();
  });
  const stepOrder = Object.keys(pageByStage);
  function validStep(id) {
    const fields = form.querySelectorAll(`[data-register-stage="${id}"] :is(input,select):not(:disabled)`);
    for (const field of fields) {
      if (!field.reportValidity()) return false;
    }
    return true;
  }
  function advance() {
    if (validStep(stage)) showStage(stepOrder[stepOrder.indexOf(stage) + 1]);
  }
  form.querySelectorAll("[data-continue]").forEach(button => button.addEventListener("click", advance));
  form.querySelectorAll("[data-register-back]").forEach(button => {
    button.addEventListener("click", () => {
      if (!accountNext.disabled) {
        const previous = stepOrder[stepOrder.indexOf(stage) - 1];
        showStage(previous === "vertentes" && !selectedCategories().has("Rapper") ? "categorias" : previous);
      }
    });
  });
  form.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.isComposing || !event.target.matches("input:not([type=checkbox]):not([type=radio])")) return;
    if (!["conta","contato","acesso"].includes(stage)) return;
    event.preventDefault();
    if (stage === "acesso") {
      if (!accountNext.disabled) nextFromAccount();
    } else advance();
  });
  accountNext?.addEventListener("click", nextFromAccount);
  categoriesNext?.addEventListener("click", nextFromCategories);
  questionNext?.addEventListener("click", () => moveQuestion(1));
  questionPrevious?.addEventListener("click", () => moveQuestion(-1));

  window.addEventListener("pageshow", event => {
    if (event.persisted && sending) {
      sending = false;
      const button = page.dataset.active === "consumidor" ? accountNext : finishButton;
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = page.dataset.active === "consumidor" ? "Finalizar cadastro" : "Finalizar cadastro →";
    }
  });

  function lockSubmission(button) {
    sending = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Criando conta…";
  }

  form.addEventListener("submit", event => {
    if (sending || !page?.dataset.active) {
      event.preventDefault();
      return;
    }
    if(form.querySelector('[name="tipoConta"]:checked')?.value === 'consumidor') {
      form.querySelector('[data-respostas-atuacoes-json]').value='{}';
      lockSubmission(accountNext);
      return;
    }
    if (stage !== "questionarios") {
      event.preventDefault();
      return;
    }
    if (!currentQuestionValid()) {
      event.preventDefault();
      return;
    }
    serialize();
    lockSubmission(finishButton);
  });

  form.addEventListener("input", event => {
    if (
      event.target.matches("[data-resposta-atuacao]") &&
      stage === "questionarios"
    )
      refreshProgress();
  });

  function switchTag(next, sticker) {
    if (sending || accountNext.disabled) return;
    const previous = page.dataset.active;
    if (previous) savedStage[previous] = stage;
    const before = sticker.getBoundingClientRect();
    page.dataset.active = next;
    if (next) {
      const radio = form.querySelector('[name="tipoConta"][value="' + next + '"]');
      radio.checked = true;
      radio.dispatchEvent(new Event("change", {bubbles:true}));
      showStage(savedStage[next]);
    } else {
      sticker.focus();
    }
    for (const link of page.querySelectorAll("[data-sticker]")) {
      const active = link.dataset.sticker === next;
      const name = link.querySelector("strong").textContent;
      const descricao = link.querySelector("small").textContent;
      link.setAttribute("aria-label", name + ". " + descricao + (active ? " Conta selecionada. Trocar tipo de conta." : ""));
      link.href = active ? "/register" : "/register?tipo=" + link.dataset.sticker;
    }
    const after = sticker.getBoundingClientRect();
    if (sticker.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sticker.animate([
        {translate: (before.left-after.left)+"px "+(before.top-after.top)+"px", scale:String(before.width/after.width)},
        {translate:"0 0",scale:"1"}
      ], {duration:400,easing:"cubic-bezier(.2,.8,.2,1)"});
    }
  }
  page.querySelectorAll("[data-sticker]").forEach(sticker => {
    sticker.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      switchTag(page.dataset.active === sticker.dataset.sticker ? "" : sticker.dataset.sticker, sticker);
    });
  });
  updateCategoryCards();
  form
    .querySelectorAll("[data-atuacao-questionario]")
    .forEach(panel => updateDependencies(panel));
  const initialStage = stepOrder.includes(
    form.dataset.startStage
  )
    ? form.dataset.startStage
    : "conta";
  showStage(initialStage);
})();
