import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all pending approvals (embedded data structure)
export const listPending = query({
  handler: async (ctx) => {
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Transform to format expected by frontend
    return approvals.map((approval) => ({
      ...approval,
      requestedAt: approval.createdAt,
      activity: {
        _id: approval._id,
        title: approval.title,
        description: approval.content,
        type: approval.type,
        metadata: approval.metadata,
      },
    }));
  },
});

// List all approvals with optional limit
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("approvals")
      .order("desc")
      .take(args.limit ?? 100);

    return approvals.map((approval) => ({
      ...approval,
      requestedAt: approval.createdAt,
      activity: {
        _id: approval._id,
        title: approval.title,
        description: approval.content,
        type: approval.type,
        metadata: approval.metadata,
      },
    }));
  },
});

// Approve a single approval
export const approve = mutation({
  args: {
    id: v.id("approvals"),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");

    await ctx.db.patch(args.id, {
      status: "approved",
      resolvedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reject a single approval
export const reject = mutation({
  args: {
    id: v.id("approvals"),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");

    await ctx.db.patch(args.id, {
      status: "rejected",
      resolvedAt: Date.now(),
    });

    return { success: true };
  },
});

// Bulk approve multiple approvals
export const bulkApprove = mutation({
  args: {
    ids: v.array(v.id("approvals")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const approval = await ctx.db.get(id);
      if (!approval) continue;

      await ctx.db.patch(id, {
        status: "approved",
        resolvedAt: Date.now(),
      });
    }

    return { success: true, count: args.ids.length };
  },
});

// Bulk reject multiple approvals
export const bulkReject = mutation({
  args: {
    ids: v.array(v.id("approvals")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const approval = await ctx.db.get(id);
      if (!approval) continue;

      await ctx.db.patch(id, {
        status: "rejected",
        resolvedAt: Date.now(),
      });
    }

    return { success: true, count: args.ids.length };
  },
});

// Update approval content (for edit mode)
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
      updates.content = args.content;
      // Also store edited version in metadata
      updates.metadata = {
        ...approval.metadata,
        editedContent: args.content,
      };
    }
    if (args.metadata !== undefined) {
      updates.metadata = { ...approval.metadata, ...args.metadata };
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }

    return { success: true };
  },
});

// Get stats for dashboard
export const getStats = query({
  handler: async (ctx) => {
    const approvals = await ctx.db.query("approvals").collect();
    const pending = approvals.filter((a) => a.status === "pending");
    const approved = approvals.filter((a) => a.status === "approved");
    const rejected = approvals.filter((a) => a.status === "rejected");

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const approvedToday = approved.filter(
      (a) => a.resolvedAt && a.resolvedAt >= todayStart
    ).length;

    const rejectedToday = rejected.filter(
      (a) => a.resolvedAt && a.resolvedAt >= todayStart
    ).length;

    // Calculate rejection rate
    const total = approved.length + rejected.length;
    const rejectionRate =
      total > 0 ? Math.round((rejected.length / total) * 100) : 0;

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

// Create a new approval (for agents to submit)
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
    const approvalId = await ctx.db.insert("approvals", {
      type: args.type,
      title: args.title,
      content: args.content,
      createdBy: args.createdBy ?? "agent",
      createdAt: Date.now(),
      status: "pending",
      metadata: {
        priority: "medium",
        ...args.metadata,
      },
    });

    return { approvalId };
  },
});
