export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { WebsiteBlogPreview } from "@/components/preview/WebsiteBlogPreview";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FullScreenPreviewPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  await connectDB();

  const post = await BlogPost.findById(id).lean();
  if (!post) notFound();

  const related = await BlogPost.find({
    _id: { $ne: id },
    isTrashed: { $ne: true },
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(3)
    .select("title slug excerpt featuredImage categories publishedAt readTime createdAt")
    .lean();

  const serializedPost = JSON.parse(JSON.stringify(post));
  const serializedRelated = JSON.parse(JSON.stringify(related));

  return <WebsiteBlogPreview post={serializedPost} related={serializedRelated} />;
}
