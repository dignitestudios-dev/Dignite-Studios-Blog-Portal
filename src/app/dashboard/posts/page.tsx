"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiPlusCircle, FiEdit, FiTrash2, FiCopy, FiLoader } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Post = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
  publishedAt: string | null;
  "seo.seoScore": number;
  seo?: { seoScore: number };
  categories: string[];
  createdAt: string;
};

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
};

function SeoScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-500";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchPosts(s: string) {
    setLoading(true);
    const res = await fetch(`/api/posts?status=${s}&limit=50`, { cache: "no-store" });
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchPosts(status); }, [status]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to move post to trash");
        return;
      }
      setPosts((prev) => prev.filter((p) => p._id !== deleteTarget.id));
      toast.success("Post moved to trash");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleDuplicate(id: string) {
    setCloningId(id);
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    const { _id, slug, createdAt, updatedAt, publishedAt, ...rest } = post;
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, title: `Copy of ${rest.title}`, status: "draft" }),
    });
    await fetchPosts(status);
    setCloningId(null);
  }

  const filters = ["all", "published", "draft", "scheduled"];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Posts</h1>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#F15C20] hover:bg-[#d94d17] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <FiPlusCircle size={16} />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
              status === f
                ? "bg-[#F15C20] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#F15C20] hover:text-[#F15C20]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SEO</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-52 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </td>
                  <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-8 w-8 rounded-full" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No posts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SEO</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900 truncate max-w-xs">{post.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <SeoScoreBadge score={post.seo?.seoScore ?? 0} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/posts/${post._id}`}
                        className="p-1.5 text-gray-400 hover:text-[#F15C20] transition-colors"
                        title="Edit"
                      >
                        <FiEdit size={15} />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(post._id)}
                        disabled={cloningId === post._id}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-60"
                        title="Duplicate"
                      >
                        {cloningId === post._id ? (
                          <FiLoader size={15} className="animate-spin" />
                        ) : (
                          <FiCopy size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: post._id, title: post.title })}
                        className="p-1.5 text-gray-400 hover:text-[#EF3C36] transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move post to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be moved to the trash and its status will be changed to draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium bg-[#EF3C36] hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {deleting && (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {deleting ? "Moving..." : "Move to Trash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

