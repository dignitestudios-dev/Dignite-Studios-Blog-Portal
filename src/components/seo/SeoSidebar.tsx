"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { SeoScoreWidget } from "./SeoScoreWidget";
import { SnippetPreview } from "./SnippetPreview";
import { SchemaGenerator } from "./SchemaGenerator";
import { SeoAnalysis } from "@/hooks/useSeoAnalysis";
import { FiChevronDown, FiChevronUp, FiZap, FiSettings, FiCheck } from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";

export interface SeoData {
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: "summary" | "summary_large_image";
  canonicalUrl: string;
  robots: { index: boolean; follow: boolean };
  jsonLd?: string;
}

interface SeoSidebarProps {
  seo: SeoData;
  slug: string;
  analysis: SeoAnalysis;
  onChange: (seo: Partial<SeoData>) => void;
  postTitle?: string;
  postExcerpt?: string;
  contentHtml?: string;
  featuredImageUrl?: string;
  postSlug?: string;
  authorName?: string;
  layout?: "stack" | "grid";
  createdAt?: string;
  updatedAt?: string;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {title}
        {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
  onAiGenerate,
  aiLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  onAiGenerate?: () => void;
  aiLoading?: boolean;
}) {
  const over = maxLength && value.length > maxLength;
  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
            over
              ? "border-red-400 focus:border-red-400 focus:ring-red-400"
              : "border-gray-200 focus:border-[#F15C20] focus:ring-[#F15C20]"
          } ${onAiGenerate ? "pr-8" : ""}`}
        />
        {onAiGenerate && (
          <button
            type="button"
            onClick={onAiGenerate}
            disabled={aiLoading}
            title="Generate with AI"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F15C20] hover:text-[#d94d17] disabled:opacity-40 transition-colors"
          >
            <MdAutoAwesome size={15} className={aiLoading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
      {maxLength && (
        <p className={`text-xs mt-0.5 text-right ${over ? "text-red-500" : "text-gray-400"}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  onAiGenerate,
  aiLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  onAiGenerate?: () => void;
  aiLoading?: boolean;
}) {
  const over = maxLength && value.length > maxLength;
  return (
    <div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-1 transition-colors ${
            over
              ? "border-red-400 focus:border-red-400 focus:ring-red-400"
              : "border-gray-200 focus:border-[#F15C20] focus:ring-[#F15C20]"
          } ${onAiGenerate ? "pr-8" : ""}`}
        />
        {onAiGenerate && (
          <button
            type="button"
            onClick={onAiGenerate}
            disabled={aiLoading}
            title="Generate with AI"
            className="absolute right-2 top-2 text-[#F15C20] hover:text-[#d94d17] disabled:opacity-40 transition-colors"
          >
            <MdAutoAwesome size={15} className={aiLoading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
      {maxLength && (
        <p className={`text-xs mt-0.5 text-right ${over ? "text-red-500" : "text-gray-400"}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

// ─── Full-page AI Loading Overlay ─────────────────────────────────────────────

function AiLoadingOverlay() {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
    >
      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border border-[#F15C20]/30 animate-ping"
          style={{
            width: 160 + i * 80,
            height: 160 + i * 80,
            animationDelay: `${i * 0.35}s`,
            animationDuration: "1.5s",
          }}
        />
      ))}

      {/* Center orb */}
      <div className="relative flex items-center justify-center w-24 h-24 rounded-full mb-8 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #F15C20, #7c3aed)" }}>
        <MdAutoAwesome size={40} className="text-white animate-spin" style={{ animationDuration: "3s" }} />
      </div>

      <h2 className="text-gray-900 text-xl font-bold mb-2 tracking-tight">Generating SEO Metadata</h2>
      <p className="text-gray-500 text-sm mb-8">Analyzing content with AI…</p>

      {/* Bouncing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#F15C20] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <p className="absolute bottom-8 text-gray-400 text-xs">Powered by OpenRouter AI</p>
    </div>,
    document.body
  );
}

// ─── SeoSidebar ───────────────────────────────────────────────────────────────

export function SeoSidebar({
  seo,
  slug,
  analysis,
  onChange,
  postTitle = "",
  postExcerpt = "",
  contentHtml = "",
  featuredImageUrl = "",
  postSlug = "",
  authorName = "",
  layout = "stack",
  createdAt = "",
  updatedAt = "",
}: SeoSidebarProps) {
  const set = (key: keyof SeoData) => (value: string | boolean | object) => {
    onChange({ [key]: value } as Partial<SeoData>);
  };

  const [aiLoading, setAiLoading] = useState(false);
  const [aiFieldLoading, setAiFieldLoading] = useState<"seoTitle" | "metaDescription" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const actualOgTitle = seo.ogTitle || seo.seoTitle || postTitle;
  const actualOgDescription = seo.ogDescription || seo.metaDescription || postExcerpt;
  const actualOgImage = seo.ogImage || featuredImageUrl;


  async function generateWithAI() {
    if (!postTitle.trim()) {
      setAiError("Add a post title before generating SEO with AI.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const { data } = await axios.post("/api/ai/generate-seo", {
        title: postTitle,
        excerpt: postExcerpt,
        contentText: contentHtml,
        focusKeyword: seo.focusKeyword,
      });
      onChange({
        seoTitle: data.seoTitle ?? seo.seoTitle,
        metaDescription: data.metaDescription ?? seo.metaDescription,
        ogTitle: data.ogTitle ?? seo.ogTitle,
        ogDescription: data.ogDescription ?? seo.ogDescription,
        twitterTitle: data.twitterTitle ?? seo.twitterTitle,
        twitterDescription: data.twitterDescription ?? seo.twitterDescription,
        ...(Array.isArray(data.keywords) && data.keywords.length > 0
          ? { focusKeyword: data.keywords[0] }
          : {}),
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "AI generation failed. Please retry.")
        : "AI generation failed. Please retry.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  async function generateField(field: "seoTitle" | "metaDescription") {
    if (!postTitle.trim()) return;
    setAiFieldLoading(field);
    try {
      const { data } = await axios.post("/api/ai/generate-seo", {
        title: postTitle,
        excerpt: postExcerpt,
        contentText: contentHtml,
        focusKeyword: seo.focusKeyword,
        field,
      });
      if (data[field]) onChange({ [field]: data[field] });
    } catch { /* silent */ }
    setAiFieldLoading(null);
  }

  return (
    <>
      {aiLoading && <AiLoadingOverlay />}

      {schemaOpen && (
        <SchemaGenerator
          open={schemaOpen}
          onOpenChange={setSchemaOpen}
          onSave={(jsonLd) => onChange({ jsonLd })}
          initialJsonLd={seo.jsonLd}
          postTitle={postTitle}
          postSlug={postSlug}
          featuredImageUrl={featuredImageUrl}
          excerpt={postExcerpt}
          authorName={authorName}
          focusKeyword={seo.focusKeyword}
          contentHtml={contentHtml}
          createdAt={createdAt}
          updatedAt={updatedAt}
        />
      )}

      <div className="space-y-3">
        {/* AI Generate — always full-width */}
        <div className="bg-gradient-to-r from-[#F15C20]/10 to-orange-50 border border-[#F15C20]/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                <MdAutoAwesome size={13} className="text-[#F15C20]" />
                AI SEO Generator
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Auto-fill all SEO fields using AI</p>
            </div>
            <button
              onClick={generateWithAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F15C20] hover:bg-[#d94d17] text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              <FiZap size={12} />
              Generate
            </button>
          </div>
          {aiError && (
            <p className="text-xs mt-1.5 px-2 py-1 rounded-md bg-red-50 text-red-600">
              {aiError}
            </p>
          )}
        </div>
      </div>

      {/* Grid or stack layout */}
      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-3 mt-3 items-start">
          {/* Left column: Focus + Snippet + Advanced (always visible) */}
          <div className="space-y-3">
            <Section title="Focus Keyword">
              <Field label="Focus Keyword" hint="The main keyword you want this post to rank for.">
                <Input
                  value={seo.focusKeyword}
                  onChange={set("focusKeyword") as (v: string) => void}
                  placeholder="e.g. digital marketing agency"
                />
              </Field>
            </Section>
            <SnippetPreview seoTitle={seo.seoTitle} metaDescription={seo.metaDescription} slug={slug} />

            {/* Advanced — always visible, not collapsible */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-800">Advanced</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Allow search engines to index</p>
                    <p className="text-xs text-gray-400">meta robots: index / noindex</p>
                  </div>
                  <button onClick={() => onChange({ robots: { ...seo.robots, index: !seo.robots.index } })} className={`w-10 h-5 rounded-full transition-colors ${seo.robots.index ? "bg-[#F15C20]" : "bg-gray-200"}`}>
                    <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${seo.robots.index ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Follow links on this page</p>
                    <p className="text-xs text-gray-400">meta robots: follow / nofollow</p>
                  </div>
                  <button onClick={() => onChange({ robots: { ...seo.robots, follow: !seo.robots.follow } })} className={`w-10 h-5 rounded-full transition-colors ${seo.robots.follow ? "bg-[#F15C20]" : "bg-gray-200"}`}>
                    <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${seo.robots.follow ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
              <Field label="JSON-LD Schema" hint="Article structured data for Google rich results.">
                <button onClick={() => setSchemaOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-[#F15C20] hover:text-[#F15C20] transition-colors">
                  <FiSettings size={14} />
                  {seo.jsonLd ? "Edit JSON-LD Schema" : "Generate JSON-LD Schema"}
                </button>
                {seo.jsonLd && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FiCheck size={12} /> Schema saved
                  </p>
                )}
              </Field>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <Section title="SEO Meta">
              <Field label="SEO Title">
                <Input
                  value={seo.seoTitle}
                  onChange={set("seoTitle") as (v: string) => void}
                  placeholder="Page title for search engines"
                  maxLength={60}
                  onAiGenerate={() => generateField("seoTitle")}
                  aiLoading={aiFieldLoading === "seoTitle"}
                />
              </Field>
              <Field label="Meta Description">
                <Textarea
                  value={seo.metaDescription}
                  onChange={set("metaDescription") as (v: string) => void}
                  placeholder="Write a compelling description to improve click-through rate..."
                  maxLength={160}
                  onAiGenerate={() => generateField("metaDescription")}
                  aiLoading={aiFieldLoading === "metaDescription"}
                />
              </Field>
              <Field label="Meta Keywords" hint="Comma-separated. Ignored by Google but used by Bing, Yandex, Baidu.">
                <Input
                  value={seo.metaKeywords}
                  onChange={set("metaKeywords") as (v: string) => void}
                  placeholder="seo, digital marketing, nextjs"
                />
              </Field>
              <Field label="Canonical URL" hint="Leave blank to use default post URL.">
                <Input
                  value={seo.canonicalUrl}
                  onChange={set("canonicalUrl") as (v: string) => void}
                  placeholder="https://dignitestudios.com/blog/..."
                />
              </Field>
            </Section>

            <Section title="Social Preview (Open Graph)" defaultOpen={false}>
              <Field label="OG Title">
                <Input value={seo.ogTitle} onChange={set("ogTitle") as (v: string) => void} placeholder={seo.seoTitle || postTitle || "Defaults to SEO title"} />
              </Field>
              <Field label="OG Description">
                <Textarea value={seo.ogDescription} onChange={set("ogDescription") as (v: string) => void} placeholder={seo.metaDescription || postExcerpt || "Defaults to meta description"} rows={2} />
              </Field>
              <Field label="OG Image URL" hint="Recommended: 1200×630px">
                <Input value={seo.ogImage} onChange={set("ogImage") as (v: string) => void} placeholder={featuredImageUrl || "https://... or use featured image"} />
              </Field>
              {(actualOgImage || actualOgTitle) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                  {actualOgImage && (
                    <div className="bg-gray-100 h-32 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={actualOgImage} alt="OG preview" className="w-full h-full object-cover" onError={() => {}} />
                    </div>
                  )}
                  <div className="px-3 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-900 truncate">{actualOgTitle}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{actualOgDescription}</p>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide text-[10px]">dignitestudios.com</p>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Twitter Card" defaultOpen={false}>
              <Field label="Card Type">
                <select value={seo.twitterCard} onChange={(e) => onChange({ twitterCard: e.target.value as "summary" | "summary_large_image" })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]">
                  <option value="summary_large_image">Summary with Large Image</option>
                  <option value="summary">Summary</option>
                </select>
              </Field>
              <Field label="Twitter Title">
                <Input value={seo.twitterTitle} onChange={set("twitterTitle") as (v: string) => void} placeholder={actualOgTitle || "Defaults to OG title"} />
              </Field>
              <Field label="Twitter Description">
                <Textarea value={seo.twitterDescription} onChange={set("twitterDescription") as (v: string) => void} placeholder={actualOgDescription || "Defaults to OG description"} rows={2} />
              </Field>
              <Field label="Twitter Image URL">
                <Input value={seo.twitterImage} onChange={set("twitterImage") as (v: string) => void} placeholder={actualOgImage || "Defaults to OG image"} />
              </Field>
            </Section>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt-3">
          <Section title="Focus Keyword">
            <Field label="Focus Keyword" hint="The main keyword you want this post to rank for.">
              <Input
                value={seo.focusKeyword}
                onChange={set("focusKeyword") as (v: string) => void}
                placeholder="e.g. digital marketing agency"
              />
            </Field>
          </Section>

          {/* Snippet Preview */}
          <SnippetPreview seoTitle={seo.seoTitle} metaDescription={seo.metaDescription} slug={slug} />

          {/* SEO Meta */}
          <Section title="SEO Meta">
            <Field label="SEO Title">
              <Input
                value={seo.seoTitle}
                onChange={set("seoTitle") as (v: string) => void}
                placeholder="Page title for search engines"
                maxLength={60}
                onAiGenerate={() => generateField("seoTitle")}
                aiLoading={aiFieldLoading === "seoTitle"}
              />
            </Field>
            <Field label="Meta Description">
              <Textarea
                value={seo.metaDescription}
                onChange={set("metaDescription") as (v: string) => void}
                placeholder="Write a compelling description to improve click-through rate..."
                maxLength={160}
                onAiGenerate={() => generateField("metaDescription")}
                aiLoading={aiFieldLoading === "metaDescription"}
              />
            </Field>
            <Field label="Meta Keywords" hint="Comma-separated. Ignored by Google but used by Bing, Yandex, Baidu.">
              <Input
                value={seo.metaKeywords}
                onChange={set("metaKeywords") as (v: string) => void}
                placeholder="seo, digital marketing, nextjs"
              />
            </Field>
            <Field label="Canonical URL" hint="Leave blank to use default post URL.">
              <Input
                value={seo.canonicalUrl}
                onChange={set("canonicalUrl") as (v: string) => void}
                placeholder="https://dignitestudios.com/blog/..."
              />
            </Field>
          </Section>

          {/* Open Graph */}
          <Section title="Social Preview (Open Graph)" defaultOpen={false}>
            <Field label="OG Title">
              <Input value={seo.ogTitle} onChange={set("ogTitle") as (v: string) => void} placeholder={seo.seoTitle || postTitle || "Defaults to SEO title"} />
            </Field>
            <Field label="OG Description">
              <Textarea value={seo.ogDescription} onChange={set("ogDescription") as (v: string) => void} placeholder={seo.metaDescription || postExcerpt || "Defaults to meta description"} rows={2} />
            </Field>
            <Field label="OG Image URL" hint="Recommended: 1200×630px">
              <Input value={seo.ogImage} onChange={set("ogImage") as (v: string) => void} placeholder={featuredImageUrl || "https://... or use featured image"} />
            </Field>
            {(actualOgImage || actualOgTitle) && (
              <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                {actualOgImage && (
                  <div className="bg-gray-100 h-32 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={actualOgImage} alt="OG preview" className="w-full h-full object-cover" onError={() => {}} />
                  </div>
                )}
                <div className="px-3 py-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-900 truncate">{actualOgTitle}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{actualOgDescription}</p>
                  <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide text-[10px]">dignitestudios.com</p>
                </div>
              </div>
            )}
          </Section>

          {/* Twitter Card */}
          <Section title="Twitter Card" defaultOpen={false}>
            <Field label="Card Type">
              <select value={seo.twitterCard} onChange={(e) => onChange({ twitterCard: e.target.value as "summary" | "summary_large_image" })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]">
                <option value="summary_large_image">Summary with Large Image</option>
                <option value="summary">Summary</option>
              </select>
            </Field>
            <Field label="Twitter Title">
              <Input value={seo.twitterTitle} onChange={set("twitterTitle") as (v: string) => void} placeholder={actualOgTitle || "Defaults to OG title"} />
            </Field>
            <Field label="Twitter Description">
              <Textarea value={seo.twitterDescription} onChange={set("twitterDescription") as (v: string) => void} placeholder={actualOgDescription || "Defaults to OG description"} rows={2} />
            </Field>
            <Field label="Twitter Image URL">
              <Input value={seo.twitterImage} onChange={set("twitterImage") as (v: string) => void} placeholder={actualOgImage || "Defaults to OG image"} />
            </Field>
          </Section>

          {/* Advanced */}
          <Section title="Advanced" defaultOpen={false}>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-gray-700">Allow search engines to index</p>
                  <p className="text-xs text-gray-400">Sets meta robots: index / noindex</p>
                </div>
                <button onClick={() => onChange({ robots: { ...seo.robots, index: !seo.robots.index } })} className={`w-10 h-5 rounded-full transition-colors ${seo.robots.index ? "bg-[#F15C20]" : "bg-gray-200"}`}>
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${seo.robots.index ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-gray-700">Follow links on this page</p>
                  <p className="text-xs text-gray-400">Sets meta robots: follow / nofollow</p>
                </div>
                <button onClick={() => onChange({ robots: { ...seo.robots, follow: !seo.robots.follow } })} className={`w-10 h-5 rounded-full transition-colors ${seo.robots.follow ? "bg-[#F15C20]" : "bg-gray-200"}`}>
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${seo.robots.follow ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <Field label="JSON-LD Schema" hint="Article structured data for Google rich results.">
              <button onClick={() => setSchemaOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-[#F15C20] hover:text-[#F15C20] transition-colors">
                <FiSettings size={14} />
                {seo.jsonLd ? "Edit JSON-LD Schema" : "Generate JSON-LD Schema"}
              </button>
              {seo.jsonLd && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <FiCheck size={12} /> Schema saved
                </p>
              )}
            </Field>
          </Section>
        </div>
      )}
    </>
  );
}
