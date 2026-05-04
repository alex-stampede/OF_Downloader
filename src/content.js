const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url, window.location.href);
    parsed.hash = "";
    return parsed.href;
  } catch {
    return "";
  }
};

const THUMB_PATTERNS = [
  "thumb",
  "thumbnail",
  "avatar",
  "profile",
  "icon",
  "sprite",
  "preview"
];

const isThumbUrl = (url) => {
  const lower = String(url || "").toLowerCase();
  return THUMB_PATTERNS.some((p) => lower.includes(p));
};

const pickBestImageCandidate = (img) => {
  const candidates = [];

  const pushCandidate = (rawUrl, widthHint = 0) => {
    const url = normalizeUrl(rawUrl);
    if (!url) return;
    candidates.push({ url, widthHint });
  };

  if (img.srcset) {
    const parts = img.srcset.split(",");
    for (const part of parts) {
      const [raw, size] = part.trim().split(/\s+/);
      const width = size?.endsWith("w") ? Number.parseInt(size.replace("w", ""), 10) : 0;
      pushCandidate(raw, Number.isFinite(width) ? width : 0);
    }
  }

  pushCandidate(img.currentSrc, img.naturalWidth || 0);
  pushCandidate(img.src, img.naturalWidth || 0);
  pushCandidate(img.dataset?.src, img.naturalWidth || 0);
  pushCandidate(img.dataset?.original, img.naturalWidth || 0);

  candidates.sort((a, b) => b.widthHint - a.widthHint);
  return candidates[0]?.url || "";
};

const collectImages = () => {
  const images = Array.from(document.querySelectorAll("img"));
  return images
    .map((img) => {
      const bestUrl = pickBestImageCandidate(img);
      return {
        type: "image",
        url: bestUrl,
        title: img.title || "",
        alt: img.alt || "",
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0
      };
    })
    .filter((item) => item.url)
    .filter((item) => !isThumbUrl(item.url))
    .filter((item) => (item.width || 0) >= 480 && (item.height || 0) >= 480);
};

const collectVideos = () => {
  const urls = new Set();

  const videos = Array.from(document.querySelectorAll("video"));
  for (const video of videos) {
    const direct = normalizeUrl(video.currentSrc || video.src || "");
    if (direct) urls.add(direct);

    const sources = Array.from(video.querySelectorAll("source"));
    for (const source of sources) {
      const src = normalizeUrl(source.src || source.getAttribute("src") || "");
      if (src) urls.add(src);
    }
  }

  const links = Array.from(document.querySelectorAll('a[href*=".mp4"],a[href*=".m3u8"],a[href*=".webm"]'));
  for (const link of links) {
    const src = normalizeUrl(link.href || "");
    if (src) urls.add(src);
  }

  return Array.from(urls)
    .filter((url) => !isThumbUrl(url))
    .map((url) => ({
      type: "video",
      url,
      title: "",
      alt: "",
      width: 0,
      height: 0
    }));
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
