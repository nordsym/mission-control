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

export const upsert = mutation({
  args: {
    date: v.string(),
    tasksCompleted: v.number(),
    approvalsProcessed: v.number(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailySummaries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        tasksCompleted: args.tasksCompleted,
        approvalsProcessed: args.approvalsProcessed,
        summary: args.summary,
      });
      return existing._id;
    }
    
    return await ctx.db.insert("dailySummaries", args);
  },
});
