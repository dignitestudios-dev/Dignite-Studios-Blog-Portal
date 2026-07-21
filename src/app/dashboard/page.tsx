export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { FiPlusCircle, FiFileText, FiCheckCircle } from "react-icons/fi";

async function getStats() {
  await connectDB();
  const baseQuery = { isTrashed: { $ne: true } };
  const [total, published, drafts] = await Promise.all([
    BlogPost.countDocuments(baseQuery),
    BlogPost.countDocuments({ ...baseQuery, status: "published" }),
    BlogPost.countDocuments({ ...baseQuery, status: "draft" }),
  ]);
  return { total, published, drafts };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Posts", value: stats.total, icon: FiFileText, color: "text-gray-700" },
    { label: "Published", value: stats.published, icon: FiCheckCircle, color: "text-green-600" },
    { label: "Drafts", value: stats.drafts, icon: FiFileText, color: "text-yellow-500" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your blog posts and SEO</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#F15C20] hover:bg-[#d94d17] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <FiPlusCircle size={16} />
          New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`${color} mb-2`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {stats.total === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Quick Start</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create a new post and fill in the SEO panel to maximize your search visibility.
          </p>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F15C20] hover:bg-[#d94d17] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <FiPlusCircle size={16} />
            Write your first post
          </Link>
        </div>
      )}
    </div>
  );
}
