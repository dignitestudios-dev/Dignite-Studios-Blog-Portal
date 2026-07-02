"use client";
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import dynamic from "next/dynamic";
const EditorJsComponent = dynamic(() => import("@/components/editor/EditorJsComponent"), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center border border-gray-200 rounded-xl bg-gray-50"><p className="text-gray-500">Loading editor...</p></div>
});
import { CategorySelect } from "@/components/editor/CategorySelect";
import { FeaturedImageUpload } from "@/components/editor/FeaturedImageUpload";
import { SeoData } from "@/components/seo/SeoSidebar";
import { SeoDialog } from "@/components/seo/SeoDialog";
import { SeoScoreWidget } from "@/components/seo/SeoScoreWidget";
import { useSeoAnalysis } from "@/hooks/useSeoAnalysis";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  FiTag, FiClock, FiUser, FiImage, FiBarChart2,
  FiSend, FiFileText, FiCheck, FiEye, FiSearch,
} from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";

const DEFAULT_SEO: SeoData = {
  focusKeyword: "",
  seoTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  twitterCard: "summary_large_image",
  canonicalUrl: "",
  robots: { index: true, follow: true },
  jsonLd: "",
};

interface PostEditorProps {
  initialPost?: Record<string, unknown>;
  postId?: string;
}

