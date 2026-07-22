"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";

interface Author {
  name?: string;
  avatar?: string;
}

interface BlogPostData {
  _id: string;
  title: string;
  slug: string;
  contentHtml?: string;
  excerpt?: string;
  featuredImage?: { url?: string; alt?: string };
  categories?: string[];
  tags?: string[];
  author?: Author;
  status?: string;
  readTime?: number;
  publishedAt?: string;
  createdAt?: string;
}

interface WebsiteBlogPreviewProps {
  post: BlogPostData;
  related?: BlogPostData[];
}

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").trim();
}

function readingTime(html = "") {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function extractHeadings(html = "") {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches.map((m, i) => ({
    id: `heading-${i}`,
    level: 2,
    text: stripHtml(m[1]),
  }));
}

function injectHeadingIds(html = "") {
  let idx = 0;
  return html.replace(/<h2([^>]*)>/gi, (_m, attrs) => {
    const cleanedAttrs = attrs.replace(/\s+id=['"][^'"]*['"]/gi, "");
    return `<h2${cleanedAttrs} id="heading-${idx++}">`;
  });
}

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-[#F7F7F7] px-4 py-3 text-sm text-[#0C0C0C]">
      <Link href="/" className="hover:text-orange-500 transition-colors">
        Home
      </Link>
      <span className="text-[#0C0C0C]">&gt;</span>
      <Link href="/dashboard/posts" className="hover:text-orange-500 transition-colors">
        Blog
      </Link>
      <span className="text-[#0C0C0C]">&gt;</span>
      <span className="text-orange-500 capitalize">{title}</span>
    </nav>
  );
}

