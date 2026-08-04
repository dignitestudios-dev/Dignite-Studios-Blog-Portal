/**
 * `contentHtml` -> Editor.js blocks.
 *
 * Two jobs:
 *   1. Opening a post that was written in the previous editor. Those posts have
 *      a `content` JSON in a foreign shape, so the HTML is the only reliable
 *      source of truth and we rebuild blocks from it.
 *   2. Applying edits made in the HTML code view.
 *
 * Because input #2 is hand-written, inline markup is passed through a strict
 * allow-list rather than trusted. Anything outside the list is unwrapped to its
 * text so no content is silently dropped.
 *
 * Browser-only: uses `DOMParser`.
 */
import type { OutputBlockData } from "@editorjs/editorjs";
import { isCtaElement, parseCtaElement } from "./cta";
import type { Alignment } from "./AlignmentTune";
import { IMAGE_WIDTHS } from "./ImageWidthTune";

/** Inline tags that survive import, mapped to the attributes they may keep. */
const INLINE_ALLOW_LIST: Record<string, string[]> = {
  A: ["href", "target", "rel", "title"],
  B: [],
  STRONG: [],
  I: [],
  EM: [],
  U: [],
  S: [],
  STRIKE: [],
  DEL: [],
  MARK: ["class"],
  CODE: ["class"],
  BR: [],
  SUP: [],
  SUB: [],
};

const BLOCK_LEVEL = new Set([
  "P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "PRE",
  "HR", "TABLE", "FIGURE", "IMG", "IFRAME", "DIV", "SECTION", "ARTICLE",
  "HEADER", "FOOTER", "MAIN", "ASIDE", "DL",
]);

function isBlank(html: string): boolean {
  return html.replace(/<br\s*\/?>/gi, "").replace(/&nbsp;|\s/gi, "") === "";
}

/** Reads `text-align` off an element's inline style. */
function readAlign(el: Element): Alignment {
  const value = (el as HTMLElement).style?.textAlign?.toLowerCase();
  return value === "center" || value === "right" ? value : "left";
}

/** Reads a percentage width off an element's inline style, snapped to the
 *  supported steps. Returns 100 when absent or unrecognised. */
function readWidth(el: Element | null): number {
  if (!el) return 100;
  const match = (el as HTMLElement).style?.width?.match(/^(\d+(?:\.\d+)?)%$/);
  if (!match) return 100;
  const value = Number(match[1]);
  // Snap to the nearest supported step so hand-written HTML still round-trips.
  return IMAGE_WIDTHS.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best
  );
}

/** Attaches tune data only when it differs from the default, so untouched
 *  blocks keep a clean shape and the round trip stays byte-stable. */
function withTunes(
  block: OutputBlockData,
  alignment: Alignment,
  width?: number
): OutputBlockData {
  const tunes: Record<string, object> = {};
  if (alignment !== "left") tunes.alignment = { alignment };
  if (width !== undefined && width !== 100) tunes.imageWidth = { width };
  return Object.keys(tunes).length > 0 ? { ...block, tunes } : block;
}

/**
 * Rebuilds a node's inner HTML keeping only allow-listed inline tags.
 * Disallowed elements are unwrapped (children kept), never deleted.
 */
function sanitizeInline(node: Node): string {
  let out = "";

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += (child.textContent ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const el = child as Element;
    const allowedAttrs = INLINE_ALLOW_LIST[el.tagName];

    if (allowedAttrs === undefined) {
      // Not allowed inline — unwrap it but keep what is inside.
      out += sanitizeInline(el);
      return;
    }

    if (el.tagName === "BR") {
      out += "<br>";
      return;
    }

    const attrs = allowedAttrs
      .map((name) => {
        const value = el.getAttribute(name);
        if (!value) return "";
        return ` ${name}="${value.replace(/"/g, "&quot;")}"`;
      })
      .join("");

    const tag = el.tagName.toLowerCase();
    out += `<${tag}${attrs}>${sanitizeInline(el)}</${tag}>`;
  });

  return out;
}

