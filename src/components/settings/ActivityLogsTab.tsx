"use client";

import { useState, useEffect } from "react";
import { FiClock, FiUser, FiInfo, FiRefreshCw } from "react-icons/fi";

interface ActivityLog {
  _id: string;
  action: string;
  user: string;
  details: string;
  createdAt: string;
}

// Module-level cache so it persists between tab switches
let cachedLogs: ActivityLog[] | null = null;

export function ActivityLogsTab() {
  const [logs, setLogs] = useState<ActivityLog[]>(cachedLogs || []);
  const [loading, setLoading] = useState(!cachedLogs);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    
    try {
      const res = await fetch("/api/activity-logs", { cache: "no-store" });
      const data = await res.json();
      cachedLogs = data.logs || [];
      setLogs(cachedLogs as ActivityLog[]);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch silently on mount to get cross-page updates without flashing a loader
    fetchLogs(false);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Activity Logs</h2>
        <button
          onClick={() => fetchLogs(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No activity logs found.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log._id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{log.action}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <FiUser size={13} className="text-gray-400" />
                      {log.user}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiClock size={13} className="text-gray-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 inline-flex">
                    <FiInfo size={13} className="text-gray-400 shrink-0" />
                    {log.details}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
