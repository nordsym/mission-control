import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all pending approvals with activity data
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

// List all approvals (not just pending)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("approvals")
      .order("desc")
      .take(args.limit ?? 100);
    
    const withActivities = await Promise.all(
      approvals.map(async (approval) => {
        const activity = await ctx.db.get(approval.activityId);
        return { ...approval, activity };
      })
    );
    
    return withActivities;
  },
});

// Resolve (approve/reject) a single approval
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

// Approve shortcut
export const approve = mutation({
  args: {
    id: v.id("approvals"),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");
    
    await ctx.db.patch(args.id, {
      resolution: "approved",
      resolvedAt: Date.now(),
      resolvedBy: "user",
    });
    
    await ctx.db.patch(approval.activityId, {
      status: "approved",
    });
    
    return { success: true };
  },
});

// Reject shortcut
export const reject = mutation({
  args: {
    id: v.id("approvals"),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");
    
    await ctx.db.patch(args.id, {
      resolution: "rejected",
      resolvedAt: Date.now(),
      resolvedBy: "user",
    });
    
    await ctx.db.patch(approval.activityId, {
      status: "rejected",
    });
    
    return { success: true };
  },
});

// Bulk resolve multiple approvals
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

// Bulk approve
export const bulkApprove = mutation({
  args: {
    ids: v.array(v.id("approvals")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const approval = await ctx.db.get(id);
      if (!approval) continue;
      
      await ctx.db.patch(id, {
        resolution: "approved",
        resolvedAt: Date.now(),
        resolvedBy: "user",
      });
      
      await ctx.db.patch(approval.activityId, {
        status: "approved",
      });
    }
    
    return { success: true, count: args.ids.length };
  },
});

// Bulk reject
export const bulkReject = mutation({
  args: {
    ids: v.array(v.id("approvals")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const approval = await ctx.db.get(id);
      if (!approval) continue;
      
      await ctx.db.patch(id, {
        resolution: "rejected",
        resolvedAt: Date.now(),
        resolvedBy: "user",
      });
      
      await ctx.db.patch(approval.activityId, {
        status: "rejected",
      });
    }
    
    return { success: true, count: args.ids.length };
  },
});

// Update an approval's activity content (for edit mode)
export const update = mutation({
  args: {
    id: v.id("approvals"),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");
    
    const updates: Record<string, unknown> = {};
    if (args.content !== undefined) {
      updates.description = args.content;
    }
    if (args.metadata !== undefined) {
      updates.metadata = args.metadata;
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(approval.activityId, updates);
    }
    
    return { success: true };
  },
});

// Get stats for dashboard
export const getStats = query({
  handler: async (ctx) => {
    const approvals = await ctx.db.query("approvals").collect();
    const pending = approvals.filter(a => !a.resolution);
    const approved = approvals.filter(a => a.resolution === "approved");
    const rejected = approvals.filter(a => a.resolution === "rejected");
    
    // Calculate today's approvals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const approvedToday = approved.filter(a => 
      a.resolvedAt && a.resolvedAt >= todayStart
    ).length;
    
    const rejectedToday = rejected.filter(a =>
      a.resolvedAt && a.resolvedAt >= todayStart
    ).length;
    
    // Calculate rejection rate
    const total = approved.length + rejected.length;
    const rejectionRate = total > 0 
      ? Math.round((rejected.length / total) * 100) 
      : 0;
    
    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      approvedToday,
      rejectedToday,
      rejectionRate,
      total: approvals.length,
    };
  },
});

// Create a new approval (for agent use)
export const create = mutation({
  args: {
    type: v.union(
      v.literal("email"),
      v.literal("lead"),
      v.literal("meeting"),
      v.literal("task"),
      v.literal("other")
    ),
    title: v.string(),
    content: v.string(),
    createdBy: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Map approval type to activity type
    const activityType = args.type === "email" || args.type === "lead" || args.type === "meeting" 
      ? "approval_request" 
      : "task";
    
    // Create the activity
    const activityId = await ctx.db.insert("activities", {
      timestamp: Date.now(),
      type: activityType,
      title: args.title,
      description: args.content,
      status: "pending_approval",
      metadata: {
        ...args.metadata,
        approvalType: args.type,
        createdBy: args.createdBy ?? "agent",
      },
    });
    
    // Create the approval
    const approvalId = await ctx.db.insert("approvals", {
      activityId,
      requestedAt: Date.now(),
    });
    
    return { approvalId, activityId };
  },
});
