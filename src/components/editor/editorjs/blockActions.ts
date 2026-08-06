/**
 * Direct block operations for the top toolbar.
 *
 * The toolbar is a flat set of controls in the WordPress-classic sense: every
 * button performs its action immediately on the current block. Nothing here
 * opens one of Editor.js's floating menus — those are hidden in globals.css.
 *
 * All of it goes through the public Blocks API (`convert`, `insert`, `update`,
 * `move`, `delete`), so the blocks produced are the same ones the toolbox
 * would have produced.
 */
import type EditorJS from "@editorjs/editorjs";
import type { BlockAPI } from "@editorjs/editorjs";
import type { Alignment } from "./AlignmentTune";

/** Paragraph plus the heading levels the editor allows (H1 is the post title). */
export type BlockKind =
  | "paragraph"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "quote"
  | "code";

export type ListStyle = "unordered" | "ordered" | "checklist";
export type InsertKind = "image" | "table" | "delimiter" | "embed" | "cta";

export interface BlockState {
  /** Editor.js tool name of the current block, or "" when nothing is focused. */
  tool: string;
  /** Set for a header block: "h2".."h6". */
  kind: BlockKind | "";
  listStyle: ListStyle | "";
  alignment: Alignment;
  /** False when there is no current block, so controls can be disabled. */
  available: boolean;
}

export const EMPTY_BLOCK_STATE: BlockState = {
  tool: "",
  kind: "",
  listStyle: "",
  alignment: "left",
  available: false,
};

/** The list tool stores plain strings in v1 and objects in v2. */
interface ListItemData {
  content?: string;
  items?: ListItemData[];
}

interface ListBlockData {
  style?: ListStyle;
  items?: (ListItemData | string)[];
}

/**
 * Flattens a (possibly nested) list into one line of HTML per item.
 * Nesting is lost on unwrap — paragraphs have no depth to carry it.
 */
function flattenItems(items: (ListItemData | string)[]): string[] {
  const lines: string[] = [];
  for (const raw of items) {
    const item = typeof raw === "string" ? { content: raw } : raw;
    const content = (item.content ?? "").trim();
    if (content) lines.push(content);
    if (item.items?.length) lines.push(...flattenItems(item.items));
  }
  return lines;
}

/**
 * Builds the block data @editorjs/embed expects from a share URL.
 *
 * The tool has no empty state: `render()` returns a bare div whenever
 * `data.service` is unset, which is why inserting a data-less embed block
 * appeared to do nothing. It normally fills itself in from a *pasted* URL, so
 * the toolbar has to do the same job by hand.
 *
 * The `embed` templates below are copied from the tool's own service table, so
 * a block made here is indistinguishable from one made by pasting.
 */
export interface EmbedData {
  service: string;
  source: string;
  embed: string;
  width: number;
  height: number;
  caption: string;
}

