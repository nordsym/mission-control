"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ActivityCard } from "@/components/ActivityCard";

type StatusFilter = "all" | "auto_done" | "notified" | "pending_approval";

const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
  { value: "all", label: "All", color: "bg-surface-2" },
  { value: "auto_done", label: "🟢 Auto", color: "bg-green/20 text-green" },
  { value: "notified", label: "🟡 Notified", color: "bg-yellow/20 text-yellow" },
  { value: "pending_approval", label: "🔴 Pending", color: "bg-orange/20 text-orange" },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  
  const activities = useQuery(api.activities.list, 
    filter === "all" ? {} : { status: filter as any }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Activity Feed</h1>
        <p className="text-text-muted mt-1">Real-time log of your agent&apos;s activities</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setFilter(sf.value)}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === sf.value
                ? `${sf.color} border border-current`
                : "bg-surface-2 text-text-muted hover:text-text"
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-cyan animate-pulse text-xl">◈ Loading...</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-text-muted bg-surface border border-border rounded-xl">
            <p className="text-4xl mb-2">◇</p>
            <p>No activities match this filter</p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityCard key={activity._id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}
