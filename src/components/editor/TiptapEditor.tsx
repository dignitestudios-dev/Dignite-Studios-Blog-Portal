"use client";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useRef, useState } from "react";
import {
  FiBold, FiItalic, FiUnderline, FiLink, FiImage,
  FiList, FiAlignLeft, FiAlignCenter, FiAlignRight, FiCode,
  FiExternalLink, FiEdit2, FiTrash2, FiArrowUpRight,
} from "react-icons/fi";
import {
  MdFormatListNumbered, MdFormatQuote, MdStrikethroughS,
  MdTableChart, MdUndo, MdRedo, MdFormatClear,
} from "react-icons/md";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

// ─── CTA Banner Node ─────────────────────────────────────────────────────────

const DEFAULT_CTA = {
  heading: "Get Clear On Your Next Move",
  paragraph:
    "Choosing the right enterprise mobile app development services can define your project\u2019s success. Let our experts help you plan, design and build a solution which truly meets the business needs.",
  buttonText: "Get Started Today",
  buttonHref: "#",
  ctaType: "link" as "link" | "subscribe",
  inputPlaceholder: "Enter your email...",
};

function CTABannerView({ node, updateAttributes }: any) {
  const { heading, paragraph, buttonText, buttonHref } = node.attrs;
  const [href, setHref] = useState<string>(buttonHref ?? "#");
  const [hrefFocused, setHrefFocused] = useState(false);

  useEffect(() => { setHref(buttonHref ?? "#"); }, [buttonHref]);

  function stopKey(e: React.KeyboardEvent) { e.stopPropagation(); }

  const editableStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    outline: "none",
    cursor: "text",
    borderBottom: "2px dashed transparent",
    transition: "border-color 0.15s",
    ...extra,
  });

  const BTN_H = 52;

  return (
    <NodeViewWrapper as="div" className="my-10 group/banner" contentEditable={false}>
      <div style={{ borderRadius: 20, backgroundColor: "#F15C20", padding: "40px 6% 36px", textAlign: "center", fontFamily: "Arial,sans-serif", boxSizing: "border-box", width: "100%", overflow: "hidden" }}>

        {/* Heading — centered */}
        <div style={{ marginBottom: 14 }}>
          <h2
            contentEditable suppressContentEditableWarning
            onKeyDown={stopKey}
            onBlur={(e) => updateAttributes({ heading: e.currentTarget.textContent ?? "" })}
            onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.5)"; }}
            onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent"; }}
            style={{ ...editableStyle({ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1.25, color: "#fff", wordBreak: "break-word", textAlign: "center" }) }}
          >
            {heading}
          </h2>
        </div>

        {/* Editable paragraph */}
        <p
          contentEditable suppressContentEditableWarning
          onKeyDown={stopKey}
          onBlur={(e) => updateAttributes({ paragraph: e.currentTarget.textContent ?? "" })}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.4)"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent"; }}
          style={{ ...editableStyle({ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.92)", lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "break-word" }) }}
        >
          {paragraph}
        </p>

        {/* Button: pill + adjacent arrow circle, with gap */}
        <div style={{ display: "inline-flex", alignItems: "stretch", gap: "0px" }}>
          <span
            contentEditable suppressContentEditableWarning
            onKeyDown={stopKey}
            onBlur={(e) => updateAttributes({ buttonText: e.currentTarget.textContent ?? "" })}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#F15C20", fontSize: 14, fontWeight: 600, padding: "0 32px", borderRadius: "50px", whiteSpace: "nowrap", outline: "none", cursor: "text", minWidth: 160, height: BTN_H, lineHeight: "1" }}
          >
            {buttonText}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#F15C20", width: BTN_H, height: BTN_H, borderRadius: "50px", flexShrink: 0 }}>
            <FiArrowUpRight size={20} />
          </span>
        </div>

        {/* Button URL input */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>URL:</span>
          <input
            type="url"
            value={href}
            onFocus={() => setHrefFocused(true)}
            onBlur={() => { setHrefFocused(false); updateAttributes({ buttonHref: href }); }}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            style={{ background: "rgba(255,255,255,0.15)", border: hrefFocused ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#fff", outline: "none", width: 220 }}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-1.5 opacity-0 group-hover/banner:opacity-100 transition-opacity">
        Click any text to edit inline
      </p>
    </NodeViewWrapper>
  );
}

const CTABannerNode = Node.create({
  name: "ctaBanner",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      heading: { default: DEFAULT_CTA.heading },
      paragraph: { default: DEFAULT_CTA.paragraph },
      buttonText: { default: DEFAULT_CTA.buttonText },
      buttonHref: { default: DEFAULT_CTA.buttonHref },
      ctaType: { default: "link" },
      inputPlaceholder: { default: "Enter your email..." },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="cta-banner"]',
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        return {
          heading: el.getAttribute("data-heading") ?? DEFAULT_CTA.heading,
          paragraph: el.getAttribute("data-paragraph") ?? DEFAULT_CTA.paragraph,
          buttonText: el.getAttribute("data-button-text") ?? DEFAULT_CTA.buttonText,
          buttonHref: el.getAttribute("data-button-href") ?? DEFAULT_CTA.buttonHref,
          ctaType: el.getAttribute("data-cta-type") ?? "link",
          inputPlaceholder: el.getAttribute("data-input-placeholder") ?? "Enter your email...",
        };
      },
    }];
  },

  renderHTML({ node }) {
    const { heading, paragraph, buttonText, buttonHref, ctaType, inputPlaceholder } = node.attrs;
    const isSubscribe = ctaType === "subscribe";
    const base = {
      "data-type": "cta-banner",
      "class": "cta-banner not-prose",
      "data-heading": heading,
      "data-paragraph": paragraph,
      "data-button-text": buttonText,
      "data-button-href": buttonHref,
      "data-cta-type": ctaType,
      "data-input-placeholder": inputPlaceholder,
      style: "border-radius:20px;background-color:#F15C20;padding:40px 6% 36px;text-align:center;font-family:Arial,sans-serif;box-sizing:border-box;width:100%;overflow:hidden;margin-top:40px;margin-bottom:40px",
    };

    const buttonEl = isSubscribe
      ? ["div", { style: "display:flex;align-items:center;background:#ffffff;border-radius:50px;overflow:hidden;max-width:420px;margin:0 auto" },
        ["input", { type: "email", placeholder: inputPlaceholder, style: "flex:1;padding:14px 20px;font-size:14px;outline:none;border:none;background:transparent;color:#666;min-width:0" }],
        ["button", { type: "submit", style: "background:#F15C20;color:#ffffff;padding:14px 24px;border-radius:50px;border:none;font-weight:600;font-size:14px;white-space:nowrap;cursor:pointer;flex-shrink:0" }, buttonText],
      ]
      : ["div", { style: "display:inline-flex;align-items:center;gap:0px" },
        ["a", { href: buttonHref, style: "display:inline-flex;align-items:center;justify-content:center;background:#ffffff;color:#F15C20;text-decoration:none;font-size:14px;font-weight:600;padding:0 32px;border-radius:50px;white-space:nowrap;line-height:1;min-width:160px;height:52px;box-sizing:border-box" }, buttonText],
        ["a", { href: buttonHref, style: "display:inline-flex;align-items:center;justify-content:center;background:#ffffff;color:#F15C20;text-decoration:none;width:52px;height:52px;border-radius:50px;flex-shrink:0;box-sizing:border-box" },
          ["svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", class: "lucide lucide-arrow-up-right-icon lucide-arrow-up-right" },
            ["path", { d: "M7 7h10v10" }],
            ["path", { d: "M7 17 17 7" }]
          ]
        ],
      ];

    return [
      "div", base,
      ["h2", { style: "margin:0 0 14px;font-size:30px;font-weight:700;line-height:1.25;color:#ffffff;word-break:break-word;overflow-wrap:break-word;text-align:center" }, heading],
      ["p", { style: "margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.92);line-height:1.5;word-break:break-word;overflow-wrap:break-word" }, paragraph],
      buttonEl,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CTABannerView);
  },
});

