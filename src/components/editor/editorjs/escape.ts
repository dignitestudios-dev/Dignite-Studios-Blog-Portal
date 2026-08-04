/**
 * HTML escaping helpers shared by the block serializer and the CTA template.
 *
 * `escapeHtml` is for text nodes, `escapeAttr` additionally escapes the double
 * quote so the result is safe inside a `attr="..."` pair.
 */

export function escapeHtml(value = ""): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value = ""): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
