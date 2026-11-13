import { getVideoEmbedUrl } from "./videoEmbed";

const allowedTags = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "iframe",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "ul"
]);

const allowedAttrs = new Set(["alt", "class", "data-video-embed", "href", "id", "rel", "src", "style", "target", "title"]);
const urlAttrs = new Set(["href", "src"]);
const alignedTags = new Set(["h1", "h2", "h3", "p"]);

const isSafeUrl = (value = "") => {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  );
};

export default function sanitizeHtml(html = "") {
  if (typeof window === "undefined" || !html) return "";

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("*").forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (!allowedTags.has(tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    if (tagName === "iframe") {
      const safeSrc = getVideoEmbedUrl(element.getAttribute("src"));
      if (!safeSrc) {
        element.remove();
        return;
      }
      const title = element.getAttribute("title")?.slice(0, 160) || "Embedded property video";
      [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
      element.setAttribute("src", safeSrc);
      element.setAttribute("title", title);
      element.setAttribute("loading", "lazy");
      element.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      element.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      element.setAttribute("allowfullscreen", "");
      return;
    }

    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value || "";

      if (name === "style") {
        const match = alignedTags.has(tagName) && value.match(/^\s*text-align\s*:\s*(left|center|right|justify)\s*;?\s*$/i);
        if (match) element.setAttribute("style", `text-align: ${match[1].toLowerCase()};`);
        else element.removeAttribute(attribute.name);
        return;
      }

      if (name.startsWith("on") || !allowedAttrs.has(name) || (urlAttrs.has(name) && !isSafeUrl(value))) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === "a") {
      element.setAttribute("rel", "noopener noreferrer");
    }
  });

  return template.innerHTML;
}
