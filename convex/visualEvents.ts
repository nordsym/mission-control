import { query } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════════════
// VISUAL EVENTS API
// Dedicated event stream for Three.js visualization on NordSym.com
// ═══════════════════════════════════════════════════════════════

// Visual event types for frontend mapping
type VisualEventType = 
  | "task" 
  | "commit" 
  | "research" 
  | "notification" 
  | "approval_request"
  | "email" 
  | "meeting" 
  | "call" 
  | "note" 
  | "stage_change"
  | "deal_won" 
  | "deal_lost";

type Intensity = "low" | "medium" | "high";

interface VisualEvent {
  id: string;
  type: VisualEventType;
  timestamp: number;
  title: string;
  intensity: Intensity;
}

/**
 * Map activity type to intensity
 */
function getActivityIntensity(type: string, status?: string): Intensity {
  switch (type) {
    case "commit":
      return "high";
    case "task":
      return status === "auto_done" ? "medium" : "low";
    case "approval_request":
      return "high";
    case "research":
      return "medium";
    case "notification":
      return "low";
    default:
      return "low";
  }
}

/**
 * Map deal activity type to intensity
 */
function getDealActivityIntensity(type: string, metadata?: { from?: string; to?: string }): Intensity {
  switch (type) {
    case "meeting":
      return "high";
    case "call":
      return "medium";
    case "email":
      return "medium";
    case "stage_change":
      // Won/lost are high intensity
      if (metadata?.to === "won" || metadata?.to === "lost") {
        return "high";
      }
      return "medium";
    case "note":
      return "low";
    default:
      return "low";
  }
}

/**
 * Determine visual event type from deal activity
 */
function getDealEventType(type: string, metadata?: { from?: string; to?: string }): VisualEventType {
  if (type === "stage_change" && metadata?.to === "won") {
    return "deal_won";
  }
  if (type === "stage_change" && metadata?.to === "lost") {
    return "deal_lost";
  }
  return type as VisualEventType;
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Stream events since timestamp
 * Used for polling new events
 */
export const stream = query({
  args: {
    since: v.number(), // Unix timestamp in ms
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<VisualEvent[]> => {
    const limit = args.limit ?? 50;
    const events: VisualEvent[] = [];

    // Get activities since timestamp
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .filter((q) => q.gt(q.field("timestamp"), args.since))
      .order("desc")
      .take(limit);

    for (const activity of activities) {
      events.push({
        id: activity._id,
        type: activity.type as VisualEventType,
        timestamp: activity.timestamp,
        title: activity.title,
        intensity: getActivityIntensity(activity.type, activity.status),
      });
    }

    // Get deal activities since timestamp
    const dealActivities = await ctx.db
      .query("dealActivities")
      .withIndex("by_timestamp")
      .filter((q) => q.gt(q.field("timestamp"), args.since))
      .order("desc")
      .take(limit);

    for (const activity of dealActivities) {
      const deal = await ctx.db.get(activity.dealId);
      const metadata = activity.metadata as { from?: string; to?: string } | undefined;
      
      events.push({
        id: activity._id,
        type: getDealEventType(activity.type, metadata),
        timestamp: activity.timestamp,
        title: deal ? `${deal.company}: ${activity.description}` : activity.description,
        intensity: getDealActivityIntensity(activity.type, metadata),
      });
    }

    // Sort by timestamp descending and limit
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

/**
 * Get latest events for initial load
 * Returns most recent 10 events from both activities and deal activities
 */
export const latest = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<VisualEvent[]> => {
    const limit = args.limit ?? 10;
    const events: VisualEvent[] = [];

    // Get recent activities
    const activities = await ctx.db
      .query("activities")
      .order("desc")
      .take(limit);

    for (const activity of activities) {
      events.push({
        id: activity._id,
        type: activity.type as VisualEventType,
        timestamp: activity.timestamp,
        title: activity.title,
        intensity: getActivityIntensity(activity.type, activity.status),
      });
    }

    // Get recent deal activities
    const dealActivities = await ctx.db
      .query("dealActivities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    for (const activity of dealActivities) {
      const deal = await ctx.db.get(activity.dealId);
      const metadata = activity.metadata as { from?: string; to?: string } | undefined;
      
      events.push({
        id: activity._id,
        type: getDealEventType(activity.type, metadata),
        timestamp: activity.timestamp,
        title: deal ? `${deal.company}: ${activity.description}` : activity.description,
        intensity: getDealActivityIntensity(activity.type, metadata),
      });
    }

    // Sort by timestamp descending and take limit
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

/**
 * Get stats for idle detection
 * Returns info about activity level to determine live vs idle mode
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get most recent activity timestamp
    const latestActivity = await ctx.db
      .query("activities")
      .order("desc")
      .first();

    const latestDealActivity = await ctx.db
      .query("dealActivities")
      .withIndex("by_timestamp")
      .order("desc")
      .first();

    const latestTimestamp = Math.max(
      latestActivity?.timestamp ?? 0,
      latestDealActivity?.timestamp ?? 0
    );

    // Count events in last hour
    const activitiesLastHour = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .collect();

    const dealActivitiesLastHour = await ctx.db
      .query("dealActivities")
      .withIndex("by_timestamp")
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .collect();

    const eventsLastHour = activitiesLastHour.length + dealActivitiesLastHour.length;

    // Count events in last 24 hours
    const activitiesLastDay = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .filter((q) => q.gt(q.field("timestamp"), oneDayAgo))
      .collect();

    const dealActivitiesLastDay = await ctx.db
      .query("dealActivities")
      .withIndex("by_timestamp")
      .filter((q) => q.gt(q.field("timestamp"), oneDayAgo))
      .collect();

    const eventsLastDay = activitiesLastDay.length + dealActivitiesLastDay.length;

    // Determine status
    const minutesSinceLastEvent = latestTimestamp > 0 
      ? Math.floor((now - latestTimestamp) / (60 * 1000))
      : null;

    let status: "live" | "recent" | "idle";
    if (minutesSinceLastEvent === null) {
      status = "idle";
    } else if (minutesSinceLastEvent < 5) {
      status = "live";
    } else if (minutesSinceLastEvent < 60) {
      status = "recent";
    } else {
      status = "idle";
    }

    return {
      latestTimestamp,
      latestDate: latestTimestamp > 0 ? new Date(latestTimestamp).toISOString() : null,
      minutesSinceLastEvent,
      eventsLastHour,
      eventsLastDay,
      status,
      serverTime: now,
    };
  },
});
