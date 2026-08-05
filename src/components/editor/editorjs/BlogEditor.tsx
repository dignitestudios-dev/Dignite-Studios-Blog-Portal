"use client";

/**
 * Editor.js-based blog editor.
 *
 * Exposes the same contract the post form already relies on:
 *   onChange(blockJson, contentHtml)
 *
 * `contentHtml` is what the public site renders, so it is regenerated from the
 * blocks on every change rather than being stored separately.
 *
 * Two modes share one source of truth:
 *   - "rich": the Editor.js instance
 *   - "html": a raw HTML textarea
 * Switching modes serializes in one direction and parses in the other. While
 * the HTML view is open the Editor.js DOM is hidden rather than unmounted, so
 * the instance (and its undo history) survives the round trip.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputBlockData, OutputData } from "@editorjs/editorjs";
import {
  FiCode,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiEdit3,
  FiCheck,
  FiX,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import { blocksToHtml } from "./blocksToHtml";
import { htmlToBlocks } from "./htmlToBlocks";
import { EditorHistory, type HistoryState } from "./history";

interface BlogEditorProps {
  /** Stored Editor.js document. Ignored when it is not in Editor.js shape. */
  content?: object;
  /** Stored HTML — the migration source for posts from the previous editor. */
  contentHtml?: string;
  onChange: (json: object, html: string) => void;
  placeholder?: string;
}

const SAVE_DEBOUNCE_MS = 300;
const HTML_DEBOUNCE_MS = 400;

/**
 * Picks the starting document. Posts written in the previous editor have a
 * `content` JSON in a foreign shape (no `blocks` array), so their HTML is
 * parsed into blocks instead.
 */
