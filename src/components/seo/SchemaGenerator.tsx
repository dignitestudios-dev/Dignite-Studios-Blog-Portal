"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FiCopy, FiCheck } from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";

// ─── Google "G" SVG ─────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ─── JSON syntax highlight ────────────────────────────────────────────────────

function JsonHighlight({ json }: { json: string }) {
  const html = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"([^"]+)":/g, '<span style="color:#7dd3fc">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#86efac">"$1"</span>')
    .replace(/: (true|false)\b/g, ': <span style="color:#fb923c">$1</span>')
    .replace(/: null\b/g, ': <span style="color:#f87171">null</span>');
  return (
    <pre
      className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Schema builder ───────────────────────────────────────────────────────────

interface SchemaFields {
  articleType: "Article" | "NewsArticle" | "BlogPosting";
  headline: string;
  url: string;
  imageUrl: string;
  description: string;
  authorType: "Person" | "Organization";
  authorName: string;
  authorUrl: string;
  publisher: string;
  publisherLogoUrl: string;
  datePublished: string;
  dateModified: string;
}

const EMPTY_FIELDS: SchemaFields = {
  articleType: "Article",
  headline: "",
  url: "",
  imageUrl: "",
  description: "",
  authorType: "Person",
  authorName: "",
  authorUrl: "",
  publisher: "Dignite Studios",
  publisherLogoUrl: "https://dignitestudios.com/logo.png",
  datePublished: "",
  dateModified: "",
};

function buildSchema(f: SchemaFields): Record<string, unknown> {
  const s: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": f.articleType || "Article",
  };
  if (f.headline) s.headline = f.headline;
  if (f.url) {
    s.url = f.url;
    s.mainEntityOfPage = { "@type": "WebPage", "@id": f.url };
  }
  if (f.imageUrl) s.image = f.imageUrl;
  if (f.description) s.description = f.description;
  if (f.authorName) {
    const author: Record<string, string> = { "@type": f.authorType, name: f.authorName };
    if (f.authorUrl) author.url = f.authorUrl;
    s.author = author;
  }
  if (f.publisher) {
    const pub: Record<string, unknown> = { "@type": "Organization", name: f.publisher };
    if (f.publisherLogoUrl) pub.logo = { "@type": "ImageObject", url: f.publisherLogoUrl };
    s.publisher = pub;
  }

  const toIsoDate = (d?: string) => {
    if (!d) return undefined;
    try {
      const dateObj = new Date(d);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    } catch {}
    return d;
  };

  const pubDate = toIsoDate(f.datePublished);
  if (pubDate) s.datePublished = pubDate;
  
  const modDate = toIsoDate(f.dateModified);
  if (modDate) s.dateModified = modDate;
  
  return s;
}

// ─── SField (module scope — must NOT be defined inside the component) ─────────

