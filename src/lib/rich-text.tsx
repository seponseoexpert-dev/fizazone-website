/**
 * Tiny HTML sanitiser + renderer for admin-authored rich text.
 * Works on both server (SSR) and client — pure string processing.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "span",
  "div",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
};

const STYLE_TAGS = new Set([
  "p",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  "blockquote",
  "td",
  "th",
  "table",
]);

/** Only whitelisted, value-checked CSS declarations survive. */
function cleanStyle(raw: string) {
  const decls = raw
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(":");
      if (idx < 0) return null;
      const prop = d.slice(0, idx).trim().toLowerCase();
      const val = d.slice(idx + 1).trim().toLowerCase();
      if (prop === "text-align" && /^(left|center|right|justify)$/.test(val)) return `${prop}:${val}`;
      if (prop === "font-size" && /^\d{1,2}(\.\d+)?(px|pt|rem|em)$/.test(val)) return `${prop}:${val}`;
      return null;
    })
    .filter(Boolean);
  return decls.length ? ` style="${decls.join(";")}"` : "";
}

function cleanAttrs(tag: string, raw: string) {
  const allowed = ALLOWED_ATTRS[tag] ?? [];
  let out = "";
  const re = /([a-zA-Z:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = (m[1] ?? "").toLowerCase();
    const value = (m[2] ?? "").replace(/^['"]|['"]$/g, "");
    if (name === "style" && STYLE_TAGS.has(tag)) {
      out += cleanStyle(value);
      continue;
    }
    if (!allowed.includes(name)) continue;
    if (name === "href" && /^\s*(javascript|data|vbscript):/i.test(value)) continue;
    out += ` ${name}="${value.replace(/"/g, "&quot;")}"`;
  }
  if (tag === "a" && /href=/.test(out) && !/rel=/.test(out)) out += ' rel="noopener noreferrer"';
  return out;
}


export function sanitizeHtml(input?: string | null): string {
  if (!input) return "";
  let html = String(input)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");

  html = html.replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g, (_full, slash: string, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (slash) return `</${name}>`;
    if (name === "br") return "<br />";
    return `<${name}${cleanAttrs(name, attrs)}>`;
  });

  return html.trim();
}

/** True when the value has real text content (not just empty markup). */
export function hasRichText(value?: string | null) {
  if (!value) return false;
  return sanitizeHtml(value).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

/** Plain-text version, handy for meta descriptions and previews. */
export function richTextToPlain(value?: string | null) {
  return sanitizeHtml(value)
    .replace(/<\/(p|div|li|h2|h3|h4|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Escapes plain text authored before the rich editor existed. */
function plainToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p>${block
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export function normalizeRichText(value?: string | null) {
  if (!value) return "";
  return /<[a-z][\s\S]*>/i.test(value) ? sanitizeHtml(value) : plainToHtml(value);
}

export function RichText({
  value,
  className = "",
  fallback,
}: {
  value?: string | null;
  className?: string;
  fallback?: string;
}) {
  const html = hasRichText(value) ? normalizeRichText(value) : normalizeRichText(fallback ?? "");
  if (!html) return null;
  return (
    <div
      className={`rich-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
