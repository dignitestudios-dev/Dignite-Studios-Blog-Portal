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

