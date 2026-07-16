import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { generateArticleJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const isEditor = (session?.user as any)?.role === "editor";

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  let isTrashed = searchParams.get("isTrashed") === "true";

  // Role enforcement: editors cannot view trashed posts
  if (isEditor && isTrashed) {
    return NextResponse.json({ error: "Unauthorized to view trash" }, { status: 403 });
  }

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const query: Record<string, unknown> = {};
  if (status && status !== "all") query.status = status;
  if (isTrashed) {
    query.isTrashed = true;
  } else {
    query.isTrashed = { $ne: true };
  }

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .setOptions({ strictQuery: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug status publishedAt seo.seoScore readTime categories createdAt updatedAt isTrashed trashedAt")
      .lean(),
    BlogPost.countDocuments(query).setOptions({ strictQuery: false }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const isEditor = (session?.user as any)?.role === "editor";

  await connectDB();
  const body = await req.json();

  // Role enforcement: editors cannot publish
  if (isEditor && body.status === "published") {
    body.status = "draft";
    body.publishedAt = null;
  }

  const baseSlug = body.slug || slugify(body.title ?? "untitled", { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await BlogPost.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const seo = body.seo ?? {};
  if (!seo.seoTitle) seo.seoTitle = body.title ?? "";
  if (!seo.canonicalUrl && body.slug) {
    seo.canonicalUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL ?? ""}/blog/${slug}`;
  }
  seo.jsonLd = generateArticleJsonLd({ title: body.title, slug, seo, author: body.author });

  const post = await BlogPost.create({ ...body, slug, seo });

  // Trigger On-Demand Revalidation on the website
  try {
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.dignitestudios.com";
    const secret = process.env.REVALIDATION_SECRET || "dignite-secret-2026";
    fetch(`${websiteUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, slug: post.slug })
    }).catch(err => console.error("Revalidation failed:", err));
  } catch (err) {
    // Ignore fetch errors
  }

  return NextResponse.json(post, { status: 201 });
}
