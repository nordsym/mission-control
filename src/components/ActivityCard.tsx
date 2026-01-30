"use client";

import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";

type Activity = Doc<"activities">;

const typeIcons: Record<Activity["type"], string> = {
  task: "✓",
  commit: "⟠",
  research: "◎",
  notification: "◆",
  approval_request: "⚠",
};

const typeColors: Record<Activity["type"], string> = {
  task: "text-green",
  commit: "text-purple",
  research: "text-cyan",
  notification: "text-yellow",
  approval_request: "text-orange",
};

const statusIndicators: Record<Activity["status"], { color: string; label: string }> = {
  auto_done: { color: "bg-green", label: "Auto" },
  notified: { color: "bg-yellow", label: "Notified" },
  pending_approval: { color: "bg-orange animate-pulse", label: "Pending" },
  approved: { color: "bg-green", label: "Approved" },
  rejected: { color: "bg-red", label: "Rejected" },
};

export function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);
  
  const timeAgo = getTimeAgo(activity.timestamp);
  const status = statusIndicators[activity.status];
  
  return (
    <div 
      className="bg-surface border border-border rounded-xl p-4 hover:border-cyan/30 transition-all cursor-pointer animate-slideIn"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-lg ${typeColors[activity.type]}`}>
          {typeIcons[activity.type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-text truncate">{activity.title}</h3>
            <span className={`w-2 h-2 rounded-full ${status.color}`} title={status.label}></span>
          </div>
          <p className="text-sm text-text-muted line-clamp-2">{activity.description}</p>
          
          {expanded && activity.metadata && (
            <div className="mt-3 p-3 bg-surface-2 rounded-lg text-sm animate-fadeIn">
              <pre className="text-text-muted overflow-x-auto">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <span className="text-xs text-text-muted">{timeAgo}</span>
          <div className="mt-1 flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full bg-surface-2 ${typeColors[activity.type]}`}>
              {activity.type}
            </span>
            {activity.source && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple/20 text-purple">
                {activity.source}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
