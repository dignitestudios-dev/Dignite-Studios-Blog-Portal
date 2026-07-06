"use client";

import { useState, useEffect } from "react";
import { FiTrash2, FiRotateCcw, FiRefreshCw, FiLoader } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  _id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  trashedAt?: string;
}

// Module-level cache so it persists between tab switches
let cachedTrashPosts: Post[] | null = null;

export function TrashTab() {
  const [trashedPosts, setTrashedPosts] = useState<Post[]>(cachedTrashPosts || []);
  const [loading, setLoading] = useState(!cachedTrashPosts);
  const [refreshing, setRefreshing] = useState(false);

  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrashedPosts = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    
    try {
      const res = await fetch("/api/posts?isTrashed=true", { cache: "no-store" });
      const data = await res.json();
      cachedTrashPosts = data.posts || [];
      setTrashedPosts(cachedTrashPosts as Post[]);
    } catch (err) {
      console.error("Failed to fetch trashed posts", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch silently on mount to get cross-page updates, use refresh state only when explicitly clicking refresh
    fetchTrashedPosts(false);
  }, []);

  const restorePost = async () => {
    if (!confirmRestoreId) return;
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/posts/${confirmRestoreId}/restore`, { method: "POST" });
      if (res.ok) {
        const updated = trashedPosts.filter(p => p._id !== confirmRestoreId);
        cachedTrashPosts = updated;
        setTrashedPosts(updated);
        setConfirmRestoreId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const deletePermanently = async () => {
    if (!confirmDeleteId) return;
    if (deleteInput !== "DELETE") {
      alert("You must type 'DELETE' exactly.");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${confirmDeleteId}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        const updated = trashedPosts.filter(p => p._id !== confirmDeleteId);
        cachedTrashPosts = updated;
        setTrashedPosts(updated);
        setConfirmDeleteId(null);
        setDeleteInput("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Trash</h2>
        <button
          onClick={() => fetchTrashedPosts(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading trash...</div>
      ) : trashedPosts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Trash is empty.</p>
        </div>
      ) : (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Post Title</th>
              <th className="px-6 py-4 w-32">Trashed At</th>
              <th className="px-6 py-4 w-40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trashedPosts.map((post) => (
              <tr key={post._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{post.title || "Untitled"}</span>
                  <div className="text-gray-400 text-xs mt-0.5">/blog/{post.slug}</div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {post.trashedAt ? new Date(post.trashedAt).toLocaleDateString() : "Unknown"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setConfirmRestoreId(post._id)}
                      className="text-gray-400 hover:text-emerald-600 transition-colors"
                      title="Restore"
                    >
                      <FiRotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(post._id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Permanently"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Restore Dialog */}
      <AlertDialog open={!!confirmRestoreId} onOpenChange={(o) => {
        if (!o && !isRestoring) setConfirmRestoreId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this post? It will be moved back to your posts as a draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                restorePost();
              }} 
              disabled={isRestoring}
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            >
              {isRestoring ? <FiLoader className="animate-spin" /> : null}
              {isRestoring ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Permanently Dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => {
        if (!o && !isDeleting) setConfirmDeleteId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post and remove its data from our servers.
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-900 block mb-1">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="DELETE"
                  disabled={isDeleting}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                deletePermanently();
              }}
              disabled={deleteInput !== "DELETE" || isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? <FiLoader className="animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
