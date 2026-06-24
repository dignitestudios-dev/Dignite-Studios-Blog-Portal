"use client";
import { useMemo } from "react";

export type CheckStatus = "pass" | "warn" | "fail";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
}

export interface SeoAnalysis {
  checks: SeoCheck[];
  seoScore: number;
  readabilityScore: number;
}

function countWords(text: string): number {
  return text
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getTextContent(html: string): string {
  return stripHtml(html).toLowerCase();
}

function countOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(escaped, "gi")) ?? []).length;
}

function getFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? stripHtml(match[1]).toLowerCase() : "";
}

function getHeadingTexts(html: string): string[] {
  return (html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) ?? []).map((h) =>
    stripHtml(h).toLowerCase()
  );
}

function getImageAlts(html: string): { hasAlt: boolean; src: string }[] {
  return (html.match(/<img[^>]*>/gi) ?? []).map((img) => ({
    hasAlt: /alt="[^"]+"/.test(img),
    src: (img.match(/src="([^"]+)"/) ?? [])[1] ?? "",
  }));
}

function countLinks(html: string): { internal: number; external: number } {
  const links = html.match(/<a[^>]*href="([^"]*)"[^>]*>/gi) ?? [];
  let internal = 0;
  let external = 0;
  links.forEach((link) => {
    const href = (link.match(/href="([^"]*)"/) ?? [])[1] ?? "";
    if (href.startsWith("http")) external++;
    else internal++;
  });
  return { internal, external };
}

function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  // Simplified Flesch Reading Ease approximation (0-100)
  const score = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence));
  return Math.round(score);
}

