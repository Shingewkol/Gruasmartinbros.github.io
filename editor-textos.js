const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (localHosts.has(window.location.hostname)) {
  const toolbar = document.querySelector(".local-text-editor");
  const toggleButton = toolbar.querySelector("[data-editor-toggle]");
  const resetButton = toolbar.querySelector("[data-editor-reset]");
  const status = toolbar.querySelector("[data-editor-status]");
  const storageKey = "gruas-martin-bros-textos-v1";
  const editableSelector = [
    "header .brand > span",
    "header .nav-links a",
    "header .btn",
    "main h1, main h2, main h3, main p, main li, main blockquote, main cite",
    "main .eyebrow, main .google-reviews-score, main .google-reviews-count",
    "main .google-review-source, main .feature-item strong, main .feature-item span",
    "main .btn:not(.btn-call), main .btn-call span",
    "footer .container",
  ].join(", ");
  const editableElements = [...document.querySelectorAll(editableSelector)];
  let isEditing = false;

  try {
    const savedTexts = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(savedTexts)) {
      editableElements.forEach((element, index) => {
        if (typeof savedTexts[index] === "string") {
          element.innerText = savedTexts[index];
        }
      });
    }
  } catch {
    status.textContent = "No se pudieron cargar los textos guardados.";
  }

  toolbar.hidden = false;

  toggleButton.addEventListener("click", () => {
    isEditing = !isEditing;
    editableElements.forEach((element) => {
      element.contentEditable = isEditing ? "plaintext-only" : "false";
    });
    document.body.classList.toggle("local-editing", isEditing);
    toggleButton.textContent = isEditing ? "Terminar edición" : "Editar textos";
    resetButton.hidden = !isEditing;
    status.textContent = isEditing ? "Los cambios se guardan en este navegador." : "";
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("¿Restaurar los textos originales? Se borrarán los cambios guardados en este navegador.")) {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
      window.location.reload();
    } catch {
      status.textContent = "No se pudieron borrar los textos guardados.";
    }
  });

  document.addEventListener("input", (event) => {
    if (!isEditing || !editableElements.includes(event.target)) {
      return;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(editableElements.map((element) => element.innerText)),
      );
      status.textContent = "Cambios guardados en este navegador.";
    } catch {
      status.textContent = "No se pudieron guardar los cambios.";
    }
  });

  document.addEventListener("click", (event) => {
    if (!isEditing || !(event.target instanceof Element)) {
      return;
    }

    const editableLink = event.target.closest('a[contenteditable="plaintext-only"]');
    if (editableLink) {
      event.preventDefault();
    }
  });
}