function resolveInitialData(content?: object, contentHtml?: string): OutputData {
  const blocks = (content as { blocks?: OutputBlockData[] } | undefined)?.blocks;

  if (Array.isArray(blocks) && blocks.length > 0) {
    return { blocks };
  }

  if (contentHtml && contentHtml.trim()) {
    return { blocks: htmlToBlocks(contentHtml) };
  }

  return { blocks: [] };
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export default function BlogEditor({
  content,
  contentHtml,
  onChange,
  placeholder = "Start writing, or press Tab to add a block…",
}: BlogEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const historyRef = useRef<EditorHistory | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const htmlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kept in a ref so a new callback identity never re-initializes the editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"rich" | "html">("rich");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState>({
    canUndo: false,
    canRedo: false,
  });
  const [words, setWords] = useState(() => countWords(contentHtml ?? ""));
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Exit fullscreen with Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  // Snapshot the initial document once — later prop changes must not clobber
  // what the user is typing.
  const initialData = useMemo(
    () => resolveInitialData(content, contentHtml),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * Serializes the document once, then feeds both consumers from that single
   * save: the history stack and the post form. Saving twice risked the two
   * seeing different states when changes landed in between.
   */
  const sync = useCallback(async ({ record = true } = {}) => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const output = await editor.save();
      if (record) historyRef.current?.record(output.blocks);
      const html = blocksToHtml(output);
      setWords(countWords(html));
      onChangeRef.current(output, html);
    } catch (error) {
      console.error("Editor save failed:", error);
    }
  }, []);

  // ── Editor lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    let disposed = false;
    let instance: EditorJS | null = null;

    (async () => {
      const [
        { default: EditorJSCore },
        { default: Header },
        { default: List },
        { default: Quote },
        { default: Code },
        { default: Delimiter },
        { default: Table },
        { default: ImageTool },
        { default: Embed },
        { default: Marker },
        { default: InlineCode },
        { default: LinkTool },
        { default: CtaTool },
        { default: AlignmentTune },
        { default: ImageWidthTune },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
        import("@editorjs/code"),
        import("@editorjs/delimiter"),
        import("@editorjs/table"),
        import("@editorjs/image"),
        import("@editorjs/embed"),
        import("@editorjs/marker"),
        import("@editorjs/inline-code"),
        import("./LinkTool"),
        import("./CtaTool"),
        import("./AlignmentTune"),
        import("./ImageWidthTune"),
      ]);

      if (disposed || !holderRef.current) return;

      instance = new EditorJSCore({
        holder: holderRef.current,
        placeholder,
        autofocus: false,
        data: initialData,
        // `link` overrides the built-in inline link tool.
        inlineToolbar: ["bold", "italic", "link", "marker", "inlineCode"],
        // Applied to every tool that does not declare its own `tunes`, which
        // is how the alignment tune reaches the built-in paragraph (that tool
        // lives inside the core bundle and cannot be registered explicitly —
        // @editorjs/paragraph@3 ships no build).
        tunes: ["alignment"],
        tools: {
          header: {
            class: Header as never,
            inlineToolbar: true,
            tunes: ["alignment"],
            config: {
              placeholder: "Heading",
              // H1 is reserved for the post title.
              levels: [2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },
          list: {
            class: List as never,
            inlineToolbar: true,
            tunes: ["alignment"],
            config: { defaultStyle: "unordered" },
          },
          quote: {
            class: Quote as never,
            inlineToolbar: true,
            tunes: ["alignment"],
            config: {
              quotePlaceholder: "Quote",
              captionPlaceholder: "Attribution",
            },
          },
          // Alignment is turned off where it has no meaning, so the menu never
          // offers a control that would silently do nothing on the published page.
          code: { class: Code as never, tunes: [] },
          delimiter: { class: Delimiter as never, tunes: [] },
          table: {
            class: Table as never,
            inlineToolbar: true,
            tunes: [],
            config: { rows: 2, cols: 3, withHeadings: true },
          },
          image: {
            class: ImageTool as never,
            tunes: ["alignment", "imageWidth"],
            config: {
              captionPlaceholder: "Caption (used as alt text)",
              uploader: {
                async uploadByFile(file: File) {
                  const form = new FormData();
                  form.append("file", file);
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    body: form,
                  });
                  const payload = await res.json().catch(() => ({}));
                  if (!res.ok || !payload?.url) {
                    return { success: 0 };
                  }
                  return { success: 1, file: { url: payload.url } };
                },
                async uploadByUrl(url: string) {
                  return { success: 1, file: { url } };
                },
              },
            },
          },
          embed: {
            class: Embed as never,
            inlineToolbar: false,
            tunes: [],
            config: {
              services: {
                youtube: true,
                vimeo: true,
                codepen: true,
                twitter: true,
              },
            },
          },
          marker: { class: Marker as never },
          inlineCode: { class: InlineCode as never },
          link: { class: LinkTool as never },
          // The CTA banner is centered by design and spans the column.
          cta: { class: CtaTool as never, tunes: [] },
          alignment: { class: AlignmentTune as never },
          imageWidth: { class: ImageWidthTune as never },
        },
        onChange: () => {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => void sync(), SAVE_DEBOUNCE_MS);
        },
        onReady: () => {
          if (disposed || !instance || !holderRef.current) return;
          historyRef.current = new EditorHistory({
            editor: instance,
            holder: holderRef.current,
            onUpdate: setHistory,
          });
          historyRef.current.seed(initialData.blocks);
        },
      });

      await instance.isReady;
      if (disposed) {
        try {
          instance.destroy();
        } catch {
          // Instance was already torn down.
        }
        return;
      }

      editorRef.current = instance;
      setReady(true);
    })();

    return () => {
      disposed = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (htmlTimer.current) clearTimeout(htmlTimer.current);
      try {
        instance?.destroy?.();
      } catch {
        // Editor may not have finished initializing.
      }
      // The link panel lives on <body>, so it outlives the editor DOM if
      // Editor.js did not get to run the tool's own destroy hook.
      document.querySelectorAll(".ds-link-panel").forEach((el) => el.remove());
      editorRef.current = null;
      historyRef.current?.destroy();
      historyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toolbar actions ───────────────────────────────────────────────────────

  /**
   * Commits any change still sitting in the save debounce. Without this the
   * most recent keystrokes are not in the stack yet, so the first undo would
   * skip past them.
   */
  const flushPendingChange = useCallback(async () => {
    if (!saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    await sync();
  }, [sync]);

  const handleUndo = useCallback(async () => {
    await flushPendingChange();
    await historyRef.current?.undo();
    await sync({ record: false });
  }, [flushPendingChange, sync]);

  const handleRedo = useCallback(async () => {
    await flushPendingChange();
    await historyRef.current?.redo();
    await sync({ record: false });
  }, [flushPendingChange, sync]);

  // Kept in refs so the key handler below can stay bound for the component's
  // whole life instead of rebinding whenever history state changes.
  const undoRedoRef = useRef({ undo: handleUndo, redo: handleRedo });
  undoRedoRef.current = { undo: handleUndo, redo: handleRedo };

  /**
   * Ctrl/Cmd+Z and Ctrl+Y / Ctrl+Shift+Z.
   *
   * Bound in the capture phase because tools with their own key handling (the
   * CTA fields, the table) stop propagation on keydown, which would otherwise
   * swallow the shortcut.
   *
   * `beforeinput` matters just as much as `keydown`: the browser's native
   * contenteditable undo also fires from the Edit menu and trackpad gestures,
   * and letting it run would rewrite the DOM without Editor.js knowing, leaving
   * the block model out of sync with what is on screen.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const isTextField = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.closest(".ds-link-panel") !== null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      // The HTML textarea and the link panel keep their native undo.
      if (isTextField(event.target)) return;

      const key = event.key.toLowerCase();
      const isUndo = key === "z" && !event.shiftKey;
      const isRedo = key === "y" || (key === "z" && event.shiftKey);
      if (!isUndo && !isRedo) return;

      event.preventDefault();
      event.stopPropagation();
      void (isUndo ? undoRedoRef.current.undo() : undoRedoRef.current.redo());
    };

    const onBeforeInput = (event: Event) => {
      const inputType = (event as InputEvent).inputType;
      if (inputType !== "historyUndo" && inputType !== "historyRedo") return;
      if (isTextField(event.target)) return;

      event.preventDefault();
      void (inputType === "historyUndo"
        ? undoRedoRef.current.undo()
        : undoRedoRef.current.redo());
    };

    root.addEventListener("keydown", onKeyDown, true);
    root.addEventListener("beforeinput", onBeforeInput, true);
    return () => {
      root.removeEventListener("keydown", onKeyDown, true);
      root.removeEventListener("beforeinput", onBeforeInput, true);
    };
  }, []);

  /** rich -> html: serialize what is currently in the editor. */
  const openHtmlView = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const output = await editor.save();
    setHtmlDraft(blocksToHtml(output));
    setHtmlError(null);
    setMode("html");
  }, []);

  /** html -> rich: parse the draft back into blocks. */
  const applyHtml = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const blocks = htmlToBlocks(htmlDraft);
      await editor.render({ blocks });
      setMode("rich");
      setHtmlError(null);
      // Hand-edited HTML replaces the document wholesale, so the old stack no
      // longer describes anything reachable — start a fresh one from here.
      historyRef.current?.reset(blocks);
      await sync({ record: false });
    } catch (error) {
      console.error("Failed to apply HTML:", error);
      setHtmlError(
        "That HTML could not be parsed. Check for unclosed tags and try again."
      );
    }
  }, [htmlDraft, sync]);

  const discardHtml = useCallback(() => {
    setMode("rich");
    setHtmlError(null);
    void sync({ record: false });
  }, [sync]);

  /**
   * Keeps the post form in sync while the HTML view is open, so word count,
   * SEO analysis and an interim save all see the edited HTML. The Editor.js
   * DOM is only re-rendered on Apply.
   */
  const handleHtmlInput = useCallback((value: string) => {
    setHtmlDraft(value);
    if (htmlTimer.current) clearTimeout(htmlTimer.current);
    htmlTimer.current = setTimeout(() => {
      const blocks = htmlToBlocks(value);
      setWords(countWords(value));
      onChangeRef.current({ blocks }, value);
    }, HTML_DEBOUNCE_MS);
  }, []);

  const isHtmlMode = mode === "html";

  return (
    <div
      ref={rootRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] flex h-screen min-h-0 flex-col overflow-hidden bg-white"
          : "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
      }
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="z-20 flex flex-shrink-0 items-center gap-1 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
        <ToolbarButton
          onClick={handleUndo}
          disabled={isHtmlMode || !history.canUndo}
          title="Undo (Ctrl+Z)"
        >
          <FiCornerUpLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleRedo}
          disabled={isHtmlMode || !history.canRedo}
          title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
        >
          <FiCornerUpRight size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        {isHtmlMode ? (
          <>
            <ToolbarButton onClick={applyHtml} title="Apply HTML changes" active>
              <FiCheck size={15} />
              <span className="text-[11px] font-semibold">Apply</span>
            </ToolbarButton>
            <ToolbarButton onClick={discardHtml} title="Discard HTML changes">
              <FiX size={15} />
              <span className="text-[11px] font-semibold">Discard</span>
            </ToolbarButton>
          </>
        ) : (
          <ToolbarButton
            onClick={openHtmlView}
            disabled={!ready}
            title="Edit raw HTML"
          >
            <FiCode size={15} />
            <span className="text-[11px] font-semibold">HTML</span>
          </ToolbarButton>
        )}

        <div className="ml-auto flex items-center gap-2 pr-1 text-[11px] text-gray-400">
          {isHtmlMode && (
            <span className="flex items-center gap-1 text-[#F15C20]">
              <FiEdit3 size={12} /> HTML source
            </span>
          )}
          <span>{words.toLocaleString()} words</span>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />
          <ToolbarButton
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {isFullscreen ? <FiMinimize2 size={15} /> : <FiMaximize2 size={15} />}
          </ToolbarButton>
        </div>
      </div>

      {htmlError && (
        <p className="flex-shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
          {htmlError}
        </p>
      )}

      {/* ── Editor surface ──────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1">
        {!ready && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <span className="text-sm text-gray-400">Loading editor…</span>
          </div>
        )}

        {/* Hidden, not unmounted — keeps the instance and its history alive. */}
        {/*
          The left padding is load-bearing: Editor.js renders the block toolbar
          as `position:absolute; right:100%` of the content column, so the plus
          / drag handles and the settings popover they open sit ~62px to the
          LEFT of the text. Without a gutter at least that wide, this scroll
          container clips them.
        */}
        <div
          className={`editor-js-container h-full overflow-y-auto py-6 pl-20 pr-6 ${
            isHtmlMode ? "hidden" : ""
          }`}
        >
          <div ref={holderRef} />
        </div>

        {isHtmlMode && (
          <div className="flex h-full flex-col p-3">
            <textarea
              value={htmlDraft}
              onChange={(e) => handleHtmlInput(e.target.value)}
              spellCheck={false}
              className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-[#1f2937] p-4 font-mono text-[13px] leading-relaxed text-gray-100 outline-none focus:border-[#F15C20]"
              placeholder="<p>Your HTML…</p>"
            />
            <p className="mt-2 flex-shrink-0 text-[11px] text-gray-400">
              Edits are applied to the visual editor when you press{" "}
              <strong className="text-gray-500">Apply</strong>. Tags outside the
              supported set are converted to their nearest block, so the HTML may
              be normalized.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors ${
        active
          ? "bg-[#F15C20] text-white hover:bg-[#d84e18]"
          : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
      } disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}
