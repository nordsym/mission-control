"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StatCard } from "@/components/StatCard";
import { KanbanBoard } from "@/components/KanbanBoard";

export default function Dashboard() {
  const stats = useQuery(api.activities.getStats);
  const todaySummary = useQuery(api.dailySummaries.getToday);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-cyan animate-pulse text-2xl">◈ Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Mission Control</h1>
          <p className="text-text-muted mt-1">Your AI agent at a glance</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-muted">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric"
            })}
          </p>
        </div>
      </div>

      {/* Today's Summary */}
      {todaySummary && (
        <div className="bg-gradient-to-r from-cyan/10 via-purple/10 to-orange/10 border border-cyan/30 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-cyan mb-2">📊 Today&apos;s Summary</h2>
          <p className="text-text text-sm">{todaySummary.summary}</p>
          <div className="flex gap-6 mt-3 text-sm">
            <span className="text-green">✓ {todaySummary.tasksCompleted} tasks</span>
            <span className="text-purple">◉ {todaySummary.approvalsProcessed} approvals</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Activity"
          value={stats.todayActivities}
          icon="◈"
          color="cyan"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          icon="⚠"
          color={stats.pendingApprovals > 0 ? "orange" : "green"}
        />
        <StatCard
          label="Total Commits"
          value={stats.totalCommits}
          icon="⟠"
          color="purple"
        />
        <StatCard
          label="Tasks Done Today"
          value={stats.tasksCompletedToday}
          icon="✓"
          color="green"
        />
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Activity Board</h2>
        <KanbanBoard />
      </div>
    </div>
  );
}
