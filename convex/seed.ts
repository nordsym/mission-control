import { mutation } from "./_generated/server";

export const seedData = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("activities").first();
    if (existing) {
      return { message: "Already seeded" };
    }

    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    // Seed activities
    const activities = [
      {
        timestamp: now - 30 * 60 * 1000,
        type: "task" as const,
        title: "Updated README documentation",
        description: "Added installation instructions and API documentation to the project README.",
        status: "auto_done" as const,
        metadata: { files: ["README.md"], linesChanged: 45 },
      },
      {
        timestamp: now - 2 * hour,
        type: "commit" as const,
        title: "feat: Add user authentication",
        description: "Implemented JWT-based authentication with refresh tokens.",
        status: "auto_done" as const,
        metadata: { sha: "a1b2c3d", branch: "main", filesChanged: 8 },
      },
      {
        timestamp: now - 4 * hour,
        type: "research" as const,
        title: "Researched payment providers",
        description: "Compared Stripe, Paddle, and LemonSqueezy for SaaS billing. Stripe recommended.",
        status: "notified" as const,
        metadata: { sources: 12, report: "payment-research.md" },
      },
      {
        timestamp: now - 6 * hour,
        type: "approval_request" as const,
        title: "Deploy to production?",
        description: "All tests passing. Ready to deploy v1.2.0 to production environment.",
        status: "pending_approval" as const,
        metadata: { version: "1.2.0", tests: 47, coverage: "92%" },
      },
      {
        timestamp: now - 8 * hour,
        type: "notification" as const,
        title: "New GitHub issue opened",
        description: "User reported a bug with dark mode toggle not persisting.",
        status: "notified" as const,
        metadata: { issueNumber: 42, priority: "medium" },
      },
      {
        timestamp: now - day,
        type: "task" as const,
        title: "Refactored database queries",
        description: "Optimized slow queries, reduced average response time by 40%.",
        status: "auto_done" as const,
        metadata: { queriesOptimized: 5, performanceGain: "40%" },
      },
      {
        timestamp: now - day - 2 * hour,
        type: "approval_request" as const,
        title: "Delete unused feature branch?",
        description: "Branch 'feature/old-ui' hasn't been updated in 30 days. Suggest deletion.",
        status: "pending_approval" as const,
        metadata: { branch: "feature/old-ui", lastUpdate: "30 days ago" },
      },
      {
        timestamp: now - day - 4 * hour,
        type: "commit" as const,
        title: "fix: Resolve memory leak in WebSocket handler",
        description: "Fixed connection not being properly closed on client disconnect.",
        status: "auto_done" as const,
        metadata: { sha: "e5f6g7h", branch: "main", filesChanged: 2 },
      },
    ];

    const activityIds: string[] = [];
    for (const activity of activities) {
      const id = await ctx.db.insert("activities", activity);
      activityIds.push(id);
    }

    // Create approvals for pending activities
    const pendingActivities = activities.filter(a => a.status === "pending_approval");
    for (let i = 0; i < pendingActivities.length; i++) {
      await ctx.db.insert("approvals", {
        activityId: activityIds[activities.indexOf(pendingActivities[i])] as any,
        requestedAt: pendingActivities[i].timestamp,
      });
    }

    // Seed some commands
    const commands = [
      { text: "Check build status", timestamp: now - hour, response: "✓ All builds passing" },
      { text: "Run tests", timestamp: now - 3 * hour, response: "47 tests passed, 0 failed" },
      { text: "Deploy staging", timestamp: now - 5 * hour, response: "Deployed to staging-app.vercel.app" },
    ];

    for (const command of commands) {
      await ctx.db.insert("commands", command);
    }

    // Seed daily summary
    const today = new Date().toISOString().split("T")[0];
    await ctx.db.insert("dailySummaries", {
      date: today,
      tasksCompleted: 3,
      approvalsProcessed: 1,
      summary: "Productive day! Completed documentation updates, shipped auth feature, and researched payment providers.",
    });

    // Seed settings
    await ctx.db.insert("settings", {
      key: "agentName",
      value: "Symbot",
    });
    await ctx.db.insert("settings", {
      key: "webhookUrl",
      value: "https://api.clawdbot.com/webhook/your-agent-id",
    });

    return { message: "Seeded successfully", activitiesCreated: activities.length };
  },
});