const EMBED_SERVICES: {
  service: string;
  regex: RegExp;
  embed: (id: string) => string;
  width: number;
  height: number;
}[] = [
  {
    service: "youtube",
    // watch?v=, youtu.be/, /embed/, /shorts/ — all carry the id in one group.
    regex:
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i,
    embed: (id) => `https://www.youtube.com/embed/${id}`,
    width: 580,
    height: 320,
  },
  {
    service: "vimeo",
    regex: /vimeo\.com\/(?:video\/)?(\d+)/i,
    embed: (id) => `https://player.vimeo.com/video/${id}?title=0&byline=0`,
    width: 580,
    height: 320,
  },
  {
    service: "codepen",
    regex: /codepen\.io\/([^/?#]+)\/(?:pen|embed)\/([^/?#]+)/i,
    // The tool's template takes "<user>/embed/<slug>" as the remote id.
    embed: (id) => `https://codepen.io/${id}?height=300&theme-id=0&default-tab=css,result`,
    width: 600,
    height: 300,
  },
  {
    service: "twitter",
    regex: /(?:twitter\.com|x\.com)\/[^/?#]+\/status\/(\d+)/i,
    embed: (id) => `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
    width: 600,
    height: 600,
  },
];

export function embedFromUrl(rawUrl: string): EmbedData | null {
  const source = rawUrl.trim();
  if (!source) return null;

  for (const entry of EMBED_SERVICES) {
    const match = entry.regex.exec(source);
    if (!match) continue;

    // CodePen needs both captures joined into the id its template expects.
    const id =
      entry.service === "codepen" ? `${match[1]}/embed/${match[2]}` : match[1];

    return {
      service: entry.service,
      source,
      embed: entry.embed(id),
      width: entry.width,
      height: entry.height,
      caption: "",
    };
  }

  return null;
}

/** Services the toolbar can embed, for the prompt and error message. */
export const EMBED_SERVICE_NAMES = "YouTube, Vimeo, CodePen or X/Twitter";

/** Maps a toolbar choice onto the tool name plus the data it needs. */
function conversionTarget(kind: BlockKind): { tool: string; data?: object } {
  if (kind === "paragraph") return { tool: "paragraph" };
  if (kind === "quote") return { tool: "quote" };
  if (kind === "code") return { tool: "code" };
  return { tool: "header", data: { level: Number(kind.slice(1)) } };
}

export class BlockActions {
  private readonly editor: EditorJS;
  private readonly holder: HTMLElement;

  constructor(editor: EditorJS, holder: HTMLElement) {
    this.editor = editor;
    this.holder = holder;
  }

  /**
   * The block the toolbar acts on.
   *
   * Editor.js reports index -1 until something has been focused, which would
   * make every control a no-op right after a page load — park the caret on the
   * last block instead of failing silently.
   */
  /**
   * The block element the caret is in.
   *
   * Editor.js 2.31 marks no block with a "focused" class, and
   * `getCurrentBlockIndex()` only tracks blocks it saw receive focus itself —
   * neither is dependable here. Walking up from the selection is, because it
   * describes exactly what the user is looking at.
   */
  private currentElement(): HTMLElement | null {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (!node || !this.holder.contains(node)) return null;
    const start = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    return start?.closest<HTMLElement>(".ce-block") ?? null;
  }

  /** Index of the caret's block, or -1. */
  private currentIndex(): number {
    const element = this.currentElement();
    if (element) {
      const blocks = [...this.holder.querySelectorAll<HTMLElement>(".ce-block")];
      const index = blocks.indexOf(element);
      if (index >= 0) return index;
    }
    // Nothing focused yet (fresh page load) — fall back to Editor.js's own idea.
    try {
      return this.editor.blocks.getCurrentBlockIndex();
    } catch {
      return -1;
    }
  }

  private currentBlock(): BlockAPI | null {
    try {
      let index = this.currentIndex();
      if (index < 0) {
        this.editor.caret.setToLastBlock("end");
        index = this.currentIndex();
      }
      if (index < 0) return null;
      return this.editor.blocks.getBlockByIndex(index) ?? null;
    } catch {
      return null;
    }
  }

  /** The caret's block DOM node — where tune state is readable synchronously. */
  private focusedElement(): HTMLElement | null {
    return this.currentElement();
  }

  /**
   * Current block type and alignment.
   *
   * Read from the DOM rather than `block.save()`, which is async — the toolbar
   * has to reflect the caret on every selection change without a round trip.
   */
  readState(): BlockState {
    // Read-only: never move the caret just to report state.
    const index = this.currentIndex();
    if (index < 0) return EMPTY_BLOCK_STATE;

    const block = (() => {
      try {
        return this.editor.blocks.getBlockByIndex(index) ?? null;
      } catch {
        return null;
      }
    })();
    if (!block) return EMPTY_BLOCK_STATE;

    const element = this.focusedElement();
    const tool = block.name;

    let kind: BlockKind | "" = "";
    if (tool === "paragraph") kind = "paragraph";
    else if (tool === "quote") kind = "quote";
    else if (tool === "code") kind = "code";
    else if (tool === "header") {
      const heading = element?.querySelector("h1,h2,h3,h4,h5,h6");
      const level = heading ? Number(heading.tagName.slice(1)) : 2;
      kind = (`h${Math.min(6, Math.max(2, level))}` as BlockKind);
    }

    let listStyle: ListStyle | "" = "";
    if (tool === "list" || tool === "nestedList") {
      if (element?.querySelector("ol")) listStyle = "ordered";
      else if (element?.querySelector('input[type="checkbox"], .cdx-checklist')) listStyle = "checklist";
      else listStyle = "unordered";
    }

    const aligned = element?.querySelector<HTMLElement>("[data-ds-align]");
    const alignment = (aligned?.dataset.dsAlign as Alignment | undefined) ?? "left";

    return { tool, kind, listStyle, alignment, available: true };
  }

  /** Converts the current block to another type. */
  async convertTo(kind: BlockKind): Promise<boolean> {
    const block = this.currentBlock();
    if (!block) return false;
    const { tool, data } = conversionTarget(kind);

    try {
      await this.editor.blocks.convert(block.id, tool, data);
      return true;
    } catch (error) {
      // A tool without a `conversionConfig` cannot be converted into; say so
      // rather than leaving the user staring at a control that did nothing.
      console.error(`Cannot convert block to "${tool}":`, error);
      return false;
    }
  }

  /**
   * Toggles the current block between a list of `style` and plain paragraphs.
   *
   * Three cases, and they must stay distinct:
   *   - not a list          -> convert into one
   *   - a list of another   -> change only `style`. Running `convert` here
   *     style                  would re-import the block through the list
   *                            tool's conversionConfig, which flattens every
   *                            item into a single one.
   *   - a list of the same  -> unwrap it, one paragraph per item, so clicking
   *     style                  the active button removes the formatting.
   */
  async toList(style: ListStyle): Promise<boolean> {
    const block = this.currentBlock();
    if (!block) return false;

    const isList = block.name === "list" || block.name === "nestedList";

    try {
      if (!isList) {
        await this.editor.blocks.convert(block.id, "list", { style });
        return true;
      }

      const saved = await block.save();
      const data = (saved as { data?: ListBlockData } | undefined)?.data ?? {};
      const currentStyle = data.style ?? "unordered";

      if (currentStyle !== style) {
        // Replace rather than `update`: the list tool renders from the state it
        // built at construction and ignores a changed `style` on update, so the
        // bullets never actually turn into numbers. Re-inserting with the same
        // items is the only way to restyle without losing them.
        const index = this.currentIndex();
        if (index < 0) return false;
        this.editor.blocks.delete(index);
        this.editor.blocks.insert(
          "list",
          { ...data, style },
          undefined,
          index,
          true
        );
        return true;
      }

      return this.unwrapList(data);
    } catch (error) {
      console.error("Cannot change list formatting:", error);
      return false;
    }
  }

  /** Replaces the current list block with one paragraph per item. */
  private async unwrapList(data: ListBlockData): Promise<boolean> {
    const index = this.currentIndex();
    if (index < 0) return false;

    const lines = flattenItems(data.items ?? []);
    // An empty list still has to become something the caret can sit in.
    if (lines.length === 0) lines.push("");

    this.editor.blocks.delete(index);
    lines.forEach((text, offset) => {
      this.editor.blocks.insert(
        "paragraph",
        { text },
        undefined,
        index + offset,
        offset === lines.length - 1
      );
    });
    return true;
  }

  /** Sets the alignment tune on the current block. */
  async setAlignment(alignment: Alignment): Promise<boolean> {
    const block = this.currentBlock();
    if (!block) return false;
    try {
      await this.editor.blocks.update(block.id, undefined, {
        alignment: { alignment },
      });
      return true;
    } catch (error) {
      console.error("Cannot set alignment:", error);
      return false;
    }
  }

  /**
   * Inserts a new block after the current one.
   *
   * `data` is only needed by the embed tool, which renders nothing at all
   * without a recognised service.
   */
  async insert(kind: InsertKind, data?: object): Promise<boolean> {
    try {
      const index = this.currentIndex();
      this.editor.blocks.insert(
        kind,
        data,
        undefined,
        index < 0 ? undefined : index + 1,
        true
      );
      return true;
    } catch (error) {
      console.error(`Cannot insert "${kind}" block:`, error);
      return false;
    }
  }

  /** Moves the current block one position up or down. */
  move(direction: "up" | "down"): boolean {
    try {
      const index = this.currentIndex();
      if (index < 0) return false;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= this.editor.blocks.getBlocksCount()) return false;
      this.editor.blocks.move(target, index);
      return true;
    } catch (error) {
      console.error("Cannot move block:", error);
      return false;
    }
  }

  /** Deletes the current block. */
  remove(): boolean {
    try {
      const index = this.currentIndex();
      if (index < 0) return false;
      this.editor.blocks.delete(index);
      return true;
    } catch (error) {
      console.error("Cannot delete block:", error);
      return false;
    }
  }
}