function SField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
        {hint && <span className="ml-2 font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SchemaGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (jsonLd: string) => void;
  initialJsonLd?: string;
  postTitle?: string;
  postSlug?: string;
  featuredImageUrl?: string;
  excerpt?: string;
  authorName?: string;
  focusKeyword?: string;
  contentHtml?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SchemaGenerator({
  open,
  onOpenChange,
  onSave,
  initialJsonLd,
  postTitle = "",
  postSlug = "",
  featuredImageUrl = "",
  excerpt = "",
  authorName = "",
  focusKeyword = "",
  contentHtml = "",
  createdAt = "",
  updatedAt = "",
}: SchemaGeneratorProps) {
  const websiteUrl = "https://dignitestudios.com";

  function initFields(): SchemaFields {
    const getFormatDate = (val?: string) => {
      if (!val) return "";
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    if (initialJsonLd) {
      try {
        const p = JSON.parse(initialJsonLd);
        return {
          articleType: p["@type"] ?? "Article",
          headline: p.headline ?? postTitle,
          url: p.url ?? (postSlug ? `${websiteUrl}/blog/${postSlug}` : ""),
          imageUrl: (typeof p.image === "string" ? p.image : p.image?.url) ?? featuredImageUrl,
          description: p.description ?? excerpt,
          authorType: p.author?.["@type"] ?? "Person",
          authorName: p.author?.name ?? authorName,
          authorUrl: p.author?.url ?? "",
          publisher: p.publisher?.name ?? "Dignite Studios",
          publisherLogoUrl: p.publisher?.logo?.url ?? "https://dignitestudios.com/logo.png",
          datePublished: getFormatDate(p.datePublished || createdAt),
          dateModified: getFormatDate(p.dateModified || updatedAt),
        };
      } catch { /* fall through */ }
    }
    return {
      ...EMPTY_FIELDS,
      headline: postTitle,
      url: postSlug ? `${websiteUrl}/blog/${postSlug}` : "",
      imageUrl: featuredImageUrl,
      description: excerpt,
      authorName,
      datePublished: getFormatDate(createdAt),
      dateModified: getFormatDate(updatedAt),
    };
  }

  const [fields, setFields] = useState<SchemaFields>(EMPTY_FIELDS);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [googleMenuOpen, setGoogleMenuOpen] = useState(false);
  const googleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setFields(initFields());
  }, [open]);

  useEffect(() => {
    if (!googleMenuOpen) return;
    function handler(e: MouseEvent) {
      if (googleMenuRef.current && !googleMenuRef.current.contains(e.target as globalThis.Node)) {
        setGoogleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [googleMenuOpen]);

  const schema = useMemo(() => buildSchema(fields), [fields]);
  const jsonStr = useMemo(() => JSON.stringify(schema, null, 2), [schema]);

  function set<K extends keyof SchemaFields>(key: K) {
    return (value: SchemaFields[K]) => setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function generateWithAI() {
    setAiLoading(true);
    try {
      const { data } = await axios.post("/api/ai/generate-seo", {
        title: postTitle || fields.headline,
        excerpt,
        contentText: contentHtml,
        focusKeyword,
        field: "schema",
      });
      setFields((prev) => ({
        ...prev,
        description: data.description ?? prev.description,
        headline: data.headline ?? prev.headline,
      }));
    } catch { /* silent */ }
    setAiLoading(false);
  }

  async function copyToClipboard() {
    const full = `<script type="application/ld+json">\n${jsonStr}\n<\/script>`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20] transition-colors bg-white";
  const selectCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20] bg-white transition-colors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[92vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span>⚙️</span> JSON-LD Schema Generator
              <span className="text-xs font-normal text-gray-400 ml-1">(Article / BlogPosting)</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={generateWithAI}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F15C20] hover:bg-[#d94d17] text-white rounded-lg transition-colors disabled:opacity-60"
              >
                <MdAutoAwesome size={13} />
                {aiLoading ? "Generating…" : "AI Fill Fields"}
              </button>
              <button
                onClick={() => { onSave(jsonStr); onOpenChange(false); }}
                className="px-4 py-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Save Schema
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 border-r border-gray-100">
            <SField label="Article @type">
              <select value={fields.articleType} onChange={(e) => set("articleType")(e.target.value as SchemaFields["articleType"])} className={selectCls}>
                <option value="Article">Article</option>
                <option value="NewsArticle">NewsArticle</option>
                <option value="BlogPosting">BlogPosting</option>
              </select>
            </SField>

            <SField label="Headline" hint={`${fields.headline.length} / 110`}>
              <input
                value={fields.headline}
                onChange={(e) => set("headline")(e.target.value)}
                maxLength={110}
                placeholder="Post headline"
                className={inputCls}
              />
            </SField>

            <SField label="URL">
              <input
                value={fields.url}
                onChange={(e) => set("url")(e.target.value)}
                placeholder="https://dignitestudios.com/blog/..."
                className={inputCls}
              />
            </SField>

            <SField label="Image URL">
              <input
                value={fields.imageUrl}
                onChange={(e) => set("imageUrl")(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </SField>

            <SField label="Description">
              <textarea
                value={fields.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={3}
                placeholder="Short description of the article…"
                className={`${inputCls} resize-none`}
              />
            </SField>

            <div className="grid grid-cols-3 gap-3">
              <SField label="Author @type">
                <select value={fields.authorType} onChange={(e) => set("authorType")(e.target.value as SchemaFields["authorType"])} className={selectCls}>
                  <option value="Person">Person</option>
                  <option value="Organization">Organization</option>
                </select>
              </SField>
              <SField label="Author Name">
                <input value={fields.authorName} onChange={(e) => set("authorName")(e.target.value)} placeholder="Author" className={inputCls} />
              </SField>
              <SField label="Author URL">
                <input value={fields.authorUrl} onChange={(e) => set("authorUrl")(e.target.value)} placeholder="https://..." className={inputCls} />
              </SField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SField label="Publisher Name">
                <input value={fields.publisher} onChange={(e) => set("publisher")(e.target.value)} placeholder="Organization" className={inputCls} />
              </SField>
              <SField label="Publisher Logo URL">
                <input value={fields.publisherLogoUrl} onChange={(e) => set("publisherLogoUrl")(e.target.value)} placeholder="https://..." className={inputCls} />
              </SField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SField label="Date Published">
                <input type="date" value={fields.datePublished} onChange={(e) => set("datePublished")(e.target.value)} className={inputCls} />
              </SField>
              <SField label="Date Modified">
                <input type="date" value={fields.dateModified} onChange={(e) => set("dateModified")(e.target.value)} className={inputCls} />
              </SField>
            </div>

            {/* References */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Schema.org references:</p>
                <div className="space-y-1">
                  {["Article", "NewsArticle", "BlogPosting"].map((t) => (
                    <a key={t} href={`https://schema.org/${t}`} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 hover:underline">
                      {t}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Google's documentation:</p>
                <a href="https://developers.google.com/search/docs/appearance/structured-data/article" target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 hover:underline">
                  Article
                </a>
              </div>
            </div>
          </div>

          {/* Right: Live JSON-LD Preview */}
          <div className="w-[48%] bg-[#0d1117] flex flex-col">
            {/* Preview bar */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-[#161b22] flex-shrink-0">
              <span className="text-xs text-pink-400 font-mono">
                &lt;script type=&quot;application/ld+json&quot;&gt;
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  title={copied ? "Copied!" : "Copy script tag"}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  {copied ? <FiCheck size={12} className="text-green-400" /> : <FiCopy size={12} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                {/* Google dropdown */}
                <div ref={googleMenuRef} className="relative">
                  <button
                    onClick={() => setGoogleMenuOpen((v) => !v)}
                    title="Test with Google"
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:shadow-lg transition-shadow p-1.5"
                  >
                    <GoogleIcon />
                  </button>
                  {googleMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <a
                        href="https://search.google.com/test/rich-results"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setGoogleMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4] shrink-0" />
                        Rich Results Test
                      </a>
                      <div className="h-px bg-gray-100 mx-4" />
                      <a
                        href="https://validator.schema.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setGoogleMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#34A853] shrink-0" />
                        Structured Data Testing Tool
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Code */}
            <div className="flex-1 overflow-auto p-4 text-gray-300">
              <JsonHighlight json={jsonStr} />
              <p className="text-pink-400 font-mono text-xs mt-2">&lt;/script&gt;</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