export function useSeoAnalysis(params: {
  title: string;
  slug: string;
  contentHtml: string;
  excerpt: string;
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
}): SeoAnalysis {
  const {
    title,
    slug,
    contentHtml,
    focusKeyword,
    seoTitle,
    metaDescription,
    featuredImageUrl,
    featuredImageAlt,
  } = params;

  return useMemo(() => {
    const kw = focusKeyword.trim().toLowerCase();
    const text = getTextContent(contentHtml);
    const wordCount = countWords(contentHtml);
    const firstParagraph = getFirstParagraph(contentHtml);
    const headings = getHeadingTexts(contentHtml);
    const images = getImageAlts(contentHtml);
    const links = countLinks(contentHtml);
    const readability = calculateReadability(text);

    const kwDensity = wordCount > 0 ? (countOccurrences(text, kw) / wordCount) * 100 : 0;

    const checks: SeoCheck[] = [
      // --- Focus Keyword Checks ---
      {
        id: "kw-in-title",
        label: "Focus keyword in SEO title",
        ...(kw
          ? seoTitle.toLowerCase().includes(kw)
            ? { status: "pass" as CheckStatus, message: "Your focus keyword appears in the SEO title." }
            : { status: "fail" as CheckStatus, message: "Add your focus keyword to the SEO title." }
          : { status: "warn" as CheckStatus, message: "Set a focus keyword to enable this check." }),
      },
      {
        id: "kw-in-meta",
        label: "Focus keyword in meta description",
        ...(kw
          ? metaDescription.toLowerCase().includes(kw)
            ? { status: "pass" as CheckStatus, message: "Focus keyword found in meta description." }
            : { status: "fail" as CheckStatus, message: "Include your focus keyword in the meta description." }
          : { status: "warn" as CheckStatus, message: "Set a focus keyword to enable this check." }),
      },
      {
        id: "kw-in-slug",
        label: "Focus keyword in URL slug",
        ...(kw
          ? slug.toLowerCase().includes(kw.replace(/\s+/g, "-"))
            ? { status: "pass" as CheckStatus, message: "Focus keyword found in the URL slug." }
            : { status: "warn" as CheckStatus, message: "Consider including the focus keyword in the URL slug." }
          : { status: "warn" as CheckStatus, message: "Set a focus keyword to enable this check." }),
      },
      {
        id: "kw-in-first-paragraph",
        label: "Focus keyword in first paragraph",
        ...(kw
          ? firstParagraph.includes(kw)
            ? { status: "pass" as CheckStatus, message: "Focus keyword appears in the first paragraph." }
            : { status: "warn" as CheckStatus, message: "Use the focus keyword in the first paragraph." }
          : { status: "warn" as CheckStatus, message: "Set a focus keyword to enable this check." }),
      },
      {
        id: "kw-in-heading",
        label: "Focus keyword in subheading",
        ...(kw
          ? headings.some((h) => h.includes(kw))
            ? { status: "pass" as CheckStatus, message: "Focus keyword found in a heading." }
            : { status: "warn" as CheckStatus, message: "Use the focus keyword in at least one heading." }
          : { status: "warn" as CheckStatus, message: "Set a focus keyword to enable this check." }),
      },
      {
        id: "kw-density",
        label: "Keyword density",
        ...(kw
          ? { status: "pass" as CheckStatus, message: `Keyword density is ${kwDensity.toFixed(1)}% — good.` }
          : { status: "warn" as CheckStatus, message: "Set a focus keyword to check density." }),
      },

      // --- SEO Meta Checks ---
      {
        id: "seo-title-length",
        label: "SEO title length (30–60 chars)",
        ...(seoTitle.length === 0
          ? { status: "fail" as CheckStatus, message: "SEO title is missing." }
          : seoTitle.length >= 30 && seoTitle.length <= 60
          ? { status: "pass" as CheckStatus, message: `SEO title is ${seoTitle.length} characters — good.` }
          : seoTitle.length < 30
          ? { status: "warn" as CheckStatus, message: `SEO title is too short (${seoTitle.length} chars). Aim for 30–60.` }
          : { status: "warn" as CheckStatus, message: `SEO title is too long (${seoTitle.length} chars). Keep under 60.` }),
      },
      {
        id: "meta-desc-length",
        label: "Meta description length (120–160 chars)",
        ...(metaDescription.length === 0
          ? { status: "fail" as CheckStatus, message: "Meta description is missing." }
          : metaDescription.length >= 120 && metaDescription.length <= 160
          ? { status: "pass" as CheckStatus, message: `Meta description is ${metaDescription.length} characters — good.` }
          : metaDescription.length < 120
          ? { status: "warn" as CheckStatus, message: `Meta description is too short (${metaDescription.length} chars). Aim for 120–160.` }
          : { status: "warn" as CheckStatus, message: `Meta description is too long (${metaDescription.length} chars). Keep under 160.` }),
      },

      // --- Content Checks ---
      {
        id: "word-count",
        label: "Content length (300+ words)",
        ...(wordCount >= 300
          ? { status: "pass" as CheckStatus, message: `Content has ${wordCount} words — good.` }
          : wordCount >= 150
          ? { status: "warn" as CheckStatus, message: `Content has ${wordCount} words. Aim for at least 300.` }
          : { status: "fail" as CheckStatus, message: `Content is too short (${wordCount} words). Write at least 300 words.` }),
      },
      {
        id: "has-heading",
        label: "Content has subheadings",
        ...(headings.length > 0
          ? { status: "pass" as CheckStatus, message: `Content has ${headings.length} heading(s).` }
          : { status: "fail" as CheckStatus, message: "Add at least one subheading (H2/H3) to structure your content." }),
      },
      {
        id: "internal-links",
        label: "Internal links",
        ...(links.internal > 0
          ? { status: "pass" as CheckStatus, message: `${links.internal} internal link(s) found.` }
          : { status: "warn" as CheckStatus, message: "Add internal links to improve navigation and SEO." }),
      },
      {
        id: "images-have-alt",
        label: "Images have alt text",
        ...(images.length === 0
          ? { status: "warn" as CheckStatus, message: "No images found in content." }
          : images.every((img) => img.hasAlt)
          ? { status: "pass" as CheckStatus, message: "All images have alt text." }
          : { status: "fail" as CheckStatus, message: "Some images are missing alt text." }),
      },

      // --- Featured Image ---
      {
        id: "featured-image",
        label: "Featured image set",
        ...(featuredImageUrl
          ? featuredImageAlt
            ? { status: "pass" as CheckStatus, message: "Featured image is set with alt text." }
            : { status: "warn" as CheckStatus, message: "Featured image is set but missing alt text." }
          : { status: "fail" as CheckStatus, message: "Set a featured image for social sharing and SEO." }),
      },
    ];

    // Weight: fail = 0, warn = 0.5, pass = 1
    const total = checks.length;
    const score = checks.reduce((sum, c) => {
      return sum + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0);
    }, 0);

    const seoScore = Math.round((score / total) * 100);

    return { checks, seoScore, readabilityScore: readability };
  }, [
    focusKeyword,
    seoTitle,
    metaDescription,
    contentHtml,
    slug,
    featuredImageUrl,
    featuredImageAlt,
  ]);
}
