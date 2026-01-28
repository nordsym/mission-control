import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("commands")
      .order("desc")
      .take(limit);
  },
});

export const send = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("commands", {
      text: args.text,
      timestamp: Date.now(),
    });
    
    // In a real app, this would trigger the agent
    // For now, we'll just acknowledge the command
    setTimeout(async () => {
      // Simulated response would go here
    }, 0);
    
    return id;
  },
});

export const updateResponse = mutation({
  args: {
    id: v.id("commands"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { response: args.response });
  },
});
