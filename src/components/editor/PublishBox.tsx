"use client";
import { useState } from "react";
import { FiEye, FiCalendar } from "react-icons/fi";

interface PublishBoxProps {
  status: "draft" | "published" | "scheduled";
  scheduledAt: string;
  slug: string;
  onStatusChange: (status: "draft" | "published" | "scheduled") => void;
  onScheduledAtChange: (date: string) => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
}

export function PublishBox({
  status,
  scheduledAt,
  slug,
  onStatusChange,
  onScheduledAtChange,
  onSave,
  onPublish,
  saving,
}: PublishBoxProps) {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://dignitestudios.com";
  const previewUrl = `${websiteUrl}/blog/${slug || "preview"}`;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Publish</h3>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as "draft" | "published" | "scheduled")}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {/* Schedule date */}
      {status === "scheduled" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <FiCalendar className="inline mr-1" size={12} />
            Publish Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20]"
          />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={onPublish}
          disabled={saving}
          className="w-full py-2 bg-[#F15C20] hover:bg-[#d94d17] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {status === "published" ? "Update" : "Publish"}
        </button>
        {slug && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiEye size={14} />
            Preview
          </a>
        )}
      </div>
    </div>
  );
}
