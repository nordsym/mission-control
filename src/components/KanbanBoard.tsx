"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

type Status = "notified" | "pending_approval" | "auto_done" | "approved" | "rejected";

const columns: { id: Status | "done"; title: string; icon: string; color: string; statuses: Status[] }[] = [
  { id: "notified", title: "In Progress", icon: "🔄", color: "text-cyan", statuses: ["notified"] },
  { id: "pending_approval", title: "Needs Approval", icon: "⏳", color: "text-orange", statuses: ["pending_approval"] },
  { id: "done", title: "Done", icon: "✅", color: "text-green", statuses: ["auto_done", "approved"] },
  { id: "rejected", title: "Rejected", icon: "❌", color: "text-red", statuses: ["rejected"] },
];

export function KanbanBoard() {
  const activities = useQuery(api.activities.list, {});
  const updateStatus = useMutation(api.activities.updateStatus);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!activities) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-cyan animate-pulse text-xl">◈ Loading board...</div>
      </div>
    );
  }

  const getActivitiesForColumn = (statuses: Status[]) => {
    return activities.filter((a) => statuses.includes(a.status as Status));
  };

  const activeActivity = activeId ? activities.find((a) => a._id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activityId = active.id as Id<"activities">;
    const targetColumnId = over.id as string;

    // Find which column was dropped on
    const targetColumn = columns.find((col) => col.id === targetColumnId);
    if (!targetColumn) return;

    // Get the primary status for this column
    const newStatus = targetColumn.statuses[0];

    // Find current activity status
    const currentActivity = activities.find((a) => a._id === activityId);
    if (!currentActivity || targetColumn.statuses.includes(currentActivity.status as Status)) {
      return; // Already in this column
    }

    // Update status in Convex
    updateStatus({ id: activityId, status: newStatus });
  };

  // Get count for each column
  const getColumnCount = (statuses: Status[]) => {
    return activities.filter((a) => statuses.includes(a.status as Status)).length;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex gap-1 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {columns.map((column, index) => {
          const count = getColumnCount(column.statuses);
          return (
            <button
              key={column.id}
              onClick={() => setActiveColumnIndex(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0
                ${activeColumnIndex === index 
                  ? "bg-cyan/10 text-cyan border border-cyan/30" 
                  : "bg-surface-2 text-text-muted border border-transparent"
                }`}
            >
              <span>{column.icon}</span>
              <span className="text-sm font-medium">{column.title}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeColumnIndex === index ? "bg-cyan/20" : "bg-surface"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: Show only active column */}
      <div className="md:hidden">
        <KanbanColumn
          id={columns[activeColumnIndex].id}
          title={columns[activeColumnIndex].title}
          icon={columns[activeColumnIndex].icon}
          color={columns[activeColumnIndex].color}
          activities={getActivitiesForColumn(columns[activeColumnIndex].statuses)}
        />
      </div>

      {/* Desktop: Show all columns */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            icon={column.icon}
            color={column.color}
            activities={getActivitiesForColumn(column.statuses)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeActivity ? <KanbanCard activity={activeActivity} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
