/**
 * Drives Editor.js's inline tools from a persistent toolbar instead of the
 * floating menu that appears over a selection.
 *
 * The formatting is NOT reimplemented here. Marker, inline-code and the link
 * tool are the same classes Editor.js registers, instantiated a second time
 * against the live editor instance and driven through their documented
 * `surround(range)` / `checkState()` hooks. Anything they produce is therefore
 * byte-identical to what the floating menu produced, which matters because the
 * saved HTML is what the public site renders.
 *
 * Bold and italic have no importable class — they live inside the Editor.js
 * core bundle — so they go through `document.execCommand`, which is exactly
 * what those built-in tools do internally.
 *
 * Editor.js's own inline toolbar is left *registered* (see `inlineToolbar` in
 * BlogEditor) and merely hidden in CSS. Removing it from the config would drop
 * the tools' `sanitize` rules, and the sanitizer would then strip <mark>,
 * <code> and <a> out of every block on save.
 */
import type EditorJS from "@editorjs/editorjs";
import type { API, InlineTool } from "@editorjs/editorjs";

export type InlineFormatName = "bold" | "italic" | "link" | "marker" | "inlineCode";

export type InlineFormatState = Record<InlineFormatName, boolean> & {
  /** False when nothing in the editor is selected, so buttons can be disabled. */
  available: boolean;
};

export const EMPTY_FORMAT_STATE: InlineFormatState = {
  bold: false,
  italic: false,
  link: false,
  marker: false,
  inlineCode: false,
  available: false,
};

/** The subset of an inline tool this module needs. */
interface SurroundTool {
  surround(range: Range): void;
  checkState(selection?: Selection): boolean;
}

type InlineToolCtor = new (args: { api: API }) => InlineTool;

interface InlineFormatterOptions {
  editor: EditorJS;
  /** Element Editor.js renders into — bounds every selection check. */
  holder: HTMLElement;
  tools: {
    Marker: InlineToolCtor;
    InlineCode: InlineToolCtor;
    LinkTool: InlineToolCtor;
  };
}

/** Reads the live selection only when it sits inside the editor. */
function selectionInside(holder: HTMLElement): Selection | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const { anchorNode, focusNode } = selection;
  if (!anchorNode || !focusNode) return null;
  if (!holder.contains(anchorNode) || !holder.contains(focusNode)) return null;

  return selection;
}

/**
 * Whether the selection sits inside a link.
 *
 * Deliberately does NOT call `LinkTool.checkState()`. That method assigns to the
 * tool's `currentAnchor` as a side effect, and this runs on every
 * `selectionchange` — including while the tool's own panel is open, where it
 * would wipe the anchor the panel is about to edit and make "Apply" a no-op.
 * The floating toolbar never tripped over this because Editor.js stops polling
 * once focus moves into the panel.
 */
function insideAnchor(selection: Selection, holder: HTMLElement): boolean {
  const node = selection.anchorNode;
  if (!node) return false;
  const start = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  const anchor = start?.closest("a");
  return !!anchor && holder.contains(anchor);
}

/**
 * `queryCommandState` throws in a few browsers when the document has no
 * editable focus, and it is deprecated besides — never let it break the UI.
 */
function commandState(command: string): boolean {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

export class InlineFormatter {
  private readonly editor: EditorJS;
  private readonly holder: HTMLElement;
  private readonly marker: SurroundTool;
  private readonly inlineCode: SurroundTool;
  private readonly link: SurroundTool;

  constructor({ editor, holder, tools }: InlineFormatterOptions) {
    this.editor = editor;
    this.holder = holder;

    // The editor instance *is* the tool API: it publicly exposes `selection`
    // and `styles`, the only members these tools touch.
    const api = editor as unknown as API;
    this.marker = new tools.Marker({ api }) as unknown as SurroundTool;
    this.inlineCode = new tools.InlineCode({ api }) as unknown as SurroundTool;
    this.link = new tools.LinkTool({ api }) as unknown as SurroundTool;
  }

  /**
   * Whether a format can be applied right now.
   *
   * Everything except the link needs actual selected text — surrounding a
   * collapsed range would insert an empty <mark> or <code>. The link tool is
   * also useful with a bare caret, because it edits the anchor the caret is
   * already inside.
   */
  private canApply(name: InlineFormatName, selection: Selection | null): boolean {
    if (!selection) return false;
    if (!selection.isCollapsed) return true;
    // Same reason as `insideAnchor`: never poll the link tool's checkState.
    return name === "link" && insideAnchor(selection, this.holder);
  }

  /** Current formatting under the caret, for lighting up the toolbar. */
  readState(): InlineFormatState {
    const selection = selectionInside(this.holder);
    if (!selection) return EMPTY_FORMAT_STATE;

    return {
      bold: commandState("bold"),
      italic: commandState("italic"),
      // These read the DOM around the selection rather than a command flag.
      marker: this.safeCheck(this.marker, selection),
      inlineCode: this.safeCheck(this.inlineCode, selection),
      link: insideAnchor(selection, this.holder),
      available: !selection.isCollapsed,
    };
  }

  /** A tool that throws while inspecting the DOM must not blank the toolbar. */
  private safeCheck(tool: SurroundTool, selection: Selection): boolean {
    try {
      return tool.checkState(selection) === true;
    } catch {
      return false;
    }
  }

  isEnabled(name: InlineFormatName): boolean {
    return this.canApply(name, selectionInside(this.holder));
  }

  /**
   * Applies a format to the current selection.
   *
   * Returns false when there was nothing to act on, so the caller can skip the
   * follow-up save. The caller is responsible for keeping focus in the editor —
   * a toolbar button must `preventDefault()` on mousedown, or the browser drops
   * the selection before this ever runs.
   */
  apply(name: InlineFormatName): boolean {
    const selection = selectionInside(this.holder);
    if (!this.canApply(name, selection) || !selection) return false;

    if (name === "bold" || name === "italic") {
      try {
        document.execCommand(name);
      } catch {
        return false;
      }
      return true;
    }

    const range = selection.getRangeAt(0);
    const tool =
      name === "marker" ? this.marker : name === "inlineCode" ? this.inlineCode : this.link;

    try {
      tool.surround(range);
    } catch {
      return false;
    }
    return true;
  }
}
