/**
 * Editor.js blocks -> `contentHtml`.
 *
 * The output is plain semantic HTML (`<h2>`, `<p>`, `<ul>`, `<table>`, ...)
 * because that is what the public site styles via `.blog-content` and what its
 * table-of-contents extractor scans for. Anything the site has no CSS for
 * (checklists, image captions, code blocks) carries inline styles so it renders
 * correctly without touching the website repo.
 */
import type { OutputBlockData, OutputData } from "@editorjs/editorjs";
import { buildCtaHtml, type CtaData } from "./cta";
import { escapeAttr, escapeHtml } from "./escape";
import { readAlignment, type Alignment } from "./AlignmentTune";
import { readImageWidth } from "./ImageWidthTune";

/** Inline HTML produced by Editor.js is already sanitized — pass it through. */
type Inline = string;

interface ListItemData {
  content?: string;
  meta?: { checked?: boolean; start?: number };
  items?: ListItemData[];
}

interface ListBlockData {
  style?: "ordered" | "unordered" | "checklist";
  items?: (ListItemData | string)[];
  meta?: { start?: number };
}

const CHECKLIST_STYLES = {
  // Not flex: a nested <ul> must be able to sit as a block-level child of <li>
  // so the importer can find it with `:scope > ul`.
  list: (depth: number) =>
    `list-style:none;padding-left:${depth === 0 ? 0 : "1.5rem"};margin:${depth === 0 ? "1rem 0" : "0.4rem 0 0"}`,
  item: "margin-bottom:0.4rem",
  box: "margin-right:6px",
} as const;

/** `style="..."` fragment for a non-default alignment, or "" for left. */
function alignAttr(alignment: Alignment): string {
  return alignment === "left" ? "" : ` style="text-align:${alignment}"`;
}

function isBlank(html?: Inline): boolean {
  if (!html) return true;
  return html.replace(/<br\s*\/?>/gi, "").replace(/&nbsp;/gi, " ").trim() === "";
}

function normalizeListItem(item: ListItemData | string): ListItemData {
  // v1 of the list tool stored plain strings; v2 stores objects.
  return typeof item === "string" ? { content: item, items: [] } : item;
}

function renderList(
  data: ListBlockData,
  depth = 0,
  alignment: Alignment = "left"
): string {
  const style = data.style ?? "unordered";
  const items = (data.items ?? []).map(normalizeListItem);
  if (items.length === 0) return "";

  // Alignment belongs on the outermost list only.
  const alignCss =
    depth === 0 && alignment !== "left" ? `text-align:${alignment}` : "";

  if (style === "checklist") {
    const rows = items
      .map((item) => {
        const box = item.meta?.checked ? "&#9745;" : "&#9744;";
        // The nested list is a direct child of <li> so the importer's
        // `:scope > ul` lookup finds it.
        const nested = item.items?.length
          ? renderList({ style, items: item.items }, depth + 1)
          : "";
        return (
          `<li style="${CHECKLIST_STYLES.item}">` +
          `<span style="${CHECKLIST_STYLES.box}">${box}</span>` +
          `<span>${item.content ?? ""}</span>` +
          nested +
          `</li>`
        );
      })
      .join("");
    const listStyle = [CHECKLIST_STYLES.list(depth), alignCss]
      .filter(Boolean)
      .join(";");
    return `<ul style="${listStyle}">${rows}</ul>`;
  }

  const tag = style === "ordered" ? "ol" : "ul";
  const start = data.meta?.start;
  const startAttr = tag === "ol" && start && start !== 1 ? ` start="${start}"` : "";
  const styleAttr = alignCss ? ` style="${alignCss}"` : "";

  const rows = items
    .map((item) => {
      const nested = item.items?.length
        ? renderList({ style, items: item.items }, depth + 1)
        : "";
      return `<li>${item.content ?? ""}${nested}</li>`;
    })
    .join("");

  return `<${tag}${startAttr}${styleAttr}>${rows}</${tag}>`;
}

function renderTable(data: {
  withHeadings?: boolean;
  content?: string[][];
}): string {
  const rows = data.content ?? [];
  if (rows.length === 0) return "";

  const cell = (value: string, header: boolean) => {
    const tag = header ? "th" : "td";
    return `<${tag}>${value ?? ""}</${tag}>`;
  };

  let head = "";
  let bodyRows = rows;

  if (data.withHeadings && rows.length > 0) {
    head = `<thead><tr>${rows[0].map((c) => cell(c, true)).join("")}</tr></thead>`;
    bodyRows = rows.slice(1);
  }

  const body = bodyRows.length
    ? `<tbody>${bodyRows
        .map((row) => `<tr>${row.map((c) => cell(c, false)).join("")}</tr>`)
        .join("")}</tbody>`
    : "";

  return `<table>${head}${body}</table>`;
}

