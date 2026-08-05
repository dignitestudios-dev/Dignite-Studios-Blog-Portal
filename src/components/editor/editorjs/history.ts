/**
 * Undo / redo for Editor.js.
 *
 * Editor.js ships no history of its own. The usual drop-in (`editorjs-undo`)
 * tries to be clever: it diffs two states, guesses which *single* block changed
 * and patches just that one. Any edit that touches more than one block — a
 * paste, a merge on Backspace, a block conversion, a table edit — restores
 * partially, and the guard that stops an undo from being recorded as a fresh
 * change is cleared by the first DOM mutation batch rather than the last.
 *
 * This takes the boring route instead: every history entry is a complete
 * snapshot of the document. Restoring means making the document equal to a
 * snapshot, so the result is always exactly right regardless of what changed.
 *
 * The one cost — re-rendering everything — is avoided in the common case by
 * patching only the blocks that actually differ, but that is a pure
 * optimization: whenever a patch cannot express the difference faithfully, it
 * falls back to a full render.
 */

import type EditorJS from "@editorjs/editorjs";
import type { OutputBlockData } from "@editorjs/editorjs";

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

interface CaretPosition {
  /** Index of the block the caret sat in. */
  blockIndex: number;
  /** Caret offset in characters, counted across the block's text nodes. */
  offset: number;
}

interface Snapshot {
  blocks: OutputBlockData[];
  /** Where the caret was when this snapshot was taken. */
  caret: CaretPosition | null;
}

interface EditorHistoryOptions {
  editor: EditorJS;
  /** Element Editor.js renders into — used to read and restore the caret. */
  holder: HTMLElement;
  onUpdate: (state: HistoryState) => void;
  maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 100;

// ── Comparison ──────────────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(bRecord, key) &&
      deepEqual(aRecord[key], bRecord[key])
  );
}

/**
 * Block ids are deliberately excluded. Editor.js mints new ids whenever it
 * re-creates a block, so comparing them would report a change after every
 * restore and push the restored state back onto the stack as a new entry.
 */
function sameDocument(a: OutputBlockData[], b: OutputBlockData[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((block, index) => {
    const other = b[index];
    return (
      block.type === other.type &&
      deepEqual(block.data, other.data) &&
      deepEqual(block.tunes ?? {}, other.tunes ?? {})
    );
  });
}

function sameKeys(a: object = {}, b: object = {}): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key))
  );
}

interface BlockPatch {
  id: string;
  data: OutputBlockData["data"];
  tunes: NonNullable<OutputBlockData["tunes"]>;
}

/**
 * Works out whether `target` can be reached from `current` by updating
 * individual blocks, which keeps the rest of the document — and its scroll
 * position, image elements and iframes — untouched.
 *
 * Returns null when a full re-render is required.
 */
function planPatch(
  current: OutputBlockData[],
  target: OutputBlockData[]
): BlockPatch[] | null {
  if (current.length !== target.length) return null;

  const patches: BlockPatch[] = [];

  for (let index = 0; index < current.length; index += 1) {
    const from = current[index];
    const to = target[index];

    // A different tool at this position means blocks were inserted, removed or
    // converted; only a render gets that right.
    if (from.type !== to.type || !from.id) return null;

    const dataEqual = deepEqual(from.data, to.data);
    const tunesEqual = deepEqual(from.tunes ?? {}, to.tunes ?? {});
    if (dataEqual && tunesEqual) continue;

    // `blocks.update` merges the new data over the old, so a key that exists
    // now but not in the target would survive the update. Render instead.
    if (!sameKeys(from.data, to.data)) return null;

    patches.push({ id: from.id, data: to.data, tunes: to.tunes ?? {} });
  }

  return patches;
}

// ── Caret ───────────────────────────────────────────────────────────────────

function blockElements(holder: HTMLElement): HTMLElement[] {
  return Array.from(holder.querySelectorAll<HTMLElement>(".ce-block"));
}

/** Reads the caret as a (block index, character offset) pair. */
function captureCaret(holder: HTMLElement): CaretPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const anchor = selection.anchorNode;
  if (!anchor || !holder.contains(anchor)) return null;

  const element = anchor.nodeType === Node.ELEMENT_NODE ? (anchor as Element) : anchor.parentElement;
  const block = element?.closest(".ce-block");
  if (!block) return null;

  const blockIndex = blockElements(holder).indexOf(block as HTMLElement);
  if (blockIndex === -1) return null;

  const range = document.createRange();
  range.selectNodeContents(block);
  try {
    range.setEnd(anchor, selection.anchorOffset);
  } catch {
    return { blockIndex, offset: 0 };
  }

  return { blockIndex, offset: range.toString().length };
}

/** Places the caret `offset` characters into `element`'s text. */
function placeCaret(element: HTMLElement, offset: number): boolean {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  let last: Text | null = null;

  while (node) {
    const text = node as Text;
    const length = text.data.length;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(text, remaining);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return true;
    }
    remaining -= length;
    last = text;
    node = walker.nextNode();
  }

  // Offset ran past the end of the block — settle for the end of it.
  if (last) {
    const range = document.createRange();
    range.setStart(last, last.data.length);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  }

  return false;
}

// ── History ─────────────────────────────────────────────────────────────────

