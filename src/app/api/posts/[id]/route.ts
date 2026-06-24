import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { NextRequest, NextResponse } from "next/server";
import { generateArticleJsonLd } from "@/lib/seo";
import { unlink } from "fs/promises";
import path from "path";

async function deleteLocalImage(url: string) {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath);
  } catch {
    // File may not exist; ignore
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const post = await BlogPost.findById(id).lean();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  if (body.seo) {
    body.seo.jsonLd = generateArticleJsonLd({
      title: body.title,
      slug: body.slug,
      seo: body.seo,
      author: body.author,
    });
  }

  if (body.status === "published" && !body.publishedAt) {
    body.publishedAt = new Date();
  }

  if (body.slug) {
    let slug = body.slug;
    let counter = 1;
    while (await BlogPost.exists({ slug, _id: { $ne: id } })) {
      slug = `${body.slug}-${counter++}`;
    }
    body.slug = slug;
  }

  const post = await BlogPost.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const post = await BlogPost.findById(id).lean() as any;
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Collect all local image URLs to delete
  const imageUrls: string[] = [];
  if (post.featuredImage?.url) imageUrls.push(post.featuredImage.url);
  if (post.contentHtml) {
    const matches = post.contentHtml.matchAll(/src="(\/uploads\/[^"]+)"/g);
    for (const m of matches) imageUrls.push(m[1]);
  }

  await BlogPost.findByIdAndDelete(id);
  await Promise.all(imageUrls.map(deleteLocalImage));

  return NextResponse.json({ success: true });
}