function renderImage(
  data: {
    file?: { url?: string };
    url?: string;
    caption?: string;
    withBorder?: boolean;
    withBackground?: boolean;
    stretched?: boolean;
  },
  alignment: Alignment = "left",
  width = 100
): string {
  const src = data.file?.url ?? data.url ?? "";
  if (!src) return "";

  const alt = data.caption ? data.caption.replace(/<[^>]*>/g, "").trim() : "";
  const styles = ["max-width:100%", "height:auto"];
  if (data.withBorder) styles.push("border:1px solid #e5e7eb");
  if (data.withBackground) styles.push("background:#f3f4f6;padding:12px");
  // A percentage width beats the legacy `stretched` tune when both are set.
  if (width !== 100) styles.push(`width:${width}%`);
  else if (data.stretched) styles.push("width:100%");

  // Both sites run Tailwind, whose preflight sets `img { display: block }`.
  // `text-align` on the figure therefore moves only the caption, never the
  // image — a block element is positioned with margins instead. Vertical
  // margins are left alone so the site's own `img { margin: 1.5rem 0 }` still
  // controls spacing.
  if (alignment === "center") {
    styles.push("margin-left:auto", "margin-right:auto");
  } else if (alignment === "right") {
    styles.push("margin-left:auto", "margin-right:0");
  }

  const img = `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy" style="${styles.join(";")}">`;

  const hasCaption = !!data.caption && !isBlank(data.caption);

  // Keep plain images bare so existing content serializes unchanged.
  if (!hasCaption && alignment === "left" && width === 100) return img;

  const figureStyle = ["margin:1.5rem 0"];
  if (alignment !== "left") figureStyle.push(`text-align:${alignment}`);

  const caption = hasCaption
    ? `<figcaption style="font-size:0.875rem;color:#6b7280;text-align:center;margin-top:0.5rem">${data.caption}</figcaption>`
    : "";

  return `<figure style="${figureStyle.join(";")}">${img}${caption}</figure>`;
}

function renderQuote(
  data: { text?: string; caption?: string },
  alignment: Alignment = "left"
): string {
  if (isBlank(data.text) && isBlank(data.caption)) return "";
  const cite =
    data.caption && !isBlank(data.caption)
      ? `<cite style="display:block;margin-top:0.5rem;font-size:0.875rem;font-style:normal;color:#6b7280">— ${data.caption}</cite>`
      : "";
  return `<blockquote${alignAttr(alignment)}>${data.text ?? ""}${cite}</blockquote>`;
}

function renderCode(data: { code?: string }): string {
  if (!data.code) return "";
  return `<pre><code>${escapeHtml(data.code)}</code></pre>`;
}

function renderEmbed(data: {
  embed?: string;
  source?: string;
  caption?: string;
  width?: number;
  height?: number;
}): string {
  const src = data.embed ?? data.source;
  if (!src) return "";

  const frame =
    `<div style="position:relative;width:100%;padding-bottom:56.25%;margin:1.5rem 0">` +
    `<iframe src="${escapeAttr(src)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px" allowfullscreen loading="lazy"></iframe>` +
    `</div>`;

  if (!data.caption || isBlank(data.caption)) return frame;
  return (
    `<figure style="margin:1.5rem 0">${frame}` +
    `<figcaption style="font-size:0.875rem;color:#6b7280;text-align:center">${data.caption}</figcaption>` +
    `</figure>`
  );
}

function renderBlock(block: OutputBlockData): string {
  const data = (block.data ?? {}) as Record<string, unknown>;
  const alignment = readAlignment(block.tunes?.alignment);
  const align = alignAttr(alignment);

  switch (block.type) {
    case "paragraph": {
      const text = data.text as Inline;
      // Drop empty paragraphs — they are the main source of stray gaps on the
      // public page, and Editor.js keeps one around whenever a block is split.
      if (isBlank(text)) return "";
      return `<p${align}>${text}</p>`;
    }

    case "header": {
      const text = data.text as Inline;
      if (isBlank(text)) return "";
      const raw = Number(data.level ?? 2);
      const level = Number.isFinite(raw) ? Math.min(6, Math.max(1, raw)) : 2;
      return `<h${level}${align}>${text}</h${level}>`;
    }

    case "list":
    case "nestedList":
      return renderList(data as ListBlockData, 0, alignment);

    case "checklist":
      // Older posts stored checklists under their own block type.
      return renderList({
        style: "checklist",
        items: (data.items as { text?: string; checked?: boolean }[] | undefined)?.map(
          (i) => ({ content: i.text, meta: { checked: i.checked } })
        ),
      });

    case "quote":
      return renderQuote(data as { text?: string; caption?: string }, alignment);

    case "code":
      return renderCode(data as { code?: string });

    case "delimiter":
      return "<hr>";

    case "table":
      return renderTable(data as { withHeadings?: boolean; content?: string[][] });

    case "image":
      return renderImage(
        data as Parameters<typeof renderImage>[0],
        alignment,
        readImageWidth(block.tunes?.imageWidth)
      );

    case "embed":
      return renderEmbed(data as Parameters<typeof renderEmbed>[0]);

    case "cta":
      return buildCtaHtml(data as Partial<CtaData>);

    case "raw":
      return (data.html as string) ?? "";

    default: {
      // Unknown tool: salvage whatever text it carries rather than losing it.
      const text = (data.text ?? data.caption) as Inline | undefined;
      return isBlank(text) ? "" : `<p>${text}</p>`;
    }
  }
}

/** Serializes a full Editor.js document to the HTML stored in `contentHtml`. */
export function blocksToHtml(output: OutputData | { blocks?: OutputBlockData[] }): string {
  const blocks = output?.blocks ?? [];
  return blocks
    .map(renderBlock)
    .filter((html) => html !== "")
    .join("\n");
}