export function PostEditor({ initialPost, postId }: PostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const createdAt = (initialPost?.createdAt as string) || new Date().toISOString();
  const updatedAt = (initialPost?.updatedAt as string) || new Date().toISOString();

  // Post fields
  const [title, setTitle] = useState((initialPost?.title as string) ?? "");
  const [slug, setSlug] = useState((initialPost?.slug as string) ?? "");
  const [content, setContent] = useState<object>((initialPost?.content as object) ?? {});
  const [contentHtml, setContentHtml] = useState((initialPost?.contentHtml as string) ?? "");
  const [excerpt, setExcerpt] = useState((initialPost?.excerpt as string) ?? "");
  const [categories, setCategories] = useState<string[]>((initialPost?.categories as string[]) ?? []);
  const [tags, setTags] = useState((initialPost?.tags as string[])?.join(", ") ?? "");
  const [author, setAuthor] = useState<{ name: string; avatar: string }>(
    (initialPost?.author as { name: string; avatar: string }) ?? { name: "", avatar: "" }
  );
  const [featuredImage, setFeaturedImage] = useState<{ url: string; alt: string }>(
    (initialPost?.featuredImage as { url: string; alt: string }) ?? { url: "", alt: "" }
  );
  const [status, setStatus] = useState<"draft" | "published">(
    (initialPost?.status === "scheduled" ? "draft" : initialPost?.status as "draft" | "published") ?? "draft"
  );
  const [seo, setSeo] = useState<SeoData>({
    ...DEFAULT_SEO,
    ...((initialPost?.seo as Partial<SeoData>) ?? {}),
    robots: {
      index: (initialPost?.seo as { robots?: { index: boolean } })?.robots?.index ?? true,
      follow: (initialPost?.seo as { robots?: { follow: boolean } })?.robots?.follow ?? true,
    },
  });

  // Blog statistics (live computed)
  const stats = useMemo(() => {
    const text = contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const paragraphs = (contentHtml.match(/<p[\s>]/gi) ?? []).length;
    const headings = (contentHtml.match(/<h[1-6][\s>]/gi) ?? []).length;
    return { words, chars, paragraphs, headings };
  }, [contentHtml]);

  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [timeSinceSave, setTimeSinceSave] = useState<string>("");

  const [readTimeOverride, setReadTimeOverride] = useState<number | null>(null);
  // Better read-time: 238 WPM + 12s per image + 30s per code block
  const autoReadTime = useMemo(() => {
    const images = (contentHtml.match(/<img[\s>]/gi) ?? []).length;
    const codeBlocks = (contentHtml.match(/<pre[\s>]/gi) ?? []).length;
    const mins = stats.words / 265 + (images * 10) / 60 + (codeBlocks * 20) / 60;
    return Math.max(1, Math.ceil(mins));
  }, [stats.words, contentHtml]);
  const readTime = readTimeOverride ?? autoReadTime;

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      setSlug(slugify(title, { lower: true, strict: true }));
    }
  }, [title]);

  // Auto-fill SEO title from post title
  useEffect(() => {
    if (!seo.seoTitle && title) {
      setSeo((prev) => ({ ...prev, seoTitle: title }));
    }
  }, [title]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleContentChange = useCallback((json: object, html: string) => {
    setContent(json);
    setContentHtml(html);
  }, []);

  const analysis = useSeoAnalysis({
    title,
    slug,
    contentHtml,
    excerpt,
    focusKeyword: seo.focusKeyword,
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    featuredImageUrl: featuredImage.url,
    featuredImageAlt: featuredImage.alt,
  });

  const [excerptAiLoading, setExcerptAiLoading] = useState(false);
  async function generateExcerpt() {
    if (!title.trim()) return;
    setExcerptAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          contentText: contentHtml,
          focusKeyword: seo.focusKeyword,
          field: "excerpt",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate excerpt");
      if (data.excerpt) setExcerpt(data.excerpt);
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to generate excerpt.", type: "error" });
    } finally {
      setExcerptAiLoading(false);
    }
  }

  const buildPayload = useCallback((overrideStatus?: "draft" | "published") => {
    const finalStatus = overrideStatus ?? status;
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://dignitestudios.com";
    const canonical = seo.canonicalUrl || `${websiteUrl}/blog/${slug}`;

    return {
      title,
      slug,
      content,
      contentHtml,
      excerpt,
      featuredImage,
      categories,
      tags: tagsArray,
      author,
      status: finalStatus,
      publishedAt: finalStatus === "published" ? new Date().toISOString() : null,
      scheduledAt: null,
      readTime,
      seo: {
        ...seo,
        canonicalUrl: canonical,
        seoScore: analysis.seoScore,
        readabilityScore: analysis.readabilityScore,
        seoChecks: analysis.checks,
      },
    };
  }, [title, slug, content, contentHtml, excerpt, featuredImage, categories, tags, author, status, readTime, seo, analysis]);

  const save = useCallback(async (overrideStatus?: "draft" | "published", isAutoSave = false) => {
    if (!title.trim()) {
      if (!isAutoSave) setToast({ msg: "Please add a title before saving.", type: "error" });
      return;
    }
    if (!featuredImage.url.trim()) {
      if (!isAutoSave) setToast({ msg: "Featured image is required.", type: "error" });
      return;
    }
    
    if (isAutoSave) setAutoSaving(true);
    else setSaving(true);
    
    const payload = buildPayload(overrideStatus);

    const res = postId
      ? await fetch(`/api/posts/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (isAutoSave) setAutoSaving(false);
    else setSaving(false);

    if (res.ok) {
      const data = await res.json();
      setLastSavedAt(new Date());
      if (!isAutoSave) {
        setToast({ msg: `Post ${overrideStatus === "published" ? "published" : "saved"}!`, type: "success" });
      }
      if (!postId) {
        router.replace(`/dashboard/posts/${data._id}`);
      }
    } else {
      if (!isAutoSave) {
        setToast({ msg: "Failed to save. Please try again.", type: "error" });
      }
    }
  }, [title, featuredImage.url, buildPayload, postId, router]);

  const latestSave = useRef(save);
  const latestTitle = useRef(title);
  const latestFeaturedImage = useRef(featuredImage.url);

  useEffect(() => {
    latestSave.current = save;
    latestTitle.current = title;
    latestFeaturedImage.current = featuredImage.url;
  }, [save, title, featuredImage.url]);

  // Auto-save interval every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-save if title and featured image are present
      if (latestTitle.current.trim() && latestFeaturedImage.current.trim()) {
        latestSave.current("draft", true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update time since save text every second
  useEffect(() => {
    if (!lastSavedAt) return;
    
    const updateText = () => {
      const diff = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
      if (diff < 5) setTimeSinceSave("Saved just now");
      else if (diff < 60) setTimeSinceSave(`Saved ${diff} seconds ago`);
      else setTimeSinceSave(`Saved ${Math.floor(diff / 60)} minutes ago`);
    };
    
    updateText();
    const interval = setInterval(updateText, 1000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  const statusColors: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-amber-100 text-amber-700",
  };

  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://dignitestudios.com";
  const previewUrl = `${websiteUrl}/blog/${slug || "preview"}`;

  return (
    <div className="h-screen flex flex-col bg-[#f4f5f7] overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-6 gap-4">
        <button
          onClick={() => router.push("/dashboard/posts")}
          className="text-sm text-gray-400 hover:text-gray-800 transition-colors shrink-0"
        >
          ← All Posts
        </button>
        <span className="text-gray-200">|</span>
        <p className="text-sm font-medium text-gray-700 truncate min-w-0 flex-1">
          {title || <span className="text-gray-300">Untitled</span>}
        </p>

        <div className="hidden md:flex items-center gap-3 text-xs text-gray-400 shrink-0">
          {(autoSaving || timeSinceSave) && (
            <>
              <span className="text-gray-400 italic">
                {autoSaving ? "Saving..." : timeSinceSave}
              </span>
              <span className="text-gray-200">·</span>
            </>
          )}
          <span>{stats.words.toLocaleString()} words</span>
          <span className="text-gray-200">·</span>
          <span>{readTime} min read</span>
          <span className="text-gray-200">·</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status]}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => save("draft")}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </header>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <button
          onClick={() => setToast(null)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg cursor-pointer ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-[#EF3C36] text-white"
          }`}
        >
          {toast.type === "success" && <FiCheck size={15} />}
          {toast.msg}
        </button>
      )}

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 xl:grid-cols-[1fr_376px] gap-0 px-0 py-0">

        {/* ── Writing Area — flex column so toolbar is always visible ─── */}
        <div className="flex flex-col min-h-0 overflow-hidden min-w-0">
          {/* Title + Slug — always visible, never scrolls away */}
          <div className="shrink-0 px-6 pt-5 pb-2 space-y-2 bg-[#f4f5f7]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post Title"
              className="w-full text-[2.4rem] font-bold text-gray-900 placeholder-gray-200 bg-transparent border-none outline-none leading-tight tracking-tight"
            />
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 font-mono select-none">/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
                className="text-[#F15C20] bg-transparent border-none outline-none font-mono text-sm flex-1 min-w-0 border-b border-transparent hover:border-gray-300 focus:border-[#F15C20] transition-colors pb-0.5"
              />
            </div>
          </div>

          {/* Editor card — fills remaining height, toolbar inside always visible */}
          <div className="flex-1 min-h-0 px-6 pb-5 pt-3 overflow-hidden">
            <div className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <EditorJsComponent content={content} onChange={handleContentChange} />
            </div>
          </div>
        </div>

        {/* ── Right Sidebar (independent scroll) ─── */}
        <div className="overflow-y-auto min-h-0 px-4 py-6 pb-8 space-y-3 border-l border-gray-200 bg-[#f4f5f7]">

          {/* Featured Image — fixed */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <SidebarHeader icon={<FiImage size={13} />} title="Featured Image" />
            <FeaturedImageUpload
              url={featuredImage.url}
              alt={featuredImage.alt}
              onUrlChange={(url) => setFeaturedImage((prev) => ({
                url,
                alt: url ? title : "",
              }))}
              onAltChange={(alt) => setFeaturedImage((prev) => ({ ...prev, alt }))}
            />
          </div>

          {/* Publish — fixed */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
            <SidebarHeader icon={<FiSend size={13} />} title="Publish" />

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20] bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => save(status)}
                disabled={saving}
                className="w-full py-2 bg-[#F15C20] hover:bg-[#d94d17] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {slug && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiEye size={13} />
                  Preview
                </a>
              )}
            </div>
          </div>

          {/* Statistics — fixed */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <SidebarHeader icon={<FiBarChart2 size={13} />} title="Statistics" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatCard label="Words" value={stats.words.toLocaleString()} />
              <StatCard label="Characters" value={stats.chars.toLocaleString()} />
              <StatCard label="Paragraphs" value={stats.paragraphs.toString()} />
              <StatCard label="Headings" value={stats.headings.toString()} />
            </div>

            {/* Read time — inline editable */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#fff7f4] border border-[#F15C20]/20 rounded-xl">
              <div className="flex items-center gap-2">
                <FiClock size={13} className="text-[#F15C20]" />
                <span className="text-xs font-medium text-gray-700">Read Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={readTimeOverride ?? autoReadTime}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setReadTimeOverride(!isNaN(v) && v > 0 ? v : null);
                  }}
                  className="w-10 bg-transparent outline-none text-sm font-bold text-center text-gray-800 border-b-2 border-transparent focus:border-[#F15C20] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-gray-500">min</span>
                {readTimeOverride !== null && (
                  <button
                    onClick={() => setReadTimeOverride(null)}
                    className="text-[10px] text-[#F15C20] hover:text-[#d94d17] underline ml-0.5"
                  >
                    auto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Post Details + Taxonomy + SEO Analysis — collapsible, all closed by default */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <Accordion multiple defaultValue={[]}>
              <AccordionItem value="details" className="border-b border-gray-200">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-800 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FiFileText size={13} className="text-[#F15C20]" />
                    Post Details
                  </div>
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline [&_p]:mb-0">
                  <div className="px-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <label className="block text-xs font-medium text-gray-500">Excerpt / Summary</label>
                          <span className={`text-[10px] font-medium ${excerpt.length > 150 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {excerpt.length} / 160
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={generateExcerpt}
                          disabled={excerptAiLoading || !title.trim()}
                          title="Generate summary with AI"
                          className="flex items-center gap-1 text-xs text-[#F15C20] hover:text-[#d94d17] disabled:opacity-40 transition-colors"
                        >
                          <MdAutoAwesome size={13} className={excerptAiLoading ? "animate-spin" : ""} />
                          {excerptAiLoading ? "Generating…" : "AI Generate"}
                        </button>
                      </div>
                      <textarea
                        value={excerpt}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 160) setExcerpt(val);
                        }}
                        maxLength={160}
                        rows={3}
                        placeholder="Short summary shown in blog cards…"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        <FiUser className="inline mr-1" size={11} />
                        Author
                      </label>
                      <input
                        type="text"
                        value={author.name}
                        onChange={(e) => setAuthor((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Author name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="taxonomy" className="border-b border-gray-200">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-800 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FiTag size={13} className="text-[#F15C20]" />
                    Categories &amp; Tags
                  </div>
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline [&_p]:mb-0">
                  <div className="px-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Categories</label>
                      <CategorySelect selected={categories} onChange={setCategories} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Tags</label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="seo, marketing, nextjs (comma-separated)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="seo-analysis">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-800 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FiSearch size={13} className="text-[#F15C20]" />
                    SEO Analysis
                    {analysis.seoScore > 0 && (
                      <span className={`ml-auto mr-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        analysis.seoScore >= 70 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : analysis.seoScore >= 40 ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-red-100 text-red-600 border-red-200"
                      }`}>{analysis.seoScore}/100</span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline [&_p]:mb-0">
                  <div className="px-4 pb-2">
                    <SeoScoreWidget analysis={analysis} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* SEO — dialog */}
          <SeoDialog
            seo={seo}
            slug={slug}
            analysis={analysis}
            onChange={(partial) => setSeo((prev) => ({ ...prev, ...partial }))}
            postTitle={title}
            postExcerpt={excerpt}
            contentHtml={contentHtml}
            featuredImageUrl={featuredImage.url}
            postSlug={slug}
            authorName={author.name}
            createdAt={createdAt}
            updatedAt={updatedAt}
          />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SidebarHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#F15C20]">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-[10px] uppercase tracking-wide font-medium text-gray-400">{label}</span>
      <span className="text-lg font-bold text-gray-800 leading-none">{value}</span>
    </div>
  );
}
