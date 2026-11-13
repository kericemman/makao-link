const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const plainText = (value, maxLength) => String(value || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, maxLength);

const imageUrl = (candidate, baseUrl, fallbackImage) => {
  const value = String(candidate || "").trim();
  if (/^https:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${baseUrl}${value}`;
  return fallbackImage;
};

const replaceMeta = (html, attribute, name, content) => {
  const escapedName = escapeRegExp(name);
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapedName}["'])[^>]*>`, "gi");
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n  </head>`);
};

const buildSocialPreviewHtml = ({ html, title, description, url, image, type = "website" }) => {
  const safeTitle = plainText(title, 180) || "RendaHomes | Find Verified Homes in Kenya";
  const safeDescription = plainText(description, 300)
    || "Find verified homes, rentals, and properties for sale across Kenya on RendaHomes.";
  let output = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(safeTitle)}</title>`);

  output = output.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, "");
  output = output.replace(/<\/head>/i, `  <link rel="canonical" href="${escapeHtml(url)}" />\n  </head>`);
  output = replaceMeta(output, "name", "description", safeDescription);
  output = replaceMeta(output, "property", "og:type", type);
  output = replaceMeta(output, "property", "og:site_name", "RendaHomes");
  output = replaceMeta(output, "property", "og:title", safeTitle);
  output = replaceMeta(output, "property", "og:description", safeDescription);
  output = replaceMeta(output, "property", "og:url", url);
  output = replaceMeta(output, "property", "og:image", image);
  output = replaceMeta(output, "name", "twitter:card", "summary_large_image");
  output = replaceMeta(output, "name", "twitter:title", safeTitle);
  output = replaceMeta(output, "name", "twitter:description", safeDescription);
  output = replaceMeta(output, "name", "twitter:image", image);
  return output;
};

module.exports = { buildSocialPreviewHtml, imageUrl, plainText };
