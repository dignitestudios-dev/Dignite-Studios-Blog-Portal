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

  /** Converts the current block into a list of the given style. */
  async toList(style: ListStyle): Promise<boolean> {
    const block = this.currentBlock();
    if (!block) return false;
    try {
      await this.editor.blocks.convert(block.id, "list", { style });
      return true;
    } catch (error) {
      console.error("Cannot convert block to list:", error);
      return false;
    }
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

  /** Inserts a new block after the current one. */
  async insert(kind: InsertKind): Promise<boolean> {
    try {
      const index = this.currentIndex();
      this.editor.blocks.insert(
        kind,
        undefined,
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
