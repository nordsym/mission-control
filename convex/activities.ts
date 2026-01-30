import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Time constants
const DAYS_TO_MS = 24 * 60 * 60 * 1000;
const ARCHIVE_THRESHOLD_DAYS = 7;
const COMPRESS_THRESHOLD_DAYS = 90;

// ============================================
// EXISTING QUERIES (HOT TIER)
// ============================================

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
    source: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("activities", {
      ...args,
      timestamp: Date.now(),
    });
    
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

// ============================================
// ARCHIVE FUNCTIONS (HOT -> WARM)
// ============================================

/**
 * Archive activities older than 7 days
 * Moves from activities (HOT) to activities_archive (WARM)
 */
export const archive = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoff = now - (ARCHIVE_THRESHOLD_DAYS * DAYS_TO_MS);
    
    // Get activities older than cutoff
    const oldActivities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();
    
    if (args.dryRun) {
      return {
        dryRun: true,
        activitiesToArchive: oldActivities.length,
        oldestActivity: oldActivities.length > 0 
          ? new Date(Math.min(...oldActivities.map(a => a.timestamp))).toISOString()
          : null,
        cutoffDate: new Date(cutoff).toISOString(),
      };
    }
    
    let archived = 0;
    for (const activity of oldActivities) {
      // Insert into archive
      await ctx.db.insert("activities_archive", {
        timestamp: activity.timestamp,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        status: activity.status,
        source: activity.source,
        metadata: activity.metadata,
        archivedAt: now,
        originalId: activity._id,
      });
      
      // Delete from hot tier
      await ctx.db.delete(activity._id);
      archived++;
    }
    
    return {
      archived,
      cutoffDate: new Date(cutoff).toISOString(),
      timestamp: new Date(now).toISOString(),
    };
  },
});

// ============================================
// WARM TIER QUERIES
// ============================================

/**
 * Query archived activities
 */
export const getArchived = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("task"),
      v.literal("commit"),
      v.literal("research"),
      v.literal("notification"),
      v.literal("approval_request")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("activities_archive")
      .withIndex("by_timestamp")
      .order("desc");
    
    let results = await query.collect();
    
    // Filter by type if specified
    if (args.type) {
      results = results.filter(a => a.type === args.type);
    }
    
    // Filter by date range if specified
    if (args.startDate) {
      results = results.filter(a => a.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter(a => a.timestamp <= args.endDate!);
    }
    
    // Limit results
    const limit = args.limit ?? 50;
    return results.slice(0, limit);
  },
});

/**
 * Get archive statistics
 */
export const getArchiveStats = query({
  handler: async (ctx) => {
    const archived = await ctx.db.query("activities_archive").collect();
    
    const byType = archived.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const oldest = archived.length > 0 
      ? Math.min(...archived.map(a => a.timestamp))
      : null;
    const newest = archived.length > 0
      ? Math.max(...archived.map(a => a.timestamp))
      : null;
    
    return {
      totalArchived: archived.length,
      byType,
      oldestTimestamp: oldest,
      newestTimestamp: newest,
      oldestDate: oldest ? new Date(oldest).toISOString() : null,
      newestDate: newest ? new Date(newest).toISOString() : null,
    };
  },
});

// ============================================
// COMPRESS FUNCTIONS (WARM -> COLD)
// ============================================

/**
 * Compress archived activities older than 90 days into daily summaries
 */
export const compress = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoff = now - (COMPRESS_THRESHOLD_DAYS * DAYS_TO_MS);
    
    // Get archived activities older than 90 days
    const oldArchived = await ctx.db
      .query("activities_archive")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();
    
    if (oldArchived.length === 0) {
      return { compressed: 0, message: "No activities to compress" };
    }
    
    // Group by date
    const byDate: Record<string, typeof oldArchived> = {};
    for (const activity of oldArchived) {
      const date = new Date(activity.timestamp).toISOString().split("T")[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(activity);
    }
    
    if (args.dryRun) {
      return {
        dryRun: true,
        activitiesToCompress: oldArchived.length,
        daysToSummarize: Object.keys(byDate).length,
        dateRange: {
          from: Object.keys(byDate).sort()[0],
          to: Object.keys(byDate).sort().slice(-1)[0],
        },
        cutoffDate: new Date(cutoff).toISOString(),
      };
    }
    
    let summariesCreated = 0;
    let activitiesDeleted = 0;
    
    for (const [date, activities] of Object.entries(byDate)) {
      // Calculate stats for this day
      const tasksCompleted = activities.filter(a => a.type === "task" && a.status === "auto_done").length;
      const commitsCount = activities.filter(a => a.type === "commit").length;
      const researchCount = activities.filter(a => a.type === "research").length;
      const notificationsCount = activities.filter(a => a.type === "notification").length;
      const approvalRequestsCount = activities.filter(a => a.type === "approval_request").length;
      
      const approvalsProcessed = activities.filter(a => 
        a.type === "approval_request" && (a.status === "approved" || a.status === "rejected")
      ).length;
      const approvalsApproved = activities.filter(a => 
        a.type === "approval_request" && a.status === "approved"
      ).length;
      const approvalsRejected = activities.filter(a => 
        a.type === "approval_request" && a.status === "rejected"
      ).length;
      
      // Source breakdown
      const sourceBreakdown = activities.reduce((acc, a) => {
        const src = a.source || "unknown";
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Generate highlights (top activities)
      const highlights = activities
        .filter(a => a.type === "task" || a.type === "commit")
        .slice(0, 5)
        .map(a => a.title);
      
      // Generate summary text
      const summary = `${activities.length} activities: ${tasksCompleted} tasks, ${commitsCount} commits, ${researchCount} research, ${notificationsCount} notifications`;
      
      // Check if summary already exists
      const existing = await ctx.db
        .query("dailySummaries")
        .withIndex("by_date", (q) => q.eq("date", date))
        .first();
      
      if (existing) {
        // Update existing summary
        await ctx.db.patch(existing._id, {
          tasksCompleted,
          commitsCount,
          researchCount,
          notificationsCount,
          approvalRequestsCount,
          approvalsProcessed,
          approvalsApproved,
          approvalsRejected,
          sourceBreakdown,
          summary,
          highlights,
          compressedAt: now,
          activitiesCompressed: activities.length,
        });
      } else {
        // Create new summary
        await ctx.db.insert("dailySummaries", {
          date,
          tasksCompleted,
          commitsCount,
          researchCount,
          notificationsCount,
          approvalRequestsCount,
          approvalsProcessed,
          approvalsApproved,
          approvalsRejected,
          sourceBreakdown,
          summary,
          highlights,
          compressedAt: now,
          activitiesCompressed: activities.length,
        });
        summariesCreated++;
      }
      
      // Delete compressed activities from archive
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
        activitiesDeleted++;
      }
    }
    
    return {
      summariesCreated,
      summariesUpdated: Object.keys(byDate).length - summariesCreated,
      activitiesDeleted,
      cutoffDate: new Date(cutoff).toISOString(),
      timestamp: new Date(now).toISOString(),
    };
  },
});