// ─── Image Node View ──────────────────────────────────────────────────────────

function ImageNodeView({ node, updateAttributes, selected }: any) {
  const { src, alt, align, width } = node.attrs as {
    src: string; alt: string; align: string; width: string;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const [isActive, setIsActive] = useState(false);

  const showControls = selected || isActive;

  // Click-outside to deactivate
  useEffect(() => {
    if (!isActive) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as globalThis.Node)) {
        setIsActive(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [isActive]);

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragStartX.current = e.clientX;
    dragStartW.current = containerRef.current?.offsetWidth ?? 0;
    function onMove(me: MouseEvent) {
      const newW = Math.max(60, dragStartW.current + (me.clientX - dragStartX.current));
      updateAttributes({ width: `${newW}px` });
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // Alignment via margins on the container itself (more reliable than textAlign)
  const containerStyle: React.CSSProperties = {
    display: "block",
    width: width || "100%",
    maxWidth: "100%",
    position: "relative",
    ...(align === "center" ? { marginLeft: "auto", marginRight: "auto" } :
      align === "right" ? { marginLeft: "auto", marginRight: "0" } :
        { marginLeft: "0", marginRight: "auto" }),
  };

  return (
    <NodeViewWrapper contentEditable={false} className="mt-2 mb-8">
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={() => setIsActive(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          style={{ display: "block", width: "100%", maxWidth: "100%", borderRadius: 4 }}
        />

        {showControls && (
          <>
            {/* Selection ring */}
            <div style={{ position: "absolute", inset: 0, border: "2px solid #F15C20", borderRadius: 4, pointerEvents: "none" }} />

            {/* Floating toolbar */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg px-2 py-1.5 shadow-xl whitespace-nowrap z-50"
              style={{ background: "rgba(17,24,39,0.92)", backdropFilter: "blur(4px)" }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ align: a }); }}
                  title={`Align ${a}`}
                  className={`p-1 rounded transition-colors ${align === a ? "bg-[#F15C20] text-white" : "text-gray-300 hover:text-white"}`}
                >
                  {a === "left" ? <FiAlignLeft size={12} /> : a === "center" ? <FiAlignCenter size={12} /> : <FiAlignRight size={12} />}
                </button>
              ))}
              <div className="w-px h-4 bg-gray-600 mx-0.5" />
              {(["25%", "50%", "75%", "100%"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ width: s }); }}
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${width === s ? "bg-[#F15C20] text-white" : "text-gray-300 hover:text-white"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Alt text input */}
            <div className="absolute bottom-2 left-2 right-2" onMouseDown={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={alt ?? ""}
                onChange={(e) => updateAttributes({ alt: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Alt text (auto-generated from filename)"
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 shadow-md focus:outline-none focus:border-[#F15C20]"
                style={{ background: "rgba(255,255,255,0.95)" }}
              />
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={onResizeStart}
              title="Drag to resize"
              style={{
                position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)",
                width: 12, height: 32, background: "#fff", border: "1px solid #d1d5db",
                borderRadius: "4px 0 0 4px", cursor: "ew-resize",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)", zIndex: 50,
              }}
            >
              <div style={{ width: 2, height: 14, background: "#9ca3af", borderRadius: 2 }} />
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: "",
        parseHTML: (el) => (el as HTMLElement).getAttribute("alt") ?? "",
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-align") ?? "center",
        renderHTML: () => ({}),
      },
      width: {
        default: "100%",
        parseHTML: (el) => {
          const ele = el as HTMLElement;
          return ele.getAttribute("data-width") ?? ele.style.width ?? "100%";
        },
        renderHTML: () => ({}),
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const align = (node.attrs.align as string) ?? "center";
    const width = (node.attrs.width as string) ?? "100%";
    const alt = (node.attrs.alt as string) ?? "";
    const { align: _a, width: _w, alt: _alt, ...rest } = HTMLAttributes;
    const style = `display:block;width:${width};max-width:100%;margin-bottom:32px;${align === "center" ? "margin-left:auto;margin-right:auto;margin-top:8px;" :
        align === "right" ? "margin-left:auto;margin-right:0;margin-top:8px;" : "margin-top:8px;"
      }`;
    return ["img", { ...rest, alt, "data-align": align, "data-width": width, style }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

interface TiptapEditorProps {
  content: object;
  onChange: (json: object, html: string) => void;
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active ? "bg-[#F15C20] text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

const PRESET_COLORS = [
  "#111827", "#374151", "#6B7280", "#D1D5DB", "#ffffff",
  "#dc2626", "#F15C20", "#eab308", "#22c55e", "#3b82f6",
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#0ea5e9",
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const isFirstRender = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<any>(null);

  const [uploading, setUploading] = useState(false);
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  // Force re-render on selection change so inTable detection is live
  const [, setSelTick] = useState(0);

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(false);
  const [linkNofollow, setLinkNofollow] = useState(false);
  const linkBtnRef = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        validate: (href) => true, // Accept any URL including internal relative paths
        HTMLAttributes: { target: null, rel: null, class: null },
      }),
      CustomImage,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontSize,
      Color,
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CTABannerNode,
    ],
    content: Object.keys(content).length > 0 ? content : "",
    onUpdate({ editor }) {
      onChange(editor.getJSON(), editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[400px] focus:outline-none px-1 text-gray-900",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming && Object.keys(content).length > 0) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Bulletproof state synchronization for toolbar updates
  useEffect(() => {
    if (!editor) return;
    const handleTransaction = () => {
      setSelTick((t) => t + 1);
    };
    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor]);

  // Close color panel on outside click
  useEffect(() => {
    if (!colorPanelOpen) return;
    function handler(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as globalThis.Node)) {
        setColorPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorPanelOpen]);

  // Close link popover on outside click
  useEffect(() => {
    if (!linkPopoverOpen) return;
    function handler(e: MouseEvent) {
      if (linkBtnRef.current && !linkBtnRef.current.parentElement?.contains(e.target as globalThis.Node)) {
        setLinkPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [linkPopoverOpen]);

  if (!editor) return null;

  // ── Link ──────────────────────────────────────────────────────────────────
  function handleLinkButtonClick() {
    if (editor!.isActive("link")) {
      // Cursor is on an existing link → show popover (open/edit)
      setLinkPopoverOpen((v) => !v);
    } else {
      // No existing link → open add-link dialog
      setLinkUrl("");
      setLinkNewTab(false);
      setLinkNofollow(false);
      setLinkDialogOpen(true);
    }
  }

  function openEditDialog() {
    const attrs = editor!.getAttributes("link");
    setLinkUrl(attrs.href ?? "");
    setLinkNewTab(attrs.target === "_blank");
    const rel: string = attrs.rel ?? "";
    setLinkNofollow(rel.includes("nofollow"));
    setLinkPopoverOpen(false);
    setLinkDialogOpen(true);
  }

  function openExternalLink() {
    const attrs = editor!.getAttributes("link");
    const href = attrs.href;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    setLinkPopoverOpen(false);
  }

  function applyLink() {
    if (linkUrl.trim()) {
      const relParts = ["noopener", "noreferrer"];
      if (linkNofollow) relParts.push("nofollow");
      editor!
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href: linkUrl.trim(),
          target: linkNewTab ? "_blank" : null,
          rel: relParts.join(" "),
        } as any)
        .run();
    } else {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkDialogOpen(false);
  }

  // ── Color ─────────────────────────────────────────────────────────────────
  function openColorPanel() {
    // Save current selection so it can be restored when applying color
    savedSelection.current = editor!.state.selection;
    setColorPanelOpen((v) => !v);
  }

  function applyColor(color: string) {
    setColorPanelOpen(false);
    editor!.chain().focus().setColor(color).run();
  }

  function clearColor() {
    setColorPanelOpen(false);
    editor!.chain().focus().unsetColor().run();
  }

  // ── Image ────────────────────────────────────────────────────────────────
  async function handleImageFile(file: File) {
    if (!file) return;
    const altFromFilename = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      editor!.chain().focus().setImage({ src: url, alt: altFromFilename } as any).run();
    }
  }

  // ── CTA Banner ────────────────────────────────────────────────────────────
  function insertBanner() {
    editor!
      .chain()
      .focus()
      .insertContent({ type: "ctaBanner", attrs: { ...DEFAULT_CTA } })
      .run();
  }

  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const currentColor: string = editor.getAttributes("textStyle")?.color ?? "";
  const currentFontSize: string = editor.getAttributes("textStyle")?.fontSize ?? "";

  // Reliable table detection: walk ancestor nodes from cursor
  const inTable = (() => {
    const { $from } = editor.state.selection;
    for (let d = $from.depth; d > 0; d--) {
      const name = $from.node(d).type.name;
      if (name === "tableCell" || name === "tableHeader") return true;
    }
    return false;
  })();

  return (
    <div className="border border-gray-200 rounded-xl bg-white h-full flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />

      {/* Toolbar — always visible at top, never scrolls */}
      <div className="shrink-0 flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl z-10">

        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <MdUndo size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <MdRedo size={16} />
        </ToolbarButton>

        <Divider />

        {/* Headings H2–H6 */}
        {([2, 3, 4, 5, 6] as const).map((level) => (
          <ToolbarButton
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            active={editor.isActive("heading", { level })}
            title={`Heading ${level}`}
          >
            <span className="text-xs font-medium">H{level}</span>
          </ToolbarButton>
        ))}

        <Divider />

        {/* Font size */}
        <select
          value={currentFontSize}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (!e.target.value) {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
          }}
          title="Font size"
          className="h-7 px-1 text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-[#F15C20] cursor-pointer"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Text color */}
        <div ref={colorPickerRef} className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); openColorPanel(); }}
            title="Text color"
            className="flex flex-col items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-bold leading-none">A</span>
            <span
              className="block h-1 w-4 rounded-sm mt-0.5"
              style={{ background: currentColor || "#374151" }}
            />
          </button>
          {colorPanelOpen && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 w-52">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyColor(c); }}
                    style={{
                      background: c,
                      border: c === currentColor ? "2px solid #F15C20" : c === "#ffffff" ? "1px solid #e5e7eb" : "none",
                    }}
                    className="w-7 h-7 rounded-md transition-transform hover:scale-110"
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 shrink-0">Custom:</label>
                <input
                  type="color"
                  defaultValue={currentColor || "#374151"}
                  onInput={(e) => applyColor((e.target as HTMLInputElement).value)}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); clearColor(); }}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-700"
                  title="Remove color"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <FiBold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <FiItalic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <FiUnderline size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <MdStrikethroughS size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <FiCode size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          <MdFormatClear size={14} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <FiList size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
          <MdFormatListNumbered size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <MdFormatQuote size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <span className="text-xs font-mono">{"</>"}</span>
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <FiAlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <FiAlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <FiAlignRight size={14} />
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        <div className="relative">
          <button
            ref={linkBtnRef}
            type="button"
            onClick={(e) => { e.preventDefault(); handleLinkButtonClick(); }}
            title={editor.isActive("link") ? "Open / edit link" : "Insert link"}
            className={`p-1.5 rounded text-sm transition-colors ${editor.isActive("link") ? "bg-[#F15C20] text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <FiLink size={14} />
          </button>
          {/* Link popover — shown when cursor is on an existing link */}
          {linkPopoverOpen && editor.isActive("link") && (
            <div
              className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
              style={{ minWidth: 180 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 text-xs text-gray-400 truncate border-b border-gray-100 max-w-[200px]">
                {editor.getAttributes("link").href}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); openExternalLink(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiExternalLink size={13} />
                Open link
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); openEditDialog(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiEdit2 size={13} />
                Edit link
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setLinkPopoverOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <FiTrash2 size={13} />
                Remove link
              </button>
            </div>
          )}
        </div>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Upload image" active={uploading}>
          <FiImage size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table">
          <MdTableChart size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={insertBanner} title="Insert CTA banner">
          <span className="text-xs font-bold">CTA</span>
        </ToolbarButton>

        {/* Table controls — visible when cursor is inside a table cell */}
        {inTable && (
          <>
            <Divider />
            <span className="text-xs text-gray-400 px-1 select-none">Table:</span>
            <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above">
              <span className="text-[10px] font-bold leading-none">+R↑</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">
              <span className="text-[10px] font-bold leading-none">+R↓</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
              <span className="text-[10px] font-bold leading-none text-red-500">−R</span>
            </ToolbarButton>
            <Divider />
            <ToolbarButton
              onClick={() => {
                // Max 10 columns
                const { selection, doc } = editor.state;
                const table = doc.resolve(selection.from).node(-1);
                const currentCols = table?.firstChild?.childCount ?? 0;
                if (currentCols < 10) editor.chain().focus().addColumnBefore().run();
              }}
              title="Add column left (max 10)"
            >
              <span className="text-[10px] font-bold leading-none">+C←</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                const { selection, doc } = editor.state;
                const table = doc.resolve(selection.from).node(-1);
                const currentCols = table?.firstChild?.childCount ?? 0;
                if (currentCols < 10) editor.chain().focus().addColumnAfter().run();
              }}
              title="Add column right (max 10)"
            >
              <span className="text-[10px] font-bold leading-none">+C→</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
              <span className="text-[10px] font-bold leading-none text-red-500">−C</span>
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
              <span className="text-[10px] font-bold leading-none text-red-500">Del Table</span>
            </ToolbarButton>
          </>
        )}

      </div>

      {/* Editor area — scrolls independently */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
        <EditorContent
          editor={editor}
          ref={(el) => {
            if (!el) return;
            const node = el as unknown as HTMLDivElement;
            if ((node as any).__linkGuard) return;
            (node as any).__linkGuard = true;
            node.addEventListener("click", (e) => {
              const a = (e.target as HTMLElement).closest("a");
              if (a) {
                e.preventDefault();
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                  window.open(a.href, "_blank");
                }
              }
            }, { capture: true });
          }}
        />
      </div>

      {/* Word count */}
      <div className="shrink-0 px-5 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl text-xs text-gray-400">
        {wordCount} word{wordCount !== 1 ? "s" : ""}
      </div>

      {/* ── Link Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              placeholder="https://example.com"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
            />
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="accent-[#F15C20]"
                />
                Open in new tab
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkNofollow}
                  onChange={(e) => setLinkNofollow(e.target.checked)}
                  className="accent-[#F15C20]"
                />
                No follow <span className="text-xs text-gray-400">(adds rel=&quot;nofollow&quot;)</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <button type="button" className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              }
            />
            <button type="button" onClick={applyLink}
              className="px-4 py-2 text-sm font-medium bg-[#F15C20] hover:bg-[#d94d17] text-white rounded-lg transition-colors">
              Apply
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
