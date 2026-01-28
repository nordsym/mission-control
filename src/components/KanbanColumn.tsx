"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Doc } from "../../convex/_generated/dataModel";
import { KanbanCard } from "./KanbanCard";

type Activity = Doc<"activities">;

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: string;
  color: string;
  activities: Activity[];
}

export function KanbanColumn({ id, title, icon, color, activities }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[320px] rounded-xl border transition-all ${
        isOver ? "border-cyan bg-cyan/5" : "border-border bg-surface-2/50"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 p-3 border-b border-border`}>
        <span className="text-lg">{icon}</span>
        <h3 className={`font-semibold ${color}`}>{title}</h3>
        <span className="ml-auto text-xs text-text-muted bg-surface-2 px-2 py-0.5 rounded-full">
          {activities.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={activities.map(a => a._id)} strategy={verticalListSortingStrategy}>
          {activities.map((activity) => (
            <KanbanCard key={activity._id} activity={activity} />
          ))}
        </SortableContext>

        {activities.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            <p className="text-2xl mb-1 opacity-50">◇</p>
            <p>No items</p>
          </div>
        )}
      </div>
    </div>
  );
}
