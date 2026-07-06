import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { ActivityLog } from "@/models/ActivityLog";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role === "editor") {
    return NextResponse.json({ error: "Editors cannot restore posts" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();
  
  const post = await BlogPost.findByIdAndUpdate(
    id,
    { isTrashed: false, trashedAt: null },
    { new: true, strict: false }
  );
  
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userName = session?.user?.name || session?.user?.email || "Unknown User";

  await ActivityLog.create({
    action: "Restore Blog",
    user: userName,
    details: `Title: ${post.title} | Slug: ${post.slug}`,
  });

  return NextResponse.json({ success: true, post });
}