export class EditorHistory {
  private readonly editor: EditorJS;
  private readonly holder: HTMLElement;
  private readonly onUpdate: (state: HistoryState) => void;
  private readonly maxEntries: number;

  private stack: Snapshot[] = [];
  private position = -1;
  /** True while a restore is in flight, so its own mutations are ignored. */
  private applying = false;
  private destroyed = false;

  constructor({ editor, holder, onUpdate, maxEntries = DEFAULT_MAX_ENTRIES }: EditorHistoryOptions) {
    this.editor = editor;
    this.holder = holder;
    this.onUpdate = onUpdate;
    this.maxEntries = Math.max(2, maxEntries);
  }

  /** Seeds the stack with the document the editor opened with. */
  seed(blocks: OutputBlockData[]): void {
    this.stack = [{ blocks: cloneBlocks(blocks), caret: null }];
    this.position = 0;
    this.emitState();
  }

  /**
   * Records the current document. Safe to call on every change: identical
   * states are collapsed, so a restore that echoes back through Editor.js's
   * `onChange` never lands in the stack.
   */
  record(blocks: OutputBlockData[]): void {
    if (this.destroyed || this.applying) return;

    if (this.position === -1) {
      this.seed(blocks);
      return;
    }

    if (sameDocument(this.stack[this.position].blocks, blocks)) return;

    // Recording after an undo discards the redo branch.
    this.stack = this.stack.slice(0, this.position + 1);
    this.stack.push({ blocks: cloneBlocks(blocks), caret: captureCaret(this.holder) });

    if (this.stack.length > this.maxEntries) {
      this.stack = this.stack.slice(this.stack.length - this.maxEntries);
    }

    this.position = this.stack.length - 1;
    this.emitState();
  }

  canUndo(): boolean {
    return this.position > 0;
  }

  canRedo(): boolean {
    return this.position > -1 && this.position < this.stack.length - 1;
  }

  async undo(): Promise<void> {
    if (!this.canUndo()) return;
    await this.moveTo(this.position - 1);
  }

  async redo(): Promise<void> {
    if (!this.canRedo()) return;
    await this.moveTo(this.position + 1);
  }

  /**
   * Replaces the whole history — used when the document is swapped wholesale,
   * such as applying edits made in the HTML source view.
   */
  reset(blocks: OutputBlockData[]): void {
    this.seed(blocks);
  }

  destroy(): void {
    this.destroyed = true;
    this.stack = [];
    this.position = -1;
  }

  private emitState(): void {
    if (this.destroyed) return;
    this.onUpdate({ canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  /**
   * Moves to `target`, making the document equal to the snapshot stored there.
   *
   * The position is only kept if the restore actually lands. Moving it up front
   * and leaving it moved after a failure would have the stack describing a
   * document the editor never showed, so every later undo would work off the
   * wrong baseline.
   */
  private async moveTo(target: number): Promise<void> {
    const previous = this.position;
    const snapshot = this.stack[target];

    this.position = target;
    this.applying = true;
    // Report the new button state immediately; the render below is async.
    this.emitState();

    try {
      const current = (await this.editor.save()).blocks;
      const patches = planPatch(current, snapshot.blocks);

      if (patches) {
        for (const patch of patches) {
          await this.editor.blocks.update(patch.id, patch.data, patch.tunes);
        }
      } else {
        await this.editor.blocks.render({ blocks: cloneBlocks(snapshot.blocks) });
      }

      // Store what the editor actually ended up with rather than what we asked
      // for. Editor.js may normalize on render, and the change event this
      // restore triggers has to compare equal to be collapsed — otherwise the
      // restored state is recorded as a fresh edit and the redo branch dies.
      const applied = (await this.editor.save()).blocks;
      this.stack[target] = { ...snapshot, blocks: cloneBlocks(applied) };

      this.restoreCaret(snapshot.caret);
    } catch (error) {
      console.error("Editor history: failed to restore state", error);
      this.position = previous;
    } finally {
      // Released synchronously. The echo from this restore is recognized by
      // value in `record` (it compares equal and is collapsed), so holding the
      // guard past this point would only risk discarding a real edit that
      // happens to land in the same frame.
      this.applying = false;
      this.emitState();
    }
  }

  private restoreCaret(caret: CaretPosition | null): void {
    const blocks = blockElements(this.holder);
    if (blocks.length === 0) return;

    const index = Math.min(Math.max(caret?.blockIndex ?? 0, 0), blocks.length - 1);
    const block = blocks[index];
    const editable =
      block.querySelector<HTMLElement>('[contenteditable="true"]') ??
      block.querySelector<HTMLElement>(".ce-block__content");

    if (!editable) return;

    editable.focus({ preventScroll: true });

    if (caret && placeCaret(editable, caret.offset)) {
      block.scrollIntoView({ block: "nearest" });
      return;
    }

    try {
      this.editor.caret.setToBlock(index, "end");
    } catch {
      // Block is not focusable (an image or delimiter) — leave the caret alone.
    }
  }
}

function cloneBlocks(blocks: OutputBlockData[]): OutputBlockData[] {
  return blocks.map((block) => ({
    ...block,
    data: structuredClone(block.data),
    ...(block.tunes ? { tunes: structuredClone(block.tunes) } : {}),
  }));
}
