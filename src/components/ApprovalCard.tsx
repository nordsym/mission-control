"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

type Approval = Doc<"approvals"> & {
  activity: Doc<"activities"> | null;
};

const riskColors: Record<string, string> = {
  low: "text-green bg-green/10 border-green/30",
  medium: "text-yellow bg-yellow/10 border-yellow/30",
  high: "text-orange bg-orange/10 border-orange/30",
  critical: "text-red bg-red/10 border-red/30",
};

export function ApprovalCard({ 
  approval, 
  selected, 
  onSelect 
}: { 
  approval: Approval;
  selected: boolean;
  onSelect: (id: Id<"approvals">) => void;
}) {
  const resolve = useMutation(api.approvals.resolve);
  
  if (!approval.activity) return null;
  
  const activity = approval.activity;
  const risk = (activity.metadata as any)?.risk ?? "medium";
  const timeAgo = getTimeAgo(approval.requestedAt);
  
  const handleResolve = async (resolution: "approved" | "rejected") => {
    await resolve({ id: approval._id, resolution });
  };
  
  return (
    <div className={`bg-surface border rounded-xl p-4 transition-all animate-slideIn ${
      selected ? "border-cyan" : "border-border hover:border-cyan/30"
    }`}>
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(approval._id)}
          className="mt-1 w-5 h-5 rounded border-border bg-surface-2 text-cyan focus:ring-cyan"
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-text">{activity.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColors[risk]}`}>
              {risk} risk
            </span>
          </div>
          
          <p className="text-sm text-text-muted mb-3">{activity.description}</p>
          
          {activity.metadata && (
            <div className="p-3 bg-surface-2 rounded-lg text-sm mb-4">
              <pre className="text-text-muted overflow-x-auto text-xs">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleResolve("approved")}
              className="px-4 py-2 bg-green/10 text-green border border-green/30 rounded-lg hover:bg-green/20 transition-colors flex items-center gap-2"
            >
              <span>✓</span> Approve
            </button>
            <button
              onClick={() => handleResolve("rejected")}
              className="px-4 py-2 bg-red/10 text-red border border-red/30 rounded-lg hover:bg-red/20 transition-colors flex items-center gap-2"
            >
              <span>✕</span> Reject
            </button>
            <span className="ml-auto text-xs text-text-muted">{timeAgo}</span>
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
