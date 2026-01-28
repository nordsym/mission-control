import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    filePath: v.string(),
    url: v.optional(v.string()),
    type: v.union(
      v.literal("research"),
      v.literal("report"),
      v.literal("template")
    ),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      ...args,
      createdAt: Date.now(),
    });
    return docId;
  },
});

export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("research"),
        v.literal("report"),
        v.literal("template")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("documents")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("documents")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
