"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FiEdit3, FiImage, FiLink, FiSearch, FiSave,
  FiTag, FiFileText, FiChevronRight, FiAlertTriangle,
  FiInfo, FiCheckSquare, FiZap,
} from "react-icons/fi";
import { MdTableChart, MdAutoAwesome, MdOutlineSchema } from "react-icons/md";

// ─── Data Model ───────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  items?: { id: string; label: string }[];
}

const NAV: NavItem[] = [
  { id: "getting-started", label: "Getting Started" },
  {
    id: "editor", label: "Editor",
    items: [
      { id: "toolbar", label: "Toolbar Reference" },
      { id: "images", label: "Images" },
      { id: "tables", label: "Tables" },
      { id: "links", label: "Links" },
      { id: "cta", label: "CTA Banner" },
    ],
  },
  {
    id: "seo", label: "SEO",
    items: [
      { id: "seo-basics", label: "SEO Fundamentals" },
      { id: "seo-fields", label: "SEO Fields Reference" },
      { id: "seo-score", label: "SEO Score & Checks" },
      { id: "schema", label: "JSON-LD Schema" },
      { id: "seo-best-practices", label: "Best Practices" },
    ],
  },
  {
    id: "publishing", label: "Publishing",
    items: [
      { id: "publish", label: "Draft & Publish" },
      { id: "sitemap", label: "Sitemap" },
      { id: "stats", label: "Post Statistics" },
      { id: "categories", label: "Categories & Tags" },
    ],
  },
];

// Flatten for lookup
const ALL_IDS = NAV.flatMap((g) => [g.id, ...(g.items?.map((i) => i.id) ?? [])]);

// ─── Micro Components ─────────────────────────────────────────────────────────

function Callout({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
  const cfg = {
    tip: { bg: "bg-emerald-50", border: "border-emerald-200", icon: <FiCheckSquare className="text-emerald-600 shrink-0 mt-0.5" size={15} />, text: "text-emerald-900" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: <FiAlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={15} />, text: "text-amber-900" },
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: <FiInfo className="text-blue-600 shrink-0 mt-0.5" size={15} />, text: "text-blue-900" },
  }[type];
  return (
    <div className={`flex gap-3 ${cfg.bg} ${cfg.border} border rounded-lg p-3.5 my-5 text-sm ${cfg.text}`}>
      {cfg.icon}
      <div>{children}</div>
    </div>
  );
}