function TableOfContents({ headings, activeId }: { headings: { id: string; text: string }[]; activeId: string }) {
  const tocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId || !tocRef.current) return;
    const activeEl = tocRef.current.querySelector(`a[href="#${activeId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  return (
    <div className="max-h-[calc(100vh-0rem)] sticky top-20 flex flex-col gap-6">
      {headings.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col min-h-0 shadow-sm">
          <p className="mb-6 text-[20px] font-medium leading-none text-black shrink-0">
            In this article
          </p>
          <div ref={tocRef} className="space-y-2 overflow-y-auto max-h-[300px] min-h-0 relative pr-1">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`group relative block py-2 pl-4 text-[16px] leading-[1.25] transition-all duration-200 z-10 ${
                    isActive ? "text-[#F15C20] font-medium" : "text-black/50 hover:text-black/80 font-normal"
                  }`}
                >
                  {isActive ? (
                    <div className="absolute inset-0 border-l-2 border-[#F15C20] -z-10" />
                  ) : (
                    <div className="absolute inset-0 border-l-2 border-transparent group-hover:border-orange-300 transition-colors -z-10" />
                  )}
                  <span className="block relative z-10">{h.text}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Sidebar Newsletter */}
      <div className="flex flex-col border border-black/10 rounded-[10px] overflow-hidden shrink-0 shadow-sm">
        <div className="bg-[#F15C20] py-5 px-4 flex items-center">
          <h3 className="text-white font-semibold text-[18px] leading-[22px]">
            Subscribe to our newsletter
          </h3>
        </div>
        <div className="bg-white py-5 px-4 flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-black/5 rounded-lg p-3 text-[16px] leading-[19px] text-[#0C0C0C] outline-none placeholder:text-[#0C0C0C] placeholder:opacity-80 font-light"
          />
          <p className="text-[15px] leading-[18px] text-[#0C0C0C]">
            Get the latest update, blogs and news delivered to your inbox.
          </p>
          <button className="w-full bg-[#F15C20] hover:bg-[#d9521c] transition-colors text-white font-semibold text-[16px] leading-[19px] py-[15px] px-[10px] rounded-[12px]">
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}

function CTABanner() {
  return (
    <div className="relative w-full max-w-[761px] h-[240px] rounded-[10px] bg-[#F15C20] overflow-hidden flex items-center justify-center my-10">
      {/* Background SVG Pattern */}
      <div className="absolute -left-[15px] -top-[20px] w-[318px] h-[214px] pointer-events-none">
        <svg width="318" height="214" viewBox="0 0 318 214" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.2">
            <path
              d="M82.0224 -152.965C126.116 -152.965 168.405 -136.968 199.584 -108.493C230.763 -80.0175 248.279 -41.397 248.279 -1.12708C248.279 39.1428 230.763 77.7633 199.584 106.238C168.405 134.714 126.116 150.711 82.0224 150.711H-63.4524C-68.954 150.711 -74.2311 148.718 -78.1269 145.171C-82.0226 141.623 -84.219 136.809 -84.2345 131.785V-1.12708C-84.2345 -41.397 -66.7182 -80.0175 -35.539 -108.493C-4.35977 -136.968 37.9283 -152.965 82.0224 -152.965Z"
              fill="white"
            />
            <path
              d="M151.36 -90.5303C195.454 -90.5303 237.743 -74.5331 268.922 -46.058C300.101 -17.5829 317.617 21.0376 317.617 61.3075V194.219C317.617 199.253 315.428 204.08 311.53 207.64C307.633 211.199 302.347 213.199 296.835 213.199H151.36C107.259 213.199 64.963 197.199 33.7783 168.719C2.5936 140.239 -14.9258 101.611 -14.9258 61.3343C-14.9258 21.0573 2.5936 -17.5701 33.7783 -46.0502C64.963 -74.5303 107.259 -90.5303 151.36 -90.5303Z"
              fill="white"
            />
          </g>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-[25px] px-5 w-full">
        <div className="flex flex-col items-center gap-[15px] text-center">
          <h3 className="max-w-[427px] text-white font-semibold text-[28px] leading-[110%]">
            Stay Ahead Of Productivity &<br />
            Tech Trends.
          </h3>
          <p className="text-white opacity-95 font-medium text-[14px]">
            Join newsletter, receive the expert Insights Weekly.
          </p>
        </div>

        {/* Input */}
        <div className="w-full max-w-[502px] h-[64px] rounded-[22px] bg-white p-[4px] shadow-[0_0_50px_rgba(241,92,32,0.45)]">
          <div className="h-full rounded-[18px] bg-[#F2F2F2] border border-[#FFD4C3] flex items-center justify-between px-[15px] gap-3">
            <div className="flex items-center gap-[15px] flex-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <circle cx="6" cy="6" r="4.5" stroke="#5A5A5B" />
                <path d="M10 10L13 13" stroke="#5A5A5B" strokeWidth="1.2" />
              </svg>
              <input
                type="email"
                placeholder="Enter your Email Address"
                className="w-full bg-transparent outline-none border-none text-[#5C5C5C] placeholder:text-[#5C5C5C] placeholder:font-semibold placeholder:text-[12px] font-semibold text-[12px]"
              />
            </div>
            <button
              type="button"
              className="w-[114px] h-[37px] rounded-[12px] bg-[#F15C20] text-white flex items-center justify-center gap-[5px] text-[10px] font-extrabold shrink-0 hover:bg-[#dc4f18] transition"
            >
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <rect x="1" y="1" width="11" height="8" rx="1" stroke="white" strokeWidth="1" />
                <path d="M1 2L6.5 6L12 2" stroke="white" />
              </svg>
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedCard({ post }: { post: BlogPostData }) {
  const thumb = post.featuredImage?.url || "/default-blog-image.jpg";
  const catName = post.categories && post.categories[0] ? post.categories[0] : null;

  return (
    <Link
      href={`/preview/${post._id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative overflow-hidden aspect-video bg-gray-100">
        <img
          src={thumb}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {catName && (
          <span className="absolute top-3 left-3 bg-[#F15C20] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {catName}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">{formatDate(post.publishedAt || post.createdAt)}</p>
        <h4 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#F15C20] transition-colors line-clamp-2">
          {post.title}
        </h4>
      </div>
    </Link>
  );
}

export function WebsiteBlogPreview({ post, related = [] }: WebsiteBlogPreviewProps) {
  const [activeId, setActiveId] = useState("");

  const rawContent = post.contentHtml || "<p>No content written yet.</p>";
  const heroImage = post.featuredImage?.url;
  const headings = useMemo(() => extractHeadings(rawContent), [rawContent]);
  const processedContent = useMemo(() => injectHeadingIds(rawContent), [rawContent]);
  const readMin = post.readTime || readingTime(rawContent);
  const categories = post.categories || [];
  const dateStr = formatDate(post.publishedAt || post.createdAt);
  const authorName = post.author?.name || "Dignite Studios";

  useEffect(() => {
    const handleScroll = () => {
      const headingEls = Array.from(document.querySelectorAll(".blog-content h2[id]"));
      if (!headingEls.length) return;

      const offset = window.innerHeight * 0.4;
      let activeHeading = headingEls[0]?.id;

      for (const el of headingEls) {
        const rect = el.getBoundingClientRect();
        if (rect.height > 0 && rect.top <= offset) {
          activeHeading = el.id;
        }
      }

      if (activeHeading) {
        setActiveId(activeHeading);
      }
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    setTimeout(handleScroll, 100);

    return () => {
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [post]);

  return (
    <>
      <style>{`
        .blog-content { color: #1a1a1a; max-width: 761px; }
        .blog-content h2 { font-size: 1.6875rem; font-weight: 700; margin: 2rem 0 1rem; line-height: 2.0625rem; color: #1F222E; scroll-margin-top: 130px; }
        .blog-content h3 { font-size: 1.125rem; font-weight: 700; margin: 1.5rem 0 0.75rem; line-height: 1.75rem; color: #222; }
        .blog-content ul { list-style-type: disc; margin: 1rem 0 1rem 1.5rem; padding-left: 1rem; }
        .blog-content ol { list-style-type: decimal; margin: 1rem 0 1rem 1.5rem; padding-left: 1rem; }
        .blog-content li { margin-bottom: 0.5rem; font-size: 18px; color: #1F222E; line-height: 150%; }
        .blog-content p {
          margin: 0 0 1rem 0;
          width: 100%;
          max-width: 761px;
          height: auto;
          font-style: normal;
          font-weight: 400;
          font-size: 18px;
          line-height: 150%;
          color: #1F222E;
        }
        .blog-content a { color: #f97316; text-decoration: underline; }
        .blog-content img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
        .blog-content blockquote { border-left: 4px solid #f97316; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #555; }
        .blog-content pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; }
        .blog-content code { background: #f3f4f6; color: #ef4444; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
        .blog-content pre code { background: none; color: inherit; padding: 0; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div className="min-h-screen bg-[#fafafa] font-sans text-gray-900 selection:bg-[#F15C20] selection:text-white flex flex-col">
        {/* ── Admin Top Control Bar ────────────────────────────────────────── */}
        <div className="sticky top-0 z-50 bg-gray-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-gray-800 shadow-md text-xs sm:text-sm shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/posts/${post._id}`}
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700 font-medium"
            >
              <FiArrowLeft size={14} />
              <span>Back to Editor</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-gray-200">Full-Screen Live Website Preview</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                post.status === "published"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {post.status === "published" ? "Published" : "Draft"}
            </span>

            {post.status === "published" && post.slug && (
              <a
                href={`https://www.dignitestudios.com/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-[#F15C20] hover:bg-[#d94d17] text-white font-medium rounded-lg transition-colors text-xs"
              >
                <span>View Live Post</span>
                <FiExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        {/* ── Main Content Matching DS-Website Exact Layout ───────────────── */}
        <main className="min-h-screen bg-[#fafafa] pb-24 max-w-[1200px] w-full mx-auto flex-1">
          {/* Breadcrumb */}
          <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
              <Breadcrumb title={post.title || "Untitled Post"} />
            </div>
          </div>

          <div className="bg-white pb-10 relative px-4">
            <div className="max-w-7xl mx-auto pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-[761px_1fr] gap-10 items-start justify-center">
                {/* Main Content Column */}
                <div className="w-full lg:max-w-[761px]">
                  {heroImage ? (
                    <div className="pt-2">
                      <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-6">
                        {post.title || "Untitled Post"}
                      </h1>
                      <div className="relative overflow-hidden rounded-[12px] aspect-video">
                        <img
                          src={heroImage}
                          alt={post.title}
                          className="inset-0 w-full h-full object-cover"
                          style={{ objectPosition: "center" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 lg:p-10">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-normal text-white">
                            <span>{dateStr}</span>
                            <span>
                              <GoDotFill />
                            </span>
                            <span>{readMin} min read</span>
                            <span>
                              <GoDotFill />
                            </span>
                            <span>By {authorName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl pt-2">
                      {categories[0] && (
                        <span className="inline-block bg-orange-50 text-[#F15C20] border border-orange-200 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                          {categories[0]}
                        </span>
                      )}
                      <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                        {post.title || "Untitled Post"}
                      </h1>
                      <div className="flex items-center gap-3 my-5">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#F15C20] font-bold text-sm">
                          {authorName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{authorName}</p>
                          <p className="text-xs text-gray-400">
                            {dateStr} &nbsp;•&nbsp; {readMin} min read
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <article className="w-full lg:max-w-[761px] mt-8">
                    <div
                      className="blog-content bg-white pb-6 rounded-3xl"
                      dangerouslySetInnerHTML={{ __html: processedContent }}
                    />

                    <CTABanner />

                    {related.length > 0 && (
                      <div className="mt-12">
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 px-2">
                          Related Articles
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                          {related.map((p) => (
                            <RelatedCard key={p._id} post={p} />
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                </div>

                {/* Sidebar (sticky TOC & Newsletter) */}
                <aside className="hidden relative lg:block self-stretch w-full">
                  <TableOfContents headings={headings} activeId={activeId} />
                </aside>
              </div>
            </div>
          </div>
        </main>

        {/* ── Dignite Studios Footer ────────────────────────────────────────── */}
        <footer className="w-full bg-[#0C0C0C] text-white border-t border-gray-800 py-12 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F15C20] flex items-center justify-center text-white font-bold text-sm">
                DS
              </div>
              <span className="font-bold text-lg text-white">
                Dignite <span className="text-[#F15C20]">Studios</span>
              </span>
            </div>

            <p className="text-xs text-gray-400 text-center sm:text-left">
              © {new Date().getFullYear()} Dignite Studios Inc. All rights reserved. Live Blog Preview.
            </p>

            <div className="flex items-center gap-6 text-xs text-gray-400">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
