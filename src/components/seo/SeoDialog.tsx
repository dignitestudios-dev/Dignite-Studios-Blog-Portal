"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeoSidebar, SeoData } from "@/components/seo/SeoSidebar";
import { SeoAnalysis } from "@/hooks/useSeoAnalysis";
import { FiSearch } from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";

interface SeoDialogProps {
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
  createdAt?: string;
  updatedAt?: string;
}

export function SeoDialog({
  seo,
  slug,
  analysis,
  onChange,
  postTitle,
  postExcerpt,
  contentHtml,
  featuredImageUrl,
  postSlug,
  authorName,
  createdAt,
  updatedAt,
}: SeoDialogProps) {
  const [open, setOpen] = useState(false);

  const score = analysis.seoScore;
  const scoreStyle =
    score >= 70
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 40
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-red-100 text-red-600 border-red-200";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiSearch size={14} className="text-[#F15C20]" />
            <h3 className="text-sm font-semibold text-gray-800">SEO</h3>
          </div>
          {score > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreStyle}`}>
              {score}/100
            </span>
          )}
        </div>

        {seo.focusKeyword && (
          <p className="text-xs text-gray-500 mb-3 truncate flex items-center gap-1">
            <FiSearch size={11} className="text-[#F15C20]" />
            {seo.focusKeyword}
          </p>
        )}

        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#F15C20] border border-[#F15C20]/30 rounded-xl hover:bg-[#F15C20]/5 transition-colors"
        >
          <MdAutoAwesome size={15} />
          Edit SEO Settings
        </button>
      </div>

      <DialogContent
        className="sm:max-w-[92vw] w-[92vw] h-[92vh] p-0 flex flex-col overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FiSearch size={15} className="text-[#F15C20]" />
            SEO Settings
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SeoSidebar
            seo={seo}
            slug={slug}
            analysis={analysis}
            onChange={onChange}
            postTitle={postTitle}
            postExcerpt={postExcerpt}
            contentHtml={contentHtml}
            featuredImageUrl={featuredImageUrl}
            postSlug={postSlug}
            authorName={authorName}
            createdAt={createdAt}
            updatedAt={updatedAt}
            layout="grid"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