function DataTable({ headers, rows }: { headers?: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 my-5 text-sm">
      <table className="w-full">
        {headers && (
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 ? "bg-gray-50/50" : "bg-white"}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-medium text-gray-800 text-xs" : "text-gray-600"} border-t border-gray-100`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-300 bg-gray-100 text-xs font-mono text-gray-700 mx-0.5">{children}</kbd>;
}

function StepList({ steps }: { steps: { title: string; body: React.ReactNode }[] }) {
  return (
    <ol className="my-5 space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3.5">
          <span className="shrink-0 w-6 h-6 rounded-full bg-[#F15C20] text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{s.title}</p>
            <div className="text-sm text-gray-600">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mb-1 mt-8 first:mt-0">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-7 mb-3">{children}</h3>;
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed my-3">{children}</p>;
}

function Divider() {
  return <hr className="border-gray-100 my-8" />;
}

// ─── Content Map ──────────────────────────────────────────────────────────────

const CONTENT: Record<string, React.ReactNode> = {
  "getting-started": (
    <>
      <SectionTitle>Getting Started</SectionTitle>
      <Para>
        DS Blog Editor is a custom CMS built to replace WordPress + Yoast SEO for the Dignite Studios website.
        Every blog post you create here is stored in MongoDB and served live at{" "}
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-[#F15C20]">dignitestudios.com/blog</code> — no deployment needed.
      </Para>

      <div className="grid grid-cols-3 gap-3 my-6">
        {[
          [<FiEdit3 key="e" size={18} />, "Rich Editor", "TipTap-powered — formatting, tables, images, and CTA banners"],
          [<FiSearch key="s" size={18} />, "Full SEO Suite", "Meta tags, OG, Twitter Cards, JSON-LD schema, live SEO scoring"],
          [<FiZap key="z" size={18} />, "AI-Powered", "Auto-generate SEO titles, descriptions, excerpts and schema fields"],
        ].map(([icon, title, desc]) => (
          <div key={title as string} className="border border-gray-200 rounded-xl p-4">
            <div className="text-[#F15C20] mb-2">{icon}</div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{title as string}</p>
            <p className="text-xs text-gray-500">{desc as string}</p>
          </div>
        ))}
      </div>

      <SubTitle>Quick workflow</SubTitle>
      <StepList steps={[
        { title: "Log in", body: "Go to /login and sign in with your admin credentials." },
        { title: "Create a post", body: "Click New Post in the sidebar. Enter a title — the slug auto-generates." },
        { title: "Write your content", body: "Use the rich editor. Add images, headings, tables, and CTA banners as needed." },
        { title: "Fill SEO settings", body: "Open SEO Settings in the right sidebar. Set focus keyword, SEO title, and meta description. Use the AI buttons to generate suggestions." },
        { title: "Upload a featured image", body: "Required before publishing. Alt text auto-fills from your post title." },
        { title: "Publish", body: 'Set status to Published and click Save. The post is live immediately and appears in /sitemap.xml.' },
      ]} />

      <Callout type="tip">
        Aim for an SEO score above 70 before publishing. Open the SEO Analysis accordion in the right sidebar to see live checks.
      </Callout>
    </>
  ),

  toolbar: (
    <>
      <SectionTitle>Toolbar Reference</SectionTitle>
      <Para>The toolbar is always pinned at the top of the editor. When your cursor is inside a table, additional table controls appear automatically.</Para>
      <DataTable
        headers={["Button", "Action"]}
        rows={[
          ["Undo / Redo", "Undo or redo the last change"],
          ["Bold", "Toggle bold on selected text"],
          ["Italic", "Toggle italic on selected text"],
          ["Underline", "Toggle underline"],
          ["Strikethrough", "Toggle strikethrough"],
          ["H1 – H6", "Set heading level"],
          ["Bullet List", "Unordered list"],
          ["Numbered List", "Ordered list"],
          ["Blockquote", "Indent as a blockquote"],
          ["Code Block", "Preformatted code block"],
          ["Align Left / Center / Right", "Text alignment"],
          ["Text Color", "Color picker for selected text"],
          ["Font Size", "Increase / decrease font size"],
          ["Link", "Insert or edit a hyperlink"],
          ["Image", "Upload or embed an image"],
          ["Table", "Insert a table"],
          ["CTA Banner", "Insert an orange call-to-action block"],
        ]}
      />
      <SubTitle>Keyboard shortcuts</SubTitle>
      <DataTable
        headers={["Action", "Shortcut"]}
        rows={[
          ["Bold", "Ctrl + B"],
          ["Italic", "Ctrl + I"],
          ["Underline", "Ctrl + U"],
          ["Undo", "Ctrl + Z"],
          ["Redo", "Ctrl + Shift + Z"],
          ["Link", "Ctrl + K"],
        ]}
      />
    </>
  ),

  images: (
    <>
      <SectionTitle>Images</SectionTitle>
      <Para>Insert images via the toolbar Image button. Click any image after inserting to access controls.</Para>
      <DataTable
        headers={["Task", "How"]}
        rows={[
          ["Insert", "Toolbar → Image → upload file or paste URL"],
          ["Resize", "Click image → drag the bottom-right handle"],
          ["Align", "Click image → alignment buttons in the floating toolbar"],
          ["Float (text wrap)", "Click image → float left or float right"],
          ["Alt text", "Set in the upload dialog — required for SEO"],
        ]}
      />
      <Callout type="tip">Always fill in the alt text. It improves accessibility and is indexed by Google Image Search.</Callout>
      <Callout type="warning">Compress images to max 1200px wide before uploading. Large images slow down page load and hurt Core Web Vitals.</Callout>
    </>
  ),

  tables: (
    <>
      <SectionTitle>Tables</SectionTitle>
      <Para>Click the Table icon in the toolbar to insert a 3×3 table. Place your cursor inside a table cell — the table toolbar appears automatically above the main toolbar.</Para>
      <DataTable
        headers={["Action", "Table toolbar button"]}
        rows={[
          ["Add row below", "Add Row Below"],
          ["Add row above", "Add Row Above"],
          ["Delete row", "Delete Row"],
          ["Add column after", "Add Column After"],
          ["Add column before", "Add Column Before"],
          ["Delete column", "Delete Column"],
          ["Delete entire table", "Delete Table"],
          ["Maximum columns", "10"],
        ]}
      />
      <Callout type="info">Text inside cells wraps automatically — it will never break the layout. The table is responsive on the website.</Callout>
    </>
  ),

  links: (
    <>
      <SectionTitle>Links</SectionTitle>
      <StepList steps={[
        { title: "Select text", body: "Highlight the words you want to hyperlink." },
        { title: "Click the Link icon", body: "The link dialog opens. Enter the URL and choose options (new tab, nofollow)." },
        { title: "Edit or remove", body: "Click the linked text, then the Link icon again. Edit the URL or click Remove Link." },
      ]} />
      <Callout type="warning">
        Clicking linked text in the editor does NOT open the URL — this is intentional to prevent accidental navigation. To open a link use the external-link icon in the link dialog, or <Kbd>Ctrl</Kbd>+<Kbd>Click</Kbd>.
      </Callout>
      <Callout type="tip">For sponsored or affiliate links, check Nofollow. For all external links, check Open in New Tab.</Callout>
    </>
  ),

  cta: (
    <>
      <SectionTitle>CTA Banner</SectionTitle>
      <Para>Insert a full-width orange call-to-action block from the toolbar. All text is editable inline — just click any text to edit it directly inside the banner.</Para>
      <DataTable
        headers={["Element", "How to edit"]}
        rows={[
          ["Heading", "Click the heading text to edit inline"],
          ["Paragraph", "Click the body text to edit inline"],
          ["Button label", "Click the button text to edit inline"],
          ["Button URL", "Edit the URL field shown below the button"],
        ]}
      />
      <Callout type="tip">Place CTA banners at the end of long articles, or between major sections, to drive conversions.</Callout>
    </>
  ),

  "seo-basics": (
    <>
      <SectionTitle>SEO Fundamentals</SectionTitle>
      <Para>
        SEO (Search Engine Optimization) determines where your content appears in search results.
        The editor handles all technical SEO automatically — your job is to fill the content fields correctly.
      </Para>
      <SubTitle>What Google ranks on</SubTitle>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-4">
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1.5">
          <li>Content quality and relevance to the search query</li>
          <li>Page title (<code className="text-xs bg-white border border-gray-200 px-1 rounded">seoTitle</code>) and meta description</li>
          <li>URL slug — short, keyword-rich, no stop words</li>
          <li>Heading structure (H1 → H2 → H3)</li>
          <li>Internal links to other pages on the site</li>
          <li>External links to credible sources</li>
          <li>Image alt texts</li>
          <li>Page speed (Core Web Vitals)</li>
          <li>Structured data (JSON-LD schema)</li>
          <li>E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness</li>
        </ol>
      </div>
      <SubTitle>Focus keyword</SubTitle>
      <Para>
        The focus keyword is the primary search query you want this post to rank for.
        Enter it in the SEO Settings dialog. The live SEO analyzer checks whether you have used it
        in the title, description, slug, first paragraph, and throughout the body.
      </Para>
      <Callout type="tip">Use one focus keyword per post. Target specific long-tail phrases like <em>"react native app development services"</em> rather than broad terms like <em>"apps"</em>. Never target the same keyword on two posts.</Callout>
    </>
  ),

  "seo-fields": (
    <>
      <SectionTitle>SEO Fields Reference</SectionTitle>
      <Para>Open SEO Settings from the top of the right sidebar. The dialog has two columns.</Para>
      <SubTitle>Left column — core SEO</SubTitle>
      <DataTable
        headers={["Field", "Description", "Limit"]}
        rows={[
          ["Focus Keyword", "Primary keyword — drives the SEO analyzer", "—"],
          ["SEO Title", "Title shown in Google search results. Different from post title — make it keyword-rich.", "60 chars"],
          ["Meta Description", "Snippet under title in search results. Include keyword and a call to action.", "160 chars"],
          ["Snippet Preview", "Live preview of how the post looks in Google results", "Auto"],
          ["Canonical URL", "If identical content exists at another URL, enter it here to prevent duplicate penalties. Leave blank normally.", "—"],
          ["Robots Index", "Leave ON. Disable only to exclude from search indexing.", "Default: ON"],
          ["Robots Follow", "Leave ON. Disable for pages with many outbound links you do not want to endorse.", "Default: ON"],
        ]}
      />
      <SubTitle>Right column — social & meta</SubTitle>
      <DataTable
        headers={["Field", "Description"]}
        rows={[
          ["Meta Keywords", "Comma-separated keywords. Ignored by Google; minor weight on Bing and Yandex."],
          ["OG Title", "Facebook / LinkedIn share card title. Falls back to SEO title if blank."],
          ["OG Description", "Facebook / LinkedIn share card description."],
          ["OG Image", "Image shown in social share cards. Falls back to featured image."],
          ["Twitter Title", "Twitter (X) card title."],
          ["Twitter Description", "Twitter (X) card description."],
          ["Twitter Image", "Twitter (X) card image."],
          ["Twitter Card Type", "summary_large_image shows a big image preview; summary shows a thumbnail."],
        ]}
      />
      <Callout type="tip">
        Use the <MdAutoAwesome className="inline text-[#F15C20] mx-0.5" size={13} /> AI button next to any field to auto-generate optimized content. AI output is hard-capped at the character limit.
      </Callout>
    </>
  ),

  "seo-score": (
    <>
      <SectionTitle>SEO Score & Checks</SectionTitle>
      <Para>The SEO Analysis accordion in the right sidebar gives a live score (0–100) and color-coded check results as you write.</Para>
      <DataTable
        headers={["Color", "Meaning"]}
        rows={[
          ["🟢 Green — Pass", "Check passed — nothing to do"],
          ["🟡 Amber — Warn", "Acceptable but improvable"],
          ["🔴 Red — Fail", "Must be fixed before publishing"],
        ]}
      />
      <SubTitle>All checks explained</SubTitle>
      <DataTable
        headers={["Check", "What it tests"]}
        rows={[
          ["Keyword in SEO title", "Your SEO title must contain the focus keyword"],
          ["Keyword in meta description", "Meta description must contain the focus keyword"],
          ["Keyword in slug", "URL slug should contain the focus keyword"],
          ["Keyword in first paragraph", "Mention the keyword in the opening lines"],
          ["Keyword density", "Keyword appears at least once in body text"],
          ["Meta description length", "Between 120–160 characters"],
          ["SEO title length", "Between 50–60 characters"],
          ["Post length", "Posts under 300 words are thin content"],
          ["Internal links", "At least one link to another page on the site"],
          ["Image alt texts", "All images have descriptive alt text"],
          ["Headings structure", "H2 or H3 subheadings are used in the post"],
        ]}
      />
      <Callout type="tip">Fix all red items before publishing. Amber items are optional improvements. A score above 70 is considered good for publishing.</Callout>
    </>
  ),

  schema: (
    <>
      <SectionTitle>JSON-LD Schema Generator</SectionTitle>
      <Para>
        Structured data tells Google exactly what your content is — a blog post, article, author, publisher.
        It enables <strong>rich results</strong> in search (article dates, author info, breadcrumbs).
      </Para>
      <StepList steps={[
        { title: "Open the generator", body: "Click the JSON-LD Schema button in the right sidebar." },
        { title: "Select Article @type", body: "Use BlogPosting for blog posts. Use Article for news, NewsArticle for press releases." },
        { title: "Fill in fields", body: "Headline, URL, Image, and Description auto-fill from your post. Set Author Name, Author URL, Publisher, and dates." },
        {
          title: "Use AI Fill",
          body: <>Click <strong>AI Fill Fields</strong> to populate all fields from the post content automatically.</>,
        },
        {
          title: "Validate",
          body: <>Use the <strong>Rich Results Test</strong> link in the preview panel to validate with Google before saving.</>,
        },
        { title: "Save Schema", body: "Click Save Schema. The schema tag is embedded in the page automatically when published." },
      ]} />
      <Callout type="info">
        <strong>E-E-A-T:</strong> Setting a real Author name and Publisher name matters. Google uses this to assess Experience, Expertise, Authoritativeness, and Trustworthiness — a key ranking signal for content sites.
      </Callout>
      <Callout type="warning">You do not need to paste the script tag anywhere. It is injected into the page head automatically on publish.</Callout>
    </>
  ),

  "seo-best-practices": (
    <>
      <SectionTitle>SEO Best Practices</SectionTitle>
      <div className="grid grid-cols-2 gap-3 my-5">
        {[
          ["One H1 per post", "The post title is your H1. Never add another H1 in the editor body."],
          ["H2 for every section", "Add an H2 subheading every 300–400 words to structure the content."],
          ["Keyword in first 100 words", "Mention the focus keyword in the opening paragraph."],
          ["2–3 internal links", "Link to other pages on dignitestudios.com in every post."],
          ["External links to sources", "Link to research and statistics — adds trust signals for Google."],
          ["Compress images", "Use WebP format. Max 1200px wide. Filename should be descriptive."],
          ["Meta description = ad copy", "Write it like a headline — compelling enough to make someone click."],
          ["Avoid keyword stuffing", "Use synonyms and related terms naturally. Keyword density check always passes."],
          ["Refresh old posts", "Updating existing content signals freshness. Add new data, fix dead links."],
          ["Short paragraphs", "2–4 lines max. Use bullet lists. Mobile readers scan, not read."],
          ["Minimum 800 words", "Posts under 800 words rarely rank for competitive terms."],
          ["Submit to Search Console", "After publishing, submit the sitemap URL in Google Search Console to speed up indexing."],
        ].map(([title, desc]) => (
          <div key={title} className="border border-gray-200 rounded-lg p-3.5 bg-white">
            <p className="text-xs font-semibold text-gray-800 mb-0.5">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </>
  ),

  publish: (
    <>
      <SectionTitle>Draft & Publish</SectionTitle>
      <Para>Use the status dropdown and Save button at the top-right of the editor to manage post state.</Para>
      <DataTable
        headers={["Status", "Visibility"]}
        rows={[
          ["Draft", "Saved privately — not visible on the website"],
          ["Published", "Live at dignitestudios.com/blog and included in the sitemap"],
        ]}
      />
      <StepList steps={[
        { title: "Save as Draft", body: 'Select Draft from the dropdown and click Save Draft. Edit anytime.' },
        { title: "Publish", body: 'Set status to Published and click Save Draft (button label reflects status). Post goes live immediately.' },
        { title: "Unpublish", body: 'Open the post, change status to Draft, save. Removed from site and sitemap at once.' },
      ]} />
      <Callout type="warning">A featured image is required before publishing. The editor will block the save and show an error if it is missing.</Callout>
      <Callout type="tip">After publishing, verify the post appears in <code className="text-xs bg-white border border-emerald-200 px-1 rounded">dignitestudios.com/sitemap.xml</code>.</Callout>
    </>
  ),

  sitemap: (
    <>
      <SectionTitle>Sitemap</SectionTitle>
      <Para>
        The sitemap at <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-[#F15C20]">dignitestudios.com/sitemap.xml</code> is fully dynamic.
        It regenerates on every request — published posts are added instantly, unpublished posts are removed instantly.
      </Para>
      <DataTable
        headers={["Entry type", "Change frequency"]}
        rows={[
          ["Homepage & static pages", "Monthly"],
          ["Blog index (/blog)", "Daily"],
          ["Each published blog post", "Weekly"],
        ]}
      />
      <SubTitle>Submit to Google Search Console</SubTitle>
      <StepList steps={[
        { title: "Open Search Console", body: "Go to search.google.com/search-console" },
        { title: "Select the property", body: "Choose dignitestudios.com" },
        { title: "Go to Sitemaps", body: "Left sidebar → Sitemaps" },
        { title: "Enter the URL", body: <><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">https://www.dignitestudios.com/sitemap.xml</code> → Submit</> },
      ]} />
      <Callout type="tip">Resubmit the sitemap after a batch of new posts to prompt Google to crawl faster.</Callout>
    </>
  ),

  stats: (
    <>
      <SectionTitle>Post Statistics</SectionTitle>
      <Para>The statistics panel in the right sidebar shows live metrics computed from the editor content.</Para>
      <DataTable
        headers={["Metric", "How it is calculated"]}
        rows={[
          ["Word Count", "Total words in the post body"],
          ["Character Count", "Total characters including spaces"],
          ["Paragraphs", "Number of paragraph elements"],
          ["Headings", "Number of H1–H6 elements"],
          ["Read Time", "Words ÷ 265 WPM + 10s per image + 20s per code block, rounded up"],
        ]}
      />
      <SubTitle>Editing read time</SubTitle>
      <Para>
        Click the read time number directly and type a custom value. An <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">auto</code> link
        appears — click it to reset back to the calculated value.
      </Para>
      <Callout type="tip">Posts over 1,500 words typically achieve the best balance of depth and ranking performance for competitive keywords.</Callout>
    </>
  ),

  categories: (
    <>
      <SectionTitle>Categories & Tags</SectionTitle>
      <SubTitle>Categories</SubTitle>
      <Para>Broad topic groups (e.g. Mobile Development, SEO, Case Studies). Assign at least one per post. Manage categories from <strong>Dashboard → Categories</strong>.</Para>
      <SubTitle>Tags</SubTitle>
      <Para>Specific keywords related to the post (e.g. React Native, iOS, App Store). Enter in the Tags field separated by commas. No need to pre-create them.</Para>
      <Callout type="tip">Use 1–2 categories and 3–8 tags per post. Too many tags dilute topical focus and create thin tag archive pages.</Callout>
      <Callout type="warning">Avoid near-duplicate categories (e.g. "Mobile App" and "Mobile Apps"). Consolidate similar topics to build topical authority on fewer, stronger categories.</Callout>
    </>
  ),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading…</div>}>
      <GuideContent />
    </Suspense>
  );
}

function GuideContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawSection = searchParams.get("section") ?? "getting-started";
  const activeId = ALL_IDS.includes(rawSection) ? rawSection : "getting-started";

  function setActiveId(id: string) {
    router.replace(`/dashboard/guide?section=${id}`, { scroll: false });
  }

  // Breadcrumb
  const parentGroup = NAV.find((g) => g.items?.some((i) => i.id === activeId));
  const activeLabel =
    parentGroup?.items?.find((i) => i.id === activeId)?.label ??
    NAV.find((g) => g.id === activeId)?.label ?? "";

  // Prev / next across flat list
  const flat = NAV.flatMap((g) => (g.items ? g.items : [{ id: g.id, label: g.label }]));
  const idx = flat.findIndex((i) => i.id === activeId);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Left sidebar ─────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Documentation</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((group) =>
            group.items ? (
              <div key={group.id} className="mb-1">
                <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      item.id === activeId
                        ? "bg-orange-50 text-[#F15C20] font-medium"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                key={group.id}
                onClick={() => setActiveId(group.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors mb-1 ${
                  group.id === activeId
                    ? "bg-orange-50 text-[#F15C20]"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {group.label}
              </button>
            )
          )}
        </nav>
      </aside>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto px-10 py-10">
          {/* Breadcrumb */}
          {parentGroup && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
              <span>{parentGroup.label}</span>
              <FiChevronRight size={11} />
              <span className="text-gray-600 font-medium">{activeLabel}</span>
            </div>
          )}

          {/* Main content */}
          <div>{CONTENT[activeId] ?? <p className="text-sm text-gray-400">Section not found.</p>}</div>

          {/* Prev / Next */}
          <div className="flex justify-between items-center mt-14 pt-6 border-t border-gray-100">
            {prev ? (
              <button onClick={() => setActiveId(prev.id)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
                <FiChevronRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                <span>{prev.label}</span>
              </button>
            ) : <div />}
            {next ? (
              <button onClick={() => setActiveId(next.id)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
                <span>{next.label}</span>
                <FiChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  );
}
