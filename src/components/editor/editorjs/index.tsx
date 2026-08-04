"use client";

/**
 * Client-only entry point for the editor.
 *
 * Editor.js touches `window` at import time, so the whole component is loaded
 * with `ssr: false` rather than guarded internally.
 */
import dynamic from "next/dynamic";

export const BlogEditor = dynamic(() => import("./BlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[560px] items-center justify-center rounded-xl border border-gray-200 bg-white">
      <span className="text-sm text-gray-400">Loading editor…</span>
    </div>
  ),
});

export { blocksToHtml } from "./blocksToHtml";
export { htmlToBlocks } from "./htmlToBlocks";
export { buildCtaHtml, DEFAULT_CTA, type CtaData } from "./cta";
