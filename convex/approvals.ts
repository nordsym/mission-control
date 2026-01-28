import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listPending = query({
  handler: async (ctx) => {
    const approvals = await ctx.db
      .query("approvals")
      .order("desc")
      .collect();
    
    const pending = approvals.filter(a => !a.resolution);
    
    // Fetch associated activities
    const withActivities = await Promise.all(
      pending.map(async (approval) => {
        const activity = await ctx.db.get(approval.activityId);
        return { ...approval, activity };
      })
    );
    
    return withActivities;
  },
});

export const resolve = mutation({
  args: {
    id: v.id("approvals"),
    resolution: v.union(v.literal("approved"), v.literal("rejected")),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");
    
    await ctx.db.patch(args.id, {
      resolution: args.resolution,
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy ?? "user",
    });
    
    // Update the activity status
    await ctx.db.patch(approval.activityId, {
      status: args.resolution,
    });
    
    return { success: true };
  },
});

export const bulkResolve = mutation({
  args: {
    ids: v.array(v.id("approvals")),
    resolution: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const approval = await ctx.db.get(id);
      if (!approval) continue;
      
      await ctx.db.patch(id, {
        resolution: args.resolution,
        resolvedAt: Date.now(),
        resolvedBy: "user",
      });
      
      await ctx.db.patch(approval.activityId, {
        status: args.resolution,
      });
    }
    
    return { success: true, count: args.ids.length };
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const approvals = await ctx.db.query("approvals").collect();
    const pending = approvals.filter(a => !a.resolution);
    const approved = approvals.filter(a => a.resolution === "approved");
    const rejected = approvals.filter(a => a.resolution === "rejected");
    
    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      total: approvals.length,
    };
  },
});
