const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function getVideoEmbedUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  let url;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") {
    const id = parts[0];
    return YOUTUBE_ID.test(id || "") ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
    const id = parts[0] === "watch" ? url.searchParams.get("v") || ""
      : ["embed", "shorts"].includes(parts[0]) ? parts[1] || "" : "";
    return YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = host === "player.vimeo.com" && parts[0] === "video" ? parts[1] : parts[0];
    return VIMEO_ID.test(id || "") ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

export function isSafeVideoEmbedUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    if (host === "www.youtube-nocookie.com") return /^\/embed\/[\w-]{11}\/?$/.test(url.pathname);
    if (host === "player.vimeo.com") return /^\/video\/\d{6,12}\/?$/.test(url.pathname);
  } catch { return false; }
  return false;
}
