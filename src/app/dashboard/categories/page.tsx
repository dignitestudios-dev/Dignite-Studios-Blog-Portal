"use client";
import { useEffect, useState } from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";
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

type Category = { _id: string; name: string; slug: string; description: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
    });
    setName("");
    setDesc("");
    setCreating(false);
    load();
  }

  async function confirmRemove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget.id));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      {/* Add form */}
      <form onSubmit={create} className="bg-white border border-gray-100 rounded-xl p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm">Add New Category</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
        />
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
        />
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-[#F15C20] hover:bg-[#d94d17] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          <FiPlus size={14} />
          {creating ? "Adding..." : "Add Category"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <ul className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </li>
            ))}
          </ul>
        ) : categories.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <li key={cat._id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400">/{cat.slug}{cat.description ? ` — ${cat.description}` : ""}</p>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: cat._id, name: cat.name })}
                  className="p-1.5 text-gray-400 hover:text-[#EF3C36] transition-colors"
                >
                  <FiTrash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed. Posts already using
              it keep the name until they are edited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium bg-[#EF3C36] hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
