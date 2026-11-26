(() => {
  "use strict";

  const editor = document.querySelector("[data-profile-editor]");
  if (!editor) return;

  const tabs = [...editor.querySelectorAll("[data-profile-edit-tab]")];
  const panels = [...editor.querySelectorAll("[data-profile-edit-panel]")];
  const forms = [...editor.querySelectorAll("form")];
  forms.forEach(form => {
    form.dataset.profileSection = form.closest("[data-profile-edit-panel]")?.dataset.profileEditPanel;
  });
  const navigation = editor.querySelector("[data-profile-edit-nav]");
  const compactNavigation = window.matchMedia("(max-width: 800px)");
  const updateOrientation = () => navigation?.setAttribute("aria-orientation", compactNavigation.matches ? "horizontal" : "vertical");
  compactNavigation.addEventListener("change", updateOrientation);
  updateOrientation();
  const draftStatus = editor.querySelector("[data-profile-draft-status]");
  const markers = new Map();
  const snapshots = new Map();
  const dirtyForms = new Set();
  const pendingForms = new Set();
  let submitting = false;

  const sectionExists = name =>
    panels.some(panel => panel.dataset.profileEditPanel === name);

  function setSection(name, updateAddress = true, focusTab = true) {
    const section = sectionExists(name)
      ? name
      : editor.dataset.defaultSection || "pessoal";
    panels.forEach(panel => {
      panel.hidden = panel.dataset.profileEditPanel !== section;
      panel.tabIndex = 0;
    });
    tabs.forEach(tab => {
      const active = tab.dataset.profileEditTab === section;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle("is-active", active);
      if (active && focusTab) tab.focus({ preventScroll: true });
      if (active && compactNavigation.matches && navigation) {
        // Move only the tab strip; preserve the page's vertical position.
        const navBox = navigation.getBoundingClientRect();
        const tabBox = tab.getBoundingClientRect();
        const shift = tabBox.left < navBox.left ? tabBox.left - navBox.left - 4
          : tabBox.right > navBox.right ? tabBox.right - navBox.right + 4 : 0;
        if (shift) navigation.scrollBy({ left: shift, behavior: focusTab && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
      }
    });

    if (updateAddress) {
      const url = new URL(window.location.href);
      url.searchParams.set("secao", section);
      if (url.href !== window.location.href) window.history.pushState(window.history.state, "", url);
    }
  }

  function fingerprint(form) {
    return JSON.stringify(
      [...form.querySelectorAll("input, select, textarea")].map(control => ({
        name:
          control.name ||
          control.dataset.respostaAtuacao ||
          control.dataset.visibilidadeAtuacao ||
          control.dataset.visibilidadeCategoria ||
          control.id,
        type: control.type,
        value:
          control.type === "checkbox" || control.type === "radio"
            ? control.checked
            : control.value,
        disabled: control.disabled,
      }))
    );
  }

  function labelFor(form) {
    const section = form.dataset.profileSection;
    return (
      tabs
        .find(tab => tab.dataset.profileEditTab === section)
        ?.querySelector("[data-profile-tab-label]")?.textContent.trim() || "esta seção"
    );
  }

  function updateDraftStatus() {
    const dirtySections = new Set([...dirtyForms].map(form => labelFor(form)));
    tabs.forEach(tab => {
      const section = tab.dataset.profileEditTab;
      const hasDraft = [...dirtyForms].some(
        form => form.dataset.profileSection === section
      );
      let marker = markers.get(tab);
      if (!marker) {
        marker = document.createElement("span");
        marker.className = "profile-edit-tab__draft";
        marker.textContent = "Não salvo";
        marker.hidden = true;
        tab.append(marker);
        markers.set(tab, marker);
      }
      marker.hidden = !hasDraft;
    });

    if (!draftStatus) return;
    draftStatus.hidden = dirtySections.size === 0;
    draftStatus.textContent = dirtySections.size
      ? `Há alterações ainda não salvas em: ${[...dirtySections].join(", ")}. Trocar de seção mantém estes rascunhos nesta página; salve cada um antes de sair.`
      : "";
  }

  function checkForm(form) {
    const current = fingerprint(form);
    if (current === snapshots.get(form)) dirtyForms.delete(form);
    else dirtyForms.add(form);
    updateDraftStatus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setSection(tab.dataset.profileEditTab));
    tab.addEventListener("keydown", event => {
      const previousKey = compactNavigation.matches ? "ArrowLeft" : "ArrowUp";
      const nextKey = compactNavigation.matches ? "ArrowRight" : "ArrowDown";
      if (![previousKey, nextKey, "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === nextKey ? 1 : -1) + tabs.length) %
              tabs.length;
      tabs[nextIndex]?.click();
    });
  });

  forms.forEach(form => {
    snapshots.set(form, fingerprint(form));
    form.addEventListener("input", () => checkForm(form));
    form.addEventListener("change", () => checkForm(form));
    form.addEventListener("submit", event => {
      if (pendingForms.has(form)) { event.preventDefault(); return; }
      // Wait for the category validators before showing a saving state.
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        pendingForms.add(form);
        submitting = ![...dirtyForms].some(dirty => dirty !== form);
        const button = event.submitter || form.querySelector('button[type="submit"]');
        if (button) {
          // Keep named submitters enabled so actions such as removing a seal
          // are included in the submitted form data.
          button.setAttribute("aria-busy", "true");
          button.setAttribute("aria-disabled", "true");
          button.dataset.originalText = button.textContent.trim();
          button.textContent = "Salvando…";
        }
      });
    });
  });

  function resetSubmission() {
    pendingForms.clear();
    submitting = false;
    editor.querySelectorAll("button[data-original-text]").forEach(button => {
      button.textContent = button.dataset.originalText;
      button.removeAttribute("aria-busy");
      button.removeAttribute("aria-disabled");
      delete button.dataset.originalText;
    });
  }
  window.addEventListener("pageshow", resetSubmission);
  // Shared form helpers finish enabling/disabling conditional fields on load.
  document.addEventListener("DOMContentLoaded", () => {
    forms.forEach(form => snapshots.set(form, fingerprint(form)));
  }, { once: true });
  window.addEventListener("popstate", () => {
    setSection(new URL(window.location.href).searchParams.get("secao"), false, false);
  });
  const biography = editor.querySelector("[data-profile-bio]");
  const biographyCount = editor.querySelector("[data-profile-bio-count]");
  const updateBiographyCount = () => {
    if (biography && biographyCount) biographyCount.textContent = `${biography.value.length}/${biography.maxLength}`;
  };
  biography?.addEventListener("input", updateBiographyCount);
  updateBiographyCount();

  const otherCategoryInputs = [
    ...editor.querySelectorAll("[data-category-other]"),
  ];
  const categorySuggestionForm = editor.querySelector(
    "[data-category-other-suggestion]"
  );
  const categorySuggestionToggle = editor.querySelector(
    "[data-category-suggestion-toggle]"
  );
  let categorySuggestionManuallyOpen = false;
  const updateCategorySuggestion = () => {
    const selected = otherCategoryInputs.some(input => input.checked);
    const visible = selected || categorySuggestionManuallyOpen;
    if (categorySuggestionForm) categorySuggestionForm.hidden = !visible;
    if (categorySuggestionToggle) {
      categorySuggestionToggle.hidden = selected;
      categorySuggestionToggle.setAttribute("aria-expanded", String(visible));
      categorySuggestionToggle.textContent = categorySuggestionManuallyOpen
        ? "Fechar sugestão de categoria"
        : "Sugerir uma categoria profissional";
    }
  };
  otherCategoryInputs.forEach(input =>
    input.addEventListener("change", updateCategorySuggestion)
  );
  categorySuggestionToggle?.addEventListener("click", () => {
    categorySuggestionManuallyOpen = !categorySuggestionManuallyOpen;
    updateCategorySuggestion();
    if (categorySuggestionManuallyOpen)
      categorySuggestionForm?.querySelector('input[name="categoria"]')?.focus();
  });
  updateCategorySuggestion();

  const exceptionForm = editor.querySelector(
    "form[data-profile-exception-request]"
  );
  const exceptionReason = exceptionForm?.querySelector(
    'select[name="motivoCodigo"]'
  );
  const otherReasonField = exceptionForm?.querySelector(
    "[data-exception-other-reason-field]"
  );
  const otherReasonInput = otherReasonField?.querySelector(
    'textarea[name="motivoOutro"]'
  );
  const updateExceptionReason = () => {
    const active = exceptionReason?.value === "outro";
    if (otherReasonField) otherReasonField.hidden = !active;
    if (otherReasonInput) {
      otherReasonInput.disabled = !active;
      otherReasonInput.required = Boolean(active);
      if (!active) otherReasonInput.value = "";
    }
  };
  exceptionReason?.addEventListener("change", updateExceptionReason);
  updateExceptionReason();

  window.addEventListener("beforeunload", event => {
    if (dirtyForms.size === 0 || submitting) return;
    event.preventDefault();
    event.returnValue = "";
    // Restore buttons if the person cancels leaving with other drafts open.
    window.setTimeout(resetSubmission, 0);
  });

  const requested = new URL(window.location.href).searchParams.get("secao");
  setSection(
    sectionExists(requested)
      ? requested
      : editor.dataset.defaultSection || "pessoal",
    false,
    false
  );
})();
