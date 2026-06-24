"use client";

interface SnippetPreviewProps {
  seoTitle: string;
  metaDescription: string;
  slug: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://dignitestudios.com";

export function SnippetPreview({ seoTitle, metaDescription, slug }: SnippetPreviewProps) {
  const url = `${SITE_URL}/blog/${slug || "your-post-slug"}`;

  const titleColor = seoTitle.length > 60 ? "text-red-500" : seoTitle.length < 30 ? "text-yellow-600" : "text-[#1a0dab]";
  const descColor = metaDescription.length > 160 ? "text-red-500" : "text-gray-600";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">Search Preview</h3>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-sm bg-gray-200 flex-shrink-0" />
          <p className="text-xs text-gray-500 truncate">{url}</p>
        </div>
        <p className={`text-base font-medium truncate ${titleColor}`}>
          {seoTitle || "SEO Title (not set)"}
        </p>
        <p className={`text-xs mt-1 line-clamp-2 ${descColor}`}>
          {metaDescription || "Meta description (not set) — Write a compelling description that makes people click your result."}
        </p>
      </div>

      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span className={seoTitle.length > 60 ? "text-red-500" : seoTitle.length < 30 ? "text-yellow-500" : "text-green-500"}>
          Title: {seoTitle.length}/60
        </span>
        <span className={metaDescription.length > 160 ? "text-red-500" : metaDescription.length < 120 ? "text-yellow-500" : "text-green-500"}>
          Desc: {metaDescription.length}/160
        </span>
      </div>
    </div>
  );
}

