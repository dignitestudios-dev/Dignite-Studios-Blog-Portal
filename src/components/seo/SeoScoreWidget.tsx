"use client";
import { SeoAnalysis, SeoCheck } from "@/hooks/useSeoAnalysis";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useState } from "react";

interface SeoScoreProps {
  analysis: SeoAnalysis;
}

function CheckIcon({ status }: { status: SeoCheck["status"] }) {
  if (status === "pass") return <span className="text-green-500 text-base">✓</span>;
  if (status === "warn") return <span className="text-yellow-500 text-base">○</span>;
  return <span className="text-red-500 text-base">✕</span>;
}

export function SeoScoreWidget({ analysis }: SeoScoreProps) {
  const [open, setOpen] = useState(false);
  const { seoScore, checks } = analysis;

  const color =
    seoScore >= 70 ? "text-green-600" : seoScore >= 40 ? "text-yellow-500" : "text-red-500";
  const ring =
    seoScore >= 70 ? "border-green-500" : seoScore >= 40 ? "border-yellow-400" : "border-red-500";
  const label = seoScore >= 70 ? "Good" : seoScore >= 40 ? "Needs Work" : "Poor";

  const passes = checks.filter((c) => c.status === "pass").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const fails = checks.filter((c) => c.status === "fail").length;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">SEO Analysis</h3>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
      </div>

      {/* Score circle */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className={`w-14 h-14 rounded-full border-4 ${ring} flex items-center justify-center`}
        >
          <span className={`text-lg font-bold ${color}`}>{seoScore}</span>
        </div>
        <div>
          <p className={`font-semibold text-sm ${color}`}>{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {passes} good · {warns} ok · {fails} issues
          </p>
        </div>
      </div>

      {open && (
        <ul className="space-y-1.5 mt-3 border-t border-gray-100 pt-3">
          {checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-xs">
              <CheckIcon status={check.status} />
              <span className={check.status === "fail" ? "text-red-700" : "text-gray-600"}>
                {check.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
