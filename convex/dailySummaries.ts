import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getToday = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const summaries = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    
    return summaries;
  },
});

export const getRecent = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.days ?? 7;
    return await ctx.db
      .query("dailySummaries")
      .order("desc")
      .take(limit);
  },
});

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
  },
});

export const getDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const summaries = await ctx.db.query("dailySummaries").collect();
    return summaries.filter(s => s.date >= args.startDate && s.date <= args.endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const upsert = mutation({
  args: {
    date: v.optional(v.string()),
    tasksCompleted: v.optional(v.number()),
    commitsCount: v.optional(v.number()),
    researchCount: v.optional(v.number()),
    notificationsCount: v.optional(v.number()),
    approvalRequestsCount: v.optional(v.number()),
    approvalsProcessed: v.optional(v.number()),
    approvalsApproved: v.optional(v.number()),
    approvalsRejected: v.optional(v.number()),
    sourceBreakdown: v.optional(v.any()),
    summary: v.string(),
    highlights: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const date = args.date ?? new Date().toISOString().split("T")[0];
    
    const existing = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
    
    const data = {
      date,
      tasksCompleted: args.tasksCompleted ?? 0,
      commitsCount: args.commitsCount ?? 0,
      researchCount: args.researchCount ?? 0,
      notificationsCount: args.notificationsCount ?? 0,
      approvalRequestsCount: args.approvalRequestsCount ?? 0,
      approvalsProcessed: args.approvalsProcessed ?? 0,
      approvalsApproved: args.approvalsApproved ?? 0,
      approvalsRejected: args.approvalsRejected ?? 0,
      sourceBreakdown: args.sourceBreakdown,
      summary: args.summary,
      highlights: args.highlights,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    
    return await ctx.db.insert("dailySummaries", data);
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const summaries = await ctx.db.query("dailySummaries").collect();
    
    if (summaries.length === 0) {
      return {
        totalDays: 0,
        totalTasks: 0,
        totalCommits: 0,
        avgTasksPerDay: 0,
        compressedDays: 0,
      };
    }
    
    const totalTasks = summaries.reduce((sum, s) => sum + (s.tasksCompleted ?? 0), 0);
    const totalCommits = summaries.reduce((sum, s) => sum + (s.commitsCount ?? 0), 0);
    const compressedDays = summaries.filter(s => s.compressedAt).length;
    
    return {
      totalDays: summaries.length,
      totalTasks,
      totalCommits,
      avgTasksPerDay: Math.round(totalTasks / summaries.length * 10) / 10,
      compressedDays,
      dateRange: {
        oldest: summaries.map(s => s.date).sort()[0],
        newest: summaries.map(s => s.date).sort().slice(-1)[0],
      },
    };
  },
});
