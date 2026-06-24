export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { PostEditor } from "@/components/editor/PostEditor";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const post = await BlogPost.findById(id).lean();
  if (!post) notFound();

  const serialized = JSON.parse(JSON.stringify(post));

  return <PostEditor initialPost={serialized} postId={id} />;
}