// ============================================
// CLEANUP FUNCTION
// ============================================

/**
 * Remove already compressed activities from archive
 * Use this if compress didn't clean up properly
 */
export const cleanup = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoff = now - (COMPRESS_THRESHOLD_DAYS * DAYS_TO_MS);
    
    // Get all archived activities older than compress threshold
    const oldArchived = await ctx.db
      .query("activities_archive")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();
    
    // Get all dates that have summaries
    const summaries = await ctx.db.query("dailySummaries").collect();
    const summarizedDates = new Set(summaries.map(s => s.date));
    
    // Find activities for days that already have summaries
    const toDelete = oldArchived.filter(a => {
      const date = new Date(a.timestamp).toISOString().split("T")[0];
      return summarizedDates.has(date);
    });
    
    if (args.dryRun) {
      return {
        dryRun: true,
        activitiesToDelete: toDelete.length,
        totalOldArchived: oldArchived.length,
        summarizedDates: summarizedDates.size,
      };
    }
    
    let deleted = 0;
    for (const activity of toDelete) {
      await ctx.db.delete(activity._id);
      deleted++;
    }
    
    return {
      deleted,
      timestamp: new Date(now).toISOString(),
    };
  },
});

// ============================================
// UNIFIED SEARCH (ALL TIERS)
// ============================================

/**
 * Search across all tiers
 */
export const searchAll = query({
  args: {
    query: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("task"),
      v.literal("commit"),
      v.literal("research"),
      v.literal("notification"),
      v.literal("approval_request")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query?.toLowerCase();
    
    // Get from HOT tier
    let hot = await ctx.db.query("activities").order("desc").collect();
    
    // Get from WARM tier  
    let warm = await ctx.db.query("activities_archive").order("desc").collect();
    
    // Filter by type
    if (args.type) {
      hot = hot.filter(a => a.type === args.type);
      warm = warm.filter(a => a.type === args.type);
    }
    
    // Filter by search query
    if (searchQuery) {
      hot = hot.filter(a => 
        a.title.toLowerCase().includes(searchQuery) ||
        a.description.toLowerCase().includes(searchQuery)
      );
      warm = warm.filter(a => 
        a.title.toLowerCase().includes(searchQuery) ||
        a.description.toLowerCase().includes(searchQuery)
      );
    }
    
    // Mark tier and combine
    const hotMarked = hot.map(a => ({ ...a, _tier: "hot" as const }));
    const warmMarked = warm.map(a => ({ ...a, _tier: "warm" as const }));
    
    // Sort by timestamp and limit
    const combined = [...hotMarked, ...warmMarked]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return combined;
  },
});

// ============================================
// TIER INFO
// ============================================

/**
 * Get info about all tiers
 */
export const getTierInfo = query({
  handler: async (ctx) => {
    const hot = await ctx.db.query("activities").collect();
    const warm = await ctx.db.query("activities_archive").collect();
    const cold = await ctx.db.query("dailySummaries").collect();
    
    const now = Date.now();
    const archiveThreshold = now - (ARCHIVE_THRESHOLD_DAYS * DAYS_TO_MS);
    const compressThreshold = now - (COMPRESS_THRESHOLD_DAYS * DAYS_TO_MS);
    
    // Activities ready to archive (older than 7 days)
    const readyToArchive = hot.filter(a => a.timestamp < archiveThreshold).length;
    
    // Archived ready to compress (older than 90 days)
    const readyToCompress = warm.filter(a => a.timestamp < compressThreshold).length;
    
    return {
      hot: {
        count: hot.length,
        description: "Live activities (last 7 days)",
        readyToArchive,
      },
      warm: {
        count: warm.length,
        description: "Archived activities (8-90 days)",
        readyToCompress,
      },
      cold: {
        count: cold.length,
        description: "Daily summaries (90+ days aggregated)",
        compressedDays: cold.filter(s => s.compressedAt).length,
      },
      thresholds: {
        archiveDays: ARCHIVE_THRESHOLD_DAYS,
        compressDays: COMPRESS_THRESHOLD_DAYS,
        archiveCutoff: new Date(archiveThreshold).toISOString(),
        compressCutoff: new Date(compressThreshold).toISOString(),
      },
    };
  },
});
