const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.href;
  } catch {
    return "";
  }
};

const collectImages = () => {
  const images = Array.from(document.querySelectorAll("img"));
  return images
    .map((img) => {
      const src = img.currentSrc || img.src || "";
      return {
        type: "image",
        url: normalizeUrl(src),
        title: img.title || "",
        alt: img.alt || "",
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0
      };
    })
    .filter((item) => item.url);
};

const collectVideos = () => {
  const videos = Array.from(document.querySelectorAll("video"));
  return videos
    .map((video) => {
      const src = video.currentSrc || video.src || video.querySelector("source")?.src || "";
      return {
        type: "video",
        url: normalizeUrl(src),
        title: video.title || "",
        alt: "",
        width: video.videoWidth || 0,
        height: video.videoHeight || 0
      };
    })
    .filter((item) => item.url);
};

const dedupeByUrl = (list) => {
  const seen = new Set();
  return list.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SCAN_MEDIA") return;
  const media = dedupeByUrl([...collectImages(), ...collectVideos()]);
  sendResponse({ ok: true, media, pageTitle: document.title, pageUrl: location.href });
  return true;
});