function parseListItems(list: Element): OutputBlockData["data"] {
  const items: { content: string; meta: Record<string, unknown>; items: unknown[] }[] = [];

  Array.from(list.children).forEach((li) => {
    if (li.tagName !== "LI") return;

    const nestedList = li.querySelector(":scope > ul, :scope > ol");

    // Clone so removing the nested list does not mutate the parsed document.
    const clone = li.cloneNode(true) as Element;
    clone.querySelectorAll(":scope > ul, :scope > ol").forEach((n) => n.remove());

    let content = sanitizeInline(clone).trim();
    let checked: boolean | undefined;

    // Checklists are serialized with a leading ☑ / ☐ glyph.
    const checkMatch = content.match(/^(&#9745;|&#9744;|☑|☐)\s*/);
    if (checkMatch) {
      checked = checkMatch[1] === "☑" || checkMatch[1] === "&#9745;";
      content = content.slice(checkMatch[0].length).trim();
    }

    items.push({
      content,
      meta: checked === undefined ? {} : { checked },
      items: nestedList ? (parseListItems(nestedList) as { items: unknown[] }).items : [],
    });
  });

  const hasChecklist = items.some((i) => "checked" in i.meta);
  const style = hasChecklist
    ? "checklist"
    : list.tagName === "OL"
      ? "ordered"
      : "unordered";

  return { style, meta: {}, items };
}

function parseTable(table: Element): OutputBlockData | null {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length === 0) return null;

  const content = rows.map((row) =>
    Array.from(row.querySelectorAll("th, td")).map((cell) => sanitizeInline(cell).trim())
  );

  const withHeadings =
    !!table.querySelector("thead th") || rows[0].querySelector("th") !== null;

  return { type: "table", data: { withHeadings, content } };
}

function parseFigure(figure: Element): OutputBlockData | null {
  const caption = figure.querySelector("figcaption");
  const captionHtml = caption ? sanitizeInline(caption).trim() : "";

  const img = figure.querySelector("img");
  if (img) {
    return withTunes(
      {
        type: "image",
        data: {
          file: { url: img.getAttribute("src") ?? "" },
          caption: captionHtml,
          withBorder: false,
          withBackground: false,
          stretched: false,
        },
      },
      readAlign(figure),
      readWidth(img)
    );
  }

  const iframe = figure.querySelector("iframe");
  if (iframe) {
    return {
      type: "embed",
      data: {
        service: "custom",
        source: iframe.getAttribute("src") ?? "",
        embed: iframe.getAttribute("src") ?? "",
        caption: captionHtml,
      },
    };
  }

  return null;
}

function parseElement(el: Element, out: OutputBlockData[]): void {
  const tag = el.tagName;

  if (isCtaElement(el)) {
    out.push({ type: "cta", data: { ...parseCtaElement(el) } });
    return;
  }

  switch (tag) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6": {
      const text = sanitizeInline(el).trim();
      if (!isBlank(text)) {
        out.push(
          withTunes(
            { type: "header", data: { text, level: Number(tag[1]) } },
            readAlign(el)
          )
        );
      }
      return;
    }

    case "P": {
      // A paragraph wrapping only an image should become an image block.
      const onlyImg =
        el.children.length === 1 &&
        el.children[0].tagName === "IMG" &&
        isBlank(el.textContent ?? "");
      if (onlyImg) {
        parseElement(el.children[0], out);
        return;
      }
      const text = sanitizeInline(el).trim();
      if (!isBlank(text)) {
        out.push(withTunes({ type: "paragraph", data: { text } }, readAlign(el)));
      }
      return;
    }

    case "UL":
    case "OL":
      out.push(withTunes({ type: "list", data: parseListItems(el) }, readAlign(el)));
      return;

    case "BLOCKQUOTE": {
      const clone = el.cloneNode(true) as Element;
      const cite = clone.querySelector("cite");
      const caption = cite ? sanitizeInline(cite).replace(/^—\s*/, "").trim() : "";
      cite?.remove();
      const text = sanitizeInline(clone).trim();
      if (!isBlank(text) || caption) {
        out.push(
          withTunes(
            { type: "quote", data: { text, caption, alignment: "left" } },
            readAlign(el)
          )
        );
      }
      return;
    }

    case "PRE": {
      const code = el.textContent ?? "";
      if (code.trim()) out.push({ type: "code", data: { code } });
      return;
    }

    case "HR":
      out.push({ type: "delimiter", data: {} });
      return;

    case "TABLE": {
      const block = parseTable(el);
      if (block) out.push(block);
      return;
    }

    case "FIGURE": {
      const block = parseFigure(el);
      if (block) out.push(block);
      return;
    }

    case "IMG": {
      const src = el.getAttribute("src");
      if (!src) return;
      out.push(
        withTunes(
          {
            type: "image",
            data: {
              file: { url: src },
              caption: el.getAttribute("alt") ?? "",
              withBorder: false,
              withBackground: false,
              stretched: false,
            },
          },
          "left",
          readWidth(el)
        )
      );
      return;
    }

    case "IFRAME": {
      const src = el.getAttribute("src");
      if (!src) return;
      out.push({
        type: "embed",
        data: { service: "custom", source: src, embed: src, caption: "" },
      });
      return;
    }

    default: {
      // Structural wrapper (div/section/...): walk into it. If it holds no
      // block-level children, treat its contents as one paragraph so text
      // inside stray wrappers is not lost.
      const hasBlockChild = Array.from(el.children).some((c) =>
        BLOCK_LEVEL.has(c.tagName)
      );

      if (hasBlockChild) {
        Array.from(el.children).forEach((child) => parseElement(child, out));
        return;
      }

      const text = sanitizeInline(el).trim();
      if (!isBlank(text)) out.push({ type: "paragraph", data: { text } });
    }
  }
}

/**
 * Converts stored/hand-written HTML into Editor.js blocks.
 * Returns a single empty paragraph when there is nothing to import, since
 * Editor.js expects at least one block.
 */
export function htmlToBlocks(html: string): OutputBlockData[] {
  if (typeof window === "undefined" || !html || !html.trim()) {
    return [{ type: "paragraph", data: { text: "" } }];
  }

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const blocks: OutputBlockData[] = [];

  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      parseElement(node as Element, blocks);
      return;
    }
    // Bare text directly under body — wrap it in a paragraph.
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim()) {
      blocks.push({ type: "paragraph", data: { text: (node.textContent ?? "").trim() } });
    }
  });

  return blocks.length > 0 ? blocks : [{ type: "paragraph", data: { text: "" } }];
}
