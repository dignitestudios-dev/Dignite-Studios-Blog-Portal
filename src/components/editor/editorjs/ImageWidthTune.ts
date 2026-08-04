/**
 * Image width block tune — 25% / 50% / 75% / 100%.
 *
 * `@editorjs/image` ships border/background/stretch tunes but no way to resize,
 * so this adds a percentage width. Percentages rather than pixels because the
 * published article is fluid: a pixel width that looks right in the editor
 * would overflow on a phone.
 *
 * Registered only on the image tool.
 */
import type { API, BlockAPI, BlockTune } from "@editorjs/editorjs";
// Not re-exported from the package root; the official tools import them the
// same way (see @editorjs/list's own declarations).
import type { MenuConfig } from "@editorjs/editorjs/types/tools";
import type { BlockTuneData } from "@editorjs/editorjs/types/block-tunes/block-tune-data";

export const IMAGE_WIDTHS = [25, 50, 75, 100] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export const DEFAULT_IMAGE_WIDTH: ImageWidth = 100;

interface ImageWidthTuneData {
  width?: number;
}

export function readImageWidth(data?: BlockTuneData): ImageWidth {
  const value = (data as ImageWidthTuneData | undefined)?.width;
  return (IMAGE_WIDTHS as readonly number[]).includes(value as number)
    ? (value as ImageWidth)
    : DEFAULT_IMAGE_WIDTH;
}

const ICON =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3z"/><path d="M8 10 5 12l3 2M16 10l3 2-3 2"/></svg>';

export default class ImageWidthTune implements BlockTune {
  static get isTune(): boolean {
    return true;
  }

  private api: API;
  private block: BlockAPI;
  private width: ImageWidth;
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
    this.width = readImageWidth(data);
  }

  wrap(pluginsContent: HTMLElement): HTMLElement {
    this.wrapper = pluginsContent;
    this.apply();
    return pluginsContent;
  }

  private apply() {
    if (!this.wrapper) return;
    this.wrapper.dataset.dsWidth = String(this.width);
  }

  render(): MenuConfig {
    return {
      icon: ICON,
      title: "Image size",
      children: {
        items: IMAGE_WIDTHS.map((value) => ({
          title: `${value}%`,
          name: `image-width-${value}`,
          toggle: "imageWidth",
          isActive: this.width === value,
          onActivate: () => {
            this.width = value;
            this.apply();
            this.block.dispatchChange();
            this.api.toolbar.close();
          },
        })),
      },
    };
  }

  save(): BlockTuneData {
    return { width: this.width };
  }
}
