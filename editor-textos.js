const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocal = localHosts.has(window.location.hostname);
const toolbar = document.querySelector(".local-text-editor");
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
let savedTexts = [];

try {
  const response = await fetch("/textos.json", { cache: "no-store" });
  if (response.ok) {
    savedTexts = await response.json();
    if (Array.isArray(savedTexts)) {
      editableElements.forEach((element, index) => {
        if (typeof savedTexts[index] === "string") {
          element.innerText = savedTexts[index];
        }
      });
    }
  }
} catch {
  // Keep the original HTML text when no saved text file is available.
}

if (isLocal) {
  const toggleButton = toolbar.querySelector("[data-editor-toggle]");
  const resetButton = toolbar.querySelector("[data-editor-reset]");
  const status = toolbar.querySelector("[data-editor-status]");
  let isEditing = false;
  let saveTimer;

  toolbar.hidden = false;

  if (Array.isArray(savedTexts) && savedTexts.length === 0) {
    try {
      const previousTexts = JSON.parse(localStorage.getItem("gruas-martin-bros-textos-v1"));
      if (
        Array.isArray(previousTexts) &&
        previousTexts.length === editableElements.length &&
        previousTexts.every((text) => typeof text === "string")
      ) {
        editableElements.forEach((element, index) => {
          element.innerText = previousTexts[index];
        });
        const response = await fetch("/__save-textos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previousTexts),
        });
        if (response.ok) {
          localStorage.removeItem("gruas-martin-bros-textos-v1");
          status.textContent = "Tus cambios anteriores se guardaron en public/textos.json.";
        }
      }
    } catch {
      status.textContent = "No se pudieron migrar los cambios guardados anteriormente.";
    }
  }

  toggleButton.addEventListener("click", () => {
    isEditing = !isEditing;
    editableElements.forEach((element) => {
      element.contentEditable = isEditing ? "plaintext-only" : "false";
    });
    document.body.classList.toggle("local-editing", isEditing);
    toggleButton.textContent = isEditing ? "Terminar edición" : "Editar textos";
    resetButton.hidden = !isEditing;
    status.textContent = isEditing ? "Los cambios se guardan en public/textos.json." : "";
  });

  resetButton.addEventListener("click", async () => {
    if (!window.confirm("¿Restaurar los textos originales? Se borrarán los cambios de public/textos.json.")) {
      return;
    }

    window.clearTimeout(saveTimer);
    try {
      const response = await fetch("/__save-textos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "[]",
      });
      if (!response.ok) {
        throw new Error("Save failed");
      }
      window.location.reload();
    } catch {
      status.textContent = "No se pudieron restaurar los textos.";
    }
  });

  document.addEventListener("input", (event) => {
    if (!isEditing || !editableElements.includes(event.target)) {
      return;
    }

    window.clearTimeout(saveTimer);
    status.textContent = "Guardando en el proyecto...";
    saveTimer = window.setTimeout(async () => {
      try {
        const response = await fetch("/__save-textos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editableElements.map((element) => element.innerText)),
        });
        if (!response.ok) {
          throw new Error("Save failed");
        }
        status.textContent = "Guardado en public/textos.json.";
      } catch {
        status.textContent = "No se pudo guardar. Comprueba que Vite siga ejecutándose.";
      }
    }, 300);
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