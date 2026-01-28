import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

  activities: defineTable({
    timestamp: v.number(),
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
  }).index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  approvals: defineTable({
    activityId: v.id("activities"),
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.union(v.literal("approved"), v.literal("rejected"))),
    resolvedBy: v.optional(v.string()),
  }).index("by_activity", ["activityId"])
    .index("by_requested", ["requestedAt"]),

  commands: defineTable({
    text: v.string(),
    timestamp: v.number(),
    response: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"]),

  dailySummaries: defineTable({
    date: v.string(),
    tasksCompleted: v.number(),
    approvalsProcessed: v.number(),
    summary: v.string(),
  }).index("by_date", ["date"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
