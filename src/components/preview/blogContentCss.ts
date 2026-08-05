/**
 * A verbatim mirror of the `.blog-content` stylesheet in
 * `DS-website/components/Blogs/BlogPostPage.jsx`.
 *
 * The preview exists so a post can be checked before publishing, which is only
 * worth anything if it renders exactly like the live page. The two repos cannot
 * share a module, so this is a copy — but a single, clearly-labelled one.
 *
 * ── When the website's blog CSS changes, change this too. ──
 *
 * Keeping the rules in the same order as the source matters: several selectors
 * are deliberately redefined later in the sheet (`ul`/`ol` margins and `li`
 * margin-bottom), so reordering them would silently change the rendering.
 *
 * The website scopes its font rule with `interFont.style.fontFamily`; this app
 * loads the same family onto `--font-sans` in `layout.tsx`.
 */
export const BLOG_CONTENT_CSS = `
  main, main * {
    font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif !important;
  }
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
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }
  .blog-content ul, .blog-content ol { margin: 0 0 1rem 1.5rem; line-height: 1.8; font-size: 0.97rem; }
  .blog-content li { margin-bottom: 0.4rem; }
  .blog-content a { color: #f97316; text-decoration: underline; }
  .blog-content img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
  .blog-content blockquote { border-left: 4px solid #f97316; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #555; }
  .blog-content pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; }
  .blog-content code { background: #f3f4f6; color: #ef4444; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
  .blog-content pre code { background: none; color: inherit; padding: 0; }

  /* ── Editor block types the site had no styles for ──────────────────
     Tailwind's preflight zeroes every border and sets border-collapse,
     so a bare <table> from the editor rendered as cells jammed together
     with no rules or padding. */
  .blog-table-wrap { overflow-x: auto; margin: 1.5rem 0; -webkit-overflow-scrolling: touch; }
  .blog-content table { width: 100%; border-collapse: collapse; font-size: 16px; line-height: 150%; }
  .blog-content th, .blog-content td { border: 1px solid #e5e7eb; padding: 0.75rem 1rem; text-align: left; vertical-align: top; color: #1F222E; }
  .blog-content th { background: #f7f7f7; font-weight: 700; }
  .blog-content tbody tr:nth-child(even) { background: #fcfcfc; }
  .blog-content td > p:last-child, .blog-content th > p:last-child { margin-bottom: 0; }

  .blog-content h1 { font-size: 2rem; font-weight: 700; margin: 2rem 0 1rem; line-height: 2.5rem; color: #1F222E; }
  .blog-content h4 { font-size: 1rem; font-weight: 700; margin: 1.25rem 0 0.5rem; line-height: 1.5rem; color: #222; }
  .blog-content h5, .blog-content h6 { font-size: 0.9375rem; font-weight: 700; margin: 1rem 0 0.5rem; line-height: 1.4rem; color: #222; }

  .blog-content hr { border: 0; border-top: 1px solid #e5e7eb; margin: 2rem 0; }

  .blog-content mark { background: #ffedd5; color: inherit; padding: 0.1em 0.2em; border-radius: 0.2rem; }

  .blog-content figure { margin: 1.5rem 0; }

  .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.5s ease forwards; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

/**
 * Mirrors `wrapTables` in the website's BlogPostPage. The editor emits a bare
 * <table>, which would overflow the 761px content column; the wrapper lets it
 * scroll sideways on its own instead of widening the page.
 */
export function wrapTables(html = ""): string {
  if (!html.includes("<table") || html.includes("blog-table-wrap")) return html;
  return html.replace(
    /<table[\s\S]*?<\/table>/gi,
    (match) => `<div class="blog-table-wrap">${match}</div>`
  );
}
