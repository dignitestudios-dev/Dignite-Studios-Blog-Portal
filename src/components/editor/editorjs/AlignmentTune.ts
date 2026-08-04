/**
 * Alignment block tune — left / center / right.
 *
 * Registered on the text tools and on images. The chosen value is written to
 * the block's tune data and serialized as `text-align` on the rendered element,
 * so the published article matches what the editor shows.
 *
 * Preview is driven by a `data-ds-align` attribute rather than inline styles so
 * the rules stay in one place (globals.css) and images can be nudged with
 * margins instead of text-align, which does not move a block-level element.
 */
import type { API, BlockAPI, BlockTune } from "@editorjs/editorjs";
// Not re-exported from the package root; the official tools import them the
// same way (see @editorjs/list's own declarations).
import type { MenuConfig } from "@editorjs/editorjs/types/tools";
import type { BlockTuneData } from "@editorjs/editorjs/types/block-tunes/block-tune-data";

export type Alignment = "left" | "center" | "right";

export const DEFAULT_ALIGNMENT: Alignment = "left";

const ICONS: Record<Alignment, string> = {
  left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h13"/></svg>',
  center:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M6 18h12"/></svg>',
  right:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M10 12h10M7 18h13"/></svg>',
};

const LABELS: Record<Alignment, string> = {
  left: "Align left",
  center: "Align center",
  right: "Align right",
};

interface AlignmentTuneData {
  alignment?: Alignment;
}

export function readAlignment(data?: BlockTuneData): Alignment {
  const value = (data as AlignmentTuneData | undefined)?.alignment;
  return value === "center" || value === "right" ? value : DEFAULT_ALIGNMENT;
}

export default class AlignmentTune implements BlockTune {
  static get isTune(): boolean {
    return true;
  }

  private api: API;
  private block: BlockAPI;
  private alignment: Alignment;
  private wrapper: HTMLElement | null = null;

  constructor({
    api,
    block,
    data,
  }: {
    api: API;
    block: BlockAPI;
    data: BlockTuneData;
  }) {
    this.api = api;
    this.block = block;
    this.alignment = readAlignment(data);
  }

  /** Applies the current alignment to the block's content element. */
  wrap(pluginsContent: HTMLElement): HTMLElement {
    this.wrapper = pluginsContent;
    this.apply();
    return pluginsContent;
  }

  private apply() {
    if (!this.wrapper) return;
    this.wrapper.dataset.dsAlign = this.alignment;
  }

  render(): MenuConfig {
    return (["left", "center", "right"] as Alignment[]).map((value) => ({
      icon: ICONS[value],
      title: LABELS[value],
      name: `align-${value}`,
      // Shared toggle key makes the three behave as one radio group.
      toggle: "alignment",
      isActive: this.alignment === value,
      onActivate: () => {
        this.alignment = value;
        this.apply();
        // Persist the change and let undo/redo record it.
        this.block.dispatchChange();
        this.api.toolbar.close();
      },
    }));
  }

  save(): BlockTuneData {
    return { alignment: this.alignment };
  }
}
