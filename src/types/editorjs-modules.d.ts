/**
 * Ambient types for Editor.js packages that ship no declarations of their own.
 */

declare module "@editorjs/marker" {
  import type { InlineTool, InlineToolConstructorOptions } from "@editorjs/editorjs";

  export default class Marker implements InlineTool {
    constructor(options: InlineToolConstructorOptions);
    render(): HTMLElement;
    surround(range: Range): void;
    checkState(): boolean;
  }
}

/**
 * `@editorjs/embed` ships declarations but does not expose them through its
 * package `exports` map, so TypeScript cannot resolve them.
 */
declare module "@editorjs/embed" {
  import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

  export default class Embed implements BlockTool {
    constructor(options: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): unknown;
  }
}

declare module "editorjs-undo" {
  import type EditorJS from "@editorjs/editorjs";
  import type { OutputData } from "@editorjs/editorjs";

  interface UndoOptions {
    editor: EditorJS;
    maxLength?: number;
    onUpdate?: () => void;
    config?: {
      debounceTimer?: number;
      shortcuts?: { undo?: string | string[]; redo?: string | string[] };
    };
  }

  export default class Undo {
    constructor(options: UndoOptions);
    /** Seeds the history stack with the document the editor opened with. */
    initialize(initialData?: OutputData | OutputData["blocks"]): void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    /** Clears the recorded history. */
    clear?(): void;
  }
}
