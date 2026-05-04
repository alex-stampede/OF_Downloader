const sanitizeFilename = (value) =>
  String(value || "download")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

const getExtension = (url, fallback = "bin") => {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    return match ? match[1].toLowerCase() : fallback;
  } catch {
    return fallback;
  }
};

const buildFilename = (media, index = 0) => {
  const kind = media.type === "video" ? "video" : "image";
  const ext = getExtension(media.url, kind === "video" ? "mp4" : "jpg");
  const base = sanitizeFilename(media.title || media.alt || `${kind}_${index + 1}`);
  return `of-downloader/${base}.${ext}`;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === "DOWNLOAD_ONE") {
      const { media, index } = message.payload || {};
      if (!media?.url) {
        sendResponse({ ok: false, error: "Missing media URL." });
        return;
      }
      const downloadId = await chrome.downloads.download({
        url: media.url,
        filename: buildFilename(media, index),
        saveAs: false
      });
      sendResponse({ ok: true, downloadId });
      return;
    }

    if (message?.type === "DOWNLOAD_MANY") {
      const list = Array.isArray(message.payload?.list) ? message.payload.list : [];
      const ids = [];
      for (let i = 0; i < list.length; i += 1) {
        const media = list[i];
        if (!media?.url) continue;
        const id = await chrome.downloads.download({
          url: media.url,
          filename: buildFilename(media, i),
          saveAs: false
        });
        ids.push(id);
      }
      sendResponse({ ok: true, count: ids.length, ids });
      return;
    }

    if (message?.type === "PING") {
      sendResponse({ ok: true, pong: true });
      return;
    }

    sendResponse({ ok: false, error: "Unknown message type." });
  })().catch((error) => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
  });

  return true;
});
