"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FiFileText, FiTag, FiLogOut, FiPlusCircle, FiBook, FiUser } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: MdDashboard, exact: true },
  { href: "/dashboard/posts", label: "All Posts", icon: FiFileText, exact: true },
  { href: "/dashboard/posts/new", label: "New Post", icon: FiPlusCircle, exact: false },
  { href: "/dashboard/categories", label: "Categories", icon: FiTag, exact: false },
  { href: "/dashboard/guide", label: "User Guide", icon: FiBook, exact: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-full z-10">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-center">
          <Image
            src="/logo.png"
            alt="Dignite Studios"
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#F15C20] text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User Info + Sign Out */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F15C20] flex items-center justify-center flex-shrink-0">
              <FiUser size={15} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {(session?.user as { name?: string })?.name || "Admin"}
              </p>
              <p className="text-[11px] text-gray-400 truncate leading-tight">
                {(session?.user as { email?: string })?.email}
              </p>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#F15C20]">
                {(session?.user as { role?: string })?.role || "admin"}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#EF3C36] transition-colors flex-shrink-0"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
