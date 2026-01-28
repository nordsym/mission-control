"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StatCard } from "@/components/StatCard";
import { ActivityCard } from "@/components/ActivityCard";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const stats = useQuery(api.activities.getStats);
  const recentActivities = useQuery(api.activities.getRecent, { limit: 5 });
  const todaySummary = useQuery(api.dailySummaries.getToday);
  const seedData = useMutation(api.seed.seedData);
  const [seeding, setSeeding] = useState(false);

  // Auto-seed on first load if no data
  useEffect(() => {
    if (stats && stats.totalActivities === 0 && !seeding) {
      setSeeding(true);
      seedData().then(() => setSeeding(false));
    }
  }, [stats, seedData, seeding]);

  if (!stats || !recentActivities) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-cyan animate-pulse text-2xl">◈ Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
        <div className="bg-gradient-to-r from-cyan/10 via-purple/10 to-orange/10 border border-cyan/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-cyan mb-2">📊 Today&apos;s Summary</h2>
          <p className="text-text">{todaySummary.summary}</p>
          <div className="flex gap-6 mt-4 text-sm">
            <span className="text-green">✓ {todaySummary.tasksCompleted} tasks completed</span>
            <span className="text-purple">◉ {todaySummary.approvalsProcessed} approvals processed</span>
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

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Recent Activity</h2>
          <a href="/activity" className="text-cyan hover:underline text-sm">View all →</a>
        </div>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <ActivityCard key={activity._id} activity={activity} />
          ))}
          {recentActivities.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p className="text-4xl mb-2">◇</p>
              <p>No activity yet. Your agent is warming up...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
