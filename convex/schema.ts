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
    type: v.union(
      v.literal("email"),
      v.literal("lead"),
      v.literal("meeting"),
      v.literal("task"),
      v.literal("other")
    ),
    title: v.string(),
    content: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
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
