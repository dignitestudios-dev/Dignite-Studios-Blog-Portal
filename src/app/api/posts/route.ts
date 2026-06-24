import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { generateArticleJsonLd } from "@/lib/seo";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const query: Record<string, unknown> = {};
  if (status && status !== "all") query.status = status;

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug status publishedAt seo.seoScore readTime categories createdAt updatedAt")
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

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
  return NextResponse.json(post, { status: 201 });
}
