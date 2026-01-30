import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════
// DEAL STAGES - Ordered pipeline
// ═══════════════════════════════════════════════════════════════
export const DEAL_STAGES = [
  "lead",
  "contact_made", 
  "meeting_booked",
  "meeting_done",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
  "on_hold",
] as const;

const stageValidator = v.union(
  v.literal("lead"),
  v.literal("contact_made"),
  v.literal("meeting_booked"),
  v.literal("meeting_done"),
  v.literal("proposal_sent"),
  v.literal("negotiating"),
  v.literal("won"),
  v.literal("lost"),
  v.literal("on_hold")
);

const sourceValidator = v.union(
  v.literal("referral"),
  v.literal("inbound"),
  v.literal("outbound"),
  v.literal("tender"),
  v.literal("event"),
  v.literal("other")
);

const activityTypeValidator = v.union(
  v.literal("email"),
  v.literal("meeting"),
  v.literal("call"),
  v.literal("note"),
  v.literal("stage_change")
);

const contactValidator = v.object({
  name: v.string(),
  email: v.optional(v.string()),
  role: v.optional(v.string()),
});

// ═══════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new deal
 */
export const create = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    value: v.optional(v.number()),
    stage: v.optional(stageValidator),
    owner: v.string(),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    source: v.optional(sourceValidator),
    contacts: v.optional(v.array(contactValidator)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const dealId = await ctx.db.insert("deals", {
      title: args.title,
      company: args.company,
      value: args.value,
      stage: args.stage ?? "lead",
      owner: args.owner,
      nextAction: args.nextAction,
      nextActionDate: args.nextActionDate,
      notes: args.notes,
      source: args.source,
      contacts: args.contacts,
      createdAt: now,
      updatedAt: now,
    });

    // Log creation as activity
    await ctx.db.insert("dealActivities", {
      dealId,
      type: "note",
      description: `Deal created: ${args.title} (${args.company})`,
      timestamp: now,
      createdBy: args.owner,
    });

    return dealId;
  },
});

/**
 * Update deal fields (not stage - use move() for that)
 */
export const update = mutation({
  args: {
    id: v.id("deals"),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    value: v.optional(v.number()),
    owner: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    source: v.optional(sourceValidator),
    contacts: v.optional(v.array(contactValidator)),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Deal not found");

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, cleanUpdates);
    return id;
  },
});

/**
 * Move deal to new stage (with auto-logged activity)
 */
export const move = mutation({
  args: {
    id: v.id("deals"),
    stage: stageValidator,
    note: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) throw new Error("Deal not found");

    const now = Date.now();
    const fromStage = deal.stage;
    const toStage = args.stage;

    // Update deal stage
    await ctx.db.patch(args.id, {
      stage: toStage,
      updatedAt: now,
    });

    // Auto-log stage change
    await ctx.db.insert("dealActivities", {
      dealId: args.id,
      type: "stage_change",
      description: args.note || `Moved from ${fromStage} → ${toStage}`,
      timestamp: now,
      createdBy: args.createdBy || deal.owner,
      metadata: { from: fromStage, to: toStage },
    });

    return { from: fromStage, to: toStage };
  },
});

/**
 * Add activity to a deal
 */
export const addActivity = mutation({
  args: {
    dealId: v.id("deals"),
    type: activityTypeValidator,
    description: v.string(),
    createdBy: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    const now = Date.now();

    // Create activity
    const activityId = await ctx.db.insert("dealActivities", {
      dealId: args.dealId,
      type: args.type,
      description: args.description,
      timestamp: now,
      createdBy: args.createdBy,
      metadata: args.metadata,
    });

    // Update deal's updatedAt
    await ctx.db.patch(args.dealId, { updatedAt: now });

    return activityId;
  },
});

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * List deals, optionally filtered by stage
 */
export const list = query({
  args: {
    stage: v.optional(stageValidator),
    owner: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let deals;

    if (args.stage) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_stage", (q) => q.eq("stage", args.stage!))
        .order("desc")
        .collect();
    } else if (args.owner) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_owner", (q) => q.eq("owner", args.owner!))
        .order("desc")
        .collect();
    } else {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_updatedAt")
        .order("desc")
        .collect();
    }

    // Apply limit if specified
    if (args.limit && deals.length > args.limit) {
      deals = deals.slice(0, args.limit);
    }

    return deals;
  },
});

/**
 * Get full pipeline view (grouped by stage)
 */
export const pipeline = query({
  args: {},
  handler: async (ctx) => {
    const deals = await ctx.db.query("deals").collect();
    
    // Group by stage
    const grouped: Record<string, typeof deals> = {};
    for (const stage of DEAL_STAGES) {
      grouped[stage] = deals.filter((d) => d.stage === stage);
    }

    // Calculate totals
    const activeDeals = deals.filter(
      (d) => !["won", "lost", "on_hold"].includes(d.stage)
    );
    const totalValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonValue = grouped["won"].reduce((sum, d) => sum + (d.value || 0), 0);

    return {
      stages: grouped,
      stats: {
        totalDeals: deals.length,
        activeDeals: activeDeals.length,
        totalPipelineValue: totalValue,
        wonValue,
      },
    };
  },
});

/**
 * Get deal with all activities
 */
export const getWithActivities = query({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) return null;

    const activities = await ctx.db
      .query("dealActivities")
      .withIndex("by_dealId", (q) => q.eq("dealId", args.id))
      .order("desc")
      .collect();

    return { ...deal, activities };
  },
});

/**
 * Find stale deals (no activity in X days)
 */
export const stale = query({
  args: {
    days: v.optional(v.number()), // Default 7
    owner: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const daysThreshold = args.days ?? 7;
    const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

    // Get active deals (not won/lost/on_hold)
    let deals = await ctx.db.query("deals").collect();
    deals = deals.filter(
      (d) => !["won", "lost", "on_hold"].includes(d.stage)
    );

    // Filter by owner if specified
    if (args.owner) {
      deals = deals.filter((d) => d.owner === args.owner);
    }

    // Find stale ones
    const staleDeals = [];
    for (const deal of deals) {
      // Get last activity
      const activities = await ctx.db
        .query("dealActivities")
        .withIndex("by_dealId", (q) => q.eq("dealId", deal._id))
        .order("desc")
        .first();

      const lastActivity = activities?.timestamp || deal.createdAt;
      if (lastActivity < cutoff) {
        staleDeals.push({
          ...deal,
          lastActivityAt: lastActivity,
          daysSinceActivity: Math.floor(
            (Date.now() - lastActivity) / (24 * 60 * 60 * 1000)
          ),
        });
      }
    }

    // Sort by staleness
    return staleDeals.sort(
      (a, b) => a.lastActivityAt - b.lastActivityAt
    );
  },
});

/**
 * Get recent activities across all deals
 */
export const recentActivities = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const activities = await ctx.db
      .query("dealActivities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    // Enrich with deal info
    const enriched = await Promise.all(
      activities.map(async (activity) => {
        const deal = await ctx.db.get(activity.dealId);
        return {
          ...activity,
          dealTitle: deal?.title,
          dealCompany: deal?.company,
        };
      })
    );

    return enriched;
  },
});
