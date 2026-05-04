const scanBtn = document.getElementById("scanBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

let currentMedia = [];

const setStatus = (text) => {
  statusEl.textContent = text;
};

const getActiveTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

const sendToTab = async (tabId, message) => {
  return chrome.tabs.sendMessage(tabId, message);
};

const sendToBackground = async (message) => {
  return chrome.runtime.sendMessage(message);
};

const renderResults = () => {
  resultsEl.innerHTML = "";
  currentMedia.forEach((media, index) => {
    const li = document.createElement("li");
    li.className = "item";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${index + 1}. [${media.type}] ${media.url}`;

    const btn = document.createElement("button");
    btn.textContent = "Descargar";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const res = await sendToBackground({
        type: "DOWNLOAD_ONE",
        payload: { media, index }
      });
      btn.disabled = false;
      if (!res?.ok) {
        setStatus(`Error al descargar: ${res?.error || "desconocido"}`);
        return;
      }
      setStatus(`Descarga iniciada (ID ${res.downloadId}).`);
    });

    li.append(meta, btn);
    resultsEl.appendChild(li);
  });
};

scanBtn.addEventListener("click", async () => {
  try {
    setStatus("Escaneando...");
    const tab = await getActiveTab();
    if (!tab?.id) {
      setStatus("No hay pestaña activa válida.");
      return;
    }
    const currentUrl = tab.url || "";
    if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("chrome-extension://") || currentUrl.startsWith("about:")) {
      setStatus("Esta pestaña está protegida por Chrome. Abre una página web normal (ej: onlyfans.com) y vuelve a escanear.");
      return;
    }

    const response = await sendToTab(tab.id, { type: "SCAN_MEDIA" });
    if (!response?.ok) {
      setStatus(`Error en escaneo: ${response?.error || "desconocido"}`);
      return;
    }

    currentMedia = Array.isArray(response.media) ? response.media : [];
    renderResults();
    downloadAllBtn.disabled = currentMedia.length === 0;
    if (currentMedia.length === 0) {
      setStatus("No se detectaron medios en esta página. Prueba dentro del perfil/feed con contenido cargado.");
    } else {
      setStatus(`Detectados ${currentMedia.length} medios.`);
    }
  } catch (error) {
    setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
});

downloadAllBtn.addEventListener("click", async () => {
  try {
    if (currentMedia.length === 0) return;
    setStatus(`Iniciando ${currentMedia.length} descargas...`);
    const res = await sendToBackground({
      type: "DOWNLOAD_MANY",
      payload: { list: currentMedia }
    });
    if (!res?.ok) {
      setStatus(`Error: ${res?.error || "desconocido"}`);
      return;
    }
    setStatus(`Descargas iniciadas: ${res.count}`);
  } catch (error) {
    setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
});
