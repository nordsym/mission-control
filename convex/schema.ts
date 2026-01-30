import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Activity types and statuses - shared across tables
const activityType = v.union(
  v.literal("task"),
  v.literal("commit"),
  v.literal("research"),
  v.literal("notification"),
  v.literal("approval_request")
);

const activityStatus = v.union(
  v.literal("auto_done"),
  v.literal("notified"),
  v.literal("pending_approval"),
  v.literal("approved"),
  v.literal("rejected")
);

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    description: v.string(),
    filePath: v.string(),
    url: v.optional(v.string()),
    type: v.union(
      v.literal("research"),
      v.literal("report"),
      v.literal("template")
    ),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"])
    .index("by_type", ["type"]),

  // HOT TIER: Live activities (last 7 days)
  activities: defineTable({
    timestamp: v.number(),
    type: activityType,
    title: v.string(),
    description: v.string(),
    status: activityStatus,
    source: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"])
    .index("by_source", ["source"]),

  // WARM TIER: Archived activities (8-90 days old)
  activities_archive: defineTable({
    timestamp: v.number(),
    type: activityType,
    title: v.string(),
    description: v.string(),
    status: activityStatus,
    source: v.optional(v.string()),
    metadata: v.optional(v.any()),
    archivedAt: v.number(), // When moved to archive
    originalId: v.optional(v.string()), // Reference to original _id
  }).index("by_timestamp", ["timestamp"])
    .index("by_archivedAt", ["archivedAt"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  approvals: defineTable({
    type: v.optional(v.union(
      v.literal("email"),
      v.literal("lead"),
      v.literal("meeting"),
      v.literal("task"),
      v.literal("other")
    )),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    activityId: v.optional(v.string()), // Reference to linked activity
    requestedAt: v.optional(v.number()),
    createdBy: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    )),
    resolvedAt: v.optional(v.number()),
    metadata: v.optional(v.object({
      priority: v.optional(v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )),
      recipient: v.optional(v.string()),
      subject: v.optional(v.string()),
      leadScore: v.optional(v.number()),
      meetingTime: v.optional(v.string()),
      editedContent: v.optional(v.string()),
    })),
  }).index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  commands: defineTable({
    text: v.string(),
    timestamp: v.number(),
    response: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"]),

  // COLD TIER: Daily summaries (90+ days, aggregated)
  dailySummaries: defineTable({
    date: v.string(), // YYYY-MM-DD
    // Activity counts by type
    tasksCompleted: v.optional(v.number()),
    commitsCount: v.optional(v.number()),
    researchCount: v.optional(v.number()),
    notificationsCount: v.optional(v.number()),
    approvalRequestsCount: v.optional(v.number()),
    // Approval stats
    approvalsProcessed: v.optional(v.number()),
    approvalsApproved: v.optional(v.number()),
    approvalsRejected: v.optional(v.number()),
    // Sources breakdown
    sourceBreakdown: v.optional(v.any()), // { "symbot": 5, "claude-code": 3 }
    // Text summary
    summary: v.optional(v.string()),
    highlights: v.optional(v.array(v.string())),
    // Compression metadata
    compressedAt: v.optional(v.number()),
    activitiesCompressed: v.optional(v.number()),
  }).index("by_date", ["date"])
    .index("by_compressedAt", ["compressedAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // ═══════════════════════════════════════════════════════════════
  // DEALS PIPELINE - Kanban-style sales tracking
  // ═══════════════════════════════════════════════════════════════
  deals: defineTable({
    title: v.string(),
    company: v.string(),
    value: v.optional(v.number()), // Deal value in SEK
    stage: v.union(
      v.literal("lead"),
      v.literal("contact_made"),
      v.literal("meeting_booked"),
      v.literal("meeting_done"),
      v.literal("proposal_sent"),
      v.literal("negotiating"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("on_hold")
    ),
    owner: v.string(), // Who has the ball
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.number()), // Unix timestamp
    notes: v.optional(v.string()),
    source: v.optional(v.union(
      v.literal("referral"),
      v.literal("inbound"),
      v.literal("outbound"),
      v.literal("tender"),
      v.literal("event"),
      v.literal("other")
    )),
    contacts: v.optional(v.array(v.object({
      name: v.string(),
      email: v.optional(v.string()),
      role: v.optional(v.string()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_stage", ["stage"])
    .index("by_owner", ["owner"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_company", ["company"]),

  dealActivities: defineTable({
    dealId: v.id("deals"),
    type: v.union(
      v.literal("email"),
      v.literal("meeting"),
      v.literal("call"),
      v.literal("note"),
      v.literal("stage_change")
    ),
    description: v.string(),
    timestamp: v.number(),
    createdBy: v.string(),
    metadata: v.optional(v.any()), // For stage changes: { from, to }
  }).index("by_dealId", ["dealId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"]),
});
