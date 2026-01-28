import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("auto_done"),
      v.literal("notified"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("activities").order("desc");
    
    const activities = await query.collect();
    
    let filtered = activities;
    if (args.status) {
      filtered = activities.filter(a => a.status === args.status);
    }
    
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }
    
    return filtered;
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("task"),
      v.literal("commit"),
      v.literal("research"),
      v.literal("notification"),
      v.literal("approval_request")
    ),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("auto_done"),
      v.literal("notified"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("activities", {
      ...args,
      timestamp: Date.now(),
    });
    
    // If it's an approval request, create an approval record
    if (args.status === "pending_approval") {
      await ctx.db.insert("approvals", {
        activityId: id,
        requestedAt: Date.now(),
      });
    }
    
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("activities"),
    status: v.union(
      v.literal("auto_done"),
      v.literal("notified"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const todayActivities = activities.filter(a => a.timestamp >= todayStart);
    const pendingApprovals = activities.filter(a => a.status === "pending_approval");
    const commits = activities.filter(a => a.type === "commit");
    const tasks = activities.filter(a => a.type === "task");
    
    return {
      totalActivities: activities.length,
      todayActivities: todayActivities.length,
      pendingApprovals: pendingApprovals.length,
      totalCommits: commits.length,
      totalTasks: tasks.length,
      tasksCompletedToday: todayActivities.filter(a => a.type === "task" && a.status === "auto_done").length,
    };
  },
});
