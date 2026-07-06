"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { TrashTab } from "@/components/settings/TrashTab";
import { ActivityLogsTab } from "@/components/settings/ActivityLogsTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "trash" | "logs">("profile");
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-20 bg-[#fafafa]/95 backdrop-blur-sm pt-8 px-8 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {/* Tabs Navigation */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "profile" 
                ? "text-[#F15C20] border-[#F15C20]" 
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Profile
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("trash")}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "trash" 
                    ? "text-[#F15C20] border-[#F15C20]" 
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Trash
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "logs" 
                    ? "text-[#F15C20] border-[#F15C20]" 
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                Activity Logs
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8">
        {activeTab === "profile" && <ProfileTab />}
        {isAdmin && activeTab === "trash" && <TrashTab />}
        {isAdmin && activeTab === "logs" && <ActivityLogsTab />}
      </div>
    </div>
  );
}